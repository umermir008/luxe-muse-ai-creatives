'use server';

/**
 * @fileOverview An AI agent that enhances text prompts with style-related keywords.
 *
 * - enhancePrompt - A function that enhances the prompt.
 * - EnhancePromptInput - The input type for the enhancePrompt function.
 * - EnhancePromptOutput - The return type for the enhancePrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EnhancePromptInputSchema = z.object({
  prompt: z.string().describe('The original text prompt to be enhanced.'),
});
export type EnhancePromptInput = z.infer<typeof EnhancePromptInputSchema>;

const EnhancePromptOutputSchema = z.object({
  enhancedPrompt: z
    .string()
    .describe('The enhanced text prompt with style-related keywords.'),
});
export type EnhancePromptOutput = z.infer<typeof EnhancePromptOutputSchema>;

export async function enhancePrompt(input: EnhancePromptInput): Promise<EnhancePromptOutput> {
  return enhancePromptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'enhancePromptPrompt',
  input: {schema: EnhancePromptInputSchema},
  output: {schema: EnhancePromptOutputSchema},
  prompt: `You are an AI prompt enhancer. You will be given a text prompt and you will enhance it by adding style-related keywords to make it more specific and aligned with a luxury aesthetic.

Original Prompt: {{{prompt}}}

Enhanced Prompt:`, // Keep the 'Enhanced Prompt:' at the end to guide the model's output
});

const enhancePromptFlow = ai.defineFlow(
  {
    name: 'enhancePromptFlow',
    inputSchema: EnhancePromptInputSchema,
    outputSchema: EnhancePromptOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
