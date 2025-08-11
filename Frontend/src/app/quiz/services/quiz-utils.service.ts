import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class QuizUtilsService {

  public formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  public getProgressPercentage(questionNumber: number, totalQuestions: number): number {
    if (totalQuestions === 0) return 0;
    return ((questionNumber - 1) / totalQuestions) * 100;
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

  public getCurrentTime(): string {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
