'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAgentStore } from '@/hooks/use-agent-store';
import { useUIStore } from '@/hooks/use-ui-store';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { availableVoices } from '@/lib/presets';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  personality: z.string().min(10, 'Personality must be at least 10 characters.'),
  bodyColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color.'),
  voice: z.string(),
});

export default function AgentEditModal() {
  const { currentAgentId, getAgentById, updateCurrentAgent } = useAgentStore();
  const { showAgentEdit, setShowAgentEdit } = useUIStore();
  const currentAgent = getAgentById(currentAgentId);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      personality: '',
      bodyColor: '#ffffff',
      voice: 'alloy',
    },
  });

  useEffect(() => {
    if (currentAgent) {
      form.reset({
        name: currentAgent.name,
        personality: currentAgent.personality,
        bodyColor: currentAgent.bodyColor,
        voice: currentAgent.voice,
      });
    }
  }, [currentAgent, form, showAgentEdit]);


  function onSubmit(values: z.infer<typeof formSchema>) {
    updateCurrentAgent(values);
    setShowAgentEdit(false);
  }
  
  return (
    <Dialog open={showAgentEdit} onOpenChange={setShowAgentEdit}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Agent</DialogTitle>
          <DialogDescription>
            Customize your agent's personality and appearance.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Agent's Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="personality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Personality</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the agent's personality..."
                      className="resize-none h-32"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <div className="flex items-end space-x-2">
                <FormField
                  control={form.control}
                  name="bodyColor"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Body Color</FormLabel>
                      <FormControl>
                        <Input type="text" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bodyColor"
                  render={({ field }) => (
                    <FormItem>
                       <FormControl>
                        <Input type="color" className="w-12 h-10 p-1" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
            </div>
            <FormField
              control={form.control}
              name="voice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Voice</FormLabel>
                   <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a voice" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableVoices.map((voice) => (
                        <SelectItem key={voice.value} value={voice.value}>
                          {voice.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
