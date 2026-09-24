const pool = require('../../backend/src/config/database');

const renewalService = {
  service_name: 'Barangay ID Renewal',
  description: 'Renewal of existing or expired Barangay Identification Card for registered residents.',
  requirements: JSON.stringify([
    'Old / Expired Barangay ID or Valid Government ID',
    '2x2 ID Photo (White Background)'
  ]),
  form_fields: JSON.stringify([
    { key: 'full_name', label: 'Full Name', type: 'text', required: true, placeholder: 'Full Name' },
    { key: 'place_of_birth', label: 'Place of Birth', type: 'text', required: true, placeholder: 'e.g. San Jose, Antique' },
    { key: 'birth_date', label: 'Birth Date', type: 'date', required: true },
    { key: 'address', label: 'Complete Address', type: 'text', required: true, placeholder: 'Block, Lot, Street, Subdivision' },
    { key: 'gender', label: 'Gender', type: 'select', required: true, options: ['Male', 'Female', 'Other'] },
    { key: 'civil_status', label: 'Civil Status', type: 'select', required: true, options: ['Single', 'Married', 'Widowed', 'Separated'] },
    { key: 'emergency_contact_name', label: 'Emergency Contact Person', type: 'text', required: true, placeholder: 'Contact Person Name' },
    { key: 'emergency_contact_number', label: 'Emergency Contact Number', type: 'tel', required: true, placeholder: '09xxxxxxxxx' }
  ]),
  processing_fee: 150.00,
  requires_photo: 1,
  can_combine_with_others: 1,
  allow_multiple_active_requests: 0,
  allow_new_request_after_release: 1,
  is_active: 1,
  template_path: 'templates/Barangay-San-Manuel-ID-Template-Dummy.docx',
  template_original_name: 'Barangay-San-Manuel-ID-Template-Dummy.docx',
  template_mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  template_size: 38653,
  document_mappings: JSON.stringify([
    { placeholder: 'resident_photo', source: 'application', field: 'photo' },
    { placeholder: 'full_name', source: 'application', field: 'full_name' },
    { placeholder: 'place_of_birth', source: 'application', field: 'place_of_birth' },
    { placeholder: 'date_of_birth', source: 'application', field: 'birth_date' },
    { placeholder: 'address', source: 'application', field: 'address' },
    { placeholder: 'id_number', source: 'system', field: 'request_number' },
    { placeholder: 'date_issued', source: 'system', field: 'current_date' },
    { placeholder: 'valid_until', source: 'system', field: 'current_date' },
    { placeholder: 'civil_status', source: 'application', field: 'civil_status' },
    { placeholder: 'emergency_contact_name', source: 'application', field: 'emergency_contact_name' },
    { placeholder: 'emergency_contact_number', source: 'application', field: 'emergency_contact_number' },
    { placeholder: 'gender', source: 'application', field: 'gender' }
  ])
};

const replacementService = {
  service_name: 'Barangay ID Replacement',
  description: 'Replacement of lost, damaged, or unreadable Barangay Identification Card.',
  requirements: JSON.stringify([
    'Affidavit of Loss (for Lost ID) or Surrendered Damaged ID',
    '2x2 ID Photo (White Background)',
    'Valid Government ID or Proof of Residency'
  ]),
  form_fields: JSON.stringify([
    { key: 'full_name', label: 'Full Name', type: 'text', required: true, placeholder: 'Full Name' },
    { key: 'place_of_birth', label: 'Place of Birth', type: 'text', required: true, placeholder: 'e.g. San Jose, Antique' },
    { key: 'birth_date', label: 'Birth Date', type: 'date', required: true },
    { key: 'address', label: 'Complete Address', type: 'text', required: true, placeholder: 'Block, Lot, Street, Subdivision' },
    { key: 'gender', label: 'Gender', type: 'select', required: true, options: ['Male', 'Female', 'Other'] },
    { key: 'civil_status', label: 'Civil Status', type: 'select', required: true, options: ['Single', 'Married', 'Widowed', 'Separated'] },
    { key: 'replacement_reason', label: 'Reason for Replacement', type: 'select', required: true, options: ['Lost ID', 'Damaged / Unreadable ID', 'Information Correction / Update'] },
    { key: 'emergency_contact_name', label: 'Emergency Contact Person', type: 'text', required: true, placeholder: 'Contact Person Name' },
    { key: 'emergency_contact_number', label: 'Emergency Contact Number', type: 'tel', required: true, placeholder: '09xxxxxxxxx' }
  ]),
  processing_fee: 150.00,
  requires_photo: 1,
  can_combine_with_others: 1,
  allow_multiple_active_requests: 0,
  allow_new_request_after_release: 1,
  is_active: 1,
  template_path: 'templates/Barangay-San-Manuel-ID-Template-Dummy.docx',
  template_original_name: 'Barangay-San-Manuel-ID-Template-Dummy.docx',
  template_mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  template_size: 38653,
  document_mappings: JSON.stringify([
    { placeholder: 'resident_photo', source: 'application', field: 'photo' },
    { placeholder: 'full_name', source: 'application', field: 'full_name' },
    { placeholder: 'place_of_birth', source: 'application', field: 'place_of_birth' },
    { placeholder: 'date_of_birth', source: 'application', field: 'birth_date' },
    { placeholder: 'address', source: 'application', field: 'address' },
    { placeholder: 'id_number', source: 'system', field: 'request_number' },
    { placeholder: 'date_issued', source: 'system', field: 'current_date' },
    { placeholder: 'valid_until', source: 'system', field: 'current_date' },
    { placeholder: 'civil_status', source: 'application', field: 'civil_status' },
    { placeholder: 'emergency_contact_name', source: 'application', field: 'emergency_contact_name' },
    { placeholder: 'emergency_contact_number', source: 'application', field: 'emergency_contact_number' },
    { placeholder: 'gender', source: 'application', field: 'gender' }
  ])
};

async function run() {
  for (const svc of [renewalService, replacementService]) {
    const [existing] = await pool.query('SELECT service_id FROM services WHERE service_name = ?', [svc.service_name]);
    if (existing.length === 0) {
      await pool.query(
        `INSERT INTO services (
          service_name, description, requirements, form_fields, processing_fee,
          requires_photo, can_combine_with_others, allow_multiple_active_requests,
          allow_new_request_after_release, is_active, template_path, template_original_name,
          template_mime, template_size, document_mappings
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          svc.service_name, svc.description, svc.requirements, svc.form_fields, svc.processing_fee,
          svc.requires_photo, svc.can_combine_with_others, svc.allow_multiple_active_requests,
          svc.allow_new_request_after_release, svc.is_active, svc.template_path, svc.template_original_name,
          svc.template_mime, svc.template_size, svc.document_mappings
        ]
      );
      console.log(`Inserted: ${svc.service_name}`);
    } else {
      await pool.query(
        `UPDATE services SET
          description = ?, requirements = ?, form_fields = ?, processing_fee = ?,
          requires_photo = ?, is_active = ?, template_path = ?, template_original_name = ?,
          template_mime = ?, template_size = ?, document_mappings = ?
        WHERE service_name = ?`,
        [
          svc.description, svc.requirements, svc.form_fields, svc.processing_fee,
          svc.requires_photo, svc.is_active, svc.template_path, svc.template_original_name,
          svc.template_mime, svc.template_size, svc.document_mappings, svc.service_name
        ]
      );
      console.log(`Updated: ${svc.service_name}`);
    }
  }
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
