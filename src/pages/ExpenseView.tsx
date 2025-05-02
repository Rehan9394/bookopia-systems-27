import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, FileEdit, Loader, AlertCircle, Trash2 } from 'lucide-react';
import { useExpense } from '@/hooks/useExpenses';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from 'react';
import { toast } from "sonner";
import { useAuth } from '@/hooks/use-auth';

const ExpenseView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { data: expense, isLoading, error, deleteExpense } = useExpense(id || '');
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);

  const handleDelete = async () => {
    if (!id) return;
    
    if (!isAdmin) {
      toast.error("Only administrators can delete expenses");
      return;
    }
    
    try {
      const result = await deleteExpense(id);
      if (result.success) {
        toast.success(result.message);
        navigate('/expenses');
      } else {
        toast.error(result.message || "Failed to delete expense");
      }
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast.error("An error occurred while deleting the expense");
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMMM d, yyyy');
    } catch (e) {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading expense details...</span>
      </div>
    );
  }

  if (error || !expense) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load expense details. The expense may have been deleted or you might not have permission to access it.
        </AlertDescription>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => navigate('/expenses')}
        >
          Return to Expenses
        </Button>
      </Alert>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild className="mr-4">
            <Link to="/expenses">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Expenses
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Expense Details</h1>
            <p className="text-muted-foreground mt-1">View expense information</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to={`/expenses/edit/${expense.id}`}>
              <FileEdit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
          {isAdmin && (
            <Button 
              variant="destructive" 
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="font-medium">{expense.description}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="font-medium text-lg">${parseFloat(expense.amount).toFixed(2)}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">{formatDate(expense.date)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Category</p>
                <Badge className="mt-1">{expense.category}</Badge>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Property</p>
                <p className="font-medium">{expense.properties ? expense.properties.name : 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Owner</p>
                <p className="font-medium">
                  {expense.owners 
                    ? `${expense.owners.first_name} ${expense.owners.last_name}` 
                    : 'N/A'}
                </p>
              </div>
            </div>
            {expense.vendor && (
              <div>
                <p className="text-sm text-muted-foreground">Vendor/Supplier</p>
                <p className="font-medium">{expense.vendor}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Payment Method</p>
              <p className="font-medium">{expense.payment_method || 'Not specified'}</p>
            </div>
            
            {expense.created_at && (
              <div>
                <p className="text-sm text-muted-foreground">Created On</p>
                <p className="font-medium">{formatDate(expense.created_at)}</p>
              </div>
            )}
            
            {expense.updated_at && expense.updated_at !== expense.created_at && (
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="font-medium">{formatDate(expense.updated_at)}</p>
              </div>
            )}
            
            {expense.notes && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-1">Notes</p>
                <div className="p-3 bg-muted rounded-md">
                  <p>{expense.notes}</p>
                </div>
              </div>
            )}

            {expense.receipt_url && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-1">Receipt</p>
                <Button variant="outline" size="sm" asChild>
                  <a href={expense.receipt_url} target="_blank" rel="noopener noreferrer">
                    View Receipt
                  </a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this expense?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the expense
              and remove the data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ExpenseView;
