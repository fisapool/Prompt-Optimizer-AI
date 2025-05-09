import { BasePlugin } from './basePlugin';
import { ProjectAnalysis, IndustryMetrics } from './types';

interface ProjectStructure {
  files: ProjectFile[];
  dependencies: Record<string, string>;
  scripts: Record<string, string>;
}

export interface ProjectFile {
  path: string;
  content: string;
  type: 'source' | 'test' | 'config';
}

interface Component {
  name: string;
  state: string[];
  props: string[];
}

interface UIComponent {
  name: string;
  type: string;
}

interface UserInteraction {
  name: string;
  type: string;
}

export class SoftwareDevPlugin extends BasePlugin {
  industry = 'Software Development';
  subIndustries = ['Web Development', 'Mobile Development', 'Backend Development'];

  private parseProjectStructure(projectData: string): ProjectStructure {
    console.log('Starting project structure parsing...');
    const files: ProjectFile[] = [];
    const dependencies: Record<string, string> = {};
    const scripts: Record<string, string> = {};

    // Parse package.json if present
    console.log('Looking for package.json...');
    const packageJsonMatch = projectData.match(/package\.json\s*{[\s\S]*?}(?=\n\n|\n$|$)/);
    if (packageJsonMatch) {
      console.log('Found package.json match:', packageJsonMatch[0].substring(0, 100) + '...');
      try {
        // Extract just the JSON content
        const jsonContent = packageJsonMatch[0].replace(/^package\.json\s*/, '');
        console.log('Extracted JSON content:', jsonContent.substring(0, 100) + '...');
        const packageJson = JSON.parse(jsonContent);
        console.log('Successfully parsed package.json:', {
          dependencies: packageJson.dependencies,
          scripts: packageJson.scripts
        });
        Object.assign(dependencies, packageJson.dependencies || {});
        Object.assign(scripts, packageJson.scripts || {});
      } catch (e) {
        console.error('Error parsing package.json:', e);
        console.error('Problematic content:', packageJsonMatch[0]);
      }
    } else {
      console.log('No package.json found in project data');
    }

    // Parse source files
    console.log('Looking for source files...');
    // Use a Set to collect unique file paths
    const sourceFileRegex = /src\/[^\s]+\.(tsx?|jsx?|css|scss)/g;
    const sourceFilesSet = new Set<string>();
    let match;
    while ((match = sourceFileRegex.exec(projectData)) !== null) {
      sourceFilesSet.add(match[0]);
    }
    const sourceFiles = Array.from(sourceFilesSet);
    console.log('Found source files:', sourceFiles);
    
    sourceFiles.forEach(file => {
      console.log(`Processing file: ${file}`);
      const content = this.extractFileContent(projectData, file);
      if (content) {
        console.log(`Found content for ${file} (${content.length} chars)`);
        files.push({
          path: file,
          content: content,
          type: 'source'
        });
      } else {
        console.log(`No content found for ${file}`);
      }
    });

    const result = { files, dependencies, scripts };
    console.log('Final project structure:', {
      fileCount: files.length,
      dependencyCount: Object.keys(dependencies).length,
      scriptCount: Object.keys(scripts).length
    });
    return result;
  }

  private extractFileContent(projectData: string, filePath: string): string {
    console.log(`Extracting content for ${filePath}`);
    const escapedPath = filePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Match everything after the file path until the next file path or end of string
    const fileMatch = projectData.match(new RegExp(`${escapedPath}\\s*\\n([\\s\\S]*?)(?=\\n(?:\\w+[\\/][^\\n]+|\\w+-\\w+[\\/][^\\n]+|\\w+[\\/][^\\n]+\\.\\w+)\\n|$)`));
    if (fileMatch && fileMatch[1]) {
      console.log(`Found content for ${filePath} (${fileMatch[1].length} chars)`);
      return fileMatch[1].trim();
    }
    console.log(`No content found for ${filePath}`);
    return '';
  }

  private identifyUIComponents(projectStructure: ProjectStructure): UIComponent[] {
    console.log('Identifying UI components...');
    const uiComponents: UIComponent[] = [];
    projectStructure.files.forEach(file => {
      if (file.type === 'source') {
        // Match exported React components with more flexible patterns
        const exportPatterns = [
          // Match: export const Name: React.FC = () => { ... }
          /export\s+const\s+(\w+)\s*:\s*React\.FC(?:<[^>]*>)?\s*=\s*(?:\([^)]*\)\s*=>|function)/g,
          // Match: export function Name() { ... }
          /export\s+function\s+(\w+)\s*(?::\s*React\.FC(?:<[^>]*>)?)?\s*\(/g,
          // Match: export class Name extends React.Component { ... }
          /export\s+class\s+(\w+)\s+extends\s+React\.Component/g,
          // Match: const Name: React.FC = () => { ... }
          /const\s+(\w+)\s*:\s*React\.FC(?:<[^>]*>)?\s*=\s*(?:\([^)]*\)\s*=>|function)/g
        ];
        
        exportPatterns.forEach(pattern => {
          let match;
          while ((match = pattern.exec(file.content)) !== null) {
            uiComponents.push({
              name: match[1],
              type: 'component'
            });
          }
        });
      }
    });
    
    const uniqueComponents = Array.from(new Set(uiComponents.map(c => c.name))).map(name => ({
      name,
      type: 'component'
    }));
    
    console.log('Identified UI components:', uniqueComponents);
    return uniqueComponents;
  }

  private identifyUserInteractions(projectStructure: ProjectStructure): UserInteraction[] {
    console.log('Identifying user interactions...');
    const interactions: UserInteraction[] = [];
    projectStructure.files.forEach(file => {
      if (file.type === 'source') {
        // Match handler functions with more flexible patterns
        const handlerPatterns = [
          /(?:const|function)\s+(handle\w+|fetch\w+|on\w+)\s*=\s*(?:async\s*)?\(/g,
          /(?:const|function)\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/g
        ];
        
        handlerPatterns.forEach(pattern => {
          let match;
          while ((match = pattern.exec(file.content)) !== null) {
            interactions.push({
              name: match[1],
              type: 'handler'
            });
          }
        });

        // Detect form, input, and button interactions with more flexible patterns
        if (/onSubmit\s*=/.test(file.content) || /form\s+onSubmit/.test(file.content)) {
          interactions.push({ name: 'Form submission', type: 'Form submission' });
        }
        if (/onChange\s*=/.test(file.content) || /input\s+onChange/.test(file.content)) {
          interactions.push({ name: 'Input change', type: 'Input change' });
        }
        if (/onClick\s*=/.test(file.content) || /button\s+onClick/.test(file.content)) {
          interactions.push({ name: 'Button click', type: 'Button click' });
        }
      }
    });

    const uniqueInteractions = Array.from(new Set(interactions.map(i => i.name))).map(name => {
      const interaction = interactions.find(i => i.name === name);
      return {
        name,
        type: interaction?.type || 'handler'
      };
    });

    console.log('Identified interactions:', uniqueInteractions);
    return uniqueInteractions;
  }

  private identifyComponentDetails(projectStructure: ProjectStructure): Component[] {
    console.log('Identifying component details...');
    const components: Component[] = [];
    projectStructure.files.forEach(file => {
      if (file.type === 'source') {
        // Match exported React components with more flexible patterns
        const exportPatterns = [
          /export\s+const\s+(\w+)\s*:\s*React\.FC(?:<[^>]*>)?\s*=/g,
          /export\s+function\s+(\w+)\s*(?::\s*React\.FC(?:<[^>]*>)?)?\s*\(/g,
          /export\s+class\s+(\w+)\s+extends\s+React\.Component/g,
          /const\s+(\w+)\s*:\s*React\.FC(?:<[^>]*>)?\s*=/g
        ];

        exportPatterns.forEach(pattern => {
          let match;
          while ((match = pattern.exec(file.content)) !== null) {
            const componentName = match[1];
            
            // Find state variables
            const stateMatches = file.content.matchAll(/const\s*\[(\w+)[^\]]*\]\s*=\s*useState/g);
            const states = Array.from(stateMatches).map(match => match[1]).filter(state => state !== '');

            // Find props in function parameters and interfaces
            const propsRegexes = [
                new RegExp(`${componentName}\\s*:\\s*React\\.FC\\s*<\\{\\s*([^}]*)\\s*\\}>`, 'g'),
                new RegExp(`${componentName}\\s*:\\s*React\\.FC<([^>]*)>`, 'g'),
                new RegExp(`${componentName}\\s*=\\s*\\(\\{\\s*([^}]*)\\s*\\}\\)`, 'g'),
                new RegExp(`interface\\s+${componentName}Props\\s*\\{([^}]*)\\}`, 'g'),
                new RegExp(`type\\s+${componentName}Props\\s*=\\s*\\{([^}]*)\\}`, 'g')
            ];

            const props = [];
            for (const regex of propsRegexes) {
                const matches = file.content.matchAll(regex);
                for (const match of matches) {
                    if (match[1]) {
                        const propList = match[1]
                            .split(/[,;]/)
                            .map(prop => {
                                const propName = prop.trim().split(/[:\s=]/)[0].trim();
                                return propName !== '' && propName !== 'any' && propName !== '{' ? propName : null;
                            })
                            .filter(prop => prop !== null);
                        props.push(...propList);
                    }
                }
            }

            components.push({
              name: componentName,
              state: [...new Set(states)],
              props: [...new Set(props)]
            });
          }
        });
      }
    });

    console.log('Identified component details:', components);
    return components;
  }

  private extractKeyTasks(projectData: string): string[] {
    console.log('Extracting key tasks...');
    const tasks: string[] = [];
    
    // Extract TODO comments
    const todoMatches = projectData.match(/\/\/\s*TODO:\s*([^\n]+)/g) || [];
    console.log('Found TODO comments:', todoMatches);
    tasks.push(...todoMatches.map(m => m.replace(/\/\/\s*TODO:\s*/, '').trim()));
    
    // Extract FIXME comments
    const fixmeMatches = projectData.match(/\/\/\s*FIXME:\s*([^\n]+)/g) || [];
    console.log('Found FIXME comments:', fixmeMatches);
    tasks.push(...fixmeMatches.map(m => m.replace(/\/\/\s*FIXME:\s*/, '').trim()));
    
    // Extract FEATURE comments
    const featureMatches = projectData.match(/\/\/\s*FEATURE:\s*([^\n]+)/g) || [];
    console.log('Found FEATURE comments:', featureMatches);
    tasks.push(...featureMatches.map(m => m.replace(/\/\/\s*FEATURE:\s*/, '').trim()));

    // Extract BUG comments
    const bugMatches = projectData.match(/\/\/\s*BUG:\s*([^\n]+)/g) || [];
    console.log('Found BUG comments:', bugMatches);
    tasks.push(...bugMatches.map(m => m.replace(/\/\/\s*BUG:\s*/, '').trim()));
    
    // Add basic tasks based on project type
    if (projectData.includes('frontend') || projectData.includes('UI')) {
      console.log('Adding frontend-specific tasks');
      tasks.push('Implement user interface components');
      tasks.push('Handle user interactions');
    }
    if (projectData.includes('backend') || projectData.includes('API')) {
      console.log('Adding backend-specific tasks');
      tasks.push('Implement API endpoints');
      tasks.push('Set up database');
    }
    
    const uniqueTasks = [...new Set(tasks)];
    console.log('Final tasks:', uniqueTasks);
    return uniqueTasks;
  }

  public analyzeProject(projectData: string): ProjectAnalysis {
    const projectStructure = this.parseProjectStructure(projectData);
    const uiComponents = this.identifyUIComponents(projectStructure);
    const userInteractions = this.identifyUserInteractions(projectStructure);
    const components = this.identifyComponentDetails(projectStructure);
    const keyTasks = this.extractKeyTasks(projectData);
    return {
      industrySpecificInsights: {
        projectStructure,
        uiComponents,
        userInteractions,
        components
      },
      keyTasks,
      goals: [],
      requirements: [],
      constraints: []
    };
  }

  public getPromptTemplate(task: string): string {
    if (task === 'analysis') {
      return `Project Structure:\nTechnologies Used:\nKey Tasks and Goals:\nUI Components:\nUser Interactions:\nAdditional Context:\nCode quality and best practices\nPerformance considerations\nSecurity measures\nScalability aspects`;
    } else if (task === 'documentation') {
      return `Project Overview\nTechnical Architecture\nSetup Instructions\nAPI Documentation\nTesting Strategy\nDeployment Process\nMaintenance Guidelines`;
    } else if (task === 'code-review') {
      return `Code Quality\nBest Practices\nPerformance\nSecurity\nMaintainability\nTesting Coverage\nDocumentation`;
    }
    return 'Default Template';
  }

  public getIndustrySpecificMetrics(): IndustryMetrics {
    return {
      requiredAccuracy: 4.0,
      requiredCompleteness: 4.0,
      requiredUsefulness: 4.0,
      requiredEfficiency: 4.0,
      industrySpecificMetrics: {
        codeQuality: 4.0,
        performance: 4.0,
        security: 4.0,
        maintainability: 4.0
      }
    };
  }
}
