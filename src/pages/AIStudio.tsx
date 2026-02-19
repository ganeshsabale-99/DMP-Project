import React, { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { aiApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Sparkles,
  Copy,
  Check,
  Wand2,
  BarChart3,
  Clock,
  Hash,
  Lightbulb,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import gsap from 'gsap';
import type { PostPlatform } from '@/types';

const platforms: { value: PostPlatform; label: string; icon: string }[] = [
  { value: 'INSTAGRAM', label: 'Instagram', icon: '📸' },
  { value: 'FACEBOOK', label: 'Facebook', icon: '👥' },
  { value: 'TWITTER', label: 'Twitter', icon: '🐦' },
  { value: 'LINKEDIN', label: 'LinkedIn', icon: '💼' },
  { value: 'YOUTUBE', label: 'YouTube', icon: '🎥' },
  { value: 'TIKTOK', label: 'TikTok', icon: '🎵' },
];

const brandVoices = [
  { value: 'professional', label: 'Professional', description: 'Authoritative and trustworthy' },
  { value: 'casual', label: 'Casual', description: 'Friendly and conversational' },
  { value: 'playful', label: 'Playful', description: 'Fun and energetic' },
  { value: 'inspirational', label: 'Inspirational', description: 'Motivational and uplifting' },
  { value: 'educational', label: 'Educational', description: 'Informative and clear' },
  { value: 'luxury', label: 'Luxury', description: 'Sophisticated and elegant' },
];

const AIStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState('content');
  const [prompt, setPrompt] = useState('');
  const [platform, setPlatform] = useState<PostPlatform>('INSTAGRAM');
  const [brandVoice, setBrandVoice] = useState('professional');
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [analyzedContent, setAnalyzedContent] = useState<any>(null);
  const [bestTimes, setBestTimes] = useState<any>(null);

  const resultRef = useRef<HTMLDivElement>(null);

  // Generate content mutation
  const generateMutation = useMutation({
    mutationFn: aiApi.generateContent,
    onSuccess: (response: any) => {
      setGeneratedContent(response.data.data);
      toast.success('Content generated successfully!');
      
      // Animate results
      gsap.fromTo(
        resultRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
      );
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to generate content');
    },
  });

  // Analyze content mutation
  const analyzeMutation = useMutation({
    mutationFn: aiApi.analyzeContent,
    onSuccess: (response: any) => {
      setAnalyzedContent(response.data.data);
      toast.success('Content analyzed!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to analyze content');
    },
  });

  // Get best times mutation
  const bestTimesMutation = useMutation({
    mutationFn: aiApi.getBestTimes,
    onSuccess: (response: any) => {
      setBestTimes(response.data.data);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to get best times');
    },
  });

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }
    generateMutation.mutate({
      prompt,
      platform,
      brandVoice,
      includeHashtags: true,
      includeEmojis: true,
    });
  };

  const handleAnalyze = () => {
    if (!prompt.trim()) {
      toast.error('Please enter content to analyze');
      return;
    }
    analyzeMutation.mutate({ content: prompt, platform });
  };

  const handleGetBestTimes = () => {
    bestTimesMutation.mutate({ platform });
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            AI Studio
          </h1>
          <p className="text-muted-foreground mt-1">
            Generate content, analyze performance, and optimize your strategy with AI
          </p>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="content">
            <Wand2 className="mr-2 h-4 w-4" />
            Generate
          </TabsTrigger>
          <TabsTrigger value="analyze">
            <BarChart3 className="mr-2 h-4 w-4" />
            Analyze
          </TabsTrigger>
          <TabsTrigger value="optimize">
            <Clock className="mr-2 h-4 w-4" />
            Optimize
          </TabsTrigger>
        </TabsList>

        {/* Generate Content Tab */}
        <TabsContent value="content" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Input Section */}
            <Card>
              <CardHeader>
                <CardTitle>Generate Content</CardTitle>
                <CardDescription>
                  Let AI create engaging content for your social media
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="prompt">What would you like to create?</Label>
                  <Textarea
                    id="prompt"
                    placeholder="e.g., A post about our new product launch featuring eco-friendly packaging..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Platform</Label>
                    <Select value={platform} onValueChange={(v) => setPlatform(v as PostPlatform)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {platforms.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            <span className="mr-2">{p.icon}</span>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Brand Voice</Label>
                    <Select value={brandVoice} onValueChange={setBrandVoice}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {brandVoices.map((v) => (
                          <SelectItem key={v.value} value={v.value}>
                            {v.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={generateMutation.isPending}
                  className="w-full"
                >
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Content
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Results Section */}
            {generatedContent && (
              <div ref={resultRef} className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Generated Variations</CardTitle>
                    <CardDescription>
                      Choose the best variation for your post
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {generatedContent.variations.map((variation: string, index: number) => (
                      <div
                        key={index}
                        className="p-4 border rounded-lg hover:border-primary transition-colors group relative"
                      >
                        <p className="text-sm pr-8">{variation}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => copyToClipboard(variation, index)}
                        >
                          {copiedIndex === index ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Engagement Prediction */}
                <Card>
                  <CardHeader>
                    <CardTitle>Engagement Prediction</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <div className="text-2xl font-bold text-primary">
                          {generatedContent.engagement.predictedLikes.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">Predicted Likes</div>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <div className="text-2xl font-bold text-primary">
                          {generatedContent.engagement.engagementRate}
                        </div>
                        <div className="text-xs text-muted-foreground">Engagement Rate</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Suggested Hashtags */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      Suggested Hashtags
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {generatedContent.suggestedHashtags.map((tag: string) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Analyze Tab */}
        <TabsContent value="analyze" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Content Analyzer</CardTitle>
              <CardDescription>
                Analyze your content for SEO, readability, and engagement potential
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="analyze-content">Paste your content</Label>
                <Textarea
                  id="analyze-content"
                  placeholder="Paste your content here to analyze..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={6}
                />
              </div>
              <Button
                onClick={handleAnalyze}
                disabled={analyzeMutation.isPending}
              >
                {analyzeMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Analyze Content
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {analyzedContent && (
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="text-4xl font-bold text-primary">
                    {analyzedContent.seoScore}
                  </CardTitle>
                  <CardDescription>SEO Score</CardDescription>
                </CardHeader>
                <CardContent>
                  <Progress value={analyzedContent.seoScore} className="h-2" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="text-4xl font-bold text-primary">
                    {analyzedContent.readabilityScore}
                  </CardTitle>
                  <CardDescription>Readability Score</CardDescription>
                </CardHeader>
                <CardContent>
                  <Progress value={analyzedContent.readabilityScore} className="h-2" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="text-4xl font-bold text-primary">
                    {analyzedContent.engagementScore}
                  </CardTitle>
                  <CardDescription>Engagement Score</CardDescription>
                </CardHeader>
                <CardContent>
                  <Progress value={analyzedContent.engagementScore} className="h-2" />
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Optimize Tab */}
        <TabsContent value="optimize" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Best Posting Times</CardTitle>
              <CardDescription>
                Discover the optimal times to post for maximum engagement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Select Platform</Label>
                <Select value={platform} onValueChange={(v) => setPlatform(v as PostPlatform)}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {platforms.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        <span className="mr-2">{p.icon}</span>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleGetBestTimes}
                disabled={bestTimesMutation.isPending}
              >
                {bestTimesMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Clock className="mr-2 h-4 w-4" />
                    Get Best Times
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {bestTimes && (
            <Card>
              <CardHeader>
                <CardTitle>Optimal Posting Schedule</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium mb-2">Best Days</h4>
                  <div className="flex flex-wrap gap-2">
                    {bestTimes.bestDays.map((day: string) => (
                      <Badge key={day} variant="secondary" className="text-sm">
                        {day}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Best Hours</h4>
                  <div className="flex flex-wrap gap-2">
                    {bestTimes.bestHours.map((hour: string) => (
                      <Badge key={hour} variant="outline" className="text-sm">
                        {hour}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="p-4 bg-primary/5 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-primary" />
                    <span className="font-medium">{bestTimes.engagementPrediction}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIStudio;
