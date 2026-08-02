const http = require('http');
const data = JSON.stringify({resident_id: 4, service_id: 1});
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/v1/kiosk/requests',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};
const req = http.request(options, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('Status:', res.statusCode, 'Body:', body));
});
req.on('error', e => console.error('Error:', e.message));
req.write(data);
req.end();