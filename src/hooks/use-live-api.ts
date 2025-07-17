
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from './use-toast';
import { useAgentStore } from './use-agent-store';
import { useUserStore } from './use-user-store';
import { personalizeAgentResponse } from '@/ai/flows/personalize-agent-response';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import { speechToText } from '@/ai/flows/speech-to-text';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'listening' | 'processing' | 'speaking';

const SILENCE_THRESHOLD = 0.01;
const SILENCE_DURATION_MS = 1500; // 1.5 seconds of silence to trigger processing

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
  const agentAudioAnimationId = useRef<number | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mimeTypeRef = useRef<string>('');

  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isSpeakingRef = useRef<boolean>(false);
  const processorNodeRef = useRef<ScriptProcessorNode | null>(null);
  
  const cleanupAgentAudio = useCallback(() => {
    if (agentAudioAnimationId.current) {
      cancelAnimationFrame(agentAudioAnimationId.current);
      agentAudioAnimationId.current = null;
    }
    if (agentAudioSourceRef.current) {
      try {
        agentAudioSourceRef.current.stop();
      } catch (e) {
        // ignore if already stopped
      }
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
      agentAudioAnimationId.current = requestAnimationFrame(getAgentVolume);
    }
  }, []);

  const playAudio = useCallback(async (audioDataUri: string) => {
    cleanupAgentAudio();
    if (!audioContextRef.current) return;
    const audioContext = audioContextRef.current;
    
    setConnectionState('speaking');

    try {
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
          setConnectionState('listening');
        };
    } catch (err: any) {
        console.error("Error playing audio:", err);
        setError(err.message || "An unexpected error occurred while playing audio.");
        setConnectionState('listening');
    }
  }, [cleanupAgentAudio, getAgentVolume]);

  const processAndRespond = useCallback(async (userInput: string) => {
    if (!userInput.trim()) {
      setConnectionState('listening');
      return;
    };

    setConnectionState('processing');
    try {
      const agent = getAgentById(currentAgentId);
      if (!agent) throw new Error('Agent not found');

      const response = await personalizeAgentResponse({
        agentPersonality: agent.personality,
        userInput: userInput,
        userName,
        userDescription,
      });

      const { personalizedResponse } = response;
      const { audioDataUri } = await textToSpeech({ text: personalizedResponse, voice: agent.voice });
      
      await playAudio(audioDataUri);

    } catch (err: any) {
      console.error("Error in conversation:", err);
      const errorMessage = err.message || "An unexpected error occurred during the conversation.";
      setError(errorMessage);
      toast({ title: "Conversation Error", description: errorMessage, variant: "destructive" });
      setConnectionState('listening');
    }
  }, [currentAgentId, getAgentById, userName, userDescription, toast, playAudio]);

  const stopRecordingAndProcess = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
    }
    if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
    }
    isSpeakingRef.current = false;
  }, []);

  const handleAudioProcessing = useCallback(async (audioBlob: Blob) => {
    if (audioBlob.size < 1000) {
        setConnectionState('listening');
        return;
    }
    setConnectionState('processing');
    setTranscribedText('Processing...');
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64data = reader.result as string;
      try {
        const { text } = await speechToText({ 
          audioDataUri: base64data,
          mimeType: mimeTypeRef.current,
        });

        if (text && text.trim()) {
          setTranscribedText(text);
          await processAndRespond(text);
        } else {
          setTranscribedText('');
          toast({ title: "I didn't catch that", description: "Could you please try again?", variant: "default" });
          setConnectionState('listening');
        }
      } catch (err: any) {
        console.error("Error in speech-to-text:", err);
        toast({ title: "Speech-to-Text Error", description: err.message, variant: "destructive" });
        setConnectionState('listening');
      }
    };
    reader.readAsDataURL(audioBlob);
  }, [processAndRespond, toast]);

  const startRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'inactive' && !isMuted) {
        setTranscribedText('Listening...');
        audioChunksRef.current = [];
        mediaRecorderRef.current.start(100); // Collect data in chunks
    }
  }, [isMuted]);

  const connect = useCallback(async () => {
    if (connectionState !== 'disconnected') return;
    setConnectionState('connecting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      userMediaStreamRef.current = stream;
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      processorNodeRef.current = audioContextRef.current.createScriptProcessor(1024, 1, 1);
      source.connect(processorNodeRef.current);
      processorNodeRef.current.connect(audioContextRef.current.destination);
      
      processorNodeRef.current.onaudioprocess = (e) => {
        if (isMuted || connectionState === 'speaking' || connectionState === 'processing') return;

        const inputData = e.inputBuffer.getChannelData(0);
        let sum = 0.0;
        for (let i = 0; i < inputData.length; ++i) {
          sum += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sum / inputData.length);
        
        if (rms > SILENCE_THRESHOLD) {
          if (!isSpeakingRef.current) {
            isSpeakingRef.current = true;
            startRecording();
          }
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
        } else if (isSpeakingRef.current) {
          if (!silenceTimerRef.current) {
            silenceTimerRef.current = setTimeout(() => {
              stopRecordingAndProcess();
            }, SILENCE_DURATION_MS);
          }
        }
      };

      const options = { mimeType: 'audio/webm;codecs=opus' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          console.warn(`${options.mimeType} is not supported. Falling back to default.`);
          options.mimeType = 'audio/webm';
      }
      mediaRecorderRef.current = new MediaRecorder(stream, options);
      mimeTypeRef.current = options.mimeType;

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeTypeRef.current });
        handleAudioProcessing(audioBlob);
      };
      
      setConnectionState('connected');
      setError(null);
      
      const agent = getAgentById(currentAgentId);
      const initialGreeting = "Hello! How can I help you today?";
      const { audioDataUri } = await textToSpeech({ text: initialGreeting, voice: agent?.voice || 'Zephyr' });
      await playAudio(audioDataUri);

    } catch (err) {
      console.error("Microphone access denied:", err);
      const errorMessage = "Microphone access is required. Please enable it in your browser settings.";
      setError(errorMessage);
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
      setConnectionState('disconnected');
    }
  }, [toast, currentAgentId, getAgentById, playAudio, handleAudioProcessing, startRecording, stopRecordingAndProcess, isMuted, connectionState]);

  const disconnect = useCallback(() => {
    if (connectionState === 'disconnected') return;
    stopRecordingAndProcess();
    cleanupAgentAudio();
    if (userMediaStreamRef.current) {
        userMediaStreamRef.current.getTracks().forEach(track => track.stop());
        userMediaStreamRef.current = null;
    }
    if(processorNodeRef.current) {
      processorNodeRef.current.disconnect();
      processorNodeRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
        audioContextRef.current = null;
    }
    mediaRecorderRef.current = null;
    setConnectionState('disconnected');
    setTranscribedText('');
    toast({ title: "Disconnected" });
  }, [connectionState, toast, cleanupAgentAudio, stopRecordingAndProcess]);

  const toggleMute = useCallback(() => setIsMuted(m => !m), []);
  
  const handleMainButton = () => {
    if (connectionState === 'disconnected') {
      connect();
    } else {
      disconnect();
    }
  };
  
  const stopListeningAndProcessManual = () => {
      if (connectionState === 'listening' && isSpeakingRef.current) {
          stopRecordingAndProcess();
      }
  }

  useEffect(() => {
    return () => {
      if (connectionState !== 'disconnected') {
        disconnect();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { 
    connectionState, 
    isMuted, 
    isTalking: connectionState === 'speaking', 
    volume, 
    error, 
    connect, 
    disconnect, 
    toggleMute, 
    stopListeningAndProcess: stopListeningAndProcessManual,
    transcribedText,
    handleMainButton,
  };
}
