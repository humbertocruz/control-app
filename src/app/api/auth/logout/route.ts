import { NextResponse } from 'next/server'
import { clearAuthCookie } from '@/lib/auth'

export async function POST() {
  try {
    await clearAuthCookie()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao sair:', error)
    return NextResponse.json({ error: 'Falha ao sair' }, { status: 500 })
  }
}