import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Loader } from 'lucide-react';
import { useExpense } from '@/hooks/useExpenses';
import { useProperties } from '@/hooks/useProperties';
import { useOwners } from '@/hooks/useOwners';
import { toast } from "sonner";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CalendarIcon } from 'lucide-react';
import { format, parse } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useRooms } from '@/hooks/useRooms';

const expenseFormSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  date: z.string().min(1, "Date is required"),
  category: z.string().min(1, "Category is required"),
  property_id: z.string().optional().nullable(),
  room_id: z.string().optional().nullable(),
  vendor: z.string().optional().nullable(),
  payment_method: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  owner_id: z.string().optional().nullable()
});

type FormValues = z.infer<typeof expenseFormSchema>;

const ExpenseEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: expense, isLoading: loadingExpense, error: expenseError, updateExpense } = useExpense(id || '');
  const { data: properties, isLoading: loadingProperties } = useProperties();
  const { data: owners, isLoading: loadingOwners } = useOwners();
  const { data: rooms, isLoading: loadingRooms } = useRooms();
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      description: '',
      amount: 0,
      date: format(new Date(), 'yyyy-MM-dd'),
      category: '',
      property_id: '',
      room_id: '',
      vendor: '',
      payment_method: '',
      notes: '',
      owner_id: ''
    }
  });
  
  // Filter rooms by selected property
  const filteredRooms = rooms?.filter(room => 
    selectedProperty ? room.property_id === selectedProperty : true
  );
  
  useEffect(() => {
    if (expense) {
      form.reset({
        description: expense.description || '',
        amount: parseFloat(expense.amount) || 0,
        date: expense.date || format(new Date(), 'yyyy-MM-dd'),
        category: expense.category || '',
        property_id: expense.property_id || '',
        room_id: expense.room_id || '',
        vendor: expense.vendor || '',
        payment_method: expense.payment_method || '',
        notes: expense.notes || '',
        owner_id: expense.owner_id || ''
      });
      
      if (expense.date) {
        try {
          const parsedDate = parse(expense.date, 'yyyy-MM-dd', new Date());
          setSelectedDate(parsedDate);
        } catch (error) {
          console.error('Error parsing date:', error);
        }
      }
      
      if (expense.property_id) {
        setSelectedProperty(expense.property_id);
      }
    }
  }, [expense, form]);
  
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    
    try {
      const result = await updateExpense({
        ...data,
        date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : data.date
      });
      
      if (result.success) {
        toast.success("Expense updated successfully");
        navigate('/expenses');
      } else {
        toast.error(result.message || "Failed to update expense");
      }
    } catch (error) {
      console.error("Error updating expense:", error);
      toast.error("An error occurred while updating the expense");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handlePropertyChange = (value: string) => {
    setSelectedProperty(value);
    form.setValue('property_id', value);
    // Reset room selection when property changes
    form.setValue('room_id', '');
  };
  
  const loading = loadingExpense || loadingProperties || loadingOwners || loadingRooms;
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-80">
        <Loader className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }
  
  if (expenseError || !expense) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load expense data. The expense may not exist or there was a problem retrieving it.
        </AlertDescription>
        <Button 
          className="mt-4"
          onClick={() => navigate('/expenses')}
        >
          Back to Expenses
        </Button>
      </Alert>
    );
  }
  
  return (
    <div className="animate-fade-in">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link to="/expenses" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-2">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Expenses
          </Link>
          <h1 className="text-3xl font-bold">Edit Expense</h1>
          <p className="text-muted-foreground mt-1">Update expense details</p>
        </div>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description*</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Brief description of the expense" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount*</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-3 text-muted-foreground">$</span>
                        <Input
                          {...field}
                          className="pl-7"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date*</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {selectedDate ? format(selectedDate, "PPP") : 
                             field.value ? field.value : <span>Pick a date</span>}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => {
                            setSelectedDate(date);
                            if (date) {
                              field.onChange(format(date, 'yyyy-MM-dd'));
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category*</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Maintenance">Maintenance</SelectItem>
                        <SelectItem value="Utilities">Utilities</SelectItem>
                        <SelectItem value="Personnel">Personnel</SelectItem>
                        <SelectItem value="Supplies">Supplies</SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="property_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property</FormLabel>
                    <Select
                      value={field.value || ''}
                      onValueChange={handlePropertyChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a property" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {properties && properties.map(property => (
                          <SelectItem key={property.id} value={property.id}>
                            {property.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="room_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room</FormLabel>
                    <Select
                      value={field.value || ''}
                      onValueChange={field.onChange}
                      disabled={!selectedProperty}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={selectedProperty ? "Select a room" : "Select a property first"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {filteredRooms && filteredRooms.map(room => (
                          <SelectItem key={room.id} value={room.id}>
                            Room {room.number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="vendor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendor/Supplier</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Name of vendor or supplier" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="payment_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <Select
                      value={field.value || ''}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        <SelectItem value="Credit Card">Credit Card</SelectItem>
                        <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Check">Check</SelectItem>
                        <SelectItem value="Auto-Payment">Auto-Payment</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="owner_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Owner</FormLabel>
                    <Select
                      value={field.value || ''}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an owner" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {owners && owners.map(owner => (
                          <SelectItem key={owner.id} value={owner.id}>
                            {owner.first_name} {owner.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="col-span-1 md:col-span-2">
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Additional notes about this expense"
                        className="min-h-[120px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="flex justify-end gap-4 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/expenses')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </Card>
        </form>
      </Form>
    </div>
  );
};

export default ExpenseEdit;
