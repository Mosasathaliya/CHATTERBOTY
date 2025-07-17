'use server';
/**
 * @fileOverview A flow for converting speech to text, with support for streaming.
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
  mimeType: z
    .string()
    .describe('The MIME type of the audio data (e.g., "audio/webm").'),
  onChunk: z
    .function()
    .args(z.string())
    .returns(z.void())
    .optional()
    .describe('A callback function to handle streaming text chunks.'),
});
export type SpeechToTextInput = z.infer<typeof SpeechToTextInputSchema>;

const SpeechToTextOutputSchema = z.object({
  text: z.string().describe('The final transcribed text from the audio.'),
});
export type SpeechToTextOutput = z.infer<typeof SpeechToTextOutputSchema>;

export async function speechToText(
  input: SpeechToTextInput
): Promise<SpeechToTextOutput> {
  return speechToTextFlow(input);
}

const speechToTextFlow = ai.defineFlow(
  {
    name: 'speechToTextFlow',
    inputSchema: SpeechToTextInputSchema,
    outputSchema: SpeechToTextOutputSchema,
  },
  async ({audioDataUri, mimeType, onChunk}) => {
    const {stream, response} = ai.generate({
      model: 'googleai/gemini-1.5-pro-latest',
      prompt: {
        media: {
          url: audioDataUri,
          contentType: mimeType,
        },
        text: 'Transcribe the audio. The transcription should not include any introductory text or labels, only the spoken words.',
      },
      config: {
        temperature: 0.1,
      },
      stream: true,
    });

    let fullText = '';
    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) {
        fullText += text;
        onChunk?.(text);
      }
    }

    // A final check on the completed response object in case of non-streaming results.
    const finalResponse = await response;
    const finalText = finalResponse.text;

    if (!fullText && finalText) {
      onChunk?.(finalText);
      return {text: finalText};
    }

    return {text: fullText};
  }
);
