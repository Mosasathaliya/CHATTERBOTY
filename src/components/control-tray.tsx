'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Play, Pause, Send, Loader } from 'lucide-react';
import type { ConnectionState } from '@/hooks/use-live-api';

interface ControlTrayProps {
  connectionState: ConnectionState;
  isMuted: boolean;
  onMainButton: () => void;
  onMuteToggle: () => void;
}

const MainButtonIcon = ({ state }: { state: ConnectionState }) => {
    switch(state) {
        case 'disconnected':
            return <Play className="h-10 w-10 fill-current ml-1" />;
        case 'listening':
            return <Send className="h-9 w-9" />;
        case 'processing':
        case 'connecting':
            return <Loader className="h-10 w-10 animate-spin" />;
        case 'speaking':
            return <Pause className="h-10 w-10 fill-current" />;
        default:
             return <Pause className="h-10 w-10 fill-current" />;
    }
}

export default function ControlTray({ connectionState, isMuted, onMainButton, onMuteToggle }: ControlTrayProps) {
  const isConnected = connectionState !== 'disconnected';
  const mainButtonDisabled = connectionState === 'connecting' || connectionState === 'processing' || connectionState === 'speaking';

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
          onClick={onMainButton}
          size="icon"
          disabled={mainButtonDisabled}
          className="rounded-full w-20 h-20 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transform hover:scale-105 transition-transform disabled:scale-100 disabled:bg-primary/70"
          aria-label="Main Action"
        >
          <MainButtonIcon state={connectionState} />
        </Button>
        <div className="w-16 h-16" /> {/* Spacer to balance the layout */}
      </div>
    </footer>
  );
}
