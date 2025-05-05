/**
 * Represents an Asana task.
 */
export interface AsanaTask {
  /**
   * The ID of the task.
   */
  id: string;
  /**
   * The name of the task.
   */
  name: string;
  /**
   * The assignee of the task.
   */
  assignee: string;
  /**
   * The due date of the task.
   */
  dueDate: string;
}

/**
 * Asynchronously retrieves tasks from Asana.
 *
 * @returns A promise that resolves to an array of AsanaTask objects.
 */
export async function getAsanaTasks(): Promise<AsanaTask[]> {
  // TODO: Implement this by calling the Asana API.

  return [
    {
      id: '123',
      name: 'Design UI',
      assignee: 'Alice',
      dueDate: '2024-02-15',
    },
    {
      id: '456',
      name: 'Implement API',
      assignee: 'Bob',
      dueDate: '2024-02-20',
    },
  ];
}
