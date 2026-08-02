import { Injectable } from '@angular/core';

/**
 * The resident identification method currently in use.
 *
 * - 'rfid':   Reads the resident's RFID-enabled Barangay ID card (PRODUCTION).
 * - 'search': Temporary fallback that lets the resident search their name
 *             manually (used while the RFID reader hardware is unavailable).
 */
export type IdentificationMethod = 'rfid' | 'search';

@Injectable({ providedIn: 'root' })
export class IdentificationService {
  /**
   * TEMPORARY DEVELOPMENT SETTING.
   *
   * Set to 'rfid' once the RFID reader is deployed. No other code changes are
   * required — the kiosk automatically switches from the name-search screen to
   * an RFID scan for resident identification.
   */
  private readonly METHOD: IdentificationMethod = 'search';

  /** The currently configured identification method. */
  get method(): IdentificationMethod {
    return this.METHOD;
  }

  /** True when the temporary name-search fallback is active. */
  get isTemporarySearch(): boolean {
    return this.METHOD === 'search';
  }
}
