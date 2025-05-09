export const sampleReactProject = `
package.json
{
  "name": "todo-app",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^4.9.5",
    "@types/react": "^18.0.0",
    "axios": "^1.3.4",
    "tailwindcss": "^3.2.7"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test"
  }
}

src/components/TodoList.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

// TODO: Implement error handling for API calls
// FIXME: Add loading states for better UX

export const TodoList: React.FC = () => {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/todos');
      setTodos(response.data);
    } catch (error) {
      console.error('Error fetching todos:', error);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement todo creation
  };

  return (
    <div className="todo-list">
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Add new todo" />
        <button type="submit">Add</button>
      </form>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <ul>
          {todos.map(todo => (
            <li key={todo.id}>{todo.text}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

src/components/TodoItem.tsx
import React from 'react';

// FEATURE: Add priority levels to todos
export const TodoItem: React.FC<{ todo: any }> = ({ todo }) => {
  const handleComplete = () => {
    // TODO: Implement todo completion
  };

  const handleDelete = () => {
    // TODO: Implement todo deletion
  };

  return (
    <div className="todo-item">
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={handleComplete}
      />
      <span>{todo.text}</span>
      <button onClick={handleDelete}>Delete</button>
    </div>
  );
};

src/App.tsx
import React from 'react';
import { TodoList } from './components/TodoList';

// BUG: Todo items not updating after completion
export const App: React.FC = () => {
  return (
    <div className="app">
      <h1>Todo App</h1>
      <TodoList />
    </div>
  );
};
`; 