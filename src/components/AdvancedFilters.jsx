import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Filter,
  X,
  Clock,
  Calendar,
  User,
  Tag,
  Languages,
  SortAsc,
  RotateCcw,
} from "lucide-react";

const DURATION_OPTIONS = [
  { label: "Any duration", value: "any" },
  { label: "Under 5 min", value: "0-5" },
  { label: "5-15 min", value: "5-15" },
  { label: "15-30 min", value: "15-30" },
  { label: "30-60 min", value: "30-60" },
  { label: "Over 60 min", value: "60+" },
];

const DATE_OPTIONS = [
  { label: "Any time", value: "any" },
  { label: "Today", value: "today" },
  { label: "This week", value: "week" },
  { label: "This month", value: "month" },
  { label: "This year", value: "year" },
];

const SORT_OPTIONS = [
  { label: "Most Recent", value: "-published_date" },
  { label: "Oldest First", value: "published_date" },
  { label: "Most Viewed", value: "-view_count" },
  { label: "Most Played", value: "-play_count" },
  { label: "Title A-Z", value: "title" },
  { label: "Title Z-A", value: "-title" },
  { label: "Duration (Short)", value: "duration" },
  { label: "Duration (Long)", value: "-duration" },
];

const LANGUAGES = [
  "All Languages",
  "English",
  "Arabic",
  "Urdu",
  "Turkish",
  "Malay",
  "Indonesian",
  "Bengali",
  "French",
];

export default function AdvancedFilters({ 
  filters, 
  onFiltersChange, 
  speakers = [], 
  categories = [],
  showContentType = true,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters || {
    contentType: "all",
    category: "All",
    speaker: "all",
    duration: "any",
    dateRange: "any",
    language: "All Languages",
    sortBy: "-published_date",
    searchTerm: "",
  });

  const activeFiltersCount = Object.entries(localFilters).filter(([key, value]) => {
    if (key === "searchTerm") return value && value.length > 0;
    if (key === "contentType") return value !== "all";
    if (key === "category") return value !== "All";
    if (key === "speaker") return value !== "all";
    if (key === "duration") return value !== "any";
    if (key === "dateRange") return value !== "any";
    if (key === "language") return value !== "All Languages";
    if (key === "sortBy") return value !== "-published_date";
    return false;
  }).length;

  const handleApply = () => {
    onFiltersChange(localFilters);
    setIsOpen(false);
  };

  const handleReset = () => {
    const defaultFilters = {
      contentType: "all",
      category: "All",
      speaker: "all",
      duration: "any",
      dateRange: "any",
      language: "All Languages",
      sortBy: "-published_date",
      searchTerm: "",
    };
    setLocalFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const removeFilter = (key) => {
    const defaultValues = {
      contentType: "all",
      category: "All",
      speaker: "all",
      duration: "any",
      dateRange: "any",
      language: "All Languages",
      sortBy: "-published_date",
      searchTerm: "",
    };
    const newFilters = { ...localFilters, [key]: defaultValues[key] };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  return (
    <div className="space-y-3">
      {/* Filter Button and Active Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge className="ml-1 bg-blue-600 text-white text-xs px-1.5">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>

          <SheetContent className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Advanced Filters
              </SheetTitle>
              <SheetDescription>
                Refine your search with multiple filter options
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-6 py-6">
              {/* Content Type */}
              {showContentType && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <Tag className="w-4 h-4" />
                    Content Type
                  </Label>
                  <Select
                    value={localFilters.contentType}
                    onValueChange={(v) => setLocalFilters({ ...localFilters, contentType: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Content</SelectItem>
                      <SelectItem value="video">Videos Only</SelectItem>
                      <SelectItem value="audio">Audio Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Category */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Tag className="w-4 h-4" />
                  Category
                </Label>
                <Select
                  value={localFilters.category}
                  onValueChange={(v) => setLocalFilters({ ...localFilters, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Speaker */}
              {speakers.length > 0 && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <User className="w-4 h-4" />
                    Speaker / Artist
                  </Label>
                  <Select
                    value={localFilters.speaker}
                    onValueChange={(v) => setLocalFilters({ ...localFilters, speaker: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Speakers</SelectItem>
                      {speakers.map((speaker) => (
                        <SelectItem key={speaker} value={speaker}>{speaker}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Duration */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Clock className="w-4 h-4" />
                  Duration
                </Label>
                <Select
                  value={localFilters.duration}
                  onValueChange={(v) => setLocalFilters({ ...localFilters, duration: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATION_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Calendar className="w-4 h-4" />
                  Upload Date
                </Label>
                <Select
                  value={localFilters.dateRange}
                  onValueChange={(v) => setLocalFilters({ ...localFilters, dateRange: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DATE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Language */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Languages className="w-4 h-4" />
                  Language
                </Label>
                <Select
                  value={localFilters.language}
                  onValueChange={(v) => setLocalFilters({ ...localFilters, language: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((lang) => (
                      <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort By */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <SortAsc className="w-4 h-4" />
                  Sort By
                </Label>
                <Select
                  value={localFilters.sortBy}
                  onValueChange={(v) => setLocalFilters({ ...localFilters, sortBy: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <SheetFooter className="flex gap-2">
              <Button variant="outline" onClick={handleReset} className="flex-1">
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button onClick={handleApply} className="flex-1 bg-blue-600 hover:bg-blue-700">
                Apply Filters
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {/* Active filter badges */}
        {localFilters.contentType !== "all" && (
          <Badge variant="secondary" className="gap-1 px-2 py-1">
            {localFilters.contentType}
            <X className="w-3 h-3 cursor-pointer" onClick={() => removeFilter("contentType")} />
          </Badge>
        )}
        {localFilters.category !== "All" && (
          <Badge variant="secondary" className="gap-1 px-2 py-1">
            {localFilters.category}
            <X className="w-3 h-3 cursor-pointer" onClick={() => removeFilter("category")} />
          </Badge>
        )}
        {localFilters.speaker !== "all" && (
          <Badge variant="secondary" className="gap-1 px-2 py-1">
            {localFilters.speaker}
            <X className="w-3 h-3 cursor-pointer" onClick={() => removeFilter("speaker")} />
          </Badge>
        )}
        {localFilters.duration !== "any" && (
          <Badge variant="secondary" className="gap-1 px-2 py-1">
            {DURATION_OPTIONS.find(d => d.value === localFilters.duration)?.label}
            <X className="w-3 h-3 cursor-pointer" onClick={() => removeFilter("duration")} />
          </Badge>
        )}
        {localFilters.dateRange !== "any" && (
          <Badge variant="secondary" className="gap-1 px-2 py-1">
            {DATE_OPTIONS.find(d => d.value === localFilters.dateRange)?.label}
            <X className="w-3 h-3 cursor-pointer" onClick={() => removeFilter("dateRange")} />
          </Badge>
        )}
        {localFilters.language !== "All Languages" && (
          <Badge variant="secondary" className="gap-1 px-2 py-1">
            {localFilters.language}
            <X className="w-3 h-3 cursor-pointer" onClick={() => removeFilter("language")} />
          </Badge>
        )}
      </div>
    </div>
  );
}

// Helper function to apply filters to content array
export function applyFilters(content, filters) {
  let filtered = [...content];

  // Content type filter
  if (filters.contentType && filters.contentType !== "all") {
    filtered = filtered.filter(c => c.type === filters.contentType);
  }

  // Category filter
  if (filters.category && filters.category !== "All") {
    filtered = filtered.filter(c => c.category === filters.category);
  }

  // Speaker filter
  if (filters.speaker && filters.speaker !== "all") {
    filtered = filtered.filter(c => c.speaker === filters.speaker);
  }

  // Duration filter
  if (filters.duration && filters.duration !== "any") {
    filtered = filtered.filter(c => {
      const duration = (c.duration || 0) / 60; // Convert to minutes
      switch (filters.duration) {
        case "0-5": return duration < 5;
        case "5-15": return duration >= 5 && duration < 15;
        case "15-30": return duration >= 15 && duration < 30;
        case "30-60": return duration >= 30 && duration < 60;
        case "60+": return duration >= 60;
        default: return true;
      }
    });
  }

  // Date range filter
  if (filters.dateRange && filters.dateRange !== "any") {
    const now = new Date();
    filtered = filtered.filter(c => {
      const date = new Date(c.published_date || c.created_date);
      const diffDays = (now - date) / (1000 * 60 * 60 * 24);
      switch (filters.dateRange) {
        case "today": return diffDays < 1;
        case "week": return diffDays < 7;
        case "month": return diffDays < 30;
        case "year": return diffDays < 365;
        default: return true;
      }
    });
  }

  // Language filter
  if (filters.language && filters.language !== "All Languages") {
    filtered = filtered.filter(c => 
      c.language?.toLowerCase() === filters.language.toLowerCase()
    );
  }

  // Search term
  if (filters.searchTerm && filters.searchTerm.length > 0) {
    const term = filters.searchTerm.toLowerCase();
    filtered = filtered.filter(c =>
      (c.title || "").toLowerCase().includes(term) ||
      (c.description || "").toLowerCase().includes(term) ||
      (c.speaker || "").toLowerCase().includes(term)
    );
  }

  // Sort
  if (filters.sortBy) {
    const desc = filters.sortBy.startsWith("-");
    const field = filters.sortBy.replace("-", "");
    
    filtered.sort((a, b) => {
      let aVal = a[field];
      let bVal = b[field];
      
      // Handle dates
      if (field.includes("date")) {
        aVal = new Date(aVal || 0).getTime();
        bVal = new Date(bVal || 0).getTime();
      }
      
      // Handle numbers
      if (typeof aVal === "number" || typeof bVal === "number") {
        aVal = aVal || 0;
        bVal = bVal || 0;
      }
      
      // Handle strings
      if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = (bVal || "").toLowerCase();
      }
      
      if (desc) {
        return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
      }
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    });
  }

  return filtered;
}