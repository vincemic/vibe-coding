import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';

export interface ChatMessage {
  user: string;
  message: string;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  private hubConnection: signalR.HubConnection | undefined;
  private messageReceivedSubject = new Subject<ChatMessage>();
  public messageReceived$ = this.messageReceivedSubject.asObservable();

  constructor() {
    this.startConnection();
  }

  private startConnection(): void {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5001/chathub')
      .withAutomaticReconnect()
      .build();

    this.hubConnection
      .start()
      .then(() => {
        console.log('SignalR connection started');
        this.addMessageListener();
      })
      .catch((err) => console.error('Error while starting SignalR connection: ' + err));
  }

  private addMessageListener(): void {
    if (this.hubConnection) {
      this.hubConnection.on('ReceiveMessage', (user: string, message: string, timestamp: string) => {
        const chatMessage: ChatMessage = {
          user,
          message,
          timestamp: new Date(timestamp)
        };
        this.messageReceivedSubject.next(chatMessage);
      });
    }
  }

  public sendMessage(user: string, message: string): void {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      this.hubConnection
        .invoke('SendMessage', user, message)
        .catch((err) => console.error('Error while sending message: ' + err));
    } else {
      console.error('SignalR connection is not established');
    }
  }

  public disconnect(): void {
    if (this.hubConnection) {
      this.hubConnection.stop();
    }
  }

  public get connectionState(): signalR.HubConnectionState | undefined {
    return this.hubConnection?.state;
  }
}
