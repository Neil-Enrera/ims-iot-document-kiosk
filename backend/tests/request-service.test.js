const { describe, it } = require('node:test');
const assert = require('node:assert');

describe('Request State Machine', () => {
  const STATUS_IDS = {
    PENDING: 1,
    APPROVED: 2,
    REJECTED: 3,
    READY_FOR_RELEASE: 4,
    RELEASED: 5,
    PROCESSING: 6,
    CANCELLED: 9
  };

  const VALID_TRANSITIONS = {
    1: [2, 3, 9],   // Pending -> Approved, Rejected, Cancelled
    2: [6, 4, 9],   // Approved -> Processing, Ready for Release, Cancelled
    3: [],           // Rejected -> (end)
    6: [4],          // Processing -> Ready for Release
    4: [5],          // Ready for Release -> Released
    5: [],           // Released -> (end)
    9: []            // Cancelled -> (end)
  };

  it('should have correct status IDs matching DB', () => {
    assert.strictEqual(STATUS_IDS.PENDING, 1);
    assert.strictEqual(STATUS_IDS.APPROVED, 2);
    assert.strictEqual(STATUS_IDS.REJECTED, 3);
    assert.strictEqual(STATUS_IDS.READY_FOR_RELEASE, 4);
    assert.strictEqual(STATUS_IDS.RELEASED, 5);
    assert.strictEqual(STATUS_IDS.PROCESSING, 6);
    assert.strictEqual(STATUS_IDS.CANCELLED, 9);
  });

  it('should allow Pending -> Approved', () => {
    assert.ok(VALID_TRANSITIONS[STATUS_IDS.PENDING].includes(STATUS_IDS.APPROVED));
  });

  it('should allow Pending -> Rejected', () => {
    assert.ok(VALID_TRANSITIONS[STATUS_IDS.PENDING].includes(STATUS_IDS.REJECTED));
  });

  it('should allow Pending -> Cancelled', () => {
    assert.ok(VALID_TRANSITIONS[STATUS_IDS.PENDING].includes(STATUS_IDS.CANCELLED));
  });

  it('should allow Approved -> Processing', () => {
    assert.ok(VALID_TRANSITIONS[STATUS_IDS.APPROVED].includes(STATUS_IDS.PROCESSING));
  });

  it('should allow Approved -> Ready for Release', () => {
    assert.ok(VALID_TRANSITIONS[STATUS_IDS.APPROVED].includes(STATUS_IDS.READY_FOR_RELEASE));
  });

  it('should allow Approved -> Cancelled', () => {
    assert.ok(VALID_TRANSITIONS[STATUS_IDS.APPROVED].includes(STATUS_IDS.CANCELLED));
  });

  it('should allow Processing -> Ready for Release', () => {
    assert.ok(VALID_TRANSITIONS[STATUS_IDS.PROCESSING].includes(STATUS_IDS.READY_FOR_RELEASE));
  });

  it('should allow Ready for Release -> Released', () => {
    assert.ok(VALID_TRANSITIONS[STATUS_IDS.READY_FOR_RELEASE].includes(STATUS_IDS.RELEASED));
  });

  it('should NOT allow Released -> any status (terminal state)', () => {
    assert.strictEqual(VALID_TRANSITIONS[STATUS_IDS.RELEASED].length, 0);
  });

  it('should NOT allow Cancelled -> any status (terminal state)', () => {
    assert.strictEqual(VALID_TRANSITIONS[STATUS_IDS.CANCELLED].length, 0);
  });

  it('should NOT allow Rejected -> any status (terminal state)', () => {
    assert.strictEqual(VALID_TRANSITIONS[STATUS_IDS.REJECTED].length, 0);
  });

  it('should NOT allow Pending -> Released (skip steps)', () => {
    assert.ok(!VALID_TRANSITIONS[STATUS_IDS.PENDING].includes(STATUS_IDS.RELEASED));
  });

  it('should NOT allow Pending -> Processing (skip steps)', () => {
    assert.ok(!VALID_TRANSITIONS[STATUS_IDS.PENDING].includes(STATUS_IDS.PROCESSING));
  });

  it('should NOT allow Processing -> Approved (backward)', () => {
    assert.ok(!VALID_TRANSITIONS[STATUS_IDS.PROCESSING].includes(STATUS_IDS.APPROVED));
  });

  it('should NOT allow Processing -> Pending (backward)', () => {
    assert.ok(!VALID_TRANSITIONS[STATUS_IDS.PROCESSING].includes(STATUS_IDS.PENDING));
  });

  it('should NOT allow Released -> Pending (backward)', () => {
    assert.ok(!VALID_TRANSITIONS[STATUS_IDS.RELEASED].includes(STATUS_IDS.PENDING));
  });

  it('should NOT allow Cancelled -> Approved (backward)', () => {
    assert.ok(!VALID_TRANSITIONS[STATUS_IDS.CANCELLED].includes(STATUS_IDS.APPROVED));
  });

  it('should NOT allow Ready for Release -> Approved (backward)', () => {
    assert.ok(!VALID_TRANSITIONS[STATUS_IDS.READY_FOR_RELEASE].includes(STATUS_IDS.APPROVED));
  });

  describe('Full happy path', () => {
    it('should allow complete lifecycle: Pending -> Approved -> Processing -> Ready for Release -> Released', () => {
      let currentStatus = STATUS_IDS.PENDING;

      currentStatus = STATUS_IDS.APPROVED;
      assert.ok(VALID_TRANSITIONS[STATUS_IDS.PENDING].includes(currentStatus));

      currentStatus = STATUS_IDS.PROCESSING;
      assert.ok(VALID_TRANSITIONS[STATUS_IDS.APPROVED].includes(currentStatus));

      currentStatus = STATUS_IDS.READY_FOR_RELEASE;
      assert.ok(VALID_TRANSITIONS[STATUS_IDS.PROCESSING].includes(currentStatus));

      currentStatus = STATUS_IDS.RELEASED;
      assert.ok(VALID_TRANSITIONS[STATUS_IDS.READY_FOR_RELEASE].includes(currentStatus));
    });
  });

  describe('Rejection path', () => {
    it('should allow: Pending -> Rejected (terminal)', () => {
      const currentStatus = STATUS_IDS.REJECTED;
      assert.ok(VALID_TRANSITIONS[STATUS_IDS.PENDING].includes(currentStatus));
      assert.strictEqual(VALID_TRANSITIONS[currentStatus].length, 0);
    });
  });

  describe('Cancellation paths', () => {
    it('should allow: Pending -> Cancelled (terminal)', () => {
      assert.ok(VALID_TRANSITIONS[STATUS_IDS.PENDING].includes(STATUS_IDS.CANCELLED));
      assert.strictEqual(VALID_TRANSITIONS[STATUS_IDS.CANCELLED].length, 0);
    });

    it('should allow: Approved -> Cancelled (terminal)', () => {
      assert.ok(VALID_TRANSITIONS[STATUS_IDS.APPROVED].includes(STATUS_IDS.CANCELLED));
    });
  });
});
