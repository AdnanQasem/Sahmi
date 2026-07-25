import { useTranslation } from "react-i18next";
import { FormEvent, useEffect, useState } from "react";
import { Save, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type {
  AdminUser,
  AdminUserType,
  AdminUserWritePayload,
  InvestorTier,
  RiskPreference,
} from "@/services/adminUsersService";

interface AdminUserDialogProps {
  open: boolean;
  user: AdminUser | null;
  currentUserId?: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: AdminUserWritePayload) => void;
  isPending: boolean;
  fieldErrors?: Record<string, string>;
}

interface FormState {
  username: string;
  email: string;
  full_name: string;
  password: string;
  confirm_password: string;
  phone_number: string;
  user_type: AdminUserType;
  bio: string;
  country: string;
  city: string;
  is_verified: boolean;
  is_kyc_verified: boolean;
  kyc_verified_at: string;
  investor_tier: InvestorTier;
  total_invested: string;
  total_returned: string;
  average_roi: string;
  risk_preference: RiskPreference;
  business_name: string;
  business_registration_number: string;
  business_established_date: string;
  business_address: string;
  total_funded: string;
  total_repaid: string;
  reputation_score: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  groups: string;
  user_permissions: string;
}

const emptyForm: FormState = {
  username: "",
  email: "",
  full_name: "",
  password: "",
  confirm_password: "",
  phone_number: "",
  user_type: "investor",
  bio: "",
  country: "",
  city: "",
  is_verified: false,
  is_kyc_verified: false,
  kyc_verified_at: "",
  investor_tier: "bronze",
  total_invested: "0.00",
  total_returned: "0.00",
  average_roi: "0.00",
  risk_preference: "medium",
  business_name: "",
  business_registration_number: "",
  business_established_date: "",
  business_address: "",
  total_funded: "0.00",
  total_repaid: "0.00",
  reputation_score: "0.00",
  is_active: true,
  is_staff: false,
  is_superuser: false,
  groups: "",
  user_permissions: "",
};

const toLocalDateTime = (value: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const parseIdList = (value: string) => {
  const entries = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    values: entries.filter((item) => /^[1-9]\d*$/.test(item)).map(Number),
    invalid: entries.filter((item) => !/^[1-9]\d*$/.test(item)),
  };
};

const toApiDateTime = (value: string) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const FieldError = ({ message }: { message?: string }) =>
  message ? <p className="text-xs font-medium text-destructive">{message}</p> : null;

interface ToggleRowProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
}

const ToggleRow = ({ id, label, description, checked, disabled, onCheckedChange }: ToggleRowProps) => (
  <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-muted/20 p-3.5">
    <div>
      <Label htmlFor={id} className="cursor-pointer text-sm font-semibold">
        {label}
      </Label>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
    </div>
    <Switch
      id={id}
      checked={checked}
      disabled={disabled}
      onCheckedChange={onCheckedChange}
      className="mt-0.5 shrink-0"
    />
  </div>
);

const AdminUserDialog = ({
  open,
  user,
  currentUserId,
  onOpenChange,
  onSubmit,
  isPending,
  fieldErrors = {},
}: AdminUserDialogProps) => {
  const { t } = useTranslation();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [profilePicture, setProfilePicture] = useState<File>();
  const [kycDocument, setKycDocument] = useState<File>();
  const [removeProfilePicture, setRemoveProfilePicture] = useState(false);
  const [removeKycDocument, setRemoveKycDocument] = useState(false);
  const [localError, setLocalError] = useState("");
  const isSelf = !!user && user.id === currentUserId;

  useEffect(() => {
    if (!open) return;

    setProfilePicture(undefined);
    setKycDocument(undefined);
    setRemoveProfilePicture(false);
    setRemoveKycDocument(false);
    setLocalError("");
    setForm(
      user
        ? {
            username: user.username || "",
            email: user.email || "",
            full_name: user.full_name || "",
            password: "",
            confirm_password: "",
            phone_number: user.phone_number || "",
            user_type: user.user_type,
            bio: user.bio || "",
            country: user.country || "",
            city: user.city || "",
            is_verified: user.is_verified,
            is_kyc_verified: user.is_kyc_verified,
            kyc_verified_at: toLocalDateTime(user.kyc_verified_at),
            investor_tier: user.investor_tier,
            total_invested: user.total_invested || "0.00",
            total_returned: user.total_returned || "0.00",
            average_roi: user.average_roi || "0.00",
            risk_preference: user.risk_preference,
            business_name: user.business_name || "",
            business_registration_number: user.business_registration_number || "",
            business_established_date: user.business_established_date || "",
            business_address: user.business_address || "",
            total_funded: user.total_funded || "0.00",
            total_repaid: user.total_repaid || "0.00",
            reputation_score: user.reputation_score || "0.00",
            is_active: user.is_active,
            is_staff: user.is_staff,
            is_superuser: user.is_superuser,
            groups: user.groups.map(String).join(", "),
            user_permissions: user.user_permissions.map(String).join(", "),
          }
        : { ...emptyForm },
    );
  }, [open, user]);

  const update = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError("");

    if (!user && form.password.length < 8) {
      setLocalError(t("adminForm.initialPasswordMinimum"));
      return;
    }
    if (!user && form.password !== form.confirm_password) {
      setLocalError(t("adminForm.passwordMismatch"));
      return;
    }

    const groups = parseIdList(form.groups);
    const permissions = parseIdList(form.user_permissions);
    if (groups.invalid.length || permissions.invalid.length) {
      setLocalError(t("adminForm.idListsInvalid"));
      return;
    }

    const kycVerifiedAt =
      form.is_kyc_verified && form.kyc_verified_at
        ? toApiDateTime(form.kyc_verified_at)
        : null;
    if (form.is_kyc_verified && form.kyc_verified_at && !kycVerifiedAt) {
      setLocalError(t("adminForm.kycDateInvalid"));
      return;
    }

    const payload: AdminUserWritePayload = {
      username: form.username.trim(),
      email: form.email.trim().toLocaleLowerCase(),
      full_name: form.full_name.trim(),
      phone_number: form.phone_number.trim(),
      user_type: form.user_type,
      bio: form.bio.trim(),
      country: form.country.trim(),
      city: form.city.trim(),
      is_verified: form.is_verified,
      is_kyc_verified: form.is_kyc_verified,
      kyc_verified_at: kycVerifiedAt,
      investor_tier: form.investor_tier,
      total_invested: form.total_invested || "0.00",
      total_returned: form.total_returned || "0.00",
      average_roi: form.average_roi || "0.00",
      risk_preference: form.risk_preference,
      business_name: form.business_name.trim(),
      business_registration_number: form.business_registration_number.trim(),
      business_established_date: form.business_established_date || null,
      business_address: form.business_address.trim(),
      total_funded: form.total_funded || "0.00",
      total_repaid: form.total_repaid || "0.00",
      reputation_score: form.reputation_score || "0.00",
      is_active: form.is_active,
      is_staff: form.is_staff,
      is_superuser: form.is_superuser,
      groups: groups.values,
      user_permissions: permissions.values,
    };

    if (!user) payload.password = form.password;
    if (profilePicture) payload.profile_picture = profilePicture;
    else if (removeProfilePicture) payload.profile_picture = null;
    if (kycDocument) payload.kyc_document = kycDocument;
    else if (removeKycDocument) payload.kyc_document = null;
    onSubmit(payload);
  };

  const permissionLocked = isSelf;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !isPending && onOpenChange(nextOpen)}>
      <DialogContent className="max-h-[94vh] overflow-y-auto rounded-2xl sm:max-w-3xl">
        <DialogHeader>
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {user ? <ShieldCheck className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
          </div>
          <DialogTitle>{user ? t("adminForm.editUser", { name: user.full_name || user.email }) : t("adminForm.createUser")}</DialogTitle>
          <DialogDescription>
            {user
              ? t("adminForm.editUserHelp")
              : t("adminForm.createUserHelp")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="account" className="mt-2">
            <TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-4">
              <TabsTrigger value="account">{t("adminForm.account")}</TabsTrigger>
              <TabsTrigger value="profile">{t("adminForm.profile")}</TabsTrigger>
              <TabsTrigger value="financial">{t("adminForm.financial")}</TabsTrigger>
              <TabsTrigger value="access">{t("adminForm.access")}</TabsTrigger>
            </TabsList>

            <TabsContent value="account" className="mt-5 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="admin-user-full-name">{t("adminForm.fullName")}</Label>
                  <Input
                    id="admin-user-full-name"
                    value={form.full_name}
                    onChange={(event) => update("full_name", event.target.value)}
                    required
                    maxLength={150}
                    disabled={isPending}
                    autoFocus
                  />
                  <FieldError message={fieldErrors.full_name} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-user-email">{t("adminForm.email")}</Label>
                  <Input
                    id="admin-user-email"
                    type="email"
                    value={form.email}
                    onChange={(event) => update("email", event.target.value)}
                    required
                    disabled={isPending}
                  />
                  <FieldError message={fieldErrors.email} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-user-username">{t("adminForm.username")}</Label>
                  <Input
                    id="admin-user-username"
                    value={form.username}
                    onChange={(event) => update("username", event.target.value)}
                    maxLength={150}
                    placeholder={t("adminForm.usernameDefault")}
                    disabled={isPending}
                  />
                  <p className="text-xs text-muted-foreground">{t("adminForm.usernameOptional")}</p>
                  <FieldError message={fieldErrors.username} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-user-phone">{t("adminForm.phoneNumber")}</Label>
                  <Input
                    id="admin-user-phone"
                    value={form.phone_number}
                    onChange={(event) => update("phone_number", event.target.value)}
                    maxLength={32}
                    disabled={isPending}
                  />
                  <FieldError message={fieldErrors.phone_number} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-user-type">{t("adminForm.accountType")}</Label>
                  <Select
                    value={form.user_type}
                    disabled={isPending || isSelf}
                    onValueChange={(value: AdminUserType) => {
                      update("user_type", value);
                      if (value === "admin") update("is_staff", true);
                    }}
                  >
                    <SelectTrigger id="admin-user-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="investor">{t("adminForm.investor")}</SelectItem>
                      <SelectItem value="entrepreneur">{t("adminForm.entrepreneur")}</SelectItem>
                      <SelectItem value="admin">{t("adminForm.administrator")}</SelectItem>
                    </SelectContent>
                  </Select>
                  {isSelf && <p className="text-xs text-muted-foreground">{t("adminForm.cannotChangeOwnRole")}</p>}
                  <FieldError message={fieldErrors.user_type} />
                </div>
              </div>

              {!user && (
                <div className="grid gap-4 rounded-xl border border-border bg-muted/20 p-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="admin-user-password">{t("adminForm.initialPassword")}</Label>
                    <Input
                      id="admin-user-password"
                      type="password"
                      value={form.password}
                      onChange={(event) => update("password", event.target.value)}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      disabled={isPending}
                    />
                    <FieldError message={fieldErrors.password} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-user-confirm-password">{t("adminForm.confirmPassword")}</Label>
                    <Input
                      id="admin-user-confirm-password"
                      type="password"
                      value={form.confirm_password}
                      onChange={(event) => update("confirm_password", event.target.value)}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      disabled={isPending}
                    />
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="profile" className="mt-5 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="admin-user-country">{t("adminForm.country")}</Label>
                  <Input
                    id="admin-user-country"
                    value={form.country}
                    onChange={(event) => update("country", event.target.value)}
                    maxLength={80}
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-user-city">{t("adminForm.city")}</Label>
                  <Input
                    id="admin-user-city"
                    value={form.city}
                    onChange={(event) => update("city", event.target.value)}
                    maxLength={80}
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="admin-user-bio">{t("adminForm.bio")}</Label>
                  <Textarea
                    id="admin-user-bio"
                    value={form.bio}
                    onChange={(event) => update("bio", event.target.value)}
                    rows={3}
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-user-picture">{t("adminForm.profilePicture")}</Label>
                  <Input
                    id="admin-user-picture"
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      setProfilePicture(event.target.files?.[0]);
                      setRemoveProfilePicture(false);
                    }}
                    disabled={isPending}
                  />
                  {profilePicture ? (
                    <p className="text-xs text-muted-foreground">{t("adminForm.selectedFile", { name: profilePicture.name })}</p>
                  ) : user?.profile_picture ? (
                    <div className="flex flex-wrap items-center gap-2">
                      {!removeProfilePicture && (
                        <a className="text-xs font-medium text-primary hover:underline" href={user.profile_picture} target="_blank" rel="noreferrer">
                          {t("adminForm.viewCurrentPicture")}
                        </a>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={removeProfilePicture ? "h-7 px-2 text-xs" : "h-7 px-2 text-xs text-destructive hover:text-destructive"}
                        onClick={() => setRemoveProfilePicture((current) => !current)}
                        disabled={isPending}
                      >
                        {removeProfilePicture ? null : <Trash2 className="h-3.5 w-3.5" />}
                        {removeProfilePicture ? t("adminForm.keepPicture") : t("adminForm.remove")}
                      </Button>
                    </div>
                  ) : null}
                  {removeProfilePicture && <p className="text-xs font-medium text-destructive">{t("adminForm.pictureRemoved")}</p>}
                  <FieldError message={fieldErrors.profile_picture} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-user-kyc-document">{t("adminForm.kycDocument")}</Label>
                  <Input
                    id="admin-user-kyc-document"
                    type="file"
                    onChange={(event) => {
                      setKycDocument(event.target.files?.[0]);
                      setRemoveKycDocument(false);
                    }}
                    disabled={isPending}
                  />
                  {kycDocument ? (
                    <p className="text-xs text-muted-foreground">{t("adminForm.selectedFile", { name: kycDocument.name })}</p>
                  ) : user?.kyc_document ? (
                    <div className="flex flex-wrap items-center gap-2">
                      {!removeKycDocument && (
                        <a className="text-xs font-medium text-primary hover:underline" href={user.kyc_document} target="_blank" rel="noreferrer">
                          {t("adminForm.viewCurrentDocument")}
                        </a>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={removeKycDocument ? "h-7 px-2 text-xs" : "h-7 px-2 text-xs text-destructive hover:text-destructive"}
                        onClick={() => setRemoveKycDocument((current) => !current)}
                        disabled={isPending}
                      >
                        {removeKycDocument ? null : <Trash2 className="h-3.5 w-3.5" />}
                        {removeKycDocument ? t("adminForm.keepDocument") : t("adminForm.remove")}
                      </Button>
                    </div>
                  ) : null}
                  {removeKycDocument && <p className="text-xs font-medium text-destructive">{t("adminForm.kycRemoved")}</p>}
                  <FieldError message={fieldErrors.kyc_document} />
                </div>
              </div>

              <div className="border-t border-border pt-5">
                <h3 className="text-sm font-semibold">{t("adminForm.businessProfile")}</h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="admin-user-business-name">{t("adminForm.businessName")}</Label>
                    <Input
                      id="admin-user-business-name"
                      value={form.business_name}
                      onChange={(event) => update("business_name", event.target.value)}
                      maxLength={150}
                      disabled={isPending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-user-registration">{t("adminForm.registrationNumber")}</Label>
                    <Input
                      id="admin-user-registration"
                      value={form.business_registration_number}
                      onChange={(event) => update("business_registration_number", event.target.value)}
                      maxLength={100}
                      disabled={isPending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-user-established">{t("adminForm.establishedDate")}</Label>
                    <Input
                      id="admin-user-established"
                      type="date"
                      value={form.business_established_date}
                      onChange={(event) => update("business_established_date", event.target.value)}
                      disabled={isPending}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="admin-user-business-address">{t("adminForm.businessAddress")}</Label>
                    <Textarea
                      id="admin-user-business-address"
                      value={form.business_address}
                      onChange={(event) => update("business_address", event.target.value)}
                      rows={2}
                      disabled={isPending}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="financial" className="mt-5 space-y-5">
              <div className="rounded-xl border border-accent/25 bg-accent/5 p-4 text-xs leading-relaxed text-muted-foreground">
                {t("adminForm.financialWarning")}
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="admin-user-tier">{t("adminForm.investorTier")}</Label>
                  <Select value={form.investor_tier} onValueChange={(value: InvestorTier) => update("investor_tier", value)} disabled={isPending}>
                    <SelectTrigger id="admin-user-tier"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bronze">{t("adminForm.bronze")}</SelectItem>
                      <SelectItem value="silver">{t("adminForm.silver")}</SelectItem>
                      <SelectItem value="gold">{t("adminForm.gold")}</SelectItem>
                      <SelectItem value="platinum">{t("adminForm.platinum")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-user-risk">{t("adminForm.riskPreference")}</Label>
                  <Select value={form.risk_preference} onValueChange={(value: RiskPreference) => update("risk_preference", value)} disabled={isPending}>
                    <SelectTrigger id="admin-user-risk"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">{t("adminForm.low")}</SelectItem>
                      <SelectItem value="medium">{t("adminForm.medium")}</SelectItem>
                      <SelectItem value="high">{t("adminForm.high")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {[
                  ["total_invested", "adminForm.totalInvested"],
                  ["total_returned", "adminForm.totalReturned"],
                  ["average_roi", "adminForm.averageRoi"],
                  ["total_funded", "adminForm.totalFunded"],
                  ["total_repaid", "adminForm.totalRepaid"],
                  ["reputation_score", "adminForm.reputationScore"],
                ].map(([field, label]) => (
                  <div key={field} className="space-y-2">
                    <Label htmlFor={`admin-user-${field}`}>{t(label)}</Label>
                    <Input
                      id={`admin-user-${field}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={form[field as keyof Pick<FormState, "total_invested" | "total_returned" | "average_roi" | "total_funded" | "total_repaid" | "reputation_score">]}
                      onChange={(event) => update(field as keyof FormState, event.target.value)}
                      disabled={isPending}
                    />
                    <FieldError message={fieldErrors[field]} />
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="access" className="mt-5 space-y-4">
              {isSelf && (
                <div className="rounded-xl border border-accent/25 bg-accent/5 p-4 text-sm text-muted-foreground">
                  {t("adminForm.selfAccessLock")}
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <ToggleRow
                  id="admin-user-active"
                  label={t("adminForm.activeAccount")}
                  description={t("adminForm.activeAccountHelp")}
                  checked={form.is_active}
                  disabled={isPending || permissionLocked}
                  onCheckedChange={(checked) => update("is_active", checked)}
                />
                <ToggleRow
                  id="admin-user-verified"
                  label={t("adminForm.identityVerified")}
                  description={t("adminForm.identityVerifiedHelp")}
                  checked={form.is_verified}
                  disabled={isPending}
                  onCheckedChange={(checked) => update("is_verified", checked)}
                />
                <ToggleRow
                  id="admin-user-kyc-verified"
                  label={t("adminForm.kycVerified")}
                  description={t("adminForm.kycVerifiedHelp")}
                  checked={form.is_kyc_verified}
                  disabled={isPending}
                  onCheckedChange={(checked) => update("is_kyc_verified", checked)}
                />
                <ToggleRow
                  id="admin-user-staff"
                  label={t("adminForm.staffAccess")}
                  description={t("adminForm.staffAccessHelp")}
                  checked={form.is_staff}
                  disabled={isPending || permissionLocked || form.user_type === "admin" || form.is_superuser}
                  onCheckedChange={(checked) => {
                    update("is_staff", checked);
                    if (!checked) update("is_superuser", false);
                  }}
                />
                <ToggleRow
                  id="admin-user-superuser"
                  label={t("adminForm.superuser")}
                  description={t("adminForm.superuserHelp")}
                  checked={form.is_superuser}
                  disabled={isPending || permissionLocked}
                  onCheckedChange={(checked) => {
                    update("is_superuser", checked);
                    if (checked) update("is_staff", true);
                  }}
                />
              </div>

              <div className="grid gap-4 pt-1 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="admin-user-kyc-date">{t("adminForm.kycVerifiedAt")}</Label>
                  <Input
                    id="admin-user-kyc-date"
                    type="datetime-local"
                    value={form.kyc_verified_at}
                    onChange={(event) => update("kyc_verified_at", event.target.value)}
                    disabled={isPending || !form.is_kyc_verified}
                  />
                  <FieldError message={fieldErrors.kyc_verified_at} />
                </div>
                <div />
                <div className="space-y-2">
                  <Label htmlFor="admin-user-groups">{t("adminForm.groupIds")}</Label>
                  <Input
                    id="admin-user-groups"
                    value={form.groups}
                    onChange={(event) => update("groups", event.target.value)}
                    placeholder="1, 3"
                    disabled={isPending}
                  />
                  <p className="text-xs text-muted-foreground">{t("adminForm.groupIdsHelp")}</p>
                  <FieldError message={fieldErrors.groups} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-user-permissions">{t("adminForm.permissionIds")}</Label>
                  <Input
                    id="admin-user-permissions"
                    value={form.user_permissions}
                    onChange={(event) => update("user_permissions", event.target.value)}
                    placeholder="12, 18, 24"
                    disabled={isPending}
                  />
                  <p className="text-xs text-muted-foreground">{t("adminForm.permissionIdsHelp")}</p>
                  <FieldError message={fieldErrors.user_permissions} />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {(localError || fieldErrors.non_field_errors || fieldErrors.detail) && (
            <div className="mt-5 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {localError || fieldErrors.non_field_errors || fieldErrors.detail}
            </div>
          )}

          <DialogFooter className="mt-6 gap-2 sm:space-x-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isPending || !form.full_name.trim() || !form.email.trim()}>
              <Save className="h-4 w-4" />
              {isPending ? t("common.saving") : t(user ? "adminForm.saveChanges" : "adminForm.createUserAction")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdminUserDialog;
