import { create } from 'zustand';
import { agentPresets, type Agent } from '@/lib/presets';

interface AgentState {
  currentAgentId: string;
  presets: Agent[];
  personalAgents: Agent[];
  setCurrentAgentId: (id: string) => void;
  updateCurrentAgent: (agentData: Partial<Omit<Agent, 'id' | 'isPreset'>>) => void;
  addPersonalAgent: (agent: Agent) => void;
  getAgentById: (id: string) => Agent | undefined;
}

export const useAgentStore = create<AgentState>((set, get) => ({
  currentAgentId: agentPresets[0].id,
  presets: agentPresets,
  personalAgents: [],
  setCurrentAgentId: (id) => set({ currentAgentId: id }),
  updateCurrentAgent: (agentData) => {
    set((state) => {
      const currentAgent = state.presets.find(a => a.id === state.currentAgentId) || state.personalAgents.find(a => a.id === state.currentAgentId);
      
      if (!currentAgent) return state;

      if (currentAgent.isPreset) {
        const newPersonalAgent: Agent = { 
          ...currentAgent,
          ...agentData, 
          isPreset: false, 
          id: `personal-${Date.now()}` 
        };
        return {
          personalAgents: [...state.personalAgents, newPersonalAgent],
          currentAgentId: newPersonalAgent.id,
        };
      } else {
        return {
          personalAgents: state.personalAgents.map((a) =>
            a.id === state.currentAgentId ? { ...a, ...agentData } : a
          ),
        };
      }
    });
  },
  addPersonalAgent: (agent) => {
    set((state) => ({ 
      personalAgents: [...state.personalAgents, agent] 
    }));
  },
  getAgentById: (id) => {
    const { presets, personalAgents } = get();
    return [...presets, ...personalAgents].find(a => a.id === id);
  },
}));
