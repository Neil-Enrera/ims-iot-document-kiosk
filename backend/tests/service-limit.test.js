const assert = require('assert');
const transactionService = require('../src/services/transaction.service');

(async () => {
  try {
    console.log('Testing 2-service maximum limit in transaction.service...');
    
    // Test 1: 0 services
    const res0 = await transactionService.submitTransaction({ services: [], resident_id: 1 });
    assert.strictEqual(res0.success, false);
    assert.strictEqual(res0.code, 'NO_SERVICES');
    console.log('✔ Test 1: 0 services correctly rejected');

    // Test 2: > 2 services (e.g. 3 services)
    const res3 = await transactionService.submitTransaction({
      services: [
        { service_id: 1, form_data: {} },
        { service_id: 2, form_data: {} },
        { service_id: 3, form_data: {} }
      ],
      resident_id: 1
    });
    assert.strictEqual(res3.success, false);
    assert.strictEqual(res3.code, 'MAX_SERVICES_EXCEEDED');
    assert.strictEqual(res3.message, 'You can select a maximum of 2 services per transaction.');
    console.log('✔ Test 2: 3 services correctly blocked with MAX_SERVICES_EXCEEDED');

    console.log('\nAll 2-service limit unit tests passed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
})();
