import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SignalRService, ChatMessage } from '../services/signalr.service';
import { Subscription } from 'rxjs';
import * as signalR from '@microsoft/signalr';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  
  public messages: ChatMessage[] = [];
  public currentMessage: string = '';
  public userName: string = 'You';
  public isWaiting: boolean = false;
  private messageSubscription: Subscription | undefined;

  constructor(public signalRService: SignalRService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    console.log('ChatComponent ngOnInit called');
    this.messageSubscription = this.signalRService.messageReceived$.subscribe(
      (message: ChatMessage) => {
        console.log('ChatComponent received message:', message);
        this.messages.push(message);
        
        // If it's an AI response, stop the waiting indicator
        if (message.user === 'Assistant') {
          this.isWaiting = false;
        }
        
        // Manually trigger change detection
        this.cdr.detectChanges();
      }
    );

    // Monitor connection state
    setInterval(() => {
      const connectionInfo = this.signalRService.getConnectionInfo();
      console.log('Connection state:', connectionInfo);
    }, 5000);

    // Ensure connection is established when component is ready
    setTimeout(() => {
      console.log('Ensuring SignalR connection...');
      this.signalRService.ensureConnection().catch(err => {
        console.error('Failed to ensure SignalR connection:', err);
      });
    }, 100);
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  ngOnDestroy(): void {
    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
    }
    this.signalRService.disconnect();
  }

  public sendMessage(): void {
    if (this.currentMessage.trim() && !this.isWaiting) {
      this.isWaiting = true;
      this.signalRService.sendMessage(this.userName, this.currentMessage.trim());
      this.currentMessage = '';
    }
  }

  public onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      }
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  public getMessageClass(message: ChatMessage): string {
    if (message.user === 'You') {
      return 'user-message';
    } else if (message.user === 'Assistant') {
      return 'assistant-message';
    } else {
      return 'system-message';
    }
  }

  public formatTime(timestamp: Date): string {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  public isConnected(): boolean {
    return this.signalRService.connectionState === signalR.HubConnectionState.Connected;
  }

  public getCurrentTime(): string {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
