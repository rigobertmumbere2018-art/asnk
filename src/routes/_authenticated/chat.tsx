import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, MessageSquare, Trash2, Loader2 } from "lucide-react";

type Msg = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  author?: { full_name: string | null } | null;
};

export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({ meta: [{ title: "Chat communautaire — Scouts du Nord-Kivu" }] }),
  component: Page,
});

function Page() {
  const { user } = Route.useRouteContext();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [names, setNames] = useState<Record<string, string>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  async function resolveNames(ids: string[]) {
    const missing = ids.filter((id) => !names[id]);
    if (missing.length === 0) return;
    const { data } = await supabase.from("profiles").select("id, full_name").in("id", missing);
    const next: Record<string, string> = { ...names };
    (data ?? []).forEach((p: any) => {
      next[p.id] = p.full_name ?? "Membre";
    });
    setNames(next);
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("room", "general")
        .order("created_at", { ascending: true })
        .limit(200);
      if (!mounted) return;
      if (error) toast.error(error.message);
      const msgs = (data ?? []) as Msg[];
      setMessages(msgs);
      setLoading(false);
      await resolveNames([...new Set(msgs.map((m) => m.user_id))]);
      setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }), 50);
    })();

    const channel = supabase
      .channel("chat:general")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: "room=eq.general" },
        async (payload) => {
          const m = payload.new as Msg;
          setMessages((list) => [...list, m]);
          await resolveNames([m.user_id]);
          setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 30);
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "chat_messages" },
        (payload) => {
          const id = (payload.old as { id: string }).id;
          setMessages((list) => list.filter((m) => m.id !== id));
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function send() {
    const content = text.trim();
    if (!content) return;
    setSending(true);
    const { error } = await supabase.from("chat_messages").insert({ content, user_id: user.id, room: "general" });
    setSending(false);
    if (error) return toast.error(error.message);
    setText("");
  }

  async function remove(id: string) {
    const { error } = await supabase.from("chat_messages").delete().eq("id", id);
    if (error) toast.error(error.message);
  }

  return (
    <section className="min-h-dvh bg-scout-deep pt-28 pb-10">
      <div className="mx-auto flex h-[calc(100dvh-9rem)] max-w-4xl flex-col px-4 lg:px-8">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <span className="grid size-10 place-items-center rounded-xl bg-scout-purple/20 text-scout-purple">
            <MessageSquare className="size-5" />
          </span>
          <div>
            <h1 className="text-xl font-semibold">Chat communautaire</h1>
            <p className="text-xs text-white/55">Salon général — visible par tous les membres connectés</p>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto py-6">
          {loading ? (
            <div className="flex justify-center pt-10"><Loader2 className="size-5 animate-spin text-white/60" /></div>
          ) : messages.length === 0 ? (
            <div className="pt-16 text-center text-sm text-white/55">
              Aucun message pour l'instant. Soyez le premier à écrire 👋
            </div>
          ) : (
            messages.map((m) => {
              const mine = m.user_id === user.id;
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`group max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${mine ? "bg-scout-green text-scout-deep" : "bg-white/5 text-white"}`}>
                    {!mine && (
                      <div className="mb-0.5 text-[10px] uppercase tracking-wider opacity-70">
                        {names[m.user_id] ?? "Membre"}
                      </div>
                    )}
                    <div className="whitespace-pre-wrap break-words">{m.content}</div>
                    <div className="mt-1 flex items-center justify-end gap-2 text-[10px] opacity-60">
                      <span>{new Date(m.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                      {mine && (
                        <button onClick={() => remove(m.id)} className="opacity-0 transition group-hover:opacity-100">
                          <Trash2 className="size-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex items-end gap-2 border-t border-white/10 pt-4"
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            maxLength={2000}
            placeholder="Écrire un message…"
            className="max-h-32 min-h-[44px] flex-1 resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-scout-green"
          />
          <button
            type="submit"
            disabled={sending || !text.trim()}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-scout-green text-scout-deep transition hover:opacity-90 disabled:opacity-40"
          >
            {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </button>
        </form>
      </div>
    </section>
  );
}