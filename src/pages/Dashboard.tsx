import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import gsap from 'gsap';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  Target,
  DollarSign,
  BarChart3,
  Calendar,
  Sparkles,
  MessageSquare,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  href?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, changeLabel, icon: Icon, trend = 'neutral', href }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.fromTo(
      cardRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
    );
  }, []);

  const content = (
    <>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <div className="flex items-center gap-2 mt-1">
            <div className={`flex items-center text-xs ${trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-muted-foreground'}`}>
              {trend === 'up' ? <TrendingUp className="h-3 w-3 mr-1" /> : trend === 'down' ? <TrendingDown className="h-3 w-3 mr-1" /> : null}
              {change > 0 ? '+' : ''}{change}%
            </div>
            {changeLabel && (
              <span className="text-xs text-muted-foreground">{changeLabel}</span>
            )}
          </div>
        )}
      </CardContent>
    </>
  );

  return (
    <Card ref={cardRef} className={href ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}>
      {href ? (
        <Link to={href} className="block">
          {content}
        </Link>
      ) : (
        content
      )}
    </Card>
  );
};

const Dashboard: React.FC = () => {
  const { user, hasRole } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch dashboard data
  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await dashboardApi.getCEO();
      return response.data.data;
    },
    enabled: hasRole(['SUPER_ADMIN']),
  });

  useQuery({
    queryKey: ['marketing-dashboard'],
    queryFn: async () => {
      const response = await dashboardApi.getMarketing();
      return response.data.data;
    },
    enabled: hasRole(['MARKETING_HEAD', 'DM_EXECUTIVE']),
  });

  // Default stats for demo
  const stats = dashboardData?.metrics || {
    totalLeads: 1250,
    newLeadsThisMonth: 145,
    leadConversionRate: 24.5,
    totalCampaigns: 48,
    activeCampaigns: 12,
    totalPosts: 856,
    scheduledPosts: 23,
    totalEngagement: 45200,
    engagementRate: 4.8,
    totalSpend: 12500,
    roi: 285,
  };

  // Sample chart data
  const engagementData = [
    { name: 'Jan', engagement: 3200, reach: 45000 },
    { name: 'Feb', engagement: 4100, reach: 52000 },
    { name: 'Mar', engagement: 3800, reach: 48000 },
    { name: 'Apr', engagement: 5200, reach: 61000 },
    { name: 'May', engagement: 4800, reach: 58000 },
    { name: 'Jun', engagement: 6100, reach: 72000 },
  ];

  const platformData = [
    { name: 'Instagram', value: 45, color: '#E4405F' },
    { name: 'Facebook', value: 30, color: '#1877F2' },
    { name: 'Twitter', value: 15, color: '#1DA1F2' },
    { name: 'LinkedIn', value: 10, color: '#0A66C2' },
  ];

  // Recent activities
  const recentActivities = [
    { type: 'post', title: 'New product launch post scheduled', time: '2 hours ago', icon: FileText },
    { type: 'lead', title: 'New lead from Facebook campaign', time: '3 hours ago', icon: Users },
    { type: 'campaign', title: 'Summer Sale campaign activated', time: '5 hours ago', icon: Target },
    { type: 'message', title: 'New message from John Doe', time: '6 hours ago', icon: MessageSquare },
  ];

  // Quick actions
  const quickActions = [
    { label: 'Create Post', href: '/posts', icon: FileText, color: 'bg-blue-500' },
    { label: 'AI Studio', href: '/ai-studio', icon: Sparkles, color: 'bg-purple-500' },
    { label: 'Add Lead', href: '/leads', icon: Users, color: 'bg-green-500' },
    { label: 'View Calendar', href: '/calendar', icon: Calendar, color: 'bg-orange-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening with your marketing today.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link to="/ai-studio">
              <Sparkles className="mr-2 h-4 w-4" />
              AI Studio
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <Link
            key={action.label}
            to={action.href}
            className="group"
          >
            <div className={`${action.color} rounded-xl p-4 text-white transition-transform group-hover:scale-105`}>
              <action.icon className="h-6 w-6 mb-2" />
              <span className="font-medium">{action.label}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Leads"
          value={stats.totalLeads.toLocaleString()}
          change={12.5}
          changeLabel="vs last month"
          icon={Users}
          trend="up"
          href="/leads"
        />
        <StatCard
          title="Active Campaigns"
          value={stats.activeCampaigns}
          change={8.2}
          changeLabel="vs last month"
          icon={Target}
          trend="up"
          href="/campaigns"
        />
        <StatCard
          title="Engagement Rate"
          value={`${stats.engagementRate}%`}
          change={-2.1}
          changeLabel="vs last month"
          icon={BarChart3}
          trend="down"
          href="/analytics"
        />
        <StatCard
          title="ROI"
          value={`${stats.roi}%`}
          change={15.3}
          changeLabel="vs last month"
          icon={DollarSign}
          trend="up"
          href="/analytics"
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Engagement Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Engagement Overview</CardTitle>
            <CardDescription>Track your content performance over time</CardDescription>
          </CardHeader>
          <CardContent>
            {mounted && (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={engagementData}>
                  <defs>
                    <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="engagement"
                    stroke="hsl(var(--primary))"
                    fillOpacity={1}
                    fill="url(#colorEngagement)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Platform Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Distribution</CardTitle>
            <CardDescription>Content by platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {platformData.map((platform) => (
                <div key={platform.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{platform.name}</span>
                    <span className="text-sm text-muted-foreground">{platform.value}%</span>
                  </div>
                  <Progress value={platform.value} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates from your team</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/posts">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <activity.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Upcoming Tasks</CardTitle>
              <CardDescription>Scheduled for this week</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/calendar">View calendar</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { title: 'Product launch post', date: 'Today, 2:00 PM', platform: 'Instagram', status: 'scheduled' },
                { title: 'Weekly newsletter', date: 'Tomorrow, 9:00 AM', platform: 'Email', status: 'draft' },
                { title: 'Client meeting', date: 'Wed, 11:00 AM', platform: 'Meeting', status: 'pending' },
                { title: 'Campaign review', date: 'Fri, 3:00 PM', platform: 'Internal', status: 'pending' },
              ].map((task, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${
                      task.status === 'scheduled' ? 'bg-green-500' :
                      task.status === 'draft' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`} />
                    <div>
                      <p className="text-sm font-medium">{task.title}</p>
                      <p className="text-xs text-muted-foreground">{task.date}</p>
                    </div>
                  </div>
                  <Badge variant="outline">{task.platform}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
