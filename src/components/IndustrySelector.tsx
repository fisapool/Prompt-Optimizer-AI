'use client';

import type * as React from 'react';
import { Building, Code, HeartPulse, Megaphone, HardHat } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export interface Industry {
  value: string;
  label: string;
  icon: React.ElementType;
}

const industries: Industry[] = [
  { value: 'construction', label: 'Construction', icon: HardHat },
  { value: 'software', label: 'Software Development', icon: Code },
  { value: 'healthcare', label: 'Healthcare', icon: HeartPulse },
  { value: 'marketing', label: 'Marketing', icon: Megaphone },
  { value: 'general', label: 'General Business', icon: Building },
];

export interface IndustrySelectorProps {
  selectedIndustry: Industry | null;
  onSelectIndustry: (industry: Industry | null) => void;
  disabled?: boolean;
}

export function IndustrySelector({
  selectedIndustry,
  onSelectIndustry,
  disabled = false
}: IndustrySelectorProps) {
  const handleValueChange = (value: string) => {
    const industry = industries.find((ind) => ind.value === value) || null;
    onSelectIndustry(industry);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="industry-select">Industry</Label>
      <Select value={selectedIndustry?.value} onValueChange={handleValueChange} disabled={disabled}>
        <SelectTrigger id="industry-select" className="w-full">
          <SelectValue placeholder="Select an industry..." />
        </SelectTrigger>
        <SelectContent>
          {industries.map((industry) => (
            <SelectItem key={industry.value} value={industry.value}>
              <div className="flex items-center gap-2">
                <industry.icon className="h-4 w-4 text-muted-foreground" />
                <span>{industry.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default IndustrySelector;
