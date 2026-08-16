import type { Project, ProjectFundingAccount } from "@/services/projectsService";

type FundingProject = Pick<
  Project,
  "status" | "funded_amount" | "funding_finalized_at" | "funding_account"
>;

export interface FundingSummary {
  totalFunding: number;
  available: number;
  released: number;
  refunded: number;
}

const amount = (value: string | number | null | undefined) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(parsed, 0) : 0;
};

const hasSecuredFunding = (project: FundingProject) =>
  Boolean(project.funding_finalized_at)
  || project.status === "implementation"
  || project.status === "completed";

export const calculateFundingSummary = (projects: FundingProject[]): FundingSummary => {
  const finalized = projects.filter(hasSecuredFunding);
  const totalFunding = finalized.reduce(
    (total, project) => total + amount(project.funded_amount),
    0,
  );
  const released = finalized.reduce(
    (total, project) => total + amount(project.funding_account?.released),
    0,
  );
  const refunded = finalized.reduce(
    (total, project) => total + amount(project.funding_account?.refunded),
    0,
  );

  return {
    totalFunding,
    released,
    refunded,
    available: Math.max(totalFunding - released - refunded, 0),
  };
};

export const fundingAccountTotal = (account: ProjectFundingAccount) =>
  amount(account.secured) + amount(account.released) + amount(account.refunded);
