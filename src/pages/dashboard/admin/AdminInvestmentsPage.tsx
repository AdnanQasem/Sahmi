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

const currency = (value: string | number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const dateTime = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const paymentLabel = (method: string) =>
  ({ bank_transfer: "Bank transfer", card: "Card", paypal: "PayPal" })[method] || method;

const investorName = (investment: AdminInvestment) =>
  investment.investor_detail?.full_name ||
  investment.investor_detail?.email ||
  investment.investor_name ||
  "Unknown investor";

const projectName = (investment: AdminInvestment) =>
  investment.project_detail?.title || "Unknown project";

const AdminInvestmentsPage = () => {
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
      toast.success(variables.investment ? "Investment updated." : "Investment created.");
      setDialogOpen(false);
      setEditing(null);
      refresh();
    },
    onError: (error) => toast.error(getErrorMessage(error, "Could not save this investment.")),
  });

  const deleteMutation = useMutation({
    mutationFn: (investment: AdminInvestment) =>
      adminFinanceService.deleteInvestment(investment.id),
    onSuccess: (_, investment) => {
      toast.success("Investment for " + investorName(investment) + " was deleted.");
      setDeleting(null);
      if (records.length === 1 && page > 1) setPage((current) => current - 1);
      refresh();
    },
    onError: (error) => toast.error(getErrorMessage(error, "Could not delete this investment.")),
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
          title="Investment ledger"
          description="Create, correct, and remove investment records with the same authority as the backend administration."
          actions={
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              New investment
            </Button>
          }
        />

        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex flex-col gap-4 border-b border-border p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-semibold text-foreground">All investments</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {data ? data.count.toLocaleString() + " financial records" : "Loading ledger..."}
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3 lg:w-[42rem]">
              <div className="relative sm:col-span-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  aria-label="Search investments"
                  className="pl-9"
                  placeholder="Investor or project"
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
                <SelectTrigger aria-label="Filter investments by status"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
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
                <SelectTrigger aria-label="Filter investments by payment method"><SelectValue placeholder="Payment" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All payment methods</SelectItem>
                  <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
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
              <p className="font-medium text-destructive">The investment ledger could not be loaded.</p>
              <Button className="mt-4" variant="outline" onClick={() => void investmentsQuery.refetch()}>
                Try again
              </Button>
            </div>
          ) : records.length === 0 ? (
            <div className="p-12 text-center">
              <CircleDollarSign className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <h3 className="mt-4 font-semibold text-foreground">No investments found</h3>
              <p className="mt-1 text-sm text-muted-foreground">Adjust the filters or create the first record.</p>
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
                      <TableHead>Payment</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="w-24 text-right">Actions</TableHead>
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
                              <span className="sr-only">Edit investment</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeleting(investment)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete investment</span>
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
                        <p className="text-xs text-muted-foreground">Amount</p>
                        <p className="mt-1 font-semibold text-foreground">{currency(investment.amount)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Payment</p>
                        <p className="mt-1 font-medium text-foreground">{paymentLabel(investment.payment_method)}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs text-muted-foreground">{dateTime(investment.investment_date)}</p>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" onClick={() => openEdit(investment)}>
                          <Edit3 className="h-4 w-4" /> Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-destructive"
                          onClick={() => setDeleting(investment)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete investment</span>
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
        title="Delete this investment?"
        description="This permanently removes the investment and any repayments attached to it. This cannot be undone."
        pending={deleteMutation.isPending}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting)}
      />
    </DashboardLayout>
  );
};

export default AdminInvestmentsPage;
