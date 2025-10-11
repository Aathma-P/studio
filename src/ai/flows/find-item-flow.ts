'use server';
/**
 * @fileOverview An AI flow for finding items in an image of a supermarket aisle.
 * 
 * - findItemInAisle - A function that handles the item finding process.
 * - FindItemInput - The input type for the findItemInAisle function.
 * - FindItemOutput - The return type for the findItemInAisle function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const FindItemInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a supermarket aisle, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  itemName: z.string().describe('The name of the item to find in the photo.'),
});
export type FindItemInput = z.infer<typeof FindItemInputSchema>;

const FindItemOutputSchema = z.object({
    isFound: z.boolean().describe('Whether or not the item was found in the image.'),
    guidance: z.string().describe('Instructions on where the item is located in the image (e.g., "middle shelf, to the right"). Null if not found.'),
});
export type FindItemOutput = z.infer<typeof FindItemOutputSchema>;

export async function findItemInAisle(input: FindItemInput): Promise<FindItemOutput> {
  return findItemFlow(input);
}

const prompt = ai.definePrompt({
  name: 'findItemPrompt',
  input: { schema: FindItemInputSchema },
  output: { schema: FindItemOutputSchema },
  prompt: `You are an expert at identifying products on a supermarket shelf. Your task is to determine if a specific item is present in the provided image.

User is looking for: {{{itemName}}}

Analyze the image and determine if "{{{itemName}}}" is visible.

- If you find the item, set "isFound" to true and provide brief, clear guidance on its location (e.g., "On the top shelf, to the left," or "In the middle of the shelf, next to the red boxes.").
- If the item is not in the image, set "isFound" to false and leave the guidance as an empty string.

Photo of the aisle: {{media url=photoDataUri}}`,
});

const findItemFlow = ai.defineFlow(
  {
    name: 'findItemFlow',
    inputSchema: FindItemInputSchema,
    outputSchema: FindItemOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
