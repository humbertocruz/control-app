import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

const TOKEN_NAME = 'auth_token'

const getSecret = () => {
  return process.env.AUTH_SECRET || 'dev-secret'
}

export interface AuthTokenPayload {
  userId: string
  email: string
}

export function signToken(payload: AuthTokenPayload, expiresIn: string = '7d') {
  return jwt.sign(payload, getSecret(), { expiresIn })
}

export function verifyToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.verify(token, getSecret()) as AuthTokenPayload
  } catch {
    return null
  }
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set({
    name: TOKEN_NAME,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
}

export async function clearAuthCookie() {
  const cookieStore = await cookies()
  cookieStore.set({
    name: TOKEN_NAME,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    path: '/',
    maxAge: 0,
  })
}

export async function getAuthTokenFromCookies() {
  const cookieStore = await cookies()
  return cookieStore.get(TOKEN_NAME)?.value || null
}

export async function getCurrentUserFromCookies(): Promise<AuthTokenPayload | null> {
  const token = await getAuthTokenFromCookies()
  if (!token) return null
  return verifyToken(token)
}