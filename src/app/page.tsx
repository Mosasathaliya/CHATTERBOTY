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

export default function Home() {
  const { showUserConfig, showAgentEdit, setShowUserConfig } = useUIStore();
  const { isConnected, isTalking, volume, error, connect, disconnect, toggleMute, isMuted } = useLiveApi();
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

  return (
    <div className="flex flex-col items-center justify-between h-screen bg-background p-4 sm:p-6 lg:p-8 font-body overflow-hidden">
      {error && <ErrorOverlay message={error} />}
      <Header />
      <main className="flex-grow flex items-center justify-center w-full">
        <AgentAvatar isTalking={isTalking} volume={volume} />
      </main>
      <ControlTray 
        isConnected={isConnected} 
        isMuted={isMuted}
        onConnectToggle={isConnected ? disconnect : connect}
        onMuteToggle={toggleMute}
      />
      {showUserConfig && <UserSettingsModal />}
      {showAgentEdit && <AgentEditModal />}
    </div>
  );
}
