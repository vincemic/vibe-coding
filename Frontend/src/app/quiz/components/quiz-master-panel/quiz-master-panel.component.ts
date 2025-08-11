import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuizMasterMessage } from '../../../services/quiz-signalr.service';

@Component({
  selector: 'app-quiz-master-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="quiz-master-panel">
      <div class="panel-header">
        <h3>🤖 Quiz Master</h3>
      </div>
      <div class="messages-container">
        <div 
          *ngFor="let message of messages" 
          class="quiz-message">
          <div class="message-content">{{ message.message }}</div>
          <div class="message-timestamp">{{ message.timestamp | date:'HH:mm:ss' }}</div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./quiz-master-panel.component.scss']
})
export class QuizMasterPanelComponent {
  @Input() messages: QuizMasterMessage[] = [];
}
