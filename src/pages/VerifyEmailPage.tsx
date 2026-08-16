import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, MailCheck, RefreshCw, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import SahmiLogo from "@/components/SahmiLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import authService from "@/services/authService";
import { getErrorMessage } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";

type VerificationState = "loading" | "success" | "error";

const VerifyEmailPage = () => {
  const { t } = useTranslation();
  const { verifyEmail } = useAuth();
  const [params] = useSearchParams();
  const uid = params.get("uid") ?? "";
  const token = params.get("token") ?? "";
  const [state, setState] = useState<VerificationState>("loading");
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!uid || !token) {
      setState("error");
      setError(t("auth.emailVerificationInvalid"));
      return;
    }
    verifyEmail(uid, token).then(() => {
      setState("success");
    }).catch((requestError) => {
      setState("error");
      setError(getErrorMessage(requestError, t("auth.emailVerificationInvalid")));
    });
  }, [t, token, uid, verifyEmail]);

  const resend = async (event: React.FormEvent) => {
    event.preventDefault();
    setResending(true);
    setResent(false);
    try {
      await authService.resendEmailVerification(email.trim());
      setResent(true);
    } catch (requestError) {
      setError(getErrorMessage(requestError, t("auth.emailVerificationResendError")));
    } finally {
      setResending(false);
    }
  };

  return <main className="container flex min-h-[70vh] items-center justify-center py-16">
    <section className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-lg sm:p-10">
      <Link to="/" className="mb-7 inline-flex"><SahmiLogo size="md" variant="full" /></Link>
      {state === "loading" && <div className="space-y-4"><Loader2 className="mx-auto h-12 w-12 animate-spin text-primary"/><h1 className="text-2xl font-bold">{t("auth.confirmingEmail")}</h1><p className="text-sm text-muted-foreground">{t("auth.confirmingEmailText")}</p></div>}
      {state === "success" && <div className="space-y-5"><CheckCircle2 className="mx-auto h-14 w-14 text-success"/><div><h1 className="text-2xl font-bold">{t("auth.emailConfirmed")}</h1><p className="mt-2 text-sm text-muted-foreground">{t("auth.emailConfirmedText")}</p></div><Button asChild className="w-full"><Link to="/dashboard">{t("auth.continueDashboard")}</Link></Button></div>}
      {state === "error" && <div className="space-y-5"><XCircle className="mx-auto h-14 w-14 text-destructive"/><div><h1 className="text-2xl font-bold">{t("auth.emailVerificationFailed")}</h1><p className="mt-2 text-sm text-muted-foreground">{error}</p></div><form className="space-y-3 text-start" onSubmit={resend}><Label htmlFor="verification-email">{t("auth.email")}</Label><Input id="verification-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com"/>{resent && <p className="rounded-lg bg-success/10 p-3 text-sm text-success">{t("auth.emailVerificationResent")}</p>}<Button type="submit" variant="outline" className="w-full" disabled={resending}>{resending ? <Loader2 className="h-4 w-4 animate-spin"/> : <RefreshCw className="h-4 w-4"/>}{t("auth.resendConfirmation")}</Button></form><Button asChild variant="ghost" className="w-full"><Link to="/login"><MailCheck className="h-4 w-4"/>{t("auth.login")}</Link></Button></div>}
    </section>
  </main>;
};

export default VerifyEmailPage;
