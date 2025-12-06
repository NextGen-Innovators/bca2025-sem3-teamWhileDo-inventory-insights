"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { useDashboard } from "@/lib/context/dashboard-context";

export default function IssuesList() {
  const { issues, deleteIssue } = useDashboard();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "todo":
        return "bg-red-100 text-red-800";
      case "in-progress":
        return "bg-yellow-100 text-yellow-800";
      case "finished":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Issues</CardTitle>
        <CardDescription>Manage project issues and tasks</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {issues.length === 0 ? (
            <p className="text-muted-foreground text-sm">No issues yet</p>
          ) : (
            issues.map((issue) => (
              <div
                key={issue.id}
                className="flex items-start justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition"
              >
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">{issue.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {issue.description}
                  </p>
                  <Badge className={`mt-2 ${getStatusColor(issue.status)}`}>
                    {issue.status.replace("-", " ")}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteIssue(issue.id)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
