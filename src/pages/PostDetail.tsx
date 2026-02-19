import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { postsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Send,
  Heart,
  MessageCircle,
  Share2,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-500',
  SCHEDULED: 'bg-blue-500',
  PENDING_APPROVAL: 'bg-yellow-500',
  PUBLISHED: 'bg-green-500',
  FAILED: 'bg-red-500',
  ARCHIVED: 'bg-purple-500',
};

const PostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Fetch post
  const { data: postData, isLoading, refetch } = useQuery({
    queryKey: ['post', id],
    queryFn: async () => {
      const response = await postsApi.getPost(id!);
      return response.data;
    },
    enabled: !!id,
  });

  const post = postData?.data;

  // Publish mutation
  const publishMutation = useMutation({
    mutationFn: () => postsApi.publishPost(id!),
    onSuccess: () => {
      toast.success('Post published successfully!');
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to publish post');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => postsApi.deletePost(id!),
    onSuccess: () => {
      toast.success('Post deleted successfully!');
      navigate('/posts');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete post');
    },
  });

  const handleDelete = () => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    deleteMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Post not found</h2>
        <p className="text-muted-foreground mb-4">The post you're looking for doesn't exist.</p>
        <Button asChild>
          <Link to="/posts">Back to Posts</Link>
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
            <Link to="/posts">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{post.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={`${statusColors[post.status]} text-white`}>
                {post.status.replace('_', ' ')}
              </Badge>
              <span className="text-sm text-muted-foreground">{post.platform}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          {post.status === 'SCHEDULED' && (
            <Button onClick={() => publishMutation.mutate()}>
              <Send className="mr-2 h-4 w-4" />
              Publish Now
            </Button>
          )}
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{post.content}</p>
              
              {post.hashtags?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {post.hashtags.map((tag: string) => (
                    <Badge key={tag} variant="secondary">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Media */}
          {post.mediaUrls?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Media</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {post.mediaUrls.map((url: string, index: number) => (
                    <div key={index} className="aspect-square rounded-lg bg-muted flex items-center justify-center">
                      <img src={url} alt={`Media ${index + 1}`} className="w-full h-full object-cover rounded-lg" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Engagement */}
          {post.engagement && (
            <Card>
              <CardHeader>
                <CardTitle>Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <Heart className="mx-auto h-6 w-6 text-red-500 mb-2" />
                    <div className="text-2xl font-bold">{post.engagement.likes}</div>
                    <div className="text-xs text-muted-foreground">Likes</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <MessageCircle className="mx-auto h-6 w-6 text-blue-500 mb-2" />
                    <div className="text-2xl font-bold">{post.engagement.comments}</div>
                    <div className="text-xs text-muted-foreground">Comments</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <Share2 className="mx-auto h-6 w-6 text-green-500 mb-2" />
                    <div className="text-2xl font-bold">{post.engagement.shares}</div>
                    <div className="text-xs text-muted-foreground">Shares</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <Eye className="mx-auto h-6 w-6 text-purple-500 mb-2" />
                    <div className="text-2xl font-bold">{post.engagement.views}</div>
                    <div className="text-xs text-muted-foreground">Views</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Platform</span>
                <Badge variant="outline">{post.platform}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge className={`${statusColors[post.status]} text-white`}>
                  {post.status.replace('_', ' ')}
                </Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Created by</span>
                <span className="font-medium">{post.createdBy?.fullName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Created at</span>
                <span>{format(new Date(post.createdAt), 'PPp')}</span>
              </div>
              {post.scheduledAt && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Scheduled for</span>
                  <span>{format(new Date(post.scheduledAt), 'PPp')}</span>
                </div>
              )}
              {post.publishedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Published at</span>
                  <span>{format(new Date(post.publishedAt), 'PPp')}</span>
                </div>
              )}
              {post.approvedBy && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Approved by</span>
                  <span className="font-medium">{post.approvedBy.fullName}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SEO Score */}
          {post.metadata && (
            <Card>
              <CardHeader>
                <CardTitle>Content Quality</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">SEO Score</span>
                    <span className="text-sm font-medium">{post.metadata.seoScore}/100</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${post.metadata.seoScore}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">Readability</span>
                    <span className="text-sm font-medium">{post.metadata.readabilityScore}/100</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${post.metadata.readabilityScore}%` }}
                    />
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

export default PostDetail;
