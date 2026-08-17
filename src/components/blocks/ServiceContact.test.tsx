import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ServiceContact } from "./ServiceContact";

import en from "@/lib/i18n/dictionaries/en.json";
import { serviceInterestFor } from "@/lib/service-interest";
import { serviceRouteKeys } from "@/lib/routes";

/**
 * The form at the foot of every service page.
 *
 * The thing worth testing is not that it renders — it is that the lead
 * arrives labelled. A form that posts the wrong `service_interest`, or none,
 * looks perfect on screen and quietly loses the one piece of context the page
 * was in a position to supply.
 */

let fetchSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchSpy = vi.fn().mockResolvedValue({ ok: true, status: 200 });
  vi.stubGlobal("fetch", fetchSpy);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

async function submit(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/Name/), "Ada Lovelace");
  await user.type(screen.getByLabelText(/Email/), "ada@example.com");
  await user.click(screen.getByRole("button", { name: en.leadForm.submit }));
}

function payload() {
  const call = fetchSpy.mock.calls.find(([url]) => url === "/api/lead");
  expect(call, "no POST to /api/lead").toBeDefined();
  return JSON.parse(call![1].body);
}

describe("ServiceContact", () => {
  it("renders the heading and sub-line from the dictionary", () => {
    render(
      <ServiceContact
        t={en}
        serviceInterest={serviceInterestFor("aiAutomation")}
      />,
    );

    expect(
      screen.getByRole("heading", { name: en.serviceContact.heading }),
    ).toBeInTheDocument();
    expect(screen.getByText(en.serviceContact.body)).toBeInTheDocument();
  });

  it("offers booking beside the form, opened safely", () => {
    render(
      <ServiceContact
        t={en}
        serviceInterest={serviceInterestFor("aiAutomation")}
      />,
    );

    const book = screen.getByRole("link", { name: en.cta.bookCall });
    expect(book).toHaveAttribute("target", "_blank");
    expect(book).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("is compact: no phone or company field to abandon", () => {
    render(
      <ServiceContact
        t={en}
        serviceInterest={serviceInterestFor("aiAutomation")}
      />,
    );

    expect(screen.getByLabelText(/Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Message/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Company/)).not.toBeInTheDocument();
    // "Phone" also names the booking card's number, so scope to the form.
    const form = document.querySelector("form")!;
    expect(within(form).queryByLabelText(/Phone/)).not.toBeInTheDocument();
  });

  it.each(serviceRouteKeys)(
    "posts service_page and the right service_interest from %s",
    async (key) => {
      const user = userEvent.setup();
      render(
        <ServiceContact t={en} serviceInterest={serviceInterestFor(key)} />,
      );

      await submit(user);

      await waitFor(() => {
        const body = payload();
        expect(body.source).toBe("service_page");
        expect(body.service_interest).toBe(serviceInterestFor(key));
        expect(body.email).toBe("ada@example.com");
      });
    },
  );

  it("carries the honeypot, and never sends it as a real field", async () => {
    const user = userEvent.setup();
    render(
      <ServiceContact
        t={en}
        serviceInterest={serviceInterestFor("webDevelopment")}
      />,
    );

    await submit(user);

    await waitFor(() => {
      // Present and empty: a bot filling it is what the route discards on.
      expect(payload().website_url).toBe("");
    });
  });

  it("shows the success state with a booking link, replacing the form", async () => {
    const user = userEvent.setup();
    render(
      <ServiceContact
        t={en}
        serviceInterest={serviceInterestFor("aiConsultancy")}
      />,
    );

    await submit(user);

    const status = await screen.findByRole("status");
    expect(status).toHaveTextContent(en.leadForm.successTitle);
    expect(
      within(status).getByRole("link", { name: en.cta.bookCall }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/Message/)).not.toBeInTheDocument();
  });

  it("surfaces a 429 without pretending the lead was saved", async () => {
    fetchSpy.mockResolvedValue({ ok: false, status: 429 });
    const user = userEvent.setup();
    render(
      <ServiceContact
        t={en}
        serviceInterest={serviceInterestFor("aiAutomation")}
      />,
    );

    await submit(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      en.leadForm.rateLimited,
    );
  });
});

describe("ServiceContact accessibility", () => {
  it("labels every field, and names errors in text rather than colour", async () => {
    const user = userEvent.setup();
    render(
      <ServiceContact
        t={en}
        serviceInterest={serviceInterestFor("aiAutomation")}
      />,
    );

    // Submit empty to raise both required-field errors.
    await user.click(screen.getByRole("button", { name: en.leadForm.submit }));

    const alerts = await screen.findAllByRole("alert");
    expect(alerts.map((node) => node.textContent)).toEqual([
      en.leadForm.errors.nameRequired,
      en.leadForm.errors.emailRequired,
    ]);

    const name = screen.getByLabelText(/Name/);
    expect(name).toHaveAttribute("aria-invalid", "true");
    // The error is pointed at, so a screen reader reads it with the field.
    expect(name.getAttribute("aria-describedby")).toBe("service-name-error");
    expect(document.getElementById("service-name-error")).toBeInTheDocument();
  });

  it("namespaces its ids so a second form on the page cannot collide", () => {
    render(
      <ServiceContact
        t={en}
        serviceInterest={serviceInterestFor("aiAutomation")}
      />,
    );

    expect(screen.getByLabelText(/Name/)).toHaveAttribute("id", "service-name");
    const ids = [...document.querySelectorAll("[id]")].map((n) => n.id);
    expect(new Set(ids).size, "duplicate id in the rendered block").toBe(
      ids.length,
    );
  });
});
