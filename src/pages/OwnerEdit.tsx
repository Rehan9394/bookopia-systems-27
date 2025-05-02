import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useOwner, useUpdateOwner } from '@/hooks/useOwners';
import { useToast } from '@/components/ui/use-toast';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { OwnerRoomsList } from '@/components/owners/OwnerRoomsList';
import { Owner } from '@/services/supabase-types';

const ownerFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  phone: z.string().optional(),
  properties: z.coerce.number().min(0, { message: "Properties cannot be negative" }),
  revenue: z.coerce.number().min(0, { message: "Revenue cannot be negative" }),
  occupancy: z.coerce.number().min(0, { message: "Occupancy cannot be negative" }).max(100, { message: "Occupancy cannot exceed 100%" }),
  avatar: z.string().optional(),
  joinedDate: z.string().optional(),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  routingNumber: z.string().optional()
});

const OwnerEdit = () => {
  const { id } = useParams<{ id: string }>();
  const { data: owner, isLoading, error } = useOwner(id || '');
  const updateOwnerMutation = useUpdateOwner();
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm({
    resolver: zodResolver(ownerFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      properties: 0,
      revenue: 0,
      occupancy: 0,
      avatar: '',
      joinedDate: '',
      bankName: '',
      accountNumber: '',
      routingNumber: ''
    },
    mode: "onChange",
  });

  React.useEffect(() => {
    if (owner) {
      form.reset({
        name: owner.name,
        email: owner.email,
        phone: owner.phone || '',
        properties: owner.properties,
        revenue: owner.revenue,
        occupancy: owner.occupancy,
        avatar: owner.avatar || '',
        joinedDate: owner.joinedDate || '',
        bankName: owner.paymentDetails?.bank || '',
        accountNumber: owner.paymentDetails?.accountNumber || '',
        routingNumber: owner.paymentDetails?.routingNumber || ''
      });
    }
  }, [owner, form]);

  const onSubmit = async (values: z.infer<typeof ownerFormSchema>) => {
    if (!id) return;
    
    try {
      // Split the name into first and last name
      const nameParts = values.name.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
      
      const ownerData: Partial<Owner> = {
        first_name: firstName,
        last_name: lastName,
        email: values.email,
        phone: values.phone,
        // Format financial information according to the database structure
        financial_info: {
          bank_name: values.bankName,
          account_number: values.accountNumber,
          routing_number: values.routingNumber
        }
      };
      
      await updateOwnerMutation.mutateAsync({ 
        id, 
        data: ownerData 
      });
      
      toast({
        title: "Success",
        description: "Owner information has been updated successfully."
      });
      
      navigate(`/owners/${id}`);
    } catch (error) {
      console.error("Error updating owner:", error);
      // Error is handled by the mutation hook
    }
  };

  if (isLoading) {
    return (
      <div className="animate-fade-in">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" asChild>
            <Link to="/owners">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Owners
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Owner</h1>
            <p className="text-muted-foreground mt-1">Loading owner information...</p>
          </div>
        </div>

        <Card className="p-6">
          <div className="space-y-6">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
            <div className="flex justify-end gap-3">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (error || !owner) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <h2 className="text-2xl font-bold text-destructive">Error Loading Owner</h2>
        <p className="text-muted-foreground">
          {error instanceof Error ? error.message : "Owner information could not be loaded"}
        </p>
        <Button asChild>
          <Link to="/owners">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Owners List
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" asChild>
          <Link to="/owners">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Owners
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Owner</h1>
          <p className="text-muted-foreground mt-1">Modify owner information</p>
        </div>
      </div>

      <Card className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Enter email address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter phone number (optional)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="properties"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Properties</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="revenue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Revenue (YTD)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="occupancy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Average Occupancy (%)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" max="100" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="avatar"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Avatar URL</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter avatar URL (optional)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="joinedDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Joined Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="bankName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter bank name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="accountNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter account number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="routingNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Routing Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter routing number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" type="button" onClick={() => navigate(`/owners/${id}`)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateOwnerMutation.isPending}>
                {updateOwnerMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </Card>

      <OwnerRoomsList ownerId={id || ''} isEditing={true} />
    </div>
  );
};

export default OwnerEdit;
