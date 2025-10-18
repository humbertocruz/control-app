'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarIcon, PlusIcon, TrashIcon } from 'lucide-react'

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

export default function Home() {
  const [totalMoney, setTotalMoney] = useState<string>('')
  const [nextPaymentDate, setNextPaymentDate] = useState<string>('')
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([])
  const [newExpenseName, setNewExpenseName] = useState<string>('')
  const [newExpenseAmount, setNewExpenseAmount] = useState<string>('')
  const [newExpenseFrequency, setNewExpenseFrequency] = useState<'daily' | 'weekly' | 'monthly'>('monthly')
  const [newExpensePaymentDate, setNewExpensePaymentDate] = useState<string>('')
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [newExpenseDescription, setNewExpenseDescription] = useState<string>('')
  const [newExpenseAmountDaily, setNewExpenseAmountDaily] = useState<string>('')
  const [newExpenseDate, setNewExpenseDate] = useState<string>('')
  const [dailySpending, setDailySpending] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)

  // Load initial data from database
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        
        // Load financial data
        const financialResponse = await fetch('/api/financial-data')
        if (financialResponse.ok) {
          const financialData = await financialResponse.json()
          if (financialData.totalMoney) {
            setTotalMoney(financialData.totalMoney.toString())
          }
          if (financialData.nextPaymentDate) {
            setNextPaymentDate(new Date(financialData.nextPaymentDate).toISOString().split('T')[0])
          }
        }

        // Load fixed expenses
        const fixedExpensesResponse = await fetch('/api/fixed-expenses')
        if (fixedExpensesResponse.ok) {
          const fixedExpensesData = await fixedExpensesResponse.json()
          const formattedFixedExpenses = fixedExpensesData.map((expense: {
            id: number;
            name: string;
            amount: number;
            frequency: string;
            paymentDate: string;
          }) => ({
            id: expense.id.toString(),
            name: expense.name,
            amount: expense.amount,
            frequency: expense.frequency,
            paymentDate: new Date(expense.paymentDate).toISOString().split('T')[0]
          }))
          setFixedExpenses(formattedFixedExpenses)
        }

        // Load expenses
        const expensesResponse = await fetch('/api/expenses')
        if (expensesResponse.ok) {
          const expensesData = await expensesResponse.json()
          const formattedExpenses = expensesData.map((expense: {
            id: number;
            description: string;
            amount: number;
            date: string;
          }) => ({
            id: expense.id.toString(),
            description: expense.description,
            amount: expense.amount,
            date: new Date(expense.date).toISOString().split('T')[0]
          }))
          setExpenses(formattedExpenses)
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Save financial data automatically
  const saveFinancialData = async (money: string, paymentDate: string) => {
    if (!money || !paymentDate) return
    
    try {
      setSaving(true)
      await fetch('/api/financial-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalMoney: money,
          nextPaymentDate: paymentDate
        })
      })
    } catch (error) {
      console.error('Error saving financial data:', error)
    } finally {
      setSaving(false)
    }
  }

  // Auto-save financial data when changed
  useEffect(() => {
    if (totalMoney && nextPaymentDate && !loading) {
      const timeoutId = setTimeout(() => {
        saveFinancialData(totalMoney, nextPaymentDate)
      }, 1000) // Debounce for 1 second

      return () => clearTimeout(timeoutId)
    }
  }, [totalMoney, nextPaymentDate, loading])

  const calculateDailySpending = () => {
    if (!totalMoney || !nextPaymentDate) return 0

    const total = parseFloat(totalMoney)
    const paymentDate = new Date(nextPaymentDate)
    const today = new Date()
    const daysUntilPayment = Math.ceil((paymentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntilPayment <= 0) return 0

    // Calculate total fixed expenses per day (only those that are due before next payment)
    const totalFixedExpensesPerDay = fixedExpenses.reduce((sum, expense) => {
      const expensePaymentDate = new Date(expense.paymentDate)
      
      // Only consider expenses that are due before the next payment date
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
  }, [totalMoney, nextPaymentDate, fixedExpenses, expenses, calculateDailySpending])

  const addFixedExpense = async () => {
    if (!newExpenseName || !newExpenseAmount || !newExpensePaymentDate) return

    try {
      setSaving(true)
      const response = await fetch('/api/fixed-expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newExpenseName,
          amount: newExpenseAmount,
          frequency: newExpenseFrequency,
          paymentDate: newExpensePaymentDate
        })
      })

      if (response.ok) {
        const savedExpense = await response.json()
        const newExpense: FixedExpense = {
          id: savedExpense.id.toString(),
          name: savedExpense.name,
          amount: savedExpense.amount,
          frequency: savedExpense.frequency,
          paymentDate: new Date(savedExpense.paymentDate).toISOString().split('T')[0]
        }

        setFixedExpenses([...fixedExpenses, newExpense])
        setNewExpenseName('')
        setNewExpenseAmount('')
        setNewExpenseFrequency('monthly')
        setNewExpensePaymentDate('')
      }
    } catch (error) {
      console.error('Error adding fixed expense:', error)
    } finally {
      setSaving(false)
    }
  }

  const addExpense = async () => {
    if (!newExpenseDescription || !newExpenseAmountDaily || !newExpenseDate) return

    try {
      setSaving(true)
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: newExpenseDescription,
          amount: newExpenseAmountDaily,
          date: newExpenseDate
        })
      })

      if (response.ok) {
        const savedExpense = await response.json()
        const newExpense: Expense = {
          id: savedExpense.id.toString(),
          description: savedExpense.description,
          amount: savedExpense.amount,
          date: new Date(savedExpense.date).toISOString().split('T')[0]
        }

        setExpenses([...expenses, newExpense])
        setNewExpenseDescription('')
        setNewExpenseAmountDaily('')
        setNewExpenseDate('')
      }
    } catch (error) {
      console.error('Error adding expense:', error)
    } finally {
      setSaving(false)
    }
  }

  const removeExpense = async (id: string) => {
    try {
      setSaving(true)
      const response = await fetch(`/api/expenses?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setExpenses(expenses.filter(expense => expense.id !== id))
      }
    } catch (error) {
      console.error('Error removing expense:', error)
    } finally {
      setSaving(false)
    }
  }

  const removeFixedExpense = async (id: string) => {
    try {
      setSaving(true)
      const response = await fetch(`/api/fixed-expenses?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setFixedExpenses(fixedExpenses.filter(expense => expense.id !== id))
      }
    } catch (error) {
      console.error('Error removing fixed expense:', error)
    } finally {
      setSaving(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Carregando dados...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Controle Financeiro
          </h1>
          <p className="text-lg text-gray-300">
            Gerencie seu dinheiro e saiba quanto pode gastar por dia
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Dados Financeiros */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Dados Financeiros
              </CardTitle>
              <CardDescription>
                Informe seu dinheiro disponível e a próxima data de pagamento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="totalMoney">Dinheiro Total (R$)</Label>
                <Input
                  id="totalMoney"
                  type="number"
                  placeholder="0,00"
                  value={totalMoney}
                  onChange={(e) => setTotalMoney(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nextPayment">Próximo Pagamento</Label>
                <Input
                  id="nextPayment"
                  type="date"
                  value={nextPaymentDate}
                  onChange={(e) => setNextPaymentDate(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Gasto Diário */}
          <Card>
            <CardHeader>
              <CardTitle>Gasto Diário Disponível</CardTitle>
              <CardDescription>
                Baseado no seu dinheiro e gastos fixos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-400 mb-2">
                  {formatCurrency(dailySpending)}
                </div>
                <p className="text-sm text-muted-foreground">por dia</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gastos Fixos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusIcon className="h-5 w-5" />
              Gastos Fixos
            </CardTitle>
            <CardDescription>
              Adicione seus gastos fixos mensais, semanais ou diários
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Adicionar novo gasto */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-muted rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="expenseName">Nome</Label>
                <Input
                  id="expenseName"
                  placeholder="Ex: Aluguel"
                  value={newExpenseName}
                  onChange={(e) => setNewExpenseName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expenseAmount">Valor (R$)</Label>
                <Input
                  id="expenseAmount"
                  type="number"
                  placeholder="0,00"
                  value={newExpenseAmount}
                  onChange={(e) => setNewExpenseAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expenseFrequency">Frequência</Label>
                <select
                  id="expenseFrequency"
                  className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  value={newExpenseFrequency}
                  onChange={(e) => setNewExpenseFrequency(e.target.value as 'daily' | 'weekly' | 'monthly')}
                >
                  <option value="daily">Diário</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensal</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expensePaymentDate">Data de Pagamento</Label>
                <Input
                  id="expensePaymentDate"
                  type="date"
                  value={newExpensePaymentDate}
                  onChange={(e) => setNewExpensePaymentDate(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={addFixedExpense} className="w-full" disabled={saving}>
                  {saving ? 'Salvando...' : 'Adicionar'}
                </Button>
              </div>
            </div>

            {/* Lista de gastos fixos */}
            <div className="space-y-2">
              {fixedExpenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-3 bg-card border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{expense.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(expense.amount)} - {
                        expense.frequency === 'daily' ? 'Diário' :
                        expense.frequency === 'weekly' ? 'Semanal' : 'Mensal'
                      } - Vence em {new Date(expense.paymentDate).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeFixedExpense(expense.id)}
                    className="text-red-400 hover:text-red-300"
                    disabled={saving}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {fixedExpenses.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum gasto fixo adicionado ainda
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Despesas Diárias */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusIcon className="h-5 w-5" />
              Despesas Diárias
            </CardTitle>
            <CardDescription>
              Registre suas despesas do dia a dia para descontar do valor disponível
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Adicionar nova despesa */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="expenseDescription">Descrição</Label>
                <Input
                  id="expenseDescription"
                  placeholder="Ex: Almoço"
                  value={newExpenseDescription}
                  onChange={(e) => setNewExpenseDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expenseAmountDaily">Valor (R$)</Label>
                <Input
                  id="expenseAmountDaily"
                  type="number"
                  placeholder="0,00"
                  value={newExpenseAmountDaily}
                  onChange={(e) => setNewExpenseAmountDaily(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expenseDate">Data</Label>
                <Input
                  id="expenseDate"
                  type="date"
                  value={newExpenseDate}
                  onChange={(e) => setNewExpenseDate(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={addExpense} className="w-full" disabled={saving}>
                  {saving ? 'Salvando...' : 'Adicionar'}
                </Button>
              </div>
            </div>

            {/* Lista de despesas */}
            <div className="space-y-2">
              {expenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-3 bg-card border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{expense.description}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(expense.amount)} - {new Date(expense.date).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeExpense(expense.id)}
                    className="text-red-400 hover:text-red-300"
                    disabled={saving}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {expenses.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma despesa registrada ainda
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
