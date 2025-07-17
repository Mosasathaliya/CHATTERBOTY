'use client';

import React, { useRef, useEffect } from 'react';
import { useAgentStore } from '@/hooks/use-agent-store';

interface AgentAvatarProps {
  isTalking: boolean;
  volume: number;
}

const AgentAvatar: React.FC<AgentAvatarProps> = ({ isTalking, volume }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { currentAgentId, getAgentById } = useAgentStore();
  const agent = getAgentById(currentAgentId);
  const bodyColor = agent?.bodyColor || '#cccccc';
  const animationFrameId = useRef<number>();
  const lastBlinkTime = useRef<number>(Date.now());
  const nextBlinkInterval = useRef<number>(Math.random() * 4000 + 2000);
  const isBlinkingState = useRef<boolean>(false);
  const blinkDuration = 200;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    const resizeCanvas = () => {
        const size = Math.min(window.innerWidth * 0.8, window.innerHeight * 0.5, 400);
        canvas.width = size;
        canvas.height = size;
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const draw = (currentTime: number) => {
      time++;
      const { width, height } = canvas;
      const radius = width / 2.5;
      const centerX = width / 2;
      const centerY = height / 2;

      const floatY = Math.sin(time * 0.02) * 10;
      const tilt = isTalking ? Math.sin(time * 0.05) * 0.1 : 0;

      ctx.clearRect(0, 0, width, height);
      ctx.save();
      ctx.translate(centerX, centerY + floatY);
      ctx.rotate(tilt);

      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fillStyle = bodyColor;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 20;
      ctx.fill();
      ctx.shadowColor = 'transparent';

      const eyeRadiusX = radius * 0.15;
      const eyeRadiusY = radius * 0.2;
      const eyeOffsetX = radius * 0.4;
      const eyeOffsetY = -radius * 0.2;

      const now = Date.now();
      if (now - lastBlinkTime.current > nextBlinkInterval.current) {
        isBlinkingState.current = true;
        lastBlinkTime.current = now;
        nextBlinkInterval.current = Math.random() * 4000 + 2000;
      }
      
      let currentLidY = eyeRadiusY;
      if (isBlinkingState.current) {
        const blinkProgress = (now - lastBlinkTime.current) / blinkDuration;
        if (blinkProgress < 1) {
          const blinkValue = Math.sin(blinkProgress * Math.PI);
          currentLidY = eyeRadiusY * (1 - blinkValue);
        } else {
          isBlinkingState.current = false;
        }
      }

      const drawEye = (x: number) => {
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.ellipse(x, eyeOffsetY, eyeRadiusX, currentLidY, 0, 0, Math.PI * 2);
        ctx.fill();
      };
      
      drawEye(-eyeOffsetX);
      drawEye(eyeOffsetX);

      const mouthOffsetY = radius * 0.4;
      const mouthWidth = radius * 0.6;
      const mouthHeight = isTalking ? Math.max(1, volume * radius * 0.5) : 2;
      
      ctx.beginPath();
      ctx.ellipse(0, mouthOffsetY, mouthWidth / 2, mouthHeight / 2, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'white';
      ctx.fill();

      ctx.restore();
      animationFrameId.current = requestAnimationFrame(draw);
    };

    draw(0);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [bodyColor, isTalking, volume]);

  return <canvas ref={canvasRef} />;
};

export default AgentAvatar;
