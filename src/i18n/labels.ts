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
  return body;
};
