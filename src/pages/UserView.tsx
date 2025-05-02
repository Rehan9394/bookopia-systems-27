import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, FileEdit, Clock, Trash2, Loader } from 'lucide-react';
import { useUser, useDeleteUser } from '@/hooks/useUsers';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { useToast } from '@/hooks/use-toast';

const UserView = () => {
  const { id } = useParams();
  const userId = id || '';
  const { data: user, isLoading, error } = useUser(userId);
  const { data: auditLogs } = useAuditLogs();
  const deleteUserMutation = useDeleteUser();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Filter audit logs for this specific user
  const userLogs = auditLogs?.filter(log => log.user === userId).slice(0, 5) || [];

  const handleDeleteUser = () => {
    deleteUserMutation.mutate(userId, {
      onSuccess: () => {
        toast({
          title: "User Deleted",
          description: "User has been deleted successfully.",
        });
        navigate('/users');
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: "Failed to delete user. Please try again.",
          variant: "destructive"
        });
        console.error("Error deleting user:", error);
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading user information...</span>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-red-500">Error loading user</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => navigate('/users')}
        >
          Return to Users List
        </Button>
      </div>
    );
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild className="mr-4">
            <Link to="/users">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">User Profile</h1>
            <p className="text-muted-foreground mt-1">View user information</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to={`/users/edit/${user.id}`}>
              <FileEdit className="h-4 w-4 mr-2" />
              Edit User
            </Link>
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete User
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the user
                  account and remove their data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteUser}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleteUserMutation.isPending ? (
                    <>
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete User'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.avatar_url || undefined} />
                <AvatarFallback>{getInitials(user.first_name, user.last_name)}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-semibold">{`${user.first_name} ${user.last_name}`}</h2>
                <p className="text-muted-foreground">{user.email}</p>
                {user.phone && <p className="text-muted-foreground">{user.phone}</p>}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Role</p>
                <Badge className="mt-1">{user.role}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge 
                  variant={user.status ? "secondary" : "outline"}
                  className="mt-1"
                >
                  {user.status ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Last Login</p>
              <p className="font-medium">{user.last_sign_in_at 
                ? new Date(user.last_sign_in_at).toLocaleString() 
                : 'Never'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created At</p>
              <p className="font-medium">{user.created_at 
                ? new Date(user.created_at).toLocaleDateString() 
                : 'Unknown'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Auth Provider</p>
              <Badge variant="secondary">
                {user.provider || 'Email'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Activity</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/audit">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {userLogs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date & Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={log.action === 'create' ? 'outline' : 
                                        log.action === 'update' ? 'secondary' : 'default'}>
                          {log.action}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>{log.type}</TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-muted-foreground mb-2">No activity found for this user</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserView;
