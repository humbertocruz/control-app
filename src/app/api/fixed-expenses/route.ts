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

    const fixedExpenses = await prisma.fixedExpense.findMany({
      where: { userId: payload.userId },
      orderBy: { paymentDate: 'asc' }
    })

    return NextResponse.json(fixedExpenses)
  } catch (error) {
    console.error('Error fetching fixed expenses:', error)
    return NextResponse.json({ error: 'Failed to fetch fixed expenses' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await getCurrentUserFromCookies()
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, amount, frequency, paymentDate } = await request.json()

    const fixedExpense = await prisma.fixedExpense.create({
      data: {
        userId: payload.userId,
        name,
        amount: parseFloat(amount),
        frequency,
        // Parse "YYYY-MM-DD" como meio-dia UTC para evitar deslocamento de fuso
        paymentDate: new Date(`${paymentDate}T12:00:00.000Z`)
      }
    })

    return NextResponse.json(fixedExpense)
  } catch (error) {
    console.error('Error creating fixed expense:', error)
    return NextResponse.json({ error: 'Failed to create fixed expense' }, { status: 500 })
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

    await prisma.fixedExpense.delete({
      where: { id: id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting fixed expense:', error)
    return NextResponse.json({ error: 'Failed to delete fixed expense' }, { status: 500 })
  }
}