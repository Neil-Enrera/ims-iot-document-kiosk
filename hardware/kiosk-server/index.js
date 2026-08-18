const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const pool = require(path.join(__dirname, '../../backend/src/config/database'));

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Log all incoming HTTP requests for diagnostics
app.use((req, res, next) => {
  console.log(`[HTTP Server] ${req.method} ${req.url}`);
  next();
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/ws' });

// ============================================================
// Connected Client Tracking
// ============================================================

const arduinoClients = new Map();
const kioskClients = new Set();

// Track Arduino hardware state
let arduinoState = {
  connected: false,
  lastHeartbeat: null,
  device: null,
  firmware: null,
  uptime: 0
};

// Heartbeat timeout: if no heartbeat within this interval, consider Arduino disconnected
const HEARTBEAT_TIMEOUT = 30000; // 30 seconds (heartbeat every 15s with margin)
let heartbeatCheckTimer = null;


// ============================================================
// WebSocket Connection Handling
// ============================================================

wss.on('connection', (ws, req) => {
  const params = new URL(req.url, 'http://localhost').searchParams;
  const clientType = params.get('type') || 'kiosk';

  if (clientType === 'arduino') {
    console.log('[WS] Arduino/ESP8266 connected');
    arduinoClients.set('main', ws);
    arduinoState.connected = true;
    arduinoState.lastHeartbeat = Date.now();
    broadcastHardwareStatus();
    startHeartbeatCheck();
  } else {
    console.log('[WS] Kiosk frontend connected');
    kioskClients.add(ws);
    // Send current hardware status to newly connected kiosk
    ws.send(JSON.stringify({
      type: 'hardware_status',
      data: { arduino: arduinoState.connected }
    }));
  }

  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg);
      if (clientType === 'arduino') {
        handleArduinoMessage(data, ws);
      }
    } catch (e) {
      // Ignore non-JSON messages
    }
  });

  ws.on('close', () => {
    if (clientType === 'arduino') {
      console.log('[WS] Arduino/ESP8266 disconnected');
      arduinoClients.delete('main');
      arduinoState.connected = false;
      arduinoState.device = null;
      arduinoState.firmware = null;
      broadcastHardwareStatus();
    } else {
      kioskClients.delete(ws);
    }
  });

  ws.on('error', (err) => {
    console.error(`[WS] ${clientType} error:`, err.message);
  });
});


// ============================================================
// Arduino Message Handling
// ============================================================

function handleArduinoMessage(data, ws) {
  switch (data.type) {
    case 'rfid_scan':
      console.log('[RFID] Card scanned — UID:', data.uid);
      broadcastToKiosks({
        type: 'rfid_scan',
        data: { uid: data.uid, timestamp: Date.now() }
      });
      break;

    case 'heartbeat':
      arduinoState.lastHeartbeat = Date.now();
      arduinoState.uptime = data.uptime || 0;
      if (!arduinoState.connected) {
        arduinoState.connected = true;
        broadcastHardwareStatus();
      }
      ws.send(JSON.stringify({ type: 'heartbeat_ack', timestamp: Date.now() }));
      break;

    case 'identify':
      arduinoState.device = data.device || 'unknown';
      arduinoState.firmware = data.firmware || 'unknown';
      console.log(`[RFID] Device identified: ${arduinoState.device} (fw ${arduinoState.firmware})`);
      break;

    default:
      break;
  }
}


// ============================================================
// Broadcast Helpers
// ============================================================

function broadcastToKiosks(message) {
  const payload = JSON.stringify(message);
  kioskClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

function broadcastHardwareStatus() {
  broadcastToKiosks({
    type: 'hardware_status',
    data: { arduino: arduinoState.connected }
  });
}


// ============================================================
// Heartbeat Monitoring
// ============================================================
// Periodically check if the Arduino has sent a heartbeat within
// the timeout window. If not, mark it as disconnected.

function startHeartbeatCheck() {
  if (heartbeatCheckTimer) return;
  heartbeatCheckTimer = setInterval(() => {
    if (!arduinoState.connected) return;
    const elapsed = Date.now() - (arduinoState.lastHeartbeat || 0);
    if (elapsed > HEARTBEAT_TIMEOUT) {
      console.log('[RFID] Arduino heartbeat timeout — marking disconnected');
      arduinoState.connected = false;
      broadcastHardwareStatus();
    }
  }, 10000); // Check every 10 seconds
}


// ============================================================
// REST API Endpoints
// ============================================================

// Send a command to the Arduino/ESP8266 (e.g., buzz, blink)
app.post('/api/arduino/command', async (req, res) => {
  const { command, params } = req.body;
  const arduino = arduinoClients.get('main');
  if (!arduino || arduino.readyState !== WebSocket.OPEN) {
    return res.status(503).json({ error: 'Arduino not connected' });
  }

  arduino.send(JSON.stringify({ command, params, timestamp: Date.now() }));
  res.json({ success: true });
});

// Hardware status endpoint (used by backend kiosk.service.js and admin panel)
app.get('/api/hardware/status', async (req, res) => {
  const arduino = arduinoClients.get('main');
  const isConnected = !!(arduino && arduino.readyState === WebSocket.OPEN && arduinoState.connected);

  res.json({
    arduino: isConnected ? 'Connected' : 'Disconnected',
    rfid: isConnected ? 'Ready' : 'Offline',
    device: arduinoState.device,
    firmware: arduinoState.firmware,
    lastHeartbeat: arduinoState.lastHeartbeat,
    uptime: arduinoState.uptime,
    kioskClients: kioskClients.size
  });
});

// Webcam capture endpoint
app.post('/api/hardware/capture', (req, res) => {
  console.log('[Webcam] Capture request received from tablet');
  const tempFilename = `capture_${Date.now()}.bmp`;
  const outputPath = path.join(__dirname, tempFilename);
  
  // Call CommandCam specifying device 1 (Webcam) using relative path and CWD
  const cmd = `CommandCam.exe /devnum 1 /filename "${tempFilename}" /delay 500`;
  
  exec(cmd, { cwd: __dirname }, (error, stdout, stderr) => {
    if (error) {
      console.error('[Webcam] CommandCam failed:', error.message);
      console.error('[Webcam] stdout:', stdout);
      console.error('[Webcam] stderr:', stderr);
      return res.status(500).json({ 
        success: false, 
        error: `Webcam capture failed: ${error.message}` 
      });
    }
    
    // Check if file exists
    if (!fs.existsSync(outputPath)) {
      return res.status(500).json({ success: false, error: 'Captured file not found' });
    }
    
    try {
      // Read file and convert to base64
      const imageBuffer = fs.readFileSync(outputPath);
      const base64Image = `data:image/bmp;base64,${imageBuffer.toString('base64')}`;
      
      // Delete temporary file
      fs.unlinkSync(outputPath);
      
      console.log('[Webcam] Image captured and converted successfully');
      res.json({ success: true, image: base64Image });
    } catch (readError) {
      console.error('[Webcam] File operation failed:', readError.message);
      res.status(500).json({ success: false, error: 'Failed to process captured image' });
    }
  });
});

// RFID verification via database (direct — used by serial-service path)
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
    console.error('[RFID Verify] Error:', err.message);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// ============================================================
// Start Server
// ============================================================

const PORT = process.env.KIOSK_PORT || 3001;
server.listen(PORT, () => console.log(`[Kiosk Server] WebSocket + REST on port ${PORT}`));
