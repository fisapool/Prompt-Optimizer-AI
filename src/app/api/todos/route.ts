import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for todos (replace with database in production)
let todos: Todo[] = [
  {
    id: '1',
    title: 'Learn Next.js',
    completed: true,
    createdAt: new Date()
  },
  {
    id: '2',
    title: 'Build a Todo App',
    completed: true,
    createdAt: new Date()
  },
  {
    id: '3',
    title: 'Deploy to Production',
    completed: false,
    createdAt: new Date()
  },
  {
    id: '4',
    title: 'Write Tests',
    completed: true,
    createdAt: new Date()
  },
  {
    id: '5',
    title: 'Add Documentation',
    completed: false,
    createdAt: new Date()
  }
];

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
}

// GET /api/todos - Get all todos
export async function GET() {
  try {
    return NextResponse.json(todos);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch todos' },
      { status: 500 }
    );
  }
}

// POST /api/todos - Create a new todo
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate request body
    if (!body.title || typeof body.title !== 'string') {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const newTodo: Todo = {
      id: Math.random().toString(36).substr(2, 9),
      title: body.title,
      completed: false,
      createdAt: new Date()
    };

    todos.push(newTodo);
    return NextResponse.json(newTodo, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create todo' },
      { status: 500 }
    );
  }
}

// PUT /api/todos - Update a todo
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    
    if (!body.id) {
      return NextResponse.json(
        { error: 'Todo ID is required' },
        { status: 400 }
      );
    }

    const todoIndex = todos.findIndex(todo => todo.id === body.id);
    if (todoIndex === -1) {
      return NextResponse.json(
        { error: 'Todo not found' },
        { status: 404 }
      );
    }

    todos[todoIndex] = {
      ...todos[todoIndex],
      ...body,
      updatedAt: new Date()
    };

    return NextResponse.json(todos[todoIndex]);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update todo' },
      { status: 500 }
    );
  }
}

// DELETE /api/todos - Delete a todo or completed todos
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const deleteCompleted = searchParams.get('deleteCompleted') === 'true';

    // If deleteCompleted is true, delete all completed todos
    if (deleteCompleted) {
      const completedCount = todos.filter(todo => todo.completed).length;
      todos = todos.filter(todo => !todo.completed);
      return NextResponse.json({ 
        message: `Deleted ${completedCount} completed todos`,
        remainingTodos: todos.length
      });
    }

    // Otherwise, delete a specific todo by ID
    if (!id) {
      return NextResponse.json(
        { error: 'Todo ID is required when not deleting completed todos' },
        { status: 400 }
      );
    }

    const todoIndex = todos.findIndex(todo => todo.id === id);
    if (todoIndex === -1) {
      return NextResponse.json(
        { error: 'Todo not found' },
        { status: 404 }
      );
    }

    todos = todos.filter(todo => todo.id !== id);
    return NextResponse.json({ 
      message: 'Todo deleted successfully',
      remainingTodos: todos.length
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete todo' },
      { status: 500 }
    );
  }
}