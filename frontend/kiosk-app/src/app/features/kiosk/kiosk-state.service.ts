import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Resident, Service, FormField, RfidCardInfo } from './kiosk.service';

export interface KioskState {
  mode: 'home' | 'rfid' | 'guest' | 'documents' | 'barangay';
  rfidStep: 'scan' | 'search' | 'error';
  currentStep: 'welcome' | 'guest-info' | 'services' | 'requirements' | 'form' | 'photo' | 'review' | 'success';
  barangayStep: 'requirements' | 'form' | 'photo' | 'signature' | 'review' | 'success';
  resident: Resident | null;
  rfidCard?: RfidCardInfo | null;
  selectedService: Service | null;
  selectedServices: Service[];
  serviceIndex: number;
  serviceForms: Record<number, Record<string, unknown>>;
  servicePhotos: Record<number, string>;
  barangayService: Service | null;
  capturedPhoto: string | null;
  capturedSignature: string | null;
  requestNumber: string;
  formValues: Record<string, unknown>;
  inlinePhotos: Record<string, string>;
  activePhotoField: string | null;
  guestForm: {
    fullName?: string;
    firstName: string;
    middleName: string;
    lastName: string;
    suffix: string;
    birthDate: string;
    birthPlace: string;
    gender: string;
    civilStatus: string;
    nationality: string;
    religion: string;
    occupation: string;
    bloodType: string;
    contactNumber: string;
    email: string;
    subdivision: string;
    street: string;
    block: string;
    lot: string;
    houseNumber: string;
    purokZone: string;
    sitio: string;
    municipality: string;
    province: string;
    zipCode: string;
    address: string;
  };
  barangayForm: {
    firstName: string;
    middleName: string;
    lastName: string;
    suffix: string;
    birthDate: string;
    birthPlace?: string;
    gender: string;
    civilStatus: string;
    occupation: string;
    bloodType: string;
    addressLine: string;
    contactNumber: string;
    email: string;
    emergencyContactName: string;
    emergencyContactNumber: string;
  };
  submissionKey: string;
  language?: 'en' | 'fil';
  timestamp: number;
}

const STORAGE_KEY = 'kiosk_session_state';
const STATE_EXPIRY_MS = 2 * 60 * 60 * 1000;

@Injectable({ providedIn: 'root' })
export class KioskStateService {
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  save(state: KioskState): void {
    if (!this.isBrowser) return;
    try {
      const data = {
        ...state,
        timestamp: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save kiosk state:', e);
    }
  }

  load(): KioskState | null {
    if (!this.isBrowser) return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw) as KioskState;
      if (Date.now() - (data.timestamp || 0) > STATE_EXPIRY_MS) {
        this.clear();
        return null;
      }
      return data;
    } catch (e) {
      console.warn('Failed to load kiosk state:', e);
      return null;
    }
  }

  clear(): void {
    if (!this.isBrowser) return;
    localStorage.removeItem(STORAGE_KEY);
  }

  hasValidState(): boolean {
    if (!this.isBrowser) return false;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw) as KioskState;
      return Date.now() - (data.timestamp || 0) <= STATE_EXPIRY_MS;
    } catch {
      return false;
    }
  }
}