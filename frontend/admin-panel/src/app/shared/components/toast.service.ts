import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  title: string;
  message?: string;
  type: 'success' | 'info' | 'warning' | 'error';
  duration?: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts = signal<Toast[]>([]);
  private nextId = 1;

  show(title: string, message?: string, type: Toast['type'] = 'info', duration = 6000) {
    const id = this.nextId++;
    const toast: Toast = { id, title, message, type, duration };
    this.toasts.update(t => [...t, toast]);
    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }
  }

  success(title: string, message?: string, duration = 6000) {
    this.show(title, message, 'success', duration);
  }

  info(title: string, message?: string, duration = 6000) {
    this.show(title, message, 'info', duration);
  }

  warning(title: string, message?: string, duration = 6000) {
    this.show(title, message, 'warning', duration);
  }

  error(title: string, message?: string, duration = 8000) {
    this.show(title, message, 'error', duration);
  }

  dismiss(id: number) {
    this.toasts.update(t => t.filter(toast => toast.id !== id));
  }

  clear() {
    this.toasts.set([]);
  }
}