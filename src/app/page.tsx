'use client';

import type * as React from 'react';
import { useState } from 'react';
import { analyzeProjectData } from '@/ai/flows/analyze-project-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IndustrySelector, type Industry } from '@/components/IndustrySelector';
import { FileUpload } from '@/components/FileUpload';
import { ChatInterface, type Message } from '@/components/ChatInterface';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

export default function Home() {
  const [selectedIndustry, setSelectedIndustry] = useState<Industry | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; dataUri: string | null }>({ name: '', dataUri: null });
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (file: File | null) => {
    if (file) {
      setIsLoading(true);
      setError(null);
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUri = e.target?.result as string;
        setUploadedFile({ name: file.name, dataUri });
        // Reset chat when a new file is uploaded
        setMessages([
          {
            id: 'initial',
            role: 'assistant',
            content: `File "${file.name}" uploaded successfully. How can I help you analyze this project?`,
          }
        ]);
        setIsLoading(false);
      };
      reader.onerror = () => {
        setError('Error reading file.');
        setUploadedFile({ name: '', dataUri: null });
        setIsLoading(false);
      };
      reader.readAsDataURL(file);
    } else {
      setUploadedFile({ name: '', dataUri: null });
      setMessages([]); // Clear chat if file is removed
    }
  };

  const handleSendMessage = async (messageContent: string) => {
    if (!uploadedFile.dataUri || !selectedIndustry) {
      setError("Please select an industry and upload a project file first.");
      return;
    }
    if (isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: messageContent };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const aiResponse = await analyzeProjectData({
        fileDataUri: uploadedFile.dataUri,
        question: messageContent,
        industry: selectedIndustry.value,
      });

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

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-12 lg:p-24 bg-background">
      <div className="w-full max-w-4xl space-y-8">
        <header className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
            ProjectWise AI
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Upload your project file, select your industry, and let AI help you analyze and discuss your project.
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
            <CardDescription>Choose the industry that best represents your project.</CardDescription>
          </CardHeader>
          <CardContent>
            <IndustrySelector
              selectedIndustry={selectedIndustry}
              onSelectIndustry={setSelectedIndustry}
            />
          </CardContent>
        </Card>

        <Card className="w-full shadow-lg">
          <CardHeader>
            <CardTitle>Step 2: Upload Project File</CardTitle>
            <CardDescription>Upload your project management file (e.g., .mpp, .xlsx, .csv, .pdf).</CardDescription>
          </CardHeader>
          <CardContent>
            <FileUpload onFileUpload={handleFileUpload} disabled={isLoading} />
            {uploadedFile.name && (
              <p className="mt-4 text-sm text-muted-foreground">Uploaded: {uploadedFile.name}</p>
            )}
          </CardContent>
        </Card>

        <Card className={`w-full shadow-lg ${!selectedIndustry || !uploadedFile.dataUri ? 'opacity-50 pointer-events-none' : ''}`}>
          <CardHeader>
            <CardTitle>Step 3: Chat with AI</CardTitle>
            <CardDescription>Ask questions about your project data.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChatInterface
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              disabled={!selectedIndustry || !uploadedFile.dataUri}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
