import { supabase } from "@/app/page";
import { getParentTasksToUpdate } from "@/lib/utils";
import { ITask, Status } from "@/types/task";
import { PostgrestError } from "@supabase/supabase-js";
import { create } from "zustand";

interface ITaskState {
  tasklist: ITask[];
  isFetched: boolean;
  error: string | null;
  fetchTasks: () => Promise<void>;
  updateTaskList: (newTask: ITask) => Promise<null | PostgrestError>;
}

export const useTaskStore = create<ITaskState>((set, get) => ({
  tasklist: [],
  taskDetails: {
    id: 0,
    title: "",
    description: "",
    status: "todo",
    dependencies: [],
  },
  isFetched: false,
  loading: false,
  error: null,

  fetchTasks: async () => {
    const { data, error } = await supabase.from("Tasks").select(`
          id,
          title,
          description,
          status,
          Dependencies!task_id (
            dependency_id,
            Tasks!dependency_id (
              id,
              title,
              description,
              status
            )
          )
        `);

    if (error) {
      set({ error: error.message });
      return;
    }

    const tasklist = data.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      dependencies: task.Dependencies.map((dep) => ({
        id: dep.dependency_id,
        title: dep.Tasks.title,
        description: dep.Tasks.description,
        status: dep.Tasks.status,
      })),
    }));

    set({ tasklist: tasklist, isFetched: true, error: null });
  },

  updateTaskList: async (newTask: ITask) => {
    const { tasklist } = get();

    const visited = new Set<number>();

    const parentTasksToUpdate = getParentTasksToUpdate(
      tasklist,
      newTask,
      visited
    );

    const { error } = await supabase
      .from("Tasks")
      .upsert(parentTasksToUpdate)
      .select();

    if (error) return error;

    const tasksToUpdate = [
      { id: newTask.id, status: newTask.status },
      ...parentTasksToUpdate,
    ];
    const newTasklist = tasklist.map((task) => {
      const taskFound = tasksToUpdate.find((t) => t.id === task.id);

      return taskFound ? { ...task, status: taskFound.status } : task;
    });

    set({ tasklist: newTasklist, isFetched: false });
    return null;
  },
}));
