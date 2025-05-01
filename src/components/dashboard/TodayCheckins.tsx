
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDownToLine, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useTodayCheckins } from '@/hooks/useBookings';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

export function TodayCheckins() {
  const { data: checkins, isLoading, error } = useTodayCheckins();
  
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4 p-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center">
                <Skeleton className="h-8 w-8 rounded-full mr-3" />
                <div>
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
              <div className="text-right">
                <Skeleton className="h-3 w-16 mb-1" />
                <Skeleton className="h-7 w-20" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-6 text-muted-foreground">
          <p>Error loading check-ins data</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      );
    }

    if (!checkins || checkins.length === 0) {
      return (
        <div className="text-center py-6 text-muted-foreground">
          <p>No check-ins scheduled for today</p>
        </div>
      );
    }

    return (
      <div className="divide-y">
        {checkins.map((checkin) => {
          const roomInfo = checkin.rooms as any;
          return (
            <div key={checkin.id} className="flex items-center justify-between p-3">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-3">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium text-sm">{checkin.guest_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {roomInfo?.property || 'Unknown'} - Room {roomInfo?.number || 'Unknown'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="outline" className="mb-1 text-xs bg-blue-50 text-blue-800 border-blue-200">
                  {format(new Date(checkin.check_in_date), 'HH:mm')}
                </Badge>
                <Link to={`/bookings/${checkin.id}`}>
                  <Button variant="ghost" size="sm" className="h-7 text-xs">Check-in</Button>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center">
            <ArrowDownToLine className="mr-2 h-5 w-5 text-primary" />
            Today's Check-ins
          </CardTitle>
          <Link to="/bookings?filter=today-checkins">
            <Button variant="ghost" size="sm" className="h-7 text-xs">View All</Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {renderContent()}
      </CardContent>
    </Card>
  );
}
