import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getCurrentUserFromCookies } from '@/lib/auth'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const payload = await getCurrentUserFromCookies()
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, createdAt: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Erro ao obter usuário atual:', error)
    return NextResponse.json({ error: 'Falha ao obter usuário' }, { status: 500 })
  }
}