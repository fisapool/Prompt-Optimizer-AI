import React from "react";
import TodoList from "./components/TodoList";

export const App: React.FC = () => {
  return (
    <div className="app">
      <h1>Todo App</h1>
      <TodoList />
    </div>
  );
};