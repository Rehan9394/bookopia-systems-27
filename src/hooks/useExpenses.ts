import { useState, useEffect } from 'react';
import { useToast } from '../hooks/use-toast';
import { format, parseISO, subDays, startOfMonth, endOfMonth, startOfYear } from 'date-fns';
import { 
  fetchExpenses as fetchExpensesApi, 
  fetchExpenseById as fetchExpenseByIdApi,
  createExpense as createExpenseApi,
  updateExpense as updateExpenseApi,
  deleteExpense as deleteExpenseApi
} from '../services/api';
import { Expense } from '../services/supabase-types';

// Add filter parameters interface
interface ExpenseFilters {
  searchTerm?: string;
  category?: string;
  dateRange?: string;
  propertyId?: string;
}

export function useExpenses(filters?: ExpenseFilters) {
  const [data, setData] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Apply filters to expenses
  const applyFilters = (expenses: Expense[]) => {
    if (!filters) return expenses;
    
    let filteredExpenses = [...expenses];
    
    // Filter by search term
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filteredExpenses = filteredExpenses.filter(expense => 
        expense.description.toLowerCase().includes(term) ||
        expense.category.toLowerCase().includes(term) ||
        (expense.property && expense.property.toLowerCase().includes(term)) ||
        (expense.vendor && expense.vendor.toLowerCase().includes(term))
      );
    }
    
    // Filter by category
    if (filters.category) {
      filteredExpenses = filteredExpenses.filter(expense => 
        expense.category === filters.category
      );
    }
    
    // Filter by property
    if (filters.propertyId) {
      filteredExpenses = filteredExpenses.filter(expense => 
        expense.property_id === filters.propertyId
      );
    }
    
    // Filter by date range
    if (filters.dateRange) {
      const today = new Date();
      let startDate: Date | null = null;
      
      switch (filters.dateRange) {
        case 'last_7_days':
          startDate = subDays(today, 7);
          break;
        case 'last_30_days':
          startDate = subDays(today, 30);
          break;
        case 'this_month':
          startDate = startOfMonth(today);
          break;
        case 'last_month':
          const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1);
          startDate = startOfMonth(lastMonth);
          const endDate = endOfMonth(lastMonth);
          filteredExpenses = filteredExpenses.filter(expense => {
            const expenseDate = parseISO(expense.date);
            return expenseDate >= startDate! && expenseDate <= endDate;
          });
          return filteredExpenses;
        case 'this_year':
          startDate = startOfYear(today);
          break;
      }
      
      if (startDate) {
        filteredExpenses = filteredExpenses.filter(expense => {
          const expenseDate = parseISO(expense.date);
          return expenseDate >= startDate!;
        });
      }
    }
    
    return filteredExpenses;
  };

  const fetchExpenses = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch data from the API
      const expensesData = await fetchExpensesApi();
      
      // Apply filters to the fetched data
      const filteredExpenses = applyFilters(expensesData);
      setData(filteredExpenses);
    } catch (err) {
      console.error('Error fetching expenses:', err);
      setError('Failed to load expenses');
      toast({
        title: 'Error',
        description: 'Failed to load expenses',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addExpense = async (expense: Omit<Expense, 'id' | 'created_at' | 'created_by'>) => {
    try {
      // Create expense through the API
      const newExpense = await createExpenseApi(expense as Partial<Expense>);
      
      // Update local state with the new data (including the new expense)
      await fetchExpenses();
      
      toast({
        title: 'Success',
        description: 'Expense added successfully',
      });
      
      return newExpense;
    } catch (err) {
      console.error('Error adding expense:', err);
      toast({
        title: 'Error',
        description: 'Failed to add expense',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const updateExpense = async (id: string, expense: Partial<Expense>) => {
    try {
      // Update expense through the API
      await updateExpenseApi(id, expense);
      
      // Refresh the data after update
      await fetchExpenses();
      
      toast({
        title: 'Success',
        description: 'Expense updated successfully',
      });
    } catch (err) {
      console.error('Error updating expense:', err);
      toast({
        title: 'Error',
        description: 'Failed to update expense',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      // Delete expense through the API
      await deleteExpenseApi(id);
      
      // Refresh the data after deletion
      await fetchExpenses();
      
      toast({
        title: 'Success',
        description: 'Expense deleted successfully',
      });
    } catch (err) {
      console.error('Error deleting expense:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete expense',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const getExpenseById = async (id: string): Promise<Expense | null> => {
    try {
      // Fetch expense by ID through the API
      const expense = await fetchExpenseByIdApi(id);
      return expense;
    } catch (err) {
      console.error('Error fetching expense:', err);
      toast({
        title: 'Error',
        description: 'Failed to load expense details',
        variant: 'destructive',
      });
      return null;
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [filters?.searchTerm, filters?.category, filters?.dateRange, filters?.propertyId]);

  return {
    data,
    isLoading,
    error,
    fetchExpenses,
    addExpense,
    updateExpense,
    deleteExpense,
    getExpenseById,
  };
}

// Hook for single expense view
export function useExpense(id: string) {
  const [data, setData] = useState<Expense | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchExpense = async () => {
      if (!id) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch expense by ID through the API
        const expense = await fetchExpenseByIdApi(id);
        setData(expense);
      } catch (err) {
        console.error('Error fetching expense:', err);
        setError('Failed to load expense details');
        toast({
          title: 'Error',
          description: 'Failed to load expense details',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchExpense();
  }, [id]);

  const deleteExpense = async (expenseId: string) => {
    try {
      // Delete expense through the API
      await deleteExpenseApi(expenseId);
      
      return {
        success: true,
        message: 'Expense deleted successfully'
      };
    } catch (err) {
      console.error('Error deleting expense:', err);
      return {
        success: false,
        message: 'Failed to delete expense'
      };
    }
  };

  return { data, isLoading, error, deleteExpense };
}
