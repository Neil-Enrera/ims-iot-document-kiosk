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

const getBirthDate = (ctx) => {
  return pick(
    ctx.resident?.birth_date,
    ctx.application?.birth_date,
    ctx.application?.birthDate,
    ctx.application?.birthdate,
    ctx.application?._guest?.birth_date,
    ctx.application?._guest?.birthDate
  );
};

const computeAge = (birthDate) => {
  if (!birthDate) return '';
  
  let birthYear, birthMonth, birthDay;
  
  if (birthDate instanceof Date) {
    birthYear = birthDate.getFullYear();
    birthMonth = birthDate.getMonth();
    birthDay = birthDate.getDate();
  } else {
    const s = String(birthDate).trim();
    const match = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (match) {
      birthYear = parseInt(match[1], 10);
      birthMonth = parseInt(match[2], 10) - 1;
      birthDay = parseInt(match[3], 10);
    } else {
      const d = new Date(birthDate);
      if (isNaN(d.getTime())) return '';
      birthYear = d.getFullYear();
      birthMonth = d.getMonth();
      birthDay = d.getDate();
    }
  }
  
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDay = now.getDate();
  
  let age = currentYear - birthYear;
  const monthDiff = currentMonth - birthMonth;
  
  if (monthDiff < 0 || (monthDiff === 0 && currentDay < birthDay)) {
    age -= 1;
  }
  
  return (age >= 1 && age <= 125) ? String(age) : '';
};

const composeFullName = (r) => {
  if (!r) return '';
  if (r.first_name && r.last_name) {
    return [r.first_name, r.middle_name, r.last_name, r.suffix].filter(Boolean).join(' ').trim();
  }
  return pick(r.full_name, r.fullname, r.name, r.complete_name, [r.first_name, r.middle_name, r.last_name, r.suffix].filter(Boolean).join(' ').trim());
};

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
    resolve: (ctx) => composeFullName(ctx.resident) || pick(
      ctx.application?.full_name,
      ctx.application?.fullname,
      ctx.application?.name,
      ctx.application?.complete_name,
      [ctx.application?.first_name, ctx.application?.middle_name, ctx.application?.last_name, ctx.application?.suffix].filter(Boolean).join(' ').trim()
    )
  },
  {
    key: 'first_name', category: 'resident', source: 'resident', label: 'First name', aliases: ['firstname'],
    description: "Resident's first name.",
    resolve: (c) => pick(c.resident?.first_name, c.application?.first_name, c.application?.firstName)
  },
  {
    key: 'middle_name', category: 'resident', source: 'resident', label: 'Middle name', aliases: ['middlename'],
    description: "Resident's middle name.",
    resolve: (c) => pick(c.resident?.middle_name, c.application?.middle_name, c.application?.middleName)
  },
  {
    key: 'last_name', category: 'resident', source: 'resident', label: 'Last name', aliases: ['lastname', 'surname'],
    description: "Resident's last name.",
    resolve: (c) => pick(c.resident?.last_name, c.application?.last_name, c.application?.lastName, c.application?.surname)
  },
  {
    key: 'suffix', category: 'resident', source: 'resident', label: 'Suffix', aliases: ['name_suffix'],
    description: 'Name suffix (Jr., Sr., III).',
    resolve: (c) => pick(c.resident?.suffix, c.application?.suffix, c.application?.name_suffix)
  },
  {
    key: 'gender', category: 'resident', source: 'resident', label: 'Gender', aliases: ['sex'],
    description: "Resident's gender.",
    resolve: (c) => pick(c.resident?.gender, c.resident?.sex, c.application?.gender, c.application?.sex)
  },
  {
    key: 'civil_status', category: 'resident', source: 'resident', label: 'Civil status', aliases: ['civilstatus', 'marital_status'],
    description: "Resident's civil status (Single, Married, etc.).",
    resolve: (c) => pick(c.resident?.civil_status, c.application?.civil_status, c.application?.civilStatus, c.application?.marital_status)
  },
  {
    key: 'birth_date', category: 'resident', source: 'resident', label: 'Birth date', aliases: ['birthdate', 'date_of_birth', 'dob'],
    description: "Resident's birth date.",
    resolve: (c) => formatDate(getBirthDate(c))
  },
  {
    key: 'age', category: 'resident', source: 'resident', label: 'Age', aliases: ['age_years'],
    description: "Resident's age computed from birth date.",
    resolve: (c) => pick(computeAge(getBirthDate(c)), c.application?.age, c.resident?.age)
  },
  {
    key: 'birth_place', category: 'resident', source: 'resident', label: 'Birth place', aliases: ['place_of_birth', 'birthplace'],
    description: "Resident's place of birth.",
    resolve: (c) => pick(c.resident?.birth_place, c.resident?.place_of_birth, c.application?.place_of_birth, c.application?.birth_place, c.application?.birthPlace)
  },
  {
    key: 'nationality', category: 'resident', source: 'resident', label: 'Nationality', aliases: ['citizenship'],
    description: "Resident's nationality.",
    resolve: (c) => pick(c.resident?.nationality, c.resident?.citizenship, c.application?.nationality, c.application?.citizenship) || 'Filipino'
  },
  {
    key: 'religion', category: 'resident', source: 'resident', label: 'Religion', aliases: ['religious_affiliation'],
    description: "Resident's religion.",
    resolve: (c) => pick(c.resident?.religion, c.application?.religion, c.application?.religious_affiliation)
  },
  {
    key: 'occupation', category: 'resident', source: 'resident', label: 'Occupation', aliases: ['profession', 'employment'],
    description: "Resident's occupation.",
    resolve: (c) => pick(c.resident?.occupation, c.application?.occupation, c.application?.profession, c.application?.employment)
  },
  {
    key: 'contact_number', category: 'resident', source: 'resident', label: 'Contact number', aliases: ['contact', 'phone', 'mobile', 'telephone', 'contact_no'],
    description: "Resident's contact number.",
    resolve: (c) => pick(c.resident?.contact_number, c.application?.contact_number, c.application?.contact, c.application?.phone, c.application?.mobile, c.application?.contact_no)
  },
  {
    key: 'email', category: 'resident', source: 'resident', label: 'Email address', aliases: ['email_address'],
    description: "Resident's email address.",
    resolve: (c) => pick(c.resident?.email, c.application?.email, c.application?.email_address)
  },
  {
    key: 'resident_code', category: 'resident', source: 'resident', label: 'Resident ID', aliases: ['resident_id', 'resident_no', 'residents_code'],
    description: "Resident's system ID / resident code.",
    resolve: (c) => pick(c.resident?.resident_code, c.resident?.resident_id, c.application?.resident_code, c.application?.resident_id)
  },
  {
    key: 'blood_type', category: 'resident', source: 'resident', label: 'Blood type', aliases: ['bloodtype'],
    description: "Resident's blood type.",
    resolve: (c) => pick(c.resident?.blood_type, c.application?.blood_type, c.application?.bloodtype)
  },

  // ---------------- Address Information ----------------
  {
    key: 'house_number', category: 'address', source: 'resident', label: 'House number', aliases: ['house_no', 'housenumber', 'house'],
    description: 'House or building number.',
    resolve: (c) => pick(c.resident?.house_number, c.application?.house_number, c.application?.house_no, c.application?.housenumber)
  },
  {
    key: 'block', category: 'address', source: 'resident', label: 'Block number', aliases: ['blk', 'block_no', 'block_number'],
    description: 'Block number from address / application.',
    resolve: (c) => pick(c.resident?.block, c.application?.block, c.application?.Block, c.application?.blk, c.application?.block_no, c.application?.block_number)
  },
  {
    key: 'lot', category: 'address', source: 'resident', label: 'Lot number', aliases: ['lot_no', 'lot_number'],
    description: 'Lot number from address / application.',
    resolve: (c) => pick(c.resident?.lot, c.application?.lot, c.application?.Lot, c.application?.lot_no, c.application?.lot_number)
  },
  {
    key: 'street', category: 'address', source: 'resident', label: 'Street', aliases: ['street_name', 'st'],
    description: 'Street name.',
    resolve: (c) => pick(c.resident?.street, c.application?.street, c.application?.Street, c.application?.street_name, c.application?.st)
  },
  {
    key: 'subdivision', category: 'address', source: 'resident', label: 'Subdivision', aliases: ['subd', 'subdivision_name', 'village'],
    description: 'Subdivision or village name.',
    resolve: (c) => pick(c.resident?.subdivision, c.application?.subdivision, c.application?.Subdivision, c.application?.subd, c.application?.village)
  },
  {
    key: 'purok_zone', category: 'address', source: 'resident', label: 'Purok / Zone', aliases: ['purok', 'zone', 'purok_zone_no'],
    description: 'Purok or zone number.',
    resolve: (c) => pick(c.resident?.purok_zone, c.application?.purok_zone, c.application?.purok, c.application?.zone, c.application?.purok_zone_no)
  },
  {
    key: 'sitio', category: 'address', source: 'resident', label: 'Sitio', aliases: ['sitio_name'],
    description: 'Sitio name.',
    resolve: (c) => pick(c.resident?.sitio, c.application?.sitio, c.application?.sitio_name)
  },
  {
    key: 'barangay', category: 'address', source: 'barangay', label: 'Barangay', aliases: ['brgy', 'barangay_name'],
    description: 'Barangay name.',
    resolve: (c) => pick(c.barangay?.barangay_name, c.resident?.barangay_name, c.application?.barangay_name, c.application?.barangay) || 'San Manuel'
  },
  {
    key: 'municipality', category: 'address', source: 'barangay', label: 'Municipality / City', aliases: ['municipality_city', 'city_municipality'],
    description: 'Municipality or city.',
    resolve: (c) => pick(c.barangay?.city, c.resident?.municipality, c.application?.municipality, c.application?.city) || 'City of San Jose del Monte'
  },
  {
    key: 'city', category: 'address', source: 'barangay', label: 'City', aliases: ['city_name', 'municipality_city_name'],
    description: 'City name.',
    resolve: (c) => pick(c.barangay?.city, c.resident?.municipality, c.application?.city, c.application?.municipality) || 'City of San Jose del Monte'
  },
  {
    key: 'province', category: 'address', source: 'barangay', label: 'Province', aliases: ['province_name'],
    description: 'Province name.',
    resolve: (c) => pick(c.barangay?.province, c.resident?.province, c.application?.province) || 'Bulacan'
  },
  {
    key: 'zip_code', category: 'address', source: 'barangay', label: 'ZIP code', aliases: ['zip', 'postal_code', 'zipcode'],
    description: 'ZIP / postal code.',
    resolve: (c) => pick(c.barangay?.zipcode, c.resident?.zip_code, c.application?.zip_code, c.application?.zipcode) || '3023'
  },
  {
    key: 'address', category: 'address', source: 'resident', label: 'Complete address', aliases: ['complete_address', 'full_address', 'address_line', 'permanent_address'],
    description: "Resident's complete address (or barangay address as fallback).",
    resolve: (c) => {
      const a = c.resident || {};
      const app = c.application || {};
      const blockVal = pick(a.block, app.block, app.Block);
      const lotVal = pick(a.lot, app.lot, app.Lot);
      const streetVal = pick(a.street, app.street, app.Street);
      const subdVal = pick(a.subdivision, app.subdivision, app.Subdivision);
      const composedDiscrete = [
        pick(a.house_number, app.house_number),
        blockVal ? `Blk ${blockVal}` : '',
        lotVal ? `Lot ${lotVal}` : '',
        streetVal,
        subdVal,
        pick(a.purok_zone, app.purok_zone, app.purok),
        pick(a.sitio, app.sitio)
      ].filter(Boolean).join(', ');

      const explicitAddr = pick(a.address_line, a.address, app.address, app.address_line, app.complete_address, app.full_address);
      const chosen = pick(explicitAddr, composedDiscrete);
      const brgyName = c.barangay?.barangay_name || 'San Manuel';
      const city = c.barangay?.city || 'City of San Jose del Monte';
      const province = c.barangay?.province || 'Bulacan';
      const rest = [brgyName, city, province].filter(Boolean).join(', ');
      if (chosen && rest && !chosen.toLowerCase().includes(brgyName.toLowerCase())) {
        return `${chosen}, ${rest}`;
      }
      return pick(chosen, rest);
    }
  },

  // ---------------- Document Information ----------------
  { key: 'request_number', category: 'document', source: 'system', label: 'Request number', aliases: ['request_no', 'req_no'], description: 'Request tracking number.', resolve: (c) => c.request?.request_number || '' },
  { key: 'control_number', category: 'document', source: 'system', label: 'Control number', aliases: ['control_no', 'ctrl_no'], description: 'Document control number (same as request number).', resolve: (c) => pick(c.request?.request_number, c.request?.control_number, c.application?.control_number, c.application?.control_no) },
  { key: 'document_type', category: 'document', source: 'system', label: 'Document type', aliases: ['document_title', 'certificate_type'], description: 'Service / document type name.', resolve: (c) => c.service?.service_name || '' },
  {
    key: 'purpose', category: 'document', source: 'application', label: 'Purpose', aliases: ['request_purpose', 'purpose_of_request', 'purpose_of_document'],
    description: 'Purpose stated on the application.',
    resolve: (c) => pick(c.request?.purpose, c.application?.purpose, c.application?.Purpose, c.application?.request_purpose, c.application?.purpose_of_request)
  },
  {
    key: 'relative_name', category: 'document', source: 'application', label: 'Relative / Beneficiary name', aliases: ['beneficiary_name', 'relative', 'beneficiary'],
    description: 'Name of relative or beneficiary.',
    resolve: (c) => pick(c.application?.relative_name, c.application?.beneficiary_name, c.application?.relative, c.application?.beneficiary)
  },
  {
    key: 'applicant_name', category: 'document', source: 'application', label: 'Applicant / Company name', aliases: ['company_name', 'contractor_name', 'authorized_person'],
    description: 'Applicant or authorized company name.',
    resolve: (c) => pick(c.application?.applicant_name, c.application?.company_name, composeFullName(c.resident))
  },
  {
    key: 'office_address', category: 'document', source: 'application', label: 'Office address', aliases: ['company_address', 'business_address'],
    description: 'Office or business address.',
    resolve: (c) => pick(c.application?.office_address, c.application?.business_address, c.resident?.address_line)
  },
  {
    key: 'activity_type', category: 'document', source: 'application', label: 'Permit activity type', aliases: ['activity', 'scope_of_work'],
    description: 'Scope or activity authorized by permit (e.g. EXCAVATION/INSTALLATION).',
    resolve: (c) => pick(c.application?.activity_type, c.application?.scope_of_work) || 'EXCAVATION/INSTALLATION/REPLACEMENT'
  },
  {
    key: 'quantity_description', category: 'document', source: 'application', label: 'Quantity / Item description', aliases: ['quantity', 'items_description'],
    description: 'Quantity or item description (e.g. 5 CONCRETE).',
    resolve: (c) => pick(c.application?.quantity_description, c.application?.quantity)
  },
  {
    key: 'requested_by', category: 'document', source: 'application', label: 'Requested by', aliases: ['requestor', 'requestor_name'],
    description: 'Person or representative who requested the permit.',
    resolve: (c) => pick(c.application?.requested_by, c.application?.requestor, composeFullName(c.resident))
  },
  {
    key: 'amount_paid', category: 'document', source: 'system', label: 'Amount paid', aliases: ['fee', 'processing_fee', 'amount'],
    description: 'Service fee or amount paid.',
    resolve: (c) => pick(c.request?.amount_paid, c.service?.processing_fee, c.application?.amount_paid) || '0.00'
  },
  {
    key: 'or_number', category: 'document', source: 'application', label: 'OR Number', aliases: ['or_no', 'official_receipt_number', 'receipt_number'],
    description: 'Official receipt number.',
    resolve: (c) => pick(c.request?.or_number, c.application?.or_number, c.application?.or_no)
  },
  {
    key: 'or_date', category: 'document', source: 'system', label: 'OR Date', aliases: ['receipt_date'],
    description: 'Official receipt issuance date.',
    resolve: (c) => formatDate(c.request?.or_date || c.system.date)
  },
  { key: 'date_requested', category: 'document', source: 'system', label: 'Date requested', aliases: ['request_date', 'date_filed'], description: 'Date the request was filed.', resolve: (c) => formatDate(c.request?.request_date) },
  { key: 'date_approved', category: 'document', source: 'system', label: 'Date approved', aliases: ['approval_date', 'date_of_approval'], description: 'Date the request was approved / reviewed.', resolve: (c) => formatDate(c.request?.reviewed_date) || formatDate(c.request?.date_approved) },
  { key: 'date_issued', category: 'document', source: 'system', label: 'Date issued', aliases: ['issue_date', 'issued_date', 'date_of_issuance'], description: 'Date the document was generated.', resolve: (c) => formatDate(c.system.date) },
  {
    key: 'expiration_date', category: 'document', source: 'system', label: 'Expiration date', aliases: ['expiry_date', 'valid_until', 'date_expires'],
    description: 'Document expiration / claim-window expiry.',
    resolve: (c) => formatDate(c.request?.expires_at) || formatDate(c.application?.expiration_date) || ''
  },
  { key: 'processing_officer', category: 'document', source: 'system', label: 'Processing officer', aliases: ['processed_by', 'processing_staff', 'officer'], description: 'Staff who processed the document.', resolve: (c) => c.processedBy || '' },
  { key: 'approving_official', category: 'document', source: 'barangay', label: 'Approving official', aliases: ['approving_officer', 'signatory', 'official_name'], description: 'Official who signs/approves (e.g. Barangay Captain).', resolve: (c) => c.barangay?.captain_name || '' },
  { key: 'official_position', category: 'document', source: 'system', label: 'Official position', aliases: ['official_title', 'position'], description: 'Position of the approving official.', resolve: () => 'Barangay Captain' },
  { key: 'remarks', category: 'document', source: 'application', label: 'Remarks', aliases: ['notes', 'additional_remarks'], description: 'Remarks on the request.', resolve: (c) => pick(c.request?.remarks, c.application?.remarks) },
  { key: 'qr_code', category: 'document', source: 'system', label: 'QR code value', future: true, description: 'QR code payload (planned).', resolve: () => '' },
  { key: 'verification_code', category: 'document', source: 'system', label: 'Verification code', future: true, description: 'Document verification code (planned).', resolve: () => '' },

  // ---------------- Barangay Information ----------------
  { key: 'barangay_name', category: 'barangay', source: 'barangay', label: 'Barangay name', aliases: ['brgy_name'], description: 'Name of the barangay.', resolve: (c) => c.barangay?.barangay_name || 'San Manuel' },
  { key: 'barangay_address', category: 'barangay', source: 'barangay', label: 'Barangay address', aliases: ['barangay_location', 'hall_address'], description: 'Address of the barangay hall.', resolve: (c) => pick(c.barangay?.address, c.application?.barangay_address) || '' },
  { key: 'barangay_contact_number', category: 'barangay', source: 'barangay', label: 'Barangay contact number', aliases: ['brgy_contact', 'barangay_contact', 'brgy_contact_number'], description: 'Barangay contact number.', resolve: (c) => c.barangay?.contact_number || '' },
  { key: 'barangay_email', category: 'barangay', source: 'barangay', label: 'Barangay email', aliases: ['brgy_email'], description: 'Barangay email address.', resolve: (c) => c.barangay?.email || '' },
  { key: 'barangay_captain', category: 'barangay', source: 'barangay', label: 'Barangay captain', aliases: ['captain', 'brgy_captain', 'punong_barangay'], description: 'Barangay captain name.', resolve: (c) => c.barangay?.captain_name || '' },
  { key: 'barangay_secretary', category: 'barangay', source: 'barangay', label: 'Barangay secretary', aliases: ['secretary', 'brgy_secretary'], description: 'Barangay secretary name.', resolve: (c) => c.barangay?.secretary_name || '' },
  { key: 'barangay_treasurer', category: 'barangay', source: 'barangay', label: 'Barangay treasurer', aliases: ['treasurer', 'brgy_treasurer'], description: 'Barangay treasurer name.', resolve: (c) => c.barangay?.treasurer_name || '' },

  // ---------------- System Information ----------------
  { key: 'current_date', category: 'system', source: 'system', label: 'Current date', aliases: ['today', 'todays_date'], description: "Today's date (e.g. August 6, 2026).", resolve: (c) => formatDate(c.system.date) },
  { key: 'current_time', category: 'system', source: 'system', label: 'Current time', aliases: ['time', 'now_time'], description: "Today's time (HH:MM).", resolve: (c) => c.system.time },
  { key: 'current_year', category: 'system', source: 'system', label: 'Current year', aliases: ['year_now'], description: "Current year (e.g. 2026).", resolve: (c) => String(c.system.date.getFullYear()) },
  { key: 'current_month', category: 'system', source: 'system', label: 'Current month', aliases: ['month_now'], description: "Current month name (e.g. August).", resolve: (c) => MONTHS[c.system.date.getMonth()] },
  { key: 'day', category: 'system', source: 'system', label: 'Day of month', aliases: ['day_of_month', 'current_day'], description: "Day of the month (e.g. 6).", resolve: (c) => String(c.system.date.getDate()) },
  { key: 'month', category: 'system', source: 'system', label: 'Month name', description: "Month name (e.g. August).", resolve: (c) => MONTHS[c.system.date.getMonth()] },
  { key: 'year', category: 'system', source: 'system', label: 'Year', description: "Year (e.g. 2026).", resolve: (c) => String(c.system.date.getFullYear()) },
  { key: 'day_of_week', category: 'system', source: 'system', label: 'Day of the week', aliases: ['weekday'], description: "Today's weekday (e.g. Thursday).", resolve: (c) => WEEKDAYS[c.system.date.getDay()] },

  // ---------------- Barangay ID Information ----------------
  { key: 'id_number', category: 'barangay_id', source: 'application', label: 'Barangay ID number', aliases: ['barangay_id_number', 'brgy_id_no', 'id_no'], description: 'Barangay ID number (from the application form).', resolve: (c) => pick(c.application?.id_number, c.application?.barangay_id_number) || '' },
  { key: 'id_issued', category: 'barangay_id', source: 'system', label: 'ID issue date', aliases: ['id_date_issued'], description: 'ID issue date (same as date issued).', resolve: (c) => formatDate(c.system.date) },
  { key: 'id_expiration', category: 'barangay_id', source: 'application', label: 'ID expiration date', aliases: ['id_expiry', 'barangay_id_expiration'], description: 'ID expiration date (from application).', resolve: (c) => pick(formatDate(c.application?.id_expiration), c.application?.expiration_date) || '' },
  { key: 'id_type', category: 'barangay_id', source: 'system', label: 'ID type', description: 'Type of ID document.', resolve: () => 'Barangay ID' },
  { key: 'rfid_uid', category: 'barangay_id', source: 'application', label: 'RFID UID', future: true, description: 'RFID tag UID (planned).', resolve: (c) => c.application?.rfid_uid || '' },
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
  let guestData = null;
  if (application && typeof application === 'object' && application._guest && typeof application._guest === 'object') {
    guestData = application._guest;
    application = { ...application, ...guestData };
  }

  let effResident = resident || {};
  if ((!resident || Object.keys(resident).length === 0) && guestData) {
    let gFirst = guestData.first_name || '';
    let gLast = guestData.last_name || '';
    if (!gFirst && !gLast && guestData.full_name) {
      const parts = String(guestData.full_name).trim().split(/\s+/);
      if (parts.length > 1) {
        gFirst = parts.slice(0, -1).join(' ');
        gLast = parts[parts.length - 1];
      } else {
        gFirst = parts[0] || '';
      }
    }
    effResident = {
      full_name: guestData.full_name || '',
      first_name: gFirst,
      middle_name: guestData.middle_name || '',
      last_name: gLast,
      suffix: guestData.suffix || '',
      birth_date: guestData.birth_date || '',
      birth_place: guestData.birth_place || '',
      gender: guestData.gender || '',
      civil_status: guestData.civil_status || '',
      nationality: guestData.nationality || 'Filipino',
      religion: guestData.religion || '',
      occupation: guestData.occupation || '',
      blood_type: guestData.blood_type || '',
      contact_number: guestData.contact_number || '',
      email: guestData.email || '',
      subdivision: guestData.subdivision || '',
      street: guestData.street || '',
      block: guestData.block || '',
      lot: guestData.lot || '',
      house_number: guestData.house_number || '',
      purok_zone: guestData.purok_zone || '',
      sitio: guestData.sitio || '',
      municipality: guestData.municipality || '',
      province: guestData.province || '',
      zip_code: guestData.zip_code || '',
      address_line: guestData.address || guestData.address_line || ''
    };
  }

  return {
    resident: effResident,
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
    if (m) {
      const mappedVal = resolveMapping(m, ctx);
      if (mappedVal !== '') return mappedVal;
    }
  }
  // 2. Library placeholder (by key or alias).
  const entry = find(norm);
  if (entry) {
    const libraryVal = stringify(entry.resolve(ctx));
    if (libraryVal !== '') return libraryVal;
  }
  // 3. Generic application form or resident fallback: tag matches a field directly.
  if (ctx.application && ctx.application[norm] !== undefined && ctx.application[norm] !== null && String(ctx.application[norm]).trim() !== '') {
    return stringify(ctx.application[norm]);
  }
  if (ctx.resident && ctx.resident[norm] !== undefined && ctx.resident[norm] !== null && String(ctx.resident[norm]).trim() !== '') {
    return stringify(ctx.resident[norm]);
  }
  return '';
};

const resolveMapping = (mapping, ctx) => {
  const field = mapping.field || mapping.placeholder;
  const placeholder = mapping.placeholder || field;
  const normField = normalize(field);
  const normPlaceholder = normalize(placeholder);

  let value = '';
  if (mapping.source === 'resident') {
    const entry = find(normField) || find(normPlaceholder);
    value = entry ? entry.resolve(ctx) : (ctx.resident?.[field] ?? ctx.resident?.[normField]);
    if (value === undefined || value === null || String(value).trim() === '') {
      value = ctx.application?.[field] ?? ctx.application?.[normField];
    }
  } else if (mapping.source === 'application') {
    value = ctx.application?.[field] ?? ctx.application?.[normField];
    if (value === undefined || value === null || String(value).trim() === '') {
      const entry = find(normField) || find(normPlaceholder);
      if (entry) {
        value = entry.resolve(ctx);
      } else {
        value = ctx.resident?.[field] ?? ctx.resident?.[normField];
      }
    }
  } else if (mapping.source === 'system') {
    const isDatePart = ['day', 'month', 'year', 'day_of_week'].includes(normPlaceholder);
    const entry = (isDatePart ? find(normPlaceholder) : null) || find(normField) || find(normPlaceholder);
    value = entry ? entry.resolve(ctx) : (ctx.request?.[field] ?? ctx.request?.[normField] ?? '');
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
  const formKeys = new Set((service?.form_fields || []).map((f) => normalize(f.key)).filter(Boolean));
  const mapped = new Set((service?.document_mappings || []).map((m) => normalize(m.placeholder)));
  const known = [];
  const unknown = [];
  const used = [];
  for (const tag of tags || []) {
    const norm = normalize(tag);
    if (!norm) continue;
    used.push(norm);
    if (isKnown(norm) || mapped.has(norm) || formKeys.has(norm)) {
      known.push({ tag, norm, auto: isKnown(norm), mapped: mapped.has(norm) });
    } else {
      unknown.push({ tag, norm });
    }
  }
  return { known, unknown, used };
};

// Comprehensive audit of service configuration (form fields vs. template tags vs. mappings)
const auditServiceConfiguration = (service, tags = []) => {
  const templateTags = [...new Set((tags || []).map(normalize).filter(Boolean))];
  const templateSet = new Set(templateTags);
  const mappings = Array.isArray(service?.document_mappings) ? service.document_mappings : [];
  const mappedFieldKeys = new Set(
    mappings
      .filter((m) => m.source === 'application')
      .map((m) => normalize(m.field || m.placeholder))
  );

  const formFields = Array.isArray(service?.form_fields) ? service.form_fields : [];
  const unmappedFormFields = formFields.filter((f) => {
    const normKey = normalize(f.key);
    return !templateSet.has(normKey) && !mappedFieldKeys.has(normKey);
  });

  const { unknown, known, used } = classifyTags(templateTags, service);

  const warnings = [];
  if (!templateTags.length && service?.template_path) {
    warnings.push('No {{placeholder}} tags detected in the template (e.g. {{full_name}}, {{address}}). The DOCX must use {{double_braces}} placeholders instead of blank lines/underscores for automatic fill-in to work.');
  }

  if (unknown.length) {
    const unknownList = unknown.map((u) => `{{${u.norm}}}`).join(', ');
    warnings.push(`${unknown.length} document placeholder(s) in the template are unmapped: ${unknownList}. These will render blank in generated documents unless mapped or matched to an application field.`);
  }

  if (unmappedFormFields.length) {
    const fieldLabels = unmappedFormFields.map((f) => `"${f.label || f.key}"`).join(', ');
    warnings.push(`${unmappedFormFields.length} application field(s) are not mapped to the document template: ${fieldLabels}. Submitted values for these fields will be saved with the request but will not appear in the generated DOCX.`);
  }

  return {
    valid: unknown.length === 0,
    hasTemplate: templateTags.length > 0,
    templateTags,
    knownTags: known,
    unknownTags: unknown,
    unmappedFormFields,
    warnings
  };
};

const buildWarnings = (tags, service) => {
  const audit = auditServiceConfiguration(service, tags);
  return audit.warnings;
};

// Fill data for docxtemplater from the tags found in the template.
const apply = ({ templateTags, service, context }) => {
  const tags = [...new Set((templateTags || []).map(normalize).filter(Boolean))];
  const mappings = Array.isArray(service?.document_mappings) ? service.document_mappings : [];
  const data = {};
  const unknown = [];
  const missingValues = [];

  for (const tag of tags) {
    if (isKnown(tag) || mappings.some((m) => normalize(m.placeholder) === tag) || (context.application && context.application[tag] !== undefined)) {
      const val = resolve(tag, context, mappings);
      data[tag] = val;
      if (val === '') {
        missingValues.push(tag);
      }
    } else {
      unknown.push(tag);
    }
  }

  const warnings = buildWarnings(tags, service);
  if (missingValues.length > 0) {
    warnings.push(`${missingValues.length} mapped field(s) had no value provided: ${missingValues.map((m) => `{{${m}}}`).join(', ')}`);
  }

  return { data, unknown, missingValues, warnings };
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
  auditServiceConfiguration,
  buildWarnings,
  apply,
  listAll,
  categories
};
