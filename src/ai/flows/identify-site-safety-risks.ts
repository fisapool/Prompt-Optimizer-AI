// src/ai/flows/identify-site-safety-risks.ts
'use server';

/**
 * @fileOverview Identifies site safety risks and regulatory deadlines from construction blueprints.
 *
 * - identifySiteSafetyRisks - A function that handles the identification of site safety risks.
 * - IdentifySiteSafetyRisksInput - The input type for the identifySiteSafetyRisks function.
 * - IdentifySiteSafetyRisksOutput - The return type for the identifySiteSafetyRisks function.
 */

import {ai} from '../ai-instance';
import {z} from 'genkit';

const IdentifySiteSafetyRisksInputSchema = z.object({
  blueprintDataUri: z
    .string()
    .describe(
      "A construction blueprint, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  description: z.string().describe('The description of the construction site.'),
});
export type IdentifySiteSafetyRisksInput = z.infer<typeof IdentifySiteSafetyRisksInputSchema>;

const IdentifySiteSafetyRisksOutputSchema = z.object({
  safetyRisks: z
    .array(z.string())
    .describe('A list of potential safety risks identified on the construction site.'),
  regulatoryDeadlines: z
    .array(z.string())
    .describe('A list of regulatory deadlines relevant to the construction site.'),
});
export type IdentifySiteSafetyRisksOutput = z.infer<typeof IdentifySiteSafetyRisksOutputSchema>;

export async function identifySiteSafetyRisks(
  input: IdentifySiteSafetyRisksInput
): Promise<IdentifySiteSafetyRisksOutput> {
  return identifySiteSafetyRisksFlow(input);
}

const identifySiteSafetyRisksPrompt = ai.definePrompt({
  name: 'identifySiteSafetyRisksPrompt',
  input: {
    schema: z.object({
      blueprintDataUri: z
        .string()
        .describe(
          "A construction blueprint, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
        ),
      description: z.string().describe('The description of the construction site.'),
    }),
  },
  output: {
    schema: z.object({
      safetyRisks: z
        .array(z.string())
        .describe('A list of potential safety risks identified on the construction site.'),
      regulatoryDeadlines: z
        .array(z.string())
        .describe('A list of regulatory deadlines relevant to the construction site.'),
    }),
  },
  prompt: `You are a construction site safety expert. You will analyze the provided blueprint and description to identify potential safety risks and regulatory deadlines.

Description: {{{description}}}
Blueprint: {{media url=blueprintDataUri}}

Provide a list of safety risks and a list of regulatory deadlines.`,
});

const identifySiteSafetyRisksFlow = ai.defineFlow<
  typeof IdentifySiteSafetyRisksInputSchema,
  typeof IdentifySiteSafetyRisksOutputSchema
>({
  name: 'identifySiteSafetyRisksFlow',
  inputSchema: IdentifySiteSafetyRisksInputSchema,
  outputSchema: IdentifySiteSafetyRisksOutputSchema,
},
async input => {
  const {output} = await identifySiteSafetyRisksPrompt(input);
  return output!;
});
