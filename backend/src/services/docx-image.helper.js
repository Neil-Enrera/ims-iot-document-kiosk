const fs = require('fs');
const path = require('path');

const PHOTO_TOKEN = 'IMSPHOTOTOKEN2024';
const PX_TO_EMU = 9525; // 1 pixel = 9525 EMUs

/**
 * Resolve an embedded image source (data URI, upload relative path, or absolute path) to a Buffer.
 */
const resolveImageBuffer = (imageSource) => {
  if (!imageSource) return null;
  if (Buffer.isBuffer(imageSource)) return imageSource;
  if (typeof imageSource !== 'string') return null;

  const trimmed = imageSource.trim();
  if (!trimmed) return null;

  // 1. Base64 Data URI
  if (/^data:image\//i.test(trimmed)) {
    try {
      const base64 = trimmed.replace(/^data:image\/\w+;base64,/, '');
      return Buffer.from(base64, 'base64');
    } catch {
      return null;
    }
  }

  // 2. Local File System Paths
  const cleanPath = trimmed.replace(/^[/\\]+/, '').replace(/^uploads[/\\]+/, '');
  const candidatePaths = [
    trimmed, // Raw (could be absolute path)
    path.join(__dirname, '../../uploads', cleanPath),
    path.join(__dirname, '../../uploads', trimmed),
    path.join(__dirname, '../../', trimmed)
  ];

  for (const fullPath of candidatePaths) {
    try {
      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
        return fs.readFileSync(fullPath);
      }
    } catch {
      // Continue to next candidate
    }
  }

  return null;
};

/**
 * Read pixel dimensions from a PNG/JPEG header (with safe fallback).
 */
const getImageSize = (buffer) => {
  const DEFAULT = { width: 200, height: 240 };
  if (!buffer || buffer.length < 24) return DEFAULT;

  // PNG: width/height at IHDR offset 16/20.
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }

  // JPEG: scan SOF markers for dimensions.
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    let offset = 2;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) { offset += 1; continue; }
      const marker = buffer[offset + 1];
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { width: buffer.readUInt16BE(offset + 7), height: buffer.readUInt16BE(offset + 5) };
      }
      const len = buffer.readUInt16BE(offset + 2);
      offset += 2 + len;
    }
    return DEFAULT;
  }

  return DEFAULT;
};

/**
 * Guess a safe media extension from image magic bytes.
 */
const sniffImageExtension = (buffer) => {
  if (buffer && buffer[0] === 0x89 && buffer[1] === 0x50) return 'png';
  if (buffer && buffer[0] === 0xff && buffer[1] === 0xd8) return 'jpg';
  return 'png';
};

/**
 * Build DrawingML XML that embeds image rId at a calculated size (in EMUs).
 */
const buildDrawingXml = ({ rId, emuW, emuH }) => {
  return '<w:drawing xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"' +
    ' xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"' +
    ' xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"' +
    ' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    ' <wp:inline distT="0" distB="0" distL="0" distR="0">' +
    ' <wp:extent cx="' + emuW + '" cy="' + emuH + '"/>' +
    ' <wp:effectExtent l="0" t="0" r="0" b="0"/>' +
    ' <wp:docPr id="1" name="resident_photo"/>' +
    ' <wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr>' +
    ' <a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">' +
    ' <pic:pic><pic:nvPicPr><pic:cNvPr id="2" name="resident_photo"/><pic:cNvPicPr/></pic:nvPicPr>' +
    ' <pic:blipFill><a:blip r:embed="' + rId + '"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>' +
    ' <pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="' + emuW + '" cy="' + emuH + '"/></a:xfrm>' +
    ' <a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic>' +
    ' </a:graphicData></a:graphic></wp:inline></w:drawing>';
};

/**
 * Embed a photo buffer into the rendered DOCX zip where PHOTO_TOKEN is located.
 * Returns true on success.
 */
const embedPhoto = (doc, imageBuffer, maxPhotoPx = 300) => {
  if (!imageBuffer) return false;
  const zip = doc.getZip();
  const docXmlPath = 'word/document.xml';
  const docXml = zip.file(docXmlPath)?.asText();
  if (!docXml || !docXml.includes(PHOTO_TOKEN)) return false;

  // 1. Copy image bytes into the zip as a media part
  const ext = sniffImageExtension(imageBuffer);
  const used = [];
  zip.file(/word\/media\//).forEach((f) => used.push(f.name));
  const mediaName = 'word/media/image' + (used.length + 1) + '.' + ext;
  zip.file(mediaName, imageBuffer);

  // 2. Register media part in relationships file
  const relsPath = 'word/_rels/document.xml.rels';
  let relsXml = zip.file(relsPath)?.asText() || '';
  const nextRid = (relsXml.match(/Id="rId\d+"/g) || []).length + 1;
  const rId = 'rId' + nextRid;
  if (!relsXml) {
    relsXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>';
  }
  relsXml = relsXml.replace('</Relationships>',
    '<Relationship Id="' + rId + '"' +
      ' Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image"' +
      ' Target="' + mediaName.replace(/^word\//, '') + '"/></Relationships>');
  zip.file(relsPath, relsXml);

  // 3. Keep [Content_Types].xml aware so Word opens cleanly
  const ctPath = '[Content_Types].xml';
  const ctXml = zip.file(ctPath)?.asText();
  if (ctXml && ext && !ctXml.includes('Extension="' + ext + '"')) {
    const mimeByExt = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg' };
    const ct = (mimeByExt[ext] || 'image/png');
    zip.file(ctPath, ctXml.replace('</Types>', '<Default Extension="' + ext + '" ContentType="' + ct + '"/></Types>'));
  }

  // 4. Swap token for drawing XML
  const size = getImageSize(imageBuffer);
  const maxEmu = (maxPhotoPx || 300) * PX_TO_EMU;
  const scale = Math.min(1, maxEmu / (Math.max(size.width, size.height) * PX_TO_EMU));
  const emuW = Math.round(size.width * PX_TO_EMU * scale);
  const emuH = Math.round(size.height * PX_TO_EMU * scale);
  const drawing = buildDrawingXml({ rId, emuW, emuH });
  const tokenText = new RegExp('<w:t\\b[^>]*>\\s*' + PHOTO_TOKEN + '\\s*<\\/w:t>');
  const newDocXml = docXml.replace(tokenText, drawing);
  if (newDocXml === docXml) return false;
  zip.file(docXmlPath, newDocXml);
  return true;
};

/**
 * Extract the best photo candidate for a request / resident combination.
 */
const extractRequestPhoto = (request = {}, resident = null) => {
  const formData = typeof request.form_data === 'string'
    ? (() => { try { return JSON.parse(request.form_data); } catch { return {}; } })()
    : (request.form_data || {});

  const source = request.source || formData._source || (formData._requirements ? 'Online' : 'Kiosk');

  // 1. If application is from Kiosk, prioritize Kiosk/ESP32-CAM photo capture
  if (source === 'Kiosk') {
    if (request.photo && typeof request.photo === 'string') return request.photo;
    if (formData.photo && typeof formData.photo === 'string') return formData.photo;
    if (formData._photo && typeof formData._photo === 'string') return formData._photo;
    if (formData._photo_path && typeof formData._photo_path === 'string') return formData._photo_path;

    if (request.request_id) {
      const photoDir = path.join(__dirname, '../../uploads/kiosk-photos');
      if (fs.existsSync(photoDir)) {
        try {
          const files = fs.readdirSync(photoDir);
          const match = files.find(f => {
            if (!f.startsWith(`request_${request.request_id}_`)) return false;
            try {
              const stat = fs.statSync(path.join(photoDir, f));
              return stat.size > 500;
            } catch {
              return false;
            }
          });
          if (match) return `kiosk-photos/${match}`;
        } catch {
          // Continue
        }
      }
    }
  }

  // 2. Direct photo on request / form_data
  if (request.photo && typeof request.photo === 'string') return request.photo;
  if (formData.photo && typeof formData.photo === 'string') return formData.photo;
  if (formData._photo && typeof formData._photo === 'string') return formData._photo;
  if (formData._photo_path && typeof formData._photo_path === 'string') return formData._photo_path;

  // 3. Online Portal 2x2 ID Photo upload in _requirements
  const reqs = Array.isArray(formData._requirements) ? formData._requirements
    : (Array.isArray(formData._uploaded_requirements) ? formData._uploaded_requirements
    : (Array.isArray(formData._uploaded_files) ? formData._uploaded_files
    : (Array.isArray(formData.requirements) ? formData.requirements
    : (Array.isArray(request.requirements) ? request.requirements : []))));
  for (const r of reqs) {
    if (!r) continue;
    const filePath = r.file_path || r.file_url || r.filePath || r.fileUrl || (r.file_name ? `resident-photos/${r.file_name}` : null);
    if (!filePath) continue;
    const name = String(r.requirement_name || '').toLowerCase();
    if (name.includes('2x2') || name.includes('photo') || name.includes('picture') || name.includes('portrait')) {
      return filePath;
    }
  }

  // 4. Check for image files in resident-photos / kiosk-photos folder
  for (const r of reqs) {
    if (!r) continue;
    const filePath = r.file_path || r.file_url || r.filePath || r.fileUrl || (r.file_name ? `resident-photos/${r.file_name}` : null);
    if (!filePath) continue;
    const pathStr = String(filePath || '').toLowerCase();
    if (pathStr.includes('resident-photos') || pathStr.includes('kiosk-photos')) {
      return filePath;
    }
  }

  // 5. Any requirement with an image file path as fallback
  for (const r of reqs) {
    if (!r) continue;
    const filePath = r.file_path || r.file_url || r.filePath || r.fileUrl || (r.file_name ? `resident-photos/${r.file_name}` : null);
    if (filePath && /\.(png|jpe?g)$/i.test(filePath)) {
      return filePath;
    }
  }

  // 6. Kiosk-saved photo fallback by request_id (must be valid image > 500 bytes)
  if (request.request_id) {
    const photoDir = path.join(__dirname, '../../uploads/kiosk-photos');
    if (fs.existsSync(photoDir)) {
      try {
        const files = fs.readdirSync(photoDir);
        const match = files.find(f => {
          if (!f.startsWith(`request_${request.request_id}_`)) return false;
          try {
            const stat = fs.statSync(path.join(photoDir, f));
            return stat.size > 500;
          } catch {
            return false;
          }
        });
        if (match) return `kiosk-photos/${match}`;
      } catch {
        // Continue
      }
    }
  }

  // 7. Fallback to resident's existing master profile photo
  if (resident && resident.photo) return resident.photo;

  return null;
};

module.exports = {
  PHOTO_TOKEN,
  PX_TO_EMU,
  resolveImageBuffer,
  getImageSize,
  sniffImageExtension,
  buildDrawingXml,
  embedPhoto,
  extractRequestPhoto
};
