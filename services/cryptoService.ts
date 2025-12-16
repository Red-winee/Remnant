/**
 * Handles AES-256-GCM encryption/decryption and PBKDF2 key derivation.
 * This ensures data at rest is secure, accessible only with the user's PIN.
 */

const SALT_KEY = 'remnant_auth_salt';
const SENTINEL_KEY = 'remnant_auth_sentinel'; // Encrypted string "VALID" to check PIN
const ITERATIONS = 100000;
const ALGO_KEY = 'PBKDF2';
const ALGO_ENCRYPT = 'AES-GCM';

let cachedKey: CryptoKey | null = null;

// Helper to generate a random salt
function generateSalt(): Uint8Array {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  localStorage.setItem(SALT_KEY, Array.from(salt).toString());
  return salt;
}

// Helper to get existing salt
function getSalt(): Uint8Array | null {
  const saltStr = localStorage.getItem(SALT_KEY);
  if (!saltStr) return null;
  return new Uint8Array(saltStr.split(',').map(Number));
}

// Derive a key from the user's PIN
export async function deriveKey(pin: string): Promise<CryptoKey> {
  let salt = getSalt();
  if (!salt) {
    salt = generateSalt();
  }

  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(pin),
    { name: ALGO_KEY },
    false,
    ['deriveKey']
  );

  const key = await window.crypto.subtle.deriveKey(
    {
      name: ALGO_KEY,
      salt: salt,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGO_ENCRYPT, length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  return key;
}

export function isKeyDerived(): boolean {
  return !!cachedKey;
}

// Setup a new PIN: Derives key, encrypts a sentinel "VALID", and stores it.
export async function setupPin(pin: string): Promise<void> {
    cachedKey = await deriveKey(pin);
    const sentinel = "VALID";
    const packed = await packEncrypted(sentinel);
    // Convert ArrayBuffer to string for localStorage
    const packedStr = btoa(String.fromCharCode(...new Uint8Array(packed)));
    localStorage.setItem(SENTINEL_KEY, packedStr);
    setPinStored();
}

// Verify PIN: Derives key, attempts to decrypt sentinel. If "VALID", saves key to cache.
export async function checkPin(pin: string): Promise<boolean> {
    try {
        const key = await deriveKey(pin);
        // Temporarily set cachedKey so decryptData works
        const tempOldKey = cachedKey;
        cachedKey = key;
        
        const storedSentinel = localStorage.getItem(SENTINEL_KEY);
        if (!storedSentinel) {
             // Should not happen if hasStoredPin is true
             return false;
        }

        const packedData = Uint8Array.from(atob(storedSentinel), c => c.charCodeAt(0)).buffer;
        const result = await unpackAndDecrypt(packedData);
        
        if (result === 'VALID') {
            return true; 
        } else {
            cachedKey = tempOldKey;
            return false;
        }
    } catch (e) {
        cachedKey = null;
        return false;
    }
}


// Encrypt text or data
export async function encryptData(data: string | ArrayBuffer): Promise<{ iv: Uint8Array; cipherText: ArrayBuffer }> {
  if (!cachedKey) throw new Error("App is locked");

  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  let dataBuffer: ArrayBuffer;

  if (typeof data === 'string') {
    dataBuffer = new TextEncoder().encode(data);
  } else {
    dataBuffer = data;
  }

  const cipherText = await window.crypto.subtle.encrypt(
    {
      name: ALGO_ENCRYPT,
      iv: iv,
    },
    cachedKey,
    dataBuffer
  );

  return { iv, cipherText };
}

// Decrypt data
export async function decryptData(cipherText: ArrayBuffer, iv: Uint8Array, isText: boolean = true): Promise<string | ArrayBuffer> {
  if (!cachedKey) throw new Error("App is locked");

  try {
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: ALGO_ENCRYPT,
        iv: iv,
      },
      cachedKey,
      cipherText
    );

    if (isText) {
      return new TextDecoder().decode(decryptedBuffer);
    }
    return decryptedBuffer;
  } catch (e) {
    console.error("Decryption failed", e);
    throw new Error("Failed to decrypt data. Invalid key or corrupted data.");
  }
}

export function hasStoredPin(): boolean {
    return !!localStorage.getItem('remnant_has_pin');
}

export function setPinStored() {
    localStorage.setItem('remnant_has_pin', 'true');
}

// Helper to combine IV and Ciphertext for storage (IV + Ciphertext)
export async function packEncrypted(data: string): Promise<ArrayBuffer> {
    const { iv, cipherText } = await encryptData(data);
    const combined = new Uint8Array(iv.length + cipherText.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(cipherText), iv.length);
    return combined.buffer;
}

export async function unpackAndDecrypt(packedData: ArrayBuffer): Promise<string> {
    const iv = new Uint8Array(packedData.slice(0, 12));
    const cipherText = packedData.slice(12);
    return (await decryptData(cipherText, iv, true)) as string;
}

// For media (ArrayBuffer)
export async function packEncryptedBinary(data: ArrayBuffer): Promise<ArrayBuffer> {
    const { iv, cipherText } = await encryptData(data);
    const combined = new Uint8Array(iv.length + cipherText.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(cipherText), iv.length);
    return combined.buffer;
}

export async function unpackAndDecryptBinary(packedData: ArrayBuffer): Promise<ArrayBuffer> {
    const iv = new Uint8Array(packedData.slice(0, 12));
    const cipherText = packedData.slice(12);
    return (await decryptData(cipherText, iv, false)) as ArrayBuffer;
}