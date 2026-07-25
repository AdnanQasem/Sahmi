import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import SahmiLogo from "@/components/SahmiLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import authService from "@/services/authService";
import { getErrorMessage } from "@/services/api";

const ForgotPasswordPage = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await authService.requestPasswordReset(email.trim());
      setSent(true);
    } catch (requestError) {
      setError(getErrorMessage(requestError, t("auth.resetRequestError")));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="container flex min-h-[70vh] items-center justify-center py-16">
      <section className="w-full max-w-md rounded-2xl border border-border bg-card p-7 shadow-lg sm:p-9">
        <Link to="/" className="mb-7 inline-flex"><SahmiLogo size="md" variant="full" /></Link>
        <h1 className="text-3xl font-bold text-foreground">{t("auth.forgotTitle")}</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("auth.forgotText")}</p>

        {sent ? (
          <div className="mt-7 space-y-5">
            <div className="rounded-xl border border-success/30 bg-success/10 p-4 text-sm text-foreground">{t("auth.resetEmailSent")}</div>
            <Button asChild className="w-full"><Link to="/login">{t("auth.backToLogin")}</Link></Button>
          </div>
        ) : (
          <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="reset-email">{t("auth.email")}</Label>
              <div className="relative mt-2"><Mail className="absolute start-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" /><Input id="reset-email" className="h-12 ps-10" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></div>
            </div>
            {error && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
            <Button className="h-12 w-full" type="submit" disabled={submitting}>{submitting ? <><Loader2 className="h-4 w-4 animate-spin" />{t("auth.sendingReset")}</> : t("auth.sendResetLink")}</Button>
            <Link to="/login" className="flex items-center justify-center gap-2 text-sm font-medium text-primary"><ArrowLeft className="h-4 w-4 rtl-flip" />{t("auth.backToLogin")}</Link>
          </form>
        )}
      </section>
    </main>
  );
};

export default ForgotPasswordPage;
