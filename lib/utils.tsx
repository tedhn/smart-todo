import { supabase } from "@/app/page";
import { Badge } from "@/components/ui/badge";
import { ITask, Status } from "@/types/task";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const renderStatusBadge = (status: Status) => {
  switch (status) {
    case "blocked":
      return <Badge variant="destructive">Blocked</Badge>;
    case "in-progress":
      return <Badge variant="warning">In Progress</Badge>;
    case "todo":
      return <Badge variant="secondary">To Do</Badge>;
    case "done":
      return <Badge variant="success">Done</Badge>;
    default:
      return <Badge>Unknown</Badge>;
  }
};

export const fetchTaskDetails = async (taskId: number, isDetailed = false) => {
  const { data: tasks, error } = await supabase
    .from("Tasks")
    .select(
      `
        id,
        title,
        description,
        status,
        Dependencies!task_id (
          Tasks!dependency_id (
            id,
            title,
            description,
            status
          )
        )
      `
    )
    .eq("id", taskId);

  if (error) {
    console.error("Error fetching tasks:", error);

    return null;
  }

  if (tasks && tasks.length > 0) {
    const mainTask = tasks[0];
    const dependencies = mainTask.Dependencies.flatMap((dep) => dep.Tasks);

    const taskDetails = {
      id: mainTask.id,
      title: mainTask.title,
      description: mainTask.description,
      status: mainTask.status as Status,
      dependencies: dependencies,
    };
    return taskDetails;
  }

  return null;
};

export const getParentTasksToUpdate = (
  tasklist: ITask[],
  newTask: ITask,
  visited: Set<number>
): { id: number; status: Status }[] => {
  const newTasklist = tasklist.map((t) => (t.id === newTask.id ? newTask : t));

  if (visited.has(newTask.id)) return [];
  visited.add(newTask.id);

  const parentTasks = newTasklist.filter((t) =>
    t.dependencies.some((dep) => dep.id === newTask.id)
  );

  const parentsToUpdate = parentTasks.map((parentTask) => {
    const updatedParentTask = {
      ...parentTask,
      dependencies: parentTask.dependencies.map(
        (dep) => newTasklist.find((t) => t.id === dep.id) || dep
      ),
    };

    const isBlocked = updatedParentTask.dependencies.some(
      (dep) => dep.status !== "done"
    );

    const newStatus = isBlocked ? ("blocked" as Status) : ("todo" as Status);
    return { id: parentTask.id, status: newStatus };
  });

  const recursiveUpdates = parentTasks.flatMap((parentTask, index) => {
    const newParentTask = {
      ...parentTask,
      status: parentsToUpdate[index].status,
    };
    return getParentTasksToUpdate(newTasklist, newParentTask, visited);
  });

  const allUpdates = [...parentsToUpdate, ...recursiveUpdates];
  const uniqueUpdates = Array.from(
    new Map(allUpdates.map((u) => [u.id, u])).values()
  );
  return uniqueUpdates;
};
