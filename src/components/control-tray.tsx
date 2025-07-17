'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Play, Pause } from 'lucide-react';

interface ControlTrayProps {
  isConnected: boolean;
  isMuted: boolean;
  onConnectToggle: () => void;
  onMuteToggle: () => void;
}

export default function ControlTray({ isConnected, isMuted, onConnectToggle, onMuteToggle }: ControlTrayProps) {
  return (
    <footer className="w-full flex justify-center items-center p-4 absolute bottom-0 left-0 z-10">
      <div className="flex items-center space-x-4">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={onMuteToggle}
          disabled={!isConnected}
          className="rounded-full w-16 h-16"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
        </Button>
        <Button
          onClick={onConnectToggle}
          size="icon"
          className="rounded-full w-20 h-20 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transform hover:scale-105 transition-transform"
          aria-label={isConnected ? 'Disconnect' : 'Connect'}
        >
          {isConnected ? <Pause className="h-10 w-10 fill-current" /> : <Play className="h-10 w-10 fill-current ml-1" />}
        </Button>
        <div className="w-16 h-16" /> {/* Spacer to balance the layout */}
      </div>
    </footer>
  );
}
