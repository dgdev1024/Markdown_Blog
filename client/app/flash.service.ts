import { Injectable } from '@angular/core';

export enum FlashType {
  Default,
  OK,
  Warning,
  Error
}

@Injectable()
export class FlashService {

  message: string = '';
  details: string[] = [];
  type: FlashType = FlashType.Default;
  private timeoutId: number = null;

  deploy (message: string, details: string[], type: FlashType, length = 15000) {
    this.message = message;
    this.details = details;
    this.type = type;

    clearTimeout(this.timeoutId);
    this.timeoutId = setTimeout(() => this.clear(), length);
  }

  clear () {
    this.message = '';
    this.details = [];
    this.type = FlashType.Default;
    clearTimeout(this.timeoutId);
  }

  getFlashClass () {
    switch (this.type) {
      case FlashType.Default: return 'tdm-flash';
      case FlashType.OK: return 'tdm-flash tdm-flash-ok';
      case FlashType.Warning: return 'tdm-flash tdm-flash-warning';
      case FlashType.Error: return 'tdm-flash tdm-flash-error';
    }
  }

}
