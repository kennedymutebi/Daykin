// src/services/subscriptions.service.ts
import apiClient, { ApiError } from "./api.service";

export interface SubscriptionAuthor {
  id: number;
  name: string;
  initials: string;
  avatarUrl?: string;
}

export interface Subscription {
  id: number;
  author: SubscriptionAuthor;
  createdAt: string;
}

// NOTE: SubscriptionSerializer's exact JSON shape wasn't visible from the
// frontend side, so this mapper tolerates a couple of common shapes:
// a nested `author: {...}` object, or flat `author_id` / `author_name`
// fields. If your serializer's fields differ, adjust the lookups below —
// share serializers.py and I'll tighten this up.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSubscription(raw: any): Subscription {
  const author = raw.author && typeof raw.author === "object" ? raw.author : raw;
  const first = author.first_name ?? "";
  const last  = author.last_name ?? "";
  const name  = `${first} ${last}`.trim() || author.username || author.name || "Writer";

  return {
    id: raw.id,
    author: {
      id: Number(author.id ?? raw.author_id ?? raw.author),
      name,
      initials: name.slice(0, 2).toUpperCase(),
      avatarUrl: author.avatar ?? author.avatar_url ?? undefined,
    },
    createdAt: raw.created_at ?? raw.createdAt ?? "",
  };
}

/** GET /my-subscriptions/ — writers the current user follows */
export async function getMySubscriptions(): Promise<Subscription[]> {
  const data = await apiClient.get<unknown[]>("/my-subscriptions/");
  return (data ?? []).map(mapSubscription);
}

/**
 * POST /subscribe/<author_id>/
 * Backend returns 201 if newly created, or 200 { detail: "Already subscribed." }
 * if it already existed — both are a successful "you are now subscribed" state,
 * so this resolves without throwing in either case.
 */
export async function subscribeToAuthor(authorId: number): Promise<void> {
  await apiClient.post(`/subscribe/${authorId}/`);
}

/**
 * DELETE /subscribe/<author_id>/
 * Backend returns 204 on success, or 404 { detail: "Not subscribed." } if it
 * was already gone — both mean "you are now unsubscribed", so a 404 here is
 * swallowed rather than surfaced as an error.
 */
export async function unsubscribeFromAuthor(authorId: number): Promise<void> {
  try {
    await apiClient.delete(`/subscribe/${authorId}/`);
  } catch (err: unknown) {
    if (!(err instanceof ApiError) || err.status !== 404) {
      throw err;
    }
  }
}