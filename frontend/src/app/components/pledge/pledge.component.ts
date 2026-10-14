import { Component, OnInit } from '@angular/core';
import { ApiService, PledgeView } from 'src/app/services/api.service';

@Component({
  selector: 'app-pledge',
  templateUrl: './pledge.component.html',
  styleUrls: ['./pledge.component.css']
})
export class PledgeComponent implements OnInit {

 options = [
    'Use a password manager', 'Use a unique password for every account', 'Turn on multi-factor authentication',
    'Check my passwords for breaches', 'Think before I click', 'Review app permissions', 'Keep my devices updated', 'Share what I learn',
  ];
  nickname = '';
  picked = new Set<string>();
  sent = false;
  error = '';
  recent: PledgeView[] = [];
  total = 0;
 
  constructor(private api: ApiService) {}
 
  ngOnInit(): void { this.load(); }
 
  load(): void { this.api.stats().subscribe({ next: s => { this.recent = s.recent; this.total = s.pledges; }, error: () => {} }); }
 
  toggle(o: string): void { this.picked.has(o) ? this.picked.delete(o) : this.picked.add(o); }
 
  submit(): void {
    this.error = '';
    this.api.pledge(this.nickname.trim(), Array.from(this.picked)).subscribe({
      next: () => { this.sent = true; this.load(); },
      error: () => (this.error = 'Could not save your pledge. Check the API is running and try again.'),
    });
  }

}
