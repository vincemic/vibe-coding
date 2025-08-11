import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuestionDisplay } from '../../../services/quiz-signalr.service';
import { QuizUtilsService } from '../../services/quiz-utils.service';
import { QuizState } from '../../services/quiz-state.service';

@Component({
  selector: 'app-question-display',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Question Display State -->
    <div *ngIf="currentState === QuizState.QuestionDisplay" class="question-section">
      <div class="question-card" *ngIf="currentQuestion">
        <div class="question-header">
          <span class="category">{{ currentQuestion.question.category }}</span>
          <span class="question-number">{{ currentQuestion.questionNumber }}/{{ currentQuestion.totalQuestions }}</span>
        </div>
        <h2 class="question-text">{{ currentQuestion.question.question }}</h2>
        <div class="question-preparation">
          <p>📚 Read the question carefully...</p>
          <p>⏰ Answer options coming up in a few seconds!</p>
        </div>
      </div>
    </div>

    <!-- Waiting for Answers State -->
    <div *ngIf="currentState === QuizState.WaitingForAnswers" class="answer-section">
      <div class="answer-card" *ngIf="currentQuestion">
        <div class="question-header">
          <span class="category">{{ currentQuestion.question.category }}</span>
          <span class="question-number">{{ currentQuestion.questionNumber }}/{{ currentQuestion.totalQuestions }}</span>
          <div class="timer" [class.urgent]="timeRemaining <= 10">
            ⏰ {{ timeRemaining }}s
          </div>
        </div>
        
        <h3 class="question-text">{{ currentQuestion.question.question }}</h3>
        
        <div class="answer-options">
          <button 
            *ngFor="let option of currentQuestion.question.options; let i = index"
            class="option-button"
            [class.selected]="selectedAnswer === i"
            [class.disabled]="hasAnswered"
            (click)="onSubmitAnswer(i)"
            [disabled]="hasAnswered">
            <span class="option-letter">{{ getOptionLetter(i) }}</span>
            <span class="option-text">{{ option }}</span>
          </button>
        </div>
        
        <div class="answer-status">
          <div *ngIf="!hasAnswered" class="not-answered">
            🤔 Choose your answer above
          </div>
          <div *ngIf="hasAnswered" class="answered">
            ✅ Answer submitted! Waiting for others...
          </div>
          <div class="progress-info">
            {{ answeredCount }}/{{ totalPlayers }} players answered
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./question-display.component.scss']
})
export class QuestionDisplayComponent {
  @Input() currentState: QuizState = QuizState.Joining;
  @Input() currentQuestion: QuestionDisplay | null = null;
  @Input() selectedAnswer: number | null = null;
  @Input() hasAnswered: boolean = false;
  @Input() timeRemaining: number = 0;
  @Input() answeredCount: number = 0;
  @Input() totalPlayers: number = 0;

  @Output() submitAnswer = new EventEmitter<number>();

  public QuizState = QuizState;

  constructor(private utilsService: QuizUtilsService) {}

  onSubmitAnswer(optionIndex: number): void {
    if (!this.hasAnswered) {
      this.submitAnswer.emit(optionIndex);
    }
  }

  getOptionLetter(index: number): string {
    return this.utilsService.getOptionLetter(index);
  }
}
