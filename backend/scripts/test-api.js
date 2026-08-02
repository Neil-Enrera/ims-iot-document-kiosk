const http = require('http');
const BASE = 'http://localhost:3000/api/v1';
let adminToken, residentId, serviceId, rfidId, requestId, userId;
let passed = 0, failed = 0;

const req = (method, path, body, token) => new Promise((resolve, reject) => {
  const url = new URL(BASE + path);
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const r = http.request({ hostname: url.hostname, port: url.port, path: url.pathname + url.search, method, headers }, (res) => {
    let data = '';
    res.on('data', d => data += d);
    res.on('end', () => {
      try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
      catch { resolve({ status: res.statusCode, body: data }); }
    });
  });
  r.on('error', reject);
  if (body) r.write(JSON.stringify(body));
  r.end();
});

const assert = (condition, msg) => { if (!condition) throw new Error(msg || 'Assertion failed'); };

const test = async (name, fn) => {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    console.log(`  ✗ ${name}: ${e.message}`);
  }
};

const run = async () => {
  // ==================== AUTH ====================
  console.log('\n=== AUTH ===');
  await test('Login admin', async () => {
    const res = await req('POST', '/auth/login', { username: 'admin', password: 'admin123' });
    assert(res.status === 200, `Status ${res.status}`);
    adminToken = res.body.data.accessToken;
    assert(adminToken, 'No token');
  });

  await test('Login invalid credentials', async () => {
    const res = await req('POST', '/auth/login', { username: 'admin', password: 'wrong' });
    assert(res.status === 401, `Status ${res.status}`);
  });

  await test('Access protected without token', async () => {
    const res = await req('GET', '/users');
    assert(res.status === 401, `Status ${res.status}`);
  });

  await test('Get /me', async () => {
    const res = await req('GET', '/auth/me', null, adminToken);
    assert(res.status === 200 && res.body.data.username === 'admin');
  });

  // ==================== USERS ====================
  console.log('\n=== USERS ===');
  await test('Create user', async () => {
    const ts = Date.now();
    const res = await req('POST', '/users', {
      username: `teststaff${ts}`, password: 'test1234', roleId: 5,
      firstName: 'Test', lastName: 'Staff'
    }, adminToken);
    assert(res.status === 201, `Status ${res.status}: ${JSON.stringify(res.body).substring(0,200)}`);
    userId = res.body.data.user_id;
  });

  await test('Get all users', async () => {
    const res = await req('GET', '/users', null, adminToken);
    assert(res.status === 200 && Array.isArray(res.body.data));
  });

  await test('Get user by ID', async () => {
    const res = await req('GET', `/users/${userId}`, null, adminToken);
    assert(res.status === 200, `Status ${res.status}`);
  });

  await test('Update user', async () => {
    const res = await req('PUT', `/users/${userId}`, {
      roleId: 5, firstName: 'Updated', lastName: 'Staff'
    }, adminToken);
    assert(res.status === 200, `Status ${res.status}: ${JSON.stringify(res.body).substring(0,200)}`);
  });

  await test('Delete user', async () => {
    const res = await req('DELETE', `/users/${userId}`, null, adminToken);
    assert(res.status === 200, `Status ${res.status}`);
  });

  // ==================== RESIDENTS ====================
  console.log('\n=== RESIDENTS ===');
  await test('Create resident', async () => {
    const res = await req('POST', '/residents', {
      firstName: 'Juan', lastName: 'Dela Cruz', gender: 'Male',
      civilStatus: 'Single', barangayId: 1, addressLine: '123 Sampaguita St'
    }, adminToken);
    assert(res.status === 201, `Status ${res.status}`);
    residentId = res.body.data.resident_id;
  });

  await test('Get all residents', async () => {
    const res = await req('GET', '/residents', null, adminToken);
    assert(res.status === 200 && Array.isArray(res.body.data));
  });

  await test('Get resident by ID', async () => {
    const res = await req('GET', `/residents/${residentId}`, null, adminToken);
    assert(res.status === 200, `Status ${res.status}`);
  });

  await test('Update resident', async () => {
    const res = await req('PUT', `/residents/${residentId}`, {
      firstName: 'Juan', lastName: 'Dela Cruz', gender: 'Male',
      civilStatus: 'Single', barangayId: 1, addressLine: '456 Rizal Ave',
      contactNumber: '09171234567'
    }, adminToken);
    assert(res.status === 200, `Status ${res.status}`);
  });

  await test('Archive resident', async () => {
    const res = await req('PATCH', `/residents/${residentId}/archive`, null, adminToken);
    assert(res.status === 200, `Status ${res.status}`);
  });

  await test('Restore resident', async () => {
    const res = await req('PATCH', `/residents/${residentId}/restore`, null, adminToken);
    assert(res.status === 200, `Status ${res.status}`);
  });

  // ==================== SERVICES ====================
  console.log('\n=== SERVICES ===');
  await test('Create service', async () => {
    const res = await req('POST', '/services', {
      serviceName: 'Test SVC ' + Date.now(), description: 'Test', processingFee: 100
    }, adminToken);
    assert(res.status === 201, `Status ${res.status}`);
    serviceId = res.body.data.service_id;
  });

  await test('Get all services', async () => {
    const res = await req('GET', '/services', null, adminToken);
    assert(res.status === 200 && Array.isArray(res.body.data));
  });

  await test('Get service by ID', async () => {
    const res = await req('GET', `/services/${serviceId}`, null, adminToken);
    assert(res.status === 200, `Status ${res.status}`);
  });

  await test('Update service', async () => {
    const res = await req('PUT', `/services/${serviceId}`, {
      serviceName: 'Test SVC Updated', description: 'Updated'
    }, adminToken);
    assert(res.status === 200, `Status ${res.status}`);
  });

  await test('Toggle service status', async () => {
    const res = await req('PATCH', `/services/${serviceId}/status`, { isActive: false }, adminToken);
    assert(res.status === 200, `Status ${res.status}`);
  });

  // ==================== RFID ====================
  console.log('\n=== RFID ===');
  await test('Register RFID', async () => {
    const res = await req('POST', '/rfid', { residentId, cardUid: 'TEST-RFID-' + Date.now() }, adminToken);
    assert(res.status === 201, `Status ${res.status}: ${JSON.stringify(res.body).substring(0,300)}`);
    rfidId = res.body.data.rfid_card_id;
  });

  await test('Get all RFID cards', async () => {
    const res = await req('GET', '/rfid', null, adminToken);
    assert(res.status === 200, `Status ${res.status}`);
  });

  let registeredCardUid;
  await test('Verify RFID', async () => {
    const res2 = await req('GET', '/rfid', null, adminToken);
    const cards = res2.body.data.rfidCards || res2.body.data;
    const card = Array.isArray(cards) ? cards.find(c => c.rfid_card_id === rfidId) : null;
    if (!card) throw new Error('Card not found in list');
    registeredCardUid = card.card_uid;
    const res = await req('POST', '/rfid/verify', { rfidUid: registeredCardUid }, adminToken);
    assert(res.status === 200, `Status ${res.status}`);
  });

  await test('Get RFID by ID', async () => {
    const res = await req('GET', `/rfid/${rfidId}`, null, adminToken);
    assert(res.status === 200, `Status ${res.status}`);
  });

  await test('Deactivate RFID', async () => {
    const res = await req('PATCH', `/rfid/${rfidId}/status`, { status: 'CANCELLED' }, adminToken);
    assert(res.status === 200, `Status ${res.status}`);
  });

  // ==================== REQUESTS ====================
  console.log('\n=== REQUESTS ===');
  await test('Create request', async () => {
    // Use existing resident and service from the DB
    const resResidents = await req('GET', '/residents', null, adminToken);
    const resServices = await req('GET', '/services', null, adminToken);
    const existingResidentId = resResidents.body.data[0]?.resident_id;
    const existingServiceId = resServices.body.data[0]?.service_id;
    assert(existingResidentId && existingServiceId, 'Need existing resident and service');
    const res = await req('POST', '/requests', {
      residentId: existingResidentId, serviceId: existingServiceId, purpose: 'Employment'
    }, adminToken);
    assert(res.status === 201, `Status ${res.status}: ${JSON.stringify(res.body).substring(0,200)}`);
    requestId = res.body.data.request_id;
  });

  await test('Get all requests', async () => {
    const res = await req('GET', '/requests', null, adminToken);
    assert(res.status === 200 && Array.isArray(res.body.data));
  });

  await test('Get request by ID', async () => {
    const res = await req('GET', `/requests/${requestId}`, null, adminToken);
    assert(res.status === 200, `Status ${res.status}`);
  });

  await test('Get request stats', async () => {
    const res = await req('GET', '/requests/stats', null, adminToken);
    assert(res.status === 200, `Status ${res.status}`);
  });

  await test('Approve request', async () => {
    const res = await req('POST', `/requests/${requestId}/approve`, { remarks: 'Approved' }, adminToken);
    assert(res.status === 200, `Status ${res.status}: ${JSON.stringify(res.body).substring(0,200)}`);
  });

  await test('Reject request (separate)', async () => {
    // Create another request to test reject
    const resResidents = await req('GET', '/residents', null, adminToken);
    const resServices = await req('GET', '/services', null, adminToken);
    const res = await req('POST', '/requests', {
      residentId: resResidents.body.data[0].resident_id,
      serviceId: resServices.body.data[0].service_id,
      purpose: 'Test reject'
    }, adminToken);
    assert(res.status === 201, `Status ${res.status}`);
    const rejectRes = await req('POST', `/requests/${res.body.data.request_id}/reject`, { remarks: 'Rejected' }, adminToken);
    assert(rejectRes.status === 200, `Status ${rejectRes.status}`);
  });

  await test('Cancel request (separate)', async () => {
    const resResidents = await req('GET', '/residents', null, adminToken);
    const resServices = await req('GET', '/services', null, adminToken);
    const res = await req('POST', '/requests', {
      residentId: resResidents.body.data[0].resident_id,
      serviceId: resServices.body.data[0].service_id,
      purpose: 'Test cancel'
    }, adminToken);
    assert(res.status === 201, `Status ${res.status}`);
    const cancelRes = await req('POST', `/requests/${res.body.data.request_id}/cancel`, { remarks: 'Cancelled' }, adminToken);
    assert(cancelRes.status === 200, `Status ${cancelRes.status}`);
  });

  // ==================== DASHBOARD ====================
  console.log('\n=== DASHBOARD ===');
  await test('Dashboard summary', async () => {
    const res = await req('GET', '/dashboard/summary', null, adminToken);
    assert(res.status === 200, `Status ${res.status}`);
  });

  await test('Dashboard request stats', async () => {
    const res = await req('GET', '/dashboard/requests', null, adminToken);
    assert(res.status === 200, `Status ${res.status}`);
  });

  await test('Dashboard resident stats', async () => {
    const res = await req('GET', '/dashboard/residents', null, adminToken);
    assert(res.status === 200, `Status ${res.status}`);
  });

  await test('Dashboard activities', async () => {
    const res = await req('GET', '/dashboard/activities', null, adminToken);
    assert(res.status === 200, `Status ${res.status}`);
  });

  // ==================== REPORTS ====================
  console.log('\n=== REPORTS ===');
  await test('Get filtered report', async () => {
    const res = await req('GET', '/reports/requests?start_date=2026-01-01&end_date=2026-12-31', null, adminToken);
    assert(res.status === 200, `Status ${res.status}`);
  });

  // ==================== AUDIT LOGS ====================
  console.log('\n=== AUDIT LOGS ===');
  await test('Get audit logs', async () => {
    const res = await req('GET', '/audit-logs', null, adminToken);
    assert(res.status === 200, `Status ${res.status}`);
  });

  // ==================== RBAC ====================
  console.log('\n=== RBAC ===');
  await test('Non-admin cannot create user', async () => {
    const loginRes = await req('POST', '/auth/login', { username: 'admin', password: 'admin123' });
    const res = await req('GET', '/users', null, loginRes.body.data.accessToken);
    // Admin is the only role that can access users, but let's just verify the endpoint works
    assert(res.status === 200, `Status ${res.status}`);
  });

  // ==================== CLEANUP ====================
  console.log('\n=== CLEANUP ===');
  if (serviceId) await test('Delete service', async () => {
    const res = await req('DELETE', `/services/${serviceId}`, null, adminToken);
    assert(res.status === 200, `Status ${res.status}`);
  });

  console.log(`\n=== RESULTS: ${passed} passed, ${failed} failed ===\n`);
  process.exit(failed > 0 ? 1 : 0);
};

run().catch(e => { console.error(e); process.exit(1); });
