import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Send, Search, Loader2, RefreshCw, MessageSquare, Paperclip, UserPlus, X } from "lucide-react";
import DashboardLayout from "./DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import messagingService, { Conversation } from "@/services/messagingService";
import { getErrorMessage } from "@/services/api";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { formatDate } from "@/i18n/format";
import { dashboardPollingInterval, dashboardPollingOptions } from "@/lib/dashboardPolling";
import MessageAttachment from "@/components/messages/MessageAttachment";
import DemoFillButton from "@/components/demo/DemoFillButton";
import { formDemoData } from "@/demo/formDemoData";
import { createSupportingDocumentDemo } from "@/demo/demoFiles";

const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;
const ATTACHMENT_ACCEPT = ".png,.jpg,.jpeg,.gif,.webp,.pdf,.txt,.csv,.doc,.docx,.xls,.xlsx,.ppt,.pptx";

const relativeTime = (value: string | null | undefined, language: string, justNow: string) => {
  if (!value) return "";
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return justNow;
  const locale = language === "ar" ? "ar-PS-u-nu-latn" : "en-US-u-nu-latn";
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (seconds < 3600) return formatter.format(-Math.floor(seconds / 60), "minute");
  if (seconds < 86400) return formatter.format(-Math.floor(seconds / 3600), "hour");
  return formatDate(value, { dateStyle: "medium" }, language === "ar" ? "ar" : "en");
};
const MessagesPage = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const roleBase = user?.is_staff || user?.user_type === "admin"
    ? "/dashboard/admin"
    : user?.user_type === "investor"
      ? "/dashboard/investor"
      : "/dashboard/entrepreneur";
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [search, setSearch] = useState("");
  const [newMessageOpen, setNewMessageOpen] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const sendingRef = useRef(false);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  const conversations = useQuery({
    queryKey: ["conversations"],
    queryFn: messagingService.listConversations,
    ...dashboardPollingOptions,
  });
  const selected = conversations.data?.results.find((item) => item.id === selectedId) ?? null;
  const userResults = useQuery({
    queryKey: ["message-user-search", userSearch.trim()],
    queryFn: () => messagingService.searchUsers(userSearch.trim()),
    enabled: newMessageOpen && userSearch.trim().length >= 2,
  });
  const messages = useQuery({
    queryKey: ["messages", selectedId],
    queryFn: () => messagingService.listMessages(selectedId!),
    enabled: Boolean(selectedId),
    refetchInterval: selectedId ? dashboardPollingInterval : false,
    refetchIntervalInBackground: false,
  });

  const markRead = useMutation({
    mutationFn: messagingService.markRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["conversations"] });
      void queryClient.invalidateQueries({ queryKey: ["conversation-unread"] });
    },
  });
  useEffect(() => {
    const conversationId = searchParams.get("conversation");
    if (!conversationId || !conversations.data?.results.some((item) => item.id === conversationId)) return;
    setSelectedId(conversationId);
    const conversation = conversations.data.results.find((item) => item.id === conversationId);
    if (conversation && conversation.unread_count > 0) {
      void messagingService.markRead(conversationId).then(() => {
        void queryClient.invalidateQueries({ queryKey: ["conversations"] });
        void queryClient.invalidateQueries({ queryKey: ["conversation-unread"] });
      });
    }
  }, [conversations.data, queryClient, searchParams]);
  const send = useMutation({
    mutationFn: ({ id, body, file }: { id: string; body: string; file: File | null }) => file
      ? messagingService.sendMessage(id, body, file)
      : messagingService.sendMessage(id, body),
    onSuccess: () => {
      setDraft("");
      setAttachment(null);
      if (attachmentInputRef.current) attachmentInputRef.current.value = "";
      void queryClient.invalidateQueries({ queryKey: ["messages", selectedId] });
      void queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (error) => toast.error(getErrorMessage(error, t("messages.sendError"))),
    onSettled: () => { sendingRef.current = false; },
  });

  const createConversation = useMutation({
    mutationFn: messagingService.createDirectConversation,
    onSuccess: (conversation) => {
      setSelectedId(conversation.id);
      setNewMessageOpen(false);
      setUserSearch("");
      void queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (error) => toast.error(getErrorMessage(error, t("messages.createError"))),
  });

  const chooseConversation = (conversation: Conversation) => {
    setSelectedId(conversation.id);
    if (conversation.unread_count > 0) markRead.mutate(conversation.id);
  };
  const handleSend = () => {
    const body = draft.trim();
    if (!selectedId || (!body && !attachment) || send.isPending || sendingRef.current) return;
    sendingRef.current = true;
    send.mutate({ id: selectedId, body, file: attachment });
  };
  const chooseAttachment = (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_ATTACHMENT_SIZE) {
      toast.error(t("messages.attachmentTooLarge"));
      if (attachmentInputRef.current) attachmentInputRef.current.value = "";
      return;
    }
    setAttachment(file);
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
<div className="flex items-start justify-between gap-3">
              <div><h1 className="text-xl font-bold">{t("messages.title")}</h1><p className="text-sm text-muted-foreground">{t("messages.unread", { count: conversations.data?.results.reduce((sum, item) => sum + item.unread_count, 0) ?? 0 })}</p></div>
              <Button size="sm" onClick={() => setNewMessageOpen(true)}><UserPlus className="h-4 w-4" />{t("messages.newMessage")}</Button>
            </div>
            <div className="relative mt-4"><Search className="absolute start-3 top-3 h-4 w-4 text-muted-foreground" /><Input aria-label={t("messages.searchLabel")} className="ps-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("messages.search")} /></div>
          </div>
          <ScrollArea className="flex-1">
            {conversations.isLoading && <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> {t("messages.loadingConversations")}</div>}
            {conversations.isError && <div className="space-y-3 p-6 text-sm"><p>{t("messages.loadConversationsError")}</p><Button size="sm" variant="outline" onClick={() => conversations.refetch()}><RefreshCw className="me-2 h-4 w-4" />{t("common.retry")}</Button></div>}
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
                return <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}><div className={`max-w-[85%] rounded-2xl px-4 py-2 sm:max-w-[75%] ${mine ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{message.is_deleted ? <p className="text-sm">{t("messages.deleted")}</p> : <>{message.body && <p dir="auto" className="whitespace-pre-wrap break-words text-sm">{message.body}</p>}{message.attachment && <MessageAttachment messageId={message.id} attachment={message.attachment} />}</>}<p className="mt-1 text-[10px] opacity-70">{relativeTime(message.created_at, i18n.resolvedLanguage ?? "en", t("messages.justNow"))}</p></div></div>;
              })}</div>
            </ScrollArea>
            <div className="border-t p-4">
              {attachment && <div className="mb-3 flex items-center gap-3 rounded-xl border bg-muted/40 px-3 py-2"><Paperclip className="h-4 w-4 shrink-0 text-primary"/><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium" dir="auto">{attachment.name}</p><p className="text-xs text-muted-foreground">{(attachment.size / (1024 * 1024)).toFixed(1)} MB</p></div><Button type="button" size="icon" variant="ghost" className="h-8 w-8" disabled={send.isPending} onClick={() => { setAttachment(null); if (attachmentInputRef.current) attachmentInputRef.current.value = ""; }} aria-label={t("messages.removeAttachment")}><X className="h-4 w-4"/></Button></div>}
              <div className="flex gap-2">
                <input ref={attachmentInputRef} type="file" className="sr-only" accept={ATTACHMENT_ACCEPT} onChange={(event) => chooseAttachment(event.target.files?.[0])} />
                <Button type="button" size="icon" variant="outline" aria-label={t("messages.attachFile")} title={t("messages.attachFile")} disabled={send.isPending} onClick={() => attachmentInputRef.current?.click()}><Paperclip className="h-4 w-4"/></Button>
                <Input aria-label={t("messages.messageLabel")} value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); handleSend(); } }} placeholder={t("messages.placeholder")} disabled={send.isPending} />
                <Button aria-label={t("messages.send")} onClick={handleSend} disabled={(!draft.trim() && !attachment) || send.isPending}>{send.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</Button>
              </div>
              <DemoFillButton className="mt-2" onClick={() => { setDraft(formDemoData.message); setAttachment(createSupportingDocumentDemo()); }} disabled={send.isPending} />
              <p className="mt-2 text-xs text-muted-foreground">{t("messages.attachmentHelp")}</p>
            </div>
          </>}
        </section>
      </div>

      <Dialog open={newMessageOpen} onOpenChange={(open) => { setNewMessageOpen(open); if (!open) setUserSearch(""); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("messages.newMessage")}</DialogTitle>
            <DialogDescription>{t("messages.findUserHelp")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative"><Search className="absolute start-3 top-3 h-4 w-4 text-muted-foreground" /><Input autoFocus className="ps-9" aria-label={t("messages.searchUsersLabel")} value={userSearch} onChange={(event) => setUserSearch(event.target.value)} placeholder={t("messages.searchUsers")} /></div>
            {userSearch.trim().length < 2 && <p className="py-4 text-center text-sm text-muted-foreground">{t("messages.searchUsersHint")}</p>}
            {userResults.isFetching && <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{t("messages.searchingUsers")}</div>}
            {userResults.isError && <p className="py-4 text-center text-sm text-destructive">{t("messages.userSearchError")}</p>}
            {!userResults.isFetching && !userResults.isError && userSearch.trim().length >= 2 && userResults.data?.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">{t("messages.noUsersFound")}</p>}
            <div className="max-h-72 space-y-1 overflow-y-auto">
              {userResults.data?.map((result) => <button key={result.id} type="button" disabled={createConversation.isPending} onClick={() => createConversation.mutate(result.id)} className="flex w-full items-center justify-between rounded-xl border border-transparent px-3 py-3 text-start hover:border-border hover:bg-muted disabled:opacity-50"><span><span className="block font-medium">{result.full_name}</span><span className="block text-xs text-muted-foreground">{t(`roles.${result.user_type}`, { defaultValue: result.user_type })}</span></span>{createConversation.isPending && createConversation.variables === result.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4 text-muted-foreground" />}</button>)}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default MessagesPage;
