import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Question {
  id: string;
  text: string;
  type: 'relationship' | 'summary' | 'detail' | 'why' | 'synthesis';
}

interface QuestionSetProps {
  questions: Question[];
  onQuestionClick?: (question: Question) => void;
}

export function QuestionSet({ questions, onQuestionClick }: QuestionSetProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCopy = async (question: Question) => {
    try {
      // Try using the modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(question.text);
      } else {
        // Fallback for browsers that don't support clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = question.text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
        } catch (err) {
          throw new Error('Failed to copy text');
        } finally {
          textArea.remove();
        }
      }

      setCopiedId(question.id);
      toast({
        title: "Copied!",
        description: "Question copied to clipboard",
        duration: 2000,
      });
      setTimeout(() => setCopiedId(null), 1500);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy question",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Explore Documents</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {questions.map((question) => (
            <div
              key={question.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex-1">
                <p className="text-sm font-medium">{question.text}</p>
                <span className="text-xs text-muted-foreground capitalize">
                  {question.type}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleCopy(question)}
                  className="h-8 w-8 hover:bg-accent"
                  aria-label={copiedId === question.id ? "Copied!" : "Copy question"}
                >
                  {copiedId === question.id ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                {onQuestionClick && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onQuestionClick(question)}
                    className="hover:bg-accent"
                  >
                    Use
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 