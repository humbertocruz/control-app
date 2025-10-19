'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Receipt, Save, Trash2, Loader2 } from 'lucide-react'

interface Expense {
  id: string
  description: string
  amount: number
  date: string
  paymentMethod?: 'cash' | 'pix' | 'credit'
}

export default function ExpensesPage() {
  const { user, loading: authLoading } = useAuth()

  const [expenses, setExpenses] = useState<Expense[]>([])
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'pix' | 'credit'>('cash')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const loadExpenses = async () => {
    if (!user) return
    try {
      setLoading(true)
      const res = await fetch('/api/expenses', {
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Falha ao carregar despesas')
      const data = await res.json()
      setExpenses(data)
    } catch (err) {
      setError('Não foi possível carregar as despesas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadExpenses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!description || !amount || !date) {
      setError('Preencha todos os campos')
      return
    }

    try {
      setSubmitting(true)
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, amount, date, paymentMethod }),
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Falha ao salvar despesa')
      const created = await res.json()
      setExpenses((prev) => [created, ...prev])
      setDescription('')
      setAmount('')
      setDate('')
      setSuccess('Despesa registrada com sucesso!')
    } catch (err) {
      setError('Não foi possível salvar a despesa')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/expenses?id=${id}`, { method: 'DELETE', credentials: 'include' })
      if (!res.ok) throw new Error('Falha ao excluir despesa')
      setExpenses((prev) => prev.filter((e) => e.id !== id))
    } catch (err) {
      setError('Não foi possível excluir a despesa')
    }
  }

  const total = expenses.reduce((sum, e) => sum + e.amount, 0)

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Header dailySpending={0} />
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Header dailySpending={0} />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Receipt className="h-7 w-7 text-red-500" />
            Despesas
          </h1>
          <p className="text-gray-400 mt-2">Registre e acompanhe suas despesas diárias</p>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 text-red-300 mb-6">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-900/20 border border-green-500 rounded-lg p-4 text-green-300 mb-6">
            {success}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Nova Despesa</CardTitle>
              <CardDescription className="text-gray-400">
                Informe os detalhes da sua despesa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-gray-300">Descrição</Label>
                  <Input
                    id="description"
                    placeholder="Ex: Almoço, Transporte"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-gray-300">Valor (R$)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-gray-300">Data</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod" className="text-gray-300">Forma de Pagamento</Label>
                  <select
                    id="paymentMethod"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'pix' | 'credit')}
                    className="w-full bg-gray-900 border border-gray-600 text-white rounded-md p-2"
                  >
                    <option value="cash">Dinheiro</option>
                    <option value="pix">Pix (debita do saldo)</option>
                    <option value="credit">Crédito (debita do cartão)</option>
                  </select>
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Registrar Despesa
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Despesas Recentes</CardTitle>
              <CardDescription className="text-gray-400">
                Total registrado: <span className="text-white font-semibold">{formatCurrency(total)}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {expenses.length === 0 && (
                  <p className="text-gray-400">Nenhuma despesa registrada</p>
                )}
                {expenses.map((e) => (
                  <div key={e.id} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                    <div>
                      <p className="text-white font-medium">{e.description}</p>
                      <p className="text-sm text-gray-400">
                        {new Date(e.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-red-400 font-semibold">{formatCurrency(e.amount)}</span>
                      {e.paymentMethod && (
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-800 border border-gray-700 text-gray-300">
                          {e.paymentMethod === 'cash' ? 'Dinheiro' : e.paymentMethod === 'pix' ? 'Pix' : 'Crédito'}
                        </span>
                      )}
                      <Button variant="outline" className="border-gray-700" onClick={() => handleDelete(e.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}