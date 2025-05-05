// src/app/page.tsx
'use client';

import type * as React from 'react';
import { useState, useCallback, useMemo } from 'react'; // Added useMemo
import { analyzeProjectData, type AnalyzeProjectDataInput } from '@/ai/flows/analyze-project-data';
import { summarizeProjectData, type SummarizeProjectDataInput } from '@/ai/flows/summarize-project-data';
import { generatePromptSuggestions, type GeneratePromptSuggestionsInput } from '@/ai/flows/generate-prompt-suggestions'; // Import the new flow
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { IndustrySelector, type Industry } from '@/components/IndustrySelector';
import { FileUpload } from '@/components/FileUpload';
import { ChatInterface, type Message } from '@/components/ChatInterface';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Terminal, Bot, Loader2, Wand2 } from "lucide-react"; // Added Wand2 for suggestions loading

// Define structure for uploaded file state
interface UploadedFile {
  name: string;
  dataUri: string;
  mimeType: string;
  textContent?: string; // Store extracted text content
}

export default function Home() {
  const [selectedIndustry, setSelectedIndustry] = useState<Industry | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [projectSummary, setProjectSummary] = useState<string | null>(null);
  const [promptSuggestions, setPromptSuggestions] = useState<string[]>([]); // State for dynamic suggestions
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false); // State for suggestions loading
  const [error, setError] = useState<string | null>(null);
  const [isReadingFiles, setIsReadingFiles] = useState(false);

  // Helper function to extract text content from a Data URI (copied/adapted from flows)
  const extractTextFromDataUri = useCallback((dataUri: string, mimeType: string): { success: boolean; content: string } => {
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
        // Return skip messages for unsupported types, but don't treat as errors here
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
  }, []);


  const handleFileUpload = useCallback((fileList: FileList | null) => {
    setError(null);
    setProjectSummary(null);
    setPromptSuggestions([]); // Clear suggestions
    setMessages([]);
    if (!fileList || fileList.length === 0) {
      setUploadedFiles([]);
      return;
    }

    setIsReadingFiles(true);
    setMessages([{ id: 'system-reading', role: 'system', content: 'reading' }]);

    const filesArray = Array.from(fileList);
    const fileReadPromises: Promise<UploadedFile>[] = [];

    filesArray.forEach((file) => {
      const promise = new Promise<UploadedFile>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUri = e.target?.result as string;
          const mimeType = file.type || 'application/octet-stream';
          const { success, content } = extractTextFromDataUri(dataUri, mimeType);
          // Store text content directly if successfully extracted
          resolve({ name: file.name, dataUri, mimeType, textContent: success ? content : content }); // Store skip message if not success
        };
        reader.onerror = (e) => {
          console.error(`Error reading file ${file.name}:`, e);
          reject(new Error(`Failed to read file ${file.name}`));
        };
        reader.readAsDataURL(file);
      });
      fileReadPromises.push(promise);
    });

    Promise.all(fileReadPromises)
      .then((newFilesData) => {
        setUploadedFiles(newFilesData);
        setMessages([]);
      })
      .catch((err) => {
        console.error("Error reading one or more files:", err);
        setError(`Error reading files: ${err.message}`);
        setUploadedFiles([]);
        setMessages([]);
      })
      .finally(() => {
        setIsReadingFiles(false);
      });
  }, [extractTextFromDataUri]);


  // Memoize combined text content to avoid recalculating on every render
  const combinedTextContent = useMemo(() => {
    let content = "";
    let processingErrors: string[] = [];
    uploadedFiles.forEach(file => {
        content += `\n\n--- File: ${file.name} (${file.mimeType}) ---\n${file.textContent}`;
        // Consider adding extracted error/skip messages to a list if needed later
        if (file.textContent?.startsWith("[")) { // Basic check for our skip messages
            processingErrors.push(`${file.name}: ${file.textContent}`);
        }
    });
     // Add error summary if some files were skipped
    if (processingErrors.length > 0) {
        const errorSummary = `Note: Some files could not be fully analyzed for content:\n- ${processingErrors.join('\n- ')}\n\nAnalysis based on available content:\n---\n`;
        return errorSummary + content.trim();
     }
    return content.trim();
  }, [uploadedFiles]);

  const handleGenerateSummaryAndSuggestions = async () => {
    if (uploadedFiles.length === 0 || !selectedIndustry) {
      setError("Please select an industry and upload at least one project file first.");
      return;
    }
    if (isSummarizing || isGeneratingSuggestions || isReadingFiles) return;

    setIsSummarizing(true);
    setError(null);
    setProjectSummary(null);
    setPromptSuggestions([]); // Clear old suggestions

    try {
      // Summarize
      const summaryInput: SummarizeProjectDataInput = {
        files: uploadedFiles.map(f => ({
          fileDataUri: f.dataUri,
          fileName: f.name,
          mimeType: f.mimeType,
        })), // Summarize flow still needs the original data URI structure
        industry: selectedIndustry.value,
      };
      const summaryResponse = await summarizeProjectData(summaryInput);
      setProjectSummary(summaryResponse.summary);
      setMessages([]); // Reset chat after generating summary

      // Generate suggestions only if summary was successful
      if (summaryResponse.summary && !summaryResponse.summary.startsWith("Could not process")) {
        setIsGeneratingSuggestions(true);
        const suggestionsInput: GeneratePromptSuggestionsInput = {
           combinedFileTextContent: combinedTextContent, // Use pre-calculated combined text
           projectSummary: summaryResponse.summary,
           industry: selectedIndustry.value,
        };
        try {
           const suggestionsResponse = await generatePromptSuggestions(suggestionsInput);
           setPromptSuggestions(suggestionsResponse.suggestions);
        } catch (suggestionErr) {
             console.error("AI suggestion generation failed:", suggestionErr);
             // Don't block the UI for suggestion errors, maybe show a small note?
             setError("Generated summary, but failed to generate prompt suggestions.");
             setPromptSuggestions([]); // Ensure suggestions are empty on error
        } finally {
            setIsGeneratingSuggestions(false);
        }
      } else {
          // Handle case where summary failed but didn't throw (e.g., all files skipped)
          setPromptSuggestions([]); // No summary, no suggestions
          if (!error) { // Avoid overwriting a potential summarization error
              setError(summaryResponse.summary); // Show the summary "error" message
          }
      }

    } catch (err) {
      console.error("AI processing failed:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during processing.";
      setError(`AI processing failed: ${errorMessage}`);
      setProjectSummary(null);
      setPromptSuggestions([]);
    } finally {
      setIsSummarizing(false);
      // isGeneratingSuggestions is handled within its own block
    }
  };


  const handleSendMessage = async (messageContent: string) => {
    if (uploadedFiles.length === 0 || !selectedIndustry || !projectSummary) {
      setError("Please generate a summary before starting the chat.");
      return;
    }
    if (isLoadingChat || isReadingFiles || isSummarizing || isGeneratingSuggestions) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: messageContent };
    setMessages((prev) => [...prev.filter(m => m.role !== 'system'), userMessage]);
    setIsLoadingChat(true);
    setError(null);

    try {
       // Analyze project data flow still expects file data URIs for now
       // In a future refactor, we could potentially pass combinedTextContent
       // if the flow was adapted, but let's stick to the current interface.
       const aiInput: AnalyzeProjectDataInput = {
        files: uploadedFiles.map(f => ({
          fileDataUri: f.dataUri,
          fileName: f.name,
          mimeType: f.mimeType,
        })),
        question: messageContent,
        industry: selectedIndustry.value,
      };

      const aiResponse = await analyzeProjectData(aiInput);

      const assistantMessage: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: aiResponse.answer };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("AI analysis failed:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during analysis.";
      setError(`AI analysis failed: ${errorMessage}`);
      const assistantErrorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error trying to analyze the data: ${errorMessage}`,
      };
      setMessages((prev) => [...prev, assistantErrorMessage]);
    } finally {
      setIsLoadingChat(false);
    }
  };

  // Function to clear the chat messages
  const handleClearChat = () => {
    setMessages([]);
    setError(null); // Also clear any existing chat-related errors
  };


  // Determine combined loading state for disabling inputs
  const isProcessing = isReadingFiles || isSummarizing || isLoadingChat || isGeneratingSuggestions;
  const summaryActive = !!selectedIndustry && uploadedFiles.length > 0;
  const chatActive = summaryActive && !!projectSummary;


  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-12 lg:p-24 bg-background">
      <div className="w-full max-w-4xl space-y-8">
        <header className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
            ProjectWise AI
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Upload project files, generate a summary & suggestions, and discuss insights with AI.
          </p>
        </header>

        {error && (
          <Alert variant="destructive">
             <Terminal className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Step 1: Industry Selection */}
        <Card className="w-full shadow-lg">
          <CardHeader>
            <CardTitle>Step 1: Select Your Industry</CardTitle>
            <CardDescription>Choose the industry that best represents your project(s).</CardDescription>
          </CardHeader>
          <CardContent>
            <IndustrySelector
              selectedIndustry={selectedIndustry}
              onSelectIndustry={(industry) => {
                setSelectedIndustry(industry);
                setProjectSummary(null); // Reset summary when industry changes
                setPromptSuggestions([]); // Reset suggestions
                setMessages([]); // Reset chat
                setUploadedFiles([]); // Reset files if industry changes
                // Consider if you want to keep files or clear them here
              }}
              disabled={isProcessing && !!selectedIndustry} // Allow changing even if processing, but maybe not?
            />
          </CardContent>
        </Card>


        {/* Step 2: File Upload */}
        <Card className="w-full shadow-lg">
          <CardHeader>
            <CardTitle>Step 2: Upload Project Files</CardTitle>
            <CardDescription>Upload one or more project management files (e.g., .txt, .csv, .json). PDF, XLSX, MPP files will be skipped during analysis.</CardDescription>
          </CardHeader>
          <CardContent>
            <FileUpload
              onFileUpload={handleFileUpload}
              disabled={isProcessing}
              accept=".txt,.csv,.json,.pdf,.xlsx,.xls,.mpp"
            />
             {isReadingFiles && (
                <div className="flex items-center justify-center space-x-2 text-muted-foreground mt-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Reading files...</span>
                </div>
             )}
          </CardContent>
        </Card>

        {/* Step 3: Generate Summary & Suggestions */}
        <Card className={`w-full shadow-lg ${!summaryActive || isProcessing ? 'opacity-60' : ''}`}>
           <CardHeader>
            <CardTitle>Step 3: Generate Summary & Suggestions</CardTitle>
            <CardDescription>Click the button below to generate an AI-powered summary and prompt suggestions based on the uploaded files and selected industry.</CardDescription>
           </CardHeader>
           <CardContent>
             {(isSummarizing || isGeneratingSuggestions) ? (
                <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>{isSummarizing ? 'Generating summary...' : 'Generating suggestions...'}</span>
                </div>
             ) : projectSummary ? (
                 <div className="space-y-3">
                   <h4 className="font-medium text-foreground">AI Generated Summary:</h4>
                    <ScrollArea className="h-40 w-full rounded-md border p-3 bg-muted/30">
                     <p className="text-sm text-foreground whitespace-pre-wrap">{projectSummary}</p>
                   </ScrollArea>
                 </div>
               ) : (
                 <p className="text-sm text-muted-foreground italic text-center">
                   {uploadedFiles.length > 0 && selectedIndustry ? "Ready to generate summary and suggestions." : "Please select industry and upload files first."}
                 </p>
             )}
           </CardContent>
          <CardFooter className="justify-center border-t pt-4">
             <Button
               onClick={handleGenerateSummaryAndSuggestions}
               disabled={!summaryActive || isProcessing}
             >
               {isSummarizing || isGeneratingSuggestions ? (
                 <>
                   <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {isSummarizing ? 'Summarizing...' : 'Getting Suggestions...'}
                 </>
               ) : projectSummary ? (
                  "Regenerate Summary & Suggestions"
               ) : (
                  "Generate Summary & Suggestions"
               )}
             </Button>
           </CardFooter>
         </Card>


        {/* Step 4: Chat Interface */}
        <Card className={`w-full shadow-lg ${!chatActive || isProcessing ? 'opacity-60 pointer-events-none' : ''}`}>
          <CardHeader>
            <CardTitle>Step 4: Chat with AI</CardTitle>
            <CardDescription>
               {chatActive ? "Use the suggestions below or ask your own questions about the project data." : "Generate a summary first to enable the chat."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChatInterface
              messages={messages}
              onSendMessage={handleSendMessage}
              onClearChat={handleClearChat} // Pass clear function
              isLoading={isLoadingChat || isReadingFiles}
              disabled={!chatActive || isProcessing}
              promptSuggestions={promptSuggestions} // Pass dynamic suggestions
              isLoadingSuggestions={isGeneratingSuggestions} // Pass loading state for suggestions
              industry={selectedIndustry?.value}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
