'use server';
/**
 * @fileOverview Analyzes project data from uploaded files using AI. The AI can answer questions about the project to provide the user with insights and identify potential issues.
 *
 * - analyzeProjectData - A function that handles the project data analysis process.
 * - AnalyzeProjectDataInput - The input type for the analyzeProjectData function.
 * - AnalyzeProjectDataOutput - The return type for the analyzeProjectData function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const AnalyzeProjectDataInputSchema = z.object({
  fileDataUri: z
    .string()
    .describe(
      "A project management file, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  question: z.string().describe('The question to ask about the project data.'),
  industry: z.string().describe('The industry of the project.'),
});
export type AnalyzeProjectDataInput = z.infer<typeof AnalyzeProjectDataInputSchema>;

const AnalyzeProjectDataOutputSchema = z.object({
  answer: z.string().describe('The answer to the question about the project data.'),
});
export type AnalyzeProjectDataOutput = z.infer<typeof AnalyzeProjectDataOutputSchema>;

export async function analyzeProjectData(input: AnalyzeProjectDataInput): Promise<AnalyzeProjectDataOutput> {
  return analyzeProjectDataFlow(input);
}

const analyzeProjectDataPrompt = ai.definePrompt({
  name: 'analyzeProjectDataPrompt',
  input: {
    schema: z.object({
      fileDataUri: z
        .string()
        .describe(
          "A project management file, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
        ),
      question: z.string().describe('The question to ask about the project data.'),
      industry: z.string().describe('The industry of the project.'),
    }),
  },
  output: {
    schema: z.object({
      answer: z.string().describe('The answer to the question about the project data.'),
    }),
  },
  prompt: `You are an AI assistant specialized in project management for the {{{industry}}} industry. Analyze the project data provided and answer the user's question.

Project Data: {{media url=fileDataUri}}

Question: {{{question}}}

Answer: `,
});

const analyzeProjectDataFlow = ai.defineFlow<
  typeof AnalyzeProjectDataInputSchema,
  typeof AnalyzeProjectDataOutputSchema
>({
  name: 'analyzeProjectDataFlow',
  inputSchema: AnalyzeProjectDataInputSchema,
  outputSchema: AnalyzeProjectDataOutputSchema,
},
async input => {
  const {output} = await analyzeProjectDataPrompt(input);
  return output!;
});

