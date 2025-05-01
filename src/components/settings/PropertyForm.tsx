
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useProperty } from '@/hooks/useProperties';
import { useNavigate } from 'react-router-dom';
import { Loader } from 'lucide-react';

interface PropertyFormProps {
  propertyId?: string;
}

const PropertyForm = ({ propertyId }: PropertyFormProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    data: existingProperty, 
    isLoading, 
    saveProperty, 
    error 
  } = useProperty(propertyId);

  // Use react-hook-form with default values
  const { register, handleSubmit, reset, formState: { isDirty, isSubmitting } } = useForm({
    defaultValues: {
      name: '',
      email: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      country: '',
      phone: '',
      timezone: 'UTC',
      description: '',
      active: true
    }
  });

  // When editing, populate form with existing data
  useEffect(() => {
    if (existingProperty) {
      reset({
        name: existingProperty.name || '',
        email: existingProperty.email || '',
        address: existingProperty.address || '',
        city: existingProperty.city || '',
        state: existingProperty.state || '',
        zip_code: existingProperty.zip_code || '',
        country: existingProperty.country || '',
        phone: existingProperty.phone || '',
        timezone: existingProperty.timezone || 'UTC',
        description: existingProperty.description || '',
        active: existingProperty.active !== undefined ? existingProperty.active : true
      });
    }
  }, [existingProperty, reset]);

  const onSubmit = async (data: any) => {
    try {
      await saveProperty({
        ...data,
        // Ensure required fields from schema are set
        name: data.name,
        address: data.address,
        city: data.city,
        state: data.state,
        zip_code: data.zip_code,
        country: data.country || 'Unknown',
        // Fix: Convert active to boolean explicitly
        active: data.active === true || data.active === 'true'
      });
      
      toast({
        title: propertyId ? "Property Updated" : "Property Created",
        description: "The property has been saved successfully.",
      });
      
      // Navigate back to properties list
      navigate('/settings');
    } catch (error) {
      console.error('Error saving property:', error);
      toast({
        title: "Error",
        description: "Failed to save property. Please check the form and try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading && propertyId) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && propertyId) {
    return (
      <div className="p-4 bg-red-50 text-red-800 rounded-md">
        <h3 className="font-bold">Error loading property</h3>
        <p>There was a problem loading the property details. Please try again later.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name">Property Name*</Label>
            <Input id="name" {...register('name')} required />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register('email')} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Address*</Label>
          <Textarea id="address" {...register('address')} required />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="city">City*</Label>
            <Input id="city" {...register('city')} required />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="state">State*</Label>
            <Input id="state" {...register('state')} required />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="zip_code">Zip Code*</Label>
            <Input id="zip_code" {...register('zip_code')} required />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="country">Country*</Label>
            <Input id="country" {...register('country')} required />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Input id="timezone" {...register('timezone')} defaultValue="UTC" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" {...register('phone')} />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register('description')} />
          </div>
        </div>
      </div>
      
      <div className="flex justify-end gap-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => navigate('/settings')}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting || (!isDirty && propertyId)}
        >
          {isSubmitting ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : propertyId ? 'Update Property' : 'Create Property'}
        </Button>
      </div>
    </form>
  );
};

export default PropertyForm;
