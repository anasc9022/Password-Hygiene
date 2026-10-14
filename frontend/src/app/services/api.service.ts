import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

export interface Tip { category: string; title: string; body: string; }
export interface QuizItem { id: number; question: string; options: string[]; }
export interface Feedback { id: number; correct: boolean; correctIndex: number; explanation: string; }
export interface QuizResult { score: number; total: number; feedback: Feedback[]; }
export interface PledgeView { nickname: string; commitments: number; }
export interface Stats { pledges: number; recent: PledgeView[]; }

const BASE = 'http://localhost:8080/api';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private http: HttpClient) { }

  tips() { return this.http.get<Tip[]>(`${BASE}/tips`); }

  stats() { return this.http.get<Stats>(`${BASE}/stats`); }

  quiz() { return this.http.get<QuizItem[]>(`${BASE}/quiz`); }

  submitQuiz(answers: number[]) { return this.http.post<QuizResult>(`${BASE}/quiz/submit`, { answers }); }

  pledge(nickname: string, commitments: string[]) { return this.http.post<PledgeView>(`${BASE}/pledges`, { nickname, commitments }); }

  breachRange(prefix: string) { return this.http.get(`${BASE}/breach/range/${prefix}`, { responseType: 'text' }); }

}
