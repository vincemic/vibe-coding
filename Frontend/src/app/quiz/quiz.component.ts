import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { 
  QuizSignalRService, 
  Player, 
  QuestionDisplay, 
  QuestionResult, 
  FinalResults, 
  QuizMasterMessage,
  GameUpdate 
} from '../services/quiz-signalr.service';

export enum QuizState {
  Joining = 'joining',
  WaitingForPlayers = 'waitingForPlayers',
  Starting = 'starting',
  QuestionDisplay = 'questionDisplay',
  WaitingForAnswers = 'waitingForAnswers',
  ShowingResults = 'showingResults',
  GameOver = 'gameOver'
}

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './quiz.component.html',
  styleUrls: ['./quiz.component.scss']
})
export class QuizComponent implements OnInit, OnDestroy {
  // Quiz state
  public currentState: QuizState = QuizState.Joining;
  public QuizState = QuizState; // Expose enum to template
  
  // Player and game data
  public playerName: string = '';
  public currentPlayer: Player | null = null;
  public gameId: string | null = null;
  public players: Player[] = [];
  
  // Question data
  public currentQuestion: QuestionDisplay | null = null;
  public selectedAnswer: number | null = null;
  public hasAnswered: boolean = false;
  public timeRemaining: number = 0;
  public answeredCount: number = 0;
  public totalPlayers: number = 0;
  
  // Results data
  public questionResult: QuestionResult | null = null;
  public finalResults: FinalResults | null = null;
  
  // Messages
  public quizMasterMessages: QuizMasterMessage[] = [];
  public connectionStatus: string = 'Disconnected';
  
  // UI state
  public isJoining: boolean = false;
  public showLeaderboard: boolean = false;
  
  private subscriptions: Subscription[] = [];

  constructor(
    private quizService: QuizSignalRService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.setupSubscriptions();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.quizService.disconnect();
  }

  private setupSubscriptions(): void {
    // Connection status
    this.subscriptions.push(
      this.quizService.connectionState$.subscribe(state => {
        this.connectionStatus = state;
      })
    );

    // Current player
    this.subscriptions.push(
      this.quizService.currentPlayer$.subscribe(player => {
        console.log('Current player subscription triggered:', player);
        if (player) {
          console.log('Setting current player and changing state to WaitingForPlayers');
          this.currentPlayer = player;
          this.currentState = QuizState.WaitingForPlayers;
          this.isJoining = false;
          this.cdr.detectChanges(); // Force change detection
          console.log('Change detection triggered, new state:', this.currentState);
        }
      })
    );

    // Game ID
    this.subscriptions.push(
      this.quizService.gameId$.subscribe(gameId => {
        this.gameId = gameId;
      })
    );

    // Quiz master messages
    this.subscriptions.push(
      this.quizService.quizMasterMessage$.subscribe(message => {
        console.log('Quiz master message received:', message);
        this.quizMasterMessages.push(message);
        // Keep only last 10 messages
        if (this.quizMasterMessages.length > 10) {
          this.quizMasterMessages = this.quizMasterMessages.slice(-10);
        }
      })
    );

    // Game state updates
    this.subscriptions.push(
      this.quizService.gameStateUpdate$.subscribe(update => {
        this.handleGameStateUpdate(update);
      })
    );

    // Question display
    this.subscriptions.push(
      this.quizService.questionDisplay$.subscribe(questionDisplay => {
        this.currentQuestion = questionDisplay;
        this.selectedAnswer = null;
        this.hasAnswered = false;
        this.currentState = QuizState.QuestionDisplay;
        
        // Auto-advance to answer phase after 5 seconds
        setTimeout(() => {
          if (this.currentState === QuizState.QuestionDisplay) {
            this.currentState = QuizState.WaitingForAnswers;
          }
        }, 5000);
      })
    );

    // Question results
    this.subscriptions.push(
      this.quizService.questionResult$.subscribe(result => {
        this.questionResult = result;
        this.currentState = QuizState.ShowingResults;
        this.hasAnswered = false;
        this.selectedAnswer = null;
        
        // Update player scores
        if (this.currentPlayer) {
          const playerResult = result.playerResults.find(pr => pr.playerId === this.currentPlayer!.id);
          if (playerResult) {
            this.currentPlayer.score = playerResult.totalScore;
          }
        }
      })
    );

    // Game complete
    this.subscriptions.push(
      this.quizService.gameComplete$.subscribe(results => {
        this.finalResults = results;
        this.currentState = QuizState.GameOver;
      })
    );

    // Time updates
    this.subscriptions.push(
      this.quizService.timeUpdate$.subscribe(update => {
        this.timeRemaining = update.remainingTime;
        this.answeredCount = update.answeredCount;
        this.totalPlayers = update.totalPlayers;
      })
    );

    // Answer updates
    this.subscriptions.push(
      this.quizService.answerUpdate$.subscribe(update => {
        this.answeredCount = update.answeredCount;
        this.totalPlayers = update.totalPlayers;
      })
    );
  }

  private handleGameStateUpdate(update: GameUpdate): void {
    console.log('GameStateUpdate received:', update);
    console.log('Update data:', update.data);
    
    if (update.data) {
      // Backend sends playerCount, not Players array
      if (typeof update.data.playerCount === 'number') {
        console.log('Updating player count to:', update.data.playerCount);
        // For now, we'll create a mock players array based on playerCount
        // until we get the actual players data from the backend
        this.players = Array(update.data.playerCount).fill(null).map((_, index) => ({
          id: `player-${index}`,
          name: `Player ${index + 1}`,
          score: 0,
          hasAnswered: false
        }));
        this.cdr.detectChanges();
      }
      
      // Also store the game ID if provided
      if (update.data.gameId) {
        console.log('Updating game ID to:', update.data.gameId);
        this.gameId = update.data.gameId;
      }
    }
    
    console.log('Game state changing to:', update.state);
    // Convert numeric enum to our QuizState
    switch (update.state) {
      case 0: // WaitingForPlayers
        this.currentState = QuizState.WaitingForPlayers;
        this.cdr.detectChanges();
        break;
      case 1: // Starting
        this.currentState = QuizState.Starting;
        this.cdr.detectChanges();
        break;
      case 2: // QuestionDisplay
        this.currentState = QuizState.QuestionDisplay;
        this.cdr.detectChanges();
        break;
      case 3: // WaitingForAnswers
        this.currentState = QuizState.WaitingForAnswers;
        this.cdr.detectChanges();
        break;
      case 4: // ShowingResults
        this.currentState = QuizState.ShowingResults;
        this.cdr.detectChanges();
        break;
      case 5: // GameOver
        this.currentState = QuizState.GameOver;
        this.cdr.detectChanges();
        break;
      default:
        console.warn('Unknown game state received:', update.state);
    }
  }

  public joinGame(): void {
    console.log('Join game clicked, playerName:', this.playerName, 'isJoining:', this.isJoining);
    if (this.playerName.trim() && !this.isJoining) {
      console.log('Attempting to join game with name:', this.playerName.trim());
      this.isJoining = true;
      this.quizService.joinGame(this.playerName.trim());
    } else {
      console.log('Join blocked - playerName empty or already joining');
    }
  }

  public submitAnswer(optionIndex: number): void {
    if (this.gameId && !this.hasAnswered && this.currentState === QuizState.WaitingForAnswers) {
      this.selectedAnswer = optionIndex;
      this.hasAnswered = true;
      this.quizService.submitAnswer(this.gameId, optionIndex);
    }
  }

  public startGame(): void {
    if (this.gameId) {
      this.quizService.startGame(this.gameId);
    }
  }

  public backToChat(): void {
    this.router.navigate(['/']);
  }

  public playAgain(): void {
    this.currentState = QuizState.Joining;
    this.playerName = '';
    this.currentPlayer = null;
    this.gameId = null;
    this.players = [];
    this.currentQuestion = null;
    this.selectedAnswer = null;
    this.hasAnswered = false;
    this.questionResult = null;
    this.finalResults = null;
    this.quizMasterMessages = [];
    this.answeredCount = 0;
    this.totalPlayers = 0;
    this.timeRemaining = 0;
  }

  public toggleLeaderboard(): void {
    this.showLeaderboard = !this.showLeaderboard;
  }

  public formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  public getProgressPercentage(): number {
    if (this.currentQuestion) {
      return ((this.currentQuestion.questionNumber - 1) / this.currentQuestion.totalQuestions) * 100;
    }
    return 0;
  }

  public getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index); // A, B, C, D
  }

  public getScoreColor(score: number): string {
    if (score >= 800) return '#4CAF50'; // Green
    if (score >= 600) return '#FF9800'; // Orange
    if (score >= 400) return '#2196F3'; // Blue
    return '#9E9E9E'; // Gray
  }

  public isConnected(): boolean {
    return this.quizService.isConnected();
  }

  public getCurrentTime(): string {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
