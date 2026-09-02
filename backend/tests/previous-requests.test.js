const { describe, it, after } = require('node:test');
const assert = require('node:assert');
const transactionRepository = require('../src/repositories/transaction.repository');
const pool = require('../src/config/database');

describe('Previous Requests Repository & API Validation', () => {
  it('should export findPreviousRequestsByResidentAndService function', () => {
    assert.strictEqual(typeof transactionRepository.findPreviousRequestsByResidentAndService, 'function');
  });

  it('should query previous requests scoped strictly to residentId and serviceId', async () => {
    // Resident 42 has request 144 for service 68 (Barangay Clearance)
    const results = await transactionRepository.findPreviousRequestsByResidentAndService(42, 68, 5);
    assert(Array.isArray(results), 'Expected results to be an array');
    if (results.length > 0) {
      const first = results[0];
      assert.strictEqual(first.resident_id, 42);
      assert.strictEqual(first.service_id, 68);
      assert.strictEqual(typeof first.request_number, 'string');
      assert.strictEqual(typeof first.status_name, 'string');
      // Verify form_data was parsed
      if (first.form_data) {
        assert.strictEqual(typeof first.form_data, 'object');
      }
    }
  });

  it('should return an empty array if resident has no previous requests for a service', async () => {
    // Query with an impossible service ID 999999
    const results = await transactionRepository.findPreviousRequestsByResidentAndService(42, 999999, 5);
    assert(Array.isArray(results));
    assert.strictEqual(results.length, 0);
  });

  after(async () => {
    await pool.end();
  });
});
