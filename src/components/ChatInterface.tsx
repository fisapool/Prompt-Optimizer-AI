// src/components/ChatInterface.tsx
'use client';

import type * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, Sparkles, Wand2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Static fallback prompts - now focused on customization aspects
const staticExamplePrompts: Record<string, string[]> = {
  general: [
    "Focus on the main objective.",
    "Emphasize the budget constraints.",
    "Target audience should be technical.",
    "Specify the desired output format as JSON.",
  ],
  construction: [
    "Highlight safety regulations.",
    "Specify LEED certification requirements.",
    "Mention the use of specific materials.",
    "Require a Gantt chart output.",
  ],
  software: [
    "Specify the programming language (e.g., Python).",
    "Require adherence to Agile methodology.",
    "Mention integration with specific APIs.",
    "Request code comments in the output.",
  ],
  healthcare: [
    "Emphasize patient confidentiality (HIPAA).",
    "Specify compliance with FDA regulations.",
    "Require anonymized data examples.",
    "Mention target demographic for a trial.",
  ],
  marketing: [
    "Specify the campaign tone (e.g., formal, casual).",
    "Define the primary call-to-action.",
    "Require A/B testing suggestions.",
    "Mention target social media platforms.",
  ],
};

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (message: string) => Promise<void>;
  onClearChat: () => void;
  isLoading: boolean;
  disabled?: boolean;
  promptSuggestions: string[];
  isLoadingSuggestions: boolean;
  industry?: string | null;
  chatPurpose?: 'chat' | 'customization';
  promptCustomizations: string[];
}

export function ChatInterface({
  messages,
  onSendMessage,
  onClearChat,
  isLoading,
  disabled = false,
  promptSuggestions,
  isLoadingSuggestions,
  industry,
  chatPurpose = 'chat',
  promptCustomizations
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInput(event.target.value);
  };

  const handleSendClick = () => {
    if (input.trim() && !isLoading && !disabled) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handlePromptClick = (prompt: string) => {
    if (!isLoading && !disabled) {
      setInput((prevInput) => {
        const trimmedInput = prevInput.trim();
        if (trimmedInput === '') {
          return prompt;
        } else {
          return `${trimmedInput}\n${prompt}`;
        }
      });
      const inputElement = document.querySelector<HTMLInputElement>('[aria-label="Chat input"]');
      inputElement?.focus();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendClick();
    }
  };

  const handleClearClick = () => {
    if (!isLoading && !disabled) {
      onClearChat();
      setInput('');
    }
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector<HTMLElement>('[data-radix-scroll-area-viewport]');
      if (viewport) {
        requestAnimationFrame(() => {
          viewport.scrollTop = viewport.scrollHeight;
        });
      }
    }
  }, [messages, isLoading, isLoadingSuggestions]);

  const displayMessages = messages.filter(msg => msg.role !== 'system');

  const aiSuggestions = promptSuggestions.length > 0 ? promptSuggestions : [];
  const fallbackSuggestions = (industry && staticExamplePrompts[industry]) ? staticExamplePrompts[industry] : staticExamplePrompts.general;

  const inputPlaceholder = disabled
    ? "Generate summary first..."
    : chatPurpose === 'customization'
      ? "Add prompt customization details..."
      : "Ask about your project(s)...";

  const sendButtonLabel = chatPurpose === 'customization' ? "Add Customization" : "Send Message";
  const clearButtonTooltip = chatPurpose === 'customization' ? "Clear Customizations" : "Clear Chat";
  const suggestionsTitle = chatPurpose === 'customization'
    ? (promptSuggestions.length > 0 ? "Suggested customizations (click to add):" : "Need ideas? Try these customization examples:")
    : (promptSuggestions.length > 0 ? "Suggested prompts based on your data:" : "Need inspiration? Try these examples:");
  const suggestionsFooter = chatPurpose === 'customization' ? "Or type your own customization below." : "Or type your own question below.";
  const disabledText = chatPurpose === 'customization'
    ? "Please select industry, upload file(s), and generate the summary & suggestions to enable prompt customization."
    : "Please select industry, upload file(s), and generate the summary & suggestions to enable chat.";

  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex flex-col min-h-[600px] border rounded-lg overflow-hidden max-w-4xl">
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-4 w-full">
            {!disabled && displayMessages.length === 0 && (
              <div className="text-center text-muted-foreground p-4 space-y-4 flex flex-col items-center w-full min-h-[400px]">
                {isLoadingSuggestions ? (
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Generating suggestions...</span>
                  </div>
                ) : (
                  <>
                    {aiSuggestions.length > 0 && (
                      <div className="mb-2 w-full">
                        <div className="flex items-center justify-center gap-2">
                          <Wand2 className="h-5 w-5 text-blue-500" />
                          <span className="font-semibold text-blue-700">AI Suggestions</span>
                          <span className="ml-2 px-2 py-0.5 rounded bg-blue-100 text-xs text-blue-700">AI</span>
                        </div>
                        <div className="flex flex-wrap justify-center gap-2 mt-2 w-full">
                          {aiSuggestions.slice(0, 4).map((prompt, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              className="text-xs md:text-sm border-blue-400 bg-blue-50 hover:bg-blue-100 text-blue-800 whitespace-normal text-left h-auto py-2 px-3"
                              onClick={() => handlePromptClick(prompt)}
                              disabled={isLoading || isLoadingSuggestions}
                            >
                              <Sparkles className="inline-block mr-1 h-4 w-4 text-blue-400 flex-shrink-0" />
                              <span className="break-words">{prompt}</span>
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                    {fallbackSuggestions.length > 0 && (
                      <div className="w-full">
                        <div className="flex items-center justify-center gap-2">
                          <User className="h-5 w-5 text-green-500" />
                          <span className="font-semibold text-green-700">Your Customizations</span>
                        </div>
                        <div className="flex flex-wrap justify-center gap-2 mt-2 w-full">
                          {fallbackSuggestions.slice(0, 4).map((prompt, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              className="text-xs md:text-sm border-green-400 bg-green-50 hover:bg-green-100 text-green-800 whitespace-normal text-left h-auto py-2 px-3"
                              onClick={() => handlePromptClick(prompt)}
                              disabled={isLoading || isLoadingSuggestions}
                            >
                              <span className="break-words">{prompt}</span>
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                    <p className="mt-4">{suggestionsFooter}</p>
                  </>
                )}
              </div>
            )}
            {disabled && displayMessages.length === 0 && !isLoading && (
              <div className="text-center text-muted-foreground p-4">
                {disabledText}
              </div>
            )}

            {displayMessages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex items-start gap-3",
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback><Bot size={18} /></AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    "max-w-[85%] rounded-lg px-4 py-2 break-words text-sm md:text-base shadow-sm",
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {message.content.split('\n').map((line, index) => (
                    <p key={index} className={cn("min-h-[1em]", index > 0 ? "mt-1" : "")}>{line || '\u00A0'}</p>
                  ))}
                </div>
                {message.role === 'user' && (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback><User size={18} /></AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isLoading && chatPurpose === 'chat' && (
              <div className="flex items-start gap-3 justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback><Bot size={18} /></AvatarFallback>
                </Avatar>
                <div className="bg-muted text-muted-foreground rounded-lg px-4 py-2 flex items-center space-x-2 shadow-sm">
                  <Loading text="Analyzing" size="sm" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="flex items-center p-4 border-t bg-background">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClearClick}
                disabled={isLoading || disabled || displayMessages.length === 0}
                className="mr-2 text-muted-foreground hover:text-destructive"
                aria-label={clearButtonTooltip}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{clearButtonTooltip}</p>
            </TooltipContent>
          </Tooltip>

          <Input
            type="text"
            placeholder={inputPlaceholder}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="flex-1 mr-2"
            disabled={isLoading || disabled || isLoadingSuggestions}
            aria-label="Chat input"
          />
          <Button
            onClick={handleSendClick}
            disabled={isLoading || !input.trim() || disabled || isLoadingSuggestions}
            aria-label={sendButtonLabel}
            className="transition-all duration-200 ease-in-out"
          >
            {isLoading ? (
              <Loading text="Sending" size="sm" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}
