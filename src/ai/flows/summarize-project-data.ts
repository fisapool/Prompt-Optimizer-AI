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
  files: z.array(FileInputSchema).describe('An array of project files to summarize.'),
  industry: z.string().describe('The industry of the project to tailor the summary.'),
});
export type SummarizeProjectDataInput = z.infer<typeof SummarizeProjectDataInputSchema>;

// Output schema for the summarization result
const SummarizeProjectDataOutputSchema = z.object({
  summary: z.string().describe('A comprehensive summary of the project data from the files, tailored to the industry.'),
});
export type SummarizeProjectDataOutput = z.infer<typeof SummarizeProjectDataOutputSchema>;


// Helper function to extract text content from a Data URI (copied/adapted from analyze-project-data)
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
    if (actualMimeType === 'application/pdf') {
      return { success: false, content: "[Skipped PDF: Cannot extract text content.]" };
    }
    if (actualMimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') { // XLSX
       return { success: false, content: "[Skipped XLSX: Cannot extract text content.]" };
    }
    if (actualMimeType === 'application/vnd.ms-excel') { // XLS
        return { success: false, content: "[Skipped XLS: Cannot extract text content.]" };
    }
     if (actualMimeType === 'application/vnd.ms-project' || actualMimeType === 'application/msproj') { // MPP
       return { success: false, content: "[Skipped MPP: Cannot extract project file content.]" };
     }
     if (actualMimeType.startsWith('image/') || actualMimeType.startsWith('video/') || actualMimeType.startsWith('audio/')) {
        return { success: false, content: `[Skipped Media File (${actualMimeType}): Cannot extract text content.]` };
     }
    return { success: false, content: `[Skipped Unsupported File Type (${actualMimeType}): Cannot extract text content.]` };
  } catch (error) {
    console.error("Error decoding base64 data:", error);
    return { success: false, content: "[Error decoding file content.]" };
  }
}

// Publicly exported function to handle summarization
export async function summarizeProjectData(input: SummarizeProjectDataInput): Promise<SummarizeProjectDataOutput> {
  const { files, industry } = input;

  let combinedTextContent = "";
  let fileSummaries: string[] = [];
  let processingErrors: string[] = [];

  files.forEach(file => {
    const extractionResult = extractTextFromDataUri(file.fileDataUri, file.mimeType);
    fileSummaries.push(`File: ${file.fileName} (${file.mimeType})`);
    if (extractionResult.success) {
      combinedTextContent += `\n\n--- File: ${file.fileName} ---\n${extractionResult.content}`;
    } else {
      combinedTextContent += `\n\n--- File: ${file.fileName} ---\n${extractionResult.content}`;
      processingErrors.push(`${file.fileName}: ${extractionResult.content}`);
    }
  });

  if (files.length > 0 && files.length === processingErrors.length) {
      return { summary: `Could not process any of the uploaded files for content summarization.\nDetails:\n- ${processingErrors.join('\n- ')}\n\nPlease ensure files are in supported text formats (TXT, CSV, JSON).` };
  }

  const internalInput = {
    combinedFileTextContent: combinedTextContent.trim(),
    fileSummaryList: fileSummaries.join('\n'),
    industry: industry,
  };

  try {
      const result = await summarizeProjectTextFlow(internalInput);
      if (processingErrors.length > 0) {
          const errorSummary = `Note: Some files could not be fully processed for summarization:\n- ${processingErrors.join('\n- ')}\n\nSummary based on available content:\n---\n`;
          return { summary: errorSummary + result.summary };
       }
       return result;
  } catch (e) {
      console.error("Error in summarizeProjectTextFlow:", e);
      const errorMessage = e instanceof Error ? e.message : String(e);
       return { summary: `An error occurred during the AI summarization: ${errorMessage}` };
  }
}


// Internal flow schema
const SummarizeProjectTextInputSchema = z.object({
  combinedFileTextContent: z.string().describe('The combined extracted text content of the project files, separated by file markers.'),
  fileSummaryList: z.string().describe('A newline-separated list of the original file names and their MIME types.'),
  industry: z.string().describe('The industry of the project.'),
});

// Internal prompt for summarization
const summarizeProjectTextPrompt = ai.definePrompt({
  name: 'summarizeProjectTextPrompt',
  input: { schema: SummarizeProjectTextInputSchema },
  output: { schema: SummarizeProjectDataOutputSchema },
  prompt: `You are an AI assistant specialized in project management for the {{{industry}}} industry.
Analyze the combined project data content from the files listed below and generate a concise, comprehensive summary.
Focus on key aspects relevant to project management in the {{{industry}}} sector, such as objectives, timelines, key stakeholders, budget information, risks, and major deliverables mentioned in the documents. If some files were skipped or could not be read, mention that context might be missing from those specific files.

Files Processed:
{{{fileSummaryList}}}

Combined Project Data Content:
\`\`\`
{{{combinedFileTextContent}}}
\`\`\`

Generate the summary based ONLY on the provided content from the files. If crucial information seems missing due to skipped files (like PDF, XLSX, MPP, media), acknowledge this limitation in the summary.`,
});

// Internal flow definition
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

