import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LeadForm } from "./LeadForm";

import en from "@/lib/i18n/dictionaries/en.json";

let fetchSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchSpy = vi.fn();
  vi.stubGlobal("fetch", fetchSpy);
  vi.spyOn(console, "info").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
});

async function fillValid(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/Name/), "Test Person");
  await user.type(screen.getByLabelText(/Email/), "person@example.com");
}

describe("LeadForm (shell)", () => {
  it("shows a field error for an invalid email and does not submit", async () => {
    const user = userEvent.setup();
    render(<LeadForm labels={en.leadForm} />);

    await user.type(screen.getByLabelText(/Name/), "Test Person");
    await user.type(screen.getByLabelText(/Email/), "not-an-email");
    await user.click(screen.getByRole("button", { name: en.leadForm.submit }));

    const error = await screen.findByRole("alert");
    expect(error).toHaveTextContent(en.leadForm.errors.emailInvalid);
    expect(screen.getByLabelText(/Email/)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    // Still on the form, not the success panel.
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("requires a name", async () => {
    const user = userEvent.setup();
    render(<LeadForm labels={en.leadForm} />);

    await user.type(screen.getByLabelText(/Email/), "person@example.com");
    await user.click(screen.getByRole("button", { name: en.leadForm.submit }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      en.leadForm.errors.nameRequired,
    );
  });

  it("shows the success state on a valid submit", async () => {
    const user = userEvent.setup();
    render(<LeadForm labels={en.leadForm} />);

    await fillValid(user);
    await user.click(screen.getByRole("button", { name: en.leadForm.submit }));

    const success = await screen.findByRole("status");
    expect(success).toHaveTextContent(en.leadForm.successTitle);
    expect(
      screen.queryByRole("button", { name: en.leadForm.submit }),
    ).not.toBeInTheDocument();
  });

  it("makes no network request — /api/lead does not exist until Phase 4", async () => {
    const user = userEvent.setup();
    render(<LeadForm labels={en.leadForm} />);

    await fillValid(user);
    await user.click(screen.getByRole("button", { name: en.leadForm.submit }));
    await screen.findByRole("status");

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("treats phone, company and message as optional", async () => {
    const user = userEvent.setup();
    render(<LeadForm labels={en.leadForm} />);

    // Only the two required fields are filled.
    await fillValid(user);
    await user.click(screen.getByRole("button", { name: en.leadForm.submit }));

    expect(await screen.findByRole("status")).toBeInTheDocument();
  });
});
