import { Injectable, NgZone } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject, Subject } from 'rxjs';

// Quiz interfaces
export interface Player {
  id: string;
  name: string;
  score: number;
  hasAnswered: boolean;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  category: string;
}

export interface QuestionDisplay {
  question: QuizQuestion;
  questionNumber: number;
  totalQuestions: number;
  timeLimit: number;
  players: Player[];
}

export interface QuestionResult {
  question: QuizQuestion;
  correctAnswer: number;
  explanation: string;
  playerResults: PlayerResult[];
  optionCounts: { [key: number]: number };
}

export interface PlayerResult {
  playerId: string;
  playerName: string;
  selectedOption: number;
  isCorrect: boolean;
  scoreGained: number;
  totalScore: number;
}

export interface FinalResults {
  finalScores: PlayerResult[];
  winner: PlayerResult | null;
  statistics: GameStatistics;
}

export interface GameStatistics {
  gameDuration: string;
  totalQuestions: number;
  totalPlayers: number;
  averageScore: number;
}

export interface GameUpdate {
  state: number; // Changed from string to number since backend sends numeric enum
  message: string;
  data: any;
  timestamp: string;
}

export interface QuizMasterMessage {
  message: string;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class QuizSignalRService {
  private hubConnection: signalR.HubConnection | undefined;
  private connectionEstablished = false;

  // Observables for different quiz events
  public quizMasterMessage$ = new Subject<QuizMasterMessage>();
  public gameStateUpdate$ = new Subject<GameUpdate>();
  public questionDisplay$ = new Subject<QuestionDisplay>();
  public questionResult$ = new Subject<QuestionResult>();
  public gameComplete$ = new Subject<FinalResults>();
  public timeUpdate$ = new Subject<{ remainingTime: number; answeredCount: number; totalPlayers: number }>();
  public answerUpdate$ = new Subject<{ answeredCount: number; totalPlayers: number; allAnswered: boolean }>();
  
  // Current game state
  public currentPlayer$ = new BehaviorSubject<Player | null>(null);
  public gameId$ = new BehaviorSubject<string | null>(null);
  public connectionState$ = new BehaviorSubject<string>('Disconnected');

  constructor(private ngZone: NgZone) {
    this.startConnection();
  }

  private startConnection(): void {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5001/quizhub')
      .withAutomaticReconnect()
      .build();

    this.hubConnection
      .start()
      .then(() => {
        console.log('QuizHub connection started');
        this.connectionEstablished = true;
        this.connectionState$.next('Connected');
        this.addEventListeners();
      })
      .catch((err) => {
        console.error('Error while starting QuizHub connection: ' + err);
        this.connectionState$.next('Failed');
      });

    this.hubConnection.onclose((error) => {
      console.log('QuizHub connection closed:', error);
      this.connectionEstablished = false;
      this.connectionState$.next('Disconnected');
    });

    this.hubConnection.onreconnecting((error) => {
      console.log('QuizHub reconnecting:', error);
      this.connectionState$.next('Reconnecting');
    });

    this.hubConnection.onreconnected((connectionId) => {
      console.log('QuizHub reconnected:', connectionId);
      this.connectionEstablished = true;
      this.connectionState$.next('Connected');
    });
  }

  private addEventListeners(): void {
    if (!this.hubConnection) return;

    this.hubConnection.on('QuizMasterMessage', (message: string, timestamp: string) => {
      console.log('QuizMasterMessage event received:', message, timestamp);
      this.ngZone.run(() => {
        console.log('Processing quiz master message in ngZone');
        this.quizMasterMessage$.next({
          message,
          timestamp: new Date(timestamp)
        });
      });
    });

    this.hubConnection.on('GameStateUpdate', (update: GameUpdate) => {
      this.ngZone.run(() => {
        this.gameStateUpdate$.next(update);
      });
    });

    this.hubConnection.on('GameCreated', (gameId: string) => {
      this.ngZone.run(() => {
        this.gameId$.next(gameId);
      });
    });

    this.hubConnection.on('PlayerJoined', (player: Player) => {
      console.log('PlayerJoined event received:', player);
      this.ngZone.run(() => {
        console.log('Setting current player in ngZone:', player);
        this.currentPlayer$.next(player);
      });
    });

    this.hubConnection.on('QuestionDisplay', (questionDisplay: QuestionDisplay) => {
      this.ngZone.run(() => {
        this.questionDisplay$.next(questionDisplay);
      });
    });

    this.hubConnection.on('QuestionResult', (result: QuestionResult) => {
      this.ngZone.run(() => {
        this.questionResult$.next(result);
      });
    });

    this.hubConnection.on('GameComplete', (finalResults: FinalResults) => {
      this.ngZone.run(() => {
        this.gameComplete$.next(finalResults);
      });
    });

    this.hubConnection.on('TimeUpdate', (update: { remainingTime: number; answeredCount: number; totalPlayers: number }) => {
      this.ngZone.run(() => {
        this.timeUpdate$.next(update);
      });
    });

    this.hubConnection.on('AnswerUpdate', (update: { answeredCount: number; totalPlayers: number; allAnswered: boolean }) => {
      this.ngZone.run(() => {
        this.answerUpdate$.next(update);
      });
    });

    this.hubConnection.on('AnswerSubmitted', (data: { selectedOption: number; submittedAt: string }) => {
      console.log('Answer submitted:', data);
    });
  }

  public joinGame(playerName: string): void {
    console.log('QuizSignalRService.joinGame called with:', playerName);
    console.log('Connection state:', this.hubConnection?.state, 'Established:', this.connectionEstablished);
    if (this.hubConnection && this.connectionEstablished) {
      console.log('Invoking JoinGame on hub...');
      this.hubConnection
        .invoke('JoinGame', playerName)
        .then(() => {
          console.log('JoinGame invoke successful');
        })
        .catch((err) => {
          console.error('Error joining game: ' + err);
        });
    } else {
      console.error('Cannot join - connection not established');
    }
  }

  public submitAnswer(gameId: string, selectedOption: number): void {
    if (this.hubConnection && this.connectionEstablished) {
      this.hubConnection
        .invoke('SubmitAnswer', gameId, selectedOption)
        .catch((err) => console.error('Error submitting answer: ' + err));
    }
  }

  public startGame(gameId: string): void {
    if (this.hubConnection && this.connectionEstablished) {
      this.hubConnection
        .invoke('StartGame', gameId)
        .catch((err) => console.error('Error starting game: ' + err));
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

  public isConnected(): boolean {
    return this.connectionEstablished && this.hubConnection?.state === signalR.HubConnectionState.Connected;
  }
}
