import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search, Eye, Pencil, Trash2, Loader } from 'lucide-react';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useUsers, useDeleteUser } from '@/hooks/useUsers';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { User } from '@/services/supabase-types';

const Users = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: allUsers, isLoading, error } = useUsers();
  const deleteUserMutation = useDeleteUser();
  
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get('q') || "");
  const [roleFilter, setRoleFilter] = useState<string>(searchParams.get('role') || "all");
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  
  // Apply filters when values change or when data loads
  useEffect(() => {
    if (!allUsers) return;
    
    let filtered = [...allUsers];
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(user => 
        (user.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.first_name + ' ' + user.last_name).toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter.toLowerCase());
    }
    
    setFilteredUsers(filtered);
    
    // Update URL with filters
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (roleFilter !== 'all') params.set('role', roleFilter);
    
    setSearchParams(params, { replace: true });
  }, [searchQuery, roleFilter, allUsers, setSearchParams]);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-blue-100 text-blue-800';
      case 'agent': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'agent': return 'Agent';
      default: return role;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      description: searchQuery ? `Searching for "${searchQuery}"` : "Showing all users",
    });
  };
  
  const handleRoleFilter = (role: string) => {
    setRoleFilter(role === roleFilter ? 'all' : role);
  };
  
  const handleDeleteUser = (userId: string) => {
    deleteUserMutation.mutate(userId, {
      onSuccess: () => {
        toast({
          title: "User Deleted",
          description: "User has been successfully removed.",
        });
      }
    });
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground mt-1">Manage system users and their permissions</p>
        </div>
        <Button className="flex items-center gap-2" asChild>
          <Link to="/users/add">
            <PlusCircle className="h-4 w-4" />
            Add New User
          </Link>
        </Button>
      </div>
      
      <Card className="p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <form onSubmit={handleSearch}>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search users by name or email..." 
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant={roleFilter === 'all' ? "default" : "outline"} 
              className="flex-1"
              onClick={() => handleRoleFilter('all')}
            >
              All Roles
            </Button>
            <Button 
              variant={roleFilter === 'admin' ? "default" : "outline"} 
              className="flex-1"
              onClick={() => handleRoleFilter('admin')}
            >
              Admins
            </Button>
            <Button 
              variant={roleFilter === 'agent' ? "default" : "outline"} 
              className="flex-1"
              onClick={() => handleRoleFilter('agent')}
            >
              Agents
            </Button>
          </div>
        </div>
        
        {(searchQuery || roleFilter !== 'all') && (
          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'} found
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setSearchQuery("");
                setRoleFilter("all");
                setSearchParams({});
              }}
            >
              Clear All Filters
            </Button>
          </div>
        )}
      </Card>
      
      <Card>
        {isLoading || deleteUserMutation.isPending ? (
          <div className="flex items-center justify-center h-64">
            <Loader className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading users...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64">
            <p className="text-red-500">Failed to load users data</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        ) : (
          <Table>
            <TableCaption>A list of all system users.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback>{getInitials(user.first_name + ' ' + user.last_name)}</AvatarFallback>
                      </Avatar>
                      <span>{user.first_name} {user.last_name}</span>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge className={getRoleColor(user.role)} variant="outline">
                        {getRoleDisplay(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.status ? "outline" : "destructive"}>
                        {user.status ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/users/${user.id}`}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/users/edit/${user.id}`}>
                            <Pencil className="h-4 w-4 mr-1" />
                            Edit
                          </Link>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-red-500">
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the user account for {user.first_name} {user.last_name}. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No users found matching your filters
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
};

export default Users;
