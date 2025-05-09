import { ValidationService } from '../../../services/validation/validation-service';
import { MedicalImagingPlugin } from '../../../plugins/medicalImagingPlugin';

describe('Healthcare Validation', () => {
  let validationService: ValidationService;
  let medicalImagingPlugin: MedicalImagingPlugin;

  beforeEach(() => {
    validationService = new ValidationService();
    medicalImagingPlugin = new MedicalImagingPlugin();
  });

  describe('Medical Imaging Analysis', () => {
    const mriTestCase = {
      id: 'mri-analysis-001',
      industry: 'Healthcare',
      inputFiles: [
        {
          name: 'mri-project-specs.txt',
          content: `Project: MRI Analysis Automation
Modality: Magnetic Resonance Imaging
Clinical Focus: Brain Tumor Detection
Requirements:
- Must process DICOM images
- Shall detect tumors and lesions
- Should integrate with PACS
- Need to generate preliminary reports
- Must comply with HIPAA
- Should follow FDA guidelines

Goals:
- Improve detection accuracy
- Reduce analysis time
- Enhance report quality
- Ensure patient data security

Constraints:
- Processing time < 5 minutes
- Accuracy > 95%
- Budget: $500K
- Timeline: 6 months`,
          mimeType: 'text/plain',
        },
        {
          name: 'requirements.csv',
          content: `Category,Requirement,Priority
Performance,Process time < 5min,High
Accuracy,Detection rate > 95%,High
Integration,PACS compatibility,Medium
Security,HIPAA compliance,High
Quality,Report generation,Medium`,
          mimeType: 'text/csv',
        },
      ],
      expectedSummary: {
        keyPoints: [
          'MRI Analysis Automation',
          'Brain Tumor Detection',
          'DICOM processing',
          'PACS integration',
          'HIPAA compliance',
          'FDA guidelines',
          '95% accuracy',
          '5-minute processing',
        ],
        requiredElements: [
          'Modality',
          'Clinical Focus',
          'Requirements',
          'Goals',
          'Constraints',
        ],
      },
      expectedSuggestions: {
        requiredTypes: [
          'performance',
          'accuracy',
          'security',
          'integration',
          'compliance',
        ],
        minCount: 4,
        maxCount: 6,
      },
      expectedOptimizedPrompt: {
        requiredElements: [
          'MRI analysis requirements',
          'tumor detection specifications',
          'performance metrics',
          'security requirements',
          'integration needs',
        ],
        maxLength: 500,
        format: 'markdown',
      },
    };

    it('should validate MRI analysis project correctly', async () => {
      await validationService.addTestCase(mriTestCase);
      const result = await validationService.runValidation(mriTestCase.id);

      expect(result.summaryScore).toBeGreaterThan(0.8);
      expect(result.suggestionsScore).toBeGreaterThan(0.8);
      expect(result.optimizedPromptScore).toBeGreaterThan(0.8);
      expect(result.overallScore).toBeGreaterThan(0.8);
    });

    it('should detect imaging modality correctly', () => {
      const modality = medicalImagingPlugin['detectImagingModality'](mriTestCase.inputFiles[0].content);
      expect(modality).toBe('MRI');
    });

    it('should identify clinical applications', () => {
      const applications = medicalImagingPlugin['identifyClinicalApplications'](mriTestCase.inputFiles[0].content);
      expect(applications).toContain('Diagnosis');
      expect(applications).toContain('Treatment Planning');
    });

    it('should identify regulatory requirements', () => {
      const requirements = medicalImagingPlugin['identifyRegulatoryRequirements'](mriTestCase.inputFiles[0].content);
      expect(requirements).toContain('HIPAA');
      expect(requirements).toContain('FDA');
    });
  });

  describe('Edge Cases', () => {
    const baseTestCase = {
      id: 'base-test-001',
      industry: 'Healthcare',
      inputFiles: [
        {
          name: 'base-specs.txt',
          content: 'Base test case content',
          mimeType: 'text/plain',
        },
      ],
      expectedSummary: {
        keyPoints: ['Base test case'],
        requiredElements: ['Content'],
      },
      expectedSuggestions: {
        requiredTypes: ['test'],
        minCount: 1,
        maxCount: 1,
      },
      expectedOptimizedPrompt: {
        requiredElements: ['test'],
        maxLength: 100,
        format: 'markdown',
      },
    };

    it('should handle DICOM file validation', async () => {
      const dicomTestCase = {
        ...baseTestCase,
        id: 'dicom-test-001',
        inputFiles: [
          {
            name: 'sample.dcm',
            content: 'DICOM file content would be here',
            mimeType: 'application/dicom',
          },
        ],
      };

      await validationService.addTestCase(dicomTestCase);
      const result = await validationService.runValidation(dicomTestCase.id);
      expect(result).toBeDefined();
    });

    it('should handle patient data privacy requirements', async () => {
      const privacyTestCase = {
        ...baseTestCase,
        id: 'privacy-test-001',
        inputFiles: [
          {
            name: 'privacy-requirements.txt',
            content: `Patient Data Privacy Requirements:
- Must comply with HIPAA
- Shall implement data encryption
- Should maintain audit logs
- Need to ensure data anonymization
- Must follow GDPR guidelines`,
            mimeType: 'text/plain',
          },
        ],
      };

      await validationService.addTestCase(privacyTestCase);
      const result = await validationService.runValidation(privacyTestCase.id);
      expect(result.summaryScore).toBeGreaterThan(0.8);
    });
  });
}); 