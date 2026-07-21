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

const currency = (value: string | number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const date = (value: string) =>
  new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
    new Date(value + (value.length === 10 ? "T00:00:00" : "")),
  );

const paymentLabel = (method: string) =>
  ({ bank_transfer: "Bank transfer", card: "Card", paypal: "PayPal" })[method] || method;

const repaymentIdentity = (repayment: AdminRepayment) => {
  return {
    investor:
      repayment.investor_detail?.full_name ||
      repayment.investor_detail?.email ||
      "Unknown investor",
    project: repayment.project_detail?.title || "Unknown project",
  };
};

const AdminRepaymentsPage = () => {
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
      toast.success(variables.repayment ? "Repayment updated." : "Repayment created.");
      setDialogOpen(false);
      setEditing(null);
      refresh();
    },
    onError: (error) => toast.error(getErrorMessage(error, "Could not save this repayment.")),
  });

  const deleteMutation = useMutation({
    mutationFn: (repayment: AdminRepayment) =>
      adminFinanceService.deleteRepayment(repayment.id),
    onSuccess: () => {
      toast.success("Repayment deleted.");
      setDeleting(null);
      if (records.length === 1 && page > 1) setPage((current) => current - 1);
      refresh();
    },
    onError: (error) => toast.error(getErrorMessage(error, "Could not delete this repayment.")),
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
          title="Repayment schedule"
          description="Schedule, mark paid, correct, or remove every investor repayment from the custom administration workspace."
          actions={
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              New repayment
            </Button>
          }
        />

        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex flex-col gap-4 border-b border-border p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-semibold text-foreground">All repayments</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {data ? data.count.toLocaleString() + " scheduled returns" : "Loading schedule..."}
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3 lg:w-[42rem]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  aria-label="Search repayments"
                  className="pl-9"
                  placeholder="Investor or transaction"
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
                <SelectTrigger aria-label="Filter repayments by status"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={paymentMethod}
                onValueChange={(value) => {
                  setPaymentMethod(value);
                  setPage(1);
                }}
              >
                <SelectTrigger aria-label="Filter repayments by payment method"><SelectValue placeholder="Payment" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All payment methods</SelectItem>
                  <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
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
              <p className="font-medium text-destructive">Repayments could not be loaded.</p>
              <Button className="mt-4" variant="outline" onClick={() => void repaymentsQuery.refetch()}>
                Try again
              </Button>
            </div>
          ) : records.length === 0 ? (
            <div className="p-12 text-center">
              <HandCoins className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <h3 className="mt-4 font-semibold text-foreground">No repayments found</h3>
              <p className="mt-1 text-sm text-muted-foreground">Adjust the filters or schedule a return.</p>
            </div>
          ) : (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Investor / project</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Scheduled</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead className="w-24 text-right">Actions</TableHead>
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
                                <span className="sr-only">Edit repayment</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setDeleting(repayment)}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete repayment</span>
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
                          <p className="text-xs text-muted-foreground">Amount</p>
                          <p className="mt-1 font-semibold text-foreground">{currency(repayment.amount)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Scheduled</p>
                          <p className="mt-1 font-medium text-foreground">{date(repayment.scheduled_date)}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs text-muted-foreground">{paymentLabel(repayment.payment_method)}</p>
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm" onClick={() => openEdit(repayment)}>
                            <Edit3 className="h-4 w-4" /> Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-destructive"
                            onClick={() => setDeleting(repayment)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete repayment</span>
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
        title="Delete this repayment?"
        description="This permanently removes the scheduled or completed payment record. This cannot be undone."
        pending={deleteMutation.isPending}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting)}
      />
    </DashboardLayout>
  );
};

export default AdminRepaymentsPage;
