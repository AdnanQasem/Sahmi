import { Calculator, Info, Landmark, TrendingUp, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatCurrency, formatPercent } from "@/i18n/format";
import {
  calculateInvestorProfit,
  calculateInvestorRepayment,
  calculatePlatformFee,
  calculateTotalRepaymentObligation,
  SAHMI_PLATFORM_FEE_PERCENT,
} from "@/lib/platformFee";

interface Props {
  goalAmount: string | number;
  expectedRoi: string | number;
}

const PlatformFeeDisclosure = ({ goalAmount, expectedRoi }: Props) => {
  const { t } = useTranslation();
  const principal = Math.max(Number(goalAmount) || 0, 0);
  const roiNum = Math.max(Number(expectedRoi) || 0, 0);
  const profit = calculateInvestorProfit(principal, roiNum);
  const fee = calculatePlatformFee(principal);
  const investors = calculateInvestorRepayment(principal, roiNum);
  const total = calculateTotalRepaymentObligation(principal, roiNum);

  return (
    <aside
      className="overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-b from-primary/5 via-card to-card shadow-sm transition-all"
      aria-label={t("projects.platformFee.title", { percent: SAHMI_PLATFORM_FEE_PERCENT })}
    >
      {/* Header */}
      <div className="border-b border-border/60 p-4 sm:p-5">
        <div className="flex items-start gap-3.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-inner">
            <Landmark className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-foreground">
                {t("projects.platformFee.title", { percent: SAHMI_PLATFORM_FEE_PERCENT })}
              </h3>
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                {SAHMI_PLATFORM_FEE_PERCENT}% Fee
              </span>
            </div>
            <p className="mt-1 text-xs sm:text-sm leading-relaxed text-muted-foreground">
              {t("projects.platformFee.explanation", { percent: SAHMI_PLATFORM_FEE_PERCENT })}
            </p>
          </div>
        </div>
      </div>

      {/* Financial Breakdown Table / Ledger */}
      <div className="space-y-3 p-4 sm:p-5">
        {/* Step 1: Investors Return Breakdown */}
        <div className="rounded-xl border border-border/70 bg-background/80 p-3.5 sm:p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Users className="h-3.5 w-3.5 text-primary" />
            <span>{t("projects.platformFee.investorRepayment")}</span>
          </div>

          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>{t("projects.platformFee.fundingGoal")}</span>
              <span className="font-medium text-foreground">{formatCurrency(principal)}</span>
            </div>

            <div className="flex items-center justify-between text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                <span>
                  {t("projects.platformFee.expectedProfit", { roi: roiNum, defaultValue: `Expected investor profit (${roiNum}%)` })}
                </span>
              </span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                <span className="text-emerald-500/70 font-normal me-1">+</span>
                {formatCurrency(profit)}
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-border/50 pt-2 font-medium">
              <div>
                <span className="text-foreground">{t("projects.platformFee.investorRepayment")}</span>
                <p className="text-[11px] text-muted-foreground">
                  {t("projects.platformFee.investorRepaymentSub", { defaultValue: "Principal + expected profit" })}
                </p>
              </div>
              <span className="text-base font-semibold text-foreground">
                {formatCurrency(investors)}
              </span>
            </div>
          </div>
        </div>

        {/* Step 2: Sahmi Platform Fee */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 sm:p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Calculator className="h-4 w-4 text-primary" />
                <span>{t("projects.platformFee.sahmiFee", { percent: SAHMI_PLATFORM_FEE_PERCENT })}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {t("projects.platformFee.sahmiFeeHelp", { defaultValue: "Fixed 3% platform fee, paid separately" })}
              </p>
            </div>
            <span className="text-base font-bold text-primary">
              <span className="font-normal opacity-70 me-1">+</span>
              {formatCurrency(fee)}
            </span>
          </div>
        </div>

        {/* Step 3: Total Obligation Summary */}
        <div className="rounded-xl border border-border bg-foreground p-4 text-background dark:border-primary/30 dark:bg-primary/10 dark:text-foreground">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider opacity-80 dark:text-primary">
                {t("projects.platformFee.totalRepayment")}
              </p>
              <p className="mt-0.5 text-xs opacity-75 dark:text-muted-foreground">
                {t("projects.platformFee.totalRepaymentFormula", {
                  investors: formatCurrency(investors),
                  fee: formatCurrency(fee),
                  defaultValue: `${formatCurrency(investors)} (Investors) + ${formatCurrency(fee)} (Sahmi Fee)`,
                })}
              </p>
            </div>
            <p className="text-xl sm:text-2xl font-black tracking-tight text-background dark:text-foreground">
              {formatCurrency(total)}
            </p>
          </div>
        </div>
      </div>

      {/* Footnote */}
      <div className="border-t border-border/60 bg-muted/30 px-4 py-3 sm:px-5">
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <p className="leading-normal">{t("projects.platformFee.notDeducted")}</p>
        </div>
      </div>
    </aside>
  );
};

export default PlatformFeeDisclosure;
