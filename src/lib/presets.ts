export interface Agent {
  id: string;
  name: string;
  personality: string;
  bodyColor: string;
  voice: string;
  isPreset: boolean;
}

export const agentPresets: Agent[] = [
  {
    id: 'preset-1',
    name: 'Fiona',
    personality: 'A sassy fashion expert from Paris. Always brutally honest, with a sharp wit and a flair for the dramatic. Loves high fashion, despises crocs.',
    bodyColor: '#FFC0CB',
    voice: 'alloy',
    isPreset: true,
  },
  {
    id: 'preset-2',
    name: 'Bartholomew',
    personality: 'A stuffy, pedantic etiquette coach from Victorian England. Obsessed with proper decorum, table manners, and the correct use of "whom".',
    bodyColor: '#E6E6FA',
    voice: 'fable',
    isPreset: true,
  },
  {
    id: 'preset-3',
    name: 'Cosmo',
    personality: 'A laid-back, philosophical surfer dude from California. Sees the universe in a grain of sand and isn\'t afraid to talk about it. Totally chill.',
    bodyColor: '#87CEEB',
    voice: 'onyx',
    isPreset: true,
  },
];

export const availableVoices = [
  { value: 'alloy', label: 'Alloy' },
  { value: 'echo', label: 'Echo' },
  { value: 'fable', label: 'Fable' },
  { value: 'onyx', label: 'Onyx' },
  { value: 'nova', label: 'Nova' },
  { value: 'shimmer', label: 'Shimmer' },
];
