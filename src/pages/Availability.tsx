import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, addDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { CalendarClock, ChevronLeft, ChevronRight, PlusCircle, RefreshCw, Filter, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useRoomAvailability, type RoomAvailability, type AvailabilityBooking } from '@/hooks/useRoomAvailability';

// Generate array of dates for the calendar view
const generateDates = (startDate: Date, days: number) => {
  const dates = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    dates.push(date);
  }
  return dates;
};

// Calculate booking position and width for the calendar view
const calculateBookingStyle = (booking: {
  id: string;
  startDate: Date;
  endDate: Date;
  status: string;
}, viewStartDate: Date, totalDays: number) => {
  const startDate = new Date(booking.startDate);
  const endDate = new Date(booking.endDate);
  
  // Calculate days from view start to booking start
  const startDiff = Math.max(0, Math.floor((startDate.getTime() - viewStartDate.getTime()) / (24 * 60 * 60 * 1000)));
  
  // Calculate booking duration in days
  const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
  
  // Ensure the booking is visible in the current view
  if (startDiff >= totalDays || startDiff + duration <= 0) {
    return null;
  }
  
  // Adjust start and width if the booking extends outside the view
  const visibleStart = Math.max(0, startDiff);
  const visibleDuration = Math.min(totalDays - visibleStart, duration - Math.max(0, -startDiff));
  
  return {
    left: `${(visibleStart / totalDays) * 100}%`,
    width: `${(visibleDuration / totalDays) * 100}%`,
    status: booking.status
  };
};

const Availability = () => {
  const { toast } = useToast();
  const [viewStartDate, setViewStartDate] = useState(new Date());
  const [displayDays, setDisplayDays] = useState(14); // Show 2 weeks by default
  const [property, setProperty] = useState<string | undefined>("all");
  const [roomType, setRoomType] = useState<string | undefined>("all");
  const [roomStatus, setRoomStatus] = useState<string | undefined>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  
  // Format dates for API call
  const startDateStr = viewStartDate.toISOString().split('T')[0];
  const endDateStr = addDays(viewStartDate, displayDays).toISOString().split('T')[0];
  
  // Fetch room availability data from the database
  const { data: roomsData, isLoading, isError, error } = useRoomAvailability(startDateStr, endDateStr);
  
  // State for filtered rooms
  const [filteredRooms, setFilteredRooms] = useState<RoomAvailability[]>([]);
  
  // Calendar dates for display
  const calendarDates = generateDates(viewStartDate, displayDays);

  // Apply filters when any filter changes or data loads
  useEffect(() => {
    if (!roomsData) return;
    
    let result = [...roomsData];
    
    // Property filter
    if (property && property !== "all") {
      result = result.filter(room => room.property === property);
    }
    
    // Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(room => 
        room.roomNumber.toLowerCase().includes(query) || 
        room.property.toLowerCase().includes(query) ||
        room.bookings.some(booking => booking.guestName.toLowerCase().includes(query))
      );
    }
    
    setFilteredRooms(result);
  }, [property, roomType, roomStatus, searchQuery, roomsData]);
  
  const moveCalendar = (direction: 'prev' | 'next') => {
    const newDate = new Date(viewStartDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - displayDays);
    } else {
      newDate.setDate(newDate.getDate() + displayDays);
    }
    setViewStartDate(newDate);
  };

  const jumpToDate = (date: Date) => {
    setViewStartDate(date);
    setSelectedDate(date);
    toast({
      title: "Calendar updated",
      description: `Viewing availability from ${format(date, 'MMMM d, yyyy')}`,
    });
  };
  
  const handleViewChange = (days: number) => {
    setDisplayDays(days);
    toast({
      description: `Now displaying ${days} days in the calendar view`,
    });
  };
  
  const formatDateHeader = (date: Date) => {
    const day = date.getDate();
    const isToday = new Date().toDateString() === date.toDateString();
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    
    return (
      <div className={cn(
        "text-center p-1", 
        isToday ? "bg-primary/10 rounded-md" : "",
        date.getDay() === 0 || date.getDay() === 6 ? "bg-red-50" : ""
      )}>
        <div className="text-xs text-muted-foreground">{dayName}</div>
        <div className={cn("text-sm font-semibold", isToday ? "text-primary" : "")}>
          {day}
        </div>
        {day === 1 || date.getDate() === viewStartDate.getDate() ? (
          <div className="text-xs text-muted-foreground">{month}</div>
        ) : null}
      </div>
    );
  };

  const handleCellClick = (roomId: string, date: Date) => {
    // In a real app, this would open a booking creation form
    toast({
      title: "Create Booking",
      description: `Room ${filteredRooms.find(r => r.id === roomId)?.roomNumber} selected for ${format(date, 'MMMM d, yyyy')}`,
    });
  };
  
  const handleBookingClick = (bookingId: string) => {
    // In a real app, this would navigate to booking details
    toast({
      title: "Booking Details",
      description: `Viewing details for booking #${bookingId}`,
    });
  };
  
  // Convert database bookings to the format expected by the UI
  const convertBookingsForDisplay = (room: RoomAvailability) => {
    return {
      id: room.id,
      number: room.roomNumber,
      property: room.property,
      type: 'Standard', // Type is not coming from API, would need to be added
      status: 'available', // Default status
      bookings: room.bookings.map(booking => ({
        id: booking.id,
        guestName: booking.guestName,
        startDate: new Date(booking.checkIn),
        endDate: new Date(booking.checkOut),
        status: booking.status as 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled'
      }))
    };
  };

  // Get upcoming check-ins and check-outs for the next 7 days
  const getUpcomingCheckIns = () => {
    if (!roomsData) return [];
    
    const today = new Date();
    const next7Days = new Date(today);
    next7Days.setDate(today.getDate() + 7);
    
    return roomsData.flatMap(room => 
      room.bookings
        .filter(b => 
          b.status === 'confirmed' && 
          new Date(b.checkIn) >= today && 
          new Date(b.checkIn) <= next7Days
        )
        .map(booking => ({
          id: booking.id,
          guestName: booking.guestName,
          roomNumber: room.roomNumber,
          property: room.property,
          date: new Date(booking.checkIn)
        }))
    );
  };
  
  const getUpcomingCheckOuts = () => {
    if (!roomsData) return [];
    
    const today = new Date();
    const next7Days = new Date(today);
    next7Days.setDate(today.getDate() + 7);
    
    return roomsData.flatMap(room => 
      room.bookings
        .filter(b => 
          b.status === 'checked-in' && 
          new Date(b.checkOut) >= today && 
          new Date(b.checkOut) <= next7Days
        )
        .map(booking => ({
          id: booking.id,
          guestName: booking.guestName,
          roomNumber: room.roomNumber,
          property: room.property,
          date: new Date(booking.checkOut)
        }))
    );
  };

  // Get unique properties for filter
  const properties = roomsData 
    ? [...new Set(roomsData.map(room => room.property))] 
    : [];

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Availability Calendar</h1>
          <p className="text-muted-foreground mt-1">View and manage room availability</p>
        </div>
        <Button asChild className="flex items-center gap-2">
          <Link to="/bookings/new">
            <PlusCircle className="h-4 w-4" />
            Add New Booking
          </Link>
        </Button>
      </div>
      
      <Card className="mb-8">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Room Availability</CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => moveCalendar('prev')}
                  className="h-8 w-8"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="h-8">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(viewStartDate, 'MMM d, yyyy')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="center">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && jumpToDate(date)}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => moveCalendar('next')}
                  className="h-8 w-8"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Select value={displayDays.toString()} onValueChange={(value) => handleViewChange(parseInt(value))}>
                <SelectTrigger className="w-[130px] h-8">
                  <SelectValue placeholder="View" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 Days</SelectItem>
                  <SelectItem value="14">14 Days</SelectItem>
                  <SelectItem value="30">30 Days</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setViewStartDate(new Date())}
                className="h-8 w-8"
                title="Jump to today"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardDescription>
            View and manage room availability. Click on empty cells to create new bookings.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            <div className="relative">
              <Input
                placeholder="Search rooms or guests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
              <Filter className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            
            <Select value={property} onValueChange={setProperty}>
              <SelectTrigger>
                <SelectValue placeholder="Property Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Properties</SelectItem>
                {properties.map(prop => (
                  <SelectItem key={prop} value={prop}>{prop}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-lg">Loading room availability...</span>
            </div>
          ) : isError ? (
            <div className="p-8 text-center">
              <p className="text-red-500">Error loading availability data</p>
              <p className="text-muted-foreground mt-2">{error instanceof Error ? error.message : 'Unknown error'}</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </div>
          ) : (
            <div className="border rounded-md overflow-hidden mb-4">
              <div className="overflow-x-auto">
                <div style={{ 
                  minWidth: `${Math.max(displayDays * 80, 1000)}px`, 
                  width: '100%' 
                }}>
                  <div className="grid grid-cols-[200px_1fr] border-b border-border">
                    <div className="p-3 font-medium text-sm bg-muted border-r border-border sticky left-0 z-10">Room</div>
                    <div className={`grid`} style={{ gridTemplateColumns: `repeat(${displayDays}, 1fr)` }}>
                      {calendarDates.map((date, i) => (
                        <div key={i} className="p-2 text-center border-r border-border last:border-r-0">
                          {formatDateHeader(date)}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {filteredRooms.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-muted-foreground">No rooms match your filter criteria</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => {
                          setProperty("all");
                          setRoomType("all");
                          setRoomStatus("all");
                          setSearchQuery("");
                        }}
                      >
                        Clear All Filters
                      </Button>
                    </div>
                  ) : (
                    filteredRooms.map((room) => {
                      const displayRoom = convertBookingsForDisplay(room);
                      return (
                        <div key={room.id} className="grid grid-cols-[200px_1fr] border-b border-border last:border-b-0">
                          <div className="p-4 border-r border-border flex flex-col sticky left-0 bg-white z-10">
                            <Link to={`/rooms/view/${room.id}`} className="font-medium hover:text-primary">
                              Room {room.roomNumber}
                            </Link>
                            <span className="text-sm text-muted-foreground flex items-center justify-between">
                              {room.property}
                            </span>
                          </div>
                          <div className="relative h-[80px]">
                            {/* Grid cells for days */}
                            <div className="grid h-full" style={{ gridTemplateColumns: `repeat(${displayDays}, 1fr)` }}>
                              {Array.from({ length: displayDays }).map((_, i) => {
                                const cellDate = new Date(viewStartDate);
                                cellDate.setDate(cellDate.getDate() + i);
                                return (
                                  <div 
                                    key={i} 
                                    className={cn(
                                      "border-r border-border last:border-r-0 hover:bg-muted/50 cursor-pointer",
                                      cellDate.getDay() === 0 || cellDate.getDay() === 6 ? "bg-red-50/50" : "",
                                      new Date().toDateString() === cellDate.toDateString() ? "bg-primary/5" : ""
                                    )}
                                    onClick={() => handleCellClick(room.id, cellDate)}
                                  ></div>
                                );
                              })}
                            </div>
                            
                            {/* Bookings */}
                            {displayRoom.bookings.map((booking) => {
                              const style = calculateBookingStyle(booking, viewStartDate, displayDays);
                              if (!style) return null;
                              
                              return (
                                <div 
                                  key={booking.id}
                                  className={cn(
                                    "absolute top-[16px] h-[48px] rounded-md cursor-pointer transition-shadow hover:shadow-md flex items-center px-2",
                                    booking.status === 'confirmed' && "bg-blue-100 border border-blue-300",
                                    booking.status === 'checked-in' && "bg-green-100 border border-green-300",
                                    booking.status === 'checked-out' && "bg-gray-100 border border-gray-300",
                                    booking.status === 'cancelled' && "bg-red-100 border border-red-300"
                                  )}
                                  style={{ left: style.left, width: style.width }}
                                  onClick={() => handleBookingClick(booking.id)}
                                >
                                  <div className="truncate text-xs font-medium">
                                    {booking.guestName}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium">Legend:</div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-blue-500"></div>
              <span className="text-sm">Confirmed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500"></div>
              <span className="text-sm">Checked In</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-gray-400"></div>
              <span className="text-sm">Checked Out</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500"></div>
              <span className="text-sm">Cancelled</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Changes</CardTitle>
          <CardDescription>Check-ins and check-outs in the next 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2">Loading upcoming changes...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <CalendarClock className="h-5 w-5 text-blue-500" />
                  Upcoming Check-ins
                </h3>
                <div className="space-y-2">
                  {getUpcomingCheckIns().map(checkIn => (
                    <div key={checkIn.id} className="flex justify-between items-center p-3 border rounded-md hover:bg-muted/50">
                      <div>
                        <p className="font-medium">{checkIn.guestName}</p>
                        <p className="text-sm text-muted-foreground">
                          Room {checkIn.roomNumber}, {checkIn.property}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{format(checkIn.date, 'MMM d, yyyy')}</p>
                        <Button size="sm" variant="outline" asChild className="mt-1">
                          <Link to={`/bookings/${checkIn.id}`}>
                            Details
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                  {getUpcomingCheckIns().length === 0 && (
                    <p className="text-muted-foreground text-center py-4">No upcoming check-ins</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <CalendarClock className="h-5 w-5 text-green-500" />
                  Upcoming Check-outs
                </h3>
                <div className="space-y-2">
                  {getUpcomingCheckOuts().map(checkOut => (
                    <div key={checkOut.id} className="flex justify-between items-center p-3 border rounded-md hover:bg-muted/50">
                      <div>
                        <p className="font-medium">{checkOut.guestName}</p>
                        <p className="text-sm text-muted-foreground">
                          Room {checkOut.roomNumber}, {checkOut.property}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{format(checkOut.date, 'MMM d, yyyy')}</p>
                        <Button size="sm" variant="outline" asChild className="mt-1">
                          <Link to={`/bookings/${checkOut.id}`}>
                            Details
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                  {getUpcomingCheckOuts().length === 0 && (
                    <p className="text-muted-foreground text-center py-4">No upcoming check-outs</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Availability;
