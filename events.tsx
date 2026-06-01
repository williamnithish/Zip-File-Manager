import { useState } from "react";
import { useListEvents } from "@workspace/api-client-react";
import { format, formatDistanceToNow } from "date-fns";
import { Activity, Plus, Trash2, GitMerge, RotateCcw, Search, Edit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function getEventIcon(type: string) {
  if (type.includes("DETECTED")) return <Activity className="h-4 w-4 text-blue-500" />;
  if (type.includes("CONFIRMED")) return <Plus className="h-4 w-4 text-green-500" />;
  if (type.includes("DISMISSED")) return <Trash2 className="h-4 w-4 text-red-500" />;
  if (type.includes("MERGED")) return <GitMerge className="h-4 w-4 text-purple-500" />;
  if (type.includes("UNDONE")) return <RotateCcw className="h-4 w-4 text-orange-500" />;
  return <Edit className="h-4 w-4 text-muted-foreground" />;
}

function getEventBg(type: string) {
  if (type.includes("DETECTED")) return "bg-blue-50 border-blue-100";
  if (type.includes("CONFIRMED")) return "bg-green-50 border-green-100";
  if (type.includes("DISMISSED")) return "bg-red-50 border-red-100";
  if (type.includes("MERGED")) return "bg-purple-50 border-purple-100";
  if (type.includes("UNDONE")) return "bg-orange-50 border-orange-100";
  return "bg-muted border-border";
}

function eventLabel(type: string) {
  return type.replace(/^CAPTURE_/, "").replace(/_/g, " ");
}

function badgeVariant(type: string): "default" | "secondary" | "destructive" | "outline" {
  if (type.includes("CONFIRMED")) return "default";
  if (type.includes("DISMISSED") || type.includes("UNDONE")) return "destructive";
  if (type.includes("MERGED")) return "secondary";
  return "outline";
}

const EVENT_TYPES = ["ALL", "CAPTURE_DETECTED", "CAPTURE_CONFIRMED", "CAPTURE_DISMISSED", "CAPTURE_MERGED", "CAPTURE_UNDONE"];

export default function EventLog() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [limit, setLimit] = useState(100);

  const { data: events, isLoading } = useListEvents({ limit });

  const filtered = events?.filter(e => {
    const matchType = typeFilter === "ALL" || e.eventType === typeFilter;
    const matchSearch = !search || e.eventType.includes(search.toUpperCase()) || String(e.nodeId ?? "").includes(search) || String(e.patientId ?? "").includes(search);
    return matchType && matchSearch;
  });

  return (
    <div className="p-8 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Event Log</h1>
          <p className="text-muted-foreground mt-1">Full audit trail of all pipeline decisions and actions.</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">{filtered?.length ?? 0}</p>
          <p className="text-xs text-muted-foreground">events</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input data-testid="input-search-events" placeholder="Search events..." className="pl-9 h-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[220px] h-9" data-testid="select-event-type-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EVENT_TYPES.map(t => (
              <SelectItem key={t} value={t}>{t === "ALL" ? "All Event Types" : t.replace(/^CAPTURE_/, "").replace(/_/g, " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={String(limit)} onValueChange={v => setLimit(Number(v))}>
          <SelectTrigger className="w-[100px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[50, 100, 250, 500].map(n => <SelectItem key={n} value={String(n)}>Last {n}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader className="pb-0 pt-4 px-4">
          <CardTitle className="text-sm text-muted-foreground font-normal">{filtered?.length ?? 0} events</CardTitle>
        </CardHeader>
        <CardContent className="p-0 mt-2">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Loading events...</div>
          ) : !filtered?.length ? (
            <div className="p-12 text-center text-muted-foreground text-sm border-t border-border">No events match your filter.</div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((event, idx) => {
                const meta = event.metadata as Record<string, unknown> | null;
                return (
                  <div key={event.id} data-testid={`event-row-${event.id}`} className="flex gap-4 px-4 py-3 hover:bg-muted/30 transition-colors group">
                    {/* Timeline line */}
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <div className={`h-8 w-8 rounded-full border flex items-center justify-center ${getEventBg(event.eventType)}`}>
                        {getEventIcon(event.eventType)}
                      </div>
                      {idx < (filtered.length - 1) && <div className="flex-1 w-px bg-border min-h-[8px]" />}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-1 pb-2 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={badgeVariant(event.eventType)} className="text-xs h-5">
                          {eventLabel(event.eventType)}
                        </Badge>
                        {event.nodeId && (
                          <span className="text-xs text-muted-foreground">Node #{event.nodeId}</span>
                        )}
                        {event.candidateId && (
                          <span className="text-xs text-muted-foreground">Candidate #{event.candidateId}</span>
                        )}
                      </div>
                      <div className="flex gap-3 flex-wrap">
                        {event.patientId && <span className="text-xs text-muted-foreground">Patient #{event.patientId}</span>}
                        {event.doctorId && <span className="text-xs text-muted-foreground">· Doctor #{event.doctorId}</span>}
                        {meta && Object.keys(meta).length > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {Object.entries(meta).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Timestamp */}
                    <div className="shrink-0 text-right pt-1 space-y-0.5">
                      <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}</p>
                      <p className="text-[10px] text-muted-foreground/60">{format(new Date(event.createdAt), "HH:mm:ss")}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
