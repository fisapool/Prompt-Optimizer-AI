import { SoftwareDevPlugin } from '../../plugins/softwareDevPlugin';
import { sampleReactProject } from '../../validation/sampleReactProject';
import { ProjectFile } from '../../plugins/softwareDevPlugin';

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

describe('SoftwareDevPlugin', () => {
  let plugin: SoftwareDevPlugin;

  beforeEach(() => {
    plugin = new SoftwareDevPlugin();
  });

  describe('Project Analysis Verification', () => {
    it('should extract accurate project structure', () => {
      const analysis = plugin.analyzeProject(sampleReactProject);
      const projectStructure = analysis.industrySpecificInsights.projectStructure;
      
      expect(projectStructure).toBeDefined();
      expect(projectStructure.files).toHaveLength(3); // App.tsx, TodoList.tsx, TodoItem.tsx
      expect(projectStructure.dependencies).toHaveProperty('react');
      expect(projectStructure.dependencies).toHaveProperty('typescript');
      expect(projectStructure.scripts).toHaveProperty('start');
      expect(projectStructure.scripts).toHaveProperty('build');
    });

    it('should correctly identify file types', () => {
      const analysis = plugin.analyzeProject(sampleReactProject);
      const projectStructure = analysis.industrySpecificInsights.projectStructure;
      
      const sourceFiles = projectStructure.files.filter((f: ProjectFile) => f.type === 'source');
      expect(sourceFiles).toHaveLength(3);
      expect(sourceFiles.every((f: ProjectFile) => f.path.endsWith('.tsx'))).toBe(true);
    });
  });

  describe('UI Component Detection', () => {
    it('should identify React components', () => {
      const analysis = plugin.analyzeProject(sampleReactProject);
      const components = analysis.industrySpecificInsights.uiComponents;
      
      const componentNames = components.map((c: UIComponent) => c.name);
      expect(componentNames).toContain('TodoList');
      expect(componentNames).toContain('TodoItem');
      expect(componentNames).toContain('App');
    });

    it('should identify component props and state', () => {
      const analysis = plugin.analyzeProject(sampleReactProject);
      const components = analysis.industrySpecificInsights.components;
      
      const todoList = components.find((c: Component) => c.name === 'TodoList');
      expect(todoList).toBeDefined();
      if (todoList) {
        expect(todoList.state).toContain('todos');
        expect(todoList.state).toContain('loading');
      }
      
      const todoItem = components.find((c: Component) => c.name === 'TodoItem');
      expect(todoItem).toBeDefined();
      if (todoItem) {
        expect(todoItem.props).toContain('todo');
      }
    });
  });

  describe('User Interaction Extraction', () => {
    it('should identify event handlers', () => {
      const analysis = plugin.analyzeProject(sampleReactProject);
      const interactions = analysis.industrySpecificInsights.userInteractions;
      
      const interactionNames = interactions.map((i: UserInteraction) => i.name);
      expect(interactionNames).toContain('handleSubmit');
      expect(interactionNames).toContain('handleComplete');
      expect(interactionNames).toContain('handleDelete');
      expect(interactionNames).toContain('fetchTodos');
    });

    it('should identify form interactions', () => {
      const analysis = plugin.analyzeProject(sampleReactProject);
      const interactions = analysis.industrySpecificInsights.userInteractions;
      
      const formInteractions = interactions.filter((i: UserInteraction) => i.type === 'Form submission');
      const inputInteractions = interactions.filter((i: UserInteraction) => i.type === 'Input change');
      const buttonInteractions = interactions.filter((i: UserInteraction) => i.type === 'Button click');
      
      expect(formInteractions.map((i: UserInteraction) => i.name)).toContain('Form submission');
      expect(inputInteractions.map((i: UserInteraction) => i.name)).toContain('Input change');
      expect(buttonInteractions.map((i: UserInteraction) => i.name)).toContain('Button click');
    });
  });

  describe('Task Extraction from Comments', () => {
    it('should extract TODO comments', () => {
      const analysis = plugin.analyzeProject(sampleReactProject);
      
      expect(analysis.keyTasks).toContain('Implement error handling for API calls');
      expect(analysis.keyTasks).toContain('Add loading states for better UX');
      expect(analysis.keyTasks).toContain('Implement todo creation');
      expect(analysis.keyTasks).toContain('Implement todo completion');
      expect(analysis.keyTasks).toContain('Implement todo deletion');
    });

    it('should extract FIXME comments', () => {
      const analysis = plugin.analyzeProject(sampleReactProject);
      
      expect(analysis.keyTasks).toContain('Todo items not updating after completion');
    });

    it('should extract FEATURE comments', () => {
      const analysis = plugin.analyzeProject(sampleReactProject);
      
      expect(analysis.keyTasks).toContain('Add priority levels to todos');
    });
  });

  describe('Analysis Template Verification', () => {
    it('should include all required sections in analysis template', () => {
      const template = plugin.getPromptTemplate('analysis');
      
      expect(template).toContain('Project Structure:');
      expect(template).toContain('Technologies Used:');
      expect(template).toContain('Key Tasks and Goals:');
      expect(template).toContain('UI Components:');
      expect(template).toContain('User Interactions:');
      expect(template).toContain('Additional Context:');
    });

    it('should include quality assurance sections', () => {
      const template = plugin.getPromptTemplate('analysis');
      
      expect(template).toContain('Code quality and best practices');
      expect(template).toContain('Performance considerations');
      expect(template).toContain('Security measures');
      expect(template).toContain('Scalability aspects');
    });
  });

  describe('Documentation Template Verification', () => {
    it('should include all required documentation sections', () => {
      const template = plugin.getPromptTemplate('documentation');
      
      expect(template).toContain('Project Overview');
      expect(template).toContain('Technical Architecture');
      expect(template).toContain('Setup Instructions');
      expect(template).toContain('API Documentation');
      expect(template).toContain('Testing Strategy');
      expect(template).toContain('Deployment Process');
      expect(template).toContain('Maintenance Guidelines');
    });
  });

  describe('Code Review Template Verification', () => {
    it('should include all required code review sections', () => {
      const template = plugin.getPromptTemplate('code-review');
      
      expect(template).toContain('Code Quality');
      expect(template).toContain('Best Practices');
      expect(template).toContain('Performance');
      expect(template).toContain('Security');
      expect(template).toContain('Maintainability');
      expect(template).toContain('Testing Coverage');
      expect(template).toContain('Documentation');
    });
  });

  describe('Industry Metrics', () => {
    it('should provide industry-specific metrics', () => {
      const metrics = plugin.getIndustrySpecificMetrics();
      
      expect(metrics).toHaveProperty('requiredAccuracy');
      expect(metrics).toHaveProperty('requiredCompleteness');
      expect(metrics).toHaveProperty('requiredUsefulness');
      expect(metrics).toHaveProperty('requiredEfficiency');
      expect(metrics.industrySpecificMetrics).toHaveProperty('codeQuality');
      expect(metrics.industrySpecificMetrics).toHaveProperty('performance');
      expect(metrics.industrySpecificMetrics).toHaveProperty('security');
      expect(metrics.industrySpecificMetrics).toHaveProperty('maintainability');
    });

    it('should have appropriate metric values', () => {
      const metrics = plugin.getIndustrySpecificMetrics();
      
      expect(metrics.requiredAccuracy).toBeGreaterThanOrEqual(4.0);
      expect(metrics.requiredCompleteness).toBeGreaterThanOrEqual(4.0);
      expect(metrics.requiredUsefulness).toBeGreaterThanOrEqual(4.0);
      expect(metrics.requiredEfficiency).toBeGreaterThanOrEqual(4.0);
      
      expect(metrics.industrySpecificMetrics.codeQuality).toBeGreaterThanOrEqual(4.0);
      expect(metrics.industrySpecificMetrics.performance).toBeGreaterThanOrEqual(4.0);
      expect(metrics.industrySpecificMetrics.security).toBeGreaterThanOrEqual(4.0);
      expect(metrics.industrySpecificMetrics.maintainability).toBeGreaterThanOrEqual(4.0);
    });
  });

  describe('Project Structure Parsing', () => {
    it('should parse project structure with detailed logging', () => {
      const analysis = plugin.analyzeProject(sampleReactProject);
      const projectStructure = analysis.industrySpecificInsights.projectStructure;

      // Verify package.json parsing
      expect(projectStructure.dependencies).toHaveProperty('react');
      expect(projectStructure.dependencies).toHaveProperty('typescript');
      expect(projectStructure.scripts).toHaveProperty('start');
      expect(projectStructure.scripts).toHaveProperty('build');

      // Verify file parsing
      expect(projectStructure.files).toHaveLength(3);
      expect(projectStructure.files.find((f: ProjectFile) => f.path === 'src/components/TodoList.tsx')).toBeDefined();
      expect(projectStructure.files.find((f: ProjectFile) => f.path === 'src/components/TodoItem.tsx')).toBeDefined();
      expect(projectStructure.files.find((f: ProjectFile) => f.path === 'src/App.tsx')).toBeDefined();

      // Verify component detection
      const components = analysis.industrySpecificInsights.uiComponents;
      const componentNames = components.map((c: UIComponent) => c.name);
      expect(componentNames).toContain('TodoList');
      expect(componentNames).toContain('TodoItem');
      expect(componentNames).toContain('App');
    });
  });
}); 