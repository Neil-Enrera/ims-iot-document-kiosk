const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
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
  connectionType: null, // 'ws' | 'serial'
  lastHeartbeat: null,
  device: null,
  firmware: null,
  uptime: 0,
  serialPort: null
};

// Heartbeat timeout: if no heartbeat within this interval, consider Arduino disconnected
const HEARTBEAT_TIMEOUT = 30000; // 30 seconds
let heartbeatCheckTimer = null;
let lastProcessedScan = { uid: '', time: 0 };

// ============================================================
// WebSocket Connection Handling
// ============================================================

wss.on('connection', (ws, req) => {
  const params = new URL(req.url, 'http://localhost').searchParams;
  const clientType = params.get('type') || 'kiosk';

  if (clientType === 'arduino') {
    console.log('[WS] Arduino/ESP8266 connected via WebSocket');
    arduinoClients.set('main', ws);
    arduinoState.connected = true;
    arduinoState.connectionType = 'ws';
    arduinoState.lastHeartbeat = Date.now();
    broadcastHardwareStatus();
    startHeartbeatCheck();
  } else {
    console.log('[WS] Kiosk frontend connected');
    kioskClients.add(ws);
    // Send current hardware status to newly connected kiosk
    ws.send(JSON.stringify({
      type: 'hardware_status',
      data: { arduino: isHardwareConnected() }
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
      console.log('[WS] Arduino/ESP8266 WebSocket disconnected');
      arduinoClients.delete('main');
      if (arduinoState.connectionType === 'ws') {
        arduinoState.connected = false;
        arduinoState.device = null;
        arduinoState.firmware = null;
      }
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
// Arduino Message & RFID Processing
// ============================================================

function processRfidScan(uid, source = 'ws') {
  if (!uid) return;
  const cleanUid = String(uid).replace(/[:\s-]/g, '').toUpperCase();
  const now = Date.now();

  // Debounce duplicate scans within 1.5s
  if (lastProcessedScan.uid === cleanUid && now - lastProcessedScan.time < 1500) {
    return;
  }

  lastProcessedScan = { uid: cleanUid, time: now };
  arduinoState.lastHeartbeat = now;
  if (!arduinoState.connected) {
    arduinoState.connected = true;
    arduinoState.connectionType = source;
    broadcastHardwareStatus();
  }

  console.log(`[RFID] Card scanned (${source}) — UID:`, cleanUid);
  broadcastToKiosks({
    type: 'rfid_scan',
    data: { uid: cleanUid, timestamp: now }
  });
}

function handleArduinoMessage(data, ws) {
  switch (data.type) {
    case 'rfid_scan':
      processRfidScan(data.uid, 'ws');
      break;

    case 'heartbeat':
      arduinoState.lastHeartbeat = Date.now();
      arduinoState.uptime = data.uptime || 0;
      if (!arduinoState.connected) {
        arduinoState.connected = true;
        arduinoState.connectionType = 'ws';
        broadcastHardwareStatus();
      }
      ws.send(JSON.stringify({ type: 'heartbeat_ack', timestamp: Date.now() }));
      break;

    case 'identify':
      arduinoState.device = data.device || 'esp8266_rfid';
      arduinoState.firmware = data.firmware || '1.0.0';
      console.log(`[RFID] Device identified (WS): ${arduinoState.device} (fw ${arduinoState.firmware})`);
      break;

    default:
      break;
  }
}

// ============================================================
// USB Serial Communication (COM4 / CH340 Auto-Reader)
// ============================================================

let serialPortInstance = null;
let serialParser = null;
let serialReconnectTimer = null;

async function initSerialConnection() {
  if (serialPortInstance && serialPortInstance.isOpen) return;

  try {
    const ports = await SerialPort.list();
    // Prioritize CH340 / USB-Serial / COM4
    const targetPort = ports.find(p =>
      p.path === 'COM4' ||
      (p.friendlyName && /CH340|USB-Serial|Arduino|NodeMCU/i.test(p.friendlyName)) ||
      (p.manufacturer && /wch|arduino/i.test(p.manufacturer))
    ) || (ports.length > 0 ? ports[0] : null);

    if (!targetPort) {
      scheduleSerialReconnect();
      return;
    }

    console.log(`[Serial] Connecting to ESP8266 on ${targetPort.path} (${targetPort.friendlyName || 'USB Serial'})...`);
    serialPortInstance = new SerialPort({
      path: targetPort.path,
      baudRate: 115200,
      autoOpen: false
    });

    serialParser = serialPortInstance.pipe(new ReadlineParser({ delimiter: '\r\n' }));

    serialPortInstance.open((err) => {
      if (err) {
        console.warn(`[Serial] Could not open ${targetPort.path}:`, err.message);
        scheduleSerialReconnect();
        return;
      }

      console.log(`[Serial] Connected to ESP8266 on ${targetPort.path}`);
      arduinoState.connected = true;
      arduinoState.connectionType = 'serial';
      arduinoState.serialPort = targetPort.path;
      arduinoState.device = 'esp8266_serial';
      arduinoState.firmware = '1.0.0';
      arduinoState.lastHeartbeat = Date.now();
      broadcastHardwareStatus();
      startHeartbeatCheck();
    });

    serialParser.on('data', (line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      arduinoState.lastHeartbeat = Date.now();

      // Check for "Card UID: <UID>"
      const match = trimmed.match(/Card UID:\s*([A-F0-9]+)/i);
      if (match && match[1]) {
        processRfidScan(match[1], 'serial');
        return;
      }

      // Check for JSON: {"type":"rfid_scan","uid":"..."}
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (parsed.type === 'rfid_scan' && parsed.uid) {
            processRfidScan(parsed.uid, 'serial');
          }
        } catch {}
      }
    });

    serialPortInstance.on('close', () => {
      console.log('[Serial] Serial port closed');
      if (arduinoState.connectionType === 'serial') {
        arduinoState.connected = false;
        arduinoState.serialPort = null;
        broadcastHardwareStatus();
      }
      serialPortInstance = null;
      scheduleSerialReconnect();
    });

    serialPortInstance.on('error', (err) => {
      console.warn('[Serial] Error:', err.message);
      scheduleSerialReconnect();
    });

  } catch (err) {
    console.warn('[Serial] Scan error:', err.message);
    scheduleSerialReconnect();
  }
}

function scheduleSerialReconnect() {
  if (serialReconnectTimer) return;
  serialReconnectTimer = setTimeout(() => {
    serialReconnectTimer = null;
    initSerialConnection();
  }, 5000);
}

// Start serial port listener
initSerialConnection();

// ============================================================
// Broadcast Helpers
// ============================================================

function isHardwareConnected() {
  const wsArduino = arduinoClients.get('main');
  const wsOk = !!(wsArduino && wsArduino.readyState === WebSocket.OPEN);
  const serialOk = !!(serialPortInstance && serialPortInstance.isOpen);
  return wsOk || serialOk || arduinoState.connected;
}

function broadcastToKiosks(message) {
  const payload = JSON.stringify(message);
  kioskClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

function broadcastHardwareStatus() {
  const connected = isHardwareConnected();
  broadcastToKiosks({
    type: 'hardware_status',
    data: { arduino: connected }
  });
}

// ============================================================
// Heartbeat Monitoring
// ============================================================

function startHeartbeatCheck() {
  if (heartbeatCheckTimer) return;
  heartbeatCheckTimer = setInterval(() => {
    const elapsed = Date.now() - (arduinoState.lastHeartbeat || 0);
    const wsArduino = arduinoClients.get('main');
    const wsOk = !!(wsArduino && wsArduino.readyState === WebSocket.OPEN);
    const serialOk = !!(serialPortInstance && serialPortInstance.isOpen);

    if (!wsOk && !serialOk && elapsed > HEARTBEAT_TIMEOUT) {
      if (arduinoState.connected) {
        console.log('[RFID] Arduino heartbeat timeout — marking disconnected');
        arduinoState.connected = false;
        broadcastHardwareStatus();
      }
    }
  }, 10000);
}

// ============================================================
// REST API Endpoints
// ============================================================

// Send a command to the Arduino/ESP8266 (e.g., buzz, blink)
app.post('/api/arduino/command', async (req, res) => {
  const { command, params } = req.body;
  const payload = JSON.stringify({ command, params, timestamp: Date.now() });

  let sent = false;
  const arduino = arduinoClients.get('main');
  if (arduino && arduino.readyState === WebSocket.OPEN) {
    arduino.send(payload);
    sent = true;
  }

  if (serialPortInstance && serialPortInstance.isOpen) {
    serialPortInstance.write(payload + '\n');
    sent = true;
  }

  if (!sent) {
    return res.status(503).json({ error: 'Arduino not connected' });
  }

  res.json({ success: true });
});

// Hardware status endpoint (used by backend kiosk.service.js and admin panel)
app.get('/api/hardware/status', async (req, res) => {
  const connected = isHardwareConnected();

  res.json({
    arduino: connected ? 'Connected' : 'Disconnected',
    rfid: connected ? 'Ready' : 'Offline',
    device: arduinoState.device || (connected ? 'esp8266_rfid' : null),
    firmware: arduinoState.firmware || (connected ? '1.0.0' : null),
    connectionType: arduinoState.connectionType,
    serialPort: arduinoState.serialPort,
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

// RFID verification via database (direct fallback)
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
server.listen(PORT, () => console.log(`[Kiosk Server] Dual Serial/WS + REST on port ${PORT}`));

