// src/utils/crypto.ts

const USER_ID_SALT = 'vjs_gaming_default_salt_2026';

/**
 * 1. MASK USER IDENTITY (Safe synchronous hash)
 */
export function hashUserId(rawUserId: string): string {
  let hash = 0;
  for (let i = 0; i < rawUserId.length; i++) {
    const char = rawUserId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return 'hash_' + Math.abs(hash).toString(16);
}

/**
 * Helper to derive appropriate AES-GCM Key from text passphrase using PBKDF2
 */
async function deriveKey(passphrase: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passphraseBytes = encoder.encode(passphrase);
  
  // Import passphrase as base key material
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    passphraseBytes,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  
  // Derive 256-bit AES-GCM key
  return await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(USER_ID_SALT),
      iterations: 10000,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * 2. ENCRYPT DATA STRINGS (AES-256-GCM using Web Crypto API)
 */
export async function encryptData(text: string, passphrase?: string): Promise<string> {
  const keyPass = passphrase || 'default_secure_crypt_key_word';
  const key = await deriveKey(keyPass);
  
  const encoder = new TextEncoder();
  const textBytes = encoder.encode(text);
  
  // Generate a random 12-byte IV
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
      tagLength: 128
    },
    key,
    textBytes
  );
  
  // Web Crypto AES-GCM returns a buffer with [ciphertext, 16-byte authentication tag]
  const encryptedBytes = new Uint8Array(encryptedBuffer);
  const ciphertextBytes = encryptedBytes.slice(0, -16);
  const tagBytes = encryptedBytes.slice(-16);
  
  // Standard hex serialization
  const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
  const ciphertextHex = Array.from(ciphertextBytes).map(b => b.toString(16).padStart(2, '0')).join('');
  const tagHex = Array.from(tagBytes).map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `${ivHex}:${ciphertextHex}:${tagHex}`;
}

/**
 * 3. DECRYPT DATA STRINGS (AES-256-GCM using Web Crypto API)
 */
export async function decryptData(encryptedPayload: string, passphrase?: string): Promise<string> {
  const keyPass = passphrase || 'default_secure_crypt_key_word';
  const key = await deriveKey(keyPass);
  
  const parts = encryptedPayload.split(':');
  if (parts.length !== 3) {
    throw new Error('Cryptographic Discrepancy: Invalid or corrupted payload cipher format.');
  }
  
  const [ivHex, ciphertextHex, tagHex] = parts;
  
  const iv = new Uint8Array(ivHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
  const ciphertextBytes = new Uint8Array(ciphertextHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
  const tagBytes = new Uint8Array(tagHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
  
  // Combine ciphertext and auth tag for Web Crypto SubtleCrypto
  const combinedBytes = new Uint8Array(ciphertextBytes.length + tagBytes.length);
  combinedBytes.set(ciphertextBytes, 0);
  combinedBytes.set(tagBytes, ciphertextBytes.length);
  
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
      tagLength: 128
    },
    key,
    combinedBytes
  );
  
  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}
