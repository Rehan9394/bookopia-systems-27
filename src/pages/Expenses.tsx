import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, Plus, Filter, Search, Loader } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from '@/lib/utils';
import { useExpenses } from '@/hooks/useExpenses';
import { useProperties } from '@/hooks/useProperties';

const Expenses = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [dateRange, setDateRange] = useState('');
  const [selectedProperty, setSelectedProperty] = useState('');
  const [showPaid, setShowPaid] = useState(true);
  const [showUnpaid, setShowUnpaid] = useState(true);
  
  const { data: expenses, isLoading, error } = useExpenses({
    searchTerm,
    category: selectedCategory,
    dateRange,
    propertyId: selectedProperty,
    showPaid,
    showUnpaid
  });
  
  const { data: properties } = useProperties();
  
  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(numAmount);
  };
  
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM d, yyyy');
    } catch (error) {
      return dateString;
    }
  };
  
  const getCategoryColor = (category: string) => {
    const categoryColors: Record<string, string> = {
      'Maintenance': 'bg-blue-100 text-blue-800',
      'Utilities': 'bg-green-100 text-green-800',
      'Personnel': 'bg-purple-100 text-purple-800',
      'Supplies': 'bg-amber-100 text-amber-800',
      'Marketing': 'bg-pink-100 text-pink-800',
      'Other': 'bg-gray-100 text-gray-800'
    };
    
    return categoryColors[category] || 'bg-gray-100 text-gray-800';
  };
  
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setDateRange('');
    setSelectedProperty('');
    setShowPaid(true);
    setShowUnpaid(true);
  };
  
  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Expenses</h1>
          <p className="text-muted-foreground mt-1">Manage property and operational expenses</p>
        </div>
        
        <Button asChild>
          <Link to="/expenses/add">
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Link>
        </Button>
      </div>
      
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search expenses..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </SheetTrigger>
                <SheetContent side="right">
                  <SheetHeader className="mb-4">
                    <SheetTitle>Filter Expenses</SheetTitle>
                    <SheetDescription>
                      Filter expenses by various criteria
                    </SheetDescription>
                  </SheetHeader>
                  
                  <div className="space-y-6">
                    <div>
                      <Label className="mb-2 block">Category</Label>
                      <Select
                        value={selectedCategory}
                        onValueChange={setSelectedCategory}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All Categories</SelectItem>
                          <SelectItem value="Maintenance">Maintenance</SelectItem>
                          <SelectItem value="Utilities">Utilities</SelectItem>
                          <SelectItem value="Personnel">Personnel</SelectItem>
                          <SelectItem value="Supplies">Supplies</SelectItem>
                          <SelectItem value="Marketing">Marketing</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="mb-2 block">Property</Label>
                      <Select
                        value={selectedProperty}
                        onValueChange={setSelectedProperty}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All Properties" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All Properties</SelectItem>
                          {properties?.map(property => (
                            <SelectItem key={property.id} value={property.id}>
                              {property.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="mb-2 block">Date Range</Label>
                      <Select
                        value={dateRange}
                        onValueChange={setDateRange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All Time" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All Time</SelectItem>
                          <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                          <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                          <SelectItem value="this_month">This Month</SelectItem>
                          <SelectItem value="last_month">Last Month</SelectItem>
                          <SelectItem value="this_year">This Year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="mb-2 block">Payment Status</Label>
                      <div className="flex space-x-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="paid" 
                            checked={showPaid} 
                            onCheckedChange={(checked) => setShowPaid(checked as boolean)}
                          />
                          <Label htmlFor="paid">Paid</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="unpaid" 
                            checked={showUnpaid} 
                            onCheckedChange={(checked) => setShowUnpaid(checked as boolean)}
                          />
                          <Label htmlFor="unpaid">Unpaid</Label>
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      className="w-full mt-4"
                      onClick={resetFilters}
                    >
                      Reset Filters
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>All Expenses</CardTitle>
          <CardDescription>
            Showing {expenses?.length || 0} expenses
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading expenses...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              <p>Error loading expenses. Please try again later.</p>
            </div>
          ) : !expenses || expenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No expenses found. Add an expense to get started.</p>
              <Button asChild className="mt-4">
                <Link to="/expenses/add">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Expense
                </Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">{expense.description}</TableCell>
                      <TableCell>
                        <Badge className={cn('font-normal', getCategoryColor(expense.category))}>
                          {expense.category}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(expense.date)}</TableCell>
                      <TableCell>
                        {expense.properties?.name || 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(expense.amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={`/expenses/view/${expense.id}`}>
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View</span>
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Expenses;
