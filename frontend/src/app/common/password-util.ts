export interface Analysis {
    score: number;      // 0 (very weak) to 4 (excellent)
    label: string;
    entropy: number;    // estimated bits
    crackTime: string;
    checks: { label: string; ok: boolean }[];
}

const COMMON = /(password|passw0rd|qwerty|123456|letmein|admin|welcome|iloveyou|abc123)/i;
const LABELS = ['Very weak', 'Weak', 'Fair', 'Strong', 'Excellent'];

function formatTime(seconds: number): string {
    if (seconds < 1) return 'instantly';
    const units: [number, string][] = [[60, 'seconds'], [3600, 'minutes'], [86400, 'hours'], [31536000, 'days'], [3.15e9, 'years']];
    let prev = 1;
    for (const [limit, name] of units) {
        if (seconds < limit) return `${Math.round(seconds / prev)} ${name}`;
        prev = limit;
    }
    return 'centuries';
}

export function analyze(pw: string): Analysis {
    let pool = 0;
    if (/[a-z]/.test(pw)) pool += 26;
    if (/[A-Z]/.test(pw)) pool += 26;
    if (/\d/.test(pw)) pool += 10;
    if (/[^A-Za-z0-9]/.test(pw)) pool += 32;

    const repeats = /(.)\1{2,}/.test(pw);
    let entropy = pw.length * Math.log2(pool || 1);
    if (COMMON.test(pw)) entropy *= 0.4;
    if (repeats) entropy *= 0.8;
    entropy = Math.round(entropy);

    const score = entropy < 28 ? 0 : entropy < 36 ? 1 : entropy < 60 ? 2 : entropy < 80 ? 3 : 4;
    // Assumes an offline attacker making 10 billion guesses per second, finding the password halfway through.
    const seconds = Math.pow(2, entropy) / 2 / 1e10;

    return {
        score, entropy, label: LABELS[score], crackTime: formatTime(seconds),
        checks: [
            { label: 'At least 12 characters', ok: pw.length >= 12 },
            { label: 'Upper and lower case letters', ok: /[a-z]/.test(pw) && /[A-Z]/.test(pw) },
            { label: 'Includes a number', ok: /\d/.test(pw) },
            { label: 'Includes a symbol', ok: /[^A-Za-z0-9]/.test(pw) },
            { label: 'No common words or repeated characters', ok: pw.length > 0 && !COMMON.test(pw) && !repeats },
        ],
    };
}

const SETS: Record<string, string> = {
    lower: 'abcdefghijkmnopqrstuvwxyz', upper: 'ABCDEFGHJKLMNPQRSTUVWXYZ', digits: '23456789', symbols: '!@#$%^&*-_=+?',
};

/** Cryptographically secure random integer in [0, n) without modulo bias. */
function rnd(n: number): number {
    const a = new Uint32Array(1);
    const max = Math.floor(0xffffffff / n) * n;
    do { crypto.getRandomValues(a); } while (a[0] >= max);
    return a[0] % n;
}

export function generate(length: number, enabled: Record<string, boolean>): string {
    const pools = Object.keys(SETS).filter(k => enabled[k]).map(k => SETS[k]);
    if (!pools.length) return '';
    const all = pools.join('');
    const chars = pools.map(p => p[rnd(p.length)]);            // guarantee one of each chosen type
    while (chars.length < length) chars.push(all[rnd(all.length)]);
    for (let i = chars.length - 1; i > 0; i--) {               // Fisher-Yates shuffle
        const j = rnd(i + 1);
        [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    return chars.slice(0, length).join('');
}

export async function sha1Hex(text: string): Promise<string> {
    const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}