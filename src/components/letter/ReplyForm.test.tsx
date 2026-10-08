import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ReplyForm } from "./ReplyForm";

const labels = {
  placeholder: "Your phone or email, and one line if you like",
  send: "Send",
  success: "Got it. I will reply within one business day.",
  failure: "That did not go through. Text me at (317) 507-4303.",
};

let fetchSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchSpy = vi.fn().mockResolvedValue({ ok: true, status: 200 });
  vi.stubGlobal("fetch", fetchSpy);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function renderForm() {
  return render(
    <ReplyForm
      token="quinton-residential-2419d6c0f8"
      labels={labels}
      maxLength={2000}
    />,
  );
}

describe("ReplyForm", () => {
  it("is one text field and one button", () => {
    const { container } = renderForm();

    expect(screen.getAllByRole("textbox")).toHaveLength(1);
    expect(screen.getByRole("textbox")).toHaveAttribute(
      "placeholder",
      labels.placeholder,
    );
    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Send" })).toBeInTheDocument();
    // The only other control is the trap, which no reader can reach.
    expect(container.querySelectorAll("input, textarea, select")).toHaveLength(
      2,
    );
  });

  it("sends the page token and exactly what was typed, nothing else", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByRole("textbox"), "317-555-0142, mornings");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("/api/reply");
    expect(JSON.parse(init.body)).toEqual({
      token: "quinton-residential-2419d6c0f8",
      text: "317-555-0142, mornings",
      website_url: "",
    });
  });

  it("replaces the form with the one success line and moves focus to it", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByRole("textbox"), "317-555-0142");
    await user.click(screen.getByRole("button", { name: "Send" }));

    const done = await screen.findByText(labels.success);
    expect(done).toHaveFocus();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows the text-me line when the reply is not stored", async () => {
    fetchSpy.mockResolvedValue({ ok: false, status: 500 });
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByRole("textbox"), "317-555-0142");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(labels.failure);
    // Still there, so the reader can try again.
    expect(screen.getByRole("textbox")).toHaveValue("317-555-0142");
  });

  it("shows the same line when the network fails", async () => {
    fetchSpy.mockRejectedValue(new Error("offline"));
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByRole("textbox"), "317-555-0142");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(labels.failure);
  });

  it("sends on Enter, as a one-line field would", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByRole("textbox"), "317-555-0142{Enter}");

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(await screen.findByText(labels.success)).toBeInTheDocument();
  });

  it("sends nothing for an empty box", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
