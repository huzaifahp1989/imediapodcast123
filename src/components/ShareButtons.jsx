import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Share2, Copy, Check, Facebook, Twitter, MessageCircle } from "lucide-react";
import { toast } from "sonner";

export default function ShareButtons({ 
  title, 
  description, 
  contentType = "audio", // "audio" or "video"
  contentId,
  compact = false 
}) {
  const [copied, setCopied] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  // Create the share URL
  const shareUrl = `${window.location.origin}${window.location.pathname}?id=${contentId}`;
  
  // Encode for URL parameters
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description || `Check out this ${contentType}: ${title}`);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: description || `Check out this ${contentType}`,
          url: shareUrl,
        });
        toast.success("Shared successfully!");
        setShowDialog(false);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const shareToFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
    toast.success("Opening Facebook...");
  };

  const shareToTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
    toast.success("Opening Twitter...");
  };

  const shareToWhatsApp = () => {
    const whatsappUrl = `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`;
    window.open(whatsappUrl, '_blank');
    toast.success("Opening WhatsApp...");
  };

  if (compact) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="hover:bg-emerald-100 text-emerald-600 rounded-full"
          >
            <Share2 className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-white border-gray-300" align="end">
          <DropdownMenuItem onClick={handleNativeShare} className="cursor-pointer text-gray-900 hover:bg-emerald-50">
            <Share2 className="w-4 h-4 mr-2 text-emerald-600" />
            Share...
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer text-gray-900 hover:bg-emerald-50">
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2 text-green-600" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2 text-emerald-600" />
                Copy Link
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={shareToFacebook} className="cursor-pointer text-gray-900 hover:bg-emerald-50">
            <Facebook className="w-4 h-4 mr-2 text-blue-600" />
            Facebook
          </DropdownMenuItem>
          <DropdownMenuItem onClick={shareToTwitter} className="cursor-pointer text-gray-900 hover:bg-emerald-50">
            <Twitter className="w-4 h-4 mr-2 text-sky-500" />
            Twitter
          </DropdownMenuItem>
          <DropdownMenuItem onClick={shareToWhatsApp} className="cursor-pointer text-gray-900 hover:bg-emerald-50">
            <MessageCircle className="w-4 h-4 mr-2 text-green-600" />
            WhatsApp
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="border-emerald-600 text-emerald-700 hover:bg-emerald-50"
        >
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-white border-gray-300 text-gray-900 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share this {contentType}</DialogTitle>
          <DialogDescription className="text-gray-700">
            Share "{title}" with your friends and family
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Native Share Button (for mobile) */}
          {navigator.share && (
            <Button
              onClick={handleNativeShare}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share via...
            </Button>
          )}

          {/* Copy Link */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900"
            />
            <Button
              onClick={handleCopyLink}
              variant="outline"
              className={copied ? "border-green-500 text-green-700" : "border-emerald-600 text-emerald-700"}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </>
              )}
            </Button>
          </div>

          {/* Social Media Buttons */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Share on social media:</p>
            <div className="grid grid-cols-3 gap-2">
              <Button
                onClick={shareToFacebook}
                variant="outline"
                className="border-blue-200 hover:bg-blue-50"
              >
                <Facebook className="w-5 h-5 text-blue-600" />
                <span className="ml-2 hidden sm:inline">Facebook</span>
              </Button>
              
              <Button
                onClick={shareToTwitter}
                variant="outline"
                className="border-sky-200 hover:bg-sky-50"
              >
                <Twitter className="w-5 h-5 text-sky-500" />
                <span className="ml-2 hidden sm:inline">Twitter</span>
              </Button>
              
              <Button
                onClick={shareToWhatsApp}
                variant="outline"
                className="border-green-200 hover:bg-green-50"
              >
                <MessageCircle className="w-5 h-5 text-green-600" />
                <span className="ml-2 hidden sm:inline">WhatsApp</span>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}