import { Component, OnInit } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { analyze, generate, sha1Hex } from 'src/app/common/password-util';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-lab',
  templateUrl: './lab.component.html',
  styleUrls: ['./lab.component.css']
})
export class LabComponent implements OnInit {

  pw = '';
  show = false;
  busy = false;
  a = analyze('');
  breach: { kind: 'good' | 'bad' | 'warn'; msg: string } | null = null;

  len = 16;
  opts: Record<string, boolean> = { lower: true, upper: true, digits: true, symbols: true };
  optList = [{ k: 'lower', l: 'Lowercase' }, { k: 'upper', l: 'Uppercase' }, { k: 'digits', l: 'Numbers' }, { k: 'symbols', l: 'Symbols' }];
  generated = '';
  copied = false;

  constructor(private api: ApiService) { }

  ngOnInit(): void { this.make(); }

  onChange(): void { this.a = analyze(this.pw); this.breach = null; }

  async checkBreach(): Promise<void> {
    this.busy = true;
    this.breach = null;
    try {
      const hash = await sha1Hex(this.pw);
      const text = await firstValueFrom(this.api.breachRange(hash.slice(0, 5)));
      const line = text.split('\n').find(l => l.startsWith(hash.slice(5)));
      const count = line ? parseInt(line.split(':')[1], 10) : 0;
      this.breach = count > 0
        ? { kind: 'bad', msg: `This password appears ${count.toLocaleString()} times in known data breaches. Do not use it.` }
        : { kind: 'good', msg: 'Not found in known breaches. Keep it unique to this one account.' };
    } catch {
      this.breach = { kind: 'warn', msg: 'The breach service could not be reached. Check the API is running and try again.' };
    }
    this.busy = false;
  }

  make(): void { this.generated = generate(this.len, this.opts); this.copied = false; }

  async copy(): Promise<void> {
    try { await navigator.clipboard.writeText(this.generated); this.copied = true; setTimeout(() => (this.copied = false), 1500); } catch { }
  }

  useIt(): void { this.pw = this.generated; this.onChange(); }

}
