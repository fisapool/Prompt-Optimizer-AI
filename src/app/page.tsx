// src/app/page.tsx
'use client';

import type * as React from 'react';
import { useState, useCallback } from 'react';
import { analyzeProjectData, type AnalyzeProjectDataInput } from '@/ai/flows/analyze-project-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IndustrySelector, type Industry } from '@/components/IndustrySelector';
import { FileUpload } from '@/components/FileUpload';
import { ChatInterface, type Message } from '@/components/ChatInterface';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

// Define structure for uploaded file state
interface UploadedFile {
  name: string;
  dataUri: string;
  mimeType: string;
}

export default function Home() {
  const [selectedIndustry, setSelectedIndustry] = useState<Industry | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReadingFiles, setIsReadingFiles] = useState(false); // State for file reading

  const handleFileUpload = useCallback((fileList: FileList | null) => {
    setError(null);
    if (!fileList || fileList.length === 0) {
      setUploadedFiles([]); // Clear files if null or empty list is passed
      setMessages([]); // Clear chat if files are removed
      return;
    }

    setIsReadingFiles(true); // Start reading indicator
    // Add a system message to indicate file reading is in progress
     setMessages([{ id: 'system-reading', role: 'system', content: 'reading' }]);

    const filesArray = Array.from(fileList);
    const fileReadPromises: Promise<UploadedFile>[] = [];

    filesArray.forEach((file) => {
      const promise = new Promise<UploadedFile>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUri = e.target?.result as string;
          const mimeType = file.type || 'application/octet-stream'; // Get MIME type or default
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
        // Reset chat when new files are uploaded, removing system message
        setMessages([
          {
            id: 'initial',
            role: 'assistant',
            content: `${newFilesData.length} file(s) uploaded successfully. How can I help you analyze these projects?`,
          }
        ]);
      })
      .catch((err) => {
        console.error("Error reading one or more files:", err);
        setError(`Error reading files: ${err.message}`);
        setUploadedFiles([]); // Clear files on error
        setMessages([]); // Clear messages on error, including system message
      })
      .finally(() => {
        setIsReadingFiles(false); // Stop reading indicator
      });
  }, []); // No dependencies needed here

  const handleSendMessage = async (messageContent: string) => {
    if (uploadedFiles.length === 0 || !selectedIndustry) {
      setError("Please select an industry and upload at least one project file first.");
      return;
    }
    if (isLoading || isReadingFiles) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: messageContent };
    setMessages((prev) => [...prev.filter(m => m.role !== 'system'), userMessage]); // Remove system messages before adding user message
    setIsLoading(true);
    setError(null);

    try {
       // Prepare input for the AI flow
      const aiInput: AnalyzeProjectDataInput = {
        files: uploadedFiles.map(f => ({
          fileDataUri: f.dataUri,
          fileName: f.name,
          mimeType: f.mimeType, // Pass mimeType
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
      setIsLoading(false);
    }
  };

  // Use combined loading state for UI elements
  const combinedLoading = isLoading || isReadingFiles;
  // Determine if the chat should be disabled
  const chatDisabled = !selectedIndustry || uploadedFiles.length === 0 || isReadingFiles;

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-12 lg:p-24 bg-background">
      <div className="w-full max-w-4xl space-y-8">
        <header className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
            ProjectWise AI
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Upload your project files, select your industry, and let AI help you analyze and discuss your projects.
          </p>
        </header>

        {error && (
          <Alert variant="destructive">
             <Terminal className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

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
                // Optionally reset chat if industry changes after files are uploaded
                if (uploadedFiles.length > 0) {
                   setMessages([{
                       id: 'initial',
                       role: 'assistant',
                       content: `${uploadedFiles.length} file(s) uploaded. Industry set to ${industry?.label || 'General'}. How can I help?`,
                   }]);
                 }
              }}
              disabled={combinedLoading && !!selectedIndustry} // Disable selector while loading if an industry is already selected
            />
          </CardContent>
        </Card>

        <Card className="w-full shadow-lg">
          <CardHeader>
            <CardTitle>Step 2: Upload Project Files</CardTitle>
            <CardDescription>Upload one or more project management files (e.g., .txt, .csv, .json). PDF, XLSX, MPP files will be skipped during analysis.</CardDescription>
          </CardHeader>
          <CardContent>
            <FileUpload
              onFileUpload={handleFileUpload}
              disabled={combinedLoading} // Disable upload while loading
              accept=".txt,.csv,.json,.pdf,.xlsx,.xls,.mpp" // Accept all relevant types, filtering happens in AI flow
            />
          </CardContent>
        </Card>

        <Card className={`w-full shadow-lg ${chatDisabled ? 'opacity-50' : ''}`}>
          <CardHeader>
            <CardTitle>Step 3: Chat with AI</CardTitle>
            <CardDescription>Ask questions about your project data. Use the suggestions or type your own.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChatInterface
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={combinedLoading} // Pass combined loading state
              disabled={chatDisabled} // Pass explicit disabled state
              industry={selectedIndustry?.value} // Pass selected industry value
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
