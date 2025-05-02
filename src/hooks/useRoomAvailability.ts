import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchRoomAvailability } from "@/services/api";

export interface AvailabilityBooking {
  id: string;
  checkIn: string; // ISO date string
  checkOut: string; // ISO date string
  status: string;
  guestName: string;
}

export interface RoomAvailability {
  id: string;
  roomNumber: string;
  property: string;
  propertyId: string;
  bookings: AvailabilityBooking[];
}

/**
 * Hook to fetch room availability data for a specific date range
 */
export const useRoomAvailability = (startDate?: string, endDate?: string) => {
  return useQuery<RoomAvailability[]>({
    queryKey: ["roomAvailability", startDate, endDate],
    queryFn: () => fetchRoomAvailability(startDate, endDate),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to fetch availability for a specific room
 */
export const useRoomSpecificAvailability = (roomId: string, startDate?: string, endDate?: string) => {
  return useQuery<RoomAvailability>({
    queryKey: ["roomAvailability", roomId, startDate, endDate],
    queryFn: async () => {
      const rooms = await fetchRoomAvailability(startDate, endDate);
      const room = rooms.find(r => r.id === roomId);
      
      if (!room) {
        throw new Error(`Room with ID ${roomId} not found`);
      }
      
      return room;
    },
    enabled: !!roomId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};