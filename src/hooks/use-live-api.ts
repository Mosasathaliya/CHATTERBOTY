'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from './use-toast';
import { useAgentStore } from './use-agent-store';
import { useUserStore } from './use-user-store';
import { personalizeAgentResponse } from '@/ai/flows/personalize-agent-response';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import { speechToText } from '@/ai/flows/speech-to-text';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'listening' | 'processing' | 'speaking';

export function useLiveApi() {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [transcribedText, setTranscribedText] = useState('');
  const { toast } = useToast();
  
  const { currentAgentId, getAgentById } = useAgentStore();
  const { name: userName, info: userDescription } = useUserStore();

  const audioContextRef = useRef<AudioContext | null>(null);
  const agentAnalyserRef = useRef<AnalyserNode | null>(null);
  const agentAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const userMediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const conversationHistory = useRef<string[]>([]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mimeTypeRef = useRef<string>('');

  const cleanupAgentAudio = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (agentAudioSourceRef.current) {
      agentAudioSourceRef.current.stop();
      agentAudioSourceRef.current.disconnect();
      agentAudioSourceRef.current = null;
    }
    setVolume(0);
  }, []);

  const getAgentVolume = useCallback(() => {
    if (agentAnalyserRef.current) {
      const dataArray = new Uint8Array(agentAnalyserRef.current.frequencyBinCount);
      agentAnalyserRef.current.getByteTimeDomainData(dataArray);
      let sum = 0;
      for (const amplitude of dataArray) {
        sum += Math.pow(amplitude / 128.0 - 1, 2);
      }
      const newVolume = Math.sqrt(sum / dataArray.length);
      setVolume(newVolume);
      animationFrameId.current = requestAnimationFrame(getAgentVolume);
    }
  }, []);

  const startListening = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'inactive' && !isMuted) {
      audioChunksRef.current = [];
      setTranscribedText('');
      mediaRecorderRef.current.start();
      setConnectionState('listening');
    }
  }, [isMuted]);

  const playAudio = useCallback(async (audioDataUri: string) => {
    cleanupAgentAudio();
    if (!audioContextRef.current) return;
    const audioContext = audioContextRef.current;
    
    setConnectionState('speaking');

    const response = await fetch(audioDataUri);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    agentAnalyserRef.current = audioContext.createAnalyser();
    agentAnalyserRef.current.fftSize = 256;

    agentAudioSourceRef.current = audioContext.createBufferSource();
    agentAudioSourceRef.current.buffer = audioBuffer;
    agentAudioSourceRef.current.connect(agentAnalyserRef.current);
    agentAnalyserRef.current.connect(audioContext.destination);

    agentAudioSourceRef.current.start();
    getAgentVolume();

    agentAudioSourceRef.current.onended = () => {
      cleanupAgentAudio();
      startListening();
    };
  }, [cleanupAgentAudio, getAgentVolume, startListening]);

  const processAndRespond = useCallback(async (userInput: string) => {
    try {
      if (!userInput.trim()) {
        startListening();
        return;
      };

      setConnectionState('processing');
      const agent = getAgentById(currentAgentId);
      if (!agent) throw new Error('Agent not found');

      conversationHistory.current.push(`User: ${userInput}`);

      const response = await personalizeAgentResponse({
        agentPersonality: agent.personality,
        userInput: `Here is the recent conversation history for context (last 4 turns): ${conversationHistory.current.slice(-4).join('\n')}\nUser says: "${userInput}"`,
        userName,
        userDescription,
      });

      const { personalizedResponse } = response;
      conversationHistory.current.push(`Agent: ${personalizedResponse}`);
      if (conversationHistory.current.length > 8) {
        conversationHistory.current = conversationHistory.current.slice(-8);
      }

      const { audioDataUri } = await textToSpeech({ text: personalizedResponse, voice: agent.voice });
      
      await playAudio(audioDataUri);

    } catch (err: any) {
      console.error("Error in conversation:", err);
      const errorMessage = err.message || "An unexpected error occurred during the conversation.";
      setError(errorMessage);
      toast({ title: "Conversation Error", description: errorMessage, variant: "destructive" });
      startListening();
    }
  }, [currentAgentId, getAgentById, userName, userDescription, toast, playAudio, startListening]);


  const handleAudioProcessing = useCallback(async (audioBlob: Blob) => {
    setConnectionState('processing');
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64data = reader.result as string;
      try {
        const { text } = await speechToText({ 
          audioDataUri: base64data,
          mimeType: mimeTypeRef.current,
          onChunk: (chunk) => {
            setTranscribedText(prev => prev + chunk);
          }
        });
        if (text) {
          await processAndRespond(text);
        } else {
          toast({ title: "I didn't catch that", description: "Could you please try again?", variant: "default" });
          startListening();
        }
      } catch (err: any) {
        console.error("Error in speech-to-text:", err);
        setError("Failed to process audio. Please try again.");
        toast({ title: "Speech-to-Text Error", description: err.message, variant: "destructive" });
        startListening();
      }
    };
    reader.readAsDataURL(audioBlob);
  }, [processAndRespond, toast, startListening]);

  const stopListeningAndProcess = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const connect = useCallback(async () => {
    if (connectionState !== 'disconnected') return;
    console.log('Connecting...');
    setConnectionState('connecting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      userMediaStreamRef.current = stream;
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const options = { mimeType: 'audio/webm;codecs=opus' };
      mediaRecorderRef.current = new MediaRecorder(stream, options);
      mimeTypeRef.current = options.mimeType;

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeTypeRef.current });
        if (audioBlob.size > 1000) { // Check for minimal size to avoid processing empty blobs
          handleAudioProcessing(audioBlob);
        } else {
          startListening();
        }
      };
      
      setConnectionState('connected');
      setError(null);
      toast({ title: "Connected", description: "Agent is ready." });
      conversationHistory.current = [];
      
      await processAndRespond("Hello!");

    } catch (err) {
      console.error("Microphone access denied:", err);
      const errorMessage = "Microphone access is required. Please enable it in your browser settings.";
      setError(errorMessage);
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
      setConnectionState('disconnected');
    }
  }, [toast, processAndRespond, handleAudioProcessing, startListening]);

  const disconnect = useCallback(() => {
    console.log('Disconnecting...');
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
    }
    cleanupAgentAudio();
    if (userMediaStreamRef.current) {
        userMediaStreamRef.current.getTracks().forEach(track => track.stop());
        userMediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
        audioContextRef.current = null;
    }
    mediaRecorderRef.current = null;
    setConnectionState('disconnected');
    setTranscribedText('');
    toast({ title: "Disconnected" });
  }, [toast, cleanupAgentAudio]);

  const toggleMute = useCallback(() => {
    setIsMuted(m => {
        const newMuteState = !m;
        if (newMuteState) {
            toast({ title: "Muted", description: "The agent can't hear you." });
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
              mediaRecorderRef.current.pause();
            }
        } else {
            toast({ title: "Unmuted", description: "The agent can hear you again." });
            if(mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
                mediaRecorderRef.current.resume();
            } else if (connectionState === 'listening' || connectionState === 'connected' || connectionState === 'speaking') {
                startListening();
            }
        }
        return newMuteState;
    });
  }, [toast, connectionState, startListening]);

  useEffect(() => {
    return () => {
        disconnect();
    };
  }, [disconnect]);

  return { connectionState, isMuted, isTalking: connectionState === 'speaking', volume, error, connect, disconnect, toggleMute, stopListeningAndProcess, transcribedText };
}
