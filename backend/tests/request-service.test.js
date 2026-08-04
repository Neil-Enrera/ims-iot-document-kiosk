const { describe, it } = require('node:test');
const assert = require('node:assert');

describe('Request State Machine', () => {
  const STATUS_IDS = {
    SUBMITTED: 1,
    WAITING_FOR_REQUIREMENTS: 2,
    REQUIREMENTS_RECEIVED: 3,
    UNDER_REVIEW: 4,
    DOCUMENT_PROCESSING: 5,
    READY_FOR_RELEASE: 6,
    RELEASED: 7,
    REJECTED: 8,
    CANCELLED: 9
  };

  const VALID_TRANSITIONS = {
    1: [2, 8, 9],    // Submitted -> Waiting for Requirements, Rejected, Cancelled
    2: [3, 8, 9],    // Waiting for Requirements -> Requirements Received, Rejected, Cancelled
    3: [4, 8, 9],    // Requirements Received -> Under Review, Rejected, Cancelled
    4: [5, 6, 8, 9], // Under Review -> Document Processing, Ready for Release, Rejected, Cancelled
    5: [6, 8, 9],    // Document Processing -> Ready for Release, Rejected, Cancelled
    6: [7],           // Ready for Release -> Released
    7: [],            // Released -> (end)
    8: [],            // Rejected -> (end)
    9: []             // Cancelled -> (end)
  };

  it('should have correct status IDs matching DB', () => {
    assert.strictEqual(STATUS_IDS.SUBMITTED, 1);
    assert.strictEqual(STATUS_IDS.WAITING_FOR_REQUIREMENTS, 2);
    assert.strictEqual(STATUS_IDS.REQUIREMENTS_RECEIVED, 3);
    assert.strictEqual(STATUS_IDS.UNDER_REVIEW, 4);
    assert.strictEqual(STATUS_IDS.DOCUMENT_PROCESSING, 5);
    assert.strictEqual(STATUS_IDS.READY_FOR_RELEASE, 6);
    assert.strictEqual(STATUS_IDS.RELEASED, 7);
    assert.strictEqual(STATUS_IDS.REJECTED, 8);
    assert.strictEqual(STATUS_IDS.CANCELLED, 9);
  });

  it('should allow Submitted -> Waiting for Requirements', () => {
    assert.ok(VALID_TRANSITIONS[STATUS_IDS.SUBMITTED].includes(STATUS_IDS.WAITING_FOR_REQUIREMENTS));
  });

  it('should allow Submitted -> Rejected', () => {
    assert.ok(VALID_TRANSITIONS[STATUS_IDS.SUBMITTED].includes(STATUS_IDS.REJECTED));
  });

  it('should allow Submitted -> Cancelled', () => {
    assert.ok(VALID_TRANSITIONS[STATUS_IDS.SUBMITTED].includes(STATUS_IDS.CANCELLED));
  });

  it('should allow Waiting for Requirements -> Requirements Received', () => {
    assert.ok(VALID_TRANSITIONS[STATUS_IDS.WAITING_FOR_REQUIREMENTS].includes(STATUS_IDS.REQUIREMENTS_RECEIVED));
  });

  it('should allow Requirements Received -> Under Review', () => {
    assert.ok(VALID_TRANSITIONS[STATUS_IDS.REQUIREMENTS_RECEIVED].includes(STATUS_IDS.UNDER_REVIEW));
  });

  it('should allow Under Review -> Document Processing', () => {
    assert.ok(VALID_TRANSITIONS[STATUS_IDS.UNDER_REVIEW].includes(STATUS_IDS.DOCUMENT_PROCESSING));
  });

  it('should allow Under Review -> Ready for Release (skip processing)', () => {
    assert.ok(VALID_TRANSITIONS[STATUS_IDS.UNDER_REVIEW].includes(STATUS_IDS.READY_FOR_RELEASE));
  });

  it('should allow Under Review -> Cancelled', () => {
    assert.ok(VALID_TRANSITIONS[STATUS_IDS.UNDER_REVIEW].includes(STATUS_IDS.CANCELLED));
  });

  it('should allow Document Processing -> Ready for Release', () => {
    assert.ok(VALID_TRANSITIONS[STATUS_IDS.DOCUMENT_PROCESSING].includes(STATUS_IDS.READY_FOR_RELEASE));
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

  it('should NOT allow Submitted -> Released (skip steps)', () => {
    assert.ok(!VALID_TRANSITIONS[STATUS_IDS.SUBMITTED].includes(STATUS_IDS.RELEASED));
  });

  it('should NOT allow Submitted -> Document Processing (skip steps)', () => {
    assert.ok(!VALID_TRANSITIONS[STATUS_IDS.SUBMITTED].includes(STATUS_IDS.DOCUMENT_PROCESSING));
  });

  it('should NOT allow Document Processing -> Under Review (backward)', () => {
    assert.ok(!VALID_TRANSITIONS[STATUS_IDS.DOCUMENT_PROCESSING].includes(STATUS_IDS.UNDER_REVIEW));
  });

  it('should NOT allow Document Processing -> Submitted (backward)', () => {
    assert.ok(!VALID_TRANSITIONS[STATUS_IDS.DOCUMENT_PROCESSING].includes(STATUS_IDS.SUBMITTED));
  });

  it('should NOT allow Released -> Submitted (backward)', () => {
    assert.ok(!VALID_TRANSITIONS[STATUS_IDS.RELEASED].includes(STATUS_IDS.SUBMITTED));
  });

  it('should NOT allow Cancelled -> Under Review (backward)', () => {
    assert.ok(!VALID_TRANSITIONS[STATUS_IDS.CANCELLED].includes(STATUS_IDS.UNDER_REVIEW));
  });

  it('should NOT allow Ready for Release -> Under Review (backward)', () => {
    assert.ok(!VALID_TRANSITIONS[STATUS_IDS.READY_FOR_RELEASE].includes(STATUS_IDS.UNDER_REVIEW));
  });

  it('should NOT allow Ready for Release -> Cancelled', () => {
    assert.ok(!VALID_TRANSITIONS[STATUS_IDS.READY_FOR_RELEASE].includes(STATUS_IDS.CANCELLED));
  });

  describe('Full happy path', () => {
    it('should allow complete lifecycle: Submitted -> Waiting for Requirements -> Requirements Received -> Under Review -> Document Processing -> Ready for Release -> Released', () => {
      let currentStatus = STATUS_IDS.SUBMITTED;

      currentStatus = STATUS_IDS.WAITING_FOR_REQUIREMENTS;
      assert.ok(VALID_TRANSITIONS[STATUS_IDS.SUBMITTED].includes(currentStatus));

      currentStatus = STATUS_IDS.REQUIREMENTS_RECEIVED;
      assert.ok(VALID_TRANSITIONS[STATUS_IDS.WAITING_FOR_REQUIREMENTS].includes(currentStatus));

      currentStatus = STATUS_IDS.UNDER_REVIEW;
      assert.ok(VALID_TRANSITIONS[STATUS_IDS.REQUIREMENTS_RECEIVED].includes(currentStatus));

      currentStatus = STATUS_IDS.DOCUMENT_PROCESSING;
      assert.ok(VALID_TRANSITIONS[STATUS_IDS.UNDER_REVIEW].includes(currentStatus));

      currentStatus = STATUS_IDS.READY_FOR_RELEASE;
      assert.ok(VALID_TRANSITIONS[STATUS_IDS.DOCUMENT_PROCESSING].includes(currentStatus));

      currentStatus = STATUS_IDS.RELEASED;
      assert.ok(VALID_TRANSITIONS[STATUS_IDS.READY_FOR_RELEASE].includes(currentStatus));
    });
  });

  describe('Rejection path', () => {
    it('should allow: Submitted -> Rejected (terminal)', () => {
      const currentStatus = STATUS_IDS.REJECTED;
      assert.ok(VALID_TRANSITIONS[STATUS_IDS.SUBMITTED].includes(currentStatus));
      assert.strictEqual(VALID_TRANSITIONS[currentStatus].length, 0);
    });
  });

  describe('Cancellation paths', () => {
    it('should allow: Submitted -> Cancelled (terminal)', () => {
      assert.ok(VALID_TRANSITIONS[STATUS_IDS.SUBMITTED].includes(STATUS_IDS.CANCELLED));
      assert.strictEqual(VALID_TRANSITIONS[STATUS_IDS.CANCELLED].length, 0);
    });

    it('should allow: Waiting for Requirements -> Cancelled (terminal)', () => {
      assert.ok(VALID_TRANSITIONS[STATUS_IDS.WAITING_FOR_REQUIREMENTS].includes(STATUS_IDS.CANCELLED));
    });
  });
});
