import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getCurrentUserFromCookies } from '@/lib/auth'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const payload = await getCurrentUserFromCookies()
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const financialData = await prisma.financialData.findFirst({
      where: { userId: payload.userId },
      orderBy: { id: 'desc' }
    })
    
    // Garantir resposta com campos esperados
    if (!financialData) {
      return NextResponse.json({
        totalMoney: 0,
        nextPaymentDate: null,
        creditLimit: 0,
        creditUsed: 0,
        statementClosingDate: null,
        dueDate: null,
      })
    }

    return NextResponse.json(financialData)
  } catch (error) {
    console.error('Error fetching financial data:', error)
    return NextResponse.json({ error: 'Failed to fetch financial data' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await getCurrentUserFromCookies()
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      totalMoney,
      nextPaymentDate,
      creditLimit,
      statementClosingDate,
      dueDate,
    } = body
    
    await prisma.financialData.deleteMany({
      where: { userId: payload.userId }
    })
    
    const financialData = await prisma.financialData.create({
      data: {
        userId: payload.userId,
        totalMoney: parseFloat(totalMoney),
        nextPaymentDate: new Date(nextPaymentDate),
        creditLimit: creditLimit ? parseFloat(creditLimit) : 0,
        statementClosingDate: statementClosingDate ? new Date(statementClosingDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
      }
    })
    
    return NextResponse.json(financialData)
  } catch (error) {
    console.error('Error saving financial data:', error)
    return NextResponse.json({ error: 'Failed to save financial data' }, { status: 500 })
  }
}