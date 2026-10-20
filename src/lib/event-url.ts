// Public event URLs: /events/<slug>. The slug is generated from the title when
// the event is created and then kept fixed, so editing a title never breaks
// shared links or search rankings.

export function slugify(text: string): string {
  return (
    text
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80)
      .replace(/-+$/, "") || "event"
  );
}

export function eventPath(event: { slug: string }): string {
  return `/events/${event.slug}`;
}

/**
 * Event URLs briefly ended in "-<cuid>" before slugs were stored. Returns that
 * trailing id so those links can redirect to the new address.
 */
export function legacyEventIdFromParam(param: string): string | null {
  const tail = param.slice(param.lastIndexOf("-") + 1);
  return /^c[a-z0-9]{20,}$/.test(tail) ? tail : null;
}
