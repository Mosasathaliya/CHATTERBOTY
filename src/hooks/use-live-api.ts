'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from './use-toast';
import { useAgentStore } from './use-agent-store';
import { useUserStore } from './use-user-store';
import { personalizeAgentResponse } from '@/ai/flows/personalize-agent-response';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import { speechToText } from '@/ai/flows/speech-to-text';

const SILENCE_THRESHOLD = 0.01;
const SILENCE_DURATION_MS = 2000;

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
  const userAnalyserRef = useRef<AnalyserNode | null>(null);
  const agentAnalyserRef = useRef<AnalyserNode | null>(null);
  const agentAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const conversationHistory = useRef<string[]>([]);
  
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const cleanupAgentAudio = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (agentAudioSourceRef.current) {
      agentAudioSourceRef.current.stop();
      agentAudioSourceRef.current.disconnect();
      agentAudioSourceRef.current = null;
    }
    setIsTalking(false);
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
      animationFrameRef.current = requestAnimationFrame(getAgentVolume);
    }
  }, []);

  const playAudio = useCallback(async (audioDataUri: string) => {
    cleanupAgentAudio();
    if (!audioContextRef.current) return;
    const audioContext = audioContextRef.current;
    
    const response = await fetch(audioDataUri);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    agentAnalyserRef.current = audioContext.createAnalyser();
    agentAnalyserRef.current.fftSize = 256;

    agentAudioSourceRef.current = audioContext.createBufferSource();
    agentAudioSourceRef.current.buffer = audioBuffer;
    agentAudioSourceRef.current.connect(agentAnalyserRef.current);
    agentAnalyserRef.current.connect(audioContext.destination);

    setIsTalking(true);
    agentAudioSourceRef.current.start();
    getAgentVolume();

    agentAudioSourceRef.current.onended = () => {
      cleanupAgentAudio();
      isProcessingRef.current = false;
    };
  }, [cleanupAgentAudio, getAgentVolume]);

  const processAndRespond = useCallback(async (userInput: string) => {
    try {
      if (!userInput.trim()) return;

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
      if (conversationHistory.current.length > 4) {
        conversationHistory.current = conversationHistory.current.slice(-4);
      }

      const { audioDataUri } = await textToSpeech({ text: personalizedResponse, voice: agent.voice });
      
      playAudio(audioDataUri);

    } catch (err: any) {
      console.error("Error in conversation:", err);
      const errorMessage = err.message || "An unexpected error occurred during the conversation.";
      setError(errorMessage);
      toast({ title: "Conversation Error", description: errorMessage, variant: "destructive" });
      isProcessingRef.current = false;
    }
  }, [currentAgentId, getAgentById, userName, userDescription, toast, playAudio]);

  const handleAudioProcessing = useCallback(async (audioBlob: Blob) => {
    isProcessingRef.current = true;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64data = reader.result as string;
      try {
        const { text } = await speechToText({ audioDataUri: base64data });
        if (text) {
          await processAndRespond(text);
        } else {
          isProcessingRef.current = false; // No speech detected
        }
      } catch (err: any) {
        console.error("Error in speech-to-text:", err);
        toast({ title: "Speech-to-Text Error", description: err.message, variant: "destructive" });
        isProcessingRef.current = false;
      }
    };
    reader.readAsDataURL(audioBlob);
  }, [processAndRespond, toast]);

  const startRecording = useCallback((stream: MediaStream) => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioChunksRef.current = [];
        if (audioBlob.size > 100) { // Only process if there's some audio data
          handleAudioProcessing(audioBlob);
        } else {
            isProcessingRef.current = false;
        }
      };
      mediaRecorderRef.current.start(250); // Collect data in chunks
    }
  }, [handleAudioProcessing]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const monitorUserSilence = useCallback((stream: MediaStream) => {
    if (!audioContextRef.current) return;
    const source = audioContextRef.current.createMediaStreamSource(stream);
    userAnalyserRef.current = audioContextRef.current.createAnalyser();
    userAnalyserRef.current.fftSize = 256;
    source.connect(userAnalyserRef.current);
    
    const checkSilence = () => {
      if (isProcessingRef.current || isTalking || isMuted) {
        requestAnimationFrame(checkSilence);
        return;
      }

      if (userAnalyserRef.current) {
        const dataArray = new Uint8Array(userAnalyserRef.current.frequencyBinCount);
        userAnalyserRef.current.getByteTimeDomainData(dataArray);
        let sum = 0;
        for (const amp of dataArray) {
            sum += Math.pow(amp / 128.0 - 1, 2);
        }
        const rms = Math.sqrt(sum / dataArray.length);

        if (rms < SILENCE_THRESHOLD) {
            if (!silenceTimerRef.current) {
                silenceTimerRef.current = setTimeout(() => {
                    stopRecording();
                    silenceTimerRef.current = null;
                }, SILENCE_DURATION_MS);
            }
        } else {
            if (silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current);
                silenceTimerRef.current = null;
            }
            startRecording(stream);
        }
      }
      requestAnimationFrame(checkSilence);
    };

    checkSilence();
  }, [isMuted, isTalking, startRecording, stopRecording]);

  const connect = useCallback(async () => {
    if (isConnected) return;
    console.log('Connecting...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      setIsConnected(true);
      setError(null);
      toast({ title: "Connected", description: "You can start talking now." });
      conversationHistory.current = [];
      
      await processAndRespond("Hello!"); // Start with a greeting
      monitorUserSilence(stream);

    } catch (err) {
      console.error("Microphone access denied:", err);
      const errorMessage = "Microphone access is required. Please enable it in your browser settings.";
      setError(errorMessage);
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    }
  }, [toast, isConnected, processAndRespond, monitorUserSilence]);

  const disconnect = useCallback(() => {
    console.log('Disconnecting...');
    stopRecording();
    cleanupAgentAudio();
    if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
        audioContextRef.current = null;
    }
    setIsConnected(false);
    toast({ title: "Disconnected" });
  }, [toast, cleanupAgentAudio, stopRecording]);

  const toggleMute = useCallback(() => {
    if (isMuted) {
      toast({ title: "Unmuted", description: "The agent can hear you again." });
    } else {
      toast({ title: "Muted", description: "The agent can't hear you." });
      stopRecording();
      if(silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
    }
    setIsMuted(m => !m);
  }, [isMuted, stopRecording, toast]);

  useEffect(() => {
    return () => {
        disconnect();
    };
  }, [disconnect]);

  return { isConnected, isMuted, isTalking, volume, error, connect, disconnect, toggleMute };
}
