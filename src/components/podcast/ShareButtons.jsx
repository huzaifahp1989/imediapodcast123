import React from "react";
import { Button } from "@/components/ui/button";
import { Share2, MessageCircle, Twitter, Facebook, Instagram, Link2 } from "lucide-react";
import { toast } from "sonner";

export default function ShareButtons({ episode, compact = false }) {
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = `Check out this podcast episode: ${episode.title}`;
  
  const shareToWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
    window.open(url, '_blank');
  };

  const shareToTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank');
  };

  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank');
  };

  const shareToInstagram = () => {
    // Instagram doesn't support direct link sharing, copy link instead
    copyToClipboard();
    toast.info("Link copied! Open Instagram and paste in your story");
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied to clipboard!");
  };

  const nativeShare = () => {
    if (navigator.share) {
      navigator.share({
        title: episode.title,
        text: shareText,
        url: shareUrl,
      }).catch(() => {});
    } else {
      copyToClipboard();
    }
  };

  if (compact) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={nativeShare}
        className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20"
      >
        <Share2 className="w-4 h-4 mr-2" />
        Share
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={shareToWhatsApp}
        className="border-green-500/50 text-green-400 hover:bg-green-500/20"
      >
        <MessageCircle className="w-4 h-4 mr-2" />
        WhatsApp
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={shareToTwitter}
        className="border-blue-500/50 text-blue-400 hover:bg-blue-500/20"
      >
        <Twitter className="w-4 h-4 mr-2" />
        Twitter
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={shareToFacebook}
        className="border-blue-600/50 text-blue-400 hover:bg-blue-600/20"
      >
        <Facebook className="w-4 h-4 mr-2" />
        Facebook
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={shareToInstagram}
        className="border-pink-500/50 text-pink-400 hover:bg-pink-500/20"
      >
        <Instagram className="w-4 h-4 mr-2" />
        Instagram
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={copyToClipboard}
        className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20"
      >
        <Link2 className="w-4 h-4 mr-2" />
        Copy Link
      </Button>
    </div>
  );
}