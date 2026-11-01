const te = new TextEncoder();

export const b64 = (buf: ArrayBuffer | Uint8Array): string => {
    const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    let s = '';
    for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return btoa(s);
};

// No explicit return type on purpose: newer TypeScript infers Uint8Array<ArrayBuffer>, which Web Crypto accepts as a BufferSource.
export const unb64 = (s: string) => {
    const bin = atob(s);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
};

/**
 * master password -> PBKDF2 (600k iterations) -> HKDF -> two independent keys:
 *  - encKey: AES-GCM key, stays in memory, never sent anywhere
 *  - authKey: sent to the server to prove knowledge of the master password
 */
export async function deriveKeys(master: string, saltB64: string): Promise<{ encKey: CryptoKey; authKey: string }> {
    const base = await crypto.subtle.importKey('raw', te.encode(master), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: unb64(saltB64), iterations: 600_000, hash: 'SHA-256' }, base, 256);
    const hk = await crypto.subtle.importKey('raw', bits, 'HKDF', false, ['deriveBits', 'deriveKey']);
    const params = (info: string) => ({ name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(), info: te.encode(info) });
    const authBits = await crypto.subtle.deriveBits(params('safekey-auth'), hk, 256);
    const encKey = await crypto.subtle.deriveKey(params('safekey-enc'), hk, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    return { encKey, authKey: b64(authBits) };
}

export async function encryptJson(key: CryptoKey, data: unknown): Promise<{ iv: string; blob: string }> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, te.encode(JSON.stringify(data)));
    return { iv: b64(iv), blob: b64(ct) };
}

export async function decryptJson<T>(key: CryptoKey, iv: string, blob: string): Promise<T> {
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(iv) }, key, unb64(blob));
    return JSON.parse(new TextDecoder().decode(pt)) as T;
}