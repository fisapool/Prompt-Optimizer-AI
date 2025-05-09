import { ValidationTestCase } from './types';

export const sampleTestCase: ValidationTestCase = {
  id: 'construction-project-001',
  industry: 'Construction',
  inputFiles: [
    {
      name: 'project-specs.txt',
      content: `Project: Office Building Renovation
Location: 123 Main St, Downtown
Timeline: 6 months
Budget: $2.5M
Key Requirements:
- LEED Gold certification
- Seismic retrofitting
- Energy efficiency upgrades
- ADA compliance updates
- Modern HVAC system installation

Stakeholders:
- Building Owner: ABC Corp
- General Contractor: XYZ Construction
- Architect: Design Plus
- Engineering: Tech Solutions Inc

Risks:
- Historical building restrictions
- Supply chain delays
- Weather impact on exterior work
- Tenant coordination during renovation`,
      mimeType: 'text/plain',
    },
    {
      name: 'budget-breakdown.csv',
      content: `Category,Amount,Notes
Materials,$1.2M,Including contingencies
Labor,$800K,Union rates
Equipment,$200K,Rental and purchase
Permits,$100K,Including environmental
Contingency,$200K,10% buffer`,
      mimeType: 'text/csv',
    },
  ],
  expectedSummary: {
    keyPoints: [
      'LEED Gold certification',
      'Seismic retrofitting',
      'Energy efficiency upgrades',
      'ADA compliance',
      'Modern HVAC system',
      '$2.5M budget',
      '6-month timeline',
    ],
    requiredElements: [
      'Project scope',
      'Timeline',
      'Budget',
      'Stakeholders',
      'Risks',
    ],
  },
  expectedSuggestions: {
    requiredTypes: [
      'safety',
      'compliance',
      'efficiency',
      'cost',
      'timeline',
    ],
    minCount: 3,
    maxCount: 5,
  },
  expectedOptimizedPrompt: {
    requiredElements: [
      'LEED requirements',
      'safety regulations',
      'budget constraints',
      'timeline milestones',
      'stakeholder requirements',
    ],
    maxLength: 500,
    format: 'markdown',
  },
}; 