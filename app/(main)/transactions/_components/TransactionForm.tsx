'use client'

import { useState, useEffect } from 'react'
import { Input } from '../../../../components/ui/input'
import { Button } from '../../../../components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select'
import { Label } from '../../../../components/ui/label'
import { supabase } from '../../../../services/supabaseClient'
import { toast } from 'sonner'
import { updateJarBalanceAfterTransaction } from '@/services/financialService'
import { useDataRefresh } from '@/context/DataRefreshContext'

export default function TransactionForm({ onTransactionSuccess }) {
  const [loading, setLoading] = useState(false)
  const [jars, setJars] = useState([])
  const [userId, setUserId] = useState(null)
  const { triggerRefresh } = useDataRefresh()
  const [formData, setFormData] = useState({
    jarCategoryId: '',
    amount: '',
    description: '',
    type: 'expense' // or 'income'
  })

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get user ID from the users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email)
        .single()

      if (userError) throw userError
      setUserId(userData.id)

      // Fetch user's jars
      const { data: userJars, error: jarsError } = await supabase
        .from('user_jars_with_balance')
        .select('*')
        .eq('user_id', userData.id)
      
      if (jarsError) throw jarsError
      setJars(userJars)
    } catch (error) {
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!userId) {
        throw new Error('User not found')
      }

      const amount = Math.round(parseFloat(formData.amount));
      const finalAmount = formData.type === 'expense' ? -amount : amount

      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          jar_category_id: formData.jarCategoryId,
          amount_cents: finalAmount,
          description: formData.description,
          source: 'manual'
        })

      if (error) throw error

      // Update jar balance after transaction
      await updateJarBalanceAfterTransaction(userId, formData.jarCategoryId)

      // Trigger refresh across the app
      triggerRefresh()

      toast.success('Transaction added successfully')
      
      if (onTransactionSuccess) {
        onTransactionSuccess();
      }

      setFormData({
        jarCategoryId: '',
        amount: '',
        description: '',
        type: 'expense'
      })
    } catch (error) {
      console.error('Error adding transaction:', error)
      toast.error('Failed to add transaction')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="jar">Select Jar</Label>
        <Select
          value={formData.jarCategoryId}
          onValueChange={(value) => setFormData({ ...formData, jarCategoryId: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a jar" />
          </SelectTrigger>
          <SelectContent>
            {jars.map((jar) => (
              <SelectItem key={jar.category_id} value={jar.category_id.toString()}>
                {jar.category_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Transaction Type</Label>
        <Select
          value={formData.type}
          onValueChange={(value) => setFormData({ ...formData, type: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="expense">Expense</SelectItem>
            <SelectItem value="income">Income</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Amount</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          placeholder="0.00"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          placeholder="Enter transaction description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Adding...' : 'Add Transaction'}
      </Button>
    </form>
  )
} 