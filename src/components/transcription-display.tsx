'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { ConnectionState } from '@/hooks/use-live-api';

interface TranscriptionDisplayProps {
  text: string;
  connectionState: ConnectionState;
}

export default function TranscriptionDisplay({ text, connectionState }: TranscriptionDisplayProps) {
  const show = connectionState === 'listening' || connectionState === 'processing';
  const displayText = text || 'Listening...';

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="mt-8 text-center"
        >
          <p className="text-xl sm:text-2xl lg:text-3xl font-medium text-foreground/80 max-w-2xl mx-auto">
            {displayText}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
