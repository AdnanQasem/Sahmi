import type { TFunction } from "i18next";

export const translateStatus = (t: TFunction, value?: string) => value ? t(`status.${value}`, { defaultValue: value }) : "";
export const translatePaymentMethod = (t: TFunction, value?: string) => value ? t(`payment.${value}`, { defaultValue: value }) : "";
export const translateNotificationType = (t: TFunction, value?: string) => value ? t(`notificationType.${value}`, { defaultValue: value }) : "";

export const translateSystemNotificationBody = (
  t: TFunction,
  type: string | undefined,
  body: string,
) => {
  if (!body) return "";
  if (type === "message_received") return t("notifications.body.messageReceived");
  if (type === "project_verified") {
    const title = body.match(/“(.+?)”/)?.[1];
    return t("notifications.body.projectVerified", { title: title ?? "" });
  }
  if (type === "project_rejected") {
    const title = body.match(/“(.+?)”/)?.[1];
    return t("notifications.body.projectRejected", { title: title ?? "" });
  }
  if (type === "project_submitted") {
    const title = body.match(/“(.+?)”/)?.[1];
    return t(body.includes("awaiting verification")
      ? "notifications.body.projectAwaitingVerification"
      : "notifications.body.projectSubmitted", { title: title ?? "" });
  }
  if (type === "investment_created") {
    const amount = body.match(/(?:of |\()([^()]+?)(?: has|\))/)?.[1]?.trim();
    const title = body.match(/“(.+?)”/)?.[1];
    return t(title ? "notifications.body.investmentReceived" : "notifications.body.investmentRecorded", {
      amount: amount ?? "",
      title: title ?? "",
    });
  }
  if (type === "investment_status_changed") {
    if (/^An investment of .+ on your project .+ has been confirmed\.$/i.test(body)) return body;
    const amount = body.match(/investment of ([^ ]+)/i)?.[1];
    const title = body.match(/“(.+?)”/)?.[1];
    if (body.toLowerCase().includes("cancelled")) return t("notifications.body.investmentCancelled");
    if (body.toLowerCase().includes("confirmed")) {
      return t(title ? "notifications.body.projectInvestmentConfirmed" : "notifications.body.investmentConfirmed", {
        amount: amount ?? "",
        title: title ?? "",
      });
    }
  }
  if (type === "milestone_updated") {
    const title = body.match(/“(.+?)”/)?.[1];
    return t("notifications.body.milestoneUpdated", { title: title ?? "" });
  }
  if (type === "repayment_updated") return t("notifications.body.repaymentUpdated");
  if (type === "withdrawal_updated") {
    const requested = body.match(/^(.+?) requested (\S+) for “(.+?)” on “(.+?)”\.$/i);
    if (requested) {
      return t("notifications.body.withdrawalRequested", {
        entrepreneur: requested[1],
        amount: requested[2],
        milestone: requested[3],
        project: requested[4],
      });
    }

    const updated = body.match(/^Your (\S+) withdrawal request for “(.+?)” is (.+?)\.$/i);
    if (updated) {
      const statusKey = updated[3].toLowerCase().replace(/\s+/g, "_");
      return t("notifications.body.withdrawalStatusUpdated", {
        amount: updated[1],
        milestone: updated[2],
        status: t(`status.${statusKey}`, { defaultValue: updated[3] }),
      });
    }
  }
  if (type === "project_completion_hold") {
    const hold = body.match(/^The required 3-day quality and handover hold for “(.+?)” ends at (.+)\.$/i);
    if (hold) {
      return t("notifications.body.projectQualityHoldStarted", {
        title: hold[1],
        end: hold[2],
      });
    }
    const completed = body.match(/^Project “(.+?)” completed after the required 3-day quality and handover hold\.$/i);
    if (completed) {
      return t("notifications.body.projectQualityHoldCompleted", { title: completed[1] });
    }
  }
  return body;
};
