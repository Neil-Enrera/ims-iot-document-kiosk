const pool = require('../src/config/database');

async function updateBarangayIdFormFields() {
  try {
    const [rows] = await pool.query(
      "SELECT service_id, service_name, form_fields FROM services WHERE service_name IN ('Barangay ID', 'Barangay ID Renewal')"
    );

    console.log(`Found ${rows.length} Barangay ID service rows.`);

    for (const row of rows) {
      let fields = [];
      if (typeof row.form_fields === 'string') {
        try {
          fields = JSON.parse(row.form_fields);
        } catch {
          fields = [];
        }
      } else if (Array.isArray(row.form_fields)) {
        fields = row.form_fields;
      }

      console.log(`Current fields for ${row.service_name}:`, fields.map(f => f.key));

      // Check if contact_number exists
      const hasContact = fields.some(f => f.key === 'contact_number' || f.key === 'contactNumber' || f.key === 'phone');
      if (!hasContact) {
        const emIdx = fields.findIndex(f => f.key.includes('emergency'));
        const contactField = {
          key: 'contact_number',
          label: 'Contact Number',
          type: 'tel',
          required: true,
          placeholder: '09XX XXX XXXX'
        };
        if (emIdx !== -1) {
          fields.splice(emIdx, 0, contactField);
        } else {
          fields.push(contactField);
        }
      }

      // Check if email exists
      const hasEmail = fields.some(f => f.key === 'email');
      if (!hasEmail) {
        const contactIdx = fields.findIndex(f => f.key === 'contact_number');
        const emailField = {
          key: 'email',
          label: 'Email (Optional)',
          type: 'email',
          required: false,
          placeholder: 'you@example.com'
        };
        if (contactIdx !== -1) {
          fields.splice(contactIdx + 1, 0, emailField);
        } else {
          fields.push(emailField);
        }
      }

      console.log(`Updated fields for ${row.service_name}:`, fields.map(f => f.key));

      await pool.query(
        "UPDATE services SET form_fields = ? WHERE service_id = ?",
        [JSON.stringify(fields), row.service_id]
      );
      console.log(`Successfully updated ${row.service_name} (ID: ${row.service_id}) in database.`);
    }

    console.log('Done!');
    process.exit(0);
  } catch (err) {
    console.error('Error updating Barangay ID form fields:', err);
    process.exit(1);
  }
}

updateBarangayIdFormFields();
