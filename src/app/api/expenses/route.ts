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
    
    const data: any = {
      userId: payload.userId,
      description,
      amount: parseFloat(amount),
      date: new Date(date),
      paymentMethod: paymentMethod || 'cash',
    }

    const expense = await prisma.expense.create({
      data
    })

    // Ajusta dados financeiros conforme método de pagamento
    const fd: any = await prisma.financialData.findFirst({
      where: { userId: payload.userId },
      orderBy: { id: 'desc' }
    })

    if (fd) {
      if (data.paymentMethod === 'cash' || data.paymentMethod === 'pix') {
        const newTotal = (fd.totalMoney || 0) - data.amount
        await prisma.financialData.update({
          where: { id: fd.id },
          data: { totalMoney: newTotal } as any
        })
      } else if (data.paymentMethod === 'credit') {
        const newUsed = (fd.creditUsed || 0) + data.amount
        await prisma.financialData.update({
          where: { id: fd.id },
          data: { creditUsed: newUsed } as any
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