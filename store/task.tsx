import { supabase } from "@/app/page";
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

    console.log("Fetched tasks:", tasklist);

    set({ tasklist: tasklist, isFetched: true, error: null });
  },

  updateTaskList: async (newTask: ITask) => {
    const { tasklist } = get();
    const newTasklist = tasklist.map((task) =>
      task.id === newTask.id ? newTask : task
    );

    console.log(newTask);
    console.log(newTasklist);

    const dependentTasks = newTasklist.filter((task) =>
      task.dependencies.some((dep) => dep.id === newTask.id)
    );

    console.log(dependentTasks);

    const dependantTasksToUpdate = dependentTasks.map((task) => {
      const dependencies = task.dependencies.filter(
        (dep) => dep.id !== newTask.id
      );

      const newTaskIsDone = newTask.status === "done";
      const allOtherDependenciesDone = dependencies.every(
        (dep) => dep.status === "done"
      );

      return {
        id: task.id,
        status:
          allOtherDependenciesDone && newTaskIsDone
            ? ("todo" as Status)
            : ("blocked" as Status),
      };
    });

    console.log(dependantTasksToUpdate);

    const { error } = await supabase
      .from("Tasks")
      .upsert(dependantTasksToUpdate)
      .select();

    if (error) {
      return error;
    }

    // Update local state with new statuses
    const finalTasklist = newTasklist.map((task) => {
      const update = dependantTasksToUpdate.find((u) => u.id === task.id);
      return update ? { ...task, status: update.status } : task;
    });

    set({ tasklist: finalTasklist, isFetched: false });
    return null;
  },
}));
