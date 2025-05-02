import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ArrowRight, 
  BedDouble, 
  Building, 
  Edit, 
  MoreHorizontal, 
  Loader, 
  Trash2 
} from 'lucide-react';
import { ViewToggle } from '@/components/ui/ViewToggle';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link, useNavigate } from 'react-router-dom';
import { useRooms } from '@/hooks/useRooms';
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

interface RoomListProps {
  view: 'grid' | 'list';
  onViewChange: (view: 'grid' | 'list') => void;
  searchQuery?: string;
  filterValue?: string;
}

export function RoomList({ 
  view, 
  onViewChange,
  searchQuery = '',
  filterValue = 'all'
}: RoomListProps) {
  const { data: rooms, isLoading, error, deleteRoom, updateRoomStatus, refetch } = useRooms();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [roomToDelete, setRoomToDelete] = React.useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  // Apply filters to rooms
  const filteredRooms = useMemo(() => {
    if (!rooms) return [];
    
    return rooms.filter(room => {
      // Apply search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        !searchQuery || 
        (room.number && room.number.toLowerCase().includes(searchLower)) ||
        (room.name && room.name.toLowerCase().includes(searchLower)) ||
        (room.property && room.property.toLowerCase().includes(searchLower)) ||
        (room.type && room.type.toLowerCase().includes(searchLower));
      
      // Apply status filter
      const matchesStatus = filterValue === 'all' || room.status === filterValue;
      
      return matchesSearch && matchesStatus;
    });
  }, [rooms, searchQuery, filterValue]);

  // Handle delete room
  const handleDeleteClick = (roomId: string) => {
    setRoomToDelete(roomId);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (roomToDelete) {
      const result = await deleteRoom(roomToDelete);
      if (result.success) {
        toast({
          title: "Room deleted",
          description: result.message,
        });
        // Refresh the data
        refetch();
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive"
        });
      }
      setShowDeleteDialog(false);
      setRoomToDelete(null);
    }
  };

  // Handle status change
  const handleStatusChange = async (roomId: string, newStatus: string) => {
    const result = await updateRoomStatus(roomId, newStatus);
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
      <div className="flex items-center justify-center h-64">
        <Loader className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading rooms...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-red-500">Failed to load rooms data</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => refetch()}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">All Rooms</h2>
        <div className="flex gap-4">
          <ViewToggle view={view} setView={onViewChange} />
        </div>
      </div>
      
      {view === 'list' ? (
        <div className="rounded-lg overflow-hidden border border-border">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left font-medium px-6 py-3">Room</th>
                <th className="text-left font-medium px-6 py-3">Property</th>
                <th className="text-left font-medium px-6 py-3">Type</th>
                <th className="text-left font-medium px-6 py-3">Capacity</th>
                <th className="text-left font-medium px-6 py-3">Status</th>
                <th className="text-left font-medium px-6 py-3">Rate</th>
                <th className="text-left font-medium px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRooms.map((room) => (
                <tr key={room.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium">{room.number}</div>
                    <div className="text-sm text-muted-foreground">{room.name}</div>
                  </td>
                  <td className="px-6 py-4">{room.property}</td>
                  <td className="px-6 py-4">{room.type}</td>
                  <td className="px-6 py-4">{room.capacity}</td>
                  <td className="px-6 py-4">{getStatusBadge(room.status)}</td>
                  <td className="px-6 py-4">${room.rate}/night</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="ghost" asChild>
                        <Link to={`/rooms/view/${room.id}`}>
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/rooms/view/${room.id}`}>View Details</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={`/rooms/edit/${room.id}`}>Edit Room</Link>
                          </DropdownMenuItem>
                          {/* Status change options */}
                          <DropdownMenuItem 
                            onClick={() => handleStatusChange(room.id, 'available')}
                            disabled={room.status === 'available'}
                          >
                            Mark as Available
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleStatusChange(room.id, 'cleaning')}
                            disabled={room.status === 'cleaning'}
                          >
                            Mark as Cleaning
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleStatusChange(room.id, 'maintenance')}
                            disabled={room.status === 'maintenance'}
                          >
                            Mark as Maintenance
                          </DropdownMenuItem>
                          {/* Delete option - only for admins */}
                          {isAdmin && (
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleDeleteClick(room.id)}
                            >
                              Delete Room
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
              {(!filteredRooms || filteredRooms.length === 0) && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                    No rooms found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room) => (
            <Card key={room.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="h-48 bg-muted flex items-center justify-center">
                  <BedDouble className="h-12 w-12 text-muted-foreground" />
                </div>
                <div className="p-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">{room.name || `Room ${room.number}`}</p>
                        <p className="text-sm text-muted-foreground">#{room.number}</p>
                      </div>
                      {getStatusBadge(room.status)}
                    </div>
                      
                    <div className="border-t pt-4 mt-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-muted rounded-md">
                          <Building className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">PROPERTY</p>
                          <p className="text-sm">{room.property}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-muted rounded-md">
                          <BedDouble className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">TYPE</p>
                          <p className="text-sm">{room.type} • {room.capacity}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-muted rounded-md">
                          <div className="font-semibold text-xs text-muted-foreground">$</div>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">RATE</p>
                          <p className="text-sm">${room.rate}/night</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between gap-2 border-t pt-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="outline">
                            <MoreHorizontal className="h-3.5 w-3.5 mr-1" />
                            Actions
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {/* Status change options */}
                          <DropdownMenuItem 
                            onClick={() => handleStatusChange(room.id, 'available')}
                            disabled={room.status === 'available'}
                          >
                            Mark as Available
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleStatusChange(room.id, 'cleaning')}
                            disabled={room.status === 'cleaning'}
                          >
                            Mark as Cleaning
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleStatusChange(room.id, 'maintenance')}
                            disabled={room.status === 'maintenance'}
                          >
                            Mark as Maintenance
                          </DropdownMenuItem>
                          {/* Delete option - only for admins */}
                          {isAdmin && (
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleDeleteClick(room.id)}
                            >
                              Delete Room
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" asChild>
                          <Link to={`/rooms/edit/${room.id}`}>
                            <Edit className="h-3.5 w-3.5 mr-1" />
                            Edit
                          </Link>
                        </Button>
                        <Button size="sm" asChild>
                          <Link to={`/rooms/view/${room.id}`}>
                            View
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {(!filteredRooms || filteredRooms.length === 0) && (
            <div className="col-span-full text-center py-10 border rounded-md bg-muted/10">
              <p className="text-muted-foreground">No rooms found</p>
            </div>
          )}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this room?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the room and
              remove the data from our servers.
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
