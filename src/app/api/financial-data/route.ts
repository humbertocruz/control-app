import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const financialData = await prisma.financialData.findFirst({
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
    const { totalMoney, nextPaymentDate } = await request.json()
    
    // Delete existing data and create new one (simple approach for single user)
    await prisma.financialData.deleteMany()
    
    const financialData = await prisma.financialData.create({
      data: {
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