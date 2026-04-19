/**
 * S-Note 클라이언트 사이드 암호화/복호화 유틸리티
 *
 * 암호화 포맷: snote-v1.0[hint][sha256hexhash][base64(iv+ciphertext)]
 * - hint     : 사용자가 비밀번호를 기억하기 위한 힌트 (][를 포함할 수 없음)
 * - sha256   : SHA-256(password) 16진수 문자열 (항상 64자)
 * - base64   : 12바이트 AES-GCM IV + 암호문을 base64 인코딩
 *
 * 사용 예:
 *   const blob = await encryptNote('내용', 'mypass', '힌트')
 *   const hint = extractHint(blob)
 *   const ok   = await validatePassword(blob, 'mypass')
 *   const text = await decryptNote(blob, 'mypass')
 */

const MAGIC = 'snote-v1.0'
const IV_BYTES = 12

// ── 내부 헬퍼 ──────────────────────────────────────────────

async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function deriveKey(password: string): Promise<CryptoKey> {
  const hashHex = await sha256Hex(password)
  const keyBytes = new Uint8Array(
    hashHex.match(/.{2}/g)!.map((h) => parseInt(h, 16)),
  )
  return crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ])
}

function parseParts(blob: string): { hint: string; storedHash: string; base64Cipher: string } {
  if (!blob.startsWith(MAGIC)) throw new Error('snote 포맷이 아닙니다.')
  const rest = blob.slice(MAGIC.length) // 시작: [
  const sep1 = rest.indexOf('][')
  const hintPart = rest.slice(1, sep1) // hint (첫 [ 제거)
  const afterHint = rest.slice(sep1 + 1) // [hash][cipher]
  const sep2 = afterHint.indexOf('][')
  const storedHash = afterHint.slice(1, sep2)
  const base64Cipher = afterHint.slice(sep2 + 2, -1) // 마지막 ] 제거
  return { hint: hintPart, storedHash, base64Cipher }
}

// ── 공개 API ───────────────────────────────────────────────

/** 암호화된 snote blob 여부 확인 */
export function isEncrypted(note: string): boolean {
  return note.startsWith(MAGIC)
}

/** blob에서 힌트만 추출 (비밀번호 불필요) */
export function extractHint(blob: string): string {
  try {
    return parseParts(blob).hint
  } catch {
    return ''
  }
}

/** 비밀번호 유효성 검사 (복호화 없이 해시만 비교) */
export async function validatePassword(blob: string, password: string): Promise<boolean> {
  const { storedHash } = parseParts(blob)
  const inputHash = await sha256Hex(password)
  return storedHash === inputHash
}

/** plaintext를 암호화해서 snote-v1.0 blob 반환 */
export async function encryptNote(
  plaintext: string,
  password: string,
  hint: string,
): Promise<string> {
  if (hint.includes('][')) throw new Error("힌트에 '][ ' 문자는 사용할 수 없습니다.")

  const hashHex = await sha256Hex(password)
  const key = await deriveKey(password)
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES))
  const cipherBuf = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plaintext),
  )

  const combined = new Uint8Array(IV_BYTES + cipherBuf.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(cipherBuf), IV_BYTES)
  const base64 = btoa(String.fromCharCode(...combined))

  return `${MAGIC}[${hint}][${hashHex}][${base64}]`
}

/** snote-v1.0 blob을 복호화해서 원문 반환 */
export async function decryptNote(blob: string, password: string): Promise<string> {
  const { base64Cipher } = parseParts(blob)
  const combined = Uint8Array.from(atob(base64Cipher), (c) => c.charCodeAt(0))
  const iv = combined.slice(0, IV_BYTES)
  const cipher = combined.slice(IV_BYTES)

  const key = await deriveKey(password)
  try {
    const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher)
    return new TextDecoder().decode(plainBuf)
  } catch {
    throw new Error('비밀번호가 틀렸습니다.')
  }
}
