import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useCleaningStatus, useUpdateCleaningStatus, CleaningStatusType } from '@/hooks/useCleaningStatus';
import { Loader2, Search, Filter, RefreshCw, CalendarIcon, ListFilter, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface StatusUpdateParams {
  roomId: string;
  status: CleaningStatusType;
  notes?: string;
}

const CleaningStatus = () => {
  const { toast } = useToast();
  const [property, setProperty] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState("all");
  
  // Format date for API
  const dateStr = date.toISOString().split('T')[0];
  
  // Fetch cleaning status data from the database
  const { data, isLoading, isError, error, mutate } = useCleaningStatus(dateStr);
  
  // State for filtered rooms
  const [filteredRooms, setFilteredRooms] = useState<any[]>([]);
  
  // Apply filters when any filter changes or data loads
  useEffect(() => {
    if (!data) return;
    
    let result = [...data];
    
    // Property filter
    if (property !== "all") {
      result = result.filter(room => room.property === property);
    }
    
    // Status filter
    if (status !== "all") {
      result = result.filter(room => room.cleaningStatus === status);
    }
    
    // Tab filter
    if (activeTab === "dirty") {
      result = result.filter(room => room.cleaningStatus === "dirty" || room.cleaningStatus === "cleaning");
    } else if (activeTab === "clean") {
      result = result.filter(room => room.cleaningStatus === "clean" || room.cleaningStatus === "inspected");
    } else if (activeTab === "checkout") {
      result = result.filter(room => room.hasCheckout);
    } else if (activeTab === "checkin") {
      result = result.filter(room => room.hasCheckin);
    }
    
    // Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(room => 
        room.roomNumber.toLowerCase().includes(query) || 
        room.property.toLowerCase().includes(query) ||
        (room.notes && room.notes.toLowerCase().includes(query))
      );
    }
    
    setFilteredRooms(result);
  }, [property, status, activeTab, searchQuery, data]);
  
  // Update cleaning status for a room
  const updateCleaningStatusMutation = useUpdateCleaningStatus();
  
  const updateRoomStatus = async ({ roomId, status, notes }: StatusUpdateParams) => {
    try {
      await updateCleaningStatusMutation.mutateAsync({ roomId, status, notes });
      
      // Show success toast
      toast({
        title: "Status updated",
        description: `Room cleaning status updated to ${status}`,
      });
      
      // Refetch data will happen automatically due to invalidation in the hook
    } catch (error) {
      console.error("Error updating cleaning status:", error);
      toast({
        title: "Error",
        description: "Failed to update room status",
        variant: "destructive",
      });
    }
  };
  
  // Get unique properties for filter
  const properties = data 
    ? [...new Set(data.map(room => room.property))] 
    : [];
  
  // Count items in each tab
  const getCounts = () => {
    if (!data) return { all: 0, dirty: 0, clean: 0, checkout: 0, checkin: 0 };
    
    return {
      all: data.length,
      dirty: data.filter(r => r.cleaningStatus === "dirty" || r.cleaningStatus === "cleaning").length,
      clean: data.filter(r => r.cleaningStatus === "clean" || r.cleaningStatus === "inspected").length,
      checkout: data.filter(r => r.hasCheckout).length,
      checkin: data.filter(r => r.hasCheckin).length
    };
  };
  
  const counts = getCounts();
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'dirty':
        return <Badge variant="outline" className="bg-red-50 text-red-700 hover:bg-red-50">Dirty</Badge>;
      case 'cleaning':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 hover:bg-amber-50">Cleaning</Badge>;
      case 'clean':
        return <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">Clean</Badge>;
      case 'inspected':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50">Inspected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'dirty':
        return 'cleaning';
      case 'cleaning':
        return 'clean';
      case 'clean':
        return 'inspected';
      case 'inspected':
        return 'inspected'; // No next status
      default:
        return 'dirty';
    }
  };
  
  const getStatusActionButton = (room: any) => {
    const nextStatus = getNextStatus(room.cleaningStatus);
    
    if (room.cleaningStatus === 'inspected') {
      return (
        <Button variant="ghost" size="sm" className="text-green-600" disabled>
          <CheckCircle2 className="mr-1 h-4 w-4" />
          Completed
        </Button>
      );
    }
    
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => updateRoomStatus({ roomId: room.id, status: nextStatus })}
      >
        Mark as {nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)}
      </Button>
    );
  };
  
  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Cleaning Status</h1>
          <p className="text-muted-foreground mt-1">Monitor and update room cleaning status</p>
        </div>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                {format(date, 'MMMM d, yyyy')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(date) => date && setDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setDate(new Date())}
            title="Jump to today"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 mb-4">
          <TabsTrigger value="all" className="flex items-center justify-center gap-2">
            All
            <Badge variant="secondary">{counts.all}</Badge>
          </TabsTrigger>
          <TabsTrigger value="dirty" className="flex items-center justify-center gap-2">
            Dirty
            <Badge variant="secondary">{counts.dirty}</Badge>
          </TabsTrigger>
          <TabsTrigger value="clean" className="flex items-center justify-center gap-2">
            Clean
            <Badge variant="secondary">{counts.clean}</Badge>
          </TabsTrigger>
          <TabsTrigger value="checkout" className="flex items-center justify-center gap-2">
            Today's Checkouts
            <Badge variant="secondary">{counts.checkout}</Badge>
          </TabsTrigger>
          <TabsTrigger value="checkin" className="flex items-center justify-center gap-2">
            Today's Checkins
            <Badge variant="secondary">{counts.checkin}</Badge>
          </TabsTrigger>
        </TabsList>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="relative">
            <Input
              placeholder="Search rooms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
          
          <Select value={property} onValueChange={setProperty}>
            <SelectTrigger>
              <SelectValue placeholder="All Properties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Properties</SelectItem>
              {properties.map(prop => (
                <SelectItem key={prop} value={prop}>{prop}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="dirty">Dirty</SelectItem>
              <SelectItem value="cleaning">Cleaning</SelectItem>
              <SelectItem value="clean">Clean</SelectItem>
              <SelectItem value="inspected">Inspected</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <TabsContent value={activeTab} className="mt-0">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Room Cleaning Status</CardTitle>
              <CardDescription>
                View and update cleaning status for rooms
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2 text-lg">Loading cleaning status data...</span>
                </div>
              ) : isError ? (
                <div className="p-8 text-center">
                  <p className="text-red-500">Error loading cleaning status data</p>
                  <p className="text-muted-foreground mt-2">{error instanceof Error ? error.message : 'Unknown error'}</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => window.location.reload()}
                  >
                    Retry
                  </Button>
                </div>
              ) : filteredRooms.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-muted-foreground">No rooms match your filter criteria</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => {
                      setProperty("all");
                      setStatus("all");
                      setSearchQuery("");
                      setActiveTab("all");
                    }}
                  >
                    Clear All Filters
                  </Button>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredRooms.map(room => (
                    <div key={room.id} className="py-4 px-1 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-4">
                          <div className="flex-1">
                            <Link to={`/rooms/view/${room.id}`} className="text-lg font-medium hover:text-primary">
                              Room {room.roomNumber}
                            </Link>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm text-muted-foreground">{room.property}</span>
                              {getStatusBadge(room.cleaningStatus)}
                              {room.hasCheckout && (
                                <Badge variant="outline" className="bg-purple-50 text-purple-700">Today's Checkout</Badge>
                              )}
                              {room.hasCheckin && (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700">Today's Checkin</Badge>
                              )}
                            </div>
                            {room.notes && (
                              <p className="text-sm text-muted-foreground mt-2">
                                <span className="font-medium">Notes:</span> {room.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-end md:self-center">
                        {getStatusActionButton(room)}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            const notes = prompt("Enter notes for this room:", room.notes || "");
                            if (notes !== null) {
                              updateRoomStatus({ 
                                roomId: room.id, 
                                status: room.cleaningStatus,
                                notes 
                              });
                            }
                          }}
                        >
                          Add Notes
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CleaningStatus;
