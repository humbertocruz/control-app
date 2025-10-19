import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient, Prisma } from '@prisma/client'
import { getCurrentUserFromCookies } from '@/lib/auth'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const payload = await getCurrentUserFromCookies()
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const expenses = await prisma.expense.findMany({
      where: { userId: payload.userId },
      orderBy: { date: 'desc' }
    })
    
    return NextResponse.json(expenses)
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await getCurrentUserFromCookies()
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { description, amount, date, paymentMethod } = await request.json()
    
    const expense = await prisma.expense.create({
      data: {
        userId: payload.userId,
        description,
        amount: parseFloat(amount),
        // Parse "YYYY-MM-DD" como meio-dia UTC para evitar deslocamento de fuso
        date: new Date(`${date}T12:00:00.000Z`),
        paymentMethod: (paymentMethod || 'cash') as 'cash' | 'pix' | 'credit',
      }
    })

    // Ajusta dados financeiros conforme método de pagamento
    const fd = await prisma.financialData.findFirst({
      where: { userId: payload.userId },
      orderBy: { id: 'desc' }
    })

    if (fd) {
      if (expense.paymentMethod === 'cash' || expense.paymentMethod === 'pix') {
        const newTotal = (fd.totalMoney || 0) - expense.amount
        await prisma.financialData.update({
          where: { id: fd.id },
          data: { totalMoney: newTotal }
        })
      } else if (expense.paymentMethod === 'credit') {
        const newUsed = (fd.creditUsed || 0) + expense.amount
        await prisma.financialData.update({
          where: { id: fd.id },
          data: { creditUsed: newUsed }
        })
      }
    }
    
    return NextResponse.json(expense)
  } catch (error) {
    console.error('Error creating expense:', error)
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const payload = await getCurrentUserFromCookies()
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }
    
    await prisma.expense.delete({
      where: { id: id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting expense:', error)
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 })
  }
}