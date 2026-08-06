// ============================================================
// Master Placeholder Engine
// ------------------------------------------------------------
// A generic, extensible placeholder library for every document
// template in the system. Any {{placeholder}} used in an uploaded
// DOCX is auto-filled during generation from the resident record,
// the kiosk application form, the request, the barangay, or the
// system clock — WITHOUT hardcoding anything per document type.
//
// To add a new placeholder later: append an entry to PLACEHOLDERS
// (with a resolve function or aliases). No core generation code
// changes are required.
// ============================================================

const CATEGORY_LABELS = {
  resident: 'Resident Information',
  address: 'Address Information',
  document: 'Document Information',
  barangay: 'Barangay Information',
  system: 'System Information',
  barangay_id: 'Barangay ID Information'
};

// ------------------------------------------------------------------
// Small helpers
// ------------------------------------------------------------------

const pick = (...vals) => vals.find((v) => v !== undefined && v !== null && String(v).trim() !== '') ?? '';

const formatDate = (input) => {
  if (!input) return '';
  const d = new Date(input);
  if (isNaN(d.getTime())) return String(input);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const computeAge = (birthDate) => {
  if (!birthDate) return '';
  const bd = new Date(birthDate);
  const now = new Date();
  if (isNaN(bd.getTime())) return '';
  let age = now.getFullYear() - bd.getFullYear();
  const m = now.getMonth() - bd.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < bd.getDate())) age -= 1;
  return age >= 0 ? String(age) : '';
};

const composeFullName = (r) => [r.first_name, r.middle_name, r.last_name, r.suffix].filter(Boolean).join(' ').trim();

// ------------------------------------------------------------------
// Placeholder registry
// ------------------------------------------------------------------
// Each entry: { key, label, category, source, description, aliases,
//               future, resolve(ctx) }
// ctx = { resident, application, request, service, barangay,
//         system, processedBy }
// Aliases are alternate tag spellings (normalized to lower_snake).
// ------------------------------------------------------------------

const PLACEHOLDERS = [
  // ---------------- Resident Information ----------------
  {
    key: 'full_name', category: 'resident', source: 'resident', label: 'Full name',
    aliases: ['fullname', 'name', 'resident_name', 'complete_name'],
    description: "Resident's complete name (first, middle, last, suffix).",
    resolve: (ctx) => composeFullName(ctx.resident) || pick(ctx.application.full_name, ctx.application.fullname, ctx.application.name)
  },
  { key: 'first_name', category: 'resident', source: 'resident', label: 'First name', aliases: ['firstname'], description: "Resident's first name.", resolve: (c) => c.resident.first_name || '' },
  { key: 'middle_name', category: 'resident', source: 'resident', label: 'Middle name', aliases: ['middlename'], description: "Resident's middle name.", resolve: (c) => c.resident.middle_name || '' },
  { key: 'last_name', category: 'resident', source: 'resident', label: 'Last name', aliases: ['lastname', 'surname'], description: "Resident's last name.", resolve: (c) => c.resident.last_name || '' },
  { key: 'suffix', category: 'resident', source: 'resident', label: 'Suffix', aliases: ['name_suffix'], description: 'Name suffix (Jr., Sr., III).', resolve: (c) => c.resident.suffix || '' },
  { key: 'gender', category: 'resident', source: 'resident', label: 'Gender', aliases: ['sex'], description: "Resident's gender.", resolve: (c) => c.resident.gender || '' },
  { key: 'civil_status', category: 'resident', source: 'resident', label: 'Civil status', aliases: ['civilstatus', 'marital_status'], description: "Resident's civil status (Single, Married, etc.).", resolve: (c) => pick(c.resident.civil_status, c.application.civil_status) },
  { key: 'birth_date', category: 'resident', source: 'resident', label: 'Birth date', aliases: ['birthdate', 'date_of_birth', 'dob'], description: "Resident's birth date.", resolve: (c) => pick(formatDate(c.resident.birth_date), formatDate(c.application.birth_date)) },
  { key: 'age', category: 'resident', source: 'resident', label: 'Age', aliases: ['age_years'], description: "Resident's age computed from birth date.", resolve: (c) => pick(computeAge(c.resident.birth_date), computeAge(c.application.birth_date), c.application.age) },
  { key: 'birth_place', category: 'resident', source: 'resident', label: 'Birth place', aliases: ['place_of_birth', 'birthplace'], description: "Resident's place of birth.", resolve: (c) => pick(c.resident.birth_place, c.application.birth_place) },
  { key: 'nationality', category: 'resident', source: 'resident', label: 'Nationality', aliases: ['citizenship'], description: "Resident's nationality.", resolve: (c) => pick(c.resident.nationality, c.application.nationality) || 'Filipino' },
  { key: 'religion', category: 'resident', source: 'resident', label: 'Religion', aliases: ['religious_affiliation'], description: "Resident's religion.", resolve: (c) => pick(c.resident.religion, c.application.religion) },
  { key: 'occupation', category: 'resident', source: 'resident', label: 'Occupation', aliases: ['profession', 'employment'], description: "Resident's occupation.", resolve: (c) => pick(c.resident.occupation, c.application.occupation) },
  { key: 'contact_number', category: 'resident', source: 'resident', label: 'Contact number', aliases: ['contact', 'phone', 'mobile', 'telephone', 'contact_no'], description: "Resident's contact number.", resolve: (c) => pick(c.resident.contact_number, c.application.contact_number) },
  { key: 'email', category: 'resident', source: 'resident', label: 'Email address', aliases: ['email_address'], description: "Resident's email address.", resolve: (c) => pick(c.resident.email, c.application.email) },
  { key: 'resident_code', category: 'resident', source: 'resident', label: 'Resident ID', aliases: ['resident_id', 'resident_no', 'residents_code'], description: "Resident's system ID / resident code.", resolve: (c) => c.resident.resident_code || '' },
  { key: 'blood_type', category: 'resident', source: 'resident', label: 'Blood type', aliases: ['bloodtype'], description: "Resident's blood type.", resolve: (c) => c.resident.blood_type || '' },

  // ---------------- Address Information ----------------
  {
    key: 'house_number', category: 'address', source: 'resident', label: 'House number', aliases: ['house_no', 'housenumber', 'house'],
    description: 'House or building number.',
    resolve: (c) => pick(c.resident.house_number, c.application.house_number, c.application.house_no)
  },
  {
    key: 'street', category: 'address', source: 'resident', label: 'Street', aliases: ['street_name', 'st'],
    description: 'Street name.',
    resolve: (c) => pick(c.resident.street, c.application.street, c.application.street_name)
  },
  {
    key: 'purok_zone', category: 'address', source: 'resident', label: 'Purok / Zone', aliases: ['purok', 'zone', 'purok_zone_no'],
    description: 'Purok or zone number.',
    resolve: (c) => pick(c.resident.purok_zone, c.application.purok_zone, c.application.zone, c.application.purok)
  },
  { key: 'sitio', category: 'address', source: 'resident', label: 'Sitio', aliases: ['sitio_name'], description: 'Sitio name.', resolve: (c) => pick(c.resident.sitio, c.application.sitio) },
  { key: 'barangay', category: 'address', source: 'barangay', label: 'Barangay', aliases: ['brgy', 'barangay_name'], description: 'Barangay name.', resolve: (c) => c.barangay?.barangay_name || '' },
  {
    key: 'municipality', category: 'address', source: 'barangay', label: 'Municipality / City', aliases: ['municipality_city', 'city_municipality'],
    description: 'Municipality or city.',
    resolve: (c) => c.barangay?.city || ''
  },
  { key: 'city', category: 'address', source: 'barangay', label: 'City', aliases: ['city_name', 'municipality_city_name'], description: 'City name.', resolve: (c) => c.barangay?.city || '' },
  { key: 'province', category: 'address', source: 'barangay', label: 'Province', aliases: ['province_name'], description: 'Province name.', resolve: (c) => c.barangay?.province || '' },
  { key: 'zip_code', category: 'address', source: 'barangay', label: 'ZIP code', aliases: ['zip', 'postal_code', 'zipcode'], description: 'ZIP / postal code.', resolve: (c) => c.barangay?.zipcode || '' },
  {
    key: 'address', category: 'address', source: 'resident', label: 'Complete address', aliases: ['complete_address', 'full_address', 'address_line', 'permanent_address'],
    description: "Resident's complete address (or barangay address as fallback).",
    resolve: (c) => {
      const a = c.resident;
      const composed = [a.house_number, a.street, a.purok_zone, a.sitio].filter(Boolean).join(' ');
      const addr = pick(composed, a.address_line);
      const rest = [c.barangay?.barangay_name, c.barangay?.city, c.barangay?.province].filter(Boolean).join(', ');
      return pick(addr, [addr, rest].filter(Boolean).join(', '));
    }
  },

  // ---------------- Document Information ----------------
  { key: 'request_number', category: 'document', source: 'system', label: 'Request number', aliases: ['request_no', 'req_no'], description: 'Request tracking number.', resolve: (c) => c.request.request_number || '' },
  { key: 'control_number', category: 'document', source: 'system', label: 'Control number', aliases: ['control_no', 'ctrl_no'], description: 'Document control number (same as request number).', resolve: (c) => c.request.request_number || '' },
  { key: 'document_type', category: 'document', source: 'system', label: 'Document type', aliases: ['document_title', 'certificate_type'], description: 'Service / document type name.', resolve: (c) => c.service?.service_name || '' },
  {
    key: 'purpose', category: 'document', source: 'application', label: 'Purpose', aliases: ['request_purpose', 'purpose_of_request', 'purpose_of_document'],
    description: 'Purpose stated on the application.',
    resolve: (c) => pick(c.request.purpose, c.application.purpose)
  },
  { key: 'date_requested', category: 'document', source: 'system', label: 'Date requested', aliases: ['request_date', 'date_filed'], description: 'Date the request was filed.', resolve: (c) => formatDate(c.request.request_date) },
  { key: 'date_approved', category: 'document', source: 'system', label: 'Date approved', aliases: ['approval_date', 'date_of_approval'], description: 'Date the request was approved / reviewed.', resolve: (c) => formatDate(c.request.reviewed_date) || formatDate(c.request.date_approved) },
  { key: 'date_issued', category: 'document', source: 'system', label: 'Date issued', aliases: ['issue_date', 'issued_date', 'date_of_issuance'], description: 'Date the document was generated.', resolve: (c) => formatDate(c.system.date) },
  {
    key: 'expiration_date', category: 'document', source: 'system', label: 'Expiration date', aliases: ['expiry_date', 'valid_until', 'date_expires'],
    description: 'Document expiration / claim-window expiry.',
    resolve: (c) => formatDate(c.request.expires_at) || formatDate(c.application.expiration_date) || ''
  },
  { key: 'processing_officer', category: 'document', source: 'system', label: 'Processing officer', aliases: ['processed_by', 'processing_staff', 'officer'], description: 'Staff who processed the document.', resolve: (c) => c.processedBy || '' },
  { key: 'approving_official', category: 'document', source: 'barangay', label: 'Approving official', aliases: ['approving_officer', 'signatory', 'official_name'], description: 'Official who signs/approves (e.g. Barangay Captain).', resolve: (c) => c.barangay?.captain_name || '' },
  { key: 'official_position', category: 'document', source: 'system', label: 'Official position', aliases: ['official_title', 'position'], description: 'Position of the approving official.', resolve: () => 'Barangay Captain' },
  { key: 'remarks', category: 'document', source: 'application', label: 'Remarks', aliases: ['notes', 'additional_remarks'], description: 'Remarks on the request.', resolve: (c) => pick(c.request.remarks, c.application.remarks) },
  { key: 'qr_code', category: 'document', source: 'system', label: 'QR code value', future: true, description: 'QR code payload (planned).', resolve: () => '' },
  { key: 'verification_code', category: 'document', source: 'system', label: 'Verification code', future: true, description: 'Document verification code (planned).', resolve: () => '' },

  // ---------------- Barangay Information ----------------
  { key: 'barangay_name', category: 'barangay', source: 'barangay', label: 'Barangay name', aliases: ['brgy_name'], description: 'Name of the barangay.', resolve: (c) => c.barangay?.barangay_name || '' },
  { key: 'barangay_address', category: 'barangay', source: 'barangay', label: 'Barangay address', aliases: ['barangay_location', 'hall_address'], description: 'Address of the barangay hall.', resolve: (c) => pick(c.barangay?.address, c.application.barangay_address) || '' },
  { key: 'barangay_contact_number', category: 'barangay', source: 'barangay', label: 'Barangay contact number', aliases: ['brgy_contact', 'barangay_contact', 'brgy_contact_number'], description: 'Barangay contact number.', resolve: (c) => c.barangay?.contact_number || '' },
  { key: 'barangay_email', category: 'barangay', source: 'barangay', label: 'Barangay email', aliases: ['brgy_email'], description: 'Barangay email address.', resolve: (c) => c.barangay?.email || '' },
  { key: 'barangay_captain', category: 'barangay', source: 'barangay', label: 'Barangay captain', aliases: ['captain', 'brgy_captain', 'punong_barangay'], description: 'Barangay captain name.', resolve: (c) => c.barangay?.captain_name || '' },
  { key: 'barangay_secretary', category: 'barangay', source: 'barangay', label: 'Barangay secretary', aliases: ['secretary', 'brgy_secretary'], description: 'Barangay secretary name.', resolve: (c) => c.barangay?.secretary_name || '' },
  { key: 'barangay_treasurer', category: 'barangay', source: 'barangay', label: 'Barangay treasurer', aliases: ['treasurer', 'brgy_treasurer'], description: 'Barangay treasurer name.', resolve: (c) => c.barangay?.treasurer_name || '' },

  // ---------------- System Information ----------------
  { key: 'current_date', category: 'system', source: 'system', label: 'Current date', aliases: ['today', 'todays_date'], description: "Today's date (e.g. August 6, 2026).", resolve: (c) => formatDate(c.system.date) },
  { key: 'current_time', category: 'system', source: 'system', label: 'Current time', aliases: ['time', 'now_time'], description: "Today's time (HH:MM).", resolve: (c) => c.system.time },
  { key: 'current_year', category: 'system', source: 'system', label: 'Current year', aliases: ['year_now', 'year'], description: "Current year (e.g. 2026).", resolve: (c) => String(c.system.date.getFullYear()) },
  { key: 'current_month', category: 'system', source: 'system', label: 'Current month', aliases: ['month_now', 'month'], description: "Current month name (e.g. August).", resolve: (c) => MONTHS[c.system.date.getMonth()] },
  { key: 'day', category: 'system', source: 'system', label: 'Day of month', aliases: ['day_of_month', 'current_day'], description: "Day of the month (e.g. 6).", resolve: (c) => String(c.system.date.getDate()) },
  { key: 'month', category: 'system', source: 'system', label: 'Month name', description: "Month name (e.g. August).", resolve: (c) => MONTHS[c.system.date.getMonth()] },
  { key: 'year', category: 'system', source: 'system', label: 'Year', description: "Year (e.g. 2026).", resolve: (c) => String(c.system.date.getFullYear()) },
  { key: 'day_of_week', category: 'system', source: 'system', label: 'Day of the week', aliases: ['weekday'], description: "Today's weekday (e.g. Thursday).", resolve: (c) => WEEKDAYS[c.system.date.getDay()] },

  // ---------------- Barangay ID Information ----------------
  { key: 'id_number', category: 'barangay_id', source: 'application', label: 'Barangay ID number', aliases: ['barangay_id_number', 'brgy_id_no', 'id_no'], description: 'Barangay ID number (from the application form).', resolve: (c) => pick(c.application.id_number, c.application.barangay_id_number) || '' },
  { key: 'id_issued', category: 'barangay_id', source: 'system', label: 'ID issue date', aliases: ['id_date_issued'], description: 'ID issue date (same as date issued).', resolve: (c) => formatDate(c.system.date) },
  { key: 'id_expiration', category: 'barangay_id', source: 'application', label: 'ID expiration date', aliases: ['id_expiry', 'barangay_id_expiration'], description: 'ID expiration date (from application).', resolve: (c) => pick(formatDate(c.application.id_expiration), c.application.expiration_date) || '' },
  { key: 'id_type', category: 'barangay_id', source: 'system', label: 'ID type', description: 'Type of ID document.', resolve: () => 'Barangay ID' },
  { key: 'rfid_uid', category: 'barangay_id', source: 'application', label: 'RFID UID', future: true, description: 'RFID tag UID (planned).', resolve: (c) => c.application.rfid_uid || '' },
  { key: 'resident_photo', category: 'barangay_id', source: 'resident', label: 'Resident photo', future: true, description: 'Resident photo (image embedding planned).', resolve: () => '' }
];

// Normalized lookup maps built once (extensible at runtime).
const BY_KEY = new Map();
const BY_ALIAS = new Map();
for (const ph of PLACEHOLDERS) {
  BY_KEY.set(ph.key, ph);
  for (const a of ph.aliases || []) BY_ALIAS.set(a, ph);
}

// Register additional placeholders at runtime without touching the core.
const registerPlaceholder = (entry) => {
  PLACEHOLDERS.push(entry);
  BY_KEY.set(entry.key, entry);
  for (const a of entry.aliases || []) BY_ALIAS.set(a, entry);
  return entry;
};

// Normalize a tag to its bare lower_snake key: "{{Full_Name}}" -> "full_name".
const normalize = (tag) => String(tag || '')
  .trim()
  .replace(/^\{\{/, '')
  .replace(/\}\}$/, '')
  .trim()
  .toLowerCase()
  .replace(/\s+/g, '_');

const find = (norm) => {
  if (!norm) return null;
  return BY_KEY.get(norm) || BY_ALIAS.get(norm) || null;
};

const isKnown = (norm) => !!find(norm);

// ------------------------------------------------------------------
// Context building
// ------------------------------------------------------------------

const buildContext = ({ request, resident, service, barangay, processedBy, now }) => {
  const date = now || new Date();
  let application = (request && (typeof request.form_data === 'object' ? request.form_data : (typeof request.form_data === 'string' ? JSON.parse(request.form_data) : null))) || {};
  // Guest submissions store identity under form_data._guest; merge those fields
  // into the application context so guest-derived placeholders (name, age, etc.)
  // resolve through the same generic path as registered residents.
  if (application && typeof application === 'object' && application._guest && typeof application._guest === 'object') {
    application = { ...application._guest, ...application };
  }
  return {
    resident: resident || {},
    application,
    request: request || {},
    service: service || {},
    barangay: barangay || {},
    system: {
      date,
      time: `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    },
    processedBy: processedBy || ''
  };
};

// Resolve a placeholder tag (any casing/braces) to a string value.
const resolve = (tag, ctx, explicitMappings) => {
  const norm = normalize(tag);
  if (!norm) return '';
  // 1. Explicit per-service mapping overrides the library (admin choice).
  if (Array.isArray(explicitMappings) && explicitMappings.length) {
    const m = explicitMappings.find((x) => normalize(x.placeholder) === norm);
    if (m) return resolveMapping(m, ctx);
  }
  // 2. Library placeholder (by key or alias).
  const entry = find(norm);
  if (entry) return stringify(entry.resolve(ctx));
  // 3. Generic application form fallback: tag matches a form field.
  if (ctx.application && ctx.application[norm] !== undefined) return stringify(ctx.application[norm]);
  return '';
};

const resolveMapping = (mapping, ctx) => {
  const field = mapping.field || mapping.placeholder;
  let value = '';
  if (mapping.source === 'resident') {
    const entry = find(field) || find(normalize(field));
    value = entry ? entry.resolve(ctx) : ctx.resident[field];
  } else if (mapping.source === 'application') {
    value = ctx.application[field];
  } else if (mapping.source === 'system') {
    const entry = find(field) || find(normalize(field));
    value = entry ? entry.resolve(ctx) : (ctx.request[field] ?? '');
  }
  return stringify(value);
};

const stringify = (value) => {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

// ------------------------------------------------------------------
// Classification / validation
// ------------------------------------------------------------------

// Classify every tag in the template: known (library), mapped (explicit),
// or unknown (will render blank unless it matches a form field).
const classifyTags = (tags, service) => {
  const formKeys = new Set((service?.form_fields || []).map((f) => f.key).filter(Boolean));
  const mapped = new Set((service?.document_mappings || []).map((m) => normalize(m.placeholder)));
  const known = [];
  const unknown = [];
  const used = [];
  for (const tag of tags || []) {
    const norm = normalize(tag);
    if (!norm) continue;
    used.push(norm);
    if (isKnown(norm) || mapped.has(norm) || formKeys.has(norm)) known.push({ tag, norm, auto: isKnown(norm), mapped: mapped.has(norm) });
    else unknown.push({ tag, norm });
  }
  return { known, unknown, used };
};

const buildWarnings = (tags, service) => {
  const { unknown, known } = classifyTags(tags, service);
  const warnings = [];
  if (!tags.length) {
    warnings.push('No {{placeholder}} tags detected in the template (e.g. {{full_name}}, {{address}}). The DOCX must use {{double_braces}} placeholders instead of blank lines/underscores for automatic fill-in to work.');
    return warnings;
  }
  const unmappedLibrary = known.filter((k) => !k.mapped && !k.auto).map((k) => `{{${k.norm}}}`);
  if (unmappedLibrary.length) {
    warnings.push(`Placeholders matching application form fields but without a library entry will fill from the submitted form: ${unmappedLibrary.map(t => t).join(', ')}`);
  }
  if (unknown.length) {
    warnings.push(`Unknown placeholder(s) will render blank unless added to the placeholder library or mapped: ${unknown.map((u) => `{{${u.norm}}}`).join(', ')}`);
  }
  return warnings;
};

// Fill data for docxtemplater from the tags found in the template.
const apply = ({ templateTags, service, context }) => {
  const tags = [...new Set((templateTags || []).map(normalize).filter(Boolean))];
  const mappings = Array.isArray(service?.document_mappings) ? service.document_mappings : [];
  const data = {};
  const unknown = [];
  for (const tag of tags) {
    if (isKnown(tag) || mappings.some((m) => normalize(m.placeholder) === tag) || (context.application && context.application[tag] !== undefined)) {
      data[tag] = resolve(tag, context, mappings);
    } else {
      unknown.push(tag);
    }
  }
  return { data, unknown };
};

// ------------------------------------------------------------------
// Library listing (for the admin UI)
// ------------------------------------------------------------------

const listAll = () => PLACEHOLDERS.map((p) => ({
  key: p.key,
  label: p.label,
  category: p.category,
  category_label: CATEGORY_LABELS[p.category] || p.category,
  source: p.source,
  description: p.description || '',
  future: !!p.future
}));

const categories = () => Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label }));

module.exports = {
  PLACEHOLDERS,
  CATEGORY_LABELS,
  registerPlaceholder,
  normalize,
  find,
  isKnown,
  buildContext,
  resolve,
  classifyTags,
  buildWarnings,
  apply,
  listAll,
  categories
};
