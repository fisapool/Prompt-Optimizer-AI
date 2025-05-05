// src/ai/flows/analyze-project-data.ts
'use server';
/**
 * @fileOverview Analyzes project data from multiple uploaded files using AI.
 * The AI can answer questions about the combined project data to provide insights.
 *
 * - analyzeProjectData - A function that handles the project data analysis process. Accepts multiple files.
 * - AnalyzeProjectDataInput - The input type for the analyzeProjectData function.
 * - AnalyzeProjectDataOutput - The return type for the analyzeProjectData function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

// Define schema for a single file within the input array
// Note: Similar to summarize flow, the UI pre-extracts text, but this flow's
// internal prompt still expects data URIs via the `files` array.
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

// Input schema for the publicly exported function, now takes an array of files
const AnalyzeProjectDataInputSchema = z.object({
  files: z.array(FileInputSchema).describe('An array of project files to analyze (data URIs required by internal prompt).'),
  question: z.string().describe('The question to ask about the project data.'),
  industry: z.string().describe('The industry of the project.'),
});
export type AnalyzeProjectDataInput = z.infer<typeof AnalyzeProjectDataInputSchema>;

// Output schema remains the same
const AnalyzeProjectDataOutputSchema = z.object({
  answer: z.string().describe('The answer to the question about the project data.'),
});
export type AnalyzeProjectDataOutput = z.infer<typeof AnalyzeProjectDataOutputSchema>;


// Helper function to extract text content from a Data URI (remains for internal use if needed)
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

// Publicly exported function - handles text extraction reconstruction for the internal flow
export async function analyzeProjectData(input: AnalyzeProjectDataInput): Promise<AnalyzeProjectDataOutput> {
  const { files, question, industry } = input;

  let combinedTextContent = "";
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
      combinedTextContent += `\n\n--- File: ${file.fileName} ---\n${extractionResult.content}`;
      processingErrors.push(`${file.fileName}: ${extractionResult.content}`);
    }
  });

  // If no text could be extracted from any file for analysis
  if (files.length > 0 && textFileCount === 0) {
      return { answer: `Could not extract text content from any of the uploaded files to answer the question.\nDetails:\n- ${processingErrors.join('\n- ')}\n\nPlease ensure files are in supported text formats (TXT, CSV, JSON) or ask questions based only on file names/types.` };
  }


  // Prepare input for the internal flow
  const internalInput = {
    combinedFileTextContent: combinedTextContent.trim(), // Use the reconstructed combined content
    fileSummaryList: fileSummaries.join('\n'), // Pass the list of files processed
    question: question,
    industry: industry,
  };

  // Call the internal flow with the combined text content and file list
  try {
      const result = await analyzeProjectTextFlow(internalInput);
       // Optionally prepend error summary if some files were skipped
      if (processingErrors.length > 0) {
          const errorSummary = `Note: Some files could not be fully analyzed for content:\n- ${processingErrors.join('\n- ')}\n\nAnalysis based on available content:\n---\n`;
          return { answer: errorSummary + result.answer };
       }
       return result;
  } catch (e) {
      console.error("Error in analyzeProjectTextFlow:", e);
      const errorMessage = e instanceof Error ? e.message : String(e); // Handle non-Error types
       return { answer: `An error occurred during the AI analysis: ${errorMessage}` };
  }
}


// Internal flow schema updated to accept combined content and file list
const AnalyzeProjectTextInputSchema = z.object({
  combinedFileTextContent: z.string().describe('The combined extracted text content of the project files, including skip messages.'),
  fileSummaryList: z.string().describe('A newline-separated list of the original file names and their MIME types.'),
  question: z.string().describe('The question to ask about the project data.'),
  industry: z.string().describe('The industry of the project.'),
});


// Internal prompt updated for multiple files (uses combined text)
const analyzeProjectTextPrompt = ai.definePrompt({
  name: 'analyzeProjectTextPrompt',
  input: { schema: AnalyzeProjectTextInputSchema },
  output: { schema: AnalyzeProjectDataOutputSchema },
  prompt: `You are an AI assistant specialized in project management for the {{{industry}}} industry.
Analyze the combined project data content from the files listed below and answer the user's question. If some files were skipped or could not be read (indicated by [Skipped...] messages), mention that context might be missing.

Files Processed (including skipped):
{{{fileSummaryList}}}

Combined Project Data Content (including skip messages):
\`\`\`
{{{combinedFileTextContent}}}
\`\`\`

User Question: {{{question}}}

Answer based ONLY on the provided text content from the files. If the answer requires information from a skipped file type (like PDF, XLSX, MPP, media), state that you cannot answer based on the provided text content.`,
});

// Internal flow definition remains largely the same, but uses the updated schema and prompt
const analyzeProjectTextFlow = ai.defineFlow<
  typeof AnalyzeProjectTextInputSchema,
  typeof AnalyzeProjectDataOutputSchema
>({
  name: 'analyzeProjectTextFlow',
  inputSchema: AnalyzeProjectTextInputSchema,
  outputSchema: AnalyzeProjectDataOutputSchema,
},
async (input) => {
  // Use the default model configured in ai-instance.ts
  const {output} = await analyzeProjectTextPrompt(input);
  if (!output) {
    throw new Error("AI analysis returned no output.");
  }
  return output;
});
