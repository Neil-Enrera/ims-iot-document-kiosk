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

const getCardTemplatePath = async (barangay) => {
  // 1. Fallback to passed barangay for test compat
  if (barangay && barangay.id_template_path) {
    const fullPath = path.join(__dirname, '../../uploads', barangay.id_template_path);
    if (fs.existsSync(fullPath)) return fullPath;
  }
  // 2. Load from the services table for Barangay ID
  const db = require('../config/database');
  try {
    const [rows] = await db.query('SELECT template_path FROM services WHERE service_name = ? LIMIT 1', ['Barangay ID']);
    const service = rows[0];
    if (service && service.template_path) {
      const fullPath = path.join(__dirname, '../../uploads', service.template_path);
      if (fs.existsSync(fullPath)) return fullPath;
    }
  } catch (err) {
    console.error('Failed to query Barangay ID template path from database:', err);
  }
  return null;
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

const docxImageHelper = require('./docx-image.helper');

const resolveImageBuffer = docxImageHelper.resolveImageBuffer;
const getImageSize = docxImageHelper.getImageSize;
const sniffImageExtension = docxImageHelper.sniffImageExtension;
const buildDrawingXml = docxImageHelper.buildDrawingXml;
const embedPhoto = docxImageHelper.embedPhoto;
const PHOTO_TOKEN = docxImageHelper.PHOTO_TOKEN;


// Build the placeholder context for an approved application. The application
// row fields (name, birth date, address, etc.) become the application context
// and, via the built resident, let every {{placeholder}} resolve normally.
// When no resident record exists yet (draft preview before approval), the
// application's submitted fields are synthesized into the resident context so
// resident-based placeholders ({{full_name}}, {{address}}, {{sex}}, ...) still
// render the applicant's own information on the preview card.
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
    birth_place: application.birth_place || application.place_of_birth || application.birthPlace || application.placeOfBirth,
    gender: application.gender,
    civil_status: application.civil_status,
    occupation: application.occupation,
    blood_type: application.blood_type,
    address_line: application.address_line,
    contact_number: application.contact_number,
    email: application.email,
    id_number: application.id_number,
    id_expiration: application.id_expiration_date,
    expiration_date: application.id_expiration_date,
    account_id: application.account_id || ''
  };
  // A real resident record wins; otherwise fall back to the application fields.
  const residentContext = {
    first_name: application.first_name,
    middle_name: application.middle_name,
    last_name: application.last_name,
    suffix: application.suffix,
    birth_date: application.birth_date,
    birth_place: application.birth_place || application.place_of_birth || application.birthPlace || application.placeOfBirth,
    gender: application.gender,
    civil_status: application.civil_status,
    occupation: application.occupation,
    blood_type: application.blood_type,
    address_line: application.address_line,
    contact_number: application.contact_number,
    email: application.email,
    ...(resident || {})
  };
  return placeholderEngine.buildContext({
    request: { form_data: appContext },
    resident: residentContext,
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
    birth_place: payload.birthPlace || payload.placeOfBirth || payload.birth_place || payload.place_of_birth,
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
  const templatePath = await getCardTemplatePath(barangay);
  if (!templatePath) {
    return { success: false, message: 'No official ID card template is configured. Upload one in Barangay ID Apps.' };
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

  // Query the 'Barangay ID' service to fetch custom placeholder mappings
  let service = null;
  const db = require('../config/database');
  try {
    const [services] = await db.query('SELECT * FROM services WHERE service_name = ? LIMIT 1', ['Barangay ID']);
    service = services[0] || null;
  } catch (err) {
    console.error('Failed to load Barangay ID service from database:', err);
  }

  const applied = placeholderEngine.apply({ templateTags, service, context });
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
    // fine as plain text. ~300px fits the standard 2×2 ID photo box while
    // keeping the generated card compact in both preview and approved cards.
    const photoBuffer = resolveImageBuffer(application.photo);
    embedPhoto(doc, photoBuffer, 300);

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