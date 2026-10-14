import { Component, OnInit } from '@angular/core';

const KEY = 'safekey.checklist';

@Component({
  selector: 'app-checklist',
  templateUrl: './checklist.component.html',
  styleUrls: ['./checklist.component.css']
})
export class ChecklistComponent implements OnInit {

  groups = [
    {
      title: 'Passwords', items: [
        { id: 'pm', text: 'I use a password manager' },
        { id: 'uniq', text: 'Every account has a unique password' },
        { id: 'len', text: 'My important passwords are 14+ characters or a passphrase' },
        { id: 'breach', text: 'I have checked my key passwords for breaches' }]
    },
    {
      title: 'Accounts', items: [
        { id: 'mfa', text: 'Multi-factor authentication is on for email, banking and social accounts' },
        { id: 'app', text: 'I use an authenticator app or security key instead of SMS where possible' },
        { id: 'codes', text: 'My backup and recovery codes are stored offline' },
        { id: 'old', text: 'I have deleted accounts I no longer use' }]
    },
    {
      title: 'Personal data', items: [
        { id: 'perm', text: 'I have reviewed app permissions for location, camera and microphone' },
        { id: 'share', text: 'I limit what I share publicly on social media' },
        { id: 'enc', text: 'My devices are locked and encrypted' },
        { id: 'upd', text: 'My devices and apps install updates promptly' }]
    },
    {
      title: 'Phishing', items: [
        { id: 'verify', text: 'I verify the sender before clicking links or opening attachments' },
        { id: 'otp', text: 'I never share one-time codes with anyone' }]
    },
  ];
  done: Record<string, boolean> = {};

  ngOnInit(): void {
    try { this.done = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { this.done = {}; }
  }

  toggle(id: string): void { this.done[id] = !this.done[id]; this.save(); }
  reset(): void { this.done = {}; this.save(); }
  private save(): void { try { localStorage.setItem(KEY, JSON.stringify(this.done)); } catch { } }

  get total(): number { return this.groups.reduce((n, g) => n + g.items.length, 0); }
  get count(): number { return this.groups.reduce((n, g) => n + g.items.filter(i => this.done[i.id]).length, 0); }
  get pct(): number { return Math.round((this.count / this.total) * 100); }

}
