import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: Socket;

  constructor() {
    this.socket = io(environment.socketUrl);
  }

  emit(event: string, data?: any) {
    this.socket.emit(event, data);
  }

  fromEvent<T>(event: string): Observable<T> {
    return new Observable<T>((observer) => {
      this.socket.on(event, (data: T) => observer.next(data));
      // Cleanup logic if needed
      return () => this.socket.off(event);
    });
  }

  disconnect() {
    if (this.socket) this.socket.disconnect();
  }
}
