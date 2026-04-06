import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Phone, MapPin } from "lucide-react";

const faqs = [
  { q: "How do I start a project on Sahmi?", a: "Click 'Start Your Project' and follow our simple 5-step form. Our team will review your submission within 2-3 business days." },
  { q: "Is my contribution secure?", a: "Yes. All transactions are processed through secure payment providers with bank-level encryption." },
  { q: "What happens if a project doesn't reach its goal?", a: "If a project doesn't reach its minimum funding goal, all contributions are returned to supporters in full." },
  { q: "How are projects verified?", a: "Our team verifies founder identity, reviews business plans, and checks funding allocations before listing any project." },
];

const ContactPage = () => {
  return (
    <div className="min-h-screen">
      <section className="border-b border-border bg-card py-12">
        <div className="container mx-auto max-w-2xl text-center">
          <h1 className="mb-3 text-3xl font-bold text-foreground">Get in Touch</h1>
          <p className="text-muted-foreground">Have questions? We'd love to hear from you.</p>
        </div>
      </section>

      <div className="container max-w-5xl py-12">
        <div className="grid gap-10 md:grid-cols-2">
          {/* Form */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-5 text-xl font-semibold text-foreground">Send Us a Message</h2>
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div>
                <Label>Full Name</Label>
                <Input placeholder="Your name" className="mt-1.5" />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" placeholder="you@example.com" className="mt-1.5" />
              </div>
              <div>
                <Label>Subject</Label>
                <Input placeholder="What's this about?" className="mt-1.5" />
              </div>
              <div>
                <Label>Message</Label>
                <Textarea placeholder="Tell us how we can help..." className="mt-1.5" rows={5} />
              </div>
              <Button className="w-full">Send Message</Button>
            </form>
          </div>

          {/* Info */}
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="mb-4 text-lg font-semibold text-foreground">Contact Information</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <div className="text-sm font-medium text-foreground">Email</div>
                    <div className="text-sm text-muted-foreground">support@sahmi.ps</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <div className="text-sm font-medium text-foreground">Phone</div>
                    <div className="text-sm text-muted-foreground">+970 2 298 0000</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <div className="text-sm font-medium text-foreground">Office</div>
                    <div className="text-sm text-muted-foreground">Ramallah, Palestine</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="mb-4 text-lg font-semibold text-foreground">Frequently Asked Questions</h3>
              <div className="space-y-4">
                {faqs.map((faq) => (
                  <div key={faq.q}>
                    <h4 className="text-sm font-semibold text-foreground">{faq.q}</h4>
                    <p className="mt-1 text-sm text-muted-foreground">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
