import { GET, DELETE } from './route';
import { NextRequest } from 'next/server';

async function testDeleteCompleted() {
  try {
    // First, get all todos
    console.log('Fetching all todos...');
    const getResponse = await GET();
    const initialTodos = await getResponse.json();
    console.log('Initial todos:', initialTodos);

    // Delete all completed todos
    console.log('\nDeleting completed todos...');
    const deleteRequest = new NextRequest('http://localhost:9002/api/todos?deleteCompleted=true', {
      method: 'DELETE'
    });
    const deleteResponse = await DELETE(deleteRequest);
    const deleteResult = await deleteResponse.json();
    console.log('Delete result:', deleteResult);

    // Verify the remaining todos
    console.log('\nFetching remaining todos...');
    const finalResponse = await GET();
    const remainingTodos = await finalResponse.json();
    console.log('Remaining todos:', remainingTodos);

    // Verify that no completed todos remain
    const hasCompletedTodos = remainingTodos.some((todo: any) => todo.completed);
    console.log('\nVerification:', hasCompletedTodos ? '❌ Some completed todos remain' : '✅ All completed todos deleted');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the test
testDeleteCompleted(); 