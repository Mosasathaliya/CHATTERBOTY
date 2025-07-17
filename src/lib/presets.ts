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
    voice: 'Zephyr',
    isPreset: true,
  },
  {
    id: 'preset-2',
    name: 'Bartholomew',
    personality: 'A stuffy, pedantic etiquette coach from Victorian England. Obsessed with proper decorum, table manners, and the correct use of "whom".',
    bodyColor: '#E6E6FA',
    voice: 'Puck',
    isPreset: true,
  },
  {
    id: 'preset-3',
    name: 'Cosmo',
    personality: 'A laid-back, philosophical surfer dude from California. Sees the universe in a grain of sand and isn\'t afraid to talk about it. Totally chill.',
    bodyColor: '#87CEEB',
    voice: 'Umbriel',
    isPreset: true,
  },
];

export const availableVoices = [
    { value: 'Achernar', label: 'Achernar' },
    { value: 'Achird', label: 'Achird' },
    { value: 'Algenib', label: 'Algenib' },
    { value: 'Algieba', label: 'Algieba' },
    { value: 'Alnilam', label: 'Alnilam' },
    { value: 'Aoede', label: 'Aoede' },
    { value: 'Autonoe', label: 'Autonoe' },
    { value: 'Callirrhoe', label: 'Callirrhoe' },
    { value: 'Charon', label: 'Charon' },
    { value: 'Despina', label: 'Despina' },
    { value: 'Enceladus', label: 'Enceladus' },
    { value: 'Erinome', label: 'Erinome' },
    { value: 'Fenrir', label: 'Fenrir' },
    { value: 'Gacrux', label: 'Gacrux' },
    { value: 'Iapetus', label: 'Iapetus' },
    { value: 'Kore', label: 'Kore' },
    { value: 'Laomedeia', label: 'Laomedeia' },
    { value: 'Leda', label: 'Leda' },
    { value: 'Orus', label: 'Orus' },
    { value: 'Puck', label: 'Puck' },
    { value: 'Pulcherrima', label: 'Pulcherrima' },
    { value: 'Rasalgethi', label: 'Rasalgethi' },
    { value: 'Sadachbia', label: 'Sadachbia' },
    { value: 'Sadaltager', label: 'Sadaltager' },
    { value: 'Schedar', label: 'Schedar' },
    { value: 'Sulafat', label: 'Sulafat' },
    { value: 'Umbriel', label: 'Umbriel' },
    { value: 'Vindemiatrix', label: 'Vindemiatrix' },
    { value: 'Zephyr', label: 'Zephyr' },
    { value: 'Zubenelgenubi', label: 'Zubenelgenubi' },
];
