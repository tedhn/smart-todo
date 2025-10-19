"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectGroup,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/ui/multi-select";
import { Separator } from "@/components/ui/separator";

import { createClient } from "@supabase/supabase-js";
import toast, { Toaster } from "react-hot-toast";
import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Database } from "./supabase";
import { ITask, ITaskDependency, Status } from "@/types/task";
import { renderStatusBadge } from "@/lib/utils";
import { useTaskStore } from "@/store/task";
import { Spinner } from "@/components/ui/spinner";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || "";

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

export default function Home() {
  const tasklist = useTaskStore((state) => state.tasklist);
  const updateTaskList = useTaskStore((state) => state.updateTaskList);
  const fetchTasks = useTaskStore((state) => state.fetchTasks);
  const isFetched = useTaskStore((state) => state.isFetched);

  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [dependencies, setDependencies] = useState<ITaskDependency[]>([]);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    console.log(isFetched);
    if (!isFetched) {
      setIsLoading(true);
      fetchTasks().then(() => {
        setIsLoading(false);
      });
    }
  }, [fetchTasks]);

  const handleAddTask = async (newTask: Omit<ITask, "id">) => {
    if (!newTask.title || !newTask.description) {
      toast.error("Please fill in all fields.");
      return;
    }

    let status: Status = "todo";

    // Check if all dependencies are not blocked
    const areDependenciesBlocked = newTask.dependencies.some((dep) => {
      const depTask = tasklist.find((task) => task.id === dep.id);
      return depTask?.status === "blocked";
    });

    if (areDependenciesBlocked) {
      status = "blocked";
    }

    const { data, error: addedTaskError } = await supabase
      .from("Tasks")
      .insert([
        {
          title: newTask.title,
          description: newTask.description,
          status: status,
        },
      ])
      .select();

    if (addedTaskError) {
      console.error("Error adding task:", addedTaskError);
      toast.error("Failed to add task.");
      return;
    }

    const { updated_at, created_at, ...addedTask } = data[0];

    const { error: dependenciesError } = await supabase
      .from("Dependencies")
      .insert(
        newTask.dependencies.map((dep) => ({
          task_id: addedTask.id,
          dependency_id: dep.id,
        }))
      )
      .select();

    if (dependenciesError) {
      // Rollback: delete the added task if dependencies insertion fails
      await supabase.from("Tasks").delete().eq("id", addedTask.id);

      console.error("Error adding dependencies:", dependenciesError);
      toast.error("Failed to add task dependencies.");
      return;
    }

    updateTaskList({ ...addedTask, dependencies: newTask.dependencies });

    setTitle("");
    setDescription("");
    setDependencies([]);
    toast.success("Task added successfully!");
  };

  if (isLoading)
    return (
      <div className="flex items-center justify-center">
        <Spinner />
      </div>
    );
  return (
    <div className="w-1/3 h-full ">
      <div className="flex  items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-center">Smart Todo</h1>

        <Dialog>
          <DialogTrigger asChild>
            <Button>Add Task</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Task</DialogTitle>
            </DialogHeader>

            <>
              <Label className="mt-4">Title</Label>
              <Input
                placeholder="Task Title"
                className="mt-1 mb-4"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <Label>Description</Label>
              <Input
                placeholder="Task Description"
                className="mt-1 mb-4"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <Label>Dependencies</Label>
              <MultiSelect
                values={dependencies.map((dep) => String(dep.id))}
                onValuesChange={(value) =>
                  setDependencies(
                    dependencies.map((dep) => ({ ...dep, id: Number(value) }))
                  )
                }
              >
                <MultiSelectTrigger className="w-full">
                  <MultiSelectValue placeholder="Select dependencies..." />
                </MultiSelectTrigger>

                <MultiSelectContent>
                  <MultiSelectGroup>
                    {tasklist.map((task) => (
                      <MultiSelectItem key={task.id} value={String(task.id)}>
                        {task.title}
                      </MultiSelectItem>
                    ))}
                  </MultiSelectGroup>
                </MultiSelectContent>
              </MultiSelect>
            </>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Close
                </Button>
              </DialogClose>
              <Button
                onClick={() =>
                  handleAddTask({
                    title,
                    description,
                    status: "todo",
                    dependencies,
                  })
                }
              >
                Submit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Separator className="my-4" />
      <div className="flex flex-col gap-2">
        {tasklist.map((task) => (
          <Link key={task.id} href={`/tasks/${task.id}`}>
            <Item key={task.id} variant="outline" className="hover:bg-black/10">
              <ItemContent>
                <ItemTitle>{task.title}</ItemTitle>
                <ItemDescription>{task.description}</ItemDescription>
              </ItemContent>
              <ItemActions>
                {renderStatusBadge(task.status)}
                <Button variant="outline" size="sm">
                  Open
                </Button>
              </ItemActions>
            </Item>
          </Link>
        ))}
      </div>
    </div>
  );
}
