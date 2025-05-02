import { useQuery } from '@tanstack/react-query';
import { fetchRooms, fetchRoomById, fetchAvailableRoomsForOwner, Room } from '../services/api';

type RoomFilterOptions = {
  property?: string;
  status?: 'available' | 'occupied' | 'maintenance' | 'cleaning';
};

// Hook to fetch and cache room data from the database
export const useRooms = (options: RoomFilterOptions = {}) => {
  return useQuery<Room[]>({
    queryKey: ['rooms', options],
    queryFn: () => fetchRooms(options),
  });
};

// Hook for individual room data
export function useRoom(id: string) {
  return useQuery({
    queryKey: ['room', id],
    queryFn: () => fetchRoomById(id),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    enabled: !!id // Only fetch if we have an ID
  });
}

// New hook to fetch only rooms that are not assigned to any owner
export const useAvailableRooms = () => {
  return useQuery<Room[]>({
    queryKey: ['availableRooms'],
    queryFn: () => fetchAvailableRoomsForOwner(),
  });
};
