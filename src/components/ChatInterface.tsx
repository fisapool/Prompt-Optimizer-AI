'use client';

import type * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, FileText } from 'lucide-react'; // Added FileText
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar'; // Removed AvatarImage as it wasn't used
import { cn } from '@/lib/utils';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system'; // Added system role for file reading status
  content: string;
}

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (message: string) => Promise<void>;
  isLoading: boolean; // Combined loading state (file reading + AI processing)
  disabled?: boolean; // To disable input/button when prerequisites aren't met
}

export function ChatInterface({ messages, onSendMessage, isLoading, disabled = false }: ChatInterfaceProps) {
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

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault(); // Prevent default form submission or newline
      handleSendClick();
    }
  };

  useEffect(() => {
    // Scroll to bottom when new messages arrive or loading state changes
    if (scrollAreaRef.current) {
      // Find the viewport element within the ScrollArea
      const viewport = scrollAreaRef.current.querySelector<HTMLElement>('[data-radix-scroll-area-viewport]');
      if (viewport) {
        // Use requestAnimationFrame to ensure scrolling happens after layout updates
        requestAnimationFrame(() => {
          viewport.scrollTop = viewport.scrollHeight;
        });
      }
    }
  }, [messages, isLoading]);


  // Filter out system messages before rendering
  const displayMessages = messages.filter(msg => msg.role !== 'system');

  return (
    <div className="flex flex-col h-[500px] border rounded-lg overflow-hidden">
       <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
         <div className="space-y-4">
          {displayMessages.length === 0 && !disabled && (
             <div className="text-center text-muted-foreground p-4">
               Ask questions about the uploaded project file(s). For example: "Summarize the key milestones across all projects." or "Identify potential risks mentioned."
             </div>
           )}
           {disabled && displayMessages.length === 0 && (
             <div className="text-center text-muted-foreground p-4">
                Please select an industry and upload file(s) to start the chat.
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
                  "max-w-[85%] rounded-lg px-4 py-2 break-words text-sm md:text-base", // Responsive text size
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {/* Render newlines correctly */}
                {message.content.split('\n').map((line, index) => (
                  <p key={index} className={cn("min-h-[1em]", index > 0 ? "mt-1" : "")}>{line || '\u00A0'}</p> // Ensure empty lines render
                ))}
              </div>
              {message.role === 'user' && (
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback><User size={18} /></AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          {/* Show loading indicator */}
          {isLoading && (
            <div className="flex items-start gap-3 justify-start">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback><Bot size={18} /></AvatarFallback>
              </Avatar>
              <div className="bg-muted text-muted-foreground rounded-lg px-4 py-2 flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                 {/* Determine message based on whether files are still being read (using system message) */}
                 <span>{messages.some(m => m.role === 'system' && m.content === 'reading') ? 'Reading files...' : 'Analyzing...'}</span>
              </div>
            </div>
          )}
         </div>
      </ScrollArea>
      <div className="flex items-center p-4 border-t bg-background">
        <Input
          type="text"
          placeholder={disabled ? "Select industry and upload file(s) first..." : "Ask about your project(s)..."}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="flex-1 mr-2"
          disabled={isLoading || disabled}
          aria-label="Chat input"
        />
        <Button
          onClick={handleSendClick}
          disabled={isLoading || !input.trim() || disabled}
          aria-label="Send message"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
