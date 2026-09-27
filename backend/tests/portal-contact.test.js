const { test } = require('node:test');
const assert = require('node:assert');
const express = require('express');
const routes = require('../src/routes/api');

test('Contact Us API Routes Integration', async (t) => {
  const app = express();
  app.use(express.json());
  app.use('/api/v1', routes);

  // Helper request
  const request = (url, method = 'GET', body = null) => {
    return new Promise((resolve) => {
      const http = require('http');
      const server = app.listen(0, async () => {
        const port = server.address().port;
        const options = {
          hostname: '127.0.0.1',
          port,
          path: url,
          method,
          headers: { 'Content-Type': 'application/json' }
        };

        const req = http.request(options, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            server.close();
            try {
              resolve({ status: res.statusCode, body: JSON.parse(data) });
            } catch {
              resolve({ status: res.statusCode, body: data });
            }
          });
        });

        if (body) {
          req.write(JSON.stringify(body));
        }
        req.end();
      });
    });
  };

  await t.test('GET /api/v1/portal/contact-info returns barangay contact details', async () => {
    const res = await request('/api/v1/portal/contact-info', 'GET');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.barangayName, 'Barangay San Manuel');
    assert.ok(res.body.data.officeAddress.includes('City of San Jose del Monte'));
  });

  await t.test('POST /api/v1/portal/contact validates required fields', async () => {
    const res = await request('/api/v1/portal/contact', 'POST', {});
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.message, 'Full name is required.');
  });

  await t.test('POST /api/v1/portal/contact sends message successfully', async () => {
    const res = await request('/api/v1/portal/contact', 'POST', {
      fullName: 'Juan Dela Cruz',
      email: 'juan@example.com',
      phoneNumber: '09123456789',
      subject: 'General Inquiry',
      message: 'Hello, I have a question regarding document requests.'
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.message.includes('sent successfully'));
  });
});
