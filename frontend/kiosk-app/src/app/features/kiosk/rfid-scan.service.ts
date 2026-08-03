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
 * The Arduino firmware sends `{ "event": "rfid_scan", "uid": "..." }` over
 * serial -> the serial-service / kiosk-server relays it to connected kiosk
 * clients as `{ type: 'rfid_scan', data: { uid, timestamp } }`.
 */
@Injectable({ providedIn: 'root' })
export class RfidScanService {
  private socket: WebSocket | null = null;
  private scanSubject = new Subject<RfidScanEvent>();
  private connectionSubject = new Subject<boolean>();
  private reconnectTimer: any = null;

  /** Emits every successful RFID card scan. */
  scans(): Observable<RfidScanEvent> {
    return this.scanSubject.asObservable();
  }

  /** Emits true/false as the WebSocket connection opens/closes. */
  connection(): Observable<boolean> {
    return this.connectionSubject.asObservable();
  }

  connect() {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }
    try {
      this.socket = new WebSocket(environment.hardwareWsUrl);
    } catch {
      this.connectionSubject.next(false);
      return;
    }

    this.socket.onopen = () => this.connectionSubject.next(true);

    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message?.type === 'rfid_scan' && message?.data?.uid) {
          this.scanSubject.next({
            uid: message.data.uid,
            timestamp: message.data.timestamp || Date.now()
          });
        }
      } catch {
        // ignore non-JSON / unrelated messages
      }
    };

    this.socket.onclose = () => {
      this.connectionSubject.next(false);
      this.socket = null;
    };

    this.socket.onerror = () => {
      this.connectionSubject.next(false);
    };
  }

  disconnect() {
    clearTimeout(this.reconnectTimer);
    if (this.socket) {
      this.socket.onclose = null;
      this.socket.close();
      this.socket = null;
    }
  }
}
