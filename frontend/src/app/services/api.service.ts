import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

export interface Tip { category: string; title: string; body: string; }
export interface QuizItem { id: number; question: string; options: string[]; }
export interface Feedback { id: number; correct: boolean; correctIndex: number; explanation: string; }
export interface QuizResult { score: number; total: number; feedback: Feedback[]; }
export interface PledgeView { nickname: string; commitments: number; }
export interface Stats { pledges: number; recent: PledgeView[]; }

export interface VaultSession { token: string; iv: string | null; blob: string | null; version: number; }
export interface VaultPayload { iv: string; blob: string; version: number; }

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  baseUrl = `${environment.baseUrl}/api`;

  constructor(private http: HttpClient) { }

  tips() { return this.http.get<Tip[]>(`${this.baseUrl}/tips`); }

  stats() { return this.http.get<Stats>(`${this.baseUrl}/stats`); }

  quiz() { return this.http.get<QuizItem[]>(`${this.baseUrl}/quiz`); }

  submitQuiz(answers: number[]) { return this.http.post<QuizResult>(`${this.baseUrl}/quiz/submit`, { answers }); }

  pledge(nickname: string, commitments: string[]) { return this.http.post<PledgeView>(`${this.baseUrl}/pledges`, { nickname, commitments }); }

  breachRange(prefix: string) { return this.http.get(`${this.baseUrl}/breach/range/${prefix}`, { responseType: 'text' }); }

  // ---- Vault ----
  vaultSalt(username: string) { return this.http.get<{ salt: string }>(`${this.baseUrl}/vault/salt/${encodeURIComponent(username)}`); }

  vaultRegister(username: string, salt: string, authKey: string) { return this.http.post<void>(`${this.baseUrl}/vault/register`, { username, salt, authKey }); }

  vaultLogin(username: string, authKey: string) { return this.http.post<VaultSession>(`${this.baseUrl}/vault/login`, { username, authKey }); }

  vaultSave(token: string, p: VaultPayload) { return this.http.put<{ version: number }>(`${this.baseUrl}/vault`, p, { headers: { Authorization: `Bearer ${token}` } }); }

  vaultLogout(token: string) { return this.http.post<void>(`${this.baseUrl}/vault/logout`, {}, { headers: { Authorization: `Bearer ${token}` } }); }
}