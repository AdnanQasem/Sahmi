import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Send, Search, Loader2, RefreshCw, MessageSquare } from "lucide-react";
import DashboardLayout from "./DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import messagingService, { Conversation } from "@/services/messagingService";
import { getErrorMessage } from "@/services/api";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { formatDate } from "@/i18n/format";

const relativeTime = (value: string | null | undefined, language: string, justNow: string) => {
  if (!value) return "";
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return justNow;
  const locale = language === "ar" ? "ar-PS" : "en-US";
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (seconds < 3600) return formatter.format(-Math.floor(seconds / 60), "minute");
  if (seconds < 86400) return formatter.format(-Math.floor(seconds / 3600), "hour");
  return formatDate(value, { dateStyle: "medium" }, language === "ar" ? "ar" : "en");
};
const MessagesPage = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const roleBase = user?.user_type === "investor" ? "/dashboard/investor" : "/dashboard/entrepreneur";
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const sendingRef = useRef(false);

  const conversations = useQuery({
    queryKey: ["conversations"],
    queryFn: messagingService.listConversations,
    refetchInterval: 10_000,
  });
  const selected = conversations.data?.results.find((item) => item.id === selectedId) ?? null;
  const messages = useQuery({
    queryKey: ["messages", selectedId],
    queryFn: () => messagingService.listMessages(selectedId!),
    enabled: Boolean(selectedId),
    refetchInterval: selectedId ? 5_000 : false,
  });

  const markRead = useMutation({
    mutationFn: messagingService.markRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["conversations"] });
      void queryClient.invalidateQueries({ queryKey: ["conversation-unread"] });
    },
  });
  const send = useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) => messagingService.sendMessage(id, body),
    onSuccess: () => {
      setDraft("");
      void queryClient.invalidateQueries({ queryKey: ["messages", selectedId] });
      void queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (error) => toast.error(getErrorMessage(error, t("messages.sendError"))),
    onSettled: () => { sendingRef.current = false; },
  });

  const chooseConversation = (conversation: Conversation) => {
    setSelectedId(conversation.id);
    if (conversation.unread_count > 0) markRead.mutate(conversation.id);
  };
  const handleSend = () => {
    const body = draft.trim();
    if (!selectedId || !body || send.isPending || sendingRef.current) return;
    sendingRef.current = true;
    send.mutate({ id: selectedId, body });
  };
  const filtered = useMemo(() => (conversations.data?.results ?? []).filter((conversation) => {
    const other = conversation.participants.find((participant) => participant.user.id !== user?.id)?.user;
    return `${other?.full_name ?? ""} ${conversation.title} ${conversation.last_message_preview?.preview ?? ""}`.toLowerCase().includes(search.toLowerCase());
  }), [conversations.data, search, user?.id]);

  return (
    <DashboardLayout roleBase={roleBase}>
      <div className="flex h-[calc(100vh-8rem)] gap-6">
        <section className="flex w-full shrink-0 flex-col overflow-hidden rounded-2xl border bg-card shadow-sm sm:w-80 lg:w-96">
          <div className="border-b p-4">
            <h1 className="text-xl font-bold">{t("messages.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("messages.unread", { count: conversations.data?.results.reduce((sum, item) => sum + item.unread_count, 0) ?? 0 })}</p>
            <div className="relative mt-4"><Search className="absolute start-3 top-3 h-4 w-4 text-muted-foreground" /><Input aria-label={t("messages.searchLabel")} className="ps-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("messages.search")} /></div>
          </div>
          <ScrollArea className="flex-1">
            {conversations.isLoading && <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> {t("messages.loadingConversations")}</div>}
            {conversations.isError && <div className="space-y-3 p-6 text-sm"><p>{t("messages.loadConversationsError")}</p><Button size="sm" variant="outline" onClick={() => conversations.refetch()}><RefreshCw className="mr-2 h-4 w-4" />{t("common.retry")}</Button></div>}
            {!conversations.isLoading && !conversations.isError && filtered.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground"><MessageSquare className="mx-auto mb-3 h-8 w-8" />{t("messages.emptyConversations")}</div>}
            {filtered.map((conversation) => {
              const other = conversation.participants.find((participant) => participant.user.id !== user?.id)?.user;
              return <button key={conversation.id} onClick={() => chooseConversation(conversation)} className={`w-full border-b p-4 text-start hover:bg-muted/50 ${selectedId === conversation.id ? "bg-primary/5" : ""}`}>
                <div className="flex items-start justify-between gap-3"><p className="font-semibold">{other?.full_name || conversation.title || t("messages.conversation")}</p><span className="text-xs text-muted-foreground">{relativeTime(conversation.last_message_at, i18n.resolvedLanguage ?? "en", t("messages.justNow"))}</span></div>
                <div className="mt-1 flex items-center gap-2"><p className="line-clamp-1 flex-1 text-sm text-muted-foreground">{conversation.last_message_preview?.preview ?? t("messages.noMessages")}</p>{conversation.unread_count > 0 && <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">{conversation.unread_count}</span>}</div>
              </button>;
            })}
          </ScrollArea>
        </section>

        <section className="hidden min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border bg-card shadow-sm sm:flex">
          {!selected ? <div className="m-auto text-center text-muted-foreground"><MessageSquare className="mx-auto mb-3 h-10 w-10" /><p>{t("messages.select")}</p></div> : <>
            <header className="border-b p-4"><h2 className="font-semibold">{selected.participants.find((participant) => participant.user.id !== user?.id)?.user.full_name ?? selected.title}</h2></header>
            <ScrollArea className="flex-1 p-5">
              {messages.isLoading && <div className="flex justify-center p-8"><Loader2 className="h-5 w-5 animate-spin" /></div>}
              {messages.isError && <div className="space-y-3 p-8 text-center"><p>{t("messages.loadError")}</p><Button variant="outline" onClick={() => messages.refetch()}>{t("common.retry")}</Button></div>}
              {!messages.isLoading && !messages.isError && messages.data?.results.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">{t("messages.noMessages")}</p>}
              <div className="space-y-3">{messages.data?.results.map((message) => {
                const mine = message.sender.id === user?.id;
                return <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}><div className={`max-w-[75%] rounded-2xl px-4 py-2 ${mine ? "bg-primary text-primary-foreground" : "bg-muted"}`}><p dir="auto" className="whitespace-pre-wrap break-words text-sm">{message.is_deleted ? t("messages.deleted") : message.body}</p><p className="mt-1 text-[10px] opacity-70">{relativeTime(message.created_at, i18n.resolvedLanguage ?? "en", t("messages.justNow"))}</p></div></div>;
              })}</div>
            </ScrollArea>
            <div className="flex gap-2 border-t p-4"><Input aria-label={t("messages.messageLabel")} value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); handleSend(); } }} placeholder={t("messages.placeholder")} disabled={send.isPending} /><Button aria-label={t("messages.send")} onClick={handleSend} disabled={!draft.trim() || send.isPending}>{send.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</Button></div>
          </>}
        </section>
      </div>
    </DashboardLayout>
  );
};

export default MessagesPage;