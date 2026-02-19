import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { campaignsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Play,
  Pause,
  CheckCircle,
  Eye,
  MousePointer,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-500',
  ACTIVE: 'bg-green-500',
  PAUSED: 'bg-yellow-500',
  COMPLETED: 'bg-blue-500',
};

const CampaignDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Fetch campaign
  const { data: campaignData, isLoading, refetch } = useQuery({
    queryKey: ['campaign', id],
    queryFn: async () => {
      const response = await campaignsApi.getCampaign(id!);
      return response.data;
    },
    enabled: !!id,
  });

  const campaign = campaignData?.data;

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => campaignsApi.updateStatus(id!, status),
    onSuccess: () => {
      toast.success('Status updated!');
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => campaignsApi.deleteCampaign(id!),
    onSuccess: () => {
      toast.success('Campaign deleted!');
      navigate('/campaigns');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete campaign');
    },
  });

  const handleDelete = () => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;
    deleteMutation.mutate();
  };

  const getBudgetUtilization = () => {
    if (!campaign?.budget) return 0;
    return Math.min((campaign.spent / campaign.budget) * 100, 100);
  };

  // Sample performance data
  const performanceData = [
    { name: 'Week 1', impressions: 12000, clicks: 800, conversions: 40 },
    { name: 'Week 2', impressions: 15000, clicks: 1000, conversions: 55 },
    { name: 'Week 3', impressions: 18000, clicks: 1200, conversions: 70 },
    { name: 'Week 4', impressions: 22000, clicks: 1500, conversions: 90 },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Campaign not found</h2>
        <p className="text-muted-foreground mb-4">The campaign you're looking for doesn't exist.</p>
        <Button asChild>
          <Link to="/campaigns">Back to Campaigns</Link>
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
            <Link to="/campaigns">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{campaign.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={`${statusColors[campaign.status]} text-white`}>
                {campaign.status}
              </Badge>
              <Badge variant="outline">{campaign.type}</Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {campaign.status === 'ACTIVE' ? (
            <Button variant="outline" onClick={() => updateStatusMutation.mutate('PAUSED')}>
              <Pause className="mr-2 h-4 w-4" />
              Pause
            </Button>
          ) : campaign.status === 'PAUSED' ? (
            <Button onClick={() => updateStatusMutation.mutate('ACTIVE')}>
              <Play className="mr-2 h-4 w-4" />
              Resume
            </Button>
          ) : null}
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

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impressions</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaign.performanceMetrics?.impressions?.toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clicks</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaign.performanceMetrics?.clicks?.toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaign.performanceMetrics?.conversions?.toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CTR</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaign.performanceMetrics?.ctr?.toFixed(2) || 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="performance">
            <TabsList>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="leads">Leads</TabsTrigger>
            </TabsList>

            <TabsContent value="performance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Performance</CardTitle>
                  <CardDescription>Impressions, clicks, and conversions over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="impressions" stroke="#8884d8" />
                      <Line type="monotone" dataKey="clicks" stroke="#82ca9d" />
                      <Line type="monotone" dataKey="conversions" stroke="#ffc658" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="posts">
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Posts</CardTitle>
                </CardHeader>
                <CardContent>
                  {campaign.posts?.length > 0 ? (
                    <div className="space-y-3">
                      {campaign.posts.map((post: any) => (
                        <div key={post.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{post.title}</p>
                            <p className="text-sm text-muted-foreground">{post.platform}</p>
                          </div>
                          <Badge>{post.status}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-4">No posts in this campaign</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="leads">
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Leads</CardTitle>
                </CardHeader>
                <CardContent>
                  {campaign.leads?.length > 0 ? (
                    <div className="space-y-3">
                      {campaign.leads.map((lead: any) => (
                        <div key={lead.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{lead.fullName}</p>
                            <p className="text-sm text-muted-foreground">{lead.email}</p>
                          </div>
                          <Badge>{lead.status}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-4">No leads from this campaign</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Budget Card */}
          <Card>
            <CardHeader>
              <CardTitle>Budget</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Budget</span>
                <span className="font-medium">${campaign.budget?.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Spent</span>
                <span className="font-medium">${campaign.spent?.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Remaining</span>
                <span className="font-medium">
                  ${((campaign.budget || 0) - (campaign.spent || 0)).toLocaleString()}
                </span>
              </div>
              <Progress value={getBudgetUtilization()} className="h-3" />
              <p className="text-sm text-muted-foreground text-center">
                {getBudgetUtilization().toFixed(1)}% utilized
              </p>
            </CardContent>
          </Card>

          {/* Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Campaign Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Type</span>
                <Badge variant="outline">{campaign.type}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge className={`${statusColors[campaign.status]} text-white`}>
                  {campaign.status}
                </Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Start Date</span>
                <span>{format(new Date(campaign.startDate), 'PP')}</span>
              </div>
              {campaign.endDate && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">End Date</span>
                  <span>{format(new Date(campaign.endDate), 'PP')}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{format(new Date(campaign.createdAt), 'PP')}</span>
              </div>
            </CardContent>
          </Card>

          {/* Target Audience */}
          {campaign.targetAudience && (
            <Card>
              <CardHeader>
                <CardTitle>Target Audience</CardTitle>
              </CardHeader>
              <CardContent>
                {campaign.targetAudience.demographics?.ageRange && (
                  <div className="mb-2">
                    <span className="text-sm text-muted-foreground">Age Range: </span>
                    <span className="text-sm">
                      {campaign.targetAudience.demographics.ageRange.min} - {campaign.targetAudience.demographics.ageRange.max}
                    </span>
                  </div>
                )}
                {campaign.targetAudience.demographics?.locations && (
                  <div className="mb-2">
                    <span className="text-sm text-muted-foreground">Locations: </span>
                    <span className="text-sm">
                      {campaign.targetAudience.demographics.locations.join(', ')}
                    </span>
                  </div>
                )}
                {campaign.targetAudience.interests && (
                  <div>
                    <span className="text-sm text-muted-foreground">Interests: </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {campaign.targetAudience.interests.map((interest: string) => (
                        <Badge key={interest} variant="secondary" className="text-xs">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampaignDetail;
