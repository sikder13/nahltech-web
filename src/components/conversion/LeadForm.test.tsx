import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LeadForm } from "./LeadForm";

import en from "@/lib/i18n/dictionaries/en.json";
import { bookingUrl } from "@/lib/routes";

const cta = { callLabel: en.cta.callLabel, bookCall: en.cta.bookCall };

let fetchSpy: ReturnType<typeof vi.fn>;

function ok(status = 200) {
  return { ok: status >= 200 && status < 300, status };
}

beforeEach(() => {
  fetchSpy = vi.fn().mockResolvedValue(ok());
  vi.stubGlobal("fetch", fetchSpy);
  vi.spyOn(console, "info").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function renderForm() {
  return render(<LeadForm labels={en.leadForm} cta={cta} />);
}

async function fillValid(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/Name/), "Test Person");
  await user.type(screen.getByLabelText(/Email/), "person@example.com");
}

function submit(user: ReturnType<typeof userEvent.setup>) {
  return user.click(screen.getByRole("button", { name: en.leadForm.submit }));
}

describe("LeadForm", () => {
  it("shows a field error for an invalid email and does not submit", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/Name/), "Test Person");
    await user.type(screen.getByLabelText(/Email/), "not-an-email");
    await submit(user);

    const error = await screen.findByRole("alert");
    expect(error).toHaveTextContent(en.leadForm.errors.emailInvalid);
    expect(screen.getByLabelText(/Email/)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    // The round trip is saved: nothing leaves the browser.
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("requires a name", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/Email/), "person@example.com");
    await submit(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      en.leadForm.errors.nameRequired,
    );
  });

  it("posts to /api/lead with the source, honeypot and attribution", async () => {
    const user = userEvent.setup();
    renderForm();

    await fillValid(user);
    await submit(user);
    await screen.findByRole("status");

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("/api/lead");
    const payload = JSON.parse(init.body);
    expect(payload.email).toBe("person@example.com");
    expect(payload.source).toBe("contact_form");
    // Untouched trap travels as an empty string, which the route reads as human.
    expect(payload.website_url).toBe("");
    expect(payload).toHaveProperty("landing_page");
    expect(payload).toHaveProperty("referrer");
  });

  it("offers booking first and the phone number alongside it on success", async () => {
    const user = userEvent.setup();
    renderForm();

    await fillValid(user);
    await submit(user);

    const success = await screen.findByRole("status");
    expect(success).toHaveTextContent(en.leadForm.successTitle);

    const book = screen.getByRole("link", { name: en.cta.bookCall });
    expect(book).toHaveAttribute("href", bookingUrl!);
    expect(book).toHaveAttribute("target", "_blank");
    expect(book).toHaveAttribute("rel", "noopener noreferrer");

    // Phone stays as the second option rather than being replaced.
    expect(
      screen.getByRole("link", { name: en.cta.callLabel }),
    ).toHaveAttribute("href", "tel:+13175074303");
  });

  it("still shows success when the insert failed behind a 200", async () => {
    // The route answers 200 after firing the fallback email, so the visitor
    // must not see an error (hard rule 6).
    fetchSpy.mockResolvedValue(ok());
    const user = userEvent.setup();
    renderForm();

    await fillValid(user);
    await submit(user);

    expect(await screen.findByRole("status")).toHaveTextContent(
      en.leadForm.successTitle,
    );
  });

  it("shows the retry message on a 429", async () => {
    fetchSpy.mockResolvedValue(ok(429));
    const user = userEvent.setup();
    renderForm();

    await fillValid(user);
    await submit(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      en.leadForm.rateLimited,
    );
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("falls back to the phone number when the network fails", async () => {
    fetchSpy.mockRejectedValue(new Error("offline"));
    const user = userEvent.setup();
    renderForm();

    await fillValid(user);
    await submit(user);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(en.leadForm.networkError);
    expect(alert).toHaveTextContent(en.cta.callLabel);
  });

  it("treats phone, company and message as optional", async () => {
    const user = userEvent.setup();
    renderForm();

    await fillValid(user);
    await submit(user);

    expect(await screen.findByRole("status")).toBeInTheDocument();
  });
});
