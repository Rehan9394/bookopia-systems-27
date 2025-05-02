import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from "sonner";
import { CalendarIcon, Loader } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useProperties } from '@/hooks/useProperties';
import { useOwners } from '@/hooks/useOwners';
import { useExpenses } from '@/hooks/useExpenses';
import { useAuth } from '@/hooks/use-auth';
import { useRooms } from '@/hooks/useRooms';

const ExpenseAdd = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: properties, isLoading: loadingProperties } = useProperties();
  const { data: owners, isLoading: loadingOwners } = useOwners();
  const { createExpense } = useExpenses();
  
  const [date, setDate] = useState<Date>(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const { data: rooms, isLoading: loadingRooms } = useRooms();
  
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: '',
    property_id: '',
    room_id: '',
    vendor: '',
    payment_method: '',
    notes: '',
    owner_id: '',
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string) => (value: string) => {
    if (name === 'property_id') {
      setSelectedProperty(value);
      // Reset room when property changes
      setFormData(prev => ({ ...prev, [name]: value, room_id: '' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  // Filter rooms by selected property
  const filteredRooms = rooms?.filter(room => 
    selectedProperty ? room.property_id === selectedProperty : true
  );
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.description || !formData.amount || !formData.category) {
      toast.error("Please fill in all required fields.");
      return;
    }
    
    // Validate amount is a positive number
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Amount must be a positive number");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare expense data for the API
      const expenseData = {
        description: formData.description,
        amount: amount,
        date: format(date, 'yyyy-MM-dd'),
        category: formData.category,
        property_id: formData.property_id || null,
        room_id: formData.room_id || null,
        vendor: formData.vendor || null,
        payment_method: formData.payment_method || null,
        notes: formData.notes || null,
        owner_id: formData.owner_id || null,
        created_by: user?.id
      };
      
      // Create the expense using the API
      const result = await createExpense(expenseData);
      
      if (result.success) {
        toast.success("Expense added successfully");
        // Navigate back to expenses list
        navigate('/expenses');
      } else {
        toast.error(result.message || "Failed to add expense");
      }
    } catch (error) {
      console.error("Error adding expense:", error);
      toast.error("An error occurred while adding the expense");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const loading = loadingProperties || loadingOwners || loadingRooms;
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-80">
        <Loader className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }
  
  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Add New Expense</h1>
        <p className="text-muted-foreground mt-1">Track a new expense for your property</p>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Expense Details</CardTitle>
              <CardDescription>Enter information about this expense</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description*</Label>
                <Input
                  id="description"
                  name="description"
                  placeholder="Brief description of the expense"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount*</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-muted-foreground">$</span>
                    <Input
                      id="amount"
                      name="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className="pl-7"
                      value={formData.amount}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date*</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(date) => date && setDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category*</Label>
                  <Select
                    value={formData.category}
                    onValueChange={handleSelectChange('category')}
                    required
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Maintenance">Maintenance</SelectItem>
                      <SelectItem value="Utilities">Utilities</SelectItem>
                      <SelectItem value="Personnel">Personnel</SelectItem>
                      <SelectItem value="Supplies">Supplies</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="property_id">Property</Label>
                  <Select
                    value={formData.property_id}
                    onValueChange={handleSelectChange('property_id')}
                  >
                    <SelectTrigger id="property_id">
                      <SelectValue placeholder="Select a property" />
                    </SelectTrigger>
                    <SelectContent>
                      {properties && properties.map(property => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="room_id">Room</Label>
                  <Select
                    value={formData.room_id}
                    onValueChange={handleSelectChange('room_id')}
                    disabled={!formData.property_id}
                  >
                    <SelectTrigger id="room_id">
                      <SelectValue placeholder={formData.property_id ? "Select a room" : "Select a property first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredRooms && filteredRooms.map(room => (
                        <SelectItem key={room.id} value={room.id}>
                          Room {room.number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="owner_id">Owner</Label>
                  <Select
                    value={formData.owner_id}
                    onValueChange={handleSelectChange('owner_id')}
                  >
                    <SelectTrigger id="owner_id">
                      <SelectValue placeholder="Select an owner" />
                    </SelectTrigger>
                    <SelectContent>
                      {owners && owners.map(owner => (
                        <SelectItem key={owner.id} value={owner.id}>
                          {owner.first_name} {owner.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vendor">Vendor/Supplier</Label>
                  <Input
                    id="vendor"
                    name="vendor"
                    placeholder="Name of vendor or supplier"
                    value={formData.vendor}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment_method">Payment Method</Label>
                  <Select
                    value={formData.payment_method}
                    onValueChange={handleSelectChange('payment_method')}
                  >
                    <SelectTrigger id="payment_method">
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Credit Card">Credit Card</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Check">Check</SelectItem>
                      <SelectItem value="Auto-Payment">Auto-Payment</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Additional notes about this expense"
                  className="min-h-[120px]"
                  value={formData.notes}
                  onChange={handleInputChange}
                />
              </div>
            </CardContent>
          </Card>
          
          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Receipt Upload</CardTitle>
                <CardDescription>Upload an image of your receipt</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <div className="mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-muted-foreground mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">Drag and drop your file here, or click to browse</p>
                  <p className="text-xs text-muted-foreground">Supports: JPG, PNG, PDF (max 10MB)</p>
                  <Button variant="outline" className="mt-4">Select File</Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Expense Tips</CardTitle>
                <CardDescription>Guidelines for expense tracking</CardDescription>
              </CardHeader>
              <CardContent className="text-sm space-y-3">
                <p>• Keep all original receipts for at least 7 years</p>
                <p>• Categorize expenses correctly for tax purposes</p>
                <p>• Include detailed descriptions for audit compliance</p>
                <p>• Submit expenses within 30 days of purchase</p>
              </CardContent>
            </Card>
          </div>
          
          {/* Form Actions */}
          <div className="lg:col-span-3 flex justify-end gap-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/expenses')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Add Expense'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ExpenseAdd;
