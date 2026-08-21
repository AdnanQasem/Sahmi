import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye, Search, ScrollText } from "lucide-react";
import { useTranslation } from "react-i18next";
import DashboardLayout from "../DashboardLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminPagination from "@/components/admin/AdminPagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatDate } from "@/i18n/format";
import auditService, { type AuditLogRecord } from "@/services/auditService";

const PAGE_SIZE = 15;

const displayAction = (action: string) => action.replace(/[._]/g, " ");

const translateAuditAction = (t: ReturnType<typeof useTranslation>["t"], action: string) =>
  t(`auditLogs.actions.${action.replace(/[.]/g, "_")}`, { defaultValue: displayAction(action) });

const translateTargetType = (t: ReturnType<typeof useTranslation>["t"], targetType: string) =>
  t(`auditLogs.targetTypes.${targetType}`, { defaultValue: targetType });

const resultVariant = (result: AuditLogRecord["result"]) =>
  result === "success" ? "success" : result === "denied" ? "destructive" : "warning";

const AdminAuditLogsPage = () => {
  const { t, i18n } = useTranslation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [result, setResult] = useState("all");
  const [targetType, setTargetType] = useState("all");
  const [selected, setSelected] = useState<AuditLogRecord | null>(null);

  const logsQuery = useQuery({
    queryKey: ["admin", "audit-logs", page, search, result, targetType],
    queryFn: () => auditService.list({
      page,
      page_size: PAGE_SIZE,
      search: search.trim() || undefined,
      result: result === "all" ? undefined : result,
      target_type: targetType === "all" ? undefined : targetType,
      ordering: "-created_at",
    }),
  });

  const records = logsQuery.data?.results ?? [];
  const targetTypes = Array.from(new Set(records.map((record) => record.target_type).filter(Boolean))).sort();

  return (
    <DashboardLayout roleBase="/dashboard/admin">
      <div className="space-y-7">
        <AdminPageHeader
          icon={ScrollText}
          title={t("auditLogs.title")}
          description={t("auditLogs.description")}
          actions={<Button variant="outline" onClick={() => void logsQuery.refetch()}>{t("admin.refresh")}</Button>}
        />

        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="grid gap-3 border-b border-border p-5 md:grid-cols-[minmax(0,1fr)_12rem_12rem]">
            <div className="relative">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="ps-9"
                value={search}
                onChange={(event) => { setSearch(event.target.value); setPage(1); }}
                placeholder={t("auditLogs.search")}
                aria-label={t("auditLogs.search")}
              />
            </div>
            <Select value={result} onValueChange={(value) => { setResult(value); setPage(1); }}>
              <SelectTrigger aria-label={t("auditLogs.result")}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all")}</SelectItem>
                {(["success", "failure", "denied"] as const).map((value) => <SelectItem key={value} value={value}>{t(`auditLogs.results.${value}`)}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={targetType} onValueChange={(value) => { setTargetType(value); setPage(1); }}>
              <SelectTrigger aria-label={t("auditLogs.targetType")}><SelectValue placeholder={t("auditLogs.targetType")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("auditLogs.allTargets")}</SelectItem>
                {targetTypes.map((value) => <SelectItem key={value} value={value}>{translateTargetType(t, value)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {logsQuery.isLoading ? (
            <div className="space-y-3 p-5">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-16 rounded-xl" />)}</div>
          ) : logsQuery.isError ? (
            <div className="p-10 text-center text-destructive">{t("auditLogs.loadError")}</div>
          ) : records.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">{t("auditLogs.empty")}</div>
          ) : (
            <>
              <div className="divide-y divide-border">
                {records.map((record) => (
                  <article key={record.id} className="grid gap-3 p-5 md:grid-cols-[minmax(0,1fr)_11rem_10rem_auto] md:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-foreground">{translateAuditAction(t, record.action)}</p>
                        <Badge variant={resultVariant(record.result)}>{t(`auditLogs.results.${record.result}`)}</Badge>
                      </div>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {record.actor_detail?.full_name || record.actor_detail?.email || t("auditLogs.systemActor")}
                        {record.target_type ? ` · ${translateTargetType(t, record.target_type)}` : ""}
                        {record.target_id ? ` · ${record.target_id}` : ""}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">{record.ip_address || t("common.empty")}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(record.created_at, { dateStyle: "medium", timeStyle: "short" }, i18n.language)}</p>
                    <Button variant="outline" size="sm" onClick={() => setSelected(record)}>
                      <Eye className="h-4 w-4" />{t("auditLogs.moreInfo")}
                    </Button>
                  </article>
                ))}
              </div>
              <AdminPagination page={page} count={logsQuery.data?.count || 0} pageSize={PAGE_SIZE} onPageChange={setPage} />
            </>
          )}
        </section>
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          {selected && <>
            <DialogHeader>
              <DialogTitle>{translateAuditAction(t, selected.action)}</DialogTitle>
              <DialogDescription>{t("auditLogs.detailsDescription")}</DialogDescription>
            </DialogHeader>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              {[
                [t("auditLogs.actor"), selected.actor_detail?.full_name || selected.actor_detail?.email || t("auditLogs.systemActor")],
                [t("auditLogs.actorEmail"), selected.actor_detail?.email || t("common.empty")],
                [t("auditLogs.result"), t(`auditLogs.results.${selected.result}`)],
                [t("auditLogs.createdAt"), formatDate(selected.created_at, { dateStyle: "full", timeStyle: "long" }, i18n.language)],
                [t("auditLogs.targetType"), selected.target_type ? translateTargetType(t, selected.target_type) : t("common.empty")],
                [t("auditLogs.targetId"), selected.target_id || t("common.empty")],
                [t("auditLogs.requestId"), selected.request_id || t("common.empty")],
                [t("auditLogs.ipAddress"), selected.ip_address || t("common.empty")],
              ].map(([label, value]) => <div key={label} className="rounded-xl border bg-muted/30 p-3"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 break-all font-medium">{value}</dd></div>)}
            </dl>
            <div>
              <h3 className="text-sm font-semibold">{t("auditLogs.metadata")}</h3>
              <pre className="mt-2 max-h-72 overflow-auto rounded-xl border bg-muted/40 p-4 text-xs leading-relaxed" dir="ltr">{JSON.stringify(selected.metadata, null, 2)}</pre>
            </div>
            <div>
              <h3 className="text-sm font-semibold">{t("auditLogs.userAgent")}</h3>
              <p className="mt-2 break-all rounded-xl border bg-muted/30 p-3 text-xs text-muted-foreground" dir="ltr">{selected.user_agent || t("common.empty")}</p>
            </div>
          </>}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminAuditLogsPage;
