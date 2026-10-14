import { Component, OnInit } from '@angular/core';
import { analyze } from 'src/app/common/password-util';
import { ApiService, Tip } from 'src/app/services/api.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  tips: Tip[] = [];
  cat = 'All';
  pledges = 0;
  error = false;
  pw = '';
  analyze = analyze;
  a = analyze('');

  constructor(private api: ApiService) { }

  ngOnInit(): void {
    this.api.tips().subscribe({ next: t => (this.tips = t), error: () => (this.error = true) });
    this.api.stats().subscribe({ next: s => (this.pledges = s.pledges), error: () => { } });

  }

  get cats(): string[] { return ['All', ...Array.from(new Set(this.tips.map(t => t.category)))]; }
  get shown(): Tip[] { return this.cat === 'All' ? this.tips : this.tips.filter(t => t.category === this.cat); }
}
