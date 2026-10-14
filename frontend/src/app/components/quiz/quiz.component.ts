import { Component, OnInit } from '@angular/core';
import { ApiService, QuizItem, QuizResult } from 'src/app/services/api.service';

@Component({
  selector: 'app-quiz',
  templateUrl: './quiz.component.html',
  styleUrls: ['./quiz.component.css']
})
export class QuizComponent implements OnInit {

 qs: QuizItem[] = [];
  i = 0;
  answers: number[] = [];
  result: QuizResult | null = null;
  error = false;
 
  constructor(private api: ApiService) {}
 
  ngOnInit(): void { this.load(); }
 
  load(): void {
    this.i = 0; this.answers = []; this.result = null; this.error = false;
    this.api.quiz().subscribe({ next: q => (this.qs = q), error: () => (this.error = true) });
  }
 
  next(): void {
    if (this.i < this.qs.length - 1) { this.i++; return; }
    this.api.submitQuiz(this.answers).subscribe({ next: r => (this.result = r), error: () => (this.error = true) });
  }
 
  get pct(): number { return this.result ? Math.round((this.result.score / this.result.total) * 100) : 0; }
  get headline(): string {
    return this.pct >= 80 ? 'Strong password habits' : this.pct >= 50 ? 'Good start, a few gaps' : 'Time to tighten up';
  }

}
