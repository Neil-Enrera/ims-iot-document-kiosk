const { describe, it, after } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const idCard = require('../src/services/id-card.service');

describe('ID card image size detection', () => {
  it('reads PNG dimensions from the IHDR header', () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    // Build a minimal 24+ byte buffer with valid IHDR length at 4 and dims at 16/20.
    const buf = Buffer.alloc(24);
    png.copy(buf, 0, 0, 8);
    buf.writeUInt32BE(320, 16);
    buf.writeUInt32BE(240, 20);
    const size = idCard.getImageSize(buf);
    assert.strictEqual(size.width, 320);
    assert.strictEqual(size.height, 240);
  });

  it('falls back to a safe default for unknown/JPEG-less buffers', () => {
    const buf = Buffer.alloc(24, 0);
    const size = idCard.getImageSize(buf);
    assert.strictEqual(size.width, 200);
    assert.strictEqual(size.height, 240);
  });
});

describe('ID card template tag scan', () => {
  const docxPath = path.join(os.tmpdir(), `id-card-test-${Date.now()}.docx`);

  after(() => {
    try { fs.unlinkSync(docxPath); } catch { /* noop */ }
  });

  it('extracts tags and strips the Image module % marker', () => {
    // A real docx zip is required for PizZip; build a tiny valid zip via a
    // minimal word/document.xml entry. Reuse docxtemplater's pizzip dep.
    const PizZip = require('pizzip');
    const zip = new PizZip();
    zip.file('word/document.xml', '<w:document><w:p><w:r><w:t>{{full_name}} {{%resident_photo}} {{%%id_number}}</w:t></w:r></w:p></w:document>');
    const content = zip.generate({ type: 'nodebuffer' });
    fs.writeFileSync(docxPath, content);

    const tags = idCard.scanTemplateTags(docxPath);
    assert.deepStrictEqual([...tags].sort(), ['full_name', 'id_number', 'resident_photo']);
  });

  it('returns [] for missing files', () => {
    assert.deepStrictEqual(idCard.scanTemplateTags(path.join(os.tmpdir(), 'does-not-exist.docx')), []);
  });
});

describe('ID card kiosk payload mapping', () => {
  it('maps camelCase form payload to the application row shape', () => {
    const application = idCard.applicationFromKioskPayload({
      firstName: 'Juan',
      middleName: 'Santos',
      lastName: 'Dela Cruz',
      gender: 'Male',
      civilStatus: 'Single',
      birthDate: '1995-06-15',
      occupation: 'Student',
      bloodType: 'O+',
      addressLine: '123 Mabini St',
      contactNumber: '09123456789',
      emergencyContactName: 'Maria Dela Cruz',
      photo: 'data:image/png;base64,xx',
      formData: { first_name: 'Juan', last_name: 'Dela Cruz' }
    });
    assert.strictEqual(application.first_name, 'Juan');
    assert.strictEqual(application.last_name, 'Dela Cruz');
    assert.strictEqual(application.middle_name, 'Santos');
    assert.strictEqual(application.birth_date, '1995-06-15');
    assert.strictEqual(application.gender, 'Male');
    assert.strictEqual(application.civil_status, 'Single');
    assert.strictEqual(application.occupation, 'Student');
    assert.strictEqual(application.blood_type, 'O+');
    assert.strictEqual(application.address_line, '123 Mabini St');
    assert.strictEqual(application.contact_number, '09123456789');
    assert.strictEqual(application.emergency_contact_name, 'Maria Dela Cruz');
    assert.strictEqual(application.photo, 'data:image/png;base64,xx');
    assert.deepStrictEqual(application.form_data, { first_name: 'Juan', last_name: 'Dela Cruz' });
    assert.strictEqual(application.id_number, null);
    assert.strictEqual(application.id_expiration_date, null);
    assert.strictEqual(application.application_number, 'PREVIEW');
  });

  it('keeps empty fields as undefined and stringifies empty form data', () => {
    const application = idCard.applicationFromKioskPayload({
      firstName: 'Juan',
      lastName: 'Dela Cruz',
      addressLine: '123 Mabini St'
    });
    assert.strictEqual(application.middle_name, undefined);
    assert.strictEqual(application.emergency_contact_number, undefined);
    assert.strictEqual(application.form_data, '{}');
  });
});