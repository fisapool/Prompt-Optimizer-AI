'use server';
/**
 * @fileOverview Generates dynamic prompt suggestions based on project summary and content.
 *
 * - generatePromptSuggestions - A function that suggests questions to ask about the project.
 * - GeneratePromptSuggestionsInput - The input type for the generatePromptSuggestions function.
 * - GeneratePromptSuggestionsOutput - The return type for the generatePromptSuggestions function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

// Input schema for the prompt generation flow
const GeneratePromptSuggestionsInputSchema = z.object({
  combinedFileTextContent: z.string().describe('The combined extracted text content of the project files.'),
  projectSummary: z.string().describe('The AI-generated summary of the project data.'),
  industry: z.string().describe('The industry of the project.'),
});
export type GeneratePromptSuggestionsInput = z.infer<typeof GeneratePromptSuggestionsInputSchema>;

// Output schema for the prompt generation flow
const GeneratePromptSuggestionsOutputSchema = z.object({
  suggestions: z.array(z.string()).describe('A list of suggested questions to ask about the project data.'),
});
export type GeneratePromptSuggestionsOutput = z.infer<typeof GeneratePromptSuggestionsOutputSchema>;


// Publicly exported function to handle prompt suggestion generation
export async function generatePromptSuggestions(
  input: GeneratePromptSuggestionsInput
): Promise<GeneratePromptSuggestionsOutput> {
   return generatePromptSuggestionsFlow(input);
}


// Prompt for generating suggestions
const generateSuggestionsPrompt = ai.definePrompt({
  name: 'generateSuggestionsPrompt',
  input: { schema: GeneratePromptSuggestionsInputSchema },
  output: { schema: GeneratePromptSuggestionsOutputSchema },
  prompt: `You are an AI assistant helping a user understand their project data in the {{{industry}}} industry.
Based on the provided project summary and the combined text content from the uploaded files, generate a list of 3-5 insightful and relevant questions the user could ask to further explore the data.
Focus on questions that go beyond simple retrieval and encourage deeper analysis, risk identification, or clarification of key aspects mentioned in the summary or content.

Project Summary:
\`\`\`
{{{projectSummary}}}
\`\`\`

Combined Project Data Content:
\`\`\`
{{{combinedFileTextContent}}}
\`\`\`

Generate a list of suggested questions.`,
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
