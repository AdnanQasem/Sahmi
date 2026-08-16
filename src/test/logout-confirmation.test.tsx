import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { Button } from "@/components/ui/button";
import LogoutConfirmationDialog from "@/components/LogoutConfirmationDialog";

const auth = vi.hoisted(() => ({ logout: vi.fn() }));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ logout: auth.logout }),
}));

beforeEach(() => {
  auth.logout.mockReset();
  auth.logout.mockResolvedValue(undefined);
});

it("requires confirmation before logging out", async () => {
  render(
    <LogoutConfirmationDialog>
      <Button>Log out</Button>
    </LogoutConfirmationDialog>,
  );

  fireEvent.click(screen.getByRole("button", { name: "Log out" }));
  expect(auth.logout).not.toHaveBeenCalled();

  let dialog = screen.getByRole("alertdialog");
  expect(within(dialog).getByText("Log out of your account?")).toBeInTheDocument();
  fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
  expect(auth.logout).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole("button", { name: "Log out" }));
  dialog = screen.getByRole("alertdialog");
  fireEvent.click(within(dialog).getByRole("button", { name: "Log out" }));

  await waitFor(() => expect(auth.logout).toHaveBeenCalledTimes(1));
});
