import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

const prisma = new PrismaClient()

export async function GET() {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  try {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const fixedExpenses = await prisma.fixedExpense.findMany({
      where: { userId: session.user.id },
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
    const { name, amount, frequency, paymentDate, userId } = await request.json()
    
    const fixedExpense = await prisma.fixedExpense.create({
      data: {
        userId,
        name,
        amount: parseFloat(amount),
        frequency,
        paymentDate: new Date(paymentDate)
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