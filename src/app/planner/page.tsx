"use client";

import AddTaskForm from "@/components/planner/AddTaskForm";
import TaskList from "@/components/planner/TaskList";

export default function PlannerPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8 text-center text-foreground">Planlayıcı</h1>
      <div className="max-w-xl mx-auto mb-8">
        <AddTaskForm />
      </div>
      <div>
        <TaskList />
      </div>
    </div>
  );
} 