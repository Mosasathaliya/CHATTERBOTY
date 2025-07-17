// src/ai/flows/contextualize-ai-persona.ts
'use server';
/**
 * @fileOverview This file defines a Genkit flow for contextualizing the AI persona based on user information.
 *
 * - contextualizeAIPersona - A function that takes user and agent information and returns a contextualized persona.
 * - ContextualizeAIPersonaInput - The input type for the contextualizeAIPersona function.
 * - ContextualizeAIPersonaOutput - The return type for the contextualizeAIPersona function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ContextualizeAIPersonaInputSchema = z.object({
  userName: z.string().describe('The name of the user.'),
  userInfo: z.string().describe('Information about the user, including likes, dislikes, and hobbies.'),
  agentPersonality: z.string().describe('The base personality of the AI agent.'),
});
export type ContextualizeAIPersonaInput = z.infer<typeof ContextualizeAIPersonaInputSchema>;

const ContextualizeAIPersonaOutputSchema = z.object({
  contextualizedPersona: z.string().describe('The contextualized persona for the AI agent.'),
});
export type ContextualizeAIPersonaOutput = z.infer<typeof ContextualizeAIPersonaOutputSchema>;

export async function contextualizeAIPersona(input: ContextualizeAIPersonaInput): Promise<ContextualizeAIPersonaOutput> {
  return contextualizeAIPersonaFlow(input);
}

const contextualizeAIPersonaPrompt = ai.definePrompt({
  name: 'contextualizeAIPersonaPrompt',
  input: {schema: ContextualizeAIPersonaInputSchema},
  output: {schema: ContextualizeAIPersonaOutputSchema},
  prompt: `You are an AI that specializes in creating personalized personas for AI agents.

Given the following user information and the base personality of an AI agent, create a contextualized persona that incorporates the user's information to make the agent's responses feel more natural and organic.

User Name: {{{userName}}}
User Information: {{{userInfo}}}
Agent Base Personality: {{{agentPersonality}}}

Contextualized Persona:`,
});

const contextualizeAIPersonaFlow = ai.defineFlow(
  {
    name: 'contextualizeAIPersonaFlow',
    inputSchema: ContextualizeAIPersonaInputSchema,
    outputSchema: ContextualizeAIPersonaOutputSchema,
  },
  async input => {
    const {output} = await contextualizeAIPersonaPrompt(input);
    return output!;
  }
);
