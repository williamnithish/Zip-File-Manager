import { useState, useCallback } from "react";
import {
  useListKnowledgeNodes,
  useUpdateKnowledgeNode,
  useSemanticSearchNodes,
  useListPatients,
  getListKnowledgeNodesQueryKey,
  KnowledgeNode,
  SemanticSearchResult,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Search, Filter, ShieldAlert, CheckSquare, Info, AlertTriangle,
  Pencil, X, Check, Loader2, User, Archive, Download, Sparkles, RotateCcw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

function getTypeIcon(type: string, size = "h-4 w-4") {
  switch (type) {
    case "CONSTRAINT": return <ShieldAlert className={`${size} text-red-500`} />;
    case "DECISION": return <CheckSquare className={`${size} text-primary`} />;
    case "ANTI_PATTERN": return <AlertTriangle className={`${size} text-orange-500`} />;
    case "FACT": return <Info className={`${size} text-blue-500`} />;
    default: return <Info className={`${size}`} />;
  }
}

function typeBorderColor(type: string) {
  if (type === "CONSTRAINT") return "border-t-red-500";
  if (type === "DECISION") return "border-t-primary";
  if (type === "ANTI_PATTERN") return "border-t-orange-500";
  return "border-t-blue-500";
}

function similarityColor(sim: number) {
  if (sim >= 0.85) return "bg-green-100 text-green-700 border-green-200";
  if (sim >= 0.65) return "bg-yellow-100 text-yellow-700 border-yellow-200";
  return "bg-muted text-muted-foreground border-border";
}

function exportToCSV(nodes: KnowledgeNode[]) {
  const headers = ["ID", "Type", "Title", "Content", "Confidence", "Status", "Level", "Department", "Rationale", "PatientID", "DoctorID", "Created"];
  const rows = nodes.map(n => [
    n.id,
    n.type,
    `"${n.title.replace(/"/g, '""')}"`,
    `"${n.content.replace(/"/g, '""')}"`,
    (n.confidence * 100).toFixed(1) + "%",
    n.status,
    n.level,
    n.department ?? "",
    `"${(n.rationale ?? "").replace(/"/g, '""')}"`,
    n.patientId ?? "",
    n.doctorId ?? "",
    n.createdAt ? format(new Date(n.createdAt), "yyyy-MM-dd HH:mm") : "",
  ]);
  const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `knowledge-nodes-${format(new Date(), "yyyy-MM-dd")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function KnowledgeBrowser() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // mode: "browse" = normal filters, "semantic" = AI similarity search
  const [mode, setMode] = useState<"browse" | "semantic">("browse");

  // Browse state
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [patientFilter, setPatientFilter] = useState("ALL");

  // Semantic search state
  const [semanticQuery, setSemanticQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [topK, setTopK] = useState(10);

  const { data: patients } = useListPatients();
  const { data: nodes, isLoading: loadingBrowse } = useListKnowledgeNodes(
    mode === "browse"
      ? (statusFilter !== "ALL" || patientFilter !== "ALL"
        ? {
            ...(statusFilter !== "ALL" ? { status: statusFilter as "ACTIVE" | "PENDING_CONFIRMATION" | "DISMISSED" } : {}),
            ...(patientFilter !== "ALL" ? { patientId: Number(patientFilter) } : {}),
          }
        : undefined)
      : undefined
  );

  const semanticSearch = useSemanticSearchNodes();

  const [semanticResults, setSemanticResults] = useState<SemanticSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSemanticSearch = async () => {
    if (!semanticQuery.trim()) return;
    setIsSearching(true);
    setSubmittedQuery(semanticQuery);
    try {
      const results = await semanticSearch.mutateAsync({ data: { query: semanticQuery, topK } });
      setSemanticResults(results);
    } catch {
      toast({ title: "Semantic search failed", description: "Check that OPENAI_API_KEY is set.", variant: "destructive" });
    } finally {
      setIsSearching(false);
    }
  };

  const filtered = mode === "browse" ? nodes?.filter(node => {
    const matchSearch = !search || node.title.toLowerCase().includes(search.toLowerCase()) || node.content.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "ALL" || node.type === typeFilter;
    return matchSearch && matchType;
  }) : undefined;

  const counts = { total: filtered?.length ?? 0, CONSTRAINT: 0, DECISION: 0, ANTI_PATTERN: 0, FACT: 0 };
  filtered?.forEach(n => { counts[n.type as keyof typeof counts] = (counts[n.type as keyof typeof counts] as number) + 1; });

  const handleExport = useCallback(() => {
    const toExport = mode === "browse" ? filtered : semanticResults.map(r => r.node);
    if (!toExport || toExport.length === 0) {
      toast({ title: "Nothing to export", description: "No nodes match the current filters.", variant: "destructive" });
      return;
    }
    exportToCSV(toExport);
    toast({ title: "Export ready", description: `${toExport.length} node(s) downloaded as CSV.` });
  }, [filtered, semanticResults, mode, toast]);

  const invalidate = useCallback(() => queryClient.invalidateQueries({ queryKey: getListKnowledgeNodesQueryKey() }), [queryClient]);

  const displayCount = mode === "browse" ? counts.total : semanticResults.length;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Knowledge Graph</h1>
          <p className="text-muted-foreground mt-1">Browse, filter, edit, and export validated clinical knowledge nodes.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            data-testid="button-export-csv"
            variant="outline"
            size="sm"
            onClick={handleExport}
          >
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
          <div className="text-right">
            <p className="text-2xl font-bold">{displayCount}</p>
            <p className="text-xs text-muted-foreground">nodes</p>
          </div>
        </div>
      </div>

      {/* Mode switcher */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-lg w-fit border">
        <button
          data-testid="tab-browse"
          onClick={() => setMode("browse")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${mode === "browse" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Filter className="h-3.5 w-3.5" /> Browse
        </button>
        <button
          data-testid="tab-semantic"
          onClick={() => setMode("semantic")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${mode === "semantic" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Sparkles className="h-3.5 w-3.5" /> Semantic Search
        </button>
      </div>

      {mode === "browse" ? (
        <>
          {/* Type summary pills */}
          <div className="flex gap-2 flex-wrap">
            {(["CONSTRAINT", "DECISION", "ANTI_PATTERN", "FACT"] as const).map(type => (
              <button
                key={type}
                data-testid={`filter-pill-${type}`}
                onClick={() => setTypeFilter(prev => prev === type ? "ALL" : type)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${typeFilter === type ? "bg-foreground text-background border-foreground" : "bg-muted/40 border-border hover:bg-muted"}`}
              >
                {getTypeIcon(type, "h-3 w-3")}
                {type.replace("_", " ")}
                <span className="text-muted-foreground">{counts[type]}</span>
              </button>
            ))}
          </div>

          {/* Filters row */}
          <div className="flex gap-3 items-center flex-wrap">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input data-testid="input-search-nodes" placeholder="Search by title or content..." className="pl-9 h-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] h-9" data-testid="select-status-filter">
                <Filter className="h-3.5 w-3.5 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="PENDING_CONFIRMATION">Pending</SelectItem>
                <SelectItem value="DISMISSED">Dismissed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={patientFilter} onValueChange={setPatientFilter}>
              <SelectTrigger className="w-[180px] h-9" data-testid="select-patient-filter">
                <User className="h-3.5 w-3.5 mr-2" />
                <SelectValue placeholder="All patients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Patients</SelectItem>
                {patients?.map(p => (
                  <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loadingBrowse ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => <div key={i} className="h-48 bg-muted rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered?.map(node => (
                <NodeCard key={node.id} node={node} onSaved={invalidate} />
              ))}
              {filtered?.length === 0 && (
                <div className="col-span-full py-16 text-center border border-dashed rounded-xl bg-muted/20">
                  <p className="text-muted-foreground text-sm">No nodes match your filters.</p>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        /* ─── Semantic search mode ─── */
        <div className="space-y-6">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Semantic Similarity Search
              </CardTitle>
              <CardDescription>
                Describe a clinical concept in plain language — the AI finds the most semantically similar nodes using embeddings, ranked by cosine similarity.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    data-testid="input-semantic-query"
                    placeholder="e.g. contraindications for warfarin, MRI safety, statin therapy..."
                    className="pl-9"
                    value={semanticQuery}
                    onChange={e => setSemanticQuery(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !isSearching && handleSemanticSearch()}
                  />
                </div>
                <Select value={topK.toString()} onValueChange={v => setTopK(Number(v))}>
                  <SelectTrigger className="w-[90px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">Top 5</SelectItem>
                    <SelectItem value="10">Top 10</SelectItem>
                    <SelectItem value="20">Top 20</SelectItem>
                    <SelectItem value="50">Top 50</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  data-testid="button-semantic-search"
                  onClick={handleSemanticSearch}
                  disabled={isSearching || !semanticQuery.trim()}
                >
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  <span className="ml-2">{isSearching ? "Searching…" : "Search"}</span>
                </Button>
              </div>

              <div className="flex gap-3 text-xs text-muted-foreground pt-1">
                <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-green-500" /> ≥85% very similar</span>
                <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-yellow-500" /> 65–84% related</span>
                <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-muted-foreground/40" /> &lt;65% loosely related</span>
              </div>
            </CardContent>
          </Card>

          {submittedQuery && !isSearching && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {semanticResults.length > 0
                  ? <><span className="font-medium text-foreground">{semanticResults.length}</span> results for <span className="italic">"{submittedQuery}"</span></>
                  : <>No results for <span className="italic">"{submittedQuery}"</span> — try rephrasing or check that OPENAI_API_KEY is set.</>
                }
              </p>
              <Button variant="ghost" size="sm" onClick={() => { setSemanticResults([]); setSubmittedQuery(""); setSemanticQuery(""); }} className="text-xs h-7">
                <RotateCcw className="h-3 w-3 mr-1" /> Clear
              </Button>
            </div>
          )}

          {isSearching && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(topK > 6 ? 6 : topK)].map((_, i) => <div key={i} className="h-48 bg-muted rounded-xl animate-pulse" />)}
            </div>
          )}

          {!isSearching && semanticResults.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {semanticResults.map(({ node, similarity }) => (
                <NodeCard
                  key={node.id}
                  node={node}
                  similarity={similarity}
                  onSaved={invalidate}
                />
              ))}
            </div>
          )}

          {!isSearching && !submittedQuery && (
            <div className="py-16 text-center border border-dashed rounded-xl bg-muted/10">
              <Sparkles className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-medium text-muted-foreground">Enter a query above to find semantically similar nodes</p>
              <p className="text-xs text-muted-foreground mt-1">Uses text-embedding-3-small + cosine similarity — no keyword matching</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NodeCard({ node, similarity, onSaved }: { node: KnowledgeNode; similarity?: number; onSaved: () => void }) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(node.content);
  const [editedTitle, setEditedTitle] = useState(node.title);
  const [editedRationale, setEditedRationale] = useState(node.rationale ?? "");
  const updateNode = useUpdateKnowledgeNode();

  const handleSave = async () => {
    try {
      await updateNode.mutateAsync({
        nodeId: node.id,
        data: { title: editedTitle, content: editedContent, rationale: editedRationale },
      });
      onSaved();
      setEditing(false);
      toast({ title: "Node updated" });
    } catch {
      toast({ title: "Update failed", variant: "destructive" });
    }
  };

  const handleArchive = async () => {
    try {
      await updateNode.mutateAsync({ nodeId: node.id, data: { status: "DISMISSED" } });
      onSaved();
      toast({ title: "Node archived", description: node.title });
    } catch {
      toast({ title: "Archive failed", variant: "destructive" });
    }
  };

  const handleRestore = async () => {
    try {
      await updateNode.mutateAsync({ nodeId: node.id, data: { status: "ACTIVE" } });
      onSaved();
      toast({ title: "Node restored" });
    } catch {
      toast({ title: "Restore failed", variant: "destructive" });
    }
  };

  const handleCancel = () => {
    setEditedContent(node.content);
    setEditedTitle(node.title);
    setEditedRationale(node.rationale ?? "");
    setEditing(false);
  };

  const isArchived = node.status === "DISMISSED";

  return (
    <Card data-testid={`node-card-${node.id}`} className={`flex flex-col border-t-2 ${typeBorderColor(node.type)} transition-shadow hover:shadow-md ${isArchived ? "opacity-60" : ""}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            {getTypeIcon(node.type, "h-3.5 w-3.5 shrink-0")}
            <Badge variant="outline" className="text-[10px] h-4 shrink-0">{node.type.replace("_", " ")}</Badge>
          </div>
          <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
            {similarity !== undefined && (
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${similarityColor(similarity)}`}>
                {(similarity * 100).toFixed(0)}% match
              </span>
            )}
            <Badge variant={node.status === "ACTIVE" ? "default" : "secondary"} className="text-[10px] h-4">{node.status.replace("_", " ")}</Badge>
          </div>
        </div>
        {!editing ? (
          <CardTitle className="text-base leading-snug mt-1">{node.title}</CardTitle>
        ) : (
          <Input data-testid={`input-node-title-${node.id}`} value={editedTitle} onChange={e => setEditedTitle(e.target.value)} className="mt-1 h-8 text-sm font-semibold" />
        )}
        <CardDescription className="text-[11px]">
          {node.level} · {node.department ?? "general"} · {(node.confidence * 100).toFixed(0)}% conf
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        {!editing ? (
          <>
            <p className="text-sm leading-relaxed">{node.content}</p>
            {node.rationale && (
              <div className="pt-2 border-t border-border/40">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Rationale</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{node.rationale}</p>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-2">
            <Separator />
            <div>
              <label className="text-xs font-medium text-muted-foreground">Content</label>
              <Textarea data-testid={`input-node-content-${node.id}`} value={editedContent} onChange={e => setEditedContent(e.target.value)} className="mt-1 text-sm resize-none h-28" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Rationale</label>
              <Input data-testid={`input-node-rationale-${node.id}`} value={editedRationale} onChange={e => setEditedRationale(e.target.value)} className="mt-1 h-8 text-sm" />
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-3 gap-2 justify-between">
        {!editing && (
          isArchived ? (
            <Button data-testid={`button-restore-node-${node.id}`} variant="ghost" size="sm" onClick={handleRestore} disabled={updateNode.isPending} className="h-7 text-xs text-muted-foreground hover:text-foreground">
              <Check className="h-3 w-3 mr-1" /> Restore
            </Button>
          ) : (
            <Button data-testid={`button-archive-node-${node.id}`} variant="ghost" size="sm" onClick={handleArchive} disabled={updateNode.isPending} className="h-7 text-xs text-muted-foreground hover:text-destructive">
              <Archive className="h-3 w-3 mr-1" /> Archive
            </Button>
          )
        )}
        <div className="flex gap-1 ml-auto">
          {!editing ? (
            <Button data-testid={`button-edit-node-${node.id}`} variant="ghost" size="sm" onClick={() => setEditing(true)} className="h-7 text-xs">
              <Pencil className="h-3 w-3 mr-1" /> Edit
            </Button>
          ) : (
            <>
              <Button data-testid={`button-cancel-node-${node.id}`} variant="ghost" size="sm" onClick={handleCancel} className="h-7 text-xs">
                <X className="h-3 w-3 mr-1" /> Cancel
              </Button>
              <Button data-testid={`button-save-node-${node.id}`} size="sm" onClick={handleSave} disabled={updateNode.isPending} className="h-7 text-xs">
                {updateNode.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Check className="h-3 w-3 mr-1" />} Save
              </Button>
            </>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
