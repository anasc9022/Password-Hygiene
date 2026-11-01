import { Injectable } from '@angular/core';
import { ApiService, VaultSession } from './api.service';
import { b64, decryptJson, deriveKeys, encryptJson } from '../common/vault.crypto';
import { firstValueFrom } from 'rxjs';
import { analyze, sha1Hex } from '../common/password-util';

export interface VaultEntry { id: string; site: string; username: string; password: string; notes: string; updatedAt: number; }

const LOCK_MS = 5 * 60 * 1000;
const OLD_MS = 180 * 86_400_000;
const newId = () => b64(crypto.getRandomValues(new Uint8Array(9))).replace(/[+/]/g, 'x');

@Injectable({
  providedIn: 'root'
})
export class VaultService {

  unlocked = false;
  username = '';
  entries: VaultEntry[] = [];
  version = 0;
  issues: Record<string, string[]> = {};
  health = 100;
  breached: Record<string, number> = {};
  scanning = false;
  scanned = false;
  scanFailed = false;

  private token = '';
  private key: CryptoKey | null = null;
  private salt = '';
  private payload: { iv: string; blob: string } | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor(private api: ApiService) {
    ['click', 'keydown'].forEach(ev => document.addEventListener(ev, () => this.touch()));
  }

  async register(username: string, master: string): Promise<void> {
    const salt = b64(crypto.getRandomValues(new Uint8Array(16)));
    const { encKey, authKey } = await deriveKeys(master, salt);
    await firstValueFrom(this.api.vaultRegister(username, salt, authKey));
    const session = await firstValueFrom(this.api.vaultLogin(username, authKey));
    await this.start(username, salt, encKey, session);
  }

  async login(username: string, master: string): Promise<void> {
    const { salt } = await firstValueFrom(this.api.vaultSalt(username));
    const { encKey, authKey } = await deriveKeys(master, salt);
    const session = await firstValueFrom(this.api.vaultLogin(username, authKey));
    await this.start(username, salt, encKey, session);
  }

  private async start(username: string, salt: string, key: CryptoKey, s: VaultSession): Promise<void> {
    this.entries = s.blob && s.iv ? await decryptJson<VaultEntry[]>(key, s.iv, s.blob) : [];
    this.username = username;
    this.salt = salt;
    this.key = key;
    this.token = s.token;
    this.version = s.version;
    this.payload = s.blob && s.iv ? { iv: s.iv, blob: s.blob } : null;
    this.breached = {};
    this.scanned = false;
    this.unlocked = true;
    this.recompute();
    this.touch();
  }

  async upsert(e: VaultEntry): Promise<void> {
    const i = this.entries.findIndex(x => x.id === e.id);
    const prev = i >= 0 ? this.entries[i] : null;
    const next: VaultEntry = {
      ...e,
      id: e.id || newId(),
      updatedAt: !prev || prev.password !== e.password ? Date.now() : prev.updatedAt,
    };
    const copy = [...this.entries];
    if (i >= 0) copy[i] = next; else copy.unshift(next);
    await this.commit(copy);
  }

  async remove(id: string): Promise<void> { await this.commit(this.entries.filter(e => e.id !== id)); }

  /** Encrypt first, then update local state only after the server accepted the new version. */
  private async commit(next: VaultEntry[]): Promise<void> {
    const p = await encryptJson(this.key!, next);
    const r = await firstValueFrom(this.api.vaultSave(this.token, { ...p, version: this.version }));
    this.entries = next;
    this.version = r.version;
    this.payload = p;
    this.recompute();
    this.touch();
  }

  lock(): void {
    if (this.token) this.api.vaultLogout(this.token).subscribe({ error: () => { } });
    clearTimeout(this.timer);
    this.token = ''; this.key = null; this.payload = null;
    this.entries = []; this.issues = {}; this.breached = {};
    this.unlocked = false;
  }

  private touch(): void {
    if (!this.unlocked) return;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.lock(), LOCK_MS);
  }

  /** Clipboard is cleared 20 seconds after copying a secret. */
  async copy(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      setTimeout(() => navigator.clipboard.writeText('').catch(() => { }), 20_000);
    } catch { }
  }

  /** Ciphertext only. Useless without the master password. */
  exportBackup(): string {
    return JSON.stringify({
      app: 'SafeKey', username: this.username, salt: this.salt,
      iv: this.payload?.iv ?? null, blob: this.payload?.blob ?? null,
      version: this.version, exportedAt: new Date().toISOString(),
    }, null, 2);
  }

  async scanBreaches(): Promise<void> {
    this.scanning = true; this.scanFailed = false; this.breached = {};
    try {
      for (const e of this.entries) this.breached[e.id] = await this.pwnedCount(e.password);
      this.scanned = true;
    } catch { this.scanFailed = true; }
    this.scanning = false;
    this.recompute();
  }

  private async pwnedCount(pw: string): Promise<number> {
    const hash = await sha1Hex(pw);
    const text = await firstValueFrom(this.api.breachRange(hash.slice(0, 5)));
    const line = text.split('\n').find(l => l.startsWith(hash.slice(5)));
    return line ? parseInt(line.split(':')[1], 10) : 0;
  }

  private recompute(): void {
    const counts = new Map<string, number>();
    this.entries.forEach(e => counts.set(e.password, (counts.get(e.password) || 0) + 1));
    const issues: Record<string, string[]> = {};
    for (const e of this.entries) {
      const list: string[] = [];
      if (analyze(e.password).score < 2) list.push('Weak');
      if ((counts.get(e.password) || 0) > 1) list.push('Reused');
      if (Date.now() - e.updatedAt > OLD_MS) list.push('Old');
      if ((this.breached[e.id] || 0) > 0) list.push('Breached');
      if (list.length) issues[e.id] = list;
    }
    this.issues = issues;
    const n = this.entries.length;
    this.health = n ? Math.round(((n - Object.keys(issues).length) / n) * 100) : 100;
  }

  count(issue: string): number { return Object.values(this.issues).filter(l => l.includes(issue)).length; }
}
