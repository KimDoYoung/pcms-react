/**
 * S-Note 클라이언트 사이드 암호화/복호화 유틸리티 (crypto-js 버전)
 *
 * 암호화 포맷: snote-v2.0[hint][sha256hexhash][crypto_js_aes_base64]
 * - hint     : 사용자가 비밀번호를 기억하기 위한 힌트 (][를 포함할 수 없음)
 * - sha256   : SHA-256(password) 16진수 문자열 (항상 64자)
 * - base64   : crypto-js가 생성한 Base64 AES 암호문 (내부에 Salt 포함됨)
 *
 * 사용 예:
 *   const blob = await encryptNote('내용', 'mypass', '힌트')
 *   const hint = extractHint(blob)
 *   const ok   = await validatePassword(blob, 'mypass')
 *   const text = await decryptNote(blob, 'mypass')
 */

import CryptoJS from 'crypto-js'

const MAGIC = 'snote-v2.0'

// ── 내부 헬퍼 ──────────────────────────────────────────────

function parseParts(blob: string): { hint: string; storedHash: string; cipherText: string } {
  if (!blob.startsWith(MAGIC)) throw new Error('snote 포맷이 아닙니다.')
  const rest = blob.slice(MAGIC.length) // 시작: [
  const sep1 = rest.indexOf('][')
  const hintPart = rest.slice(1, sep1) // hint (첫 [ 제거)
  const afterHint = rest.slice(sep1 + 1) // [hash][cipher]
  const sep2 = afterHint.indexOf('][')
  const storedHash = afterHint.slice(1, sep2)
  const cipherText = afterHint.slice(sep2 + 2, -1) // 마지막 ] 제거
  return { hint: hintPart, storedHash, cipherText }
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
  const inputHash = CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex)
  return storedHash === inputHash
}

/** plaintext를 암호화해서 snote-v2.0 blob 반환 */
export async function encryptNote(
  plaintext: string,
  password: string,
  hint: string,
): Promise<string> {
  if (hint.includes('][')) throw new Error("힌트에 '][' 문자는 사용할 수 없습니다.")

  const hashHex = CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex)
  // CryptoJS.AES 암호화를 통해 자동으로 생성된 Salt와 함께 포맷 생성
  const cipherText = CryptoJS.AES.encrypt(plaintext, password).toString()

  return `${MAGIC}[${hint}][${hashHex}][${cipherText}]`
}

/** snote-v2.0 blob을 복호화해서 원문 반환 */
export async function decryptNote(blob: string, password: string): Promise<string> {
  const { cipherText } = parseParts(blob)
  
  const isValid = await validatePassword(blob, password)
  if (!isValid) throw new Error('비밀번호가 틀렸습니다.')

  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, password)
    const plainText = bytes.toString(CryptoJS.enc.Utf8)
    if (!plainText) throw new Error()
    return plainText
  } catch {
    throw new Error('복호화에 실패했습니다. 유효하지 않은 암호문이거나 형식이 잘못되었습니다.')
  }
}
