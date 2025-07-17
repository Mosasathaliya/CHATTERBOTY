# **App Name**: ChatterBots

## Core Features:

- Live Voice Chat: Real-time voice conversation with customizable AI agents, using microphone input and speaker output.
- Animated Agent: Animated agent face that responds to audio volume, with blinking and tilting animations to bring the Agent to life
- Agent Customization: Agent customization modal allowing users to modify agent name, personality, body color, and voice; Agents persist for the user's session only
- Dynamic Personality: Generative AI tool that uses the Agent's personality to define how the Agent should respond to voice prompts.
- User Personalization: User settings modal with fields for user name and info to personalize the system prompt for the AI.
- App Header: UI for the header containing Agent selection dropdown, Agent Edit button and a User Settings button
- Voice Controls: A control tray with the ability to connect and disconnect, or mute and unmute.

## Style Guidelines:

- Primary color: Deep purple (#6750A4) for a modern and engaging feel.
- Background color: Dark gray (#121212) to reduce eye strain in a modern, dark-themed interface.
- Accent color: Teal (#00A9B5) for interactive elements, providing good contrast and clear affordance.
- Body and headline font: 'Google Sans' for a modern, clean and readable UI. Note: currently only Google Fonts are supported.
- Code font: 'Space Mono' for displaying any code snippets or technical information. Note: currently only Google Fonts are supported.
- Use Material Symbols for consistent and modern iconography throughout the application.
- A centered layout to make the agent always be in the center of attention.
- Implement floating, blinking, and lip-sync animations on the agent using requestAnimationFrame().