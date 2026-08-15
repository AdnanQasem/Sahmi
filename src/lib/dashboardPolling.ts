export const dashboardPollingInterval = () => (
  typeof document !== "undefined" && document.hidden ? false : 30_000
);

export const dashboardPollingOptions = {
  refetchInterval: dashboardPollingInterval,
  refetchIntervalInBackground: false,
} as const;
