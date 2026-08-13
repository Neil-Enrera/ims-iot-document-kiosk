const { describe, it } = require('node:test');
const assert = require('node:assert');
const {
  evaluateResidentPolicy,
  buildGuestSnapshot,
  mergeGuestFormData,
  formatRequestNumber
} = require('../src/services/transaction.service');

describe('Transaction request number formatting', () => {
  it('should pad the suffix to five digits (kiosk REQ-XXXXX format)', () => {
    assert.strictEqual(formatRequestNumber(1), 'REQ-00001');
    assert.strictEqual(formatRequestNumber(25), 'REQ-00025');
    assert.strictEqual(formatRequestNumber(12345), 'REQ-12345');
  });

  it('should default to 1 when no number is provided', () => {
    assert.strictEqual(formatRequestNumber(undefined), 'REQ-00001');
    assert.strictEqual(formatRequestNumber(0), 'REQ-00001');
  });
});

describe('Guest snapshot builder', () => {
  it('should keep only provided fields, trimmed', () => {
    const snapshot = buildGuestSnapshot({
      full_name: '  Juan Dela Cruz ',
      middle_name: 'Santos',
      birth_date: '1990-01-01',
      address: ' Purok 1 ',
      contact_number: '09171234567',
      email: 'juan@example.com'
    });
    assert.deepStrictEqual(snapshot, {
      full_name: 'Juan Dela Cruz',
      middle_name: 'Santos',
      birth_date: '1990-01-01',
      address: 'Purok 1',
      contact_number: '09171234567',
      email: 'juan@example.com'
    });
  });

  it('should return null when no identity fields are present', () => {
    assert.strictEqual(buildGuestSnapshot({}), null);
    assert.strictEqual(buildGuestSnapshot(undefined), null);
    assert.strictEqual(buildGuestSnapshot({ contact_number: '  ' }), null);
  });

  it('should skip empty/blank optional fields', () => {
    const snapshot = buildGuestSnapshot({ full_name: 'Juan', email: '', address: '   ' });
    assert.deepStrictEqual(snapshot, { full_name: 'Juan' });
  });
});

describe('Guest form-data merge', () => {
  it('should merge the _guest identity under form_data', () => {
    const snapshot = buildGuestSnapshot({ full_name: 'Juan' });
    const merged = mergeGuestFormData({ purpose: 'Barangay clearance' }, snapshot);
    assert.deepStrictEqual(merged, {
      purpose: 'Barangay clearance',
      _guest: { full_name: 'Juan' }
    });
  });

  it('should return null when there is no form data and no guest snapshot', () => {
    assert.strictEqual(mergeGuestFormData(null, null), null);
    assert.strictEqual(mergeGuestFormData({}, null), null);
  });

  it('should not mutate the original form data object', () => {
    const original = { purpose: 'x' };
    const snapshot = buildGuestSnapshot({ full_name: 'Juan' });
    mergeGuestFormData(original, snapshot);
    assert.deepStrictEqual(original, { purpose: 'x' });
  });
});

describe('Resident duplicate / repeat policy', () => {
  const makeService = (overrides = {}) => ({
    service_name: 'Barangay Clearance',
    allow_multiple_active_requests: false,
    allow_new_request_after_release: true,
    ...overrides
  });

  const activeRequest = {
    request_id: 101,
    request_number: 'REQ-00011',
    status_id: 1,
    status_name: 'Submitted'
  };

  const releasedRequest = {
    request_id: 100,
    request_number: 'REQ-00010',
    status_id: 7,
    status_name: 'Released'
  };

  it('should allow a first-ever request', () => {
    const verdict = evaluateResidentPolicy(makeService(), [], null);
    assert.strictEqual(verdict.allowed, true);
  });

  it('should block an active request by default (no multiple active allowed)', () => {
    const verdict = evaluateResidentPolicy(makeService(), [activeRequest], activeRequest);
    assert.strictEqual(verdict.allowed, false);
    assert.strictEqual(verdict.code, 'ACTIVE_REQUEST_EXISTS');
    assert.strictEqual(verdict.existing.request_number, 'REQ-00011');
    assert.ok(verdict.message.includes('REQ-00011'));
  });

  it('should allow an active request when the service permits multiple active requests', () => {
    const service = makeService({ allow_multiple_active_requests: true });
    const verdict = evaluateResidentPolicy(service, [activeRequest], activeRequest);
    assert.strictEqual(verdict.allowed, true);
  });

  it('should allow a new request after release by default', () => {
    const verdict = evaluateResidentPolicy(makeService(), [], releasedRequest);
    assert.strictEqual(verdict.allowed, true);
  });

  it('should block a new request after release when the service disallows it', () => {
    const service = makeService({ allow_new_request_after_release: false });
    const verdict = evaluateResidentPolicy(service, [], releasedRequest);
    assert.strictEqual(verdict.allowed, false);
    assert.strictEqual(verdict.code, 'NO_REPEAT_AFTER_RELEASE');
    assert.strictEqual(verdict.existing.request_number, 'REQ-00010');
  });

  it('should treat Rejected and Cancelled as terminal for the after-release policy', () => {
    const service = makeService({ allow_new_request_after_release: false });
    const rejected = { ...releasedRequest, status_id: 8, status_name: 'Rejected' };
    const cancelled = { ...releasedRequest, status_id: 9, status_name: 'Cancelled' };
    assert.strictEqual(evaluateResidentPolicy(service, [], rejected).allowed, false);
    assert.strictEqual(evaluateResidentPolicy(service, [], cancelled).allowed, false);
  });

  it('should allow a repeat after Rejected when the service allows new requests after release', () => {
    const rejected = { ...releasedRequest, status_id: 8, status_name: 'Rejected' };
    const verdict = evaluateResidentPolicy(makeService(), [], rejected);
    assert.strictEqual(verdict.allowed, true);
  });
});