import React, { useState } from 'react';
import { Todo } from '../types';

// TODO: Add error handling
// FIXME: Fix performance issue

export const TodoListFixed: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);

  const addTodo = (text: string): void => {
    setTodos([...todos, {
      id: Date.now().toString(),
      text,
      completed: false,
      priority: 'medium' // Default priority
    }]);
  };

  return (
    <div>
      <h2>Todo List</h2>
      <ul>
        {todos.map((todo, idx) => (
          <li key={idx}>{todo.text}</li>
        ))}      </ul>
      <input
        type="text"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.target as HTMLInputElement).value !== '') {
            addTodo((e.target as HTMLInputElement).value);
            (e.target as HTMLInputElement).value = '';
          }
        }}
      />
    </div>
  );
};
