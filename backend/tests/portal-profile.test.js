const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const app = require('../src/app');
const jwt = require('jsonwebtoken');
const config = require('../src/config/environment');

test('Portal Profile API Route Registration', async (t) => {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  const dummyToken = jwt.sign(
    { portalAccountId: 1, accountId: 'RES-00001', residentId: 1, type: 'portal' },
    config.jwt.secret,
    { expiresIn: '1h' }
  );

  const request = (path, method = 'PUT', body = {}) => {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(body);
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port,
          path,
          method,
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data),
            Authorization: `Bearer ${dummyToken}`
          }
        },
        (res) => {
          let resData = '';
          res.on('data', (chunk) => (resData += chunk));
          res.on('end', () => {
            try {
              resolve({ status: res.statusCode, body: JSON.parse(resData) });
            } catch {
              resolve({ status: res.statusCode, body: resData });
            }
          });
        }
      );
      req.on('error', reject);
      req.write(data);
      req.end();
    });
  };

  t.after(() => {
    server.close();
  });

  await t.test('PUT /api/v1/portal/profile should be registered and not return 404', async () => {
    const res = await request('/api/v1/portal/profile', 'PUT', { contact_number: '09123456789' });
    assert.notEqual(res.status, 404, `Route /api/v1/portal/profile returned 404: ${JSON.stringify(res.body)}`);
  });

  await t.test('PUT /api/v1/portal/me should be registered and not return 404', async () => {
    const res = await request('/api/v1/portal/me', 'PUT', { contact_number: '09123456789' });
    assert.notEqual(res.status, 404, `Route /api/v1/portal/me returned 404: ${JSON.stringify(res.body)}`);
  });
});
