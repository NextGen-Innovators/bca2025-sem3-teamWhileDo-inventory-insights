"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useDashboard } from "./context/dashboard-context";

export default function KanbanBoard() {
  const { issues, updateIssue } = useDashboard();
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);

  const todoIssues = issues.filter((i) => i.status === "todo");
  const inProgressIssues = issues.filter((i) => i.status === "in-progress");
  const finishedIssues = issues.filter((i) => i.status === "finished");

  const KanbanColumn = ({
    title,
    issues: columnIssues,
    nextStatus,
  }: {
    title: string;
    issues: typeof issues;
    nextStatus: "in-progress" | "finished" | undefined;
  }) => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">{title}</h3>
        <Badge variant="outline">{columnIssues.length}</Badge>
      </div>
      <div className="bg-muted/30 rounded-lg p-4 min-h-96 space-y-3">
        {columnIssues.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No tasks
          </p>
        ) : (
          columnIssues.map((issue) => (
            <div
              key={issue.id}
              className="bg-card border border-border rounded-lg p-3 space-y-2 hover:shadow-md transition"
            >
              <h4 className="font-medium text-foreground text-sm">
                {issue.title}
              </h4>
              <p className="text-xs text-muted-foreground">
                {issue.description}
              </p>
              {nextStatus && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs h-7"
                  onClick={() => updateIssue(issue.id, { status: nextStatus })}
                >
                  Move to {nextStatus.replace("-", " ")}
                </Button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <KanbanColumn
        title="To Do"
        issues={todoIssues}
        nextStatus="in-progress"
      />
      <KanbanColumn
        title="In Progress"
        issues={inProgressIssues}
        nextStatus="finished"
      />
      <KanbanColumn
        title="Finished"
        issues={finishedIssues}
        nextStatus={undefined}
      />
    </div>
  );
}
