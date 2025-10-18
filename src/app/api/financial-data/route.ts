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

    const financialData = await prisma.financialData.findFirst({
      where: { userId: session.user.id },
      orderBy: { id: 'desc' }
    })
    
    return NextResponse.json(financialData || { totalMoney: 0, nextPaymentDate: null })
  } catch (error) {
    console.error('Error fetching financial data:', error)
    return NextResponse.json({ error: 'Failed to fetch financial data' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { totalMoney, nextPaymentDate, userId } = await request.json()
    
    // Delete existing data for this user and create new one
    await prisma.financialData.deleteMany({
      where: { userId }
    })
    
    const financialData = await prisma.financialData.create({
      data: {
        userId,
        totalMoney: parseFloat(totalMoney),
        nextPaymentDate: new Date(nextPaymentDate)
      }
    })
    
    return NextResponse.json(financialData)
  } catch (error) {
    console.error('Error saving financial data:', error)
    return NextResponse.json({ error: 'Failed to save financial data' }, { status: 500 })
  }
}