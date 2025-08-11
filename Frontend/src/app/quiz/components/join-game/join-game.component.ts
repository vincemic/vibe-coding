import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-join-game',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="join-section">
      <div class="welcome-card">
        <h2>🎮 Ready to Test Your Knowledge?</h2>
        <p>Join up to 10 players in this exciting quiz challenge!</p>
        <div class="join-form">
          <input 
            type="text" 
            [(ngModel)]="playerName" 
            placeholder="Enter your name to join..."
            (keydown.enter)="onJoinGame()"
            [disabled]="isJoining"
            class="name-input"
            id="player-name-input"
            maxlength="20">
          <button 
            (click)="onJoinGame()" 
            [disabled]="isJoining"
            class="join-button"
            [class.disabled]="!playerName.trim() || isJoining">
            {{ isJoining ? 'Joining...' : 'Join Game' }}
          </button>
          <div *ngIf="!playerName.trim() && !isJoining" class="validation-hint">
            Please enter your name to continue
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./join-game.component.scss']
})
export class JoinGameComponent {
  @Input() playerName: string = '';
  @Input() isJoining: boolean = false;

  @Output() playerNameChange = new EventEmitter<string>();
  @Output() joinGame = new EventEmitter<string>();

  onJoinGame(): void {
    const trimmedName = this.playerName.trim();
    if (trimmedName && !this.isJoining) {
      this.joinGame.emit(trimmedName);
    }
  }
}
