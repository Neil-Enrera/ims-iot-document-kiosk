const http = require('http');
const options = { hostname: 'localhost', port: 3000, path: '/api/v1/health', method: 'GET' };
const req = http.request(options, (res) => { let b=''; res.on('data',c=>b+=c); res.on('end',()=>console.log('Health:',res.statusCode,b)); });
req.on('error',e=>console.error('Err:',e.message));
req.end();