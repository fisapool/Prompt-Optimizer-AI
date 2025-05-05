/**
 * Represents a task in MS Project.
 */
export interface MSProjectTask {
  /**
   * The ID of the task.
   */
  id: number;
  /**
   * The name of the task.
   */
  name: string;
  /**
   * The start date of the task.
   */
  startDate: string;
  /**
   * The finish date of the task.
   */
  finishDate: string;
  /**
   * The resource assigned to the task.
   */
  resource: string;
}

/**
 * Asynchronously retrieves tasks from MS Project.
 *
 * @returns A promise that resolves to an array of MSProjectTask objects.
 */
export async function getMSProjectTasks(): Promise<MSProjectTask[]> {
  // TODO: Implement this by calling the MS Project API.

  return [
    {
      id: 1,
      name: 'Task 1',
      startDate: '2024-01-01',
      finishDate: '2024-01-05',
      resource: 'John Doe',
    },
    {
      id: 2,
      name: 'Task 2',
      startDate: '2024-01-06',
      finishDate: '2024-01-10',
      resource: 'Jane Smith',
    },
  ];
}
