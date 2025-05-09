export interface SummarizeProjectDataInput {
  files: {
    fileDataUri: string;
    fileName: string;
    mimeType: string;
  }[];
  industry: string;
}

interface SummarizeProjectDataOutput {
  summary: string;
}

export async function summarizeProjectData(input: SummarizeProjectDataInput): Promise<SummarizeProjectDataOutput> {
  function safeDecodeDataUri(dataUri: string): string {
    try {
      const base64 = dataUri.split(',')[1];
      return Buffer.from(base64, 'base64').toString('utf-8');
    } catch (e) {
      return '';
    }
  }

  let dependencies: string[] = [];
  let scripts: string[] = [];
  let components: string[] = [];
  let keyTasks: string[] = [];

  for (const file of input.files) {
    const content = safeDecodeDataUri(file.fileDataUri);
    if (file.fileName === 'package.json') {
      try {
        const pkg = JSON.parse(content);
        dependencies = Object.keys(pkg.dependencies || {});
        scripts = Object.keys(pkg.scripts || {});
      } catch (e) {
        // Ignore parse errors
      }
    }
    // Only scan JS/TS/TSX files for components and tasks
    if (/\.(js|ts|tsx)$/.test(file.fileName)) {
      // Improved React component detection
      // 1. Exported components
      const exportCompMatches = content.matchAll(/export\s+(?:default\s+)?(?:function|class|const)\s+([A-Z][A-Za-z0-9_]*)/g);
      for (const m of exportCompMatches) {
        components.push(m[1]);
      }
      // 2. Capitalized identifiers assigned to function/class/arrow function
      const capitalizedCompMatches = content.matchAll(/(?:function|class|const)\s+([A-Z][A-Za-z0-9_]*)/g);
      for (const m of capitalizedCompMatches) {
        components.push(m[1]);
      }
      // 3. Arrow function components assigned to capitalized const
      const arrowCompMatches = content.matchAll(/const\s+([A-Z][A-Za-z0-9_]*)\s*=\s*\([^)]*\)\s*=>/g);
      for (const m of arrowCompMatches) {
        components.push(m[1]);
      }
      // Find TODO/FIXME/FEATURE/BUG comments
      const taskMatches = content.matchAll(/\b(TODO|FIXME|FEATURE|BUG)\b[:\- ]+(.*)/gi);
      for (const m of taskMatches) {
        keyTasks.push(m[2]);
      }
    }
  }
  // Deduplicate
  components = Array.from(new Set(components));
  keyTasks = Array.from(new Set(keyTasks));

  // Industry-specific highlights (placeholder for future API integration)
  let industryHighlights = '';
  switch (input.industry.toLowerCase()) {
    case 'software':
      industryHighlights = 'Focus on modularity, code reuse, and automated testing.';
      break;
    case 'healthcare':
      industryHighlights = 'Emphasize data privacy, regulatory compliance, and reliability.';
      break;
    case 'construction':
      industryHighlights = 'Highlight project timelines, resource management, and safety.';
      break;
    case 'marketing':
      industryHighlights = 'Stress analytics, campaign tracking, and user engagement.';
      break;
    default:
      industryHighlights = 'No specific industry highlights available.';
  }

  return {
    summary: `Project Summary for ${input.industry}:\n- Files: ${input.files.map(f => f.fileName).join(', ')}\n- Dependencies: ${dependencies.join(', ') || 'None'}\n- Scripts: ${scripts.join(', ') || 'None'}\n- Components: ${components.join(', ') || 'None'}\n- Key Tasks: ${keyTasks.join(', ') || 'None'}\n- Industry Highlights: ${industryHighlights}`
  };
}