"use client";
import { ITask } from "@/types/task";
import { fetchTaskDetails, renderStatusBadge } from "@/lib/utils";
import { supabase } from "@/app/page";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";
import { Separator } from "@/components/ui/separator";
import { Label } from "@radix-ui/react-label";
import { ChevronLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect } from "react";
import Link from "next/link";
import { useTaskStore } from "@/store/task";
import { Spinner } from "@/components/ui/spinner";

const TaskDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id;

  const [taskDetails, setTaskDetails] = React.useState<ITask>({
    id: 0,
    title: "",
    description: "",
    status: "todo",
    dependencies: [],
  });
  const [isLoading, setIsLoading] = React.useState(true);

  useEffect(() => {
    if (taskId && !isNaN(+taskId)) {
      setIsLoading(true);

      fetchTaskDetails(+taskId).then((details) => {
        if (details) {
          setTaskDetails(details);
        }

        setIsLoading(false);
      });
    }
  }, [taskId]);

  if (isLoading)
    return (
      <div className="flex items-center justify-center">
        <Spinner />
      </div>
    );

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-3xl font-bold">Task Details</h1>
      </div>

      <Separator className="mb-6" />

      <div className="space-y-6">
        <div className="space-y-2">
          <Label className="text-lg font-semibold text-gray-700">Title</Label>
          <p className="text-xl font-medium">{taskDetails.title}</p>
        </div>

        <div className="space-y-2">
          <Label className="text-lg font-semibold text-gray-700">
            Description
          </Label>
          <p className="text-gray-600">{taskDetails.description}</p>
        </div>

        <div className="space-y-2">
          <Label className="text-lg font-semibold text-gray-700">Status</Label>
          <div className="flex items-center">
            {renderStatusBadge(taskDetails.status)}
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-lg font-semibold text-gray-700">
            Dependencies
          </Label>
          {taskDetails.dependencies.length > 0 ? (
            <div className="flex flex-col gap-2">
              {taskDetails.dependencies.map((dep) => (
                <Link key={dep.id} href={`/tasks/${dep.id}`}>
                  <Item
                    key={dep.id}
                    variant="outline"
                    className="hover:bg-black/10"
                  >
                    <ItemContent>
                      <ItemTitle>{dep.title}</ItemTitle>
                      <ItemDescription>{dep.description}</ItemDescription>
                    </ItemContent>
                    <ItemActions>
                      {renderStatusBadge(dep.status)}
                      <Button variant="outline" size="sm">
                        Open
                      </Button>
                    </ItemActions>
                  </Item>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No dependencies</p>
          )}
        </div>
      </div>

      <Separator className="my-6" />

      <div className="flex gap-3">
        <Button onClick={() => router.push(`/tasks/${taskDetails.id}/edit`)}>
          Edit
        </Button>
        <Button variant="destructive">Delete</Button>
      </div>
    </div>
  );
};

export default TaskDetailsPage;
