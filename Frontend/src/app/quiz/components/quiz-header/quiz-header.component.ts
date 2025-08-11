import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-quiz-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="quiz-header">
      <div class="header-content">
        <h1>🎯 Ultimate Quiz Challenge</h1>
        <div class="connection-status" [class.connected]="isConnected">
          <span class="status-dot"></span>
          {{ connectionStatus }}
        </div>
      </div>
      <div class="header-actions">
        <button 
          *ngIf="playersCount > 0" 
          class="leaderboard-button" 
          (click)="onToggleLeaderboard()">
          📊 Scores
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./quiz-header.component.scss']
})
export class QuizHeaderComponent {
  @Input() connectionStatus: string = 'Disconnected';
  @Input() isConnected: boolean = false;
  @Input() playersCount: number = 0;

  @Output() toggleLeaderboard = new EventEmitter<void>();

  onToggleLeaderboard(): void {
    this.toggleLeaderboard.emit();
  }
}
