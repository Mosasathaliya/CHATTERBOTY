'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from './use-toast';

export function useLiveApi() {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [volume, setVolume] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const talkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const volumeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const cleanup = useCallback(() => {
    if (talkIntervalRef.current) {
      clearInterval(talkIntervalRef.current);
      talkIntervalRef.current = null;
    }
    if(volumeIntervalRef.current) {
        clearInterval(volumeIntervalRef.current);
        volumeIntervalRef.current = null;
    }
    setIsTalking(false);
    setVolume(0);
  }, []);

  const simulateAiSpeech = useCallback(() => {
    cleanup();
    talkIntervalRef.current = setInterval(() => {
        const talkingNow = Math.random() > 0.5;
        if (talkingNow) {
            setIsTalking(true);
            const duration = Math.random() * 3000 + 1000;
            
            volumeIntervalRef.current = setInterval(() => {
                setVolume(Math.random() * 0.8 + 0.2); // Volume between 0.2 and 1.0
            }, 100);
            
            setTimeout(() => {
                if (volumeIntervalRef.current) {
                    clearInterval(volumeIntervalRef.current);
                    volumeIntervalRef.current = null;
                }
                setVolume(0);
                setIsTalking(false);
            }, duration);
        }
    }, 5000);
  }, [cleanup]);


  const connect = useCallback(() => {
    console.log('Connecting to live API...');
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        stream.getTracks().forEach(track => track.stop());
        setIsConnected(true);
        setError(null);
        toast({ title: "Connected", description: "You can start talking now." });
        simulateAiSpeech();
      })
      .catch(err => {
        console.error("Microphone access denied:", err);
        const errorMessage = "Microphone access is required. Please enable it in your browser settings.";
        setError(errorMessage);
        toast({ title: "Error", description: errorMessage, variant: "destructive" });
      });
  }, [toast, simulateAiSpeech]);

  const disconnect = useCallback(() => {
    console.log('Disconnecting from live API...');
    cleanup();
    setIsConnected(false);
    toast({ title: "Disconnected" });
  }, [toast, cleanup]);

  const toggleMute = useCallback(() => {
    setIsMuted(m => !m);
  }, []);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  return { isConnected, isMuted, isTalking, volume, error, connect, disconnect, toggleMute };
}
