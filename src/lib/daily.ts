import "server-only";
import { logger } from "@/lib/logger";

/**
 * Daily.co video rooms for teleconsultations.
 *
 * Each appointment gets one private room, named after the appointment, that
 * expires shortly after the slot ends. Nobody can enter a private room without
 * a meeting token, and tokens are only issued by /api/room/[id] to the
 * appointment's own doctor and patient inside the join window.
 *
 * Requires DAILY_API_KEY (Daily dashboard → Developers).
 */

const DAILY_API = "https://api.daily.co/v1";

/** Keep the room open briefly after the slot so an overrunning call is not cut mid-sentence. */
const GRACE_AFTER_END_MS = 15 * 60_000;

export function isDailyConfigured(): boolean {
  return !!process.env.DAILY_API_KEY?.trim();
}

async function dailyRequest<T>(path: string, init: RequestInit = {}): Promise<{ status: number; data: T }> {
  const res = await fetch(`${DAILY_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.DAILY_API_KEY?.trim()}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as T;
  return { status: res.status, data };
}

interface DailyRoom {
  name: string;
  url: string;
}

export function roomNameFor(appointmentId: string): string {
  // Daily room names allow letters, digits, "-" and "_".
  return `dfc-${appointmentId}`.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 128);
}

/** Get the appointment's room, creating it on first join. */
export async function ensureRoom(appointmentId: string, endsAt: Date): Promise<DailyRoom> {
  const name = roomNameFor(appointmentId);
  const exp = Math.floor((endsAt.getTime() + GRACE_AFTER_END_MS) / 1000);

  const existing = await dailyRequest<DailyRoom & { error?: string }>(`/rooms/${name}`);
  if (existing.status === 200 && existing.data.url) return existing.data;

  const created = await dailyRequest<DailyRoom & { error?: string; info?: string }>("/rooms", {
    method: "POST",
    body: JSON.stringify({
      name,
      privacy: "private",
      properties: {
        exp,
        eject_at_room_exp: true,
        max_participants: 2,
        enable_chat: false,
        enable_screenshare: true,
        // Recording stays off: it is opt-in on Daily and consultations are not recorded.
        start_video_off: false,
        start_audio_off: false,
      },
    }),
  });

  if (created.status === 200 && created.data.url) return created.data;

  // Two people joining at the same moment can both try to create it.
  const retry = await dailyRequest<DailyRoom>(`/rooms/${name}`);
  if (retry.status === 200 && retry.data.url) return retry.data;

  logger.error("DailyRoomCreate", created.data);
  throw new Error("Could not create the video room");
}

/** A meeting token that admits one participant to one room until the room closes. */
export async function createMeetingToken(opts: {
  roomName: string;
  userId: string;
  userName: string;
  isOwner: boolean;
  endsAt: Date;
}): Promise<string> {
  const exp = Math.floor((opts.endsAt.getTime() + GRACE_AFTER_END_MS) / 1000);
  const { status, data } = await dailyRequest<{ token?: string }>("/meeting-tokens", {
    method: "POST",
    body: JSON.stringify({
      properties: {
        room_name: opts.roomName,
        user_id: opts.userId,
        user_name: opts.userName,
        is_owner: opts.isOwner,
        exp,
        eject_at_token_exp: true,
      },
    }),
  });
  if (status !== 200 || !data.token) {
    logger.error("DailyTokenCreate", data);
    throw new Error("Could not create a meeting token");
  }
  return data.token;
}
