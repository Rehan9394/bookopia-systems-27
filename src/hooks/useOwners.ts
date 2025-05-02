import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  fetchOwners, 
  fetchOwnerById, 
  createOwner, 
  updateOwner, 
  deleteOwner,
  fetchOwnerFinancialInfo,
  saveOwnerFinancialInfo,
  fetchRoomOwnerAssignments,
  createRoomOwnerAssignment,
  deleteRoomOwnerAssignment
} from "@/services/api";
import { Owner } from "@/services/supabase-types";
import { useAuth } from "./use-auth";
import { toast } from "./use-toast";

// Extended Owner type to include computed properties for the UI
export interface OwnerWithStats extends Owner {
  name?: string; // Computed full name
  propertiesCount?: number;
  revenue?: number;
  occupancy?: number;
  rooms?: any[];
  financialInfo?: any;
}

export const useOwners = () => {
  return useQuery<OwnerWithStats[]>({
    queryKey: ["owners"],
    queryFn: async () => {
      const owners = await fetchOwners();
      
      // Transform each owner to include computed properties
      return owners.map(owner => ({
        ...owner,
        name: `${owner.first_name} ${owner.last_name}`,
        // These would typically be calculated based on room_owner_assignments
        // and booking data in a real application
        propertiesCount: 0,
        revenue: 0,
        occupancy: 0
      }));
    }
  });
};

export const useOwner = (id: string) => {
  return useQuery<OwnerWithStats>({
    queryKey: ["owner", id],
    queryFn: async () => {
      const owner = await fetchOwnerById(id);
      const financialInfo = await fetchOwnerFinancialInfo(id);
      const roomAssignments = await fetchRoomOwnerAssignments(id);
      
      // Transform to include additional computed properties for the UI
      return {
        ...owner,
        name: `${owner.first_name} ${owner.last_name}`,
        propertiesCount: roomAssignments.length,
        revenue: 0, // Would be calculated from actual bookings
        occupancy: 0, // Would be calculated from actual bookings
        rooms: roomAssignments,
        financialInfo
      };
    },
    enabled: !!id
  });
};

export const useCreateOwner = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (newOwner: Partial<Owner>) => {
      return await createOwner(newOwner);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owners"] });
      toast({
        title: "Owner created",
        description: "The owner has been created successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create owner",
        description: error.message || "An error occurred while creating the owner.",
        variant: "destructive"
      });
    }
  });
};

export const useUpdateOwner = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Owner> }) => {
      return await updateOwner(id, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["owners"] });
      queryClient.invalidateQueries({ queryKey: ["owner", variables.id] });
      toast({
        title: "Owner updated",
        description: "The owner has been updated successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update owner",
        description: error.message || "An error occurred while updating the owner.",
        variant: "destructive"
      });
    }
  });
};

export const useDeleteOwner = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (id: string) => {
      if (user?.role !== 'admin') {
        throw new Error("Only administrators can delete owners");
      }
      return await deleteOwner(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owners"] });
      toast({
        title: "Owner deleted",
        description: "The owner has been deleted successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete owner",
        description: error.message || "An error occurred while deleting the owner.",
        variant: "destructive"
      });
    }
  });
};

export const useSaveOwnerFinancialInfo = (ownerId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (financialData: any) => {
      return await saveOwnerFinancialInfo(ownerId, financialData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner", ownerId] });
      toast({
        title: "Financial information saved",
        description: "The financial information has been saved successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save financial information",
        description: error.message || "An error occurred while saving the financial information.",
        variant: "destructive"
      });
    }
  });
};

// New hook for assigning rooms to owner
export const useAssignRoomToOwner = (ownerId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (roomData: { room_id: string, commission_rate?: number, notes?: string }) => {
      return await createRoomOwnerAssignment({
        owner_id: ownerId,
        room_id: roomData.room_id,
        commission_rate: roomData.commission_rate || 10, // Default 10%
        notes: roomData.notes
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner", ownerId] });
      toast({
        title: "Room assigned",
        description: "The room has been assigned to the owner successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to assign room",
        description: error.message || "An error occurred while assigning the room to the owner.",
        variant: "destructive"
      });
    }
  });
};

// New hook for removing room assignment from owner
export const useRemoveRoomFromOwner = (ownerId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (roomId: string) => {
      return await deleteRoomOwnerAssignment(ownerId, roomId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner", ownerId] });
      toast({
        title: "Room assignment removed",
        description: "The room has been removed from the owner successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to remove room assignment",
        description: error.message || "An error occurred while removing the room assignment.",
        variant: "destructive"
      });
    }
  });
};
