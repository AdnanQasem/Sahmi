import { useTranslation } from "react-i18next";
import type { ElementType, ReactNode } from "react";
import i18n from "@/i18n";
import { formatCurrency, formatDate, formatNumber, formatPercent } from "@/i18n/format";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { Investment } from "@/services/investmentsService";
import {
  ArrowRight,
  Banknote,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  FileText,
  Hash,
  MapPin,
  Package,
  ReceiptText,
  TrendingUp,
  UserRound,
} from "lucide-react";

interface TransactionDetailsDialogProps {
  investment: Investment | null;
  onOpenChange: (open: boolean) => void;
}

export const currency = (value: number | string | null | undefined) => formatCurrency(Number(value || 0));


export const amountOf = (investment: Investment) => Number(investment.amount || 0);
export const expectedOf = (investment: Investment) => Number(investment.expected_return || 0);
export const actualOf = (investment: Investment) => Number(investment.actual_return || 0);

export const formatDateTime = (value: string | null | undefined) => value
  ? formatDate(value, { dateStyle: "medium", timeStyle: "short" })
  : i18n.t("common.empty");

export const formatPaymentMethod = (value: Investment["payment_method"]) =>
  i18n.t(`payment.${value}`, { defaultValue: value });
export const getProjectTitle = (investment: Investment) => investment.project_detail?.title ?? investment.project;

const DetailItem = ({
  icon: Icon,
  label,
  value,
}: {
  icon: ElementType;
  label: string;
  value: ReactNode;
}) => (
  <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/30 p-3">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background text-primary">
      <Icon className="h-4 w-4" />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-1 break-words text-sm font-semibold text-foreground">{value}</div>
    </div>
  </div>
);

const TransactionDetailsDialog = ({ investment, onOpenChange }: TransactionDetailsDialogProps) => {
  const { t } = useTranslation();
  const project = investment?.project_detail;
  const projectHref = project?.slug ? `/projects/${project.slug}` : undefined;

  return (
    <Dialog open={!!investment} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        {investment && (
          <>
            <DialogHeader>
              <DialogTitle className="pe-8 text-xl">{t("transactionDetails.title")}</DialogTitle>
              <DialogDescription>
                {t("transactionDetails.paidOn", { project: getProjectTitle(investment), date: formatDateTime(investment.investment_date) })}
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-xl border border-primary/15 bg-primary/5 p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="border-primary/30 bg-background text-primary">
                      {project?.category_detail?.name ?? t("transactionDetails.project")}
                    </Badge>
                    <StatusBadge status={investment.status} />
                  </div>
                  <h3 className="break-words text-lg font-bold text-foreground">{getProjectTitle(investment)}</h3>
                  {project?.short_description && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{project.short_description}</p>
                  )}
                </div>
                <div className="shrink-0 text-start sm:text-end">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("transactionDetails.amountPaid")}</p>
                  <p className="text-2xl font-bold text-foreground">{currency(amountOf(investment))}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <DetailItem icon={CalendarClock} label={t("transactionDetails.dateTime")} value={formatDateTime(investment.investment_date)} />
              <DetailItem icon={CreditCard} label={t("transactionDetails.paymentMethod")} value={formatPaymentMethod(investment.payment_method)} />
              <DetailItem icon={Hash} label={t("transactionDetails.transactionId")} value={investment.transaction_id ? <bdi dir="ltr">{investment.transaction_id}</bdi> : t("transactionDetails.notProvided")} />
              <DetailItem icon={Package} label={t("transactionDetails.units")} value={formatNumber(investment.quantity)} />
              <DetailItem icon={TrendingUp} label={t("transactionDetails.expectedReturn")} value={currency(expectedOf(investment))} />
              <DetailItem icon={Banknote} label={t("transactionDetails.actualReturn")} value={currency(actualOf(investment))} />
              <DetailItem
                icon={CheckCircle2}
                label={t("transactionDetails.returnReceived")}
                value={investment.return_received_at ? formatDateTime(investment.return_received_at) : t("transactionDetails.notReceived")}
              />
              <DetailItem icon={UserRound} label={t("transactionDetails.investor")} value={investment.investor || t("transactionDetails.currentInvestor")} />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <DetailItem icon={Briefcase} label={t("transactionDetails.projectStatus")} value={project?.status ? <StatusBadge status={project.status} /> : t("transactionDetails.notAvailable")} />
              <DetailItem icon={MapPin} label={t("transactionDetails.projectLocation")} value={project?.location || project?.location_governorate || t("transactionDetails.notAvailable")} />
              <DetailItem icon={ReceiptText} label={t("transactionDetails.projectRoi")} value={project?.expected_roi ? formatPercent(Number(project.expected_roi)) : t("transactionDetails.notAvailable")} />
              <DetailItem icon={Banknote} label={t("transactionDetails.projectGoal")} value={project?.goal_amount ? currency(project.goal_amount) : t("transactionDetails.notAvailable")} />
            </div>

            <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                <FileText className="h-4 w-4 text-primary" />
                {t("transactionDetails.notes")}
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {investment.notes || t("transactionDetails.noNotes")}
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              {projectHref && (
                <Button variant="outline" asChild>
                  <Link to={projectHref}>
                    {t("transactionDetails.viewProject")} <ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180" />
                  </Link>
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TransactionDetailsDialog;
