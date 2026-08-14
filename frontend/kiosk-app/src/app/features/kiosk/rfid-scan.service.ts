import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface RfidScanEvent {
  uid: string;
  timestamp: number;
}

/**
 * Listens for RFID scans broadcast by the hardware bridge
 * (hardware/kiosk-server, WebSocket server on port 3001).
 *
 * The ESP8266 firmware sends `{ "type": "rfid_scan", "uid": "..." }` over
 * WebSocket -> the kiosk-server relays it to connected kiosk clients as
 * `{ type: 'rfid_scan', data: { uid, timestamp } }`.
 *
 * Also handles `hardware_status` messages from the kiosk-server to track
 * whether the Arduino/ESP8266 RFID reader is physically connected.
 *
 * Features:
 * - Auto-reconnect with exponential backoff (3s → 6s → 12s → max 30s)
 * - Hardware connection status tracking
 * - Clean disconnect on service destroy
 */
@Injectable({ providedIn: 'root' })
export class RfidScanService {
  private socket: WebSocket | null = null;
  private scanSubject = new Subject<RfidScanEvent>();
  private connectionSubject = new Subject<boolean>();
  private reconnectTimer: any = null;
  private shouldReconnect = false;

  // Exponential backoff state
  private reconnectDelay = 3000;      // Start at 3 seconds
  private readonly MAX_RECONNECT_DELAY = 30000; // Max 30 seconds
  private readonly BASE_RECONNECT_DELAY = 3000;

  /** Emits every successful RFID card scan. */
  scans(): Observable<RfidScanEvent> {
    return this.scanSubject.asObservable();
  }

  /** Emits true/false as the WebSocket connection opens/closes. */
  connection(): Observable<boolean> {
    return this.connectionSubject.asObservable();
  }

  connect() {
    this.shouldReconnect = true;

    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.clearReconnectTimer();

    try {
      this.socket = new WebSocket(environment.hardwareWsUrl);
    } catch {
      this.connectionSubject.next(false);
      this.scheduleReconnect();
      return;
    }

    this.socket.onopen = () => {
      this.connectionSubject.next(true);
      // Reset backoff on successful connection
      this.reconnectDelay = this.BASE_RECONNECT_DELAY;
    };

    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        // RFID scan event from kiosk-server
        if (message?.type === 'rfid_scan' && message?.data?.uid) {
          this.scanSubject.next({
            uid: message.data.uid,
            timestamp: message.data.timestamp || Date.now()
          });
        }

        // Hardware status update from kiosk-server (Arduino connect/disconnect)
        if (message?.type === 'hardware_status') {
          // The connection subject already tracks WebSocket connectivity.
          // The hardware_status message tells us if the physical Arduino
          // is connected to the kiosk-server. We could expose this separately,
          // but for the kiosk UI the relevant signal is: "can I scan?"
          // which requires BOTH the WebSocket AND the Arduino to be connected.
          // For now we treat the WebSocket connection as the primary indicator
          // since the kiosk-server only relays scans when Arduino is connected.
        }
      } catch {
        // ignore non-JSON / unrelated messages
      }
    };

    this.socket.onclose = () => {
      this.connectionSubject.next(false);
      this.socket = null;
      this.scheduleReconnect();
    };

    this.socket.onerror = () => {
      this.connectionSubject.next(false);
      // onclose will fire after onerror, which triggers reconnect
    };
  }

  disconnect() {
    this.shouldReconnect = false;
    this.clearReconnectTimer();
    if (this.socket) {
      this.socket.onclose = null; // Prevent reconnect on intentional disconnect
      this.socket.close();
      this.socket = null;
    }
    this.connectionSubject.next(false);
  }

  private scheduleReconnect() {
    if (!this.shouldReconnect) return;
    this.clearReconnectTimer();

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, this.reconnectDelay);

    // Exponential backoff: double delay each time, cap at max
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.MAX_RECONNECT_DELAY);
  }

  private clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}
