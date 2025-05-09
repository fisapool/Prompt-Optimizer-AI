import React from "react";
import { Todo } from "../types";

interface TodoItemProps {
  todo: Todo;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

export const TodoItem: React.FC<TodoItemProps> = ({ todo, onComplete, onDelete }) => {
  const priorityColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800'
  };

  return (
    <div className="flex items-center gap-2 p-2 border rounded-lg mb-2">
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onComplete(todo.id)}
        className="h-4 w-4"
      />
      <span className={`flex-1 ${todo.completed ? 'line-through text-gray-500' : ''}`}>
        {todo.text}
      </span>
      <span className={`px-2 py-1 text-xs rounded-full ${priorityColors[todo.priority]}`}>
        {todo.priority}
      </span>
      <button
        onClick={() => onDelete(todo.id)}
        className="px-2 py-1 text-sm text-red-600 hover:bg-red-100 rounded"
      >
        Delete
      </button>
    </div>
  );
};