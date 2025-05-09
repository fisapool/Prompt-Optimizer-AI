'use server';

/**
 * @fileOverview Summarizes the timeline and potential bottlenecks of a marketing campaign plan.
 *
 * - summarizeCampaignTimeline - A function that handles the summarization process.
 * - SummarizeCampaignTimelineInput - The input type for the summarizeCampaignTimeline function.
 * - SummarizeCampaignTimelineOutput - The return type for the summarizeCampaignTimeline function.
 */

import {ai} from '../ai-instance';
import {z} from 'genkit';

const SummarizeCampaignTimelineInputSchema = z.object({
  campaignPlan: z
    .string()
    .describe(
      'The campaign plan file, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'  
    ),
});
export type SummarizeCampaignTimelineInput = z.infer<typeof SummarizeCampaignTimelineInputSchema>;

const SummarizeCampaignTimelineOutputSchema = z.object({
  summary: z.string().describe('A summary of the campaign timeline.'),
  bottlenecks: z.string().describe('Potential bottlenecks in the campaign.'),
});
export type SummarizeCampaignTimelineOutput = z.infer<typeof SummarizeCampaignTimelineOutputSchema>;

export async function summarizeCampaignTimeline(
  input: SummarizeCampaignTimelineInput
): Promise<SummarizeCampaignTimelineOutput> {
  return summarizeCampaignTimelineFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeCampaignTimelinePrompt',
  input: {
    schema: z.object({
      campaignPlan: z
        .string()
        .describe(
          'The campaign plan file, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'        
        ),
    }),
  },
  output: {
    schema: z.object({
      summary: z.string().describe('A summary of the campaign timeline.'),
      bottlenecks: z.string().describe('Potential bottlenecks in the campaign.'),
    }),
  },
  prompt: `You are an expert marketing project manager. Please provide a summary of the campaign timeline and identify potential bottlenecks based on the campaign plan provided.

Campaign Plan: {{media url=campaignPlan}}`,
});

const summarizeCampaignTimelineFlow = ai.defineFlow<
  typeof SummarizeCampaignTimelineInputSchema,
  typeof SummarizeCampaignTimelineOutputSchema
>(
  {
    name: 'summarizeCampaignTimelineFlow',
    inputSchema: SummarizeCampaignTimelineInputSchema,
    outputSchema: SummarizeCampaignTimelineOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
