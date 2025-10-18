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
  const supabase = await createSupabaseServerClient()

  try {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, amount, frequency, paymentDate } = await request.json()
    
    const fixedExpense = await prisma.fixedExpense.create({
      data: {
        userId: session.user.id,
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
  const supabase = await createSupabaseServerClient()

  try {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }
    
    await prisma.fixedExpense.delete({
      where: { id: id, userId: session.user.id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting fixed expense:', error)
    return NextResponse.json({ error: 'Failed to delete fixed expense' }, { status: 500 })
  }
}