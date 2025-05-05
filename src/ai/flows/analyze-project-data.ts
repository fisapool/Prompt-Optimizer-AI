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
const FileInputSchema = z.object({
  fileDataUri: z
    .string()
    .describe(
      "A project management file, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  fileName: z.string().describe('The name of the uploaded file.'),
  mimeType: z.string().describe('The MIME type of the uploaded file.'), // Added mimeType
});
export type FileInput = z.infer<typeof FileInputSchema>;

// Input schema for the publicly exported function, now takes an array of files
const AnalyzeProjectDataInputSchema = z.object({
  files: z.array(FileInputSchema).describe('An array of project files to analyze.'),
  question: z.string().describe('The question to ask about the project data.'),
  industry: z.string().describe('The industry of the project.'),
});
export type AnalyzeProjectDataInput = z.infer<typeof AnalyzeProjectDataInputSchema>;

// Output schema remains the same
const AnalyzeProjectDataOutputSchema = z.object({
  answer: z.string().describe('The answer to the question about the project data.'),
});
export type AnalyzeProjectDataOutput = z.infer<typeof AnalyzeProjectDataOutputSchema>;


// Helper function to extract text content from a Data URI
function extractTextFromDataUri(dataUri: string, mimeType: string): { success: boolean; content: string } {
  const match = dataUri.match(/^data:(.+?);base64,(.+)$/);
  if (!match) {
    // If mimeType was passed but URI is invalid, use mimeType in error.
    return { success: false, content: `Invalid data URI format (MIME type: ${mimeType || 'unknown'}).` };
  }
  // Prefer the MIME type from the data URI if available, otherwise use the passed one.
  const actualMimeType = match[1] || mimeType;
  const base64Data = match[2];

  try {
    // Handle common text-based types directly
    if (actualMimeType.startsWith('text/') || actualMimeType === 'application/json' || actualMimeType === 'application/csv') {
       const decodedData = Buffer.from(base64Data, 'base64').toString('utf-8');
       // Basic check for potentially large files - truncate if needed
       const MAX_LENGTH = 50000; // Limit to ~50k characters per file for combined analysis
       const truncatedContent = decodedData.length > MAX_LENGTH
         ? decodedData.substring(0, MAX_LENGTH) + "\n\n[Content truncated due to length]"
         : decodedData;
       return { success: true, content: truncatedContent };
    }

    // Handle specific unsupported types explicitly with informative messages
    if (actualMimeType === 'application/pdf') {
      return { success: false, content: "[Skipped PDF: Cannot analyze content directly. Ask questions about metadata or convert to text.]" };
    }
    if (actualMimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') { // XLSX
       return { success: false, content: "[Skipped XLSX: Cannot analyze content directly. Ask questions about metadata or convert to CSV/text.]" };
    }
    if (actualMimeType === 'application/vnd.ms-excel') { // XLS (older excel)
        return { success: false, content: "[Skipped XLS: Cannot analyze content directly. Ask questions about metadata or convert to CSV/text.]" };
    }
     if (actualMimeType === 'application/vnd.ms-project' || actualMimeType === 'application/msproj') { // MPP
       return { success: false, content: "[Skipped MPP: Cannot analyze project file content directly. Ask questions about metadata.]" };
     }
     if (actualMimeType.startsWith('image/') || actualMimeType.startsWith('video/') || actualMimeType.startsWith('audio/')) {
        return { success: false, content: `[Skipped Media File (${actualMimeType}): Cannot extract text content.]` };
     }

    // Default for other unsupported types
    return { success: false, content: `[Skipped Unsupported File Type (${actualMimeType}): Cannot analyze content.]` };

  } catch (error) {
    console.error("Error decoding base64 data:", error);
    return { success: false, content: "[Error decoding file content.]" };
  }
}

// Publicly exported function - handles text extraction for multiple files
export async function analyzeProjectData(input: AnalyzeProjectDataInput): Promise<AnalyzeProjectDataOutput> {
  const { files, question, industry } = input;

  let combinedTextContent = "";
  let fileSummaries: string[] = [];
  let processingErrors: string[] = [];

  files.forEach(file => {
    const extractionResult = extractTextFromDataUri(file.fileDataUri, file.mimeType);
    fileSummaries.push(`File: ${file.fileName} (${file.mimeType})`);
    if (extractionResult.success) {
      combinedTextContent += `\n\n--- File: ${file.fileName} ---\n${extractionResult.content}`;
    } else {
      // Add the specific skip/error message for this file
      combinedTextContent += `\n\n--- File: ${file.fileName} ---\n${extractionResult.content}`;
      processingErrors.push(`${file.fileName}: ${extractionResult.content}`);
    }
  });

  // If all files failed processing, return a summary error
  if (files.length > 0 && files.length === processingErrors.length) {
      return { answer: `Could not process any of the uploaded files for content analysis.\nDetails:\n- ${processingErrors.join('\n- ')}\n\nPlease ensure files are in supported text formats (TXT, CSV, JSON) or ask questions based on file names.` };
  }


  // Prepare input for the internal flow
  const internalInput = {
    combinedFileTextContent: combinedTextContent.trim(), // Use the combined content
    fileSummaryList: fileSummaries.join('\n'), // Pass the list of files processed
    question: question,
    industry: industry,
  };

  // Call the internal flow with the combined text content and file list
  try {
      const result = await analyzeProjectTextFlow(internalInput);
       // Optionally prepend error summary if some files were skipped
      if (processingErrors.length > 0) {
          const errorSummary = `Note: Some files could not be fully analyzed:\n- ${processingErrors.join('\n- ')}\n\nAnalysis based on available content:\n---\n`;
          return { answer: errorSummary + result.answer };
       }
       return result;
  } catch (e) {
      console.error("Error in analyzeProjectTextFlow:", e);
       return { answer: `An error occurred during the AI analysis: ${e instanceof Error ? e.message : 'Unknown error'}` };
  }
}


// Internal flow schema updated to accept combined content and file list
const AnalyzeProjectTextInputSchema = z.object({
  combinedFileTextContent: z.string().describe('The combined extracted text content of the project files, separated by file markers.'),
  fileSummaryList: z.string().describe('A newline-separated list of the original file names and their MIME types.'),
  question: z.string().describe('The question to ask about the project data.'),
  industry: z.string().describe('The industry of the project.'),
});


// Internal prompt updated for multiple files
const analyzeProjectTextPrompt = ai.definePrompt({
  name: 'analyzeProjectTextPrompt',
  input: { schema: AnalyzeProjectTextInputSchema },
  output: { schema: AnalyzeProjectDataOutputSchema },
  prompt: `You are an AI assistant specialized in project management for the {{{industry}}} industry.
Analyze the combined project data content from the files listed below and answer the user's question. If some files were skipped or could not be read, mention that context might be missing.

Files Processed:
{{{fileSummaryList}}}

Combined Project Data Content:
\`\`\`
{{{combinedFileTextContent}}}
\`\`\`

User Question: {{{question}}}

Answer based ONLY on the provided content from the files. If the answer requires information from a skipped file type (like PDF, XLSX, MPP, media), state that you cannot answer based on the provided text content.`,
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
  // Consider using a model with a larger context window if combined text is very long
  // e.g., model: ai.getModel('googleai/gemini-1.5-flash-latest')
  const {output} = await analyzeProjectTextPrompt(input, { model: ai.getModel('googleai/gemini-1.5-flash-latest') }); // Use 1.5 flash for potentially larger context
  if (!output) {
    throw new Error("AI analysis returned no output.");
  }
  return output;
});
