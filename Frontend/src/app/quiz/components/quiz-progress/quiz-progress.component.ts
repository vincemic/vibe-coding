import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuestionDisplay } from '../../../services/quiz-signalr.service';
import { QuizUtilsService } from '../../services/quiz-utils.service';

@Component({
  selector: 'app-quiz-progress',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="currentQuestion" class="progress-container">
      <div class="progress-bar">
        <div class="progress-fill" [style.width.%]="getProgressPercentage()"></div>
      </div>
      <span class="progress-text">
        Question {{ currentQuestion.questionNumber }} of {{ currentQuestion.totalQuestions }}
      </span>
    </div>
  `,
  styleUrls: ['./quiz-progress.component.scss']
})
export class QuizProgressComponent {
  @Input() currentQuestion: QuestionDisplay | null = null;

  constructor(private utilsService: QuizUtilsService) {}

  getProgressPercentage(): number {
    if (!this.currentQuestion) return 0;
    return this.utilsService.getProgressPercentage(
      this.currentQuestion.questionNumber, 
      this.currentQuestion.totalQuestions
    );
  }
}
