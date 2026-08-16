import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import { changeLanguage } from "@/i18n";
import ContactPage from "@/pages/ContactPage";
import RegisterPage from "@/pages/RegisterPage";

const services = vi.hoisted(() => ({ sendMessage: vi.fn() }));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ isAuthenticated: false }),
}));

vi.mock("@/services/contactService", () => ({
  default: { sendMessage: services.sendMessage },
}));

beforeEach(async () => {
  vi.stubGlobal("IntersectionObserver", class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
  vi.stubGlobal("ResizeObserver", class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
  await changeLanguage("en");
  services.sendMessage.mockClear();
});

it("redirects a visitor to registration instead of sending the contact form", () => {
  render(
    <MemoryRouter initialEntries={["/contact"]}>
      <Routes>
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </MemoryRouter>,
  );

  expect(screen.getByText("Sign-in required")).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText("Full Name"), { target: { value: "Visitor Name" } });
  fireEvent.change(screen.getByLabelText("Email Address"), { target: { value: "visitor@example.test" } });
  fireEvent.change(screen.getByLabelText("Subject"), { target: { value: "Project question" } });
  fireEvent.change(screen.getByLabelText("Message"), { target: { value: "I would like more information." } });
  fireEvent.click(screen.getByRole("button", { name: "Send Message" }));

  expect(screen.getByText("Create an account or sign in before contacting us. We carried over your name and email.")).toBeInTheDocument();
  expect(screen.getByLabelText("Full name")).toHaveValue("Visitor Name");
  expect(screen.getByLabelText("Email address")).toHaveValue("visitor@example.test");
  expect(services.sendMessage).not.toHaveBeenCalled();
});
