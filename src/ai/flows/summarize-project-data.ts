'use server';
/**
 * @fileOverview Summarizes project data from multiple uploaded files based on the specified industry.
 *
 * - summarizeProjectData - A function that handles the project data summarization process.
 * - SummarizeProjectDataInput - The input type for the summarizeProjectData function.
 * - SummarizeProjectDataOutput - The return type for the summarizeProjectData function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

// Re-use FileInput schema structure (or import if separated)
// Note: While the UI extracts text beforehand, this flow's internal prompt
// still expects data URIs via the `files` array for consistency with its current implementation.
// A future refactor could simplify this to accept only combined text.
const FileInputSchema = z.object({
  fileDataUri: z
    .string()
    .describe(
      "A project management file, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  fileName: z.string().describe('The name of the uploaded file.'),
  mimeType: z.string().describe('The MIME type of the uploaded file.'),
});
export type FileInput = z.infer<typeof FileInputSchema>;


// Input schema for the summarizeProjectData function
const SummarizeProjectDataInputSchema = z.object({
  files: z.array(FileInputSchema).describe('An array of project files to summarize (data URIs required by internal prompt).'),
  industry: z.string().describe('The industry of the project to tailor the summary.'),
});
export type SummarizeProjectDataInput = z.infer<typeof SummarizeProjectDataInputSchema>;

// Output schema for the summarization result
const SummarizeProjectDataOutputSchema = z.object({
  summary: z.string().describe('A comprehensive summary of the project data from the files, tailored to the industry.'),
});
export type SummarizeProjectDataOutput = z.infer<typeof SummarizeProjectDataOutputSchema>;


// Helper function to extract text content from a Data URI (remains for internal flow use if needed, but UI pre-extracts)
function extractTextFromDataUri(dataUri: string, mimeType: string): { success: boolean; content: string } {
  const match = dataUri.match(/^data:(.+?);base64,(.+)$/);
  if (!match) {
    return { success: false, content: `Invalid data URI format (MIME type: ${mimeType || 'unknown'}).` };
  }
  const actualMimeType = match[1] || mimeType;
  const base64Data = match[2];

  try {
    if (actualMimeType.startsWith('text/') || actualMimeType === 'application/json' || actualMimeType === 'application/csv') {
       const decodedData = Buffer.from(base64Data, 'base64').toString('utf-8');
       const MAX_LENGTH = 50000; // Limit characters per file
       const truncatedContent = decodedData.length > MAX_LENGTH
         ? decodedData.substring(0, MAX_LENGTH) + "\n\n[Content truncated due to length]"
         : decodedData;
       return { success: true, content: truncatedContent };
    }
    // Return skip messages for unsupported types
    if (actualMimeType === 'application/pdf') return { success: false, content: "[Skipped PDF: Cannot extract text content.]" };
    if (actualMimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') return { success: false, content: "[Skipped XLSX: Cannot extract text content.]" };
    if (actualMimeType === 'application/vnd.ms-excel') return { success: false, content: "[Skipped XLS: Cannot extract text content.]" };
    if (actualMimeType === 'application/vnd.ms-project' || actualMimeType === 'application/msproj') return { success: false, content: "[Skipped MPP: Cannot extract project file content.]" };
    if (actualMimeType.startsWith('image/') || actualMimeType.startsWith('video/') || actualMimeType.startsWith('audio/')) return { success: false, content: `[Skipped Media File (${actualMimeType}): Cannot extract text content.]` };
    return { success: false, content: `[Skipped Unsupported File Type (${actualMimeType}): Cannot extract text content.]` };
  } catch (error) {
    console.error("Error decoding base64 data:", error);
    return { success: false, content: "[Error decoding file content.]" };
  }
}

// Publicly exported function to handle summarization
export async function summarizeProjectData(input: SummarizeProjectDataInput): Promise<SummarizeProjectDataOutput> {
  const { files, industry } = input;

  // The UI now handles text extraction and combining.
  // This function primarily orchestrates calling the internal flow.
  // We still need to perform basic validation and construct the file summary list.

  let combinedTextContent = ""; // We'll reconstruct this from extraction for the internal flow
  let fileSummaries: string[] = [];
  let processingErrors: string[] = [];
  let textFileCount = 0;

  files.forEach(file => {
    const extractionResult = extractTextFromDataUri(file.fileDataUri, file.mimeType);
    fileSummaries.push(`File: ${file.fileName} (${file.mimeType})`);
    if (extractionResult.success) {
      combinedTextContent += `\n\n--- File: ${file.fileName} ---\n${extractionResult.content}`;
      textFileCount++;
    } else {
      // Include the skip message in the combined content for context
      combinedTextContent += `\n\n--- File: ${file.fileName} ---\n${extractionResult.content}`;
      processingErrors.push(`${file.fileName}: ${extractionResult.content}`);
    }
  });

  // If no text could be extracted from any file
  if (files.length > 0 && textFileCount === 0) {
      return { summary: `Could not extract text content from any of the uploaded files for summarization.\nDetails:\n- ${processingErrors.join('\n- ')}\n\nPlease ensure files are in supported text formats (TXT, CSV, JSON).` };
  }

  // Prepare input for the internal flow, which expects combined text
  const internalInput = {
    combinedFileTextContent: combinedTextContent.trim(),
    fileSummaryList: fileSummaries.join('\n'),
    industry: industry,
  };

  try {
      const result = await summarizeProjectTextFlow(internalInput);
      // Prepend note about skipped files if necessary
      if (processingErrors.length > 0) {
          const errorSummary = `Note: Some files could not be fully processed for summarization:\n- ${processingErrors.join('\n- ')}\n\nSummary based on available content:\n---\n`;
          // Check if the main summary itself indicates failure (e.g., AI couldn't process)
          const finalSummary = result.summary && !result.summary.startsWith("Could not process")
                               ? errorSummary + result.summary
                               : result.summary; // If AI failed, just return its failure message
          return { summary: finalSummary };
       }
       return result; // Return the successful summary
  } catch (e) {
      console.error("Error in summarizeProjectTextFlow:", e);
      const errorMessage = e instanceof Error ? e.message : String(e);
       return { summary: `An error occurred during the AI summarization: ${errorMessage}` };
  }
}


// Internal flow schema (accepts combined text)
const SummarizeProjectTextInputSchema = z.object({
  combinedFileTextContent: z.string().describe('The combined extracted text content of the project files, including skip messages for non-text files.'),
  fileSummaryList: z.string().describe('A newline-separated list of the original file names and their MIME types.'),
  industry: z.string().describe('The industry of the project.'),
});

// Internal prompt for summarization (uses combined text)
const summarizeProjectTextPrompt = ai.definePrompt({
  name: 'summarizeProjectTextPrompt',
  input: { schema: SummarizeProjectTextInputSchema },
  output: { schema: SummarizeProjectDataOutputSchema },
  prompt: `You are an AI assistant specialized in project management for the {{{industry}}} industry.
Analyze the combined project data content from the files listed below and generate a concise, comprehensive summary.
Focus on key aspects relevant to project management in the {{{industry}}} sector, such as objectives, timelines, key stakeholders, budget information, risks, and major deliverables mentioned in the documents.
Acknowledge any files that were skipped or could not be read based on the [Skipped...] messages within the content.

Files Processed (including skipped):
{{{fileSummaryList}}}

Combined Project Data Content (including skip messages):
\`\`\`
{{{combinedFileTextContent}}}
\`\`\`

Generate the summary based ONLY on the provided text content. If crucial information seems missing due to skipped files, acknowledge this limitation.`,
});

// Internal flow definition (unchanged logic, uses the updated prompt)
const summarizeProjectTextFlow = ai.defineFlow<
  typeof SummarizeProjectTextInputSchema,
  typeof SummarizeProjectDataOutputSchema
>({
  name: 'summarizeProjectTextFlow',
  inputSchema: SummarizeProjectTextInputSchema,
  outputSchema: SummarizeProjectDataOutputSchema,
},
async (input) => {
  const {output} = await summarizeProjectTextPrompt(input);
  if (!output) {
    throw new Error("AI summarization returned no output.");
  }
  return output;
});
