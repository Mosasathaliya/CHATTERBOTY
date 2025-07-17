'use server';
/**
 * @fileOverview A flow for converting speech to text.
 *
 * - speechToText - A function that takes audio data and returns the transcribed text.
 * - SpeechToTextInput - The input type for the speechToTtext function.
 * - SpeechToTextOutput - The return type for the speechToText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SpeechToTextInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "A recording of speech, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type SpeechToTextInput = z.infer<typeof SpeechToTextInputSchema>;

const SpeechToTextOutputSchema = z.object({
  text: z.string().describe('The transcribed text from the audio.'),
});
export type SpeechToTextOutput = z.infer<typeof SpeechToTextOutputSchema>;

export async function speechToText(input: SpeechToTextInput): Promise<SpeechToTextOutput> {
  return speechToTextFlow(input);
}

const speechToTextFlow = ai.defineFlow(
  {
    name: 'speechToTextFlow',
    inputSchema: SpeechToTextInputSchema,
    outputSchema: SpeechToTextOutputSchema,
  },
  async ({audioDataUri}) => {
    const {output} = await ai.generate({
      model: 'googleai/gemini-pro-vision',
      prompt: [
        {
          media: {
            url: audioDataUri,
          },
        },
        {
          text: 'Transcribe the audio. The transcription should not include any introductory text or labels, only the spoken words.',
        },
      ],
      config: {
        temperature: 0.1,
      },
    });

    return {
      text: output as string,
    };
  }
);
