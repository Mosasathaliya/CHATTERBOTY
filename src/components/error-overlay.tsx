import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface ErrorOverlayProps {
  message: string;
}

export default function ErrorOverlay({ message }: ErrorOverlayProps) {
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm bg-destructive/10 border-destructive">
        <CardHeader className="items-center text-center">
            <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
            <CardTitle className="text-destructive">An Error Occurred</CardTitle>
            <CardDescription className="text-destructive/80">
                Something went wrong. Please try refreshing the page.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-sm font-mono p-4 bg-destructive/20 rounded-md text-destructive-foreground break-words">
                {message}
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
