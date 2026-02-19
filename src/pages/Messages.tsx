import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { messagesApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  Search,
  MessageSquare,
  Mail,
  Phone,
  MessageCircle,
  Send,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import type { Message, MessageChannel, MessageStatus } from '@/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const channelIcons: Record<MessageChannel, React.ElementType> = {
  WHATSAPP: Phone,
  MESSENGER: MessageCircle,
  EMAIL: Mail,
  SMS: Phone,
  LIVE_CHAT: MessageSquare,
};

const channelColors: Record<MessageChannel, string> = {
  WHATSAPP: 'bg-green-500',
  MESSENGER: 'bg-blue-500',
  EMAIL: 'bg-red-500',
  SMS: 'bg-purple-500',
  LIVE_CHAT: 'bg-orange-500',
};

const statusIcons: Record<MessageStatus, React.ElementType> = {
  UNREAD: AlertCircle,
  READ: CheckCircle,
  REPLIED: Send,
  ARCHIVED: Clock,
};

const Messages: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  // Fetch messages
  const { data: messagesData, isLoading } = useQuery({
    queryKey: ['messages', { search: searchQuery, channel: channelFilter }],
    queryFn: async () => {
      const params: any = {};
      if (searchQuery) params.search = searchQuery;
      if (channelFilter !== 'all') params.channel = channelFilter;
      
      const response = await messagesApi.getMessages(params);
      return response.data;
    },
  });

  // Fetch message stats
  const { data: statsData } = useQuery({
    queryKey: ['message-stats'],
    queryFn: async () => {
      const response = await messagesApi.getStats();
      return response.data.data;
    },
  });

  const messages = messagesData?.data || [];
  const stats = statsData || { totalMessages: 0, unreadMessages: 0 };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'POSITIVE':
        return 'bg-green-100 text-green-800';
      case 'NEGATIVE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
          <p className="text-muted-foreground mt-1">
            Unified inbox for all your customer communications
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMessages}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unreadMessages}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Positive</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.bySentiment?.find((s: any) => s._id === 'POSITIVE')?.count || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs Attention</CardTitle>
            <Clock className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.bySentiment?.find((s: any) => s._id === 'NEGATIVE')?.count || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Messages List */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={channelFilter} onValueChange={setChannelFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Channel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Channels</SelectItem>
                  <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                  <SelectItem value="MESSENGER">Messenger</SelectItem>
                  <SelectItem value="EMAIL">Email</SelectItem>
                  <SelectItem value="SMS">SMS</SelectItem>
                  <SelectItem value="LIVE_CHAT">Live Chat</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-muted" />
                    <div className="flex-1">
                      <div className="h-4 bg-muted rounded w-1/4 mb-2" />
                      <div className="h-3 bg-muted rounded w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No messages found</h3>
                <p className="text-muted-foreground">
                  Messages from all channels will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {messages.map((message: Message) => {
                  const ChannelIcon = channelIcons[message.channel];
                  const StatusIcon = statusIcons[message.status];
                  
                  return (
                    <div
                      key={message.id}
                      onClick={() => setSelectedMessage(message)}
                      className={cn(
                        'flex items-start gap-4 p-4 rounded-lg cursor-pointer transition-colors',
                        selectedMessage?.id === message.id
                          ? 'bg-primary/10'
                          : 'hover:bg-accent',
                        message.status === 'UNREAD' && 'bg-blue-50'
                      )}
                    >
                      <div className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                        channelColors[message.channel]
                      )}>
                        <ChannelIcon className="h-5 w-5 text-white" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium truncate">{message.sender.name}</h4>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(message.createdAt), 'MMM d, h:mm a')}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {message.content}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {message.status}
                          </Badge>
                          <Badge className={cn('text-xs', getSentimentColor(message.sentiment))}>
                            {message.sentiment}
                          </Badge>
                          {message.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Message Detail */}
        <Card>
          <CardHeader>
            <CardTitle>Message Details</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedMessage ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>{getInitials(selectedMessage.sender.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium">{selectedMessage.sender.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedMessage.sender.email || selectedMessage.sender.phone}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm">{selectedMessage.content}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Channel</span>
                    <Badge>{selectedMessage.channel}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant="outline">{selectedMessage.status}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sentiment</span>
                    <Badge className={getSentimentColor(selectedMessage.sentiment)}>
                      {selectedMessage.sentiment}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Received</span>
                    <span>{format(new Date(selectedMessage.createdAt), 'PPp')}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button className="flex-1">Reply</Button>
                  <Button variant="outline">Assign</Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>Select a message to view details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Messages;
