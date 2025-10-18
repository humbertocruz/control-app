import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

const prisma = new PrismaClient()

const createSupabaseServerClient = async () => {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}

export async function GET() {
  const supabase = await createSupabaseServerClient()

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
  const supabase = await createSupabaseServerClient()
  try {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { totalMoney, nextPaymentDate } = await request.json()
    
    // Delete existing data for this user and create new one
    await prisma.financialData.deleteMany({
      where: { userId: session.user.id }
    })
    
    const financialData = await prisma.financialData.create({
      data: {
        userId: session.user.id,
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