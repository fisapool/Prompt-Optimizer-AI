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
  
  // Special handling for spreadsheet files
  if (extension === '.xls' || extension === '.xlsx') {
    if (file.type === 'application/vnd.ms-excel' || 
        file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      // This is a supported spreadsheet file
      return true;
    }
    return false;
  }
  
  // For other files, check MIME type and extension
  const isValidMimeType = SUPPORTED_MIME_TYPES.includes(file.type as SupportedMimeType);
  const isValidExtension = extension ? SUPPORTED_EXTENSIONS.has(extension) : false;
  
  return isValidMimeType && isValidExtension;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { 
          error: 'No file provided',
          message: 'There seems to be an issue with the file'
        },
        { status: 400 }
      );
    }

    // Get file extension
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();

    // Validate file type
    if (!validateFileType(file)) {
      if (extension === '.xls' || extension === '.xlsx') {
        return NextResponse.json(
          { 
            error: 'Invalid file type',
            message: 'We do not support these types of file uploads, remove these types'
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { 
          error: 'Invalid file type',
          message: 'There seems to be an issue with the file',
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
        message: 'There seems to be an issue with code'
      },
      { status: 500 }
    );
  }
} 