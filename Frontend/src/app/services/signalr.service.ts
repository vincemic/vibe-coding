import { Injectable, NgZone } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { ReplaySubject } from 'rxjs';

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
  private messageReceivedSubject = new ReplaySubject<ChatMessage>(10); // Buffer last 10 messages
  public messageReceived$ = this.messageReceivedSubject.asObservable();
  private connectionEstablished = false;
  private messageListenerAdded = false;

  constructor(private ngZone: NgZone) {
    this.startConnection();
  }

  private startConnection(): void {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5001/chathub')
      .withAutomaticReconnect()
      .build();

    // Set up connection event handlers
    this.hubConnection.onclose((error) => {
      console.log('SignalR connection closed:', error);
      this.connectionEstablished = false;
    });

    this.hubConnection.onreconnecting((error) => {
      console.log('SignalR connection lost, attempting to reconnect:', error);
      this.connectionEstablished = false;
    });

    this.hubConnection.onreconnected((connectionId) => {
      console.log('SignalR connection reestablished:', connectionId);
      this.connectionEstablished = true;
    });

    // Set up message listener BEFORE starting the connection
    this.addMessageListener();

    this.hubConnection
      .start()
      .then(() => {
        console.log('SignalR connection started successfully');
        this.connectionEstablished = true;
      })
      .catch((err) => {
        console.error('Error while starting SignalR connection: ' + err);
        this.connectionEstablished = false;
      });
  }

  private addMessageListener(): void {
    if (this.hubConnection && !this.messageListenerAdded) {
      console.log('Adding message listener...');
      this.hubConnection.on('ReceiveMessage', (user: string, message: string, timestamp: string) => {
        console.log('Received message:', { user, message, timestamp });
        
        // Run inside Angular zone to trigger change detection
        this.ngZone.run(() => {
          const chatMessage: ChatMessage = {
            user,
            message,
            timestamp: new Date(timestamp)
          };
          this.messageReceivedSubject.next(chatMessage);
        });
      });
      this.messageListenerAdded = true;
    }
  }

  public ensureConnection(): Promise<void> {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      return Promise.resolve();
    }
    
    if (this.hubConnection) {
      // Set up message listener before starting connection (only if not already added)
      if (!this.messageListenerAdded) {
        this.addMessageListener();
      }
      
      return this.hubConnection.start().then(() => {
        console.log('SignalR connection re-established');
        this.connectionEstablished = true;
      });
    }
    
    return Promise.reject('No hub connection available');
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

  public getConnectionInfo(): { state: string; established: boolean } {
    const state = this.hubConnection?.state;
    return {
      state: state ? signalR.HubConnectionState[state] : 'Unknown',
      established: this.connectionEstablished
    };
  }
}
