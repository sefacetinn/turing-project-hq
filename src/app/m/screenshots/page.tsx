'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, ChevronLeft, ChevronRight, Image as ImageIcon, AlertCircle, Filter } from 'lucide-react';
import { getMergedData } from '@/lib/hqData';
import { Screenshot, Issue } from '@/types/hq';

// Skeleton loader
function ScreenshotSkeleton() {
  return (
    <div className="card overflow-hidden animate-pulse">
      <div className="aspect-[9/16] bg-dark-elevated" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-dark-elevated rounded w-3/4" />
        <div className="flex gap-1">
          <div className="h-4 bg-dark-elevated rounded w-10" />
          <div className="h-4 bg-dark-elevated rounded w-12" />
        </div>
      </div>
    </div>
  );
}

export default function MobileScreenshotsPage() {
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [allFeatures, setAllFeatures] = useState<string[]>([]);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      const data = getMergedData();
      setScreenshots(data.screenshots);
      setIssues(data.issues);

      // Extract unique tags and features
      const tags = new Set<string>();
      const features = new Set<string>();
      data.screenshots.forEach(s => {
        s.tags.forEach(t => tags.add(t));
        if (s.feature) features.add(s.feature);
      });
      setAllTags(Array.from(tags).sort());
      setAllFeatures(Array.from(features).sort());

      setLoading(false);
    }, 150);

    return () => clearTimeout(timer);
  }, []);

  // Filter screenshots
  const filteredScreenshots = activeFilter
    ? screenshots.filter(s =>
        s.feature === activeFilter || s.tags.includes(activeFilter)
      )
    : screenshots;

  // Get related issues for a screenshot
  const getRelatedIssues = useCallback((screenshot: Screenshot) => {
    return issues.filter(i => screenshot.relatedIssueIds?.includes(i.id));
  }, [issues]);

  // Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;

    if (selectedIndex !== null) {
      if (diff > threshold && selectedIndex < filteredScreenshots.length - 1) {
        // Swipe left - next
        setSelectedIndex(selectedIndex + 1);
      } else if (diff < -threshold && selectedIndex > 0) {
        // Swipe right - previous
        setSelectedIndex(selectedIndex - 1);
      }
    }
  };

  const goToNext = () => {
    if (selectedIndex !== null && selectedIndex < filteredScreenshots.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  const goToPrev = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const selectedScreenshot = selectedIndex !== null ? filteredScreenshots[selectedIndex] : null;
  const selectedRelatedIssues = selectedScreenshot ? getRelatedIssues(selectedScreenshot) : [];

  // Combine features and tags for filter chips
  const filterOptions = [...allFeatures, ...allTags.filter(t => !allFeatures.includes(t))];

  return (
    <>
      <div className="px-4 py-4 space-y-4">
        {/* Header with count */}
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-zinc-100">
            {loading ? '-' : filteredScreenshots.length} Screenshots
          </h1>
          {activeFilter && (
            <button
              onClick={() => setActiveFilter(null)}
              className="text-xs text-accent-light flex items-center gap-1"
            >
              Clear filter
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Filter Chips */}
        {!loading && filterOptions.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
            <Filter className="w-4 h-4 text-zinc-500 flex-shrink-0" />
            {filterOptions.slice(0, 10).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(activeFilter === filter ? null : filter)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full flex-shrink-0 transition-colors ${
                  activeFilter === filter
                    ? 'bg-accent text-white'
                    : 'bg-dark-elevated text-zinc-400 active:bg-dark-hover'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            <ScreenshotSkeleton />
            <ScreenshotSkeleton />
            <ScreenshotSkeleton />
            <ScreenshotSkeleton />
          </div>
        ) : filteredScreenshots.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {filteredScreenshots.map((screenshot, index) => {
              const relatedIssues = getRelatedIssues(screenshot);

              return (
                <button
                  key={screenshot.id}
                  onClick={() => setSelectedIndex(index)}
                  className="card overflow-hidden text-left active:scale-[0.98] transition-transform"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-[9/16] bg-dark-elevated">
                    {screenshot.path ? (
                      <Image
                        src={screenshot.path}
                        alt={screenshot.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-zinc-700" />
                      </div>
                    )}

                    {/* Related issues indicator */}
                    {relatedIssues.length > 0 && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-status-warning flex items-center justify-center">
                        <AlertCircle className="w-3.5 h-3.5 text-dark-bg" />
                      </div>
                    )}

                    {/* Platform badge */}
                    {screenshot.platform && screenshot.platform !== 'All' && (
                      <div className="absolute bottom-2 left-2 px-1.5 py-0.5 text-[9px] font-medium bg-black/60 text-white rounded">
                        {screenshot.platform}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <p className="text-xs font-medium text-zinc-300 truncate">{screenshot.name}</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {screenshot.feature && (
                        <span className="px-1.5 py-0.5 text-[10px] bg-accent/20 text-accent-light rounded">
                          {screenshot.feature}
                        </span>
                      )}
                      {screenshot.tags.slice(0, 1).map((tag, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.5 text-[10px] bg-dark-elevated text-zinc-500 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                      {screenshot.tags.length > 1 && (
                        <span className="px-1.5 py-0.5 text-[10px] bg-dark-elevated text-zinc-600 rounded">
                          +{screenshot.tags.length - 1}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-dark-elevated flex items-center justify-center mb-4">
              <ImageIcon className="w-8 h-8 text-zinc-600" />
            </div>
            <p className="text-lg font-medium text-zinc-300 mb-1">
              {activeFilter ? 'No matches' : 'No screenshots'}
            </p>
            <p className="text-sm text-zinc-500">
              {activeFilter
                ? `No screenshots match "${activeFilter}"`
                : 'Screenshots will appear here when added.'}
            </p>
            {activeFilter && (
              <button
                onClick={() => setActiveFilter(null)}
                className="mt-4 btn btn-secondary"
              >
                Clear filter
              </button>
            )}
          </div>
        )}
      </div>

      {/* Full Screen Viewer with Swipe Support */}
      {selectedScreenshot && (
        <div
          className="fixed inset-0 z-50 bg-black flex flex-col animate-fade-in"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 pt-[calc(env(safe-area-inset-top,0px)+16px)]">
            <span className="text-sm text-white/60">
              {selectedIndex !== null ? selectedIndex + 1 : 0} / {filteredScreenshots.length}
            </span>
            <button
              onClick={() => setSelectedIndex(null)}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Image with navigation */}
          <div className="flex-1 flex items-center justify-center relative overflow-hidden">
            {/* Previous button */}
            {selectedIndex !== null && selectedIndex > 0 && (
              <button
                onClick={goToPrev}
                className="absolute left-2 z-10 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active:bg-white/20"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
            )}

            {/* Image */}
            <div className="relative w-full h-full max-w-md px-4">
              {selectedScreenshot.path ? (
                <Image
                  src={selectedScreenshot.path}
                  alt={selectedScreenshot.name}
                  fill
                  className="object-contain"
                  sizes="100vw"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <ImageIcon className="w-16 h-16 text-zinc-700" />
                </div>
              )}
            </div>

            {/* Next button */}
            {selectedIndex !== null && selectedIndex < filteredScreenshots.length - 1 && (
              <button
                onClick={goToNext}
                className="absolute right-2 z-10 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active:bg-white/20"
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </button>
            )}
          </div>

          {/* Caption & Info */}
          <div className="p-4 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] bg-gradient-to-t from-black/80 to-transparent">
            <p className="text-base font-medium text-white text-center mb-2">
              {selectedScreenshot.name}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap justify-center gap-2 mb-3">
              {selectedScreenshot.feature && (
                <span className="px-2 py-1 text-xs bg-accent/30 text-accent-light rounded-full">
                  {selectedScreenshot.feature}
                </span>
              )}
              {selectedScreenshot.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs bg-white/10 text-white/80 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Platform */}
            {selectedScreenshot.platform && (
              <p className="text-xs text-white/50 text-center mb-3">
                {selectedScreenshot.platform}
              </p>
            )}

            {/* Related Issues */}
            {selectedRelatedIssues.length > 0 && (
              <div className="border-t border-white/10 pt-3 mt-3">
                <p className="text-xs text-white/50 text-center mb-2">Related Issues</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {selectedRelatedIssues.map((issue) => (
                    <Link
                      key={issue.id}
                      href={`/m/issues/${issue.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="px-3 py-1.5 text-xs bg-status-warning/20 text-status-warning rounded-lg flex items-center gap-1.5 active:bg-status-warning/30"
                    >
                      <AlertCircle className="w-3 h-3" />
                      {issue.id}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {selectedScreenshot.notes && (
              <p className="text-xs text-white/60 text-center mt-3 italic">
                {selectedScreenshot.notes}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
