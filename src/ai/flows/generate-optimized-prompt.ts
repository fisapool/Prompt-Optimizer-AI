'use server';
/**
 * @fileOverview Generates an optimized prompt based on project summary, content, and customizations.
 *
 * - generateOptimizedPrompt - A function that creates a final optimized prompt.
 * - GenerateOptimizedPromptInput - The input type for the generateOptimizedPrompt function.
 * - GenerateOptimizedPromptOutput - The return type for the generateOptimizedPrompt function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

// Input schema for the optimized prompt flow
const GenerateOptimizedPromptInputSchema = z.object({
  industry: z.string().describe('The industry of the project.'),
  projectSummary: z.string().describe('The AI-generated summary of the project data.'),
  combinedFileTextContent: z.array(z.string()).describe('The extracted text content of the project files.'),
  customizations: z.array(z.string()).describe('List of customizations to apply to the prompt.'),
});
export type GenerateOptimizedPromptInput = z.infer<typeof GenerateOptimizedPromptInputSchema>;

// Output schema for the optimized prompt flow
const GenerateOptimizedPromptOutputSchema = z.object({
  optimizedPrompt: z.string().describe('The final optimized prompt incorporating all customizations and context.'),
});
export type GenerateOptimizedPromptOutput = z.infer<typeof GenerateOptimizedPromptOutputSchema>;

// Publicly exported function to handle optimized prompt generation
export async function generateOptimizedPrompt(
  input: GenerateOptimizedPromptInput
): Promise<GenerateOptimizedPromptOutput> {
  return generateOptimizedPromptFlow(input);
}

// Prompt for generating the optimized prompt
const generateOptimizedPromptPrompt = ai.definePrompt({
  name: 'generateOptimizedPromptPrompt',
  input: { schema: GenerateOptimizedPromptInputSchema },
  output: { schema: GenerateOptimizedPromptOutputSchema },
  prompt: `You are an AI assistant helping to create an optimized prompt for another AI model, focusing on the {{{industry}}} industry.
Based on the provided project summary, file contents, and customizations, generate a comprehensive and well-structured prompt that incorporates all the specified requirements and customizations.

Project Summary:
\`\`\`
{{{projectSummary}}}
\`\`\`

Project File Contents:
\`\`\`
{{{combinedFileTextContent}}}
\`\`\`

Required Customizations:
\`\`\`
{{{customizations}}}
\`\`\`

Generate a well-structured prompt that:
1. Clearly states the objective and context
2. Incorporates all specified customizations
3. Provides necessary context from the project files
4. Uses clear formatting and structure
5. Includes any relevant constraints or requirements
6. Specifies the desired output format and style`,
});

// Internal flow definition for generating the optimized prompt
const generateOptimizedPromptFlow = ai.defineFlow<
  typeof GenerateOptimizedPromptInputSchema,
  typeof GenerateOptimizedPromptOutputSchema
>({
  name: 'generateOptimizedPromptFlow',
  inputSchema: GenerateOptimizedPromptInputSchema,
  outputSchema: GenerateOptimizedPromptOutputSchema,
},
async (input) => {
  const {output} = await generateOptimizedPromptPrompt(input);
  if (!output) {
    throw new Error("AI prompt generation returned no output.");
  }
  return { optimizedPrompt: output.optimizedPrompt };
});
