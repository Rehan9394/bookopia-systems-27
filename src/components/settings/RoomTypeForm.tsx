
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useRoomType } from '@/hooks/useRoomTypes';
import { useProperties } from '@/hooks/useProperties';
import { useNavigate } from 'react-router-dom';
import { Loader } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface RoomTypeFormProps {
  typeId?: string;
}

const RoomTypeForm = ({ typeId }: RoomTypeFormProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: existingRoomType, isLoading: isLoadingRoomType, saveRoomType, error } = useRoomType(typeId);
  const { data: properties, isLoading: isLoadingProperties } = useProperties();
  
  // Use react-hook-form with default values
  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isDirty, isSubmitting } } = useForm({
    defaultValues: {
      name: '',
      description: '',
      base_rate: 0,
      max_occupancy: 2,
      property_id: '',
      features: {},
      active: true
    }
  });

  const property_id = watch('property_id');

  // When editing, populate form with existing data
  useEffect(() => {
    if (existingRoomType) {
      reset({
        name: existingRoomType.name || '',
        description: existingRoomType.description || '',
        base_rate: existingRoomType.base_rate || 0,
        max_occupancy: existingRoomType.max_occupancy || 2,
        property_id: existingRoomType.property_id || '',
        features: existingRoomType.features || {},
        active: existingRoomType.active !== undefined ? existingRoomType.active : true
      });
    }
  }, [existingRoomType, reset]);

  const onSubmit = async (data: any) => {
    try {
      if (!data.property_id) {
        toast({
          title: "Validation Error",
          description: "Please select a property",
          variant: "destructive",
        });
        return;
      }

      await saveRoomType({
        ...data,
        // Format the base_rate as a number
        base_rate: parseFloat(data.base_rate),
        max_occupancy: parseInt(data.max_occupancy),
        features: data.features || {},
        // Fix: Convert active to boolean if it's a string
        active: data.active === 'true' || data.active === true ? true : false
      });
      
      toast({
        title: typeId ? "Room Type Updated" : "Room Type Created",
        description: "The room type has been saved successfully.",
      });
      
      // Navigate back to room types list
      navigate('/settings');
    } catch (error) {
      console.error('Error saving room type:', error);
      toast({
        title: "Error",
        description: "Failed to save room type. Please check the form and try again.",
        variant: "destructive",
      });
    }
  };

  const isLoading = isLoadingRoomType || isLoadingProperties;

  if (isLoading && typeId) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && typeId) {
    return (
      <div className="p-4 bg-red-50 text-red-800 rounded-md">
        <h3 className="font-bold">Error loading room type</h3>
        <p>There was a problem loading the room type details. Please try again later.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="property_id">Property*</Label>
          {isLoadingProperties ? (
            <div className="flex items-center gap-2">
              <Loader className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading properties...</span>
            </div>
          ) : (
            <Select
              value={property_id}
              onValueChange={(value) => setValue('property_id', value, { shouldDirty: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a property" />
              </SelectTrigger>
              <SelectContent>
                {properties && properties.length > 0 ? (
                  properties.map((property: any) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem disabled value="">
                    No properties available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          )}
          {!property_id && (
            <p className="text-xs text-red-500 mt-1">Please select a property</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name">Room Type Name*</Label>
            <Input 
              id="name" 
              {...register('name', { required: "Room type name is required" })} 
              required 
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name.message as string}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="base_rate">Base Rate (per night)*</Label>
            <Input 
              id="base_rate" 
              type="number" 
              step="0.01" 
              {...register('base_rate', { 
                required: "Base rate is required",
                min: { value: 0, message: "Base rate must be positive" } 
              })} 
              required 
            />
            {errors.base_rate && (
              <p className="text-xs text-red-500 mt-1">{errors.base_rate.message as string}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea 
            id="description" 
            {...register('description')} 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="max_occupancy">Maximum Occupancy*</Label>
            <Input 
              id="max_occupancy" 
              type="number" 
              min="1"
              {...register('max_occupancy', { 
                required: "Maximum occupancy is required",
                min: { value: 1, message: "Maximum occupancy must be at least 1" }
              })} 
              required 
            />
            {errors.max_occupancy && (
              <p className="text-xs text-red-500 mt-1">{errors.max_occupancy.message as string}</p>
            )}
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
          disabled={isSubmitting || (!isDirty && typeId)}
        >
          {isSubmitting ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : typeId ? 'Update Room Type' : 'Create Room Type'}
        </Button>
      </div>
    </form>
  );
};

export default RoomTypeForm;
