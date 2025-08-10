import { Routes } from '@angular/router';
import { ChatComponent } from './chat/chat.component';
import { QuizComponent } from './quiz/quiz.component';

export const routes: Routes = [
  { path: '', component: ChatComponent },
  { path: 'chat', component: ChatComponent },
  { path: 'quiz', component: QuizComponent },
  { path: '**', redirectTo: '' }
];
