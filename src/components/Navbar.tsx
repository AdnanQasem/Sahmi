import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import SahmiLogo from "@/components/SahmiLogo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import LogoutConfirmationDialog from "@/components/LogoutConfirmationDialog";
import { useAuth } from "@/hooks/useAuth";

const navLinks = [
  { href: "/", key: "nav.home" },
  { href: "/projects", key: "nav.projects" },
  { href: "/how-it-works", key: "nav.how" },
  { href: "/about", key: "nav.about" },
  { href: "/contact", key: "nav.contact" },
] as const;

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const canCreateProject = user?.user_type === "entrepreneur" && !user.is_staff;
  const links = navLinks.map((link) => <Link key={link.href} to={link.href} dir={i18n.dir()} onClick={() => setOpen(false)} className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted ${location.pathname === link.href ? "text-primary" : "text-muted-foreground"}`}>{t(link.key)}</Link>);

  return <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-lg">
    <div dir="ltr" className="container flex h-16 items-center justify-between gap-3">
      <Link to="/" className="flex items-center gap-2"><SahmiLogo size="md" variant="full" /></Link>
      <nav className="hidden items-center gap-1 lg:flex" aria-label={t("nav.menu")}>{links}</nav>
      <div dir="ltr" className="hidden items-center gap-2 lg:flex">
        <LanguageSwitcher compact />
        {isAuthenticated ? <>
          <Button variant="ghost" size="sm" asChild><Link to="/dashboard">{t("nav.dashboard")}</Link></Button>
          <LogoutConfirmationDialog>
            <Button variant="ghost" size="sm">{t("nav.logout")}</Button>
          </LogoutConfirmationDialog>
          {canCreateProject && <Button size="sm" asChild><Link to="/start-project">{t("projects.start")}</Link></Button>}
        </> : <>
          <Button variant="ghost" size="sm" asChild><Link to="/login">{t("nav.login")}</Link></Button>
          <Button size="sm" asChild><Link to="/register">{t("nav.register")}</Link></Button>
        </>}
      </div>
      <button type="button" className="rounded-lg p-2 text-foreground hover:bg-muted lg:hidden" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="mobile-navigation" aria-label={t("nav.menu")}>{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
    </div>
    {open && <div id="mobile-navigation" className="border-t border-border bg-card lg:hidden"><nav dir="ltr" className="container flex flex-col gap-1 py-4" aria-label={t("nav.menu")}>
      {links}<LanguageSwitcher className="mt-2 mr-auto" />
      <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
        {isAuthenticated ? <><Button variant="outline" size="sm" asChild><Link to="/dashboard" onClick={() => setOpen(false)}>{t("nav.dashboard")}</Link></Button><LogoutConfirmationDialog onLoggedOut={() => setOpen(false)}><Button variant="outline" size="sm">{t("nav.logout")}</Button></LogoutConfirmationDialog>{canCreateProject && <Button size="sm" asChild><Link to="/start-project" onClick={() => setOpen(false)}>{t("projects.start")}</Link></Button>}</> : <><Button variant="outline" size="sm" asChild><Link to="/login" onClick={() => setOpen(false)}>{t("nav.login")}</Link></Button><Button size="sm" asChild><Link to="/register" onClick={() => setOpen(false)}>{t("nav.register")}</Link></Button></>}
      </div>
    </nav></div>}
  </header>;
};
export default Navbar;
