import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { leadsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  User,
  Plus,
  MessageSquare,
  PhoneCall,
  Mail as MailIcon,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  NEW: 'bg-blue-500',
  QUALIFIED: 'bg-purple-500',
  CONTACTED: 'bg-yellow-500',
  ENGAGED: 'bg-orange-500',
  OPPORTUNITY: 'bg-pink-500',
  CONVERTED: 'bg-green-500',
  LOST: 'bg-gray-500',
};

const LeadDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [newActivity, setNewActivity] = useState({ type: 'NOTE', description: '' });
  const [newScore, setNewScore] = useState<number>(0);

  // Fetch lead
  const { data: leadData, isLoading, refetch } = useQuery({
    queryKey: ['lead', id],
    queryFn: async () => {
      const response = await leadsApi.getLead(id!);
      return response.data;
    },
    enabled: !!id,
  });

  const lead = leadData?.data;

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => leadsApi.updateStatus(id!, status),
    onSuccess: () => {
      toast.success('Status updated!');
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
    },
  });

  // Update score mutation
  const updateScoreMutation = useMutation({
    mutationFn: (score: number) => leadsApi.updateScore(id!, score),
    onSuccess: () => {
      toast.success('Score updated!');
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update score');
    },
  });

  // Add activity mutation
  const addActivityMutation = useMutation({
    mutationFn: (data: any) => leadsApi.addActivity(id!, data),
    onSuccess: () => {
      toast.success('Activity added!');
      setNewActivity({ type: 'NOTE', description: '' });
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add activity');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => leadsApi.deleteLead(id!),
    onSuccess: () => {
      toast.success('Lead deleted!');
      navigate('/leads');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete lead');
    },
  });

  const handleAddActivity = () => {
    if (!newActivity.description.trim()) return;
    addActivityMutation.mutate(newActivity);
  };

  const handleDelete = () => {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    deleteMutation.mutate();
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'CALL':
        return PhoneCall;
      case 'EMAIL':
        return MailIcon;
      case 'MEETING':
        return Calendar;
      case 'TASK':
        return CheckCircle;
      default:
        return MessageSquare;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Lead not found</h2>
        <p className="text-muted-foreground mb-4">The lead you're looking for doesn't exist.</p>
        <Button asChild>
          <Link to="/leads">Back to Leads</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link to="/leads">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{lead.fullName}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={`${statusColors[lead.status]} text-white`}>
                {lead.status}
              </Badge>
              <span className="text-sm text-muted-foreground">{lead.source}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="activity">
            <TabsList>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>

            <TabsContent value="activity" className="space-y-4">
              {/* Add Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Add Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Select
                      value={newActivity.type}
                      onValueChange={(v) => setNewActivity({ ...newActivity, type: v })}
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NOTE">Note</SelectItem>
                        <SelectItem value="CALL">Call</SelectItem>
                        <SelectItem value="EMAIL">Email</SelectItem>
                        <SelectItem value="MEETING">Meeting</SelectItem>
                        <SelectItem value="TASK">Task</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Textarea
                    placeholder="Add a note or activity..."
                    value={newActivity.description}
                    onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                  />
                  <Button onClick={handleAddActivity}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Activity
                  </Button>
                </CardContent>
              </Card>

              {/* Activity Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle>Activity Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {lead.activities?.map((activity: any, index: number) => {
                      const Icon = getActivityIcon(activity.type);
                      return (
                        <div key={index} className="flex gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{activity.type}</Badge>
                              <span className="text-sm text-muted-foreground">
                                {format(new Date(activity.createdAt), 'PPp')}
                              </span>
                            </div>
                            <p className="mt-1">{activity.description}</p>
                            <p className="text-sm text-muted-foreground">
                              by {activity.createdBy?.fullName}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    {(!lead.activities || lead.activities.length === 0) && (
                      <p className="text-center text-muted-foreground py-4">
                        No activities yet
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notes">
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{lead.notes || 'No notes added yet.'}</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="details">
              <Card>
                <CardHeader>
                  <CardTitle>Lead Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{lead.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{lead.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Company</p>
                      <p className="font-medium">{lead.company || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Job Title</p>
                      <p className="font-medium">{lead.jobTitle || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Source</p>
                      <p className="font-medium">{lead.source}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Created</p>
                      <p className="font-medium">{format(new Date(lead.createdAt), 'PP')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Score Card */}
          <Card>
            <CardHeader>
              <CardTitle>Lead Score</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-5xl font-bold text-primary">{lead.score}</div>
                <div className="text-sm text-muted-foreground">out of 100</div>
              </div>
              <Progress value={lead.score} className="h-3" />
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="New score"
                  onChange={(e) => setNewScore(Number(e.target.value))}
                />
                <Button onClick={() => updateScoreMutation.mutate(newScore)}>
                  Update
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={lead.status}
                onValueChange={(v) => updateStatusMutation.mutate(v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NEW">New</SelectItem>
                  <SelectItem value="QUALIFIED">Qualified</SelectItem>
                  <SelectItem value="CONTACTED">Contacted</SelectItem>
                  <SelectItem value="ENGAGED">Engaged</SelectItem>
                  <SelectItem value="OPPORTUNITY">Opportunity</SelectItem>
                  <SelectItem value="CONVERTED">Converted</SelectItem>
                  <SelectItem value="LOST">Lost</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Tags */}
          {lead.tags?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {lead.tags.map((tag: string) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Assigned To */}
          {lead.assignedTo && (
            <Card>
              <CardHeader>
                <CardTitle>Assigned To</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{lead.assignedTo.fullName}</p>
                    <p className="text-sm text-muted-foreground">{lead.assignedTo.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeadDetail;
