import { supabase } from "@/app/page";
import { Badge } from "@/components/ui/badge";
import { ITask, ITaskDetails, Status } from "@/types/task";
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
