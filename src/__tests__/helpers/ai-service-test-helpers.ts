import { CodeQualityMetrics, SecurityAnalysis, PerformanceInsights } from '../../services/analysis/text-extraction-service';

export const sampleCodes = {
  react: `
    import React from 'react';
    
    function App() {
      const [count, setCount] = React.useState(0);
      
      return (
        <div>
          <h1>Count: {count}</h1>
          <button onClick={() => setCount(count + 1)}>
            Increment
          </button>
        </div>
      );
    }
    
    export default App;
  `,

  typescript: `
    interface User {
      id: number;
      name: string;
      email: string;
    }

    class UserService {
      private users: User[] = [];

      async getUser(id: number): Promise<User | undefined> {
        return this.users.find(user => user.id === id);
      }

      async addUser(user: User): Promise<void> {
        this.users.push(user);
      }
    }
  `,

  vulnerableCode: `
    app.get('/api/user/:id', (req, res) => {
      const query = 'SELECT * FROM users WHERE id = ' + req.params.id;
      db.query(query, (err, result) => {
        res.json(result);
      });
    });
  `,

  secureCode: `
    app.get('/api/user/:id', async (req, res) => {
      try {
        const user = await User.findById(req.params.id);
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
      } catch (error) {
        res.status(500).json({ error: 'Server error' });
      }
    });
  `,

  inefficientCode: `
    function fibonacci(n) {
      if (n <= 1) return n;
      return fibonacci(n - 1) + fibonacci(n - 2);
    }

    function processArray(arr) {
      return arr.map(x => fibonacci(x));
    }
  `,

  optimizedCode: `
    function fibonacci(n) {
      const fib = [0, 1];
      for (let i = 2; i <= n; i++) {
        fib[i] = fib[i - 1] + fib[i - 2];
      }
      return fib[n];
    }

    function processArray(arr) {
      return arr.map(x => fibonacci(x));
    }
  `
};

export const sampleMetrics: CodeQualityMetrics = {
  cyclomaticComplexity: 5,
  maintainabilityIndex: 85,
  codeDuplication: 10,
  testCoverage: 75,
  aiInsights: {
    suggestions: [
      'Consider breaking down complex functions',
      'Add more inline documentation',
      'Implement error handling'
    ]
  }
};

export const sampleSecurityAnalysis: SecurityAnalysis = {
  vulnerabilities: [
    'SQL Injection risk in query construction',
    'Unsanitized user input',
    'Missing input validation'
  ],
  bestPractices: [
    'Use parameterized queries',
    'Implement input validation',
    'Add request rate limiting'
  ]
};

export const samplePerformanceAnalysis: PerformanceInsights = {
  bottlenecks: [
    'Recursive function causing exponential time complexity',
    'Inefficient data structure usage',
    'Multiple database queries in loop'
  ],
  optimizationSuggestions: [
    'Use dynamic programming approach',
    'Implement caching',
    'Batch database queries'
  ]
};

export const mockAIResponses = {
  codeAnalysis: `{
    "structure": "Well-organized React component",
    "patterns": ["Hooks pattern", "Functional component"],
    "improvements": ["Add prop types", "Consider memoization"],
    "codeSmells": ["None detected"],
    "bestPractices": ["Follow React naming conventions", "Use TypeScript"]
  }`,

  securityAnalysis: `
    Vulnerabilities:
    - SQL Injection risk in query construction
    - Unsanitized user input
    - Missing input validation

    Best Practices:
    - Use parameterized queries
    - Implement input validation
    - Add request rate limiting
  `,

  performanceAnalysis: `
    Bottlenecks:
    - Recursive function causing exponential time complexity
    - Inefficient data structure usage
    - Multiple database queries in loop

    Optimization Suggestions:
    - Use dynamic programming approach
    - Implement caching
    - Batch database queries
  `
};
