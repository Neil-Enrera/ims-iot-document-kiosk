const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const path = require('path');
const pool = require(path.join(__dirname, '../../backend/src/config/database'));

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/ws' });

const arduinoClients = new Map();
const kioskClients = new Set();

wss.on('connection', (ws, req) => {
  const params = new URL(req.url, 'http://localhost').searchParams;
  const clientType = params.get('type') || 'kiosk';

  if (clientType === 'arduino') {
    console.log('Arduino connected');
    arduinoClients.set('main', ws);
  } else {
    kioskClients.add(ws);
  }

  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg);
      handleArduinoMessage(data, ws);
    } catch (e) {}
  });

  ws.on('close', () => {
    arduinoClients.delete('main');
    kioskClients.delete(ws);
  });
});

function handleArduinoMessage(data, ws) {
  if (data.type === 'rfid_scan') {
    broadcastToKiosks({ type: 'rfid_scan', data: { uid: data.uid, timestamp: Date.now() } });
  } else if (data.type === 'heartbeat') {
    ws.send(JSON.stringify({ type: 'heartbeat_ack', timestamp: Date.now() }));
  }
}

function broadcastToKiosks(message) {
  const payload = JSON.stringify(message);
  kioskClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

app.post('/api/arduino/command', async (req, res) => {
  const { command, params } = req.body;
  const arduino = arduinoClients.get('main');
  if (!arduino) return res.status(503).json({ error: 'Arduino not connected' });

  arduino.send(JSON.stringify({ command, params, timestamp: Date.now() }));
  res.json({ success: true });
});

app.get('/api/hardware/status', async (req, res) => {
  const arduino = arduinoClients.get('main');
  res.json({
    arduino: arduino ? 'Connected' : 'Disconnected',
    rfid: 'Ready',
    camera: 'Ready',
    printer: 'Offline',
    kioskClients: kioskClients.size
  });
});

app.post('/api/arduino/rfid/verify', async (req, res) => {
  const { uid } = req.body;
  try {
    const [rows] = await pool.query(
      `SELECT r.*, rc.card_uid FROM rfid_cards rc
       JOIN residents r ON rc.resident_id = r.resident_id
       WHERE rc.card_uid = ? AND rc.status = 'Active' AND r.status = 'Active' LIMIT 1`,
      [uid]
    );
    if (rows.length === 0) return res.json({ verified: false, message: 'Card not registered.' });
    const resident = rows[0];
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, module, details, ip_address) VALUES (0, 'RFID_SCAN', 'kiosk', ?, ?)`,
      [JSON.stringify({ uid, result: 'SUCCESS' }), 'kiosk']
    );
    res.json({
      verified: true,
      resident: { id: resident.resident_id, firstName: resident.first_name, lastName: resident.last_name, middleName: resident.middle_name, address: resident.address, contactNumber: resident.contact_number, photo: resident.photo_url }
    });
  } catch (err) {
    res.status(500).json({ error: 'Verification failed' });
  }
});

const PORT = process.env.KIOSK_PORT || 3001;
server.listen(PORT, () => console.log(`Kiosk WebSocket server on port ${PORT}`));
