const kioskRepository = require('../repositories/kiosk.repository');
const http = require('http');

const KIOSK_SERVER_URL = process.env.KIOSK_SERVER_URL || 'http://localhost:3001';

const searchResidents = async (search, limit) => {
  return await kioskRepository.searchResidents(search, limit);
};

const getResidentById = async (id) => {
  return await kioskRepository.findResidentById(id);
};

/**
 * Queries the kiosk-server (hardware/kiosk-server) for live hardware status.
 * Falls back to a safe "disabled" response if the kiosk-server is unreachable.
 */
const getHardwareStatus = async () => {
  try {
    const data = await fetchKioskServerStatus();
    return {
      arduino: data.arduino || 'Disconnected',
      rfid: data.rfid || 'Offline',
      device: data.device || null,
      firmware: data.firmware || null,
      camera: 'Ready',
      printer: 'Offline',
      rfidEnabled: data.arduino === 'Connected'
    };
  } catch {
    // Kiosk-server not running — return safe defaults
    return {
      arduino: 'Offline',
      rfid: 'Offline',
      camera: 'Ready',
      printer: 'Offline',
      rfidEnabled: false
    };
  }
};

/**
 * HTTP GET to the kiosk-server's /api/hardware/status endpoint.
 * Returns the parsed JSON response.
 */
function fetchKioskServerStatus() {
  return new Promise((resolve, reject) => {
    const url = new URL(`${KIOSK_SERVER_URL}/api/hardware/status`);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'GET',
      timeout: 3000
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          reject(new Error('Invalid JSON from kiosk-server'));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Kiosk-server request timeout'));
    });

    req.end();
  });
}

module.exports = { searchResidents, getResidentById, getHardwareStatus };
