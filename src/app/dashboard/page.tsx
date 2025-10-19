'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Header from '@/components/Header'
import Chat from '@/components/Chat'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  DollarSign, 
  Calendar, 
  CreditCard, 
  Receipt, 
  TrendingUp, 
  TrendingDown,
  Loader2
} from 'lucide-react'

interface FinancialData {
  totalMoney: number
  nextPaymentDate: string
  creditLimit?: number
  creditUsed?: number
  statementClosingDate?: string | null
  dueDate?: string | null
}

interface FixedExpense {
  id: string
  name: string
  amount: number
  frequency: 'daily' | 'weekly' | 'monthly'
  paymentDate: string
}

interface Expense {
  id: string
  description: string
  amount: number
  date: string
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [financialData, setFinancialData] = useState<FinancialData | null>(null)
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [dailySpending, setDailySpending] = useState(0)
  const [todayFixedExpenses, setTodayFixedExpenses] = useState<FixedExpense[]>([])
  const [dismissedIds, setDismissedIds] = useState<string[]>([])
  const [addingId, setAddingId] = useState<string | null>(null)

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return

      try {
        setLoading(true)
        
        // Load financial data
        const financialResponse = await fetch('/api/financial-data')
        if (financialResponse.ok) {
          const data = await financialResponse.json()
          setFinancialData(data)
        }

        // Load fixed expenses
        const fixedExpensesResponse = await fetch('/api/fixed-expenses')
        if (fixedExpensesResponse.ok) {
          const data = await fixedExpensesResponse.json()
          setFixedExpenses(data)
        }

        // Load expenses
        const expensesResponse = await fetch('/api/expenses')
        if (expensesResponse.ok) {
          const data = await expensesResponse.json()
          setExpenses(data)
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [user])

  // Detecta gastos fixos mensais do dia pelo dia UTC
  useEffect(() => {
    const todayUTC = new Date()
    const todayDay = todayUTC.getUTCDate()
    const dueToday = fixedExpenses.filter((e) => {
      const day = new Date(e.paymentDate).getUTCDate()
      return e.frequency === 'monthly' && day === todayDay
    })
    setTodayFixedExpenses(dueToday)
  }, [fixedExpenses])

  const addFixedExpenseAsExpense = async (fx: FixedExpense) => {
    try {
      setAddingId(fx.id)
      const todayStr = new Date().toISOString().split('T')[0]
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: fx.name, amount: fx.amount, date: todayStr, paymentMethod: 'cash' }),
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Falha ao registrar despesa')
      const created = await res.json()
      setExpenses((prev) => [created, ...prev])
      setDismissedIds((prev) => [...prev, fx.id])
    } catch (err) {
      console.error('Erro ao adicionar despesa fixa como despesa:', err)
    } finally {
      setAddingId(null)
    }
  }

  const calculateDailySpending = () => {
    if (!financialData) return 0

    const total = financialData.totalMoney
    const paymentDate = new Date(financialData.nextPaymentDate)
    const today = new Date()
    const daysUntilPayment = Math.ceil((paymentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntilPayment <= 0) return 0

    // Calculate total fixed expenses per day
    const totalFixedExpensesPerDay = fixedExpenses.reduce((sum, expense) => {
      const expensePaymentDate = new Date(expense.paymentDate)
      
      if (expensePaymentDate >= paymentDate) return sum

      switch (expense.frequency) {
        case 'daily':
          return sum + expense.amount
        case 'weekly':
          return sum + (expense.amount / 7)
        case 'monthly':
          return sum + (expense.amount / 30)
        default:
          return sum
      }
    }, 0)

    // Calculate total registered expenses
    const totalRegisteredExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)

    const availableMoney = total - (totalFixedExpensesPerDay * daysUntilPayment) - totalRegisteredExpenses
    return Math.max(0, availableMoney / daysUntilPayment)
  }

  useEffect(() => {
    setDailySpending(calculateDailySpending())
  }, [financialData, fixedExpenses, expenses])

  const totalFixedExpenses = fixedExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  const totalDailyExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const daysUntilPayment = financialData 
    ? Math.ceil((new Date(financialData.nextPaymentDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Header dailySpending={dailySpending} />
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Header dailySpending={dailySpending} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-2">Visão geral das suas finanças</p>
        </div>

        {/* Lembrete de gastos fixos do dia */}
        {todayFixedExpenses.filter((fx) => !dismissedIds.includes(fx.id)).length > 0 && (
          <Card className="bg-blue-900/20 border border-blue-700 mb-6">
            <CardHeader>
              <CardTitle className="text-white">Lembrete de Gasto Fixo de Hoje</CardTitle>
              <CardDescription className="text-gray-300">
                Deseja registrar no dashboard as despesas fixas de hoje?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {todayFixedExpenses.filter((fx) => !dismissedIds.includes(fx.id)).map((fx) => (
                  <div key={fx.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                    <div>
                      <p className="text-white font-medium">{fx.name}</p>
                      <p className="text-sm text-gray-400">Valor: R$ {fx.amount.toFixed(2)} • Dia {new Date(fx.paymentDate).getUTCDate()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => addFixedExpenseAsExpense(fx)}
                        disabled={addingId === fx.id}
                      >
                        {addingId === fx.id ? 'Adicionando...' : 'Adicionar hoje'}
                      </Button>
                      <Button
                        variant="outline"
                        className="border-gray-700"
                        onClick={() => setDismissedIds((prev) => [...prev, fx.id])}
                      >
                        Agora não
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Saldo Total */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Saldo Total
              </CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                R$ {financialData?.totalMoney?.toFixed(2) || '0,00'}
              </div>
              <p className="text-xs text-gray-400">
                Próximo pagamento em {daysUntilPayment} dias
              </p>
            </CardContent>
          </Card>

          {/* Gasto Diário Disponível */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Disponível Hoje
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                R$ {dailySpending.toFixed(2)}
              </div>
              <p className="text-xs text-gray-400">
                Por dia até o próximo pagamento
              </p>
            </CardContent>
          </Card>

          {/* Gastos Fixos */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Gastos Fixos
              </CardTitle>
              <CreditCard className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                R$ {totalFixedExpenses.toFixed(2)}
              </div>
              <p className="text-xs text-gray-400">
                {fixedExpenses.length} gastos cadastrados
              </p>
            </CardContent>
          </Card>

          {/* Cartão de Crédito */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Cartão de Crédito
              </CardTitle>
              <CreditCard className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-300">
                Limite: R$ {(financialData?.creditLimit !== undefined ? (financialData.creditLimit || 0).toFixed(2) : '0,00')}
              </div>
              <div className="text-2xl font-bold text-white">
                Limite disponível: R$ {(
                  financialData?.creditLimit && financialData?.creditUsed !== undefined
                    ? Math.max(0, (financialData.creditLimit || 0) - (financialData.creditUsed || 0)).toFixed(2)
                    : '0,00'
                )}
              </div>
              <p className="text-xs text-gray-400">
                Fechamento: {financialData?.statementClosingDate ? new Date(financialData.statementClosingDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-'} | 
                Vencimento: {financialData?.dueDate ? new Date(financialData.dueDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-'}
              </p>
            </CardContent>
          </Card>

          {/* Despesas do Mês */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Despesas Registradas
              </CardTitle>
              <Receipt className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                R$ {totalDailyExpenses.toFixed(2)}
              </div>
              <p className="text-xs text-gray-400">
                {expenses.length} despesas registradas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Próximos Gastos Fixos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-orange-500" />
                Próximos Gastos Fixos
              </CardTitle>
              <CardDescription className="text-gray-400">
                Gastos fixos com vencimento próximo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {fixedExpenses
                  .sort((a, b) => new Date(a.paymentDate).getUTCDate() - new Date(b.paymentDate).getUTCDate())
                  .slice(0, 5)
                  .map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <div>
                        <p className="text-white font-medium">{expense.name}</p>
                        <p className="text-sm text-gray-400">
                          Dia {new Date(expense.paymentDate).getUTCDate()} - {expense.frequency}
                        </p>
                      </div>
                      <div className="text-orange-400 font-semibold">
                        R$ {expense.amount.toFixed(2)}
                      </div>
                    </div>
                  ))}
                {fixedExpenses.length === 0 && (
                  <p className="text-gray-400 text-center py-4">
                    Nenhum gasto fixo cadastrado
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Últimas Despesas */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Receipt className="h-5 w-5 mr-2 text-red-500" />
                Últimas Despesas
              </CardTitle>
              <CardDescription className="text-gray-400">
                Despesas registradas recentemente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {expenses
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 5)
                  .map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <div>
                        <p className="text-white font-medium">{expense.description}</p>
                        <p className="text-sm text-gray-400">
                          {new Date(expense.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                        </p>
                      </div>
                      <div className="text-red-400 font-semibold">
                        R$ {expense.amount.toFixed(2)}
                      </div>
                    </div>
                  ))}
                {expenses.length === 0 && (
                  <p className="text-gray-400 text-center py-4">
                    Nenhuma despesa registrada
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Chat Section */}
        <div className="mt-8">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Chat com IA</CardTitle>
              <CardDescription className="text-gray-400">
                Converse com a nossa IA para obter dicas financeiras
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Chat />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}