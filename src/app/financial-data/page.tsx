'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Header from '@/components/Header'
import { CalendarIcon, DollarSign, Save, AlertCircle, Loader2 } from 'lucide-react'

interface FinancialData {
  totalMoney: number
  nextPaymentDate: string
}

export default function FinancialDataPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [totalMoney, setTotalMoney] = useState<string>('')
  const [nextPaymentDate, setNextPaymentDate] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    const loadFinancialData = async () => {
      if (!user) return

      try {
        setLoading(true)
        const response = await fetch('/api/financial-data')
        
        if (response.ok) {
          const data = await response.json()
          if (data.totalMoney !== null) {
            setTotalMoney(data.totalMoney.toString())
          }
          if (data.nextPaymentDate) {
            setNextPaymentDate(new Date(data.nextPaymentDate).toISOString().split('T')[0])
          }
        }
      } catch (error) {
        console.error('Error loading financial data:', error)
        setError('Erro ao carregar dados financeiros')
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      loadFinancialData()
    }
  }, [user])

  const saveFinancialData = async () => {
    if (!totalMoney || !nextPaymentDate) {
      setError('Por favor, preencha todos os campos')
      return
    }

    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const response = await fetch('/api/financial-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          totalMoney: parseFloat(totalMoney),
          nextPaymentDate: nextPaymentDate
        })
      })

      if (response.ok) {
        setSuccess('Dados financeiros salvos com sucesso!')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        throw new Error('Erro ao salvar dados')
      }
    } catch (error) {
      console.error('Error saving financial data:', error)
      setError('Erro ao salvar dados financeiros')
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveFinancialData();
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const calculateDaysUntilPayment = () => {
    if (!nextPaymentDate) return 0
    
    const paymentDate = new Date(nextPaymentDate)
    const today = new Date()
    const diffTime = paymentDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return Math.max(0, diffDays)
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Header dailySpending={0} />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="animate-spin h-12 w-12 text-blue-500 mx-auto mb-4" />
              <p className="text-gray-400">Carregando dados financeiros...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Header dailySpending={0} />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Dados Financeiros
            </h1>
            <p className="text-gray-400">
              Gerencie seu saldo atual e próxima data de pagamento
            </p>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-900/20 border border-green-500 rounded-lg p-4 flex items-center gap-2">
              <Save className="h-5 w-5 text-green-500" />
              <p className="text-green-400">{success}</p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  Informações Financeiras
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Informe seu saldo atual e próxima data de recebimento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <Label htmlFor="totalMoney" className="text-gray-300">
                      Saldo Total (R$)
                    </Label>
                    <Input
                      id="totalMoney"
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={totalMoney}
                      onChange={(e) => setTotalMoney(e.target.value)}
                      className="bg-gray-900 border-gray-600 text-white"
                    />
                  </div>
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="nextPayment" className="text-gray-300">
                      Próximo Pagamento
                    </Label>
                    <Input
                      id="nextPayment"
                      type="date"
                      value={nextPaymentDate}
                      onChange={(e) => setNextPaymentDate(e.target.value)}
                      className="bg-gray-900 border-gray-600 text-white"
                    />
                  </div>
                  <Button 
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 mt-6"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar Dados
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <CalendarIcon className="h-5 w-5 text-blue-500" />
                  Resumo Financeiro
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Visão geral dos seus dados financeiros
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg">
                    <span className="text-gray-300">Saldo Atual:</span>
                    <span className="text-green-400 font-semibold">
                      {totalMoney ? formatCurrency(parseFloat(totalMoney)) : 'R$ 0,00'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg">
                    <span className="text-gray-300">Próximo Pagamento:</span>
                    <span className="text-blue-400 font-semibold">
                      {nextPaymentDate ? 
                        new Date(nextPaymentDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 
                        'Não definido'
                      }
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg">
                    <span className="text-gray-300">Dias até pagamento:</span>
                    <span className="text-purple-400 font-semibold">
                      {calculateDaysUntilPayment()} dias
                    </span>
                  </div>
                </div>

                {totalMoney && nextPaymentDate && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-green-900/20 to-blue-900/20 rounded-lg border border-green-500/20">
                    <h3 className="text-white font-semibold mb-2">Gasto Diário Estimado</h3>
                    <p className="text-2xl font-bold text-green-400">
                      {formatCurrency(parseFloat(totalMoney) / Math.max(1, calculateDaysUntilPayment()))}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      *Baseado apenas no saldo atual, sem considerar gastos fixos
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <p className="text-gray-500 text-sm">
              Mantenha seus dados financeiros atualizados para um melhor controle de gastos
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}