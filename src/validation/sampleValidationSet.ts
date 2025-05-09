import { ValidationSet, ValidationProject } from './types';

export const sampleValidationSet: ValidationSet = {
  industry: 'Healthcare',
  subIndustry: 'Medical Imaging',
  version: '1.0.0',
  createdAt: new Date(),
  projects: [
    {
      id: 'healthcare-1',
      industry: 'Healthcare',
      subIndustry: 'Medical Imaging',
      projectName: 'MRI Analysis Automation',
      projectDescription: 'A project to automate the analysis of MRI scans using AI to detect abnormalities and generate preliminary reports.',
      goldStandardSummary: 'This project aims to automate MRI scan analysis using AI. The system will process DICOM images, detect abnormalities, and generate preliminary reports. Key features include real-time analysis, integration with existing PACS systems, and automated report generation with confidence scores.',
      goldStandardPrompt: 'Analyze the following MRI scan for abnormalities. Focus on detecting tumors, lesions, and structural anomalies. Generate a preliminary report with confidence scores for each finding.',
      relevanceScores: {
        accuracy: 4.5,
        completeness: 4.0,
        usefulness: 4.5,
        efficiency: 4.0
      }
    },
    {
      id: 'healthcare-2',
      industry: 'Healthcare',
      subIndustry: 'Medical Imaging',
      projectName: 'X-ray Classification System',
      projectDescription: 'Development of an AI system to classify X-ray images into normal and abnormal categories, with specific focus on chest X-rays.',
      goldStandardSummary: 'This project develops an AI system for X-ray image classification. The system will categorize chest X-rays as normal or abnormal, with specific focus on detecting common conditions like pneumonia and tuberculosis. The system includes a user interface for radiologists to review and validate results.',
      goldStandardPrompt: 'Classify the following chest X-ray image. Determine if it shows normal anatomy or if there are signs of abnormalities. If abnormal, identify potential conditions and provide confidence scores.',
      relevanceScores: {
        accuracy: 4.0,
        completeness: 4.5,
        usefulness: 4.0,
        efficiency: 4.5
      }
    },
    {
      id: 'healthcare-3',
      industry: 'Healthcare',
      subIndustry: 'Medical Imaging',
      projectName: 'Ultrasound Image Enhancement',
      projectDescription: 'Development of an AI system to enhance ultrasound image quality and assist in real-time diagnosis.',
      goldStandardSummary: 'This project focuses on improving ultrasound image quality using AI. The system will enhance image clarity, reduce noise, and assist in real-time diagnosis. Key features include real-time image enhancement, automated measurement tools, and integration with existing ultrasound equipment.',
      goldStandardPrompt: 'Enhance the following ultrasound image. Improve clarity, reduce noise, and highlight key anatomical features. Provide measurements of relevant structures and identify any abnormalities.',
      relevanceScores: {
        accuracy: 4.2,
        completeness: 4.3,
        usefulness: 4.4,
        efficiency: 4.1
      }
    },
    {
      id: 'healthcare-4',
      industry: 'Healthcare',
      subIndustry: 'Medical Imaging',
      projectName: 'CT Scan Segmentation',
      projectDescription: 'AI-powered system for automated segmentation of CT scan images to identify and measure different tissue types.',
      goldStandardSummary: 'This project implements an AI system for automated CT scan segmentation. The system will identify and measure different tissue types, create 3D reconstructions, and assist in treatment planning. Features include multi-tissue segmentation, volume calculations, and integration with treatment planning software.',
      goldStandardPrompt: 'Segment the following CT scan image. Identify different tissue types, create 3D reconstructions, and calculate volumes. Highlight any areas of concern and provide measurements.',
      relevanceScores: {
        accuracy: 4.4,
        completeness: 4.2,
        usefulness: 4.3,
        efficiency: 4.2
      }
    },
    {
      id: 'healthcare-5',
      industry: 'Healthcare',
      subIndustry: 'Medical Imaging',
      projectName: 'Mammography Analysis System',
      projectDescription: 'AI system for analyzing mammograms to detect early signs of breast cancer and other abnormalities.',
      goldStandardSummary: 'This project develops an AI system for mammogram analysis. The system will detect early signs of breast cancer, identify calcifications, and assess breast density. Features include automated detection of abnormalities, risk assessment, and integration with existing mammography systems.',
      goldStandardPrompt: 'Analyze the following mammogram. Detect any signs of breast cancer, identify calcifications, and assess breast density. Provide a detailed report with confidence scores for each finding.',
      relevanceScores: {
        accuracy: 4.6,
        completeness: 4.4,
        usefulness: 4.5,
        efficiency: 4.3
      }
    }
  ]
}; 