'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CreditCard, Save, Trash2, Loader2, Calendar, ChevronDown } from 'lucide-react'

interface FixedExpense {
  id: string
  name: string
  amount: number
  frequency: 'daily' | 'weekly' | 'monthly'
  paymentDate: string
}

export default function FixedExpensesPage() {
  const { user, loading: authLoading } = useAuth()

  const [items, setItems] = useState<FixedExpense[]>([])
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | ''>('')
  const [paymentDate, setPaymentDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const load = async () => {
    if (!user) return
    try {
      setLoading(true)
      const res = await fetch('/api/fixed-expenses', {
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Falha ao carregar gastos fixos')
      const data = await res.json()
      setItems(data)
    } catch (err) {
      setError('Não foi possível carregar os gastos fixos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!name || !amount || !frequency || !paymentDate) {
      setError('Preencha todos os campos')
      return
    }

    try {
      setSubmitting(true)
      const res = await fetch('/api/fixed-expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, amount, frequency, paymentDate }),
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Falha ao salvar gasto fixo')
      const created = await res.json()
      setItems((prev) => [created, ...prev])
      setName('')
      setAmount('')
      setFrequency('')
      setPaymentDate('')
      setSuccess('Gasto fixo cadastrado com sucesso!')
    } catch (err) {
      setError('Não foi possível salvar o gasto fixo')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/fixed-expenses?id=${id}`, { method: 'DELETE', credentials: 'include' })
      if (!res.ok) throw new Error('Falha ao excluir gasto fixo')
      setItems((prev) => prev.filter((e) => e.id !== id))
    } catch (err) {
      setError('Não foi possível excluir o gasto fixo')
    }
  }

  const total = items.reduce((sum, e) => sum + e.amount, 0)

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
            <CreditCard className="h-7 w-7 text-orange-500" />
            Gastos Fixos
          </h1>
          <p className="text-gray-400 mt-2">Cadastre e acompanhe seus compromissos financeiros recorrentes</p>
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
              <CardTitle className="text-white">Novo Gasto Fixo</CardTitle>
              <CardDescription className="text-gray-400">
                Informe os detalhes do gasto fixo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-300">Nome</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Aluguel, Internet, Academia"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
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
                  <Label htmlFor="frequency" className="text-gray-300">Frequência</Label>
                  <div className="relative">
                    <select
                      id="frequency"
                      className="w-full appearance-none rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value as 'daily' | 'weekly' | 'monthly')}
                    >
                      <option value="" disabled>Selecione</option>
                      <option value="daily">Diário</option>
                      <option value="weekly">Semanal</option>
                      <option value="monthly">Mensal</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentDate" className="text-gray-300">Próxima Data</Label>
                  <Input
                    id="paymentDate"
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                  />
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
                      Cadastrar Gasto Fixo
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Próximos Compromissos</CardTitle>
              <CardDescription className="text-gray-400">
                Total por mês: <span className="text-white font-semibold">{formatCurrency(total)}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {items.length === 0 && (
                  <p className="text-gray-400">Nenhum gasto fixo cadastrado</p>
                )}
                {items
                  .sort((a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime())
                  .map((e) => (
                    <div key={e.id} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                      <div>
                        <p className="text-white font-medium">{e.name}</p>
                        <p className="text-sm text-gray-400 flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-orange-500" />
                          {new Date(e.paymentDate).toLocaleDateString('pt-BR')} • {e.frequency}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-orange-400 font-semibold">{formatCurrency(e.amount)}</span>
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