import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { AlertCircle, ArrowLeft, Loader, Save, Trash } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRoom } from '@/hooks/useRooms';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { fetchProperties, fetchRoomTypes, createRoom, updateRoom } from '@/services/api';
import { useAuth } from '@/hooks/use-auth';
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

// Form schema
const roomFormSchema = z.object({
  number: z.string().min(1, "Room number is required"),
  property_id: z.string().min(1, "Property is required"),
  room_type_id: z.string().min(1, "Room type is required"),
  max_adults: z.coerce.number().min(1, "Maximum adults is required"),
  max_children: z.coerce.number().default(0),
  base_rate: z.coerce.number().min(1, "Base rate is required"),
  description: z.string().optional(),
  amenities: z.string().optional(),
  status: z.string().min(1, "Status is required"),
  floor: z.string().optional(),
  active: z.boolean().default(true),
});

type RoomFormValues = z.infer<typeof roomFormSchema>;

interface AddEditRoomFormProps {
  mode: 'add' | 'edit';
  roomId?: string;
}

export function AddEditRoomForm({ mode, roomId }: AddEditRoomFormProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [properties, setProperties] = useState<any[]>([]);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  
  // If editing, fetch the room data
  const { data: roomData, isLoading: roomLoading, error: roomError, deleteRoom } = useRoom(roomId || '');
  
  // Setup form with default values
  const form = useForm<RoomFormValues>({
    resolver: zodResolver(roomFormSchema),
    defaultValues: {
      number: '',
      property_id: '',
      room_type_id: '',
      max_adults: 2,
      max_children: 0,
      base_rate: 0,
      description: '',
      amenities: '',
      status: 'available',
      floor: '',
      active: true,
    },
  });

  // Fetch properties and room types on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [propertiesData, roomTypesData] = await Promise.all([
          fetchProperties(),
          fetchRoomTypes()
        ]);
        
        setProperties(propertiesData);
        setRoomTypes(roomTypesData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setApiError('Failed to load properties and room types.');
      }
    };
    
    fetchData();
  }, []);

  // Populate form with room data when editing
  useEffect(() => {
    if (mode === 'edit' && roomData && !roomLoading) {
      // Format amenities as a string if it's an object
      let amenitiesString = '';
      if (roomData.amenities) {
        if (typeof roomData.amenities === 'object') {
          amenitiesString = Object.keys(roomData.amenities)
            .filter(key => roomData.amenities[key])
            .join('\n');
        } else if (Array.isArray(roomData.amenities)) {
          amenitiesString = roomData.amenities.join('\n');
        }
      }
      
      form.reset({
        number: roomData.number || '',
        property_id: roomData.property_id || '',
        room_type_id: roomData.room_type_id || '',
        max_adults: roomData.max_adults || 2,
        max_children: roomData.max_children || 0,
        base_rate: roomData.base_rate || 0,
        description: roomData.description || '',
        amenities: amenitiesString,
        status: roomData.status || 'available',
        floor: roomData.floor || '',
        active: roomData.active !== false, // Default to true unless explicitly false
      });
    }
  }, [mode, roomData, roomLoading, form]);

  // Handle form submission
  async function onSubmit(data: RoomFormValues) {
    setIsLoading(true);
    setApiError(null);
    
    try {
      // Process amenities into an object format
      let amenitiesObj = {};
      if (data.amenities) {
        const amenitiesArray = data.amenities.split('\n').filter(Boolean);
        amenitiesObj = amenitiesArray.reduce((acc: any, amenity) => {
          acc[amenity.trim()] = true;
          return acc;
        }, {});
      }
      
      const roomPayload = {
        ...data,
        amenities: amenitiesObj
      };
      
      if (mode === 'add') {
        await createRoom(roomPayload);
        toast({
          title: 'Room created successfully',
          description: `Room ${data.number} has been added to the system.`,
        });
      } else if (mode === 'edit' && roomId) {
        await updateRoom(roomId, roomPayload);
        toast({
          title: 'Room updated successfully',
          description: `Room ${data.number} has been updated in the system.`,
        });
      }
      
      // Redirect to the rooms list page
      navigate('/rooms');
    } catch (error: any) {
      console.error('Error saving room:', error);
      setApiError(error.message || 'Failed to save room. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleCancel() {
    // If we have roomData, we go back to the room detail view, otherwise to the rooms list
    if (mode === 'edit' && roomId) {
      navigate(`/rooms/view/${roomId}`);
    } else {
      navigate('/rooms');
    }
  }

  // Handle delete confirmation
  function handleDeleteClick() {
    setShowDeleteDialog(true);
  }

  async function confirmDelete() {
    try {
      const result = await deleteRoom();
      if (result.success) {
        toast({
          title: 'Room deleted',
          description: result.message,
        });
        navigate('/rooms');
      } else {
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      console.error('Error deleting room:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete room. Please try again.',
        variant: 'destructive'
      });
    }
    setShowDeleteDialog(false);
  }

  // Show loading state if fetching room data or properties/room types
  if (mode === 'edit' && roomLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading room data...</span>
      </div>
    );
  }

  // Show error if room not found
  if (mode === 'edit' && roomError) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load room data. The room may have been deleted or you don't have permission to view it.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link to="/rooms">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{mode === 'add' ? 'Add New Room' : 'Edit Room'}</h1>
            <p className="text-muted-foreground mt-1">
              {mode === 'add' ? 'Create a new room in the system' : `Modifying room ${roomData?.number}`}
            </p>
          </div>
        </div>
        {mode === 'edit' && isAdmin && (
          <Button variant="destructive" className="flex items-center gap-2" onClick={handleDeleteClick}>
            <Trash className="h-4 w-4" />
            Delete Room
          </Button>
        )}
      </div>

      {apiError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{apiError}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Enter the essential details for this room</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Room Number</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 101" {...field} />
                      </FormControl>
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
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a property" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {properties.map(property => (
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
                  name="room_type_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Room Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a room type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {roomTypes.map(type => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="max_adults"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Adults</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g. 2" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="max_children"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Children</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g. 0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="base_rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base Rate (per night)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g. 150" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="floor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Floor</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Additional Details</CardTitle>
                <CardDescription>Add more information about the room</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter a description of the room"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amenities"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amenities</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="List amenities, one per line"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter amenities separated by line breaks (e.g., WiFi, TV, Mini-fridge)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="available">Available</SelectItem>
                          <SelectItem value="occupied">Occupied</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                          <SelectItem value="cleaning">Cleaning</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Active Status</FormLabel>
                        <FormDescription>
                          Make the room available for bookings
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex items-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? <Loader className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {mode === 'add' ? 'Create Room' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Form>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this room?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the room 
              and remove the data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
