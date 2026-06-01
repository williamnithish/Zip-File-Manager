import { useGetCaptureSummary, useListEvents, useCheckOpenAIHealth } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Activity, Network, FileCheck, CheckCircle2, ShieldAlert, CheckSquare,
  AlertTriangle, Info, GitMerge, RotateCcw, Plus, Trash2, Zap, CircleAlert,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

function typeColor(label: string) {
  if (label === "CONSTRAINT") return "bg-red-500";
  if (label === "DECISION") return "bg-primary";
  if (label === "ANTI_PATTERN") return "bg-orange-500";
  if (label === "FACT") return "bg-blue-500";
  return "bg-muted-foreground";
}

function tierColor(label: string) {
  if (label === "HIGH") return "bg-green-500";
  if (label === "MEDIUM") return "bg-yellow-500";
  return "bg-red-400";
}

function deptColor(idx: number) {
  const colors = ["bg-teal-500", "bg-violet-500", "bg-amber-500", "bg-sky-500", "bg-rose-500", "bg-emerald-500"];
  return colors[idx % colors.length];
}

function eventIcon(type: string) {
  if (type.includes("DETECTED")) return <Activity className="h-3.5 w-3.5 text-blue-500" />;
  if (type.includes("CONFIRMED")) return <Plus className="h-3.5 w-3.5 text-green-500" />;
  if (type.includes("DISMISSED")) return <Trash2 className="h-3.5 w-3.5 text-red-500" />;
  if (type.includes("MERGED")) return <GitMerge className="h-3.5 w-3.5 text-purple-500" />;
  if (type.includes("UNDONE")) return <RotateCcw className="h-3.5 w-3.5 text-orange-500" />;
  return <Activity className="h-3.5 w-3.5 text-muted-foreground" />;
}

function eventLabel(type: string) {
  return type.replace(/CAPTURE_/, "").replace(/_/g, " ");
}

function eventBadgeVariant(type: string): "default" | "secondary" | "destructive" | "outline" {
  if (type.includes("CONFIRMED")) return "default";
  if (type.includes("DISMISSED")) return "destructive";
  if (type.includes("MERGED")) return "secondary";
  return "outline";
}

export default function Dashboard() {
  const { data: summary, isLoading, isError } = useGetCaptureSummary();
  const { data: events } = useListEvents({ limit: 20 });
  const { data: openAI } = useCheckOpenAIHealth();

  if (isLoading) {
    return (
      <div className="p-8 space-y-4 animate-pulse">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-muted rounded-lg" />)}
      </div>
    );
  }

  if (isError || !summary) {
    return <div className="p-8 text-destructive text-sm">Failed to load dashboard data.</div>;
  }

  const maxTypeCount = Math.max(...(summary.byType.map(t => t.count)), 1);
  const maxDeptCount = Math.max(...(summary.byDepartment.map(d => d.count)), 1);
  const maxTierCount = Math.max(...(summary.byConfidenceTier.map(t => t.count)), 1);

  return (
    <div className="p-8 space-y-8 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Dashboard</h1>
          <p className="text-muted-foreground mt-1">Pipeline health and recent capture activity.</p>
        </div>
        {/* OpenAI status pill */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              data-testid="openai-status"
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium cursor-default ${
                openAI?.configured
                  ? "bg-green-50 border-green-200 text-green-700"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}
            >
              {openAI?.configured
                ? <><Zap className="h-3 w-3" /> AI Ready</>
                : <><CircleAlert className="h-3 w-3" /> No API Key</>
              }
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {openAI?.configured
              ? "OPENAI_API_KEY is configured — extraction, embedding, and transcription are active."
              : "OPENAI_API_KEY is not set. Set it as a Replit Secret to enable AI features."}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Nodes", value: summary.totalNodes, icon: <Network className="h-4 w-4 text-muted-foreground" />, color: "text-foreground" },
          { label: "Active Nodes", value: summary.activeNodes, icon: <CheckCircle2 className="h-4 w-4 text-muted-foreground" />, color: "text-primary" },
          { label: "Pending Review", value: summary.pendingNodes, icon: <FileCheck className="h-4 w-4 text-muted-foreground" />, color: summary.pendingNodes > 0 ? "text-destructive" : "text-foreground" },
          { label: "Today's Captures", value: summary.todayCaptures, icon: <Activity className="h-4 w-4 text-muted-foreground" />, color: "text-foreground" },
        ].map(item => (
          <Card key={item.label} data-testid={`kpi-${item.label.toLowerCase().replace(/ /g, "-")}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{item.label}</CardTitle>
              {item.icon}
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${item.color}`}>{item.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* By Type breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Nodes by Type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.byType.length === 0 && <p className="text-sm text-muted-foreground">No data yet.</p>}
            {summary.byType.map(item => (
              <div key={item.label} data-testid={`chart-type-${item.label}`} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    {item.label === "CONSTRAINT" && <ShieldAlert className="h-3 w-3 text-red-500" />}
                    {item.label === "DECISION" && <CheckSquare className="h-3 w-3 text-primary" />}
                    {item.label === "ANTI_PATTERN" && <AlertTriangle className="h-3 w-3 text-orange-500" />}
                    {item.label === "FACT" && <Info className="h-3 w-3 text-blue-500" />}
                    <span className="font-medium">{item.label.replace("_", " ")}</span>
                  </div>
                  <span className="text-muted-foreground">{item.count}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${typeColor(item.label)} rounded-full transition-all duration-700`}
                    style={{ width: `${(item.count / maxTypeCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* By Department breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Nodes by Department</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.byDepartment.length === 0 && <p className="text-sm text-muted-foreground">No data yet.</p>}
            {summary.byDepartment.map((item, idx) => (
              <div key={item.label} data-testid={`chart-dept-${item.label}`} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium capitalize">{item.label}</span>
                  <span className="text-muted-foreground">{item.count}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${deptColor(idx)} rounded-full transition-all duration-700`}
                    style={{ width: `${(item.count / maxDeptCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* By Confidence Tier breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Nodes by Confidence</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.byConfidenceTier.length === 0 && <p className="text-sm text-muted-foreground">No data yet.</p>}
            {summary.byConfidenceTier.map(item => (
              <div key={item.label} data-testid={`chart-tier-${item.label}`} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium">{item.label}</span>
                  <span className="text-muted-foreground">{item.count}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${tierColor(item.label)} rounded-full transition-all duration-700`}
                    style={{ width: `${(item.count / maxTierCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            <div className="pt-1 border-t border-border/40 space-y-0.5">
              <p className="text-[10px] text-muted-foreground">HIGH &gt;85% · MEDIUM 60–85% · LOW &lt;60%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent activity feed */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {(!events || events.length === 0) ? (
            <p className="text-sm text-muted-foreground p-4">No recent activity.</p>
          ) : (
            <div className="divide-y divide-border">
              {events.slice(0, 15).map(event => (
                <div key={event.id} data-testid={`event-row-${event.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/40 transition-colors">
                  <div className="h-7 w-7 rounded-full bg-background border flex items-center justify-center shrink-0">
                    {eventIcon(event.eventType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={eventBadgeVariant(event.eventType)} className="text-[10px] h-4 px-1.5">{eventLabel(event.eventType)}</Badge>
                      {event.nodeId && <span className="text-xs text-muted-foreground">Node #{event.nodeId}</span>}
                      {event.patientId && <span className="text-xs text-muted-foreground">· Patient #{event.patientId}</span>}
                    </div>
                  </div>
                  <time className="text-xs text-muted-foreground shrink-0">
                    {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                  </time>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
