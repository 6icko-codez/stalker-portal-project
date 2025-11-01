'use client';

import React, { useEffect, useState } from 'react';
import { useIPTVStore } from '@/lib/stores/useIPTVStore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Calendar, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import axios from 'axios';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface EPGProgram {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  category?: string;
  rating?: string;
}

export function EPGViewer() {
  const { currentChannel, activePortal, epgPanelOpen, setEPGPanelOpen } = useIPTVStore();
  const [programs, setPrograms] = useState<EPGProgram[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<EPGProgram | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentProgram, setCurrentProgram] = useState<EPGProgram | null>(null);

  useEffect(() => {
    if (currentChannel && epgPanelOpen) {
      loadEPG();
    }
  }, [currentChannel, epgPanelOpen]);

  useEffect(() => {
    // Find current program
    const now = new Date();
    const current = programs.find((p) => {
      const start = parseISO(p.startTime);
      const end = parseISO(p.endTime);
      return start <= now && end > now;
    });
    setCurrentProgram(current || null);
  }, [programs]);

  const loadEPG = async () => {
    if (!currentChannel || !activePortal) return;

    setIsLoading(true);
    try {
      const response = await axios.post('/api/iptv/stalker/epg', {
        portalUrl: activePortal.url,
        macAddress: activePortal.macAddress,
        timezone: activePortal.timezone,
        channelId: currentChannel.externalId,
        period: 7,
      });

      if (response.data.success) {
        const epgData = response.data.epg.map((item: any) => ({
          id: item.id || `${item.start}-${item.stop}`,
          title: item.name || item.title || 'Unknown Program',
          description: item.descr || item.description,
          startTime: new Date(parseInt(item.start) * 1000).toISOString(),
          endTime: new Date(parseInt(item.stop) * 1000).toISOString(),
          category: item.category,
          rating: item.rating,
        }));

        setPrograms(epgData);
      }
    } catch (error: any) {
      toast.error('Failed to load EPG data');
      console.error('EPG error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeRange = (start: string, end: string) => {
    const startDate = parseISO(start);
    const endDate = parseISO(end);
    return `${format(startDate, 'HH:mm')} - ${format(endDate, 'HH:mm')}`;
  };

  const formatDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'EEE, MMM d');
  };

  const getProgress = (start: string, end: string) => {
    const now = new Date();
    const startDate = parseISO(start);
    const endDate = parseISO(end);

    if (now < startDate) return 0;
    if (now > endDate) return 100;

    const total = endDate.getTime() - startDate.getTime();
    const elapsed = now.getTime() - startDate.getTime();
    return (elapsed / total) * 100;
  };

  const groupProgramsByDate = () => {
    const grouped: Record<string, EPGProgram[]> = {};
    programs.forEach((program) => {
      const date = formatDate(program.startTime);
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(program);
    });
    return grouped;
  };

  if (!epgPanelOpen) return null;

  return (
    <>
      <div className="w-80 border-l bg-background flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            <h3 className="font-semibold">TV Guide</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setEPGPanelOpen(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {!currentChannel ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <p className="text-muted-foreground text-center">
              Select a channel to view the TV guide
            </p>
          </div>
        ) : isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading guide...</p>
            </div>
          </div>
        ) : programs.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <p className="text-muted-foreground text-center">
              No program guide available for this channel
            </p>
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-6">
              {/* Current Program Highlight */}
              {currentProgram && (
                <Card className="border-primary">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <Badge variant="default" className="mb-2">
                        Now Playing
                      </Badge>
                      <Clock className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-lg">{currentProgram.title}</CardTitle>
                    <CardDescription>
                      {formatTimeRange(currentProgram.startTime, currentProgram.endTime)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {currentProgram.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {currentProgram.description}
                      </p>
                    )}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Progress</span>
                        <span>
                          {Math.round(
                            getProgress(currentProgram.startTime, currentProgram.endTime)
                          )}
                          %
                        </span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-1000"
                          style={{
                            width: `${getProgress(
                              currentProgram.startTime,
                              currentProgram.endTime
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-3"
                      onClick={() => setSelectedProgram(currentProgram)}
                    >
                      <Info className="w-4 h-4 mr-2" />
                      More Info
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Programs by Date */}
              {Object.entries(groupProgramsByDate()).map(([date, datePrograms]) => (
                <div key={date}>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {date}
                  </h4>
                  <div className="space-y-2">
                    {datePrograms.map((program) => {
                      const isCurrent = currentProgram?.id === program.id;
                      const isPast = parseISO(program.endTime) < new Date();

                      return (
                        <div
                          key={program.id}
                          onClick={() => setSelectedProgram(program)}
                          className={cn(
                            'p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50',
                            isCurrent && 'border-primary bg-primary/5',
                            isPast && 'opacity-60'
                          )}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="font-medium text-sm line-clamp-1">
                              {program.title}
                            </p>
                            {program.category && (
                              <Badge variant="secondary" className="text-xs">
                                {program.category}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTimeRange(program.startTime, program.endTime)}
                          </p>
                          {program.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {program.description}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Program Details Dialog */}
      <Dialog
        open={!!selectedProgram}
        onOpenChange={(open) => !open && setSelectedProgram(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedProgram?.title}</DialogTitle>
            <DialogDescription>
              {selectedProgram &&
                formatTimeRange(selectedProgram.startTime, selectedProgram.endTime)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedProgram?.description && (
              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedProgram.description}
                </p>
              </div>
            )}
            <div className="flex gap-4">
              {selectedProgram?.category && (
                <div>
                  <h4 className="font-semibold mb-1 text-sm">Category</h4>
                  <Badge variant="secondary">{selectedProgram.category}</Badge>
                </div>
              )}
              {selectedProgram?.rating && (
                <div>
                  <h4 className="font-semibold mb-1 text-sm">Rating</h4>
                  <Badge variant="outline">{selectedProgram.rating}</Badge>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
