import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchCleaningStatus, updateRoomCleaningStatus } from '@/services/api';

export type CleaningStatusType = 'dirty' | 'cleaning' | 'clean' | 'inspected';

export interface RoomCleaningStatus {
  id: string;
  roomId: string;
  roomNumber: string;
  property: string;
  status: CleaningStatusType;
  lastCleaned: string | null;
  nextCheckIn: string | null;
}

// Hook to fetch cleaning status
export const useCleaningStatus = (date?: string) => {
  return useQuery({
    queryKey: ['cleaningStatus', date],
    queryFn: () => fetchCleaningStatus(date),
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
    staleTime: 1000 * 60 * 2 // Mark as stale after 2 minutes
  });
};

// Hook to update room cleaning status
export const useUpdateCleaningStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ roomId, status, notes }: { roomId: string, status: CleaningStatusType, notes?: string }) => 
      updateRoomCleaningStatus(roomId, status, notes),
    onSuccess: () => {
      // Invalidate cleaning status queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['cleaningStatus'] });
    }
  });
};
