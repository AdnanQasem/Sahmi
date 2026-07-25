import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { formatCurrency as formatLocaleCurrency, formatDate } from "@/i18n/format";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit3, HandCoins, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "../DashboardLayout";
import AdminDeleteDialog from "@/components/admin/AdminDeleteDialog";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminPagination from "@/components/admin/AdminPagination";
import AdminRepaymentDialog from "@/components/admin/AdminRepaymentDialog";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getErrorMessage } from "@/services/api";
import adminFinanceService, {
  type AdminRepayment,
  type AdminRepaymentPayload,
} from "@/services/adminFinanceService";

const PAGE_SIZE = 12;

const currency = (value: string | number) => formatLocaleCurrency(Number(value) || 0);

const date = (value: string) => formatDate(value + (value.length === 10 ? "T00:00:00" : ""), { dateStyle: "medium" });

const paymentLabel = (method: string) =>
  i18n.t(`payment.${method}`, { defaultValue: method });

const repaymentIdentity = (repayment: AdminRepayment) => {
  return {
    investor:
      repayment.investor_detail?.full_name ||
      repayment.investor_detail?.email ||
      i18n.t("admin.unknownInvestor"),
    project: repayment.project_detail?.title || i18n.t("admin.unknownProject"),
  };
};

const AdminRepaymentsPage = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [paymentMethod, setPaymentMethod] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminRepayment | null>(null);
  const [deleting, setDeleting] = useState<AdminRepayment | null>(null);

  const repaymentsQuery = useQuery({
    queryKey: ["admin", "repayments", page, search, status, paymentMethod],
    queryFn: () =>
      adminFinanceService.listRepayments({
        page,
        page_size: PAGE_SIZE,
        search: search.trim() || undefined,
        status: status === "all" ? undefined : status,
        payment_method: paymentMethod === "all" ? undefined : paymentMethod,
        ordering: "scheduled_date",
      }),
  });

  const investmentsQuery = useQuery({
    queryKey: ["admin", "investment-options"],
    queryFn: adminFinanceService.listInvestmentOptions,
    staleTime: 30_000,
  });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin", "repayments"] });
    void queryClient.invalidateQueries({ queryKey: ["admin", "investments"] });
  };

  const saveMutation = useMutation({
    mutationFn: ({
      repayment,
      payload,
    }: {
      repayment: AdminRepayment | null;
      payload: AdminRepaymentPayload;
    }) =>
      repayment
        ? adminFinanceService.updateRepayment(repayment.id, payload)
        : adminFinanceService.createRepayment(payload),
    onSuccess: (_, variables) => {
      toast.success(t(variables.repayment ? "admin.updated" : "admin.created", { item: t("admin.repaymentItem") }));
      setDialogOpen(false);
      setEditing(null);
      refresh();
    },
    onError: (error) => toast.error(getErrorMessage(error, t("admin.saveFailed", { item: t("admin.repaymentItem") }))),
  });

  const deleteMutation = useMutation({
    mutationFn: (repayment: AdminRepayment) =>
      adminFinanceService.deleteRepayment(repayment.id),
    onSuccess: () => {
      toast.success(t("admin.deleted", { item: t("admin.repaymentItem") }));
      setDeleting(null);
      if (records.length === 1 && page > 1) setPage((current) => current - 1);
      refresh();
    },
    onError: (error) => toast.error(getErrorMessage(error, t("admin.deleteFailed", { item: t("admin.repaymentItem") }))),
  });

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (repayment: AdminRepayment) => {
    setEditing(repayment);
    setDialogOpen(true);
  };

  const data = repaymentsQuery.data;
  const records = data?.results || [];

  return (
    <DashboardLayout roleBase="/dashboard/admin">
      <div className="space-y-8">
        <AdminPageHeader
          icon={HandCoins}
          title={t("admin.repaymentsTitle")}
          description={t("admin.repaymentsText")}
          actions={
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />{t("admin.newRepayment")}</Button>
          }
        />

        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex flex-col gap-4 border-b border-border p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-semibold text-foreground">{t("admin.allRepayments")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {data ? t("admin.repaymentRecords", { count: data.count }) : t("admin.loadingRepayments")}
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3 lg:w-[42rem]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  aria-label={t("admin.searchRepaymentsLabel")}
                  className="pl-9"
                  placeholder={t("admin.searchRepayments")}
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <Select
                value={status}
                onValueChange={(value) => {
                  setStatus(value);
                  setPage(1);
                }}
              >
                <SelectTrigger aria-label={t("admin.filterRepaymentStatus")}><SelectValue placeholder={t("admin.status")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("admin.allStatuses")}</SelectItem>
                  <SelectItem value="pending">{t("status.pending")}</SelectItem>
                  <SelectItem value="paid">{t("status.paid")}</SelectItem>
                  <SelectItem value="overdue">{t("status.overdue")}</SelectItem>
                  <SelectItem value="canceled">{t("status.canceled")}</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={paymentMethod}
                onValueChange={(value) => {
                  setPaymentMethod(value);
                  setPage(1);
                }}
              >
                <SelectTrigger aria-label={t("admin.filterRepaymentMethod")}><SelectValue placeholder={t("admin.payment")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("admin.allPaymentMethods")}</SelectItem>
                  <SelectItem value="bank_transfer">{t("payment.bank_transfer")}</SelectItem>
                  <SelectItem value="card">{t("payment.card")}</SelectItem>
                  <SelectItem value="paypal">{t("payment.paypal")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {repaymentsQuery.isPending ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : repaymentsQuery.isError ? (
            <div className="p-10 text-center">
              <p className="font-medium text-destructive">{t("admin.repaymentsLoadError")}</p>
              <Button className="mt-4" variant="outline" onClick={() => void repaymentsQuery.refetch()}>{t("admin.tryAgain")}</Button>
            </div>
          ) : records.length === 0 ? (
            <div className="p-12 text-center">
              <HandCoins className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <h3 className="mt-4 font-semibold text-foreground">{t("admin.noRepayments")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t("admin.adjustOrRepayment")}</p>
            </div>
          ) : (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("admin.investorProject")}</TableHead>
                      <TableHead>{t("common.amount")}</TableHead>
                      <TableHead>{t("common.status")}</TableHead>
                      <TableHead>{t("admin.scheduled")}</TableHead>
                      <TableHead>{t("admin.payment")}</TableHead>
                      <TableHead className="w-24 text-right">{t("admin.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((repayment) => {
                      const identity = repaymentIdentity(repayment);
                      return (
                        <TableRow key={repayment.id}>
                          <TableCell>
                            <p className="font-semibold text-foreground">{identity.investor}</p>
                            <p className="mt-0.5 max-w-64 truncate text-xs text-muted-foreground">
                              {identity.project}
                            </p>
                          </TableCell>
                          <TableCell className="font-semibold text-foreground">
                            {currency(repayment.amount)}
                          </TableCell>
                          <TableCell><StatusBadge status={repayment.status} /></TableCell>
                          <TableCell>
                            <p className="text-foreground">{date(repayment.scheduled_date)}</p>
                            {repayment.actual_payment_date ? (
                              <p className="text-xs text-muted-foreground">
                                Paid {date(repayment.actual_payment_date)}
                              </p>
                            ) : null}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {paymentLabel(repayment.payment_method)}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => openEdit(repayment)}>
                                <Edit3 className="h-4 w-4" />
                                <span className="sr-only">{t("admin.editRepayment")}</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setDeleting(repayment)}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">{t("admin.deleteRepayment")}</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="divide-y divide-border md:hidden">
                {records.map((repayment) => {
                  const identity = repaymentIdentity(repayment);
                  return (
                    <article key={repayment.id} className="space-y-4 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-foreground">{identity.investor}</p>
                          <p className="mt-1 truncate text-sm text-muted-foreground">{identity.project}</p>
                        </div>
                        <StatusBadge status={repayment.status} />
                      </div>
                      <div className="grid grid-cols-2 gap-3 rounded-xl bg-muted/40 p-3 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">{t("common.amount")}</p>
                          <p className="mt-1 font-semibold text-foreground">{currency(repayment.amount)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">{t("admin.scheduled")}</p>
                          <p className="mt-1 font-medium text-foreground">{date(repayment.scheduled_date)}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs text-muted-foreground">{paymentLabel(repayment.payment_method)}</p>
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm" onClick={() => openEdit(repayment)}>
                            <Edit3 className="h-4 w-4" />{t("common.edit")}</Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-destructive"
                            onClick={() => setDeleting(repayment)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">{t("admin.deleteRepayment")}</span>
                          </Button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
              <AdminPagination
                page={page}
                count={data?.count || 0}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
              />
            </>
          )}
        </section>
      </div>

      <AdminRepaymentDialog
        open={dialogOpen}
        repayment={editing}
        investments={investmentsQuery.data || []}
        pending={saveMutation.isPending}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
        onSubmit={(payload) => saveMutation.mutate({ repayment: editing, payload })}
      />

      <AdminDeleteDialog
        open={!!deleting}
        title={t("admin.deleteRepaymentQuestion")}
        description={t("admin.deleteRepaymentText")}
        pending={deleteMutation.isPending}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting)}
      />
    </DashboardLayout>
  );
};

export default AdminRepaymentsPage;
