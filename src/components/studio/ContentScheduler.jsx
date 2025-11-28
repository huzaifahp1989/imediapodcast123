import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Video,
  Radio,
  Trash2,
  Edit,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function ContentScheduler({ scheduledItems = [], onSchedule, onDelete, onEdit }) {
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "video", // video, audio, live
    category: "Lectures",
    scheduledDate: new Date(),
    scheduledTime: "12:00",
  });

  const categories = [
    "Quran", "Hadith", "Lectures", "Nasheeds", "Tafsir", 
    "Seerah", "Fiqh", "Spirituality", "General"
  ];

  const handleSubmit = async () => {
    if (!form.title || !form.scheduledDate) {
      toast.error("Please fill in required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const scheduledDateTime = new Date(form.scheduledDate);
      const [hours, minutes] = form.scheduledTime.split(':');
      scheduledDateTime.setHours(parseInt(hours), parseInt(minutes));

      const scheduleData = {
        ...form,
        scheduled_date: scheduledDateTime.toISOString(),
        status: "scheduled",
      };

      if (editingItem) {
        await onEdit?.(editingItem.id, scheduleData);
        toast.success("Schedule updated!");
      } else {
        await onSchedule?.(scheduleData);
        toast.success("Content scheduled!");
      }

      setShowScheduleDialog(false);
      setEditingItem(null);
      setForm({
        title: "",
        description: "",
        type: "video",
        category: "Lectures",
        scheduledDate: new Date(),
        scheduledTime: "12:00",
      });
    } catch (error) {
      toast.error("Failed to schedule: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (item) => {
    const date = new Date(item.scheduled_date);
    setForm({
      title: item.title,
      description: item.description || "",
      type: item.type,
      category: item.category || "Lectures",
      scheduledDate: date,
      scheduledTime: format(date, "HH:mm"),
    });
    setEditingItem(item);
    setShowScheduleDialog(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this scheduled item?")) {
      await onDelete?.(id);
      toast.success("Scheduled item deleted");
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "live": return <Radio className="w-4 h-4 text-red-400" />;
      case "audio": return <Video className="w-4 h-4 text-green-400" />;
      default: return <Video className="w-4 h-4 text-blue-400" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "live": return "bg-red-500/20 text-red-300 border-red-500/30";
      case "audio": return "bg-green-500/20 text-green-300 border-green-500/30";
      default: return "bg-blue-500/20 text-blue-300 border-blue-500/30";
    }
  };

  // Sort by scheduled date
  const sortedItems = [...scheduledItems].sort(
    (a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date)
  );

  const upcomingItems = sortedItems.filter(item => new Date(item.scheduled_date) > new Date());
  const pastItems = sortedItems.filter(item => new Date(item.scheduled_date) <= new Date());

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-purple-400" />
          Content Schedule
        </h3>
        <Button
          onClick={() => setShowScheduleDialog(true)}
          className="bg-purple-600 hover:bg-purple-700 text-sm"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-1" />
          Schedule
        </Button>
      </div>

      {/* Upcoming Content */}
      <Card className="bg-slate-900/50 border-purple-500/30">
        <CardHeader className="p-3 md:p-4 pb-2">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-yellow-400" />
            Upcoming ({upcomingItems.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 md:p-4 pt-0">
          {upcomingItems.length > 0 ? (
            <div className="space-y-2">
              {upcomingItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                  {getTypeIcon(item.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{item.title}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <CalendarIcon className="w-3 h-3" />
                      {format(new Date(item.scheduled_date), "MMM d, yyyy 'at' h:mm a")}
                    </div>
                  </div>
                  <Badge className={getTypeColor(item.type)}>
                    {item.type}
                  </Badge>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEdit(item)}
                      className="h-7 w-7 text-gray-400 hover:text-white"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(item.id)}
                      className="h-7 w-7 text-gray-400 hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center py-4">No upcoming scheduled content</p>
          )}
        </CardContent>
      </Card>

      {/* Schedule Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="bg-slate-900 border-purple-500/30 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Schedule" : "Schedule Content"}</DialogTitle>
            <DialogDescription className="text-gray-400">
              Plan your content release or live stream
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label className="text-purple-300 text-sm">Content Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger className="bg-slate-800 border-purple-500/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-purple-500/30">
                  <SelectItem value="video">Video Upload</SelectItem>
                  <SelectItem value="audio">Audio Upload</SelectItem>
                  <SelectItem value="live">Live Stream</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-purple-300 text-sm">Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Content title"
                className="bg-slate-800 border-purple-500/30 text-white"
              />
            </div>

            <div>
              <Label className="text-purple-300 text-sm">Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Brief description"
                className="bg-slate-800 border-purple-500/30 text-white h-20"
              />
            </div>

            <div>
              <Label className="text-purple-300 text-sm">Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger className="bg-slate-800 border-purple-500/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-purple-500/30">
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-purple-300 text-sm">Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left bg-slate-800 border-purple-500/30 text-white"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.scheduledDate ? format(form.scheduledDate, "MMM d, yyyy") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-slate-800 border-purple-500/30">
                    <Calendar
                      mode="single"
                      selected={form.scheduledDate}
                      onSelect={(date) => setForm({ ...form, scheduledDate: date })}
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label className="text-purple-300 text-sm">Time *</Label>
                <Input
                  type="time"
                  value={form.scheduledTime}
                  onChange={(e) => setForm({ ...form, scheduledTime: e.target.value })}
                  className="bg-slate-800 border-purple-500/30 text-white"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowScheduleDialog(false);
                  setEditingItem(null);
                }}
                className="flex-1 border-gray-600 text-gray-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CalendarIcon className="w-4 h-4 mr-2" />
                )}
                {editingItem ? "Update" : "Schedule"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}