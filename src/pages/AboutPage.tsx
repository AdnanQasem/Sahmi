import { Shield, Eye, Heart, Users, Target, Globe } from "lucide-react";

const values = [
  { icon: Shield, title: "Trust & Integrity", desc: "Every project is carefully reviewed. We verify founders and require transparent funding plans." },
  { icon: Eye, title: "Full Transparency", desc: "Supporters can track exactly how funds are used through regular updates and detailed breakdowns." },
  { icon: Heart, title: "Community First", desc: "We exist to strengthen Palestinian communities by channeling support to where it matters most." },
  { icon: Users, title: "Inclusive Access", desc: "Anyone with a viable project can apply. We support entrepreneurs at every stage." },
  { icon: Target, title: "Impact Driven", desc: "We measure success not just in dollars raised, but in lasting community impact created." },
  { icon: Globe, title: "Global Reach", desc: "Connect Palestinian entrepreneurs with supporters worldwide who share their vision." },
];

const AboutPage = () => {
  return (
    <div className="min-h-screen">
      <section className="gradient-hero-subtle py-16 md:py-20">
        <div className="container mx-auto max-w-3xl text-center">
          <h1 className="mb-4 text-4xl font-bold text-foreground">About Sahmi</h1>
          <p className="text-lg leading-relaxed text-muted-foreground">
            Sahmi — meaning "my share" in Arabic — is a crowdfunding platform built to empower Palestinian entrepreneurs
            and connect them with a global community of supporters who believe in their vision.
          </p>
        </div>
      </section>

      <section className="container max-w-3xl py-16">
        <h2 className="mb-4 text-2xl font-bold text-foreground">Our Mission</h2>
        <p className="mb-8 leading-relaxed text-muted-foreground">
          To provide Palestinian entrepreneurs with a trustworthy, transparent platform to raise funds,
          build community support, and turn their ideas into reality. We believe that every great idea
          deserves a chance, and every community deserves access to opportunity.
        </p>

        <h2 className="mb-4 text-2xl font-bold text-foreground">Our Vision</h2>
        <p className="mb-8 leading-relaxed text-muted-foreground">
          A thriving Palestinian entrepreneurial ecosystem where innovation flourishes, communities prosper,
          and supporters worldwide can play a meaningful role in creating positive change.
        </p>

        <h2 className="mb-4 text-2xl font-bold text-foreground">How We Review Projects</h2>
        <p className="leading-relaxed text-muted-foreground">
          Every project submitted to Sahmi undergoes a careful review process. Our team verifies founder
          identity, reviews the business plan and funding allocation, and ensures transparency standards
          are met. Only projects that pass our review are listed on the platform. This protects both
          entrepreneurs and supporters.
        </p>
      </section>

      <section className="border-t border-border bg-card py-16">
        <div className="container">
          <h2 className="mb-10 text-center text-2xl font-bold text-foreground">Our Values</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {values.map((v) => (
              <div key={v.title} className="rounded-xl border border-border bg-background p-6">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-light">
                  <v.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold text-foreground">{v.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
