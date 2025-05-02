import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  CalendarClock, 
  Edit, 
  Home, 
  Loader, 
  Settings, 
  UserCheck,
  Trash2 
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useRoom } from '@/hooks/useRooms';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function formatDate(dateString: string | null | undefined) {
  if (!dateString) return '';
  try {
    return format(new Date(dateString), 'MMM d, yyyy');
  } catch (e) {
    return dateString;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'available':
      return <Badge className="bg-green-100 text-green-800">Available</Badge>;
    case 'occupied':
      return <Badge className="bg-blue-100 text-blue-800">Occupied</Badge>;
    case 'maintenance':
      return <Badge className="bg-red-100 text-red-800">Maintenance</Badge>;
    case 'cleaning':
      return <Badge className="bg-yellow-100 text-yellow-800">Cleaning</Badge>;
    default:
      return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
  }
}

interface RoomDetailsProps {
  roomId: string;
}

export function RoomDetails({ roomId }: RoomDetailsProps) {
  const navigate = useNavigate();
  const { data: room, isLoading, error, deleteRoom, updateRoomStatus } = useRoom(roomId);
  const { user } = useAuth();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  // Handle delete room
  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    const result = await deleteRoom();
    if (result.success) {
      toast({
        title: "Room deleted",
        description: result.message,
      });
      // Navigate back to rooms list
      navigate('/rooms');
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive"
      });
    }
    setShowDeleteDialog(false);
  };

  // Handle status change
  const handleStatusChange = async (newStatus: string) => {
    const result = await updateRoomStatus(newStatus);
    if (result.success) {
      toast({
        title: "Status updated",
        description: result.message,
      });
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading room details...</span>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-red-500">Failed to load room details</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => navigate('/rooms')}
        >
          Back to Rooms
        </Button>
      </div>
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
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">Room {room.number}</h1>
              {getStatusBadge(room.status)}
            </div>
            <p className="text-muted-foreground mt-1">{room.property} • Floor {room.floor}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to={`/rooms/edit/${room.id}`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Room
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleStatusChange('available')}
                disabled={room.status === 'available'}
              >
                Mark as Available
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleStatusChange('cleaning')}
                disabled={room.status === 'cleaning'}
              >
                Mark as Cleaning
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleStatusChange('maintenance')}
                disabled={room.status === 'maintenance'}
              >
                Mark as Maintenance
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem 
                  className="text-red-600"
                  onClick={handleDeleteClick}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Room
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button asChild>
            <Link to={`/bookings/new?roomId=${room.id}`}>Create Booking</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Room Details</CardTitle>
              <CardDescription>
                Information about Room {room.number}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground">{room.description || 'No description available'}</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {room.amenities && room.amenities.length > 0 ? 
                      room.amenities.map((amenity, index) => (
                        <Badge key={index} variant="outline" className="bg-primary/5">
                          {amenity}
                        </Badge>
                      )) : (
                        <p className="text-muted-foreground">No amenities listed</p>
                      )
                    }
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Base Price</p>
                    <p className="font-medium">${room.base_rate} / night</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Max Occupancy</p>
                    <p className="font-medium">{room.max_adults + (room.max_children || 0)} Guests</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Floor</p>
                    <p className="font-medium">{room.floor}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Last Updated</p>
                    <p className="font-medium">{formatDate(room.updated_at)}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-semibold mb-3">Current Status</h3>
                  {room.status === 'occupied' ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                      <div className="flex items-start gap-3">
                        <UserCheck className="h-5 w-5 text-blue-500 mt-0.5" />
                        <div>
                          <p className="font-medium">Currently Occupied</p>
                          <p className="text-sm text-muted-foreground">
                            This room is currently booked and occupied.
                          </p>
                          <Button size="sm" variant="outline" className="mt-2" asChild>
                            <Link to={`/bookings`}>
                              View Bookings
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : room.status === 'maintenance' ? (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4">
                      <div className="flex items-start gap-3">
                        <Settings className="h-5 w-5 text-red-500 mt-0.5" />
                        <div>
                          <p className="font-medium">Under Maintenance</p>
                          <p className="text-sm text-muted-foreground">
                            This room is currently unavailable due to maintenance work.
                          </p>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="mt-2"
                            onClick={() => handleStatusChange('available')}
                          >
                            Mark as Available
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : room.status === 'cleaning' ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                      <div className="flex items-start gap-3">
                        <Settings className="h-5 w-5 text-yellow-500 mt-0.5" />
                        <div>
                          <p className="font-medium">Being Cleaned</p>
                          <p className="text-sm text-muted-foreground">
                            This room is currently being cleaned and prepared.
                          </p>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="mt-2"
                            onClick={() => handleStatusChange('available')}
                          >
                            Mark as Available
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-green-50 border border-green-200 rounded-md p-4">
                      <div className="flex items-start gap-3">
                        <Home className="h-5 w-5 text-green-500 mt-0.5" />
                        <div>
                          <p className="font-medium">Available for Booking</p>
                          <p className="text-sm text-muted-foreground">
                            This room is currently available and can be booked.
                          </p>
                          <Button size="sm" className="mt-2" asChild>
                            <Link to={`/bookings/new?roomId=${room.id}`}>
                              Create Booking
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks for this room</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                className="w-full justify-start" 
                size="lg"
                onClick={() => handleStatusChange('cleaning')}
                disabled={room.status === 'cleaning'}
              >
                <Loader className="h-4 w-4 mr-2" />
                Mark as Cleaning
              </Button>
              <Button className="w-full justify-start" size="lg" asChild>
                <Link to="/availability">
                  <CalendarClock className="h-4 w-4 mr-2" />
                  Check Availability
                </Link>
              </Button>
              <Button className="w-full justify-start" variant="outline" size="lg" asChild>
                <Link to={`/rooms/edit/${room.id}`}>
                  <Settings className="h-4 w-4 mr-2" />
                  Update Room Details
                </Link>
              </Button>
              {isAdmin && (
                <Button 
                  className="w-full justify-start text-red-600 hover:text-red-700" 
                  variant="outline" 
                  size="lg"
                  onClick={handleDeleteClick}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Room
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Booking History & Analytics</CardTitle>
        </CardHeader>
        <Tabs defaultValue="history">
          <div className="px-6">
            <TabsList className="mb-4">
              <TabsTrigger value="history">Booking History</TabsTrigger>
              <TabsTrigger value="occupancy">Occupancy Rate</TabsTrigger>
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
            </TabsList>
          </div>
          <CardContent>
            <TabsContent value="history" className="mt-0">
              <div className="rounded-lg overflow-hidden border border-border">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left font-medium px-6 py-3">Guest</th>
                      <th className="text-left font-medium px-6 py-3">Check In</th>
                      <th className="text-left font-medium px-6 py-3">Check Out</th>
                      <th className="text-left font-medium px-6 py-3">Status</th>
                      <th className="text-left font-medium px-6 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                        Booking history data is loading or not available
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </TabsContent>
            <TabsContent value="occupancy" className="mt-0">
              <div className="h-80 flex items-center justify-center border rounded-md bg-muted/20">
                <p className="text-muted-foreground">Occupancy rate chart will be displayed here</p>
              </div>
            </TabsContent>
            <TabsContent value="revenue" className="mt-0">
              <div className="h-80 flex items-center justify-center border rounded-md bg-muted/20">
                <p className="text-muted-foreground">Revenue analytics will be displayed here</p>
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

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
