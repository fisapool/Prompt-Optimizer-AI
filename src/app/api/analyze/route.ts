import { NextResponse } from 'next/server';
import { analyzeDocument } from '@/lib/documentAnalysis';

// Define supported file types and their MIME types
const SUPPORTED_FILE_TYPES = {
  // Text files
  '.txt': ['text/plain'] as const,
  '.md': ['text/markdown', 'text/x-markdown'] as const,
  '.csv': ['text/csv', 'application/csv'] as const,
  
  // Document files
  '.xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'] as const,
  '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'] as const,
  '.pdf': ['application/pdf'] as const,
} as const;

// Create a type for all possible MIME types
type SupportedMimeType = typeof SUPPORTED_FILE_TYPES[keyof typeof SUPPORTED_FILE_TYPES][number];

// Create a flat array of all supported MIME types
const SUPPORTED_MIME_TYPES: SupportedMimeType[] = Object.values(SUPPORTED_FILE_TYPES).flat();

// Create a set of supported file extensions
const SUPPORTED_EXTENSIONS = new Set(Object.keys(SUPPORTED_FILE_TYPES));

function validateFileType(file: File): boolean {
  // Get the file extension
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  
  // Check if the extension is supported
  if (!extension || !SUPPORTED_EXTENSIONS.has(extension)) {
    return false;
  }
  
  // Get the allowed MIME types for this extension
  const allowedMimeTypes = SUPPORTED_FILE_TYPES[extension as keyof typeof SUPPORTED_FILE_TYPES];
  
  // Check if the file's MIME type is allowed
  return (allowedMimeTypes as readonly string[]).includes(file.type);
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as unknown as File;
    
    if (!file) {
      return NextResponse.json(
        { 
          error: 'No file provided',
          message: 'Please select a file to upload'
        },
        { status: 400 }
      );
    }

    // Validate file type
    if (!validateFileType(file)) {
      return NextResponse.json(
        { 
          error: 'Invalid file type',
          message: 'Please upload a supported file type',
          supportedTypes: Object.keys(SUPPORTED_FILE_TYPES)
        },
        { status: 400 }
      );
    }

    const result = await analyzeDocument(file);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error analyzing document:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze document',
        message: 'There was an error processing your file'
      },
      { status: 500 }
    );
  }
} 