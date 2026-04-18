import { Injectable, signal } from '@angular/core';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class SignalrService {
  private hubConnection: HubConnection | null = null;
  public currentQueueToken = signal<number | null>(null);

  constructor(private authService: AuthService) {}

  public startConnection(doctorId: number, date: string) {
    const token = this.authService.getToken();
    if (!token) return;

    this.hubConnection = new HubConnectionBuilder()
      .withUrl(`${environment.signalrUrl}/hubs/queue?access_token=${token}`)
      .withAutomaticReconnect()
      .build();

    this.hubConnection
      .start()
      .then(() => {
        console.log('SignalR connection started');
        this.joinDoctorQueue(doctorId, date);
      })
      .catch(err => console.log('Error while starting connection: ' + err));
  }

  public onConnected(): Promise<void> {
    if (this.hubConnection?.state === 'Connected') return Promise.resolve();
    return new Promise((resolve) => {
        const check = setInterval(() => {
            if (this.hubConnection?.state === 'Connected') {
                clearInterval(check);
                resolve();
            }
        }, 100);
    });
  }

  public joinDoctorQueue(doctorId: number, date: string) {
    this.hubConnection?.invoke('JoinDoctorQueue', doctorId, date);
  }

  public onSlotStateChanged(callback: (data: any) => void) {
    this.hubConnection?.on('SlotStateChanged', callback);
  }

  public onAvailabilityUpdated(callback: (data: any) => void) {
    this.hubConnection?.on('AvailabilityUpdated', callback);
  }

  public onNewAppointmentRequest(callback: (data: any) => void) {
    this.hubConnection?.on('NewAppointmentRequest', callback);
  }

  public onQueueUpdated(callback: (data: any) => void) {
    this.hubConnection?.on('QueueUpdated', callback);
  }

  public stopConnection() {
    this.hubConnection?.stop();
  }
}
