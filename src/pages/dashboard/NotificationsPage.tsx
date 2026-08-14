import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import DashboardLayout from "./DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import notificationService from "@/services/notificationService";
import { useAuth } from "@/hooks/useAuth";
import { formatDate } from "@/i18n/format";
import { translateNotificationType, translateSystemNotificationBody } from "@/i18n/labels";

type ReadFilter = "all" | "unread" | "read";

const NotificationsPage = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const role = user?.is_staff ? "admin" : user?.user_type || "investor";
  const roleBase = `/dashboard/${role}`;
  const [page, setPage] = useState(1);
  const [readFilter, setReadFilter] = useState<ReadFilter>("all");
  const [type, setType] = useState("all");
  const params = {
    page,
    ...(readFilter === "all" ? {} : { read: readFilter === "read" }),
    ...(type === "all" ? {} : { type }),
  };
  const notifications = useQuery({ queryKey: ["notifications", "history", params], queryFn: () => notificationService.list(params) });
  const refresh = () => {
    void notifications.refetch();
    void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    void queryClient.invalidateQueries({ queryKey: ["notification-unread"] });
  };
  useEffect(() => notificationService.subscribe(refresh), []); // eslint-disable-line react-hooks/exhaustive-deps
  const markRead = useMutation({ mutationFn: notificationService.markRead, onSuccess: refresh });
  const markAll = useMutation({ mutationFn: notificationService.markAllRead, onSuccess: refresh });
  const records = notifications.data?.results ?? [];

  return (
    <DashboardLayout roleBase={roleBase}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-sm font-semibold text-primary">{t("notifications.activityCenter")}</p><h1 className="mt-1 text-3xl font-bold text-foreground">{t("notifications.title")}</h1><p className="mt-2 text-muted-foreground">{t("notifications.historyText")}</p></div>
          <div className="flex gap-2"><Button variant="outline" onClick={refresh}><RefreshCw className={`h-4 w-4 ${notifications.isFetching ? "animate-spin" : ""}`} />{t("admin.refresh")}</Button><Button onClick={() => markAll.mutate()} disabled={markAll.isPending}><CheckCheck className="h-4 w-4" />{t("notifications.markAll")}</Button></div>
        </div>
        <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2">
          <select aria-label={t("notifications.filterReadState")} value={readFilter} onChange={(event) => { setReadFilter(event.target.value as ReadFilter); setPage(1); }} className="rounded-lg border border-input bg-background px-3 py-2 text-sm"><option value="all">{t("notifications.allStates")}</option><option value="unread">{t("notifications.unread")}</option><option value="read">{t("notifications.read")}</option></select>
          <select aria-label={t("notifications.filterType")} value={type} onChange={(event) => { setType(event.target.value); setPage(1); }} className="rounded-lg border border-input bg-background px-3 py-2 text-sm"><option value="all">{t("notifications.allTypes")}</option>{["message_received","project_submitted","project_verified","project_rejected","investment_created","investment_status_changed","milestone_updated","repayment_updated","system"].map((value) => <option key={value} value={value}>{t(`notificationType.${value}`)}</option>)}</select>
        </div>
        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          {notifications.isPending ? <div className="p-12 text-center text-muted-foreground">{t("notifications.loading")}</div>
          : notifications.isError ? <div className="p-12 text-center"><p className="font-medium text-destructive">{t("notifications.loadError")}</p><Button className="mt-4" variant="outline" onClick={refresh}>{t("admin.tryAgain")}</Button></div>
          : !records.length ? <div className="p-12 text-center"><Bell className="mx-auto h-10 w-10 text-muted-foreground" /><p className="mt-3 font-medium text-foreground">{t("notifications.empty")}</p><p className="mt-1 text-sm text-muted-foreground">{t("notifications.emptyText")}</p></div>
          : <div className="divide-y divide-border">{records.map((notification) => <button key={notification.id} type="button" onClick={() => { if (!notification.read_at) markRead.mutate(notification.id); navigate(notification.target_url || roleBase); }} className="flex w-full gap-4 p-5 text-start transition-colors hover:bg-muted/40"><div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Bell className="h-5 w-5" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold text-foreground">{notification.title === "Investment confirmed" ? notification.title : translateNotificationType(t, notification.notification_type)}</h2>{!notification.read_at && <Badge variant="default">{t("notifications.unread")}</Badge>}</div><p className="mt-1 text-sm text-muted-foreground">{translateSystemNotificationBody(t, notification.notification_type, notification.body)}</p><p className="mt-2 text-xs text-muted-foreground">{formatDate(notification.created_at, { dateStyle: "medium", timeStyle: "short" }, i18n.resolvedLanguage?.startsWith("ar") ? "ar" : "en")}</p></div></button>)}</div>}
        </section>
        <div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">{t("notifications.total", { count: notifications.data?.count ?? 0 })}</p><div className="flex gap-2"><Button variant="outline" size="icon" aria-label={t("common.previous")} disabled={!notifications.data?.previous} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft className="h-4 w-4 rtl-flip" /></Button><Button variant="outline" size="icon" aria-label={t("common.next")} disabled={!notifications.data?.next} onClick={() => setPage((value) => value + 1)}><ChevronRight className="h-4 w-4 rtl-flip" /></Button></div></div>
      </div>
    </DashboardLayout>
  );
};

export default NotificationsPage;
