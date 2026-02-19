import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { postsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, getDay } from 'date-fns';
import type { Post, PostStatus } from '@/types';
import { cn } from '@/lib/utils';

const statusColors: Record<PostStatus, string> = {
  DRAFT: 'bg-gray-400',
  SCHEDULED: 'bg-blue-500',
  PENDING_APPROVAL: 'bg-yellow-500',
  PUBLISHED: 'bg-green-500',
  FAILED: 'bg-red-500',
  ARCHIVED: 'bg-purple-500',
};

const ContentCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Fetch calendar data
  const { data: calendarData } = useQuery({
    queryKey: ['calendar', currentDate.getMonth(), currentDate.getFullYear()],
    queryFn: async () => {
      const response = await postsApi.getCalendar({
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1,
      });
      return response.data.data;
    },
  });

  const calendar = calendarData?.calendar || {};

  // Generate calendar days
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get day of week for first day (0 = Sunday)
  const startDay = getDay(monthStart);

  // Navigation
  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  // Get posts for a specific day
  const getPostsForDay = (day: Date): Post[] => {
    const dateKey = format(day, 'yyyy-MM-dd');
    return calendar[dateKey] || [];
  };

  // Week day headers
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content Calendar</h1>
          <p className="text-muted-foreground mt-1">
            Plan and visualize your content schedule
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={goToToday}>
            Today
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Post
          </Button>
        </div>
      </div>

      {/* Calendar Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-xl">
              {format(currentDate, 'MMMM yyyy')}
            </CardTitle>
            <Button variant="outline" size="icon" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-100 text-blue-800">
              <Clock className="mr-1 h-3 w-3" />
              Scheduled
            </Badge>
            <Badge variant="outline" className="bg-green-100 text-green-800">
              <CheckCircle className="mr-1 h-3 w-3" />
              Published
            </Badge>
            <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
              <AlertCircle className="mr-1 h-3 w-3" />
              Pending
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Week Day Headers */}
          <div className="grid grid-cols-7 gap-px bg-border rounded-t-lg overflow-hidden">
            {weekDays.map((day) => (
              <div
                key={day}
                className="bg-muted p-3 text-center text-sm font-medium"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-px bg-border rounded-b-lg overflow-hidden">
            {/* Empty cells for days before month start */}
            {[...Array(startDay)].map((_, index) => (
              <div
                key={`empty-${index}`}
                className="bg-card min-h-[120px] p-2"
              />
            ))}

            {/* Days */}
            {days.map((day) => {
              const posts = getPostsForDay(day);
              const isToday = isSameDay(day, new Date());
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, currentDate);

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    'bg-card min-h-[120px] p-2 cursor-pointer transition-colors hover:bg-accent/50',
                    !isCurrentMonth && 'bg-muted/50',
                    isToday && 'bg-primary/5',
                    isSelected && 'ring-2 ring-primary'
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={cn(
                        'text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full',
                        isToday && 'bg-primary text-primary-foreground'
                      )}
                    >
                      {format(day, 'd')}
                    </span>
                    {posts.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {posts.length}
                      </Badge>
                    )}
                  </div>

                  {/* Posts for this day */}
                  <div className="space-y-1">
                    {posts.slice(0, 3).map((post: Post) => (
                      <div
                        key={post.id}
                        className={cn(
                          'text-xs px-2 py-1 rounded truncate text-white',
                          statusColors[post.status]
                        )}
                        title={post.title}
                      >
                        {post.title}
                      </div>
                    ))}
                    {posts.length > 3 && (
                      <div className="text-xs text-muted-foreground text-center">
                        +{posts.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Day Details */}
      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Posts for {format(selectedDate, 'MMMM d, yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {getPostsForDay(selectedDate).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarIcon className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No posts scheduled for this day</p>
                <Button className="mt-4" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Schedule Post
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {getPostsForDay(selectedDate).map((post: Post) => (
                  <div
                    key={post.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'w-3 h-3 rounded-full',
                          statusColors[post.status]
                        )}
                      />
                      <div>
                        <p className="font-medium">{post.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {post.platform} • {post.status.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {post.scheduledAt && (
                        <span className="text-sm text-muted-foreground">
                          <Clock className="inline mr-1 h-3 w-3" />
                          {format(new Date(post.scheduledAt), 'h:mm a')}
                        </span>
                      )}
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ContentCalendar;
