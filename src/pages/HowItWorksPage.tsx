import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Lightbulb, Users, TrendingUp, CheckCircle, Shield, Eye } from "lucide-react";

const steps = [
  {
    icon: Lightbulb,
    title: "1. Submit Your Project",
    items: [
      "Fill out our simple project form with your idea, story, and funding goal",
      "Upload images and supporting documents",
      "Submit for review by our team",
    ],
  },
  {
    icon: Shield,
    title: "2. Project Review",
    items: [
      "Our team verifies your identity and reviews your project",
      "We check the business plan and funding allocation",
      "Approved projects are listed on the platform within 2-3 business days",
    ],
  },
  {
    icon: Users,
    title: "3. Receive Support",
    items: [
      "Supporters discover your project and contribute",
      "Share your project with your network to gain traction",
      "Track funding progress in real-time on your dashboard",
    ],
  },
  {
    icon: TrendingUp,
    title: "4. Create Impact",
    items: [
      "Receive funds once your goal is reached",
      "Post regular updates to keep supporters informed",
      "Build your project and create lasting impact",
    ],
  },
];

const HowItWorksPage = () => {
  return (
    <div className="min-h-screen">
      <section className="gradient-hero-subtle py-16">
        <div className="container mx-auto max-w-3xl text-center">
          <h1 className="mb-4 text-4xl font-bold text-foreground">How Sahmi Works</h1>
          <p className="text-lg text-muted-foreground">
            A simple, transparent process to bring your project to life.
          </p>
        </div>
      </section>

      <section className="container max-w-3xl py-16">
        <div className="space-y-10">
          {steps.map((step) => (
            <div key={step.title} className="flex gap-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-light">
                <step.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="mb-3 text-lg font-semibold text-foreground">{step.title}</h3>
                <ul className="space-y-2">
                  {step.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <h2 className="mb-4 text-2xl font-bold text-foreground">Ready to Get Started?</h2>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" asChild>
              <Link to="/projects">Explore Projects</Link>
            </Button>
            <Button size="lg" variant="outline-primary" asChild>
              <Link to="/start-project">Start Your Project</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HowItWorksPage;
