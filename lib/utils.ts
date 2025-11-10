import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { createHash } from 'crypto'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Small portability helper used in UI to produce a deterministic 32-byte hex string
// (named keccak for historical reasons — using SHA-256 here to avoid adding a new dependency).
export function hashKeccak256(input: string): string {
  return createHash('sha256').update(input).digest('hex')
}
