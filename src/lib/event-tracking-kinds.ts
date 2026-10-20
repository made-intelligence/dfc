// Shared by the tracking endpoint, the client tracker and the admin stats.
export const EVENT_INTERACTION_KINDS = ["BANNER_VIEW", "BANNER_CLICK", "PAGE_VIEW", "DETAIL_VIEW", "REGISTER_CLICK"] as const;

export type EventInteractionKind = (typeof EVENT_INTERACTION_KINDS)[number];

export type EventStats = Record<EventInteractionKind, number>;

export const emptyEventStats = (): EventStats => ({
  BANNER_VIEW: 0,
  BANNER_CLICK: 0,
  PAGE_VIEW: 0,
  DETAIL_VIEW: 0,
  REGISTER_CLICK: 0,
});
