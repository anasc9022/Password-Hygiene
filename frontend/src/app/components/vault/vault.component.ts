import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { analyze, generate } from 'src/app/common/password-util';
import { VaultEntry, VaultService } from 'src/app/services/vault.service';

@Component({
  selector: 'app-vault',
  templateUrl: './vault.component.html',
  styleUrls: ['./vault.component.css']
})
export class VaultComponent {

  mode: 'unlock' | 'create' = 'unlock';
  username = ''; master = ''; again = '';
  busy = false; error = '';
  search = '';
  form: VaultEntry | null = null;
  shown: Record<string, boolean> = {};
  note: { kind: 'good' | 'bad'; text: string } | null = null;
  analyze = analyze;

  constructor(public v: VaultService) { }

  get canCreate(): boolean { return this.username.trim().length >= 3 && analyze(this.master).score >= 3 && this.master === this.again; }

  get filtered(): VaultEntry[] {
    const q = this.search.trim().toLowerCase();
    return this.v.entries.filter(e => !q || e.site.toLowerCase().includes(q) || e.username.toLowerCase().includes(q));
  }

  async submit(): Promise<void> {
    this.busy = true; this.error = '';
    const name = this.username.trim().toLowerCase();
    try {
      if (this.mode === 'create') await this.v.register(name, this.master);
      else await this.v.login(name, this.master);
      this.master = ''; this.again = ''; this.note = null;
    } catch (e) { this.error = this.explain(e); }
    this.busy = false;
  }

  startAdd(): void { this.form = { id: '', site: '', username: '', password: '', notes: '', updatedAt: 0 }; }
  edit(e: VaultEntry): void { this.form = { ...e }; }
  fill(): void { if (this.form) this.form.password = generate(20, { lower: true, upper: true, digits: true, symbols: true }); }

  async saveForm(): Promise<void> {
    if (!this.form) return;
    try {
      await this.v.upsert({ ...this.form, site: this.form.site.trim() });
      this.form = null;
      this.note = { kind: 'good', text: 'Saved. Encrypted in your browser before upload.' };
    } catch (e) { this.note = { kind: 'bad', text: this.explainSave(e) }; }
  }

  async remove(e: VaultEntry): Promise<void> {
    if (!window.confirm(`Delete "${e.site}"?`)) return;
    try { await this.v.remove(e.id); this.note = { kind: 'good', text: 'Item deleted.' }; }
    catch (err) { this.note = { kind: 'bad', text: this.explainSave(err) }; }
  }

  copy(text: string): void {
    this.v.copy(text);
    this.note = { kind: 'good', text: 'Copied. The clipboard is cleared in 20 seconds.' };
  }

  download(): void {
    const url = URL.createObjectURL(new Blob([this.v.exportBackup()], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url; a.download = `safekey-backup-${this.v.username}.json`; a.click();
    URL.revokeObjectURL(url);
  }

  private explain(e: unknown): string {
    switch ((e as HttpErrorResponse)?.status) {
      case 401: return 'Invalid username or password.';
      case 409: return 'That username is taken.';
      case 429: return 'Too many attempts. Try again in a few minutes.';
      case 0: return 'Cannot reach the API. Start the Spring Boot server on port 8080.';
      default: return 'Something went wrong. Try again.';
    }
  }

  private explainSave(e: unknown): string {
    const s = (e as HttpErrorResponse)?.status;
    if (s === 401) { this.v.lock(); return 'Session expired. Unlock your vault again.'; }
    if (s === 409) return 'Vault changed elsewhere. Lock and unlock to reload, then retry.';
    return 'Could not save. Check the API is running.';
  }

}
