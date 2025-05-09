import { ValidationProject } from './types';

export const sampleWebProject: ValidationProject = {
  id: 'web-dev-1',
  industry: 'Software Development',
  subIndustry: 'Web Development',
  projectName: 'React Todo Application',
  projectDescription: `A modern todo application built with React and TypeScript. Features include:
- User authentication
- CRUD operations for todos
- Real-time updates
- Responsive design
- Unit testing with Jest
- API integration with backend service`,
  goldStandardSummary: `This project is a modern todo application built with React and TypeScript. It implements a complete CRUD interface for managing todos with user authentication. The application features real-time updates, responsive design, and comprehensive unit testing. The frontend is built with React and TypeScript, while the backend is a RESTful API service. The project follows modern web development best practices and includes proper error handling, loading states, and user feedback.`,
  goldStandardPrompt: `Analyze this React todo application project. Focus on:
1. Component structure and organization
2. State management approach
3. API integration patterns
4. Testing strategy
5. Performance considerations
6. Security measures
7. User experience aspects`,
  relevanceScores: {
    accuracy: 4.0,
    completeness: 4.0,
    usefulness: 4.0,
    efficiency: 4.0
  }
}; 