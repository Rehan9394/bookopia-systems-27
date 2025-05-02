import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchUsers, fetchUserById, createUser, updateUser, deleteUser } from "@/services/api";
import { User } from "@/services/supabase-types";
import { useToast } from "./use-toast";

export const useUsers = () => {
  return useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useUser = (id: string) => {
  return useQuery({
    queryKey: ["user", id],
    queryFn: () => fetchUserById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Hook for creating a new user
export const useCreateUser = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (userData: Partial<User>) => createUser(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({
        title: "User Created",
        description: "The user has been created successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error Creating User",
        description: error.message || "There was an error creating the user.",
        variant: "destructive"
      });
    }
  });
};

// Hook for updating an existing user
export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: ({ id, userData }: { id: string; userData: Partial<User> }) => 
      updateUser(id, userData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user", data.id] });
      toast({
        title: "User Updated",
        description: "The user has been updated successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error Updating User",
        description: error.message || "There was an error updating the user.",
        variant: "destructive"
      });
    }
  });
};

// Hook for deleting a user
export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({
        title: "User Deleted",
        description: "The user has been deleted successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error Deleting User",
        description: error.message || "There was an error deleting the user.",
        variant: "destructive"
      });
    }
  });
};
