import { getParentTasksToUpdate } from "@/lib/utils"; // Adjust path
import { ITask, Status } from "@/types/task";

describe("getParentTasksToUpdate", () => {
  // Helper function to create mock tasks
  const createTask = (
    id: number,
    title: string,
    status: Status = "todo",
    dependencies: ITask[] = []
  ): ITask => ({
    id,
    title,
    description: "",
    status,
    dependencies,
  });

  test("should return empty array when task has no parents", () => {
    const tasklist = [createTask(1, "A"), createTask(2, "B")];
    const result = getParentTasksToUpdate(tasklist, tasklist[0], new Set());
    expect(result).toEqual([]);
  });

  test("should block direct parent when task becomes not-done", () => {
    const depA = createTask(1, "A", "done");
    const taskB = createTask(2, "B", "todo", [depA]);

    const tasklist = [depA, taskB];
    const result = getParentTasksToUpdate(
      tasklist,
      { ...depA, status: "in-progress" as Status },
      new Set()
    );

    expect(result).toContainEqual({ id: 2, status: "blocked" });
  });

  test("should unblock direct parent when all dependencies are done", () => {
    const depA = createTask(1, "A", "todo");
    const taskB = createTask(2, "B", "blocked", [depA]);

    const tasklist = [depA, taskB];
    const result = getParentTasksToUpdate(
      tasklist,
      { ...depA, status: "done" as Status },
      new Set()
    );

    expect(result).toContainEqual({ id: 2, status: "todo" });
  });

  test("should block parent with multiple dependencies if one is not-done", () => {
    const depA = createTask(1, "A", "done");
    const depB = createTask(2, "B", "done");
    const taskC = createTask(3, "C", "todo", [depA, depB]);

    const tasklist = [depA, depB, taskC];
    const result = getParentTasksToUpdate(
      tasklist,
      { ...depA, status: "in-progress" as Status },
      new Set()
    );

    expect(result).toContainEqual({ id: 3, status: "blocked" });
  });

  test("should handle 3-level deep hierarchy", () => {
    const taskA = createTask(1, "A", "done");
    const taskB = createTask(2, "B", "todo", [taskA]);
    const taskC = createTask(3, "C", "todo", [taskB]);

    const tasklist = [taskA, taskB, taskC];
    const result = getParentTasksToUpdate(
      tasklist,
      { ...taskA, status: "in-progress" as Status },
      new Set()
    );

    expect(result.map((u) => u.id)).toContain(2); // B blocked
    expect(result.map((u) => u.id)).toContain(3); // C blocked
  });

  test("should handle diamond dependency pattern", () => {
    const taskA = createTask(1, "A", "done");
    const taskB = createTask(2, "B", "todo", [taskA]);
    const taskC = createTask(3, "C", "todo", [taskA]);
    const taskD = createTask(4, "D", "todo", [taskB, taskC]);

    const tasklist = [taskA, taskB, taskC, taskD];
    const result = getParentTasksToUpdate(
      tasklist,
      { ...taskA, status: "in-progress" as Status },
      new Set()
    );

    expect(result.map((u) => u.id)).toContain(2);
    expect(result.map((u) => u.id)).toContain(3);
  });

  test("should handle circular dependencies without infinite loop", () => {
    const taskA = createTask(1, "A", "done");
    const taskB = createTask(2, "B", "todo", [taskA]);

    // Create circular ref
    taskA.dependencies = [taskB];

    const tasklist = [taskA, taskB];

    // Should not hang
    const result = getParentTasksToUpdate(
      tasklist,
      { ...taskA, status: "in-progress" as Status },
      new Set()
    );

    expect(Array.isArray(result)).toBe(true);
  });

  test("should deduplicate results", () => {
    const taskA = createTask(1, "A", "done");
    const taskB = createTask(2, "B", "todo", [taskA]);
    const taskC = createTask(3, "C", "todo", [taskA, taskB]);

    const tasklist = [taskA, taskB, taskC];
    const result = getParentTasksToUpdate(
      tasklist,
      { ...taskA, status: "in-progress" as Status },
      new Set()
    );

    const ids = result.map((u) => u.id);
    expect(ids.length).toEqual(new Set(ids).size); // No duplicates
  });

  test("should handle large hierarchies", () => {
    const tasklist: ITask[] = [];
    for (let i = 1; i <= 50; i++) {
      tasklist.push(
        createTask(
          i,
          `Task ${i}`,
          i === 1 ? "done" : "todo",
          i === 1 ? [] : [tasklist[i - 2]]
        )
      );
    }

    const result = getParentTasksToUpdate(
      tasklist,
      { ...tasklist[0], status: "in-progress" as Status },
      new Set()
    );

    expect(result.length).toBeGreaterThan(0);
  });
});
