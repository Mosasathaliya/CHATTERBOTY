'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from './use-toast';
import { useAgentStore } from './use-agent-store';
import { useUserStore } from './use-user-store';
import { personalizeAgentResponse } from '@/ai/flows/personalize-agent-response';
import { textToSpeech } from '@/ai/flows/text-to-speech';

export function useLiveApi() {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [volume, setVolume] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const { currentAgentId, getAgentById } = useAgentStore();
  const { name: userName, info: userDescription } = useUserStore();

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const conversationHistory = useRef<string[]>([]);

  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
      audioSourceRef.current.disconnect();
      audioSourceRef.current = null;
    }
    setIsTalking(false);
    setVolume(0);
  }, []);

  const getVolume = useCallback(() => {
    if (analyserRef.current) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteTimeDomainData(dataArray);
      let sum = 0;
      for (const amplitude of dataArray) {
        sum += Math.pow(amplitude / 128.0 - 1, 2);
      }
      const volume = Math.sqrt(sum / dataArray.length);
      setVolume(volume);
      animationFrameRef.current = requestAnimationFrame(getVolume);
    }
  }, []);

  const playAudio = useCallback(async (audioDataUri: string) => {
    cleanup();
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const audioContext = audioContextRef.current;
    
    const response = await fetch(audioDataUri);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    analyserRef.current = audioContext.createAnalyser();
    analyserRef.current.fftSize = 256;

    audioSourceRef.current = audioContext.createBufferSource();
    audioSourceRef.current.buffer = audioBuffer;
    audioSourceRef.current.connect(analyserRef.current);
    analyserRef.current.connect(audioContext.destination);

    setIsTalking(true);
    audioSourceRef.current.start();
    getVolume();

    audioSourceRef.current.onended = () => {
      cleanup();
    };
  }, [cleanup, getVolume]);

  const startConversation = useCallback(async () => {
    try {
      const agent = getAgentById(currentAgentId);
      if (!agent) throw new Error('Agent not found');

      const fullPrompt = `Here is the recent conversation history for context (last 2 turns): ${conversationHistory.current.join('\n')}\nUser says: "Hello!"`;

      const response = await personalizeAgentResponse({
        agentPersonality: agent.personality,
        userInput: fullPrompt,
        userName,
        userDescription,
      });

      const { personalizedResponse } = response;
      conversationHistory.current.push(`User: Hello!`);
      conversationHistory.current.push(`Agent: ${personalizedResponse}`);
      if (conversationHistory.current.length > 4) {
        conversationHistory.current = conversationHistory.current.slice(-4);
      }

      const { audioDataUri } = await textToSpeech({
        text: personalizedResponse,
        voice: agent.voice,
      });
      
      playAudio(audioDataUri);

    } catch (err: any) {
      console.error("Error in conversation:", err);
      const errorMessage = err.message || "An unexpected error occurred during the conversation.";
      setError(errorMessage);
      toast({ title: "Conversation Error", description: errorMessage, variant: "destructive" });
    }
  }, [currentAgentId, getAgentById, userName, userDescription, toast, playAudio]);


  const connect = useCallback(() => {
    console.log('Connecting to live API...');
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        stream.getTracks().forEach(track => track.stop());
        setIsConnected(true);
        setError(null);
        toast({ title: "Connected", description: "You can start talking now." });
        conversationHistory.current = [];
        startConversation();
      })
      .catch(err => {
        console.error("Microphone access denied:", err);
        const errorMessage = "Microphone access is required. Please enable it in your browser settings.";
        setError(errorMessage);
        toast({ title: "Error", description: errorMessage, variant: "destructive" });
      });
  }, [toast, startConversation]);

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
    return () => {
        cleanup();
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
        }
    };
  }, [cleanup]);

  return { isConnected, isMuted, isTalking, volume, error, connect, disconnect, toggleMute };
}
