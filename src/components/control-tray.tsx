
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Play, Pause, Send, Loader, PhoneOff } from 'lucide-react';
import type { ConnectionState } from '@/hooks/use-live-api';

interface ControlTrayProps {
  connectionState: ConnectionState;
  isMuted: boolean;
  onMainButton: () => void;
  onMuteToggle: () => void;
  onSendButton: () => void;
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
             return <PhoneOff className="h-10 w-10 fill-current" />;
    }
}

export default function ControlTray({ connectionState, isMuted, onMainButton, onMuteToggle, onSendButton }: ControlTrayProps) {
  const isConnected = connectionState !== 'disconnected';

  const handleCenterClick = () => {
    if (connectionState === 'listening') {
      onSendButton();
    } else {
      onMainButton();
    }
  }
  
  const getCenterButtonAriaLabel = () => {
    if (connectionState === 'disconnected') return 'Connect';
    if (connectionState === 'listening') return 'Send';
    return 'Disconnect';
  }
  
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
          onClick={handleCenterClick}
          size="icon"
          disabled={mainButtonDisabled}
          className="rounded-full w-20 h-20 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transform hover:scale-105 transition-transform disabled:scale-100 disabled:bg-primary/70"
          aria-label={getCenterButtonAriaLabel()}
        >
          <MainButtonIcon state={connectionState} />
        </Button>
         <Button 
          variant="destructive" 
          size="icon" 
          onClick={onMainButton}
          disabled={!isConnected}
          className="rounded-full w-16 h-16"
          aria-label={'Disconnect'}
        >
          <PhoneOff className="h-8 w-8" />
        </Button>
      </div>
    </footer>
  );
}

    