const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const placeholderEngine = require('./placeholder.engine');

// ============================================================
// Barangay ID card generation
// ------------------------------------------------------------
// Each barangay stores one official ID-card DOCX template
// (barangays.id_template_*). When an application is approved, the
// system renders that template exactly like DEC-011 documents —
// every {{placeholder}} is auto-filled by the master placeholder
// engine — and additionally embeds the applicant's captured photo
// through the docxtemplater Image Module. The completed card is
// stored separately (uploads/id-cards/) and linked to the
// application row (barangay_id_applications.id_card_*).
// ============================================================

const ID_CARDS_DIR = path.join(__dirname, '../../uploads/id-cards');

const ensureDir = () => {
  if (!fs.existsSync(ID_CARDS_DIR)) fs.mkdirSync(ID_CARDS_DIR, { recursive: true });
};

const getCardTemplatePath = (barangay) => {
  if (!barangay || !barangay.id_template_path) return null;
  const fullPath = path.join(__dirname, '../../uploads', barangay.id_template_path);
  return fs.existsSync(fullPath) ? fullPath : null;
};

// Extract the {{placeholder}} tags from the card template. A leading "%" or
// "%%" before a tag name is the Image module's non-centered/centered marker
// (e.g. {{%resident_photo}}), so it is stripped before engine resolution.
const scanTemplateTags = (templatePath) => {
  if (!templatePath || !templatePath.endsWith('.docx')) return [];
  let zip;
  try {
    const content = fs.readFileSync(templatePath, 'binary');
    zip = new PizZip(content);
  } catch {
    return [];
  }
  const xml = zip.file('word/document.xml')?.asText() || '';
  const matches = xml.match(/\{\{([^}]+)\}\}/g) || [];
  const tags = matches
    .map((m) => m.replace(/^\{\{/, '').replace(/\}\}$/, '').trim())
    .map((t) => t.replace(/^%+/, '').trim())
    .filter(Boolean);
  return [...new Set(tags)];
};

// Resolve an embedded image (relative upload path, or data URI) to a Buffer.
const resolveImageBuffer = (tagValue) => {
  if (!tagValue || typeof tagValue !== 'string') return null;
  if (/^data:image\//i.test(tagValue)) {
    try {
      const base64 = tagValue.replace(/^data:image\/\w+;base64,/, '');
      return Buffer.from(base64, 'base64');
    } catch {
      return null;
    }
  }
  const fullPath = path.join(__dirname, '../../uploads', tagValue);
  if (!fs.existsSync(fullPath)) return null;
  try {
    return fs.readFileSync(fullPath);
  } catch {
    return null;
  }
};

// Read pixel dimensions from a PNG/JPEG header (with a safe fallback). Keeps
// the embedded photo at its natural aspect instead of a default square.
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

// Guess a safe media extension from the image magic bytes.
const sniffImageExtension = (buffer) => {
  if (buffer && buffer[0] === 0x89 && buffer[1] === 0x50) return 'png';
  if (buffer && buffer[0] === 0xff && buffer[1] === 0xd8) return 'jpg';
  return 'png';
};

const PX_TO_EMU = 9525; // 1 pixel = 9525 EMUs

// Placeholder substituted for the photo tag during the text render, then swapped
// for the real embedded drawing afterwards. Keeps docxtemplater (which has no
// native image support in its free core) focused on pure text substitution.
const PHOTO_TOKEN = 'IMSPHOTOTOKEN2024';

// Build the DrawingML XML that embeds image rId at a size (in EMUs).
const buildDrawingXml = ({ rId, emuW, emuH, centered }) => {
  const graphic =
    '<w:drawing xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"' +
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
  if (!centered) {
    return '<w:r>' + graphic + '</w:r>';
  }
  return '<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r>' + graphic + '</w:r></w:p>';
};

// Embed a photo into the rendered DOCX zip. Returns true on success.
const embedPhoto = (doc, imageBuffer, centered) => {
  if (!imageBuffer) return false;
  const zip = doc.getZip();
  const docXmlPath = 'word/document.xml';
  const docXml = zip.file(docXmlPath)?.asText();
  if (!docXml || !docXml.includes(PHOTO_TOKEN)) return false;

  // 1. Copy the image bytes into the zip as a media part.
  const ext = sniffImageExtension(imageBuffer);
  const used = [];
  zip.file(/word\/media\//).forEach((f) => used.push(f.name));
  const mediaName = 'word/media/image' + (used.length + 1) + '.' + ext;
  zip.file(mediaName, imageBuffer);

  // 2. Register the media part in the document's relationship file.
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
      ' Target="media/' + mediaName.replace(/^word\//, '') + '"/></Relationships>');
  zip.file(relsPath, relsXml);

  // 3. Keep [Content_Types].xml aware so Word opens the file cleanly.
  const ctPath = '[Content_Types].xml';
  const ctXml = zip.file(ctPath)?.asText();
  if (ctXml && ext && !ctXml.includes('Extension="' + ext + '"')) {
    const mimeByExt = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg' };
    const ct = (mimeByExt[ext] || 'image/png');
    zip.file(ctPath, ctXml.replace('</Types>', '<Default Extension="' + ext + '" ContentType="' + ct + '"/></Types>'));
  }

  // 4. Replace the token's enclosing run with the drawing.
  const size = getImageSize(imageBuffer);
  const maxEmu = 480 * PX_TO_EMU; // cap longer side ~480px to keep cards compact
  const scale = Math.min(1, maxEmu / (Math.max(size.width, size.height) * PX_TO_EMU));
  const emuW = Math.round(size.width * PX_TO_EMU * scale);
  const emuH = Math.round(size.height * PX_TO_EMU * scale);
  const drawing = buildDrawingXml({ rId, emuW, emuH, centered });
  // Match the whole <w:r> that holds a <w:t> containing the token (a run may
  // carry optional run properties before the text).
  const runRegex = new RegExp(
    '<w:r\\b[^>]*>(?:(?!<\\/w:r>)[\\s\\S])*?<w:t[^>]*>\\s*' + PHOTO_TOKEN + '\\s*<\\/w:t>(?:(?!<\\/w:r>)[\\s\\S])*?<\\/w:r>',
    'g'
  );
  const newDocXml = docXml.replace(runRegex, drawing);
  if (newDocXml === docXml) return false;
  zip.file(docXmlPath, newDocXml);
  return true;
};

// Build the placeholder context for an approved application. The application
// row fields (name, birth date, address, etc.) become the application context
// and, via the built resident, let every {{placeholder}} resolve normally.
const buildContext = async ({ application, resident, barangay, processedBy }) => {
  const parseFormData = (raw) => {
    if (!raw) return {};
    if (typeof raw === 'object') return raw;
    try { return JSON.parse(raw); } catch { return {}; }
  };
  const formData = parseFormData(application.form_data);
  const appContext = {
    ...(formData || {}),
    first_name: application.first_name,
    middle_name: application.middle_name,
    last_name: application.last_name,
    suffix: application.suffix,
    birth_date: application.birth_date,
    gender: application.gender,
    civil_status: application.civil_status,
    occupation: application.occupation,
    blood_type: application.blood_type,
    address_line: application.address_line,
    contact_number: application.contact_number,
    email: application.email,
    id_number: application.id_number,
    id_expiration: application.id_expiration_date
  };
  return placeholderEngine.buildContext({
    request: { form_data: appContext },
    resident: resident || {},
    barangay: barangay || {},
    processedBy: processedBy || ''
  });
};

// Resolve an application object built from the kiosk's camelCase form payload
// (used by the live preview, before the application row exists).
const applicationFromKioskPayload = (payload) => {
  const formData = payload.formData || {};
  return {
    application_number: 'PREVIEW',
    first_name: payload.firstName,
    middle_name: payload.middleName,
    last_name: payload.lastName,
    suffix: payload.suffix,
    birth_date: payload.birthDate,
    gender: payload.gender,
    civil_status: payload.civilStatus,
    occupation: payload.occupation,
    blood_type: payload.bloodType,
    address_line: payload.addressLine,
    contact_number: payload.contactNumber,
    email: payload.email,
    emergency_contact_name: payload.emergencyContactName,
    emergency_contact_number: payload.emergencyContactNumber,
    photo: payload.photo,
    signature: payload.signature,
    id_number: null,
    id_expiration_date: null,
    form_data: Object.keys(formData).length ? { ...formData } : JSON.stringify(formData)
  };
};

// Render the barangay's ID card template and return the DOCX buffer. No file is
// written to disk, so both the persisted card generation and the kiosk's live
// preview can share the exact same rendering pipeline.
const renderCardBuffer = async ({ application, resident, barangay, processedBy }) => {
  const templatePath = getCardTemplatePath(barangay);
  if (!templatePath) {
    return { success: false, message: 'No official ID card template is configured for this barangay. Upload one in Settings.' };
  }
  if (!templatePath.endsWith('.docx')) {
    return { success: false, message: 'The ID card template must be a .docx file.' };
  }

  const templateTags = scanTemplateTags(templatePath);
  if (templateTags.length === 0) {
    return {
      success: false,
      message: 'The ID card template contains no {{placeholder}} tags (e.g. {{full_name}}, {{id_number}}). ' +
        'Update the template, then try generating again.'
    };
  }

  const context = await buildContext({ application, resident, barangay, processedBy });
  const applied = placeholderEngine.apply({ templateTags, service: null, context });
  const data = applied.data;

  // The photo is injected post-render (see embedPhoto), so the placeholder value
  // used during the text pass is just a unique token we can find afterwards.
  data.resident_photo = PHOTO_TOKEN;

  let renderedBuffer;
  try {
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);

    // Normalize the legacy image-module markers ({{%tag}} / {{%%tag}}) for the
    // photo placeholder so the free docxtemplater core treats it as plain text:
    // {{resident_photo}} then resolves to the token, which embedPhoto() swaps for
    // the real drawing.
    const normalizedXml = (zip.file('word/document.xml')?.asText() || '')
      .replace(/{{%%?resident_photo}}/g, '{{resident_photo}}');
    if (normalizedXml) zip.file('word/document.xml', normalizedXml);

    // docxtemplater's free core renders text only. The token text takes the place
    // of the photo; the real <w:drawing> (with a media part, relationship and
    // content-type entry) is produced by embedPhoto() after the text render.
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: '{{', end: '}}' },
      nullGetter: () => ''
    });
    doc.render(data);

    // If the template actually has a {{resident_photo}} tag, embed the captured
    // photo right where the token sat. Templates without the photo tag render
    // fine as plain text.
    const photoBuffer = resolveImageBuffer(application.photo);
    embedPhoto(doc, photoBuffer, true);

    renderedBuffer = doc.getZip().generate({
      type: 'nodebuffer',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });
  } catch (error) {
    return { success: false, message: `Failed to render the ID card template: ${error.message}` };
  }

  return {
    success: true,
    message: 'Barangay ID card rendered successfully.',
    buffer: renderedBuffer,
    applied
  };
};

// Render and persist the completed card for an approved application.
const generateIdCard = async ({ application, resident, barangay, processedBy }) => {
  const rendered = await renderCardBuffer({ application, resident, barangay, processedBy });
  if (!rendered.success) return rendered;

  ensureDir();
  const fileName = `APP-${application.application_number}_${Date.now()}.docx`;
  const filePath = `id-cards/${fileName}`;
  fs.writeFileSync(path.join(ID_CARDS_DIR, fileName), rendered.buffer);

  return {
    success: true,
    message: 'Barangay ID card generated successfully.',
    data: {
      filePath,
      mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size: rendered.buffer.length,
      unknown: rendered.applied.unknown || []
    }
  };
};

module.exports = {
  generateIdCard,
  renderCardBuffer,
  applicationFromKioskPayload,
  scanTemplateTags,
  getImageSize
};