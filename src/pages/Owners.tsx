import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search, Building, DollarSign, Percent, Eye, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
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
import { useOwners, useDeleteOwner, OwnerWithStats } from '@/hooks/useOwners';

const Owners = () => {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Use the useOwners hook to fetch data from the database
  const { data: owners = [], isLoading, error } = useOwners();
  const deleteOwnerMutation = useDeleteOwner();
  
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get('q') || "");
  const [filteredOwners, setFilteredOwners] = useState<OwnerWithStats[]>([]);
  
  // Apply filters when search value changes or when owners data is loaded
  useEffect(() => {
    if (owners.length > 0) {
      if (searchQuery) {
        const filtered = owners.filter(owner => 
          owner.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          owner.email?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredOwners(filtered);
      } else {
        setFilteredOwners(owners);
      }
    } else {
      setFilteredOwners([]);
    }
    
    // Update URL with search parameter
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    setSearchParams(params, { replace: true });
  }, [searchQuery, owners]);

  const getInitials = (name: string = '') => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const formatCurrency = (amount: number = 0) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      description: searchQuery ? `Searching for "${searchQuery}"` : "Showing all owners",
    });
  };
  
  const handleDeleteOwner = async (ownerId: string) => {
    try {
      await deleteOwnerMutation.mutateAsync(ownerId);
    } catch (error) {
      // Error already handled in the mutation hook
    }
  };

  // Display a loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading owners...</span>
      </div>
    );
  }

  // Display error state
  if (error) {
    return (
      <Card className="p-6 mx-auto my-8 max-w-lg">
        <CardHeader>
          <CardTitle className="text-red-500">Error Loading Owners</CardTitle>
        </CardHeader>
        <CardContent>
          <p>There was a problem loading the owners: {(error as Error).message}</p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Calculate totals for summary cards
  const totalProperties = owners.reduce((acc, owner) => acc + (owner.propertiesCount || 0), 0);
  const totalRevenue = owners.reduce((acc, owner) => acc + (owner.revenue || 0), 0);

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Property Owners</h1>
          <p className="text-muted-foreground mt-1">Manage all property owners and their units</p>
        </div>
        <Button className="flex items-center gap-2" asChild>
          <Link to="/owners/add">
            <PlusCircle className="h-4 w-4" />
            Add New Owner
          </Link>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Owners</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{owners.length}</div>
              <div className="p-2 bg-primary/10 rounded-full text-primary">
                <Building className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Properties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{totalProperties}</div>
              <div className="p-2 bg-primary/10 rounded-full text-primary">
                <Building className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
              <div className="p-2 bg-primary/10 rounded-full text-primary">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="p-6 mb-8">
        <div className="relative">
          <form onSubmit={handleSearch}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search owner by name or email..." 
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </div>
        
        {searchQuery && (
          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {filteredOwners.length} {filteredOwners.length === 1 ? 'owner' : 'owners'} found
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setSearchQuery("");
                setSearchParams({});
              }}
            >
              Clear Search
            </Button>
          </div>
        )}
      </Card>
      
      <Card>
        <Table>
          <TableCaption>A list of all property owners and their details.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Owner</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Properties</TableHead>
              <TableHead>Revenue (YTD)</TableHead>
              <TableHead>Avg. Occupancy</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOwners.length > 0 ? (
              filteredOwners.map((owner) => (
                <TableRow key={owner.id}>
                  <TableCell className="font-medium flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={owner.avatar_url || undefined} />
                      <AvatarFallback>{getInitials(owner.name || '')}</AvatarFallback>
                    </Avatar>
                    <span>{owner.name}</span>
                  </TableCell>
                  <TableCell>{owner.email}</TableCell>
                  <TableCell>{owner.propertiesCount || 0}</TableCell>
                  <TableCell>{formatCurrency(owner.revenue || 0)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Percent className="h-4 w-4 text-muted-foreground" />
                      <span>{owner.occupancy || 0}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/owners/${owner.id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/owners/edit/${owner.id}`}>
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
                              This will permanently delete the owner {owner.name} and all associated data. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              disabled={deleteOwnerMutation.isPending}
                              onClick={() => handleDeleteOwner(owner.id)}>
                              {deleteOwnerMutation.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Deleting...
                                </>
                              ) : (
                                "Delete"
                              )}
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
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {searchQuery 
                    ? "No owners found matching your search" 
                    : "No owners found. Add your first owner to get started."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default Owners;
