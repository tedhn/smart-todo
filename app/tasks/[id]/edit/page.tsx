"use client";
import { ITask, Status } from "@/types/task";
import { supabase } from "@/app/page";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectGroup,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/ui/multi-select";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect } from "react";
import toast from "react-hot-toast";
import { useTaskStore } from "@/store/task";
import { fetchTaskDetails } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

const TaskEditPage = () => {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id;

  const tasklist = useTaskStore((state) => state.tasklist);
  const fetchTasks = useTaskStore((state) => state.fetchTasks);
  const updateTasklist = useTaskStore((state) => state.updateTaskList);
  const isFetched = useTaskStore((state) => state.isFetched);

  const [isLoading, setIsLoading] = React.useState(true);
  const [taskDetails, setTaskDetails] = React.useState<ITask>({
    id: 0,
    title: "",
    description: "",
    status: "todo",
    dependencies: [],
  });
  const [saving, setSaving] = React.useState(false);

  const multiselectTasklist = tasklist.filter(
    (task) => task.id !== Number(taskId)
  );

  // Fetch task details
  useEffect(() => {
    if (taskId && !isNaN(+taskId)) {
      setIsLoading(true);
      fetchTaskDetails(+taskId, false).then((details) => {
        if (details) {
          setTaskDetails(details);
        }

        setIsLoading(false);
      });
    }
  }, [taskId]);

  // Fetch task list for dependencies
  useEffect(() => {
    if (!isFetched) {
      fetchTasks();
    }
  }, [fetchTasks]);

  const handleSave = async () => {
    if (!taskDetails.title || !taskDetails.description) {
      toast.error("Please fill in all fields");
      return;
    }

    setSaving(true);

    try {
      // Update task

      const newStatus = taskDetails.dependencies.every(
        (dep) => dep.status === "done"
      )
        ? taskDetails.status
        : "blocked";

      const { error: updateError } = await supabase
        .from("Tasks")
        .update({
          title: taskDetails.title,
          description: taskDetails.description,
          status: newStatus,
        })
        .eq("id", taskDetails.id);

      if (updateError) {
        console.error("Error updating task:", updateError);
        toast.error("Failed to update task");
        setSaving(false);
        return;
      }

      // Delete all existing dependencies
      const { error: deleteError } = await supabase
        .from("Dependencies")
        .delete()
        .eq("task_id", taskDetails.id);

      if (deleteError) {
        console.error("Error deleting dependencies:", deleteError);
        toast.error("Failed to update dependencies");
        setSaving(false);
        return;
      }

      // Insert new dependencies
      if (taskDetails.dependencies.length > 0) {
        const { error: insertError } = await supabase
          .from("Dependencies")
          .insert(
            taskDetails.dependencies.map((dep) => ({
              task_id: taskDetails.id,
              dependency_id: dep.id,
            }))
          );

        if (insertError) {
          console.error("Error adding dependencies:", insertError);
          toast.error("Failed to update dependencies");
          setSaving(false);
          return;
        }
      }

      const newTaskItem = {
        ...taskDetails,
        status: newStatus,
        dependencies: taskDetails.dependencies,
      };

      const error = await updateTasklist(newTaskItem);

      if (error) {
        toast.error("Something happened while updating dependencies");
      }

      toast.success("Task updated successfully!");
      router.back();
      // setSaving(false);
    } catch (error) {
      console.error("Error saving task:", error);
      toast.error("An error occurred while saving");
    } finally {
      setSaving(false);
    }
  };

  const handleMultipleSelectChange = (ids: string[]) => {
    console.log(ids);

    const newDependencies = ids
      .map((id) => tasklist.find((task) => task.id === +id))
      .filter((task) => task !== undefined)
      .map(({ dependencies, ...task }) => task);

    setTaskDetails((prev) => ({ ...prev, dependencies: newDependencies }));
  };

  if (isLoading)
    return (
      <div className="flex items-center justify-center">
        <Spinner />
      </div>
    );

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          disabled={saving}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-3xl font-bold">Edit Task</h1>
      </div>

      <Separator className="mb-6" />

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title" className="text-base font-semibold">
            Title
          </Label>
          <Input
            id="title"
            placeholder="Task title"
            value={taskDetails.title}
            onChange={(e) =>
              setTaskDetails({ ...taskDetails, title: e.target.value })
            }
            disabled={saving}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-base font-semibold">
            Description
          </Label>
          <Input
            id="description"
            placeholder="Task description"
            value={taskDetails.description}
            onChange={(e) =>
              setTaskDetails({ ...taskDetails, description: e.target.value })
            }
            disabled={saving}
          />
        </div>

        {taskDetails.dependencies.every((task) => task.status === "done") && (
          <div className="space-y-2">
            <Label htmlFor="status" className="text-base font-semibold">
              Status
            </Label>
            <Select
              value={taskDetails.status}
              onValueChange={(value) =>
                setTaskDetails({
                  ...taskDetails,
                  status: value as Status,
                })
              }
              disabled={saving}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-base font-semibold">Dependencies</Label>
          <MultiSelect
            values={taskDetails.dependencies.map((dep) => String(dep.id))}
            onValuesChange={handleMultipleSelectChange}
          >
            <MultiSelectTrigger className="w-full" disabled={saving}>
              <MultiSelectValue placeholder="Select dependencies..." />
            </MultiSelectTrigger>

            <MultiSelectContent>
              <MultiSelectGroup>
                {multiselectTasklist.map((task) => (
                  <MultiSelectItem key={task.id} value={String(task.id)}>
                    {task.title}
                  </MultiSelectItem>
                ))}
              </MultiSelectGroup>
            </MultiSelectContent>
          </MultiSelect>
        </div>
      </div>

      <Separator className="my-6" />

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => router.back()}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
};

export default TaskEditPage;
