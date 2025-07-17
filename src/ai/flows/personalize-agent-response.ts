// 'use server';
/**
 * @fileOverview An AI agent that personalizes responses based on a defined personality.
 *
 * - personalizeAgentResponse - A function that personalizes the agent's response.
 * - PersonalizeAgentResponseInput - The input type for the personalizeAgentResponse function.
 * - PersonalizeAgentResponseOutput - The return type for the personalizeAgentResponse function.
 */

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizeAgentResponseInputSchema = z.object({
  agentPersonality: z.string().describe('The personality of the AI agent.'),
  userInput: z.string().describe('The user input to respond to.'),
  userName: z.string().describe('The name of the user.'),
  userDescription: z.string().describe('A description of the user, including likes, dislikes, and hobbies.'),
});

export type PersonalizeAgentResponseInput = z.infer<
  typeof PersonalizeAgentResponseInputSchema
>;

const PersonalizeAgentResponseOutputSchema = z.object({
  personalizedResponse: z
    .string()
    .describe('The AI agent response personalized based on the agent personality.'),
});

export type PersonalizeAgentResponseOutput = z.infer<
  typeof PersonalizeAgentResponseOutputSchema
>;

export async function personalizeAgentResponse(
  input: PersonalizeAgentResponseInput
): Promise<PersonalizeAgentResponseOutput> {
  return personalizeAgentResponseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizeAgentResponsePrompt',
  input: {schema: PersonalizeAgentResponseInputSchema},
  output: {schema: PersonalizeAgentResponseOutputSchema},
  prompt: `You are an AI agent with the following personality: {{{agentPersonality}}}.

A user named {{{userName}}}, who {{{userDescription}}}, has sent you the following input:

"""
{{{userInput}}}
"""

Respond to the user in a way that is consistent with your personality. The response should be engaging and tailored to the user. Keep your response concise.
`,
});

const personalizeAgentResponseFlow = ai.defineFlow(
  {
    name: 'personalizeAgentResponseFlow',
    inputSchema: PersonalizeAgentResponseInputSchema,
    outputSchema: PersonalizeAgentResponseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
