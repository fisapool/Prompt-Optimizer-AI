import { BasePlugin } from "./basePlugin";
import { ProjectAnalysis, IndustryMetrics } from "./types";

export class MedicalImagingPlugin extends BasePlugin {
  industry = "Medical Imaging";
  subIndustries = [
    "Radiology",
    "Nuclear Medicine",
    "Ultrasound",
    "Mammography",
    "CT",
    "MRI"
  ];

  getPromptTemplate(task: string): string {
    const templates: Record<string, string> = {
      "identify tumors": `Analyze the following medical imaging project data to identify tumors and provide relevant findings.\n\n{projectData}\n\nIndustry: {industry}\nTask: Identify Tumors\nOutput Format: List of findings and tumor details.\n\nAdditional Context:\n{additionalContext}`,
      "measure organ volume": `Analyze the following medical imaging project data to measure organ volumes.\n\n{projectData}\n\nIndustry: {industry}\nTask: Measure Organ Volume\nOutput Format: Organ names and their measured volumes.\n\nAdditional Context:\n{additionalContext}`,
      "detect anomalies": `Analyze the following medical imaging project data to detect anomalies.\n\n{projectData}\n\nIndustry: {industry}\nTask: Detect Anomalies\nOutput Format: List of detected anomalies and their characteristics.\n\nAdditional Context:\n{additionalContext}`
    };
    return templates[task] || `Summarize the following medical imaging project data and extract key tasks, goals, and findings.\n\n{projectData}\n\nIndustry: {industry}\nTask: ${task}\nOutput Format: List of findings, tasks, and goals.\n\nAdditional Context:\n{additionalContext}`;
  }

  analyzeProject(projectData: string): ProjectAnalysis {
    const keyTasks = this.extractKeyTasks(projectData);
    const goals = this.extractGoals(projectData);
    const requirements = this.extractRequirements(projectData);
    const constraints = this.extractConstraints(projectData);
    const modality = this.detectImagingModality(projectData);
    const clinicalApplications = this.identifyClinicalApplications(projectData);
    const regulatoryRequirements = this.identifyRegulatoryRequirements(projectData);

    const industrySpecificInsights = {
      modality,
      clinicalApplications,
      regulatoryRequirements
    };

    return {
      keyTasks,
      goals,
      requirements,
      constraints,
      industrySpecificInsights
    };
  }

  getIndustrySpecificMetrics(): IndustryMetrics {
    return {
      requiredAccuracy: 0.95,
      requiredCompleteness: 0.9,
      requiredUsefulness: 0.9,
      requiredEfficiency: 0.85,
      industrySpecificMetrics: {
        "SignalToNoiseRatio": 30,
        "Contrast": 0.8,
        "Sensitivity": 0.9,
        "Specificity": 0.9
      }
    };
  }

  private extractKeyTasks(projectData: string): string[] {
    const tasks: string[] = [];
    const taskPatterns = [
      /analyze|detect|classify|segment|enhance|process/i,
      /generate|create|produce|output/i,
      /integrate|connect|interface/i,
      /validate|verify|check/i
    ];
    const lines = projectData.split('\n');
    for (const line of lines) {
      for (const pattern of taskPatterns) {
        if (pattern.test(line)) {
          tasks.push(line.trim());
          break;
        }
      }
    }
    return tasks;
  }
  private extractGoals(projectData: string): string[] {
    const goals: string[] = [];
    const goalPatterns = [
      /improve|enhance|increase|optimize/i,
      /reduce|decrease|minimize|eliminate/i,
      /achieve|attain|reach|accomplish/i,
      /ensure|guarantee|maintain|sustain/i
    ];
    const lines = projectData.split('\n');
    for (const line of lines) {
      for (const pattern of goalPatterns) {
        if (pattern.test(line)) {
          goals.push(line.trim());
          break;
        }
      }
    }
    return goals;
  }
  private extractRequirements(projectData: string): string[] {
    const requirements: string[] = [];
    const reqPatterns = [
      /must|shall|should|required|need/i,
      /comply|adhere|follow|meet/i,
      /standard|protocol|guideline|specification/i,
      /certification|accreditation|approval/i
    ];
    const lines = projectData.split('\n');
    for (const line of lines) {
      for (const pattern of reqPatterns) {
        if (pattern.test(line)) {
          requirements.push(line.trim());
          break;
        }
      }
    }
    return requirements;
  }
  private extractConstraints(projectData: string): string[] {
    const constraints: string[] = [];
    const constraintPatterns = [
      /limit|restrict|constrain|bound/i,
      /time|deadline|schedule|timeline/i,
      /budget|cost|expense|funding/i,
      /resource|capacity|capability/i
    ];
    const lines = projectData.split('\n');
    for (const line of lines) {
      for (const pattern of constraintPatterns) {
        if (pattern.test(line)) {
          constraints.push(line.trim());
          break;
        }
      }
    }
    return constraints;
  }
  private detectImagingModality(projectData: string): string {
    const modalities = {
      'MRI': /mri|magnetic resonance|t1|t2|diffusion/i,
      'CT': /ct|computed tomography|cat scan/i,
      'X-ray': /x.?ray|xray|radiograph/i,
      'Ultrasound': /ultrasound|sonography|echo/i,
      'Mammography': /mammogram|mammography|breast/i,
      'PET': /pet|positron emission/i,
      'Nuclear Medicine': /nuclear|spect|gamma/i
    };
    for (const [modality, pattern] of Object.entries(modalities)) {
      if (pattern.test(projectData)) {
        return modality;
      }
    }
    return 'Unknown';
  }
  private identifyClinicalApplications(projectData: string): string[] {
    const applications: string[] = [];
    const clinicalPatterns = {
      'Diagnosis': /diagnos|detect|identify|find/i,
      'Treatment Planning': /treatment|therapy|plan|strategy/i,
      'Monitoring': /monitor|track|follow|progress/i,
      'Screening': /screen|prevent|early detection/i,
      'Research': /research|study|investigate|analyze/i
    };
    for (const [application, pattern] of Object.entries(clinicalPatterns)) {
      if (pattern.test(projectData)) {
        applications.push(application);
      }
    }
    return applications;
  }
  private identifyRegulatoryRequirements(projectData: string): string[] {
    const requirements: string[] = [];
    const regulatoryPatterns = {
      'HIPAA': /hipaa|privacy|security|protected health/i,
      'FDA': /fda|approval|clearance|medical device/i,
      'GDPR': /gdpr|data protection|privacy/i,
      'DICOM': /dicom|standard|format|protocol/i,
      'Quality Assurance': /qa|quality|assurance|control/i
    };
    for (const [requirement, pattern] of Object.entries(regulatoryPatterns)) {
      if (pattern.test(projectData)) {
        requirements.push(requirement);
      }
    }
    return requirements;
  }
}