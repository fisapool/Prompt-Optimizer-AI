import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { IndustrySelector } from '../components/IndustrySelector';

describe('IndustrySelector', () => {
  let selectedIndustry: any = null;
  const mockOnSelectIndustry = (industry: any) => {
    selectedIndustry = industry;
  };

  beforeEach(() => {
    selectedIndustry = null;
  });

  it('renders with placeholder', () => {
    render(
      <IndustrySelector
        selectedIndustry={null}
        onSelectIndustry={mockOnSelectIndustry}
      />
    );
    
    expect(screen.getByText('Select an industry...')).toBeInTheDocument();
  });

  it('shows all industry options when clicked', () => {
    render(
      <IndustrySelector
        selectedIndustry={null}
        onSelectIndustry={mockOnSelectIndustry}
      />
    );
    
    const trigger = screen.getByRole('combobox');
    fireEvent.click(trigger);
    
    expect(screen.getByText('Construction')).toBeInTheDocument();
    expect(screen.getByText('Software Development')).toBeInTheDocument();
    expect(screen.getByText('Healthcare')).toBeInTheDocument();
    expect(screen.getByText('Marketing')).toBeInTheDocument();
    expect(screen.getByText('General Business')).toBeInTheDocument();
  });

  it('calls onSelectIndustry when an industry is selected', () => {
    render(
      <IndustrySelector
        selectedIndustry={null}
        onSelectIndustry={mockOnSelectIndustry}
      />
    );
    
    const trigger = screen.getByRole('combobox');
    fireEvent.click(trigger);
    
    const option = screen.getByText('Software Development');
    fireEvent.click(option);
    
    expect(selectedIndustry).toEqual(expect.objectContaining({
      value: 'software',
      label: 'Software Development'
    }));
  });

  it('disables selection when disabled prop is true', () => {
    render(
      <IndustrySelector
        selectedIndustry={null}
        onSelectIndustry={mockOnSelectIndustry}
        disabled={true}
      />
    );
    
    const trigger = screen.getByRole('combobox');
    expect(trigger).toBeDisabled();
  });

  it('displays selected industry', () => {
    const selectedIndustry = {
      value: 'software',
      label: 'Software Development',
      icon: expect.any(Function)
    };

    render(
      <IndustrySelector
        selectedIndustry={selectedIndustry}
        onSelectIndustry={mockOnSelectIndustry}
      />
    );
    
    expect(screen.getByText('Software Development')).toBeInTheDocument();
  });
}); 