import type { TFunction } from "i18next";

export const translateStatus = (t: TFunction, value?: string) => value ? t(`status.${value}`, { defaultValue: value }) : "";
export const translatePaymentMethod = (t: TFunction, value?: string) => value ? t(`payment.${value}`, { defaultValue: value }) : "";
export const translateNotificationType = (t: TFunction, value?: string) => value ? t(`notificationType.${value}`, { defaultValue: value }) : "";