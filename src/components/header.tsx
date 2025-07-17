'use client';

import React from 'react';
import { useAgentStore } from '@/hooks/use-agent-store';
import { useUIStore } from '@/hooks/use-ui-store';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Edit, SlidersHorizontal, PlusCircle } from 'lucide-react';
import type { Agent } from '@/lib/presets';

export default function Header() {
  const { currentAgentId, presets, personalAgents, setCurrentAgentId, getAgentById, addPersonalAgent } = useAgentStore();
  const { setShowAgentEdit, setShowUserConfig } = useUIStore();
  const currentAgent = getAgentById(currentAgentId);

  const handleCreateNew = () => {
    const newAgent: Agent = {
      id: `personal-${Date.now()}`,
      name: 'New Agent',
      personality: 'A blank slate, ready for a new personality.',
      bodyColor: '#cccccc',
      voice: 'alloy',
      isPreset: false,
    };
    addPersonalAgent(newAgent);
    setCurrentAgentId(newAgent.id);
    setShowAgentEdit(true);
  };

  return (
    <header className="w-full flex justify-between items-center px-4 py-2 absolute top-0 left-0 z-10">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="text-2xl font-headline font-bold">
            {currentAgent?.name || 'Select Agent'}
            <ChevronDown className="ml-2 h-6 w-6" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Preset Agents</DropdownMenuLabel>
            {presets.map((agent) => (
              <DropdownMenuItem key={agent.id} onSelect={() => setCurrentAgentId(agent.id)}>
                {agent.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
          {personalAgents.length > 0 && (
            <DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>My Agents</DropdownMenuLabel>
              {personalAgents.map((agent) => (
                <DropdownMenuItem key={agent.id} onSelect={() => setCurrentAgentId(agent.id)}>
                  {agent.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          )}
          <DropdownMenuSeparator />
           <DropdownMenuItem onSelect={handleCreateNew} className="cursor-pointer">
            <PlusCircle className="mr-2 h-4 w-4" />
            <span>Create New Agent</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm" onClick={() => setShowAgentEdit(true)} disabled={!currentAgent}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Agent
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setShowUserConfig(true)}>
          <SlidersHorizontal className="h-5 w-5" />
          <span className="sr-only">User Settings</span>
        </Button>
      </div>
    </header>
  );
}
