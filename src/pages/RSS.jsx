import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Rss, Copy, CheckCircle, Code } from "lucide-react";
import { toast } from "sonner";

export default function RSS() {
  const [copied, setCopied] = useState(false);
  const [rssFeed, setRssFeed] = useState("");

  const { data: podcasts, isLoading } = useQuery({
    queryKey: ['podcasts'],
    queryFn: () => base44.entities.Podcast.filter({ status: 'published' }, '-published_date'),
    initialData: [],
  });

  useEffect(() => {
    if (podcasts.length > 0) {
      generateRSS();
    }
  }, [podcasts]);

  const generateRSS = () => {
    const siteUrl = window.location.origin;
    const feedUrl = `${siteUrl}/rss.xml`;
    
    const rssItems = podcasts.map(episode => {
      const pubDate = episode.published_date ? new Date(episode.published_date).toUTCString() : new Date().toUTCString();
      const duration = episode.duration || 0;
      const hours = Math.floor(duration / 3600);
      const minutes = Math.floor((duration % 3600) / 60);
      const seconds = duration % 60;
      const durationFormatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      
      return `    <item>
      <title>${escapeXml(episode.title || 'Untitled Episode')}</title>
      <description><![CDATA[${episode.description || ''}]]></description>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="false">${episode.id}</guid>
      <enclosure url="${episode.audio_url}" length="${episode.file_size || 0}" type="audio/mpeg"/>
      <itunes:duration>${durationFormatted}</itunes:duration>
      <itunes:explicit>clean</itunes:explicit>
      <itunes:episodeType>${episode.episode_number ? 'full' : 'trailer'}</itunes:episodeType>
      ${episode.episode_number ? `<itunes:episode>${episode.episode_number}</itunes:episode>` : ''}
      ${episode.season ? `<itunes:season>${episode.season}</itunes:season>` : ''}
      ${episode.cover_art_url ? `<itunes:image href="${episode.cover_art_url}"/>` : ''}
    </item>`;
    }).join('\n');

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
     xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
     xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>PodcastHub Feed</title>
    <link>${siteUrl}</link>
    <language>en-us</language>
    <description>Your podcast feed from PodcastHub</description>
    <itunes:author>PodcastHub</itunes:author>
    <itunes:explicit>clean</itunes:explicit>
    <itunes:type>episodic</itunes:type>
    <itunes:category text="Technology"/>
${rssItems}
  </channel>
</rss>`;

    setRssFeed(rss);
  };

  const escapeXml = (str) => {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(rssFeed);
    setCopied(true);
    toast.success("RSS feed copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadRSS = () => {
    const blob = new Blob([rssFeed], { type: 'application/xml' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'podcast-feed.xml';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    toast.success("RSS feed downloaded!");
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/50">
              <Rss className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white glow-text">Podcast RSS Feed</h1>
          <p className="text-purple-300 text-lg">iTunes & Apple Podcasts compliant feed</p>
        </div>

        <Card className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 border-purple-500/30 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <span>RSS Feed Generator</span>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                {podcasts.length} Episodes
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                <p className="text-purple-300">Generating RSS feed...</p>
              </div>
            ) : podcasts.length === 0 ? (
              <div className="text-center py-12">
                <Rss className="w-16 h-16 mx-auto mb-4 text-purple-400 opacity-50" />
                <p className="text-purple-300">No published episodes yet</p>
              </div>
            ) : (
              <>
                <div>
                  <Label className="text-purple-300 mb-2 block">Feed URL</Label>
                  <div className="flex gap-2">
                    <Input
                      value={`${window.location.origin}/rss.xml`}
                      readOnly
                      className="bg-slate-900/50 border-purple-500/30 text-white font-mono text-sm"
                    />
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/rss.xml`);
                        toast.success("Feed URL copied!");
                      }}
                      className="bg-purple-500 hover:bg-purple-600"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-purple-400 mt-2">
                    Use this URL to submit to podcast directories like Apple Podcasts, Spotify, etc.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-purple-300">RSS Feed XML</Label>
                    <div className="flex gap-2">
                      <Button
                        onClick={copyToClipboard}
                        size="sm"
                        className="bg-purple-500 hover:bg-purple-600"
                      >
                        {copied ? <CheckCircle className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                        {copied ? "Copied!" : "Copy"}
                      </Button>
                      <Button
                        onClick={downloadRSS}
                        size="sm"
                        variant="outline"
                        className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20"
                      >
                        <Code className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                  <div className="bg-slate-950/80 rounded-lg p-4 border border-purple-500/20 max-h-96 overflow-auto">
                    <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap break-all">
                      {rssFeed}
                    </pre>
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <h3 className="text-blue-300 font-semibold mb-2 flex items-center gap-2">
                    <Rss className="w-4 h-4" />
                    Compliance Features
                  </h3>
                  <ul className="text-sm text-blue-200 space-y-1">
                    <li>✅ iTunes/Apple Podcasts compliant</li>
                    <li>✅ Episode numbers and seasons</li>
                    <li>✅ Duration tags</li>
                    <li>✅ Explicit flag set to "clean"</li>
                    <li>✅ MP3 enclosures with file size</li>
                    <li>✅ Episode artwork support</li>
                    <li>✅ GUID for each episode</li>
                  </ul>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <h3 className="text-yellow-300 font-semibold mb-2">📝 Next Steps</h3>
                  <ol className="text-sm text-yellow-200 space-y-2">
                    <li>1. Host the RSS XML file at <code className="bg-slate-900 px-1 rounded">/rss.xml</code> on your domain</li>
                    <li>2. Submit the feed URL to podcast directories</li>
                    <li>3. Wait for approval (usually 24-48 hours)</li>
                    <li>4. Your podcast will be available on major platforms!</li>
                  </ol>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}