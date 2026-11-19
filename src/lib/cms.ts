import { supabase } from "@/integrations/supabase/client";

export function slugify(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 80);
}

/**
 * Upload a file to a private bucket and return a long-lived signed URL.
 * Buckets `media` and `docs` are private; we sign for 10 years so links act as public.
 */
export async function uploadFile(
  bucket: "media" | "docs",
  file: File,
  folder = "",
): Promise<{ url: string; path: string; size: number; mime: string }> {
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${folder ? folder + "/" : ""}${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw error;
  const { data, error: signErr } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
  if (signErr || !data) throw signErr ?? new Error("Signed URL failed");
  return { url: data.signedUrl, path, size: file.size, mime: file.type };
}

export function formatBytes(bytes?: number | null): string {
  if (!bytes) return "—";
  const units = ["o", "Ko", "Mo", "Go"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n < 10 ? 1 : 0)} ${units[i]}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/**
 * Append an entry to the audit log. Best-effort: failures are swallowed
 * so admin actions never get blocked by logging.
 */
export async function logActivity(
  action: string,
  entity?: string,
  entity_id?: string | null,
  meta: Record<string, unknown> = {},
) {
  try {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) return;
    await supabase.from("activity_logs").insert({
      actor_id: user.id,
      actor_email: user.email,
      action,
      entity: entity ?? null,
      entity_id: entity_id ?? null,
      meta: meta as never,
    });
  } catch {
    // ignore
  }
}