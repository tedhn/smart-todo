export type Status = "todo" | "in-progress" | "blocked" | "done";

export interface ITask {
  id: number;
  title: string;
  description: string;
  dependencies: ITaskDependency[];
  status: Status;
}

export interface ITaskDependency extends Omit<ITask, "dependencies"> {}
