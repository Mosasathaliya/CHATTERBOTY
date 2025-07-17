'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/header';
import AgentAvatar from '@/components/agent-avatar';
import ControlTray from '@/components/control-tray';
import UserSettingsModal from '@/components/user-settings-modal';
import AgentEditModal from '@/components/agent-edit-modal';
import { useUIStore } from '@/hooks/use-ui-store';
import { useLiveApi } from '@/hooks/use-live-api';
import ErrorOverlay from '@/components/error-overlay';
import TranscriptionDisplay from '@/components/transcription-display';

export default function Home() {
  const { showUserConfig, showAgentEdit, setShowUserConfig } = useUIStore();
  const { connectionState, isTalking, volume, error, connect, disconnect, toggleMute, isMuted, stopListeningAndProcess, transcribedText } = useLiveApi();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const hasVisited = localStorage.getItem('chatterbots_has_visited');
    if (!hasVisited) {
      setShowUserConfig(true);
      localStorage.setItem('chatterbots_has_visited', 'true');
    }
  }, [setShowUserConfig]);

  if (!isClient) {
    return null;
  }
  
  const handleMainButton = () => {
    if (connectionState === 'disconnected') {
      connect();
    } else if (connectionState === 'listening') {
      stopListeningAndProcess();
    } else {
      disconnect();
    }
  }

  return (
    <div className="flex flex-col items-center justify-between h-screen bg-background p-4 sm:p-6 lg:p-8 font-body overflow-hidden">
      {error && <ErrorOverlay message={error} />}
      <Header />
      <main className="flex-grow flex flex-col items-center justify-center w-full">
        <AgentAvatar isTalking={isTalking} volume={volume} />
        <TranscriptionDisplay text={transcribedText} connectionState={connectionState} />
      </main>
      <ControlTray 
        connectionState={connectionState} 
        isMuted={isMuted}
        onMainButton={handleMainButton}
        onMuteToggle={toggleMute}
      />
      {showUserConfig && <UserSettingsModal />}
      {showAgentEdit && <AgentEditModal />}
    </div>
  );
}
