import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { formatCurrency as formatLocaleCurrency, formatDate } from "@/i18n/format";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleDollarSign, Edit3, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "../DashboardLayout";
import AdminDeleteDialog from "@/components/admin/AdminDeleteDialog";
import AdminInvestmentDialog from "@/components/admin/AdminInvestmentDialog";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminPagination from "@/components/admin/AdminPagination";
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
  type AdminInvestment,
  type AdminInvestmentPayload,
} from "@/services/adminFinanceService";

const PAGE_SIZE = 12;

const currency = (value: string | number) => formatLocaleCurrency(Number(value) || 0);

const dateTime = (value: string) => formatDate(value, { dateStyle: "medium", timeStyle: "short" });

const paymentLabel = (method: string) =>
  i18n.t(`payment.${method}`, { defaultValue: method });

const investorName = (investment: AdminInvestment) =>
  investment.investor_detail?.full_name ||
  investment.investor_detail?.email ||
  investment.investor_name ||
  i18n.t("admin.unknownInvestor");

const projectName = (investment: AdminInvestment) =>
  investment.project_detail?.title || i18n.t("admin.unknownProject");

const AdminInvestmentsPage = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [paymentMethod, setPaymentMethod] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminInvestment | null>(null);
  const [deleting, setDeleting] = useState<AdminInvestment | null>(null);

  const investmentsQuery = useQuery({
    queryKey: ["admin", "investments", page, search, status, paymentMethod],
    queryFn: () =>
      adminFinanceService.listInvestments({
        page,
        page_size: PAGE_SIZE,
        search: search.trim() || undefined,
        status: status === "all" ? undefined : status,
        payment_method: paymentMethod === "all" ? undefined : paymentMethod,
        ordering: "-investment_date",
      }),
  });

  const usersQuery = useQuery({
    queryKey: ["admin", "user-options"],
    queryFn: adminFinanceService.listUserOptions,
    staleTime: 60_000,
  });

  const projectsQuery = useQuery({
    queryKey: ["admin", "project-options"],
    queryFn: adminFinanceService.listProjectOptions,
    staleTime: 60_000,
  });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin", "investments"] });
    void queryClient.invalidateQueries({ queryKey: ["admin", "repayments"] });
  };

  const saveMutation = useMutation({
    mutationFn: ({
      investment,
      payload,
    }: {
      investment: AdminInvestment | null;
      payload: AdminInvestmentPayload;
    }) =>
      investment
        ? adminFinanceService.updateInvestment(investment.id, payload)
        : adminFinanceService.createInvestment(payload),
    onSuccess: (_, variables) => {
      toast.success(t(variables.investment ? "admin.updated" : "admin.created", { item: t("admin.investmentItem") }));
      setDialogOpen(false);
      setEditing(null);
      refresh();
    },
    onError: (error) => toast.error(getErrorMessage(error, t("admin.saveFailed", { item: t("admin.investmentItem") }))),
  });

  const deleteMutation = useMutation({
    mutationFn: (investment: AdminInvestment) =>
      adminFinanceService.deleteInvestment(investment.id),
    onSuccess: (_, investment) => {
      toast.success(t("admin.investmentDeleted", { investor: investorName(investment) }));
      setDeleting(null);
      if (records.length === 1 && page > 1) setPage((current) => current - 1);
      refresh();
    },
    onError: (error) => toast.error(getErrorMessage(error, t("admin.deleteFailed", { item: t("admin.investmentItem") }))),
  });

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (investment: AdminInvestment) => {
    setEditing(investment);
    setDialogOpen(true);
  };

  const data = investmentsQuery.data;
  const records = data?.results || [];

  return (
    <DashboardLayout roleBase="/dashboard/admin">
      <div className="space-y-8">
        <AdminPageHeader
          icon={CircleDollarSign}
          title={t("admin.ledgerTitle")}
          description={t("admin.ledgerText")}
          actions={
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />{t("admin.newInvestment")}</Button>
          }
        />

        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex flex-col gap-4 border-b border-border p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-semibold text-foreground">{t("admin.allInvestments")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {data ? t("admin.financialRecords", { count: data.count }) : t("admin.loadingLedger")}
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3 lg:w-[42rem]">
              <div className="relative sm:col-span-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  aria-label={t("admin.searchInvestmentsLabel")}
                  className="pl-9"
                  placeholder={t("admin.searchInvestments")}
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
                <SelectTrigger aria-label={t("admin.filterInvestmentStatus")}><SelectValue placeholder={t("admin.status")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("admin.allStatuses")}</SelectItem>
                  <SelectItem value="pending">{t("status.pending")}</SelectItem>
                  <SelectItem value="confirmed">{t("status.confirmed")}</SelectItem>
                  <SelectItem value="completed">{t("status.completed")}</SelectItem>
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
                <SelectTrigger aria-label={t("admin.filterInvestmentMethod")}><SelectValue placeholder={t("admin.payment")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("admin.allPaymentMethods")}</SelectItem>
                  <SelectItem value="bank_transfer">{t("payment.bank_transfer")}</SelectItem>
                  <SelectItem value="card">{t("payment.card")}</SelectItem>
                  <SelectItem value="paypal">{t("payment.paypal")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {investmentsQuery.isPending ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : investmentsQuery.isError ? (
            <div className="p-10 text-center">
              <p className="font-medium text-destructive">{t("admin.ledgerLoadError")}</p>
              <Button className="mt-4" variant="outline" onClick={() => void investmentsQuery.refetch()}>{t("admin.tryAgain")}</Button>
            </div>
          ) : records.length === 0 ? (
            <div className="p-12 text-center">
              <CircleDollarSign className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <h3 className="mt-4 font-semibold text-foreground">{t("admin.noInvestments")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t("admin.adjustOrCreate")}</p>
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
                      <TableHead>{t("admin.payment")}</TableHead>
                      <TableHead>{t("common.date")}</TableHead>
                      <TableHead className="w-24 text-right">{t("admin.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((investment) => (
                      <TableRow key={investment.id}>
                        <TableCell>
                          <p className="font-semibold text-foreground">{investorName(investment)}</p>
                          <p className="mt-0.5 max-w-64 truncate text-xs text-muted-foreground">
                            {projectName(investment)}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p className="font-semibold text-foreground">{currency(investment.amount)}</p>
                          <p className="text-xs text-muted-foreground">Qty {investment.quantity}</p>
                        </TableCell>
                        <TableCell><StatusBadge status={investment.status} /></TableCell>
                        <TableCell className="text-muted-foreground">
                          {paymentLabel(investment.payment_method)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {dateTime(investment.investment_date)}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(investment)}>
                              <Edit3 className="h-4 w-4" />
                              <span className="sr-only">{t("admin.editInvestment")}</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeleting(investment)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">{t("admin.deleteInvestment")}</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="divide-y divide-border md:hidden">
                {records.map((investment) => (
                  <article key={investment.id} className="space-y-4 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">{investorName(investment)}</p>
                        <p className="mt-1 truncate text-sm text-muted-foreground">{projectName(investment)}</p>
                      </div>
                      <StatusBadge status={investment.status} />
                    </div>
                    <div className="grid grid-cols-2 gap-3 rounded-xl bg-muted/40 p-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">{t("common.amount")}</p>
                        <p className="mt-1 font-semibold text-foreground">{currency(investment.amount)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t("admin.payment")}</p>
                        <p className="mt-1 font-medium text-foreground">{paymentLabel(investment.payment_method)}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs text-muted-foreground">{dateTime(investment.investment_date)}</p>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" onClick={() => openEdit(investment)}>
                          <Edit3 className="h-4 w-4" />{t("common.edit")}</Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-destructive"
                          onClick={() => setDeleting(investment)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">{t("admin.deleteInvestment")}</span>
                        </Button>
                      </div>
                    </div>
                  </article>
                ))}
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

      <AdminInvestmentDialog
        open={dialogOpen}
        investment={editing}
        users={usersQuery.data || []}
        projects={projectsQuery.data || []}
        pending={saveMutation.isPending}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
        onSubmit={(payload) => saveMutation.mutate({ investment: editing, payload })}
      />

      <AdminDeleteDialog
        open={!!deleting}
        title={t("admin.deleteInvestmentQuestion")}
        description={t("admin.deleteInvestmentText")}
        pending={deleteMutation.isPending}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting)}
      />
    </DashboardLayout>
  );
};

export default AdminInvestmentsPage;
