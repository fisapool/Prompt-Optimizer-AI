import { MedicalImagingPlugin } from "../../plugins/medicalImagingPlugin";
import { ProjectAnalysis, IndustryMetrics } from "../../types";

describe("MedicalImagingPlugin", () => {
  let plugin: MedicalImagingPlugin;

  beforeEach(() => {
    plugin = new MedicalImagingPlugin();
  });

  it("should return a prompt template for a known task", () => {
    const template = plugin.getPromptTemplate("identify tumors");
    expect(template).toContain("Identify Tumors");
    expect(template).toContain("{projectData}");
  });

  it("should return a default prompt template for an unknown task", () => {
    const template = plugin.getPromptTemplate("custom task");
    expect(template).toContain("custom task");
    expect(template).toContain("{projectData}");
  });

  it("should analyze project data and extract key fields", () => {
    const projectData = `
      This project will analyze MRI scans to detect tumors.
      The goal is to improve diagnostic accuracy and comply with HIPAA.
      Must meet FDA approval and follow DICOM standards.
      Budget is limited and timeline is tight.
      Used for diagnosis and treatment planning.
    `;
    const analysis: ProjectAnalysis = plugin.analyzeProject(projectData);
    expect(analysis.keyTasks.length).toBeGreaterThan(0);
    expect(analysis.goals.length).toBeGreaterThan(0);
    expect(analysis.requirements.length).toBeGreaterThan(0);
    expect(analysis.constraints.length).toBeGreaterThan(0);
    expect(analysis.industrySpecificInsights.modality).toBe("MRI");
    expect(analysis.industrySpecificInsights.clinicalApplications).toContain("Diagnosis");
    expect(analysis.industrySpecificInsights.regulatoryRequirements).toContain("HIPAA");
    expect(analysis.industrySpecificInsights.regulatoryRequirements).toContain("FDA");
    expect(analysis.industrySpecificInsights.regulatoryRequirements).toContain("DICOM");
  });

  it("should return industry-specific metrics", () => {
    const metrics: IndustryMetrics = plugin.getIndustrySpecificMetrics();
    expect(metrics.requiredAccuracy).toBeGreaterThan(0.9);
    expect(metrics.industrySpecificMetrics.SignalToNoiseRatio).toBeGreaterThan(0);
    expect(metrics.industrySpecificMetrics.Contrast).toBeGreaterThan(0);
  });
});