import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { 
  QuestionResult, 
  FinalResults
} from '../services/quiz-signalr.service';
import { QuizStateService, QuizState, QuizGameState } from './services/quiz-state.service';
import { QuizUtilsService } from './services/quiz-utils.service';

// Import all sub-components
import { QuizHeaderComponent } from './components/quiz-header/quiz-header.component';
import { QuizProgressComponent } from './components/quiz-progress/quiz-progress.component';
import { JoinGameComponent } from './components/join-game/join-game.component';
import { QuestionDisplayComponent } from './components/question-display/question-display.component';
import { QuizMasterPanelComponent } from './components/quiz-master-panel/quiz-master-panel.component';

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    QuizHeaderComponent,
    QuizProgressComponent,
    JoinGameComponent,
    QuestionDisplayComponent,
    QuizMasterPanelComponent
  ],
  templateUrl: './quiz.component.html',
  styleUrls: ['./quiz.component.scss']
})
export class QuizComponent implements OnInit, OnDestroy {
  public state$: Observable<QuizGameState>;
  public QuizState = QuizState; // Expose enum to template

  constructor(
    private quizStateService: QuizStateService,
    private utilsService: QuizUtilsService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.state$ = this.quizStateService.state$;
  }

  ngOnInit(): void {
    // State management is now handled by QuizStateService
  }

  ngOnDestroy(): void {
    this.quizStateService.disconnect();
  }

  // Event handlers that delegate to the state service
  public joinGame(playerName: string): void {
    this.quizStateService.joinGame(playerName);
  }

  public submitAnswer(optionIndex: number): void {
    this.quizStateService.submitAnswer(optionIndex);
  }

  public startGame(): void {
    this.quizStateService.startGame();
  }

  public playAgain(): void {
    this.quizStateService.resetToInitialState();
  }

  public toggleLeaderboard(): void {
    this.quizStateService.toggleLeaderboard();
  }

  // Utility methods that delegate to utils service
  public formatTime(seconds: number): string {
    return this.utilsService.formatTime(seconds);
  }

  public getOptionLetter(index: number): string {
    return this.utilsService.getOptionLetter(index);
  }

  public getScoreColor(score: number): string {
    return this.utilsService.getScoreColor(score);
  }

  public isConnected(): boolean {
    return this.quizStateService.isConnected();
  }

  public getCurrentTime(): string {
    return this.utilsService.getCurrentTime();
  }
}
