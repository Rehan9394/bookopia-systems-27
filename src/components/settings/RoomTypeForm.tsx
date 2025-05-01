import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useRoomType } from '@/hooks/useRoomTypes';
import { useNavigate } from 'react-router-dom';
import { Loader } from 'lucide-react';

interface RoomTypeFormProps {
  roomTypeId?: string;
}

const RoomTypeForm = ({ roomTypeId }: RoomTypeFormProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    data: existingRoomType, 
    isLoading, 
    saveRoomType, 
    error 
  } = useRoomType(roomTypeId);

  // Use react-hook-form with default values
  const { register, handleSubmit, reset, formState: { isDirty, isSubmitting } } = useForm({
    defaultValues: {
      name: '',
      description: '',
      capacity: 1,
      size: '',
      bed_type: '',
      amenities: '',
      rate: 0,
      active: true
    }
  });

  // When editing, populate form with existing data
  useEffect(() => {
    if (existingRoomType) {
      reset({
        name: existingRoomType.name || '',
        description: existingRoomType.description || '',
        capacity: existingRoomType.capacity || 1,
        size: existingRoomType.size || '',
        bed_type: existingRoomType.bed_type || '',
        amenities: existingRoomType.amenities || '',
        rate: existingRoomType.rate || 0,
        active: existingRoomType.active !== undefined ? existingRoomType.active : true
      });
    }
  }, [existingRoomType, reset]);

const onSubmit = async (data: any) => {
  try {
    // Ensure active is converted to a boolean
    const formattedData = {
      ...data,
      active: Boolean(data.active)
    };
    
    await saveRoomType(formattedData);
    
    toast({
      title: roomTypeId ? "Room Type Updated" : "Room Type Created",
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

  if (isLoading && roomTypeId) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && roomTypeId) {
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name">Room Type Name*</Label>
            <Input id="name" {...register('name')} required />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="capacity">Capacity*</Label>
            <Input 
              id="capacity" 
              type="number" 
              {...register('capacity', { valueAsNumber: true })} 
              required 
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" {...register('description')} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="size">Size (sq ft)</Label>
            <Input id="size" {...register('size')} />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="bed_type">Bed Type</Label>
            <Input id="bed_type" {...register('bed_type')} />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="rate">Rate*</Label>
            <Input 
              id="rate" 
              type="number" 
              {...register('rate', { valueAsNumber: true })} 
              required 
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="amenities">Amenities</Label>
          <Textarea id="amenities" {...register('amenities')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="active">Active</Label>
          <input 
            type="checkbox"
            id="active"
            {...register('active')}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
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
          disabled={isSubmitting || (!isDirty && roomTypeId)}
        >
          {isSubmitting ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : roomTypeId ? 'Update Room Type' : 'Create Room Type'}
        </Button>
      </div>
    </form>
  );
};

export default RoomTypeForm;
