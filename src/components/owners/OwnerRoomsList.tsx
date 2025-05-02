import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Trash2, 
  DoorClosed, 
  Home 
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { useOwner, useAssignRoomToOwner, useRemoveRoomFromOwner } from '@/hooks/useOwners';
import { useAvailableRooms } from '@/hooks/useRooms';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface OwnerRoomsListProps {
  ownerId: string;
  isEditing?: boolean;
}

export const OwnerRoomsList = ({ ownerId, isEditing = false }: OwnerRoomsListProps) => {
  const { toast } = useToast();
  const { data: owner, isLoading: isLoadingOwner } = useOwner(ownerId);
  const { data: availableRooms, isLoading: isLoadingRooms } = useAvailableRooms();
  const assignRoomMutation = useAssignRoomToOwner(ownerId);
  const removeRoomMutation = useRemoveRoomFromOwner(ownerId);
  
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  
  const handleAddRoom = async () => {
    if (!selectedRoomId) return;
    
    try {
      await assignRoomMutation.mutateAsync({ 
        room_id: selectedRoomId,
        commission_rate: 10 // Add default commission rate
      });
      
      toast({
        title: "Room Added",
        description: "Room has been successfully assigned to the owner.",
      });
      
      // Reset selection
      setSelectedRoomId("");
      setDialogOpen(false);
    } catch (error) {
      console.error("Error assigning room:", error);
      toast({
        title: "Error",
        description: "Failed to assign room to the owner. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    try {
      await removeRoomMutation.mutateAsync(roomId);
      
      toast({
        title: "Room Removed",
        description: "Room has been removed from the owner's portfolio.",
      });
    } catch (error) {
      console.error("Error removing room assignment:", error);
      toast({
        title: "Error",
        description: "Failed to remove room from the owner. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (isLoadingOwner || isLoadingRooms) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Owner Rooms</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get room details for each assignment
  const ownerRoomDetails = owner?.rooms?.map(assignment => {
    const roomDetails = owner?.roomDetails?.find(room => room.id === assignment.room_id);
    return {
      ...assignment,
      roomDetails
    };
  }) || [];

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Owner Rooms</CardTitle>
        {isEditing && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Room
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Room to Owner</DialogTitle>
                <DialogDescription>
                  Assign an available room to this owner's portfolio.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="room">Select Room</Label>
                  <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a room" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRooms && availableRooms.length > 0 ? (
                        availableRooms.map((room) => (
                          <SelectItem key={room.id} value={room.id}>
                            Room {room.number} - {room.property}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>
                          No available rooms to assign
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button 
                  onClick={handleAddRoom} 
                  disabled={!selectedRoomId || assignRoomMutation.isPending}>
                  {assignRoomMutation.isPending ? "Adding..." : "Add Room"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {ownerRoomDetails.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Room Number</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                {isEditing && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {ownerRoomDetails.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell>{assignment.roomDetails?.number}</TableCell>
                  <TableCell>{assignment.roomDetails?.property}</TableCell>
                  <TableCell>{assignment.roomDetails?.type}</TableCell>
                  <TableCell>{assignment.roomDetails?.status}</TableCell>
                  {isEditing && (
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDeleteRoom(assignment.room_id)}
                        disabled={removeRoomMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <DoorClosed className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No rooms assigned to this owner</p>
            {isEditing && availableRooms && availableRooms.length > 0 && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add the first room
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
