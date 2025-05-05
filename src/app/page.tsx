// src/app/page.tsx
'use client';

import type * as React from 'react';
import { useState, useCallback } from 'react';
import { analyzeProjectData, type AnalyzeProjectDataInput } from '@/ai/flows/analyze-project-data';
import { summarizeProjectData, type SummarizeProjectDataInput } from '@/ai/flows/summarize-project-data'; // Import the new flow
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"; // Added CardFooter
import { IndustrySelector, type Industry } from '@/components/IndustrySelector';
import { FileUpload } from '@/components/FileUpload';
import { ChatInterface, type Message } from '@/components/ChatInterface';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button"; // Import Button
import { ScrollArea } from "@/components/ui/scroll-area"; // Import ScrollArea
import { Terminal, Bot, Loader2 } from "lucide-react"; // Added Bot, Loader2

// Define structure for uploaded file state
interface UploadedFile {
  name: string;
  dataUri: string;
  mimeType: string;
}

export default function Home() {
  const [selectedIndustry, setSelectedIndustry] = useState<Industry | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [projectSummary, setProjectSummary] = useState<string | null>(null); // State for the summary
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingChat, setIsLoadingChat] = useState(false); // Renamed isLoading to isLoadingChat
  const [isSummarizing, setIsSummarizing] = useState(false); // State for summary generation loading
  const [error, setError] = useState<string | null>(null);
  const [isReadingFiles, setIsReadingFiles] = useState(false); // State for file reading

  const handleFileUpload = useCallback((fileList: FileList | null) => {
    setError(null);
    setProjectSummary(null); // Clear summary when files change
    setMessages([]); // Clear chat when files change
    if (!fileList || fileList.length === 0) {
      setUploadedFiles([]);
      return;
    }

    setIsReadingFiles(true);
    setMessages([{ id: 'system-reading', role: 'system', content: 'reading' }]); // Show reading indicator in chat area temporarily

    const filesArray = Array.from(fileList);
    const fileReadPromises: Promise<UploadedFile>[] = [];

    filesArray.forEach((file) => {
      const promise = new Promise<UploadedFile>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUri = e.target?.result as string;
          const mimeType = file.type || 'application/octet-stream';
          resolve({ name: file.name, dataUri, mimeType });
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
        // Remove the reading message, but don't add success message yet
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
  }, []);

  const handleGenerateSummary = async () => {
    if (uploadedFiles.length === 0 || !selectedIndustry) {
      setError("Please select an industry and upload at least one project file first.");
      return;
    }
    if (isSummarizing || isReadingFiles) return;

    setIsSummarizing(true);
    setError(null);
    setProjectSummary(null); // Clear previous summary

    try {
      const aiInput: SummarizeProjectDataInput = {
        files: uploadedFiles.map(f => ({
          fileDataUri: f.dataUri,
          fileName: f.name,
          mimeType: f.mimeType,
        })),
        industry: selectedIndustry.value,
      };

      const aiResponse = await summarizeProjectData(aiInput);
      setProjectSummary(aiResponse.summary);
      // Optionally reset chat to start fresh after summary generation
      setMessages([]);
    } catch (err) {
      console.error("AI summarization failed:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during summarization.";
      setError(`AI summarization failed: ${errorMessage}`);
      setProjectSummary(null); // Ensure summary is cleared on error
    } finally {
      setIsSummarizing(false);
    }
  };


  const handleSendMessage = async (messageContent: string) => {
    if (uploadedFiles.length === 0 || !selectedIndustry || !projectSummary) { // Added check for summary
      setError("Please generate a summary before starting the chat.");
      return;
    }
    if (isLoadingChat || isReadingFiles || isSummarizing) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: messageContent };
    setMessages((prev) => [...prev.filter(m => m.role !== 'system'), userMessage]);
    setIsLoadingChat(true); // Use setIsLoadingChat
    setError(null);

    try {
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
      setIsLoadingChat(false); // Use setIsLoadingChat
    }
  };

  // Determine combined loading state for disabling inputs
  const isProcessing = isReadingFiles || isSummarizing || isLoadingChat;
  // Determine if the summary section should be active
  const summaryActive = !!selectedIndustry && uploadedFiles.length > 0;
  // Determine if the chat section should be active
  const chatActive = summaryActive && !!projectSummary;


  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-12 lg:p-24 bg-background">
      <div className="w-full max-w-4xl space-y-8">
        <header className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
            ProjectWise AI
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Upload project files, generate a summary, and discuss insights with AI.
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
                setProjectSummary(null); // Reset summary if industry changes
                setMessages([]); // Reset chat
              }}
              disabled={isProcessing && !!selectedIndustry}
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
          </CardContent>
        </Card>

        {/* Step 3: Generate Summary */}
        <Card className={`w-full shadow-lg ${!summaryActive || isProcessing ? 'opacity-60' : ''}`}>
           <CardHeader>
            <CardTitle>Step 3: Generate Project Summary</CardTitle>
            <CardDescription>Click the button below to generate an AI-powered summary of the uploaded files, tailored to your selected industry.</CardDescription>
           </CardHeader>
           <CardContent>
             {isSummarizing ? (
                <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Generating summary...</span>
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
                   {uploadedFiles.length > 0 && selectedIndustry ? "Ready to generate summary." : "Please select industry and upload files first."}
                 </p>
             )}
           </CardContent>
          <CardFooter className="justify-center border-t pt-4">
             <Button
               onClick={handleGenerateSummary}
               disabled={!summaryActive || isProcessing} // Disable if not active or processing
             >
               {isSummarizing ? (
                 <>
                   <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Summarizing...
                 </>
               ) : projectSummary ? (
                  "Regenerate Summary" // Change button text after summary generation
               ) : (
                  "Generate Summary"
               )}
             </Button>
           </CardFooter>
         </Card>


        {/* Step 4: Chat Interface */}
        <Card className={`w-full shadow-lg ${!chatActive || isProcessing ? 'opacity-60 pointer-events-none' : ''}`}>
          <CardHeader>
            <CardTitle>Step 4: Chat with AI</CardTitle>
            <CardDescription>
               {chatActive ? "Ask questions about your project data based on the summary and uploaded files." : "Generate a summary first to enable the chat."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChatInterface
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoadingChat || isReadingFiles} // Combine chat loading states
              disabled={!chatActive || isProcessing} // Disable if chat not active or processing
              industry={selectedIndustry?.value}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
