import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, BriefcaseBusiness, Camera, Check, Clock, Globe, Loader2, Lock, Mail, Save, Shield, Trash2, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import DashboardLayout from "./DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { changeLanguage, type SupportedLanguage } from "@/i18n";
import { getErrorMessage } from "@/services/api";
import authService, { type User as AuthUser } from "@/services/authService";
import notificationService, { type NotificationPreferences } from "@/services/notificationService";

type Section = "profile" | "account" | "security" | "notifications";

const defaultPreferences: NotificationPreferences = {
  in_app_enabled: true,
  email_enabled: false,
  message_notifications: true,
  project_notifications: true,
  investment_notifications: true,
  milestone_notifications: true,
  repayment_notifications: true,
};

const SettingsPage = () => {
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const isAdmin = Boolean(user?.is_staff || user?.user_type === "admin");
  const isEntrepreneur = user?.user_type === "entrepreneur";
  const roleBase = isAdmin ? "/dashboard/admin" : user?.user_type === "investor" ? "/dashboard/investor" : "/dashboard/entrepreneur";
  const [section, setSection] = useState<Section>("profile");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    full_name: "", email: "", phone_number: "", city: "", country: "", website: "", bio: "",
    timezone: "Asia/Hebron", preferred_language: "en" as SupportedLanguage,
    business_name: "", business_registration_number: "", business_established_date: "", business_address: "",
    risk_preference: "medium" as "low" | "medium" | "high",
    current_password: "", new_password: "", confirm_password: "",
  });
  const [preferences, setPreferences] = useState(defaultPreferences);

  const populate = (account: AuthUser | null) => {
    if (!account) return;
    setForm((current) => ({
      ...current,
      full_name: account.full_name ?? "",
      email: account.email ?? "",
      phone_number: account.phone_number ?? "",
      city: account.city ?? "",
      country: account.country ?? "",
      website: account.website ?? "",
      bio: account.bio ?? "",
      timezone: account.timezone?.includes("(") ? "Asia/Hebron" : account.timezone || "Asia/Hebron",
      preferred_language: account.preferred_language ?? "en",
      business_name: account.business_name ?? "",
      business_registration_number: account.business_registration_number ?? "",
      business_established_date: account.business_established_date ?? "",
      business_address: account.business_address ?? "",
      risk_preference: account.risk_preference ?? "medium",
    }));
  };
  useEffect(() => populate(user), [user]);

  const preferenceQuery = useQuery({ queryKey: ["notification-preferences"], queryFn: notificationService.getPreferences });
  useEffect(() => { if (preferenceQuery.data) setPreferences(preferenceQuery.data); }, [preferenceQuery.data]);
  const savePreferences = useMutation({ mutationFn: notificationService.savePreferences });

  const syncUser = async (updated?: AuthUser) => {
    if (refreshUser) await refreshUser();
    else if (updated) populate(updated);
  };

  const changePreferredLanguage = async (language: SupportedLanguage) => {
    const previous = form.preferred_language;
    setForm((value) => ({ ...value, preferred_language: language }));
    await changeLanguage(language);
    try {
      const updated = await authService.updateCurrentUser({ preferred_language: language });
      await syncUser(updated);
      toast.success(t("settings.saved"));
    } catch (error) {
      setForm((value) => ({ ...value, preferred_language: previous }));
      await changeLanguage(previous);
      toast.error(getErrorMessage(error, t("settings.preferencesError")));
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      if (section === "profile") {
        const payload: Partial<AuthUser> = {
          full_name: form.full_name.trim(), phone_number: form.phone_number.trim(), city: form.city.trim(),
          country: form.country.trim(), website: form.website.trim(), bio: form.bio.trim(),
        };
        if (isEntrepreneur) Object.assign(payload, {
          business_name: form.business_name.trim(),
          business_registration_number: form.business_registration_number.trim(),
          business_established_date: form.business_established_date || null,
          business_address: form.business_address.trim(),
        });
        if (user?.user_type === "investor") payload.risk_preference = form.risk_preference;
        const updated = await authService.updateCurrentUser(payload);
        await syncUser(updated);
      } else if (section === "account") {
        const updated = await authService.updateCurrentUser({ email: form.email.trim(), timezone: form.timezone });
        await syncUser(updated);
      } else if (section === "security") {
        if (!form.current_password || !form.new_password || !form.confirm_password) throw new Error(t("settings.completePasswordFields"));
        if (form.new_password !== form.confirm_password) throw new Error(t("settings.passwordMismatch"));
        await authService.changePassword(form);
        setForm((value) => ({ ...value, current_password: "", new_password: "", confirm_password: "" }));
      } else {
        const saved = await savePreferences.mutateAsync(preferences);
        setPreferences(saved);
        await queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
      }
      toast.success(t("settings.saved"));
    } catch (error) {
      toast.error(getErrorMessage(error, error instanceof Error ? error.message : t("settings.preferencesError")));
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    populate(user);
    setPreferences(preferenceQuery.data ?? defaultPreferences);
  };

  const uploadPicture = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const updated = await authService.uploadProfilePicture(file);
      await syncUser(updated);
      toast.success(t("settings.pictureUpdated"));
    } catch (error) {
      toast.error(getErrorMessage(error, t("settings.pictureError")));
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const removePicture = async () => {
    setUploading(true);
    try {
      const updated = await authService.updateCurrentUser({ profile_picture: null });
      await syncUser(updated);
      toast.success(t("settings.pictureRemoved"));
    } catch (error) {
      toast.error(getErrorMessage(error, t("settings.pictureError")));
    } finally { setUploading(false); }
  };

  const tabs = [
    { id: "profile" as const, icon: User, title: t("settings.profile"), detail: t("settings.personalInfo") },
    { id: "account" as const, icon: Mail, title: t("settings.account"), detail: t("settings.emailPhone") },
    { id: "security" as const, icon: Shield, title: t("settings.security"), detail: t("settings.passwordSecurity") },
    { id: "notifications" as const, icon: Bell, title: t("settings.notifications"), detail: t("settings.alertPreferences") },
  ];
  const fieldClass = "space-y-2";
  const labelClass = "text-sm font-medium";

  return <DashboardLayout roleBase={roleBase}>
    <div className="space-y-8">
      <div><h1 className="text-3xl font-bold">{t("settings.title")}</h1><p className="text-muted-foreground">{t("settings.subtitle")}</p></div>
      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <nav className="grid grid-cols-2 gap-2 lg:block lg:space-y-2" aria-label={t("settings.title")}>
          {tabs.map((tab) => <button key={tab.id} type="button" onClick={() => setSection(tab.id)} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-start transition-colors ${section === tab.id ? "border-primary bg-primary/10 text-primary" : "border-transparent hover:bg-muted"}`}>
            <tab.icon className="h-5 w-5 shrink-0"/><span><span className="block font-medium">{tab.title}</span><span className="hidden text-xs text-muted-foreground sm:block">{tab.detail}</span></span>
          </button>)}
        </nav>

        <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-7">
          {section === "profile" && <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-5 border-b pb-6">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl bg-primary text-3xl font-bold text-primary-foreground">
                {user?.profile_picture ? <img src={user.profile_picture} alt="" className="h-full w-full object-cover"/> : (user?.full_name?.[0] || "U").toUpperCase()}
              </div>
              <div className="space-y-2"><div className="flex flex-wrap gap-2"><Badge>{t(isAdmin ? "roles.admin" : `roles.${user?.user_type}`)}</Badge>{user?.is_verified && <Badge variant="outline"><Check className="me-1 h-3 w-3"/>{t("settings.verified")}</Badge>}</div>
                <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" disabled={uploading} onClick={() => fileInput.current?.click()}>{uploading ? <Loader2 className="me-2 h-4 w-4 animate-spin"/> : <Camera className="me-2 h-4 w-4"/>}{t("settings.changePicture")}</Button>{user?.profile_picture && <Button type="button" variant="ghost" disabled={uploading} onClick={removePicture}><Trash2 className="me-2 h-4 w-4"/>{t("settings.removePicture")}</Button>}</div>
                <input ref={fileInput} className="hidden" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => void uploadPicture(event.target.files?.[0])}/><p className="text-xs text-muted-foreground">{t("settings.pictureHelp")}</p>
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className={fieldClass}><label className={labelClass}>{t("settings.fullName")}</label><Input value={form.full_name} onChange={(e) => setForm({...form, full_name:e.target.value})}/></div>
              <div className={fieldClass}><label className={labelClass}>{t("settings.phoneNumber")}</label><Input type="tel" value={form.phone_number} onChange={(e) => setForm({...form, phone_number:e.target.value})}/></div>
              <div className={fieldClass}><label className={labelClass}>{t("settings.city")}</label><Input value={form.city} onChange={(e) => setForm({...form, city:e.target.value})}/></div>
              <div className={fieldClass}><label className={labelClass}>{t("settings.country")}</label><Input value={form.country} onChange={(e) => setForm({...form, country:e.target.value})}/></div>
              <div className={`${fieldClass} sm:col-span-2`}><label className={labelClass}>{t("settings.website")}</label><Input type="url" value={form.website} onChange={(e) => setForm({...form, website:e.target.value})} placeholder="https://example.com"/></div>
              <div className={`${fieldClass} sm:col-span-2`}><label className={labelClass}>{t("settings.bio")}</label><textarea className="min-h-28 w-full rounded-md border bg-background px-3 py-2 text-sm" value={form.bio} onChange={(e) => setForm({...form, bio:e.target.value})}/></div>
              {isEntrepreneur && <><div className={fieldClass}><label className={labelClass}>{t("settings.businessName")}</label><Input value={form.business_name} onChange={(e) => setForm({...form, business_name:e.target.value})}/></div><div className={fieldClass}><label className={labelClass}>{t("settings.registrationNumber")}</label><Input value={form.business_registration_number} onChange={(e) => setForm({...form, business_registration_number:e.target.value})}/></div><div className={fieldClass}><label className={labelClass}>{t("settings.establishedDate")}</label><Input type="date" value={form.business_established_date} onChange={(e) => setForm({...form, business_established_date:e.target.value})}/></div><div className={fieldClass}><label className={labelClass}>{t("settings.businessAddress")}</label><Input value={form.business_address} onChange={(e) => setForm({...form, business_address:e.target.value})}/></div></>}
              {user?.user_type === "investor" && <div className={fieldClass}><label className={labelClass}>{t("settings.riskPreference")}</label><select className="h-10 w-full rounded-md border bg-background px-3" value={form.risk_preference} onChange={(e) => setForm({...form, risk_preference:e.target.value as typeof form.risk_preference})}><option value="low">{t("settings.riskLow")}</option><option value="medium">{t("settings.riskMedium")}</option><option value="high">{t("settings.riskHigh")}</option></select></div>}
            </div>
          </div>}

          {section === "account" && <div className="space-y-6">
            <div className="rounded-xl border border-warning/30 bg-warning/5 p-4"><p className="font-medium">{t("settings.emailChange")}</p><p className="text-sm text-muted-foreground">{t("settings.emailChangeActualText")}</p></div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className={fieldClass}><label className={labelClass}>{t("settings.primaryEmail")}</label><Input type="email" value={form.email} onChange={(e) => setForm({...form, email:e.target.value})}/></div>
              <div className={fieldClass}><label htmlFor="preferred-language" className={labelClass}>{t("settings.language")}</label><select id="preferred-language" className="h-10 w-full rounded-md border bg-background px-3" value={form.preferred_language} onChange={(e) => void changePreferredLanguage(e.target.value as SupportedLanguage)}><option value="en">{t("language.english")}</option><option value="ar">{t("language.arabic")}</option></select></div>
              <div className={`${fieldClass} sm:col-span-2`}><label className={labelClass}>{t("settings.timezone")}</label><select className="h-10 w-full rounded-md border bg-background px-3" value={form.timezone} onChange={(e) => setForm({...form, timezone:e.target.value})}><option value="Asia/Hebron">{t("settings.hebron")}</option><option value="Asia/Riyadh">{t("settings.riyadh")}</option><option value="Asia/Dubai">{t("settings.dubai")}</option><option value="Europe/London">{t("settings.london")}</option><option value="America/New_York">{t("settings.newYork")}</option><option value="UTC">UTC</option></select></div>
            </div>
          </div>}

          {section === "security" && <div className="space-y-6">
            <div><h2 className="flex items-center gap-2 text-xl font-semibold"><Lock className="h-5 w-5 text-primary"/>{t("settings.changePassword")}</h2><p className="mt-1 text-sm text-muted-foreground">{t("settings.passwordSecurityText")}</p></div>
            <div className="grid max-w-xl gap-5">
              <div className={fieldClass}><label className={labelClass}>{t("settings.currentPassword")}</label><Input autoComplete="current-password" type="password" value={form.current_password} onChange={(e) => setForm({...form,current_password:e.target.value})}/></div>
              <div className={fieldClass}><label className={labelClass}>{t("settings.newPassword")}</label><Input autoComplete="new-password" type="password" value={form.new_password} onChange={(e) => setForm({...form,new_password:e.target.value})}/><p className="text-xs text-muted-foreground">{t("settings.passwordRequirements")}</p></div>
              <div className={fieldClass}><label className={labelClass}>{t("settings.confirmPassword")}</label><Input autoComplete="new-password" type="password" value={form.confirm_password} onChange={(e) => setForm({...form,confirm_password:e.target.value})}/></div>
            </div>
          </div>}

          {section === "notifications" && <div className="space-y-4">
            {preferenceQuery.isLoading && <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin"/>{t("settings.preferencesLoading")}</div>}
            {preferenceQuery.isError && <div className="rounded-xl border border-destructive/30 p-4"><p>{t("settings.preferencesError")}</p><Button className="mt-3" variant="outline" onClick={() => preferenceQuery.refetch()}>{t("common.retry")}</Button></div>}
            {preferenceQuery.data && <>{([
              ["project_notifications", "projectUpdates", "projectUpdatesText"], ["message_notifications", "messages", "messagesText"], ["milestone_notifications", "milestones", "milestonesText"], ["investment_notifications", "investmentUpdates", "investmentUpdatesText"], ["repayment_notifications", "repaymentNotifications", "repaymentNotificationsText"], ["email_enabled", "emailNotifications", "emailNotificationsText"], ["in_app_enabled", "inApp", "inAppText"],
            ] as const).map(([key,title,description]) => <div key={key} className="flex items-center justify-between gap-4 rounded-xl border p-4"><div><p className="font-medium">{t(`settings.${title}`)}</p><p className="text-sm text-muted-foreground">{t(`settings.${description}`)}</p></div><button type="button" role="switch" aria-checked={preferences[key]} aria-label={t(`settings.${title}`)} onClick={() => setPreferences({...preferences,[key]:!preferences[key]})} className={`relative h-7 w-14 shrink-0 rounded-full ${preferences[key] ? "bg-primary" : "bg-muted"}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${preferences[key] ? "start-8" : "start-1"}`}/></button></div>)}<div className="flex gap-3 rounded-xl bg-muted/50 p-4 text-sm"><Shield className="h-5 w-5 shrink-0 text-primary"/><p>{t("settings.securityNotificationsAlways")}</p></div></>}
          </div>}

          <div className="mt-8 flex justify-end gap-3 border-t pt-6"><Button type="button" variant="outline" onClick={reset}>{t("common.cancel")}</Button><Button type="button" disabled={saving || uploading || (section === "notifications" && !preferenceQuery.data)} onClick={() => void save()}>{saving ? <Loader2 className="me-2 h-4 w-4 animate-spin"/> : <Save className="me-2 h-4 w-4"/>}{saving ? t("common.saving") : t("common.save")}</Button></div>
        </section>
      </div>
      <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground"><div className="flex gap-3"><BriefcaseBusiness className="h-5 w-5 shrink-0 text-primary"/><p>{t("settings.realDataNotice")}</p></div></div>
    </div>
  </DashboardLayout>;
};

export default SettingsPage;
