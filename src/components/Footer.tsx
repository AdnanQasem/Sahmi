import { Link } from "react-router-dom";
import SahmiLogo from "@/components/SahmiLogo";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { Instagram, Linkedin } from "lucide-react";

const socialLinks = [
  { icon: Instagram, label: "Instagram", href: "https://www.instagram.com/ikr_la/?hl=en" },
  { icon: Linkedin, label: "LinkedIn", href: "https://www.linkedin.com/in/ikrayyem-alabadla-542189325/" },
];

const Footer = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const canCreateProject = !user || user.user_type === "entrepreneur" || user.user_type === "admin";

  return (
    <footer className="border-t border-border bg-card">
      <div className="container py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-2">
              <SahmiLogo size="sm" variant="full" />
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {t("footer.tagline")}
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">{t("footer.platform")}</h4>
            <div className="flex flex-col gap-2">
              <Link to="/projects" className="text-sm text-muted-foreground hover:text-primary">{t("footer.explore")}</Link>
              {canCreateProject && (
                <Link to="/start-project" className="text-sm text-muted-foreground hover:text-primary">{t("footer.start")}</Link>
              )}
              <Link to="/how-it-works" className="text-sm text-muted-foreground hover:text-primary">{t("nav.how")}</Link>
              <Link to="/about" className="text-sm text-muted-foreground hover:text-primary">{t("footer.about")}</Link>
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">{t("footer.support")}</h4>
            <div className="flex flex-col gap-2">
              <Link to="/contact" className="text-sm text-muted-foreground hover:text-primary">{t("footer.contact")}</Link>
              <Link to="/how-it-works#faq" className="text-sm text-muted-foreground hover:text-primary">{t("footer.faq")}</Link>
              <Link to="/privacy" className="text-sm text-muted-foreground hover:text-primary">{t("footer.privacy")}</Link>
              <Link to="/terms" className="text-sm text-muted-foreground hover:text-primary">{t("footer.terms")}</Link>
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">{t("footer.connected")}</h4>
            <p className="text-sm text-muted-foreground">
              {t("footer.connectedText")}
            </p>
            <div className="mt-3 flex gap-3">
              {socialLinks.map((social) => (
                <a key={social.label} href={social.href} target="_blank" rel="noopener noreferrer" title={social.label} aria-label={social.label} className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground">
                  <social.icon className="h-4 w-4" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Sahmi. {t("footer.rights")}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
