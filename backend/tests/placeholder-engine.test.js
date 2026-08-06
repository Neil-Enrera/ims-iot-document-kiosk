const { describe, it } = require('node:test');
const assert = require('node:assert');
const engine = require('../src/services/placeholder.engine');

const resident = {
  first_name: 'Maria', middle_name: 'R', last_name: 'Santos', suffix: 'Jr.',
  birth_date: '1995-06-15', gender: 'Female', civil_status: 'Married',
  address_line: '123 Sampaguita St', house_number: '123', street: 'Sampaguita St',
  purok_zone: 'Zone 4', sitio: 'Pook A', contact_number: '09171234567',
  email: 'maria@test.ph', resident_code: 'R-0001', blood_type: 'O+',
  birth_place: 'San Jose Del Monte', nationality: 'Filipino', occupation: 'Teacher',
  municipality: 'San Jose Del Monte', province: 'Bulacan', zip_code: '3023'
};

const request = {
  request_number: 'REQ-00025', request_date: new Date('2026-08-01'),
  reviewed_date: new Date('2026-08-05'), expires_at: new Date('2026-08-20'),
  purpose: 'Financial assistance', remarks: 'For DSWD', form_data: { purpose: 'Financial assistance' }
};

const service = { service_name: 'Certificate of Indigency', form_fields: [{ key: 'purpose' }], document_mappings: [] };

const barangay = {
  barangay_name: 'San Manuel', city: 'San Jose Del Monte', province: 'Bulacan', zipcode: '3023',
  captain_name: 'Gilbert A. Batista', secretary_name: 'Jane Sec', treasurer_name: 'Joe Tres',
  contact_number: '1234', email: 'sm@barangay.gov.ph'
};

const ctx = engine.buildContext({ request, resident, service, barangay, processedBy: 'Admin User', now: new Date('2026-08-06T10:30:00') });

describe('Master Placeholder Library', () => {
  it('covers all six categories', () => {
    const categories = new Set(engine.listAll().map((p) => p.category));
    for (const c of ['resident', 'address', 'document', 'barangay', 'system', 'barangay_id']) {
      assert.ok(categories.has(c), `missing category ${c}`);
    }
  });

  it('contains every required common placeholder', () => {
    const keys = new Set(engine.listAll().map((p) => p.key));
    const required = [
      'full_name', 'first_name', 'middle_name', 'last_name', 'suffix', 'gender', 'civil_status',
      'birth_date', 'age', 'birth_place', 'nationality', 'occupation', 'contact_number', 'email',
      'resident_code', 'house_number', 'street', 'purok_zone', 'sitio', 'barangay', 'municipality',
      'city', 'province', 'zip_code', 'address', 'request_number', 'control_number', 'document_type',
      'purpose', 'date_requested', 'date_approved', 'date_issued', 'expiration_date',
      'processing_officer', 'approving_official', 'official_position', 'remarks',
      'barangay_name', 'barangay_address', 'barangay_contact_number', 'barangay_email',
      'barangay_captain', 'barangay_secretary', 'barangay_treasurer',
      'current_date', 'current_time', 'current_year', 'current_month', 'day', 'month', 'year', 'day_of_week',
      'id_number', 'id_issued', 'id_expiration', 'rfid_uid', 'resident_photo'
    ];
    for (const k of required) assert.ok(keys.has(k), `missing ${k}`);
  });
});

describe('Placeholder resolution', () => {
  it('resolves resident identity fields', () => {
    assert.strictEqual(engine.resolve('full_name', ctx, []), 'Maria R Santos Jr.');
    assert.strictEqual(engine.resolve('first_name', ctx, []), 'Maria');
    assert.strictEqual(engine.resolve('age', ctx, []), '31'); // born 1995-06-15, "now" 2026-08-06
    assert.strictEqual(engine.resolve('birth_date', ctx, []), 'June 15, 1995');
    assert.strictEqual(engine.resolve('civil_status', ctx, []), 'Married');
    assert.strictEqual(engine.resolve('birth_place', ctx, []), 'San Jose Del Monte');
  });

  it('resolves address fields with composed fallback', () => {
    assert.strictEqual(engine.resolve('house_number', ctx, []), '123');
    assert.strictEqual(engine.resolve('street', ctx, []), 'Sampaguita St');
    assert.strictEqual(engine.resolve('purok_zone', ctx, []), 'Zone 4');
    assert.strictEqual(engine.resolve('sitio', ctx, []), 'Pook A');
    assert.strictEqual(engine.resolve('barangay', ctx, []), 'San Manuel');
    assert.strictEqual(engine.resolve('province', ctx, []), 'Bulacan');
    assert.strictEqual(engine.resolve('zip_code', ctx, []), '3023');
    assert.ok(engine.resolve('address', ctx, []).includes('Sampaguita St'));
  });

  it('resolves document, barangay and system fields', () => {
    assert.strictEqual(engine.resolve('request_number', ctx, []), 'REQ-00025');
    assert.strictEqual(engine.resolve('control_number', ctx, []), 'REQ-00025');
    assert.strictEqual(engine.resolve('document_type', ctx, []), 'Certificate of Indigency');
    assert.strictEqual(engine.resolve('purpose', ctx, []), 'Financial assistance');
    assert.strictEqual(engine.resolve('date_issued', ctx, []), 'August 6, 2026');
    assert.strictEqual(engine.resolve('processing_officer', ctx, []), 'Admin User');
    assert.strictEqual(engine.resolve('approving_official', ctx, []), 'Gilbert A. Batista');
    assert.strictEqual(engine.resolve('official_position', ctx, []), 'Barangay Captain');
    assert.strictEqual(engine.resolve('barangay_captain', ctx, []), 'Gilbert A. Batista');
    assert.strictEqual(engine.resolve('current_date', ctx, []), 'August 6, 2026');
    assert.strictEqual(engine.resolve('day', ctx, []), '6');
    assert.strictEqual(engine.resolve('month', ctx, []), 'August');
    assert.strictEqual(engine.resolve('year', ctx, []), '2026');
    assert.strictEqual(engine.resolve('day_of_week', ctx, []), 'Thursday');
  });

  it('supports aliases and case/brace variants', () => {
    assert.strictEqual(engine.resolve('{{Full_Name}}', ctx, []), 'Maria R Santos Jr.');
    assert.strictEqual(engine.resolve('birthdate', ctx, []), 'June 15, 1995');
    assert.strictEqual(engine.resolve('contact', ctx, []), '09171234567');
    assert.strictEqual(engine.resolve('brgy_captain', ctx, []), 'Gilbert A. Batista');
  });

  it('explicit mapping overrides the library', () => {
    const mappings = [{ placeholder: 'purpose', source: 'application', field: 'purpose' }];
    assert.strictEqual(engine.resolve('purpose', ctx, mappings), 'Financial assistance');
  });

  it('falls back to application form fields for unknown tags', () => {
    const c = engine.buildContext({ request: { ...request, form_data: { relative_name: 'John Doe' } }, resident, service, barangay, processedBy: '' });
    assert.strictEqual(engine.resolve('relative_name', c, []), 'John Doe');
  });

  it('apply() fills every tag and reports unknown tags', () => {
    const { data, unknown } = engine.apply({
      templateTags: ['full_name', 'age', 'address', 'purpose', 'mystery_tag'],
      service,
      context: ctx
    });
    assert.ok(data.full_name.includes('Maria'));
    assert.ok(data.age);
    assert.ok(data.purpose);
    assert.deepStrictEqual(unknown, ['mystery_tag']);
    assert.ok(!('mystery_tag' in data));
  });
});

describe('Placeholder validation', () => {
  it('classifies known, mapped and unknown tags', () => {
    const svc = { ...service, document_mappings: [{ placeholder: 'custom', source: 'application', field: 'custom' }] };
    const { known, unknown } = engine.classifyTags(['full_name', 'custom', 'mystery'], svc);
    const knownNorms = known.map((k) => k.norm);
    assert.ok(knownNorms.includes('full_name'));
    assert.ok(knownNorms.includes('custom'));
    assert.deepStrictEqual(unknown.map((u) => u.norm), ['mystery']);
  });

  it('warns about unknown placeholders', () => {
    const warnings = engine.buildWarnings(['full_name', 'mystery'], service);
    assert.ok(warnings.some((w) => w.includes('mystery')));
  });
});

describe('Extensibility', () => {
  it('registerPlaceholder adds a new placeholder without core changes', () => {
    engine.registerPlaceholder({
      key: 'church_name', category: 'resident', source: 'application', label: 'Church name',
      resolve: (c) => c.application.church_name || ''
    });
    const c = engine.buildContext({ request: { form_data: { church_name: 'St. Joseph' } }, resident, service, barangay, processedBy: '' });
    assert.strictEqual(engine.resolve('church_name', c, []), 'St. Joseph');
    assert.ok(engine.isKnown('church_name'));
  });
});
