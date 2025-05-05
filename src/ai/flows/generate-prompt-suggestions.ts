'use server';
/**
 * @fileOverview Generates dynamic prompt customization suggestions based on project summary and content.
 *
 * - generatePromptSuggestions - A function that suggests ways to customize the final prompt.
 * - GeneratePromptSuggestionsInput - The input type for the generatePromptSuggestions function.
 * - GeneratePromptSuggestionsOutput - The return type for the generatePromptSuggestions function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

// Input schema for the prompt suggestion flow
const GeneratePromptSuggestionsInputSchema = z.object({
  combinedFileTextContent: z.string().describe('The combined extracted text content of the project files.'),
  projectSummary: z.string().describe('The AI-generated summary of the project data.'),
  industry: z.string().describe('The industry of the project.'),
});
export type GeneratePromptSuggestionsInput = z.infer<typeof GeneratePromptSuggestionsInputSchema>;

// Output schema for the prompt suggestion flow
const GeneratePromptSuggestionsOutputSchema = z.object({
  suggestions: z.array(z.string()).describe('A list of suggested customizations or details to add to the final prompt.'),
});
export type GeneratePromptSuggestionsOutput = z.infer<typeof GeneratePromptSuggestionsOutputSchema>;


// Publicly exported function to handle prompt suggestion generation
export async function generatePromptSuggestions(
  input: GeneratePromptSuggestionsInput
): Promise<GeneratePromptSuggestionsOutput> {
   return generatePromptSuggestionsFlow(input);
}


// Prompt for generating customization suggestions
const generateSuggestionsPrompt = ai.definePrompt({
  name: 'generateSuggestionsPrompt',
  input: { schema: GeneratePromptSuggestionsInputSchema },
  output: { schema: GeneratePromptSuggestionsOutputSchema },
  prompt: `You are an AI assistant helping a user create an optimized prompt for another AI model, focusing on the {{{industry}}} industry.
Based on the provided project summary and the combined text content from the uploaded files, generate a list of 3-5 insightful and relevant suggestions for how the user could *customize* the final prompt.
Focus on suggesting specific details, constraints, desired output formats, target audiences, or key performance indicators (KPIs) that could be added to make the final prompt more effective for the user's needs.

Project Summary:
\`\`\`
{{{projectSummary}}}
\`\`\`

Combined Project Data Content:
\`\`\`
{{{combinedFileTextContent}}}
\`\`\`

Generate a list of suggested prompt customizations (e.g., "Specify the target audience as non-technical managers", "Require the output in markdown format", "Emphasize cost-saving measures").`,
});

// Internal flow definition for generating suggestions
const generatePromptSuggestionsFlow = ai.defineFlow<
  typeof GeneratePromptSuggestionsInputSchema,
  typeof GeneratePromptSuggestionsOutputSchema
>({
  name: 'generatePromptSuggestionsFlow',
  inputSchema: GeneratePromptSuggestionsInputSchema,
  outputSchema: GeneratePromptSuggestionsOutputSchema,
},
async (input) => {
  const {output} = await generateSuggestionsPrompt(input);
  if (!output) {
    throw new Error("AI suggestion generation returned no output.");
  }
  // Ensure we always return an array, even if the AI fails to provide one
  return { suggestions: output.suggestions || [] };
});
