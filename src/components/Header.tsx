'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { 
  Home, 
  DollarSign, 
  CreditCard, 
  Receipt, 
  User, 
  LogOut, 
  Menu,
  X
} from 'lucide-react'

interface HeaderProps {
  dailySpending?: number
}

export default function Header({ dailySpending = 0 }: HeaderProps) {
  const { user, signOut } = useAuth()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Dados Financeiros', href: '/financial-data', icon: DollarSign },
    { name: 'Gastos Fixos', href: '/fixed-expenses', icon: CreditCard },
    { name: 'Despesas', href: '/expenses', icon: Receipt },
  ]

  const handleSignOut = async () => {
    await signOut()
  }

  // Fechar menu mobile quando a rota mudar
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  return (
    <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/dashboard" className="text-xl font-bold text-white">
              Simple
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Right side - Daily Spending & User Menu */}
          <div className="flex items-center space-x-4">
            {/* Daily Spending Indicator */}
            <div className="hidden sm:flex items-center bg-gray-800 px-3 py-2 rounded-lg">
              <DollarSign className="h-4 w-4 text-green-400 mr-2" />
              <span className="text-sm text-gray-300">Disponível hoje:</span>
              <span className="text-sm font-semibold text-green-400 ml-1">
                R$ {dailySpending.toFixed(2)}
              </span>
            </div>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <User className="h-4 w-4 text-gray-300" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-gray-800 border-gray-700" align="end">
                <div className="px-2 py-1.5 text-sm text-gray-300">
                  {user?.email}
                </div>
                <DropdownMenuItem 
                  onClick={handleSignOut}
                  className="text-gray-300 hover:bg-gray-700 cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6 text-gray-300" />
              ) : (
                <Menu className="h-6 w-6 text-gray-300" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 border-t border-gray-800">
              {/* Daily Spending - Mobile */}
              <div className="flex items-center justify-center bg-gray-800 px-3 py-2 rounded-lg mb-3">
                <DollarSign className="h-4 w-4 text-green-400 mr-2" />
                <span className="text-sm text-gray-300">Disponível hoje:</span>
                <span className="text-sm font-semibold text-green-400 ml-1">
                  R$ {dailySpending.toFixed(2)}
                </span>
              </div>

              {/* Navigation Links */}
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}