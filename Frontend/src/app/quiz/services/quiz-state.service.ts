import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { 
  QuizSignalRService, 
  Player, 
  QuestionDisplay, 
  QuestionResult, 
  FinalResults, 
  QuizMasterMessage,
  GameUpdate 
} from '../../services/quiz-signalr.service';

export enum QuizState {
  Joining = 'joining',
  WaitingForPlayers = 'waitingForPlayers',
  Starting = 'starting',
  QuestionDisplay = 'questionDisplay',
  WaitingForAnswers = 'waitingForAnswers',
  ShowingResults = 'showingResults',
  GameOver = 'gameOver'
}

export interface QuizGameState {
  currentState: QuizState;
  playerName: string;
  currentPlayer: Player | null;
  gameId: string | null;
  players: Player[];
  currentQuestion: QuestionDisplay | null;
  selectedAnswer: number | null;
  hasAnswered: boolean;
  timeRemaining: number;
  answeredCount: number;
  totalPlayers: number;
  questionResult: QuestionResult | null;
  finalResults: FinalResults | null;
  quizMasterMessages: QuizMasterMessage[];
  connectionStatus: string;
  isJoining: boolean;
  showLeaderboard: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class QuizStateService {
  private readonly initialState: QuizGameState = {
    currentState: QuizState.Joining,
    playerName: '',
    currentPlayer: null,
    gameId: null,
    players: [],
    currentQuestion: null,
    selectedAnswer: null,
    hasAnswered: false,
    timeRemaining: 0,
    answeredCount: 0,
    totalPlayers: 0,
    questionResult: null,
    finalResults: null,
    quizMasterMessages: [],
    connectionStatus: 'Disconnected',
    isJoining: false,
    showLeaderboard: false
  };

  private stateSubject = new BehaviorSubject<QuizGameState>(this.initialState);
  public state$ = this.stateSubject.asObservable();

  private subscriptions: Subscription[] = [];

  constructor(private quizService: QuizSignalRService) {
    this.setupSubscriptions();
  }

  public get currentState(): QuizGameState {
    return this.stateSubject.value;
  }

  public updateState(partialState: Partial<QuizGameState>): void {
    const currentState = this.stateSubject.value;
    const newState = { ...currentState, ...partialState };
    this.stateSubject.next(newState);
  }

  public resetToInitialState(): void {
    this.stateSubject.next({ ...this.initialState });
  }

  public joinGame(playerName: string): void {
    const trimmedName = playerName.trim();
    if (!trimmedName || this.currentState.isJoining) {
      return;
    }

    this.updateState({ 
      playerName: trimmedName, 
      isJoining: true 
    });
    
    this.quizService.joinGame(trimmedName);
  }

  public submitAnswer(optionIndex: number): void {
    const state = this.currentState;
    if (state.gameId && !state.hasAnswered && state.currentState === QuizState.WaitingForAnswers) {
      this.updateState({
        selectedAnswer: optionIndex,
        hasAnswered: true
      });
      this.quizService.submitAnswer(state.gameId, optionIndex);
    }
  }

  public startGame(): void {
    const gameId = this.currentState.gameId;
    if (gameId) {
      this.quizService.startGame(gameId);
    }
  }

  public toggleLeaderboard(): void {
    this.updateState({ 
      showLeaderboard: !this.currentState.showLeaderboard 
    });
  }

  public isConnected(): boolean {
    return this.quizService.isConnected();
  }

  public disconnect(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.quizService.disconnect();
  }

  private setupSubscriptions(): void {
    // Connection status
    this.subscriptions.push(
      this.quizService.connectionState$.subscribe(status => {
        this.updateState({ connectionStatus: status });
      })
    );

    // Current player
    this.subscriptions.push(
      this.quizService.currentPlayer$.subscribe(player => {
        if (player) {
          this.updateState({
            currentPlayer: player,
            currentState: QuizState.WaitingForPlayers,
            isJoining: false
          });
        }
      })
    );

    // Game ID
    this.subscriptions.push(
      this.quizService.gameId$.subscribe(gameId => {
        this.updateState({ gameId });
      })
    );

    // Quiz master messages
    this.subscriptions.push(
      this.quizService.quizMasterMessage$.subscribe(message => {
        const currentMessages = this.currentState.quizMasterMessages;
        const newMessages = [...currentMessages, message];
        
        // Keep only last 10 messages
        const messages = newMessages.length > 10 
          ? newMessages.slice(-10) 
          : newMessages;
          
        this.updateState({ quizMasterMessages: messages });
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
        this.updateState({
          currentQuestion: questionDisplay,
          selectedAnswer: null,
          hasAnswered: false
        });
      })
    );

    // Question results
    this.subscriptions.push(
      this.quizService.questionResult$.subscribe(result => {
        // Update player scores
        const currentPlayer = this.currentState.currentPlayer;
        let updatedPlayer = currentPlayer;
        
        if (currentPlayer) {
          const playerResult = result.playerResults.find(pr => pr.playerId === currentPlayer.id);
          if (playerResult) {
            updatedPlayer = { ...currentPlayer, score: playerResult.totalScore };
          }
        }

        this.updateState({
          questionResult: result,
          currentState: QuizState.ShowingResults,
          hasAnswered: false,
          selectedAnswer: null,
          currentPlayer: updatedPlayer
        });
      })
    );

    // Game complete
    this.subscriptions.push(
      this.quizService.gameComplete$.subscribe(results => {
        this.updateState({
          finalResults: results,
          currentState: QuizState.GameOver
        });
      })
    );

    // Time updates
    this.subscriptions.push(
      this.quizService.timeUpdate$.subscribe(update => {
        this.updateState({
          timeRemaining: update.remainingTime,
          answeredCount: update.answeredCount,
          totalPlayers: update.totalPlayers
        });
      })
    );

    // Answer updates
    this.subscriptions.push(
      this.quizService.answerUpdate$.subscribe(update => {
        this.updateState({
          answeredCount: update.answeredCount,
          totalPlayers: update.totalPlayers
        });
      })
    );
  }

  private handleGameStateUpdate(update: GameUpdate): void {
    const stateUpdates: Partial<QuizGameState> = {};

    if (update.data) {
      // Handle question display data from GameStateUpdate
      if (update.state === 2 || update.state === 3) { // QuestionDisplay or WaitingForAnswers
        if (update.data.question && update.data.questionNumber) {
          stateUpdates.currentQuestion = {
            question: update.data.question,
            questionNumber: update.data.questionNumber,
            totalQuestions: update.data.totalQuestions,
            timeLimit: update.data.timeLimit || 30,
            players: update.data.players || []
          };
          stateUpdates.selectedAnswer = null;
          stateUpdates.hasAnswered = false;
        }
      }
      
      // Backend sends playerCount, not Players array
      if (typeof update.data.playerCount === 'number') {
        // Create mock players array based on playerCount
        stateUpdates.players = Array(update.data.playerCount).fill(null).map((_, index) => ({
          id: `player-${index}`,
          name: `Player ${index + 1}`,
          score: 0,
          hasAnswered: false
        }));
      }
      
      // Store the game ID if provided
      if (update.data.gameId) {
        stateUpdates.gameId = update.data.gameId;
      }
    }
    
    // Convert numeric enum to our QuizState
    switch (update.state) {
      case 0: // WaitingForPlayers
        stateUpdates.currentState = QuizState.WaitingForPlayers;
        break;
      case 1: // Starting
        stateUpdates.currentState = QuizState.Starting;
        break;
      case 2: // QuestionDisplay
        stateUpdates.currentState = QuizState.QuestionDisplay;
        break;
      case 3: // WaitingForAnswers
        stateUpdates.currentState = QuizState.WaitingForAnswers;
        break;
      case 4: // ShowingResults
        stateUpdates.currentState = QuizState.ShowingResults;
        break;
      case 5: // GameOver
        stateUpdates.currentState = QuizState.GameOver;
        break;
    }

    this.updateState(stateUpdates);
  }
}
