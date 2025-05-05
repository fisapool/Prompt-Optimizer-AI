'use server';
/**
 * @fileOverview Analyzes project data from uploaded files using AI. The AI can answer questions about the project to provide the user with insights and identify potential issues.
 *
 * - analyzeProjectData - A function that handles the project data analysis process. Accepts a file data URI.
 * - AnalyzeProjectDataInput - The input type for the analyzeProjectData function.
 * - AnalyzeProjectDataOutput - The return type for the analyzeProjectData function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

// Input schema for the publicly exported function
const AnalyzeProjectDataInputSchema = z.object({
  fileDataUri: z
    .string()
    .describe(
      "A project management file, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  fileName: z.string().describe('The name of the uploaded file.'),
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
function extractTextFromDataUri(dataUri: string): { success: boolean; content: string; mimeType: string } {
  const match = dataUri.match(/^data:(.+?);base64,(.+)$/);
  if (!match) {
    return { success: false, content: "Invalid data URI format.", mimeType: '' };
  }
  const mimeType = match[1];
  const base64Data = match[2];

  try {
    const decodedData = Buffer.from(base64Data, 'base64').toString('utf-8');

    // Handle common text-based types
    if (mimeType.startsWith('text/') || mimeType === 'application/json' || mimeType === 'application/csv') {
       // Basic check for potentially large files - truncate if needed
       const MAX_LENGTH = 50000; // Limit to ~50k characters
       const truncatedContent = decodedData.length > MAX_LENGTH
         ? decodedData.substring(0, MAX_LENGTH) + "\n\n[Content truncated due to length]"
         : decodedData;
      return { success: true, content: truncatedContent, mimeType };
    }

    // Handle unsupported types explicitly
    if (mimeType === 'application/pdf') {
      return { success: false, content: "Cannot analyze PDF content directly. Please ask questions about the file name or metadata, or convert it to text first.", mimeType };
    }
    if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
       return { success: false, content: "Cannot analyze XLSX content directly. Please ask questions about the file name or metadata, or convert it to CSV/text first.", mimeType };
    }
     if (mimeType === 'application/vnd.ms-project' || mimeType === 'application/msproj') {
       return { success: false, content: "Cannot analyze MPP project file content directly. Please ask questions about the file name or metadata.", mimeType };
     }
     if (mimeType.startsWith('image/') || mimeType.startsWith('video/') || mimeType.startsWith('audio/')) {
        return { success: false, content: "Cannot extract text content from this media file. Please ask questions about the file name.", mimeType };
     }

    // Default for other unsupported types
    return { success: false, content: `Unsupported file type (${mimeType}) for direct content analysis. Please ask questions about the file name or metadata.`, mimeType };

  } catch (error) {
    console.error("Error decoding base64 data:", error);
    return { success: false, content: "Error decoding file content.", mimeType };
  }
}

// Publicly exported function - handles text extraction
export async function analyzeProjectData(input: AnalyzeProjectDataInput): Promise<AnalyzeProjectDataOutput> {
  const { fileDataUri, fileName, question, industry } = input;

  const extractionResult = extractTextFromDataUri(fileDataUri);

  if (!extractionResult.success) {
    // If text extraction fails, return the error message as the answer
    return { answer: extractionResult.content };
  }

  // Call the internal flow with the extracted text content
  return analyzeProjectTextFlow({
    fileTextContent: extractionResult.content,
    fileName: fileName,
    mimeType: extractionResult.mimeType,
    question: question,
    industry: industry,
  });
}


// Internal flow that works with extracted text content
const AnalyzeProjectTextInputSchema = z.object({
  fileTextContent: z.string().describe('The extracted text content of the project file.'),
  fileName: z.string().describe('The name of the original file.'),
  mimeType: z.string().describe('The MIME type of the original file.'),
  question: z.string().describe('The question to ask about the project data.'),
  industry: z.string().describe('The industry of the project.'),
});

const analyzeProjectTextPrompt = ai.definePrompt({
  name: 'analyzeProjectTextPrompt',
  input: { schema: AnalyzeProjectTextInputSchema },
  output: { schema: AnalyzeProjectDataOutputSchema },
  prompt: `You are an AI assistant specialized in project management for the {{{industry}}} industry.
Analyze the provided project data text content and answer the user's question.

Original File Name: {{{fileName}}}
File Type: {{{mimeType}}}

Project Data Content:
\`\`\`
{{{fileTextContent}}}
\`\`\`

User Question: {{{question}}}

Answer based on the provided content:`,
});

const analyzeProjectTextFlow = ai.defineFlow<
  typeof AnalyzeProjectTextInputSchema,
  typeof AnalyzeProjectDataOutputSchema
>({
  name: 'analyzeProjectTextFlow',
  inputSchema: AnalyzeProjectTextInputSchema,
  outputSchema: AnalyzeProjectDataOutputSchema,
},
async (input) => {
  // Add specific model config if needed, e.g., for potentially longer context
  const {output} = await analyzeProjectTextPrompt(input, { model: ai.getModel('googleai/gemini-2.0-flash')});
  return output!;
});
