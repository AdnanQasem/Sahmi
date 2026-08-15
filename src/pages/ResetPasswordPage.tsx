import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Check, Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import SahmiLogo from "@/components/SahmiLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import authService from "@/services/authService";
import { getErrorMessage, getFieldErrors } from "@/services/api";

const passwordRequirements = [
  { labelKey: "settings.password8", check: (value: string) => value.length >= 8 },
  { labelKey: "settings.passwordCase", check: (value: string) => /[a-z]/.test(value) && /[A-Z]/.test(value) },
  { labelKey: "settings.passwordNumber", check: (value: string) => /\d/.test(value) },
  { labelKey: "settings.passwordSpecial", check: (value: string) => /[!@#$%^&*]/.test(value) },
];

const ResetPasswordPage = () => {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const uid = params.get("uid") ?? "";
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState("");
  const linkIsValid = Boolean(uid && token);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password !== confirmation) { setError(t("auth.passwordMismatch")); return; }
    setSubmitting(true);
    setError("");
    try {
      await authService.confirmPasswordReset({ uid, token, new_password: password, confirm_password: confirmation });
      setComplete(true);
    } catch (requestError) {
      const fields = getFieldErrors(requestError);
      setError(fields.token || fields.new_password || fields.confirm_password || getErrorMessage(requestError, t("auth.resetConfirmError")));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="container flex min-h-[70vh] items-center justify-center py-16">
      <section className="w-full max-w-md rounded-2xl border border-border bg-card p-7 shadow-lg sm:p-9">
        <Link to="/" className="mb-7 inline-flex"><SahmiLogo size="md" variant="full" /></Link>
        <h1 className="text-3xl font-bold text-foreground">{t("auth.resetTitle")}</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("auth.resetText")}</p>

        {!linkIsValid ? (
          <div className="mt-7 space-y-5"><p className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">{t("auth.invalidResetLink")}</p><Button asChild className="w-full"><Link to="/forgot-password">{t("auth.requestNewLink")}</Link></Button></div>
        ) : complete ? (
          <div className="mt-7 space-y-5"><p className="rounded-xl border border-success/30 bg-success/10 p-4 text-sm">{t("auth.resetComplete")}</p><Button asChild className="w-full"><Link to="/login">{t("auth.login")}</Link></Button></div>
        ) : (
          <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
            <div><Label htmlFor="new-password">{t("auth.newPassword")}</Label><div className="relative mt-2"><Lock className="absolute start-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" /><Input id="new-password" className="h-12 ps-10 pe-10" type={showPassword ? "text" : "password"} autoComplete="new-password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} /><button type="button" className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPassword((current) => !current)} aria-label={t(showPassword ? "auth.hidePassword" : "auth.showPassword")}>{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></div></div>
            <div className="space-y-2 rounded-xl bg-muted/40 p-3" aria-label={t("auth.passwordRequirements")}>
              {passwordRequirements.map((requirement) => {
                const met = requirement.check(password);
                return <div key={requirement.labelKey} className={`flex items-center gap-2 text-sm ${met ? "text-success" : "text-muted-foreground"}`}><Check className="h-4 w-4" aria-hidden="true"/><span>{t(requirement.labelKey)}</span></div>;
              })}
            </div>
            <div><Label htmlFor="confirm-password">{t("auth.confirmPassword")}</Label><Input id="confirm-password" className="mt-2 h-12" type={showPassword ? "text" : "password"} autoComplete="new-password" required minLength={8} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></div>
            {error && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
            <Button className="h-12 w-full" type="submit" disabled={submitting}>{submitting ? <><Loader2 className="h-4 w-4 animate-spin" />{t("auth.resettingPassword")}</> : t("auth.resetPassword")}</Button>
          </form>
        )}
      </section>
    </main>
  );
};

export default ResetPasswordPage;
