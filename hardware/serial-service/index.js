require('dotenv').config();
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const http = require('http');

const PORT = process.env.PORT || 'COM3';
const BAUD_RATE = parseInt(process.env.BAUD_RATE) || 9600;
const API_URL = process.env.API_URL || 'http://localhost:3000/api/v1';

let serialPort = null;
let isConnected = false;
let lastRfidUid = null;

function initSerial() {
  try {
    serialPort = new SerialPort({ path: PORT, baudRate: BAUD_RATE });
    const parser = serialPort.pipe(new ReadlineParser({ delimiter: '\n' }));

    serialPort.on('open', () => {
      isConnected = true;
      console.log(`[Serial] Connected to ${PORT} at ${BAUD_RATE} baud`);
      sendCommand('PING');
    });

    serialPort.on('close', () => {
      isConnected = false;
      console.log('[Serial] Connection closed. Reconnecting in 3s...');
      setTimeout(initSerial, 3000);
    });

    serialPort.on('error', (err) => {
      console.error('[Serial] Error:', err.message);
      isConnected = false;
    });

    parser.on('data', (data) => {
      try {
        const event = JSON.parse(data.trim());
        handleArduinoEvent(event);
      } catch (e) {
        console.log('[Serial] Raw:', data.trim());
      }
    });

  } catch (err) {
    console.error('[Serial] Failed to open port:', err.message);
    setTimeout(initSerial, 5000);
  }
}

function sendCommand(cmd) {
  if (serialPort && serialPort.isOpen) {
    serialPort.write(cmd + '\n');
    console.log('[Serial] Sent:', cmd);
  } else {
    console.log('[Serial] Port not open, cannot send:', cmd);
  }
}

function handleArduinoEvent(event) {
  console.log('[Arduino Event]', event);

  switch (event.event) {
    case 'ready':
      console.log('[Kiosk] Arduino is ready');
      break;

    case 'pong':
      console.log('[Kiosk] Arduino responded to ping');
      break;

    case 'rfid_scan':
      lastRfidUid = event.uid;
      console.log('[Kiosk] RFID scanned:', event.uid);
      verifyRfid(event.uid);
      break;

    case 'status':
      console.log('[Kiosk] Arduino status:', event);
      break;

    case 'error':
      console.error('[Kiosk] Arduino error:', event.message);
      break;
  }
}

async function verifyRfid(uid) {
  try {
    const response = await apiRequest('POST', '/rfid/verify', { rfidUid: uid });
    if (response.success) {
      console.log('[Kiosk] RFID verified for resident:', response.data.resident_name);
      sendCommand('BUZZ:200');
      sendCommand('LED:BLINK');
      
      broadcastToFrontend({
        type: 'rfid_verified',
        uid: uid,
        resident: response.data
      });
    } else {
      console.log('[Kiosk] RFID not recognized');
      sendCommand('BUZZ:500');
      
      broadcastToFrontend({
        type: 'rfid_rejected',
        uid: uid,
        message: 'Card not registered'
      });
    }
  } catch (err) {
    console.error('[Kiosk] RFID verification failed:', err.message);
  }
}

function apiRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_URL + path);
    const data = body ? JSON.stringify(body) : null;
    
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(responseData));
        } catch (e) {
          reject(new Error('Invalid JSON response'));
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

// WebSocket server for frontend communication
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('[WS] Frontend connected');
  ws.send(JSON.stringify({ type: 'connected', serialConnected: isConnected }));
});

function broadcastToFrontend(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

// Express server for REST API (hardware status)
const express = require('express');
const app = express();
app.use(express.json());

app.get('/hardware/status', (req, res) => {
  res.json({
    serial: isConnected,
    port: PORT,
    lastRfid: lastRfidUid,
    uptime: process.uptime()
  });
});

app.post('/hardware/command', (req, res) => {
  const { command } = req.body;
  if (command) {
    sendCommand(command);
    res.json({ success: true, message: `Command sent: ${command}` });
  } else {
    res.status(400).json({ success: false, message: 'No command provided' });
  }
});

const SERVER_PORT = process.env.HARDWARE_PORT || 3001;
app.listen(SERVER_PORT, () => {
  console.log(`[Hardware API] Running on port ${SERVER_PORT}`);
});

// Start
console.log('[Kiosk] Starting IMS IoT Serial Service...');
initSerial();
