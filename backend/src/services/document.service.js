const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const pool = require('../config/database');
const documentRepository = require('../repositories/document.repository');

// ============================================================
// Placeholder resolution
// ============================================================

const RESIDENT_FIELD_ALIASES = {
  full_name: 'full_name',
  first_name: 'first_name',
  middle_name: 'middle_name',
  last_name: 'last_name',
  suffix: 'suffix',
  birth_date: 'birth_date',
  birthdate: 'birth_date',
  sex: 'gender',
  gender: 'gender',
  civil_status: 'civil_status',
  address: 'address_line',
  address_line: 'address_line',
  contact_number: 'contact_number',
  contact: 'contact_number',
  email: 'email',
  resident_code: 'resident_code',
  blood_type: 'blood_type',
  emergency_contact_name: 'emergency_contact_name',
  emergency_contact_number: 'emergency_contact_number'
};

const SYSTEM_FIELD_ALIASES = {
  request_number: 'request_number',
  current_date: 'current_date',
  date_issued: 'current_date',
  issued_date: 'current_date',
  barangay_name: 'barangay_name',
  barangay: 'barangay_name',
  city_name: 'city_name',
  city: 'city_name',
  processed_by: 'processed_by'
};

// Merge resident record with guest fallback data into a flat lookup object.
const buildResidentLookup = (request, resident) => {
  if (resident) {
    const fullName = [resident.first_name, resident.middle_name, resident.last_name, resident.suffix]
      .filter(Boolean)
      .join(' ')
      .trim();
    return {
      full_name: fullName,
      first_name: resident.first_name || '',
      middle_name: resident.middle_name || '',
      last_name: resident.last_name || '',
      suffix: resident.suffix || '',
      birth_date: resident.birth_date ? formatDate(resident.birth_date) : '',
      gender: resident.gender || '',
      civil_status: resident.civil_status || '',
      address_line: resident.address_line || '',
      contact_number: resident.contact_number || '',
      email: resident.email || '',
      resident_code: resident.resident_code || '',
      blood_type: resident.blood_type || '',
      emergency_contact_name: resident.emergency_contact_name || '',
      emergency_contact_number: resident.emergency_contact_number || ''
    };
  }

  // Guest fallback: basic identity info lives in form_data._guest
  const guest = request.form_data?._guest || {};
  return {
    full_name: guest.full_name || '',
    first_name: guest.full_name || '',
    middle_name: guest.middle_name || '',
    last_name: '',
    suffix: '',
    birth_date: guest.birth_date ? formatDate(guest.birth_date) : '',
    gender: '',
    civil_status: '',
    address_line: guest.address || '',
    contact_number: guest.contact_number || '',
    email: guest.email || '',
    resident_code: 'GUEST',
    blood_type: '',
    emergency_contact_name: '',
    emergency_contact_number: ''
  };
};

const buildSystemLookup = ({ request, barangay, processedBy }) => {
  const today = new Date();
  return {
    request_number: request.request_number || '',
    current_date: formatDate(today),
    barangay_name: barangay?.barangay_name || '',
    city_name: barangay?.city || '',
    processed_by: processedBy || ''
  };
};

// Resolve a single mapping entry to a string value.
const resolveMapping = ({ mapping, lookup }) => {
  const field = mapping.field || mapping.placeholder;
  let value = '';

  if (mapping.source === 'resident') {
    const key = RESIDENT_FIELD_ALIASES[field] || field;
    value = lookup.resident[key] ?? '';
  } else if (mapping.source === 'application') {
    value = lookup.application[field] ?? '';
  } else if (mapping.source === 'system') {
    const key = SYSTEM_FIELD_ALIASES[field] || field;
    value = lookup.system[key] ?? '';
  }

  return stringifyValue(value);
};

const stringifyValue = (value) => {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

// Friendly date like "August 5, 2026"
const formatDate = (input) => {
  if (!input) return '';
  const date = new Date(input);
  if (isNaN(date.getTime())) return String(input);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

// ============================================================
// Document generation
// ============================================================

const GENERATED_DIR = path.join(__dirname, '../../uploads/generated-documents');

const ensureGeneratedDir = () => {
  if (!fs.existsSync(GENERATED_DIR)) fs.mkdirSync(GENERATED_DIR, { recursive: true });
};

const loadTemplatePath = (service) => {
  if (!service.template_path) return null;
  const templatePath = path.join(__dirname, '../../uploads', service.template_path);
  return fs.existsSync(templatePath) ? templatePath : null;
};

// Normalize a placeholder reference to its bare tag name. The admin may store
// mappings as "name", "{{name}}" or "  name  " — the lexer parses the bare tag,
// so every lookup key must be normalized the same way to actually match.
const normalizeTag = (tag) => String(tag || '')
  .trim()
  .replace(/^\{\{/, '')
  .replace(/\}\}$/, '');

// Extract {{placeholder}} tags from a DOCX template using docxtemplater's lexer.
// Returns bare tag names (without the {{ }} delimiters), deduplicated. Never
// throws: a missing/invalid/non-DOCX template simply yields an empty array so
// callers can surface a helpful message instead of a 500.
const scanTemplatePlaceholders = (service) => {
  const templatePath = loadTemplatePath(service);
  if (!templatePath || !templatePath.endsWith('.docx')) return [];

  let content;
  let zip;
  try {
    content = fs.readFileSync(templatePath, 'binary');
    zip = new PizZip(content);
  } catch {
    return [];
  }

  let tags;
  try {
    const doc = new Docxtemplater(zip, { delimiters: { start: '{{', end: '}}' } });
    tags = collectTemplateTags(doc);
  } catch {
    // getTags can fail on modules or unusual documents; fall back to a regex
    // over the raw xml.
    tags = fallbackScanTemplatePlaceholders(zip);
  }
  return [...new Set(tags.map(normalizeTag).filter(Boolean))];
};

// docxtemplater's getTags() returns { headers, footers, document, ... }
// where each part is { target, tags: { placeholder: {} } }. Flatten to a
// unique list of placeholder names.
const collectTemplateTags = (doc) => {
  const raw = doc.getTags ? doc.getTags() : {};
  const tags = new Set();
  const collect = (part) => {
    if (!part || typeof part !== 'object') return;
    if (part.tags && typeof part.tags === 'object') {
      Object.keys(part.tags).forEach(tag => tags.add(tag));
    }
  };
  Object.values(raw).forEach(collect);
  return [...tags];
};

const fallbackScanTemplatePlaceholders = (zip) => {
  try {
    const xml = zip.file('word/document.xml')?.asText() || '';
    const matches = xml.match(/\{\{([^}]+)\}\}/g) || [];
    const tags = matches.map(m => m.replace(/^\{\{/, '').replace(/\}\}$/, '').trim());
    return [...new Set(tags)];
  } catch {
    return [];
  }
};

// Generate the completed official document for a request.
// Returns { generated: [{ documentId, fileName, filePath, fileType }] }
const generateDocument = async ({ requestId, userId }) => {
  const [requestRows] = await pool.query(
    `SELECT rq.*, rs.status_name
     FROM requests rq
     JOIN request_statuses rs ON rq.status_id = rs.status_id
     WHERE rq.request_id = ?`,
    [requestId]
  );
  const request = requestRows[0];
  if (!request) {
    return { success: false, message: 'Request not found.' };
  }
  request.form_data = parseJson(request.form_data) || {};

  const service = await loadServiceWithMappings(request.service_id);
  if (!service) {
    return { success: false, message: 'Service not found.' };
  }

  if (!service.template_path) {
    return { success: false, message: 'This service has no uploaded document template.' };
  }

  const templatePath = loadTemplatePath(service);
  if (!templatePath) {
    return { success: false, message: 'The document template file is missing on the server.' };
  }
  if (!templatePath.endsWith('.docx')) {
    return { success: false, message: 'Automatic document generation requires a DOCX template. The uploaded template is not a .docx file.' };
  }

  const mappings = Array.isArray(service.document_mappings) ? service.document_mappings : [];
  if (mappings.length === 0) {
    return { success: false, message: 'This service has no placeholder mappings configured.' };
  }

  // Refuse to produce an official document that would be blank. docxtemplater only
  // replaces {{double_braced}} tags; a template without any (e.g. one using
  // underscores) renders identically with zero resident data. Failing here with a
  // clear message is far safer than silently writing an empty official document.
  const templateTags = scanTemplatePlaceholders(service);
  if (templateTags.length === 0) {
    return {
      success: false,
      message: 'The uploaded template contains no {{placeholder}} tags (e.g. {{full_name}}, {{address}}). ' +
        'Automatic fill-in only works when the DOCX uses placeholders typed inside double curly braces. ' +
        'Update the template, then try generating again.'
    };
  }

  // Validate placeholders: tags found in the template vs. configured mappings.
  // Any tag without a mapping would render blank, so surface it as a warning.
  const warnings = validatePlaceholderMappings(service, mappings);

  // Gather lookup data
  const resident = request.resident_id ? await findResident(request.resident_id) : null;
  const barangay = await findBarangay(resident?.barangay_id);
  const processedBy = await findUserName(userId);

  const lookup = {
    resident: buildResidentLookup(request, resident),
    application: request.form_data || {},
    system: buildSystemLookup({ request, barangay, processedBy })
  };

  const data = {};
  for (const mapping of mappings) {
    data[normalizeTag(mapping.placeholder)] = resolveMapping({ mapping, lookup });
  }

  // Render the template
  let renderedBuffer;
  try {
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: '{{', end: '}}' },
      nullGetter: () => ''
    });
    doc.render(data);
    renderedBuffer = doc.getZip().generate({
      type: 'nodebuffer',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });
  } catch (error) {
    return { success: false, message: `Failed to render document template: ${error.message}` };
  }

  ensureGeneratedDir();
  const baseName = `${request.request_number}_${Date.now()}`;
  const docxName = `${baseName}.docx`;
  const docxPath = `generated-documents/${docxName}`;
  fs.writeFileSync(path.join(GENERATED_DIR, docxName), renderedBuffer);

  const generated = [{
    documentId: null,
    fileName: docxName,
    filePath: docxPath,
    fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    fileSize: renderedBuffer.length
  }];

  // Optionally convert to PDF if LibreOffice is available
  const pdf = await tryConvertToPdf(path.join(GENERATED_DIR, docxName));
  if (pdf) {
    generated.push(pdf);
  }

  for (const doc of generated) {
    const documentId = await documentRepository.create({
      requestId,
      serviceId: request.service_id,
      fileName: doc.fileName,
      filePath: doc.filePath,
      fileType: doc.fileType,
      fileSize: doc.fileSize,
      generatedBy: userId,
      generationWarnings: warnings
    });
    doc.documentId = documentId;
  }

  return { success: true, message: 'Document generated successfully.', data: { generated, requestNumber: request.request_number, warnings } };
};

// Compare the placeholders found in the uploaded template with the configured
// mappings, and warn about tags that would render blank. Also flags mappings
// pointing to application fields that were not captured on the request form.
const validatePlaceholderMappings = (service, mappings) => {
  const warnings = [];
  const templateTags = scanTemplatePlaceholders(service);
  if (!templateTags.length) {
    warnings.push('No {{placeholder}} tags detected in the template (e.g. {{full_name}}, {{address}}). The DOCX must use {{double_braces}} placeholders instead of blank lines/underscores for automatic fill-in to work.');
    return warnings;
  }

  const mapped = new Set(mappings.map(m => normalizeTag(m.placeholder)));
  const unmapped = templateTags.filter(tag => !mapped.has(tag));
  if (unmapped.length) {
    warnings.push(`Placeholders without a mapping (will render blank): ${unmapped.map(t => `{{${t}}}`).join(', ')}`);
  }

  const appFields = new Set((Array.isArray(service.form_fields) ? service.form_fields : []).map(f => f.key));
  const orphanAppMappings = mappings.filter(m => m.source === 'application' && !appFields.has(m.field));
  if (orphanAppMappings.length) {
    warnings.push(`Application mappings reference form fields not collected on the form: ${orphanAppMappings.map(m => m.field).join(', ')}`);
  }

  return warnings;
};

const tryConvertToPdf = async (docxPath) => {
  const soffice = findLibreOffice();
  if (!soffice) return null;

  return new Promise((resolve) => {
    const outDir = path.dirname(docxPath);
    execFile(
      soffice,
      ['--headless', '--convert-to', 'pdf', '--outdir', outDir, docxPath],
      { timeout: 60000 },
      (error) => {
        if (error) {
          console.error('PDF conversion failed:', error.message);
          return resolve(null);
        }
        const pdfPath = docxPath.replace(/\.docx$/, '.pdf');
        if (!fs.existsSync(pdfPath)) return resolve(null);
        const stats = fs.statSync(pdfPath);
        const fileName = path.basename(pdfPath);
        resolve({
          documentId: null,
          fileName,
          filePath: `generated-documents/${fileName}`,
          fileType: 'application/pdf',
          fileSize: stats.size
        });
      }
    );
  });
};

const findLibreOffice = () => {
  const candidates = [
    process.env.LIBREOFFICE_PATH,
    'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
    'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
    '/usr/bin/soffice',
    '/usr/local/bin/soffice'
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) return candidate;
    } catch {
      // continue
    }
  }
  return null;
};

// ============================================================
// Lookups
// ============================================================

const loadServiceWithMappings = async (serviceId) => {
  const [rows] = await pool.query('SELECT * FROM services WHERE service_id = ?', [serviceId]);
  const row = rows[0] || null;
  if (!row) return null;
  return {
    ...row,
    document_mappings: parseJson(row.document_mappings),
    form_fields: parseJson(row.form_fields) || [],
    requirements: parseJson(row.requirements) || [],
    required_documents: parseJson(row.required_documents) || []
  };
};

const findResident = async (residentId) => {
  const [rows] = await pool.query('SELECT * FROM residents WHERE resident_id = ?', [residentId]);
  return rows[0] || null;
};

const findBarangay = async (barangayId) => {
  const [rows] = await pool.query(
    'SELECT * FROM barangays WHERE barangay_id = ? LIMIT 1',
    [barangayId || 1]
  );
  if (rows[0]) return rows[0];
  const [fallback] = await pool.query('SELECT * FROM barangays ORDER BY barangay_id ASC LIMIT 1');
  return fallback[0] || null;
};

const findUserName = async (userId) => {
  if (!userId) return '';
  const [rows] = await pool.query(
    'SELECT first_name, last_name FROM users WHERE user_id = ? LIMIT 1',
    [userId]
  );
  if (!rows[0]) return '';
  return [rows[0].first_name, rows[0].last_name].filter(Boolean).join(' ').trim();
};

const parseJson = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return null; }
  }
  return value;
};

// ============================================================
// Document listing / retrieval
// ============================================================

const listDocuments = async (requestId) => {
  const documents = await documentRepository.findByRequest(requestId);
  return { success: true, message: 'Documents retrieved successfully.', data: documents };
};

// True when the request already has at least one generated document. Used by the
// auto-generation hook so repeated status transitions never stack duplicate docs.
const hasGeneratedDocument = async (requestId) => {
  const documents = await documentRepository.findByRequest(requestId);
  return documents.length > 0;
};

const getDocument = async (documentId) => {
  const document = await documentRepository.findById(documentId);
  if (!document) {
    return { success: false, message: 'Document not found.' };
  }
  const filePath = path.join(__dirname, '../../uploads', document.file_path);
  if (!fs.existsSync(filePath)) {
    return { success: false, message: 'Document file is missing on the server.' };
  }
  return { success: true, message: 'Document retrieved successfully.', data: { ...document, filePath } };
};

const deleteDocument = async (documentId) => {
  const document = await documentRepository.findById(documentId);
  if (!document) {
    return { success: false, message: 'Document not found.' };
  }
  const filePath = path.join(__dirname, '../../uploads', document.file_path);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  await documentRepository.remove(documentId);
  return { success: true, message: 'Document deleted successfully.', data: null };
};

// ============================================================
// Document review / approval workflow
// ============================================================

const ALLOWED_APPROVAL_STATUSES = ['approved', 'rejected', 'returned'];

// Approve / reject / return a generated document. A document that has already
// reached a terminal review state cannot be re-reviewed.
const reviewDocument = async (documentId, { status, reviewedBy, remarks }) => {
  if (!ALLOWED_APPROVAL_STATUSES.includes(status)) {
    return { success: false, message: `Invalid approval status "${status}".` };
  }
  const document = await documentRepository.findById(documentId);
  if (!document) {
    return { success: false, message: 'Document not found.' };
  }
  if (document.approval_status === 'approved' || document.approval_status === 'rejected') {
    return { success: false, message: `This document has already been marked "${document.approval_status}" and cannot be re-reviewed.` };
  }
  if (remarks && typeof remarks === 'string' && remarks.length > 500) {
    return { success: false, message: 'Review remarks must be 500 characters or fewer.' };
  }
  await documentRepository.updateApproval(documentId, {
    status,
    reviewedBy: reviewedBy || null,
    reviewRemarks: (remarks && remarks.trim()) || null
  });
  return { success: true, message: `Document marked as "${status}".`, data: { documentId, approvalStatus: status } };
};

module.exports = {
  generateDocument,
  listDocuments,
  getDocument,
  deleteDocument,
  hasGeneratedDocument,
  scanTemplatePlaceholders,
  reviewDocument
};
