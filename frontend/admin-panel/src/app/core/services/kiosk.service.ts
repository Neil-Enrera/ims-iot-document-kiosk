import { Injectable, signal } from '@angular/core';

export interface HardwareStatus {
  serial: boolean;
  port: string;
  lastRfid: string | null;
  uptime: number;
}

export interface RfidEvent {
  type: 'rfid_verified' | 'rfid_rejected';
  uid: string;
  resident?: any;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class KioskService {
  private ws: WebSocket | null = null;
  private readonly WS_URL = 'ws://localhost:8080';
  private readonly HARDWARE_API = 'http://localhost:3001';
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private readonly BASE_RECONNECT_DELAY = 3000;
  private reconnectTimer: any = null;

  isConnected = signal(false);
  hardwareStatus = signal<HardwareStatus | null>(null);
  lastRfidEvent = signal<RfidEvent | null>(null);

  connect() {
    // Stop retrying if max attempts reached
    if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      console.warn('[Kiosk] Max reconnect attempts reached. Giving up.');
      return;
    }

    this.ws = new WebSocket(this.WS_URL);

    this.ws.onopen = () => {
      this.isConnected.set(true);
      this.reconnectAttempts = 0; // Reset on successful connection
      console.log('[Kiosk] WebSocket connected');
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (e) {
        console.error('[Kiosk] Failed to parse message:', e);
      }
    };

    this.ws.onclose = () => {
      this.isConnected.set(false);
      this.reconnectAttempts++;
      // Exponential backoff: 3s, 6s, 12s, 24s, 48s
      const delay = Math.min(this.BASE_RECONNECT_DELAY * Math.pow(2, this.reconnectAttempts - 1), 60000);
      console.log(`[Kiosk] WebSocket disconnected. Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS})`);
      this.reconnectTimer = setTimeout(() => this.connect(), delay);
    };

    this.ws.onerror = (error) => {
      console.error('[Kiosk] WebSocket error:', error);
    };
  }

  private handleMessage(data: any) {
    switch (data.type) {
      case 'rfid_verified':
      case 'rfid_rejected':
        this.lastRfidEvent.set(data);
        break;
      case 'connected':
        this.isConnected.set(true);
        break;
    }
  }

  sendCommand(command: string) {
    fetch(`${this.HARDWARE_API}/hardware/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command })
    }).catch(err => console.error('[Kiosk] Command failed:', err));
  }

  enableReader() { this.sendCommand('ENABLE_READER'); }
  disableReader() { this.sendCommand('DISABLE_READER'); }
  beep(duration = 100) { this.sendCommand(`BUZZ:${duration}`); }
  ledOn() { this.sendCommand('LED:ON'); }
  ledOff() { this.sendCommand('LED:OFF'); }
  ledBlink() { this.sendCommand('LED:BLINK'); }
  ping() { this.sendCommand('PING'); }

  refreshStatus() {
    fetch(`${this.HARDWARE_API}/hardware/status`)
      .then(res => res.json())
      .then(data => this.hardwareStatus.set(data))
      .catch(err => console.error('[Kiosk] Status fetch failed:', err));
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.reconnectAttempts = 0;
    this.ws?.close();
  }
}
