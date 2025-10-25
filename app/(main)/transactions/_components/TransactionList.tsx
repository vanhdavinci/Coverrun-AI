'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../../services/supabaseClient'
import { toast } from 'sonner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select'
import { Input } from '../../../../components/ui/input'
import { Label } from '../../../../components/ui/label'
import { useDataRefresh } from '@/context/DataRefreshContext'

export default function TransactionList() {
  const [transactions, setTransactions] = useState([])
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [userId, setUserId] = useState(null)
  const [jarCategories, setJarCategories] = useState([])
  const [filter, setFilter] = useState({
    jar: 'all',
    type: 'all',
    search: ''
  })
  const { refreshTrigger } = useDataRefresh()

  useEffect(() => {
    fetchUserData()
  }, [])

  useEffect(() => {
    if (userId) {
      // Only show loading for the very first fetch
      const isFirstLoad = transactions.length === 0;
      fetchTransactions(isFirstLoad)
    }
  }, [filter, userId, refreshTrigger]) // Added refreshTrigger to dependencies

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: userData, error } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email)
        .single()

      if (error) throw error
      setUserId(userData.id)

      // Fetch jar categories
      const { data: jarData, error: jarError } = await supabase
        .from('jar_categories')
        .select('*')
        .order('name')

      if (jarError) throw jarError
      setJarCategories(jarData)
    } catch (error) {
      console.error('Error fetching user data:', error)
      toast.error('Failed to load user data')
    }
  }

  const fetchTransactions = async (showLoading = false) => {
    try {
      let query = supabase
        .from('transactions')
        .select(`
          *,
          jar_category: jar_categories (
            id,
            name,
            description
          )
        `)
        .eq('user_id', userId)
        .order('occurred_at', { ascending: false })

      // Apply filters
      if (filter.jar !== 'all') {
        query = query.eq('jar_category_id', filter.jar)
      }
      
      if (filter.type === 'expense') {
        query = query.lt('amount_cents', 0)
      } else if (filter.type === 'income') {
        query = query.gt('amount_cents', 0)
      }

      if (filter.search) {
        query = query.ilike('description', `%${filter.search}%`)
      }

      const { data, error } = await query
      if (error) throw error

      setTransactions(data)
    } catch (error) {
      console.error('Error fetching transactions:', error)
      toast.error('Failed to load transactions')
    } finally {
      if (showLoading) {
        setIsInitialLoading(false)
      }
    }
  }

  const formatAmount = (cents) => {
    const dong = Math.abs(cents);
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(dong)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (isInitialLoading) {
    return <div>Loading transactions...</div>
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>Filter by Jar</Label>
          <Select
            value={filter.jar}
            onValueChange={(value) => setFilter({ ...filter, jar: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Jars</SelectItem>
              {jarCategories.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Transaction Type</Label>
          <Select
            value={filter.type}
            onValueChange={(value) => setFilter({ ...filter, type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="expense">Expenses</SelectItem>
              <SelectItem value="income">Income</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Search</Label>
          <Input
            placeholder="Search by description..."
            value={filter.search}
            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
          />
        </div>
      </div>

      {/* Transactions List - Scrollable */}
      <div className="border rounded-lg bg-white">
        <div className="max-h-96 overflow-y-auto">
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No transactions found
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="font-medium text-gray-900">{transaction.description}</div>
                    <div className="text-sm text-gray-500">
                      {transaction.jar_category.name} • {formatDate(transaction.occurred_at)}
                    </div>
                  </div>
                  <div className={`font-semibold ${transaction.amount_cents < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatAmount(transaction.amount_cents)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 