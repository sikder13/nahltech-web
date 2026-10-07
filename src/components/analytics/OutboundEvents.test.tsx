import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OutboundEvents } from "./OutboundEvents";

import { track } from "@/lib/analytics";
import { bookingUrl, productLinks } from "@/lib/routes";

vi.mock("@/lib/analytics", () => ({ track: vi.fn() }));

const tracked = vi.mocked(track);

/** Renders a link beside the listener and clicks it without navigating. */
function clickLink(href: string) {
  const { container } = render(
    <>
      <a href={href}>
        <span>link</span>
      </a>
      <OutboundEvents />
    </>,
  );
  const anchor = container.querySelector("a")!;
  anchor.addEventListener("click", (event) => event.preventDefault());
  // Clicked on the child, as a real click on a styled button-link would be.
  anchor.querySelector("span")!.click();
}

beforeEach(() => {
  tracked.mockClear();
});

describe("OutboundEvents", () => {
  it("reports cal_click with the link's domain and URL", () => {
    clickLink(`${bookingUrl}?month=2026-10#slots`);

    expect(tracked).toHaveBeenCalledWith({
      name: "cal_click",
      link_domain: "cal.com",
      // Query and fragment are dropped: Cal.com appends its own parameters.
      link_url: bookingUrl,
    });
  });

  it("reports cal_click for any Cal.com host, not only the booking link", () => {
    clickLink("https://app.cal.com/someone/else");

    expect(tracked).toHaveBeenCalledWith({
      name: "cal_click",
      link_domain: "app.cal.com",
      link_url: "https://app.cal.com/someone/else",
    });
  });

  it("does not treat a domain that merely ends in the same letters as Cal.com", () => {
    clickLink("https://medical.com/intro");

    expect(tracked).not.toHaveBeenCalled();
  });

  it("keeps reporting booking_click alongside cal_click", () => {
    clickLink(bookingUrl!);

    expect(tracked).toHaveBeenCalledWith({ name: "booking_click" });
  });

  it("reports crawlmouse_click and no cal_click for the Crawlmouse link", () => {
    clickLink(productLinks.crawlmouse);

    expect(tracked).toHaveBeenCalledTimes(1);
    expect(tracked).toHaveBeenCalledWith({ name: "crawlmouse_click" });
  });

  it("ignores internal links", () => {
    clickLink("/pricing");

    expect(tracked).not.toHaveBeenCalled();
  });
});
