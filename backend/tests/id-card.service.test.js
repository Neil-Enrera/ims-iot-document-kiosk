const { describe, it, after } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const PizZip = require('pizzip');
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

describe('ID card draft preview rendering (before approval)', () => {
  const uploadsTemplates = path.join(__dirname, '../uploads/templates');
  const templateName = `preview-test-${Date.now()}.docx`;
  const templatePath = path.join(uploadsTemplates, templateName);
  const relTemplatePath = `templates/${templateName}`;

  after(() => {
    try { fs.unlinkSync(templatePath); } catch { /* noop */ }
  });

  // Copy the barangay's real configured ID-card template so docxtemplater
  // renders a genuinely valid OOXML file (hand-built zips are rejected).
  const sourceTemplate = path.join(uploadsTemplates, 'da4927dcbc4b31935f47f59b7e9cbd73.docx');
  const writeTaggedTemplate = () => {
    fs.copyFileSync(sourceTemplate, templatePath);
  };

  // A PENDING application has no resident record and no id_number yet.
  const pendingApplication = {
    application_number: 'APP-20260810-000999',
    first_name: 'Maria',
    middle_name: 'Santos',
    last_name: 'Dela Cruz',
    suffix: null,
    birth_date: '1995-06-15',
    gender: 'Female',
    civil_status: 'Single',
    occupation: 'Student',
    blood_type: 'O+',
    address_line: '456 Rizal St',
    contact_number: '09171112223',
    email: 'maria@example.com',
    emergency_contact_name: 'Ana Dela Cruz',
    emergency_contact_number: '09174445556',
    photo: null,
    signature: null,
    id_number: null,
    id_expiration_date: null,
    form_data: null
  };

  const barangay = { barangay_id: 1, barangay_name: 'San Manuel', id_template_path: relTemplatePath };

  it('renders a DOCX buffer for a pending application without a resident record', async () => {
    writeTaggedTemplate();
    const result = await idCard.renderCardBuffer({
      application: pendingApplication,
      resident: {},
      barangay,
      processedBy: 'PREVIEW'
    });
    assert.strictEqual(result.success, true, result.message);
    assert.ok(result.buffer && result.buffer.length > 0, 'should return a non-empty DOCX buffer');

    // Re-open the rendered buffer and verify the applicant's submitted fields
    // are filled in even though no resident record exists yet.
    const zip = new PizZip(result.buffer);
    const xml = zip.file('word/document.xml').asText();
    assert.ok(xml.includes('Maria'), 'first_name should render from the application');
    assert.ok(xml.includes('Santos'), 'middle_name should render from the application');
    assert.ok(xml.includes('Dela Cruz'), 'surname should render from the application');
    assert.ok(xml.includes('Single'), 'civil_status should render from the application');
  });

  it('does not assign an id_number or expiry when rendering the draft', async () => {
    writeTaggedTemplate();
    const result = await idCard.renderCardBuffer({
      application: pendingApplication,
      resident: {},
      barangay,
      processedBy: 'PREVIEW'
    });
    assert.strictEqual(result.success, true, result.message);
    const zip = new PizZip(result.buffer);
    const xml = zip.file('word/document.xml').asText();
    assert.ok(!xml.includes('BRGY-'), 'no official ID number should be present on the draft');
  });
});

describe('ID card photo embedding (valid relay + inline drawing)', () => {
  const uploadsTemplates = path.join(__dirname, '../uploads/templates');
  const templateName = `photo-test-${Date.now()}.docx`;
  const templatePath = path.join(uploadsTemplates, templateName);
  const relTemplatePath = `templates/${templateName}`;

  after(() => {
    try { fs.unlinkSync(templatePath); } catch { /* noop */ }
  });

  const sourceTemplate = path.join(uploadsTemplates, 'da4927dcbc4b31935f47f59b7e9cbd73.docx');

  // A synthetic 320x240 PNG header (same construction as the size-detection test).
  const photoBuffer = (() => {
    const buf = Buffer.alloc(24, 0);
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(buf, 0, 0, 8);
    buf.writeUInt32BE(320, 16);
    buf.writeUInt32BE(240, 20);
    return buf;
  })();

  const applicationWithPhoto = {
    application_number: 'PREVIEW',
    first_name: 'Lita',
    last_name: 'Santos',
    address_line: '101 Purok St',
    photo: 'data:image/png;base64,' + photoBuffer.toString('base64'),
    id_number: null,
    id_expiration_date: null
  };

  it('embeds the photo with a resolvable media relationship (no media/media/ bug)', async () => {
    fs.copyFileSync(sourceTemplate, templatePath);
    const barangay = { barangay_id: 1, barangay_name: 'San Manuel', id_template_path: relTemplatePath };

    const result = await idCard.renderCardBuffer({
      application: applicationWithPhoto,
      resident: {},
      barangay,
      processedBy: 'PREVIEW'
    });
    assert.strictEqual(result.success, true, result.message);

    const zip = new PizZip(result.buffer);
    const docXml = zip.file('word/document.xml').asText();
    const rels = zip.file('word/_rels/document.xml.rels').asText();

    // The token must be swapped for a real drawing.
    assert.ok(!docXml.includes('IMSPHOTOTOKEN2024'), 'photo token should be replaced');
    assert.ok(docXml.includes('<w:drawing'), 'document.xml should contain the photo drawing');

    // Media part is present and the relationship target resolves to it exactly
    // once (the old code produced media/media/image1.png, which never rendered).
    assert.ok(zip.file('word/media/image1.png'), 'media part should exist at word/media/image1.png');
    assert.ok(rels.includes('Target="media/image1.png"'), 'relationship target should be media/image1.png');
    assert.ok(!rels.includes('media/media/'), 'relationship target must not duplicate the media/ prefix');

    // The drawing sits inside a single <w:r> with no nested <w:p> (the old code
    // inserted a whole centered paragraph inside the photo-cell paragraph).
    const drawingRun = docXml.match(/<w:r\b[^>]*>(?:(?!<\/w:r>)[\s\S])*?<w:drawing[\s\S]*?<\/w:r>/);
    assert.ok(drawingRun, 'drawing should be wrapped by exactly one run');
    assert.ok(!/<w:p[ >]/.test(drawingRun[0]), 'drawing run must not contain a nested paragraph');

    // The drawing's r:embed must point at the image relationship.
    const rId = (docXml.match(/r:embed="(rId\d+)"/) || [])[1];
    assert.ok(rId, 'drawing should reference a relationship id');
    const relForRid = new RegExp('Id="' + rId + '"[^>]*Target="media/image1.png"');
    assert.ok(relForRid.test(rels), 'the referenced rid should map to the image target');
  });
});