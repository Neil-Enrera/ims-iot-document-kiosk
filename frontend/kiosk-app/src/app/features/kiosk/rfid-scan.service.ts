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
 * WebSocket / USB Serial -> the kiosk-server relays it to connected kiosk clients as
 * `{ type: 'rfid_scan', data: { uid, timestamp } }`.
 *
 * Also handles `hardware_status` messages from the kiosk-server to track
 * whether the Arduino/ESP8266 RFID reader is physically connected.
 */
@Injectable({ providedIn: 'root' })
export class RfidScanService {
  private socket: WebSocket | null = null;
  private scanSubject = new Subject<RfidScanEvent>();
  private connectionSubject = new Subject<boolean>();
  private reconnectTimer: any = null;
  private shouldReconnect = false;

  // Exponential backoff state
  private reconnectDelay = 2000;
  private readonly MAX_RECONNECT_DELAY = 15000;
  private readonly BASE_RECONNECT_DELAY = 2000;

  /** Emits every successful RFID card scan. */
  scans(): Observable<RfidScanEvent> {
    return this.scanSubject.asObservable();
  }

  /** Emits true/false as the WebSocket connection opens/closes. */
  connection(): Observable<boolean> {
    return this.connectionSubject.asObservable();
  }

  private getHardwareWsUrl(): string {
    if (typeof window !== 'undefined' && window.location && window.location.hostname) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.hostname;
      return `${protocol}//${host}:3001/ws?type=kiosk`;
    }
    return environment.hardwareWsUrl;
  }

  connect() {
    this.shouldReconnect = true;

    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.clearReconnectTimer();

    const wsUrl = this.getHardwareWsUrl();
    console.log('[RfidScanService] Connecting to hardware WS:', wsUrl);

    try {
      this.socket = new WebSocket(wsUrl);
    } catch (err) {
      console.warn('[RfidScanService] WebSocket creation error:', err);
      this.connectionSubject.next(false);
      this.scheduleReconnect();
      return;
    }

    this.socket.onopen = () => {
      console.log('[RfidScanService] WebSocket connected to kiosk hardware server');
      this.connectionSubject.next(true);
      this.reconnectDelay = this.BASE_RECONNECT_DELAY;
    };

    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('[RfidScanService] WS message received:', message);

        // RFID scan event from kiosk-server
        if (message?.type === 'rfid_scan' && message?.data?.uid) {
          const cleanUid = String(message.data.uid).trim().toUpperCase();
          console.log('[RfidScanService] RFID Scan detected:', cleanUid);
          this.scanSubject.next({
            uid: cleanUid,
            timestamp: message.data.timestamp || Date.now()
          });
        }

        // Hardware status update
        if (message?.type === 'hardware_status') {
          const isHwConnected = !!message?.data?.arduino;
          this.connectionSubject.next(isHwConnected);
        }
      } catch (err) {
        console.warn('[RfidScanService] Error parsing WS message:', err);
      }
    };

    this.socket.onclose = (event) => {
      console.log('[RfidScanService] WebSocket closed:', event.code, event.reason);
      this.connectionSubject.next(false);
      this.socket = null;
      this.scheduleReconnect();
    };

    this.socket.onerror = (err) => {
      console.warn('[RfidScanService] WebSocket error:', err);
      this.connectionSubject.next(false);
    };
  }

  disconnect() {
    this.shouldReconnect = false;
    this.clearReconnectTimer();
    if (this.socket) {
      this.socket.onclose = null;
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

    this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, this.MAX_RECONNECT_DELAY);
  }

  private clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}

