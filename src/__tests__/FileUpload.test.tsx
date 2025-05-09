import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FileUpload } from '../components/FileUpload';

describe('FileUpload', () => {
  let mockOnFileUpload: (files: FileList | null) => void;
  const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
  const mockFile2 = new File(['test content 2'], 'test2.txt', { type: 'text/plain' });

  beforeEach(() => {
    mockOnFileUpload = (files: FileList | null) => {
      // Mock implementation
    };
  });

  it('renders upload interface with correct elements', () => {
    render(<FileUpload onFileUpload={mockOnFileUpload} />);
    
    expect(screen.getByText('Click to upload')).toBeInTheDocument();
    expect(screen.getByText('or drag and drop')).toBeInTheDocument();
    expect(screen.getByText('Browse Files')).toBeInTheDocument();
    expect(screen.getByText(/Multiple files allowed/)).toBeInTheDocument();
  });

  it('handles file selection through input', async () => {
    let uploadedFiles: FileList | null = null;
    mockOnFileUpload = (files) => {
      uploadedFiles = files;
    };

    render(<FileUpload onFileUpload={mockOnFileUpload} />);
    
    const input = screen.getByTestId('file-upload');
    const fileList = new DataTransfer();
    fileList.items.add(mockFile);
    
    fireEvent.change(input, { target: { files: fileList.files } });
    
    await waitFor(() => {
      expect(screen.getByText('test.txt')).toBeInTheDocument();
      expect(uploadedFiles).not.toBeNull();
    });
  });

  it('handles drag and drop', async () => {
    let uploadedFiles: FileList | null = null;
    mockOnFileUpload = (files) => {
      uploadedFiles = files;
    };

    render(<FileUpload onFileUpload={mockOnFileUpload} />);
    
    const dropzone = screen.getByTestId('dropzone-label');
    
    // Simulate drag enter
    fireEvent.dragEnter(dropzone);
    expect(dropzone).toHaveClass('border-primary');
    
    // Simulate drop
    const fileList = new DataTransfer();
    fileList.items.add(mockFile);
    
    fireEvent.drop(dropzone, {
      dataTransfer: {
        files: fileList.files
      }
    });
    
    await waitFor(() => {
      expect(screen.getByText('test.txt')).toBeInTheDocument();
      expect(uploadedFiles).not.toBeNull();
    });
  });

  it('handles multiple file selection', async () => {
    let uploadedFiles: FileList | null = null;
    mockOnFileUpload = (files) => {
      uploadedFiles = files;
    };

    render(<FileUpload onFileUpload={mockOnFileUpload} />);
    
    const input = screen.getByTestId('file-upload');
    const fileList = new DataTransfer();
    fileList.items.add(mockFile);
    fileList.items.add(mockFile2);
    
    fireEvent.change(input, { target: { files: fileList.files } });
    
    await waitFor(() => {
      expect(screen.getByText('test.txt')).toBeInTheDocument();
      expect(screen.getByText('test2.txt')).toBeInTheDocument();
      expect(uploadedFiles).not.toBeNull();
    });
  });

  it('removes individual files', async () => {
    let uploadedFiles: FileList | null = null;
    mockOnFileUpload = (files) => {
      uploadedFiles = files;
    };

    render(<FileUpload onFileUpload={mockOnFileUpload} />);
    
    // Add files
    const input = screen.getByTestId('file-upload');
    const fileList = new DataTransfer();
    fileList.items.add(mockFile);
    fileList.items.add(mockFile2);
    
    fireEvent.change(input, { target: { files: fileList.files } });
    
    // Remove first file
    const removeButton = screen.getAllByLabelText(/Remove/)[0];
    fireEvent.click(removeButton);
    
    await waitFor(() => {
      expect(screen.queryByText('test.txt')).not.toBeInTheDocument();
      expect(screen.getByText('test2.txt')).toBeInTheDocument();
      expect(uploadedFiles).not.toBeNull();
    });
  });

  it('clears all files', async () => {
    let uploadedFiles: FileList | null = null;
    mockOnFileUpload = (files) => {
      uploadedFiles = files;
    };

    render(<FileUpload onFileUpload={mockOnFileUpload} />);
    
    // Add files
    const input = screen.getByTestId('file-upload');
    const fileList = new DataTransfer();
    fileList.items.add(mockFile);
    fileList.items.add(mockFile2);
    
    fireEvent.change(input, { target: { files: fileList.files } });
    
    // Clear all files
    const clearButton = screen.getByLabelText('Remove all selected files');
    fireEvent.click(clearButton);
    
    await waitFor(() => {
      expect(screen.queryByText('test.txt')).not.toBeInTheDocument();
      expect(screen.queryByText('test2.txt')).not.toBeInTheDocument();
      expect(uploadedFiles).toBeNull();
    });
  });

  it('disables upload when disabled prop is true', () => {
    render(<FileUpload onFileUpload={mockOnFileUpload} disabled={true} />);
    
    const dropzone = screen.getByTestId('dropzone-label');
    expect(dropzone).toHaveClass('cursor-not-allowed');
    expect(dropzone).toHaveClass('opacity-50');
    
    const browseButton = screen.getByText('Browse Files');
    expect(browseButton).toBeDisabled();
  });

  it('prevents duplicate file uploads', async () => {
    let uploadedFiles: FileList | null = null;
    mockOnFileUpload = (files) => {
      uploadedFiles = files;
    };

    render(<FileUpload onFileUpload={mockOnFileUpload} />);
    
    const input = screen.getByTestId('file-upload');
    const fileList = new DataTransfer();
    fileList.items.add(mockFile);
    
    // Upload first time
    fireEvent.change(input, { target: { files: fileList.files } });
    
    // Try to upload the same file again
    fireEvent.change(input, { target: { files: fileList.files } });
    
    await waitFor(() => {
      const fileElements = screen.getAllByText('test.txt');
      expect(fileElements).toHaveLength(1);
    });
  });

  it('displays file size in KB', async () => {
    render(<FileUpload onFileUpload={mockOnFileUpload} />);
    
    const input = screen.getByTestId('file-upload');
    const fileList = new DataTransfer();
    fileList.items.add(mockFile);
    
    fireEvent.change(input, { target: { files: fileList.files } });
    
    await waitFor(() => {
      expect(screen.getByText(/\(0.0 KB\)/)).toBeInTheDocument();
    });
  });
});
