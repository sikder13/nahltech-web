import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ChatWidget } from "./ChatWidget";

import { LEAD_FORM_TOKEN } from "@/lib/chat-format";
import en from "@/lib/i18n/dictionaries/en.json";

const createConversationMock = vi.fn<() => Promise<string | null>>();
const logMessageMock =
  vi.fn<(id: string | null, role: string, content: string) => Promise<void>>();

vi.mock("@/lib/chat-log", () => ({
  createConversation: () => createConversationMock(),
  logMessage: (id: string | null, role: string, content: string) =>
    logMessageMock(id, role, content),
}));

const CONVERSATION_ID = "11111111-2222-4333-8444-555555555555";

const labels = {
  launcherLabel: en.chat.launcherLabel,
  closeLabel: en.chat.closeLabel,
  title: en.chat.title,
  placeholder: en.chat.placeholder,
  send: en.chat.send,
  conversationLabel: en.chat.conversationLabel,
  youLabel: en.chat.youLabel,
  assistantLabel: en.chat.assistantLabel,
  fallback: en.chat.fallback,
  consentPrompt: en.chat.consentPrompt,
  consentButton: en.chat.consentButton,
  consentSuccess: en.chat.consentSuccess,
  captureChip: en.chat.captureChip,
  captureChipDismiss: en.chat.captureChipDismiss,
  rateLimited: en.leadForm.rateLimited,
  networkError: en.leadForm.networkError,
  callLabel: en.cta.callLabel,
  bookCall: en.cta.bookCall,
};

const consentLabels = {
  name: en.leadForm.name,
  email: en.leadForm.email,
  phone: en.leadForm.phone,
  message: en.leadForm.message,
  submit: en.chat.consentButton,
  sending: en.leadForm.sending,
  rateLimited: en.leadForm.rateLimited,
  networkError: en.leadForm.networkError,
  errors: {
    nameRequired: en.leadForm.errors.nameRequired,
    emailRequired: en.leadForm.errors.emailRequired,
    emailInvalid: en.leadForm.errors.emailInvalid,
  },
};

/** A fetch Response whose body streams `chunks` as UTF-8, like /api/chat. */
function streamingResponse(chunks: string[]) {
  const encoder = new TextEncoder();
  return {
    ok: true,
    status: 200,
    body: new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
        controller.close();
      },
    }),
  };
}

let fetchSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  createConversationMock.mockResolvedValue(CONVERSATION_ID);
  logMessageMock.mockResolvedValue(undefined);
  fetchSpy = vi.fn().mockResolvedValue(streamingResponse(["Hi ", "there."]));
  vi.stubGlobal("fetch", fetchSpy);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

function renderWidget() {
  return render(<ChatWidget labels={labels} consentLabels={consentLabels} />);
}

const launcher = () =>
  screen.getByRole("button", { name: en.chat.launcherLabel });

async function open(user: ReturnType<typeof userEvent.setup>) {
  await user.click(launcher());
  return screen.findByRole("dialog", { name: en.chat.title });
}

const repliesLogged = () =>
  logMessageMock.mock.calls.filter(([, role]) => role === "assistant").length;

/** Type `message`, send it, and wait for the reply to finish streaming. */
async function exchange(
  user: ReturnType<typeof userEvent.setup>,
  message: string,
  reply: string[],
) {
  const before = repliesLogged();
  fetchSpy.mockResolvedValue(streamingResponse(reply));
  await user.type(screen.getByLabelText(en.chat.placeholder), message);
  await user.click(screen.getByRole("button", { name: en.chat.send }));
  // The logged reply is the last thing the send path does, so it is the
  // signal that the stream drained and state settled.
  await waitFor(() => expect(repliesLogged()).toBeGreaterThan(before));
}

const consentSubmit = () =>
  screen.queryByRole("button", { name: en.chat.consentButton });

describe("ChatWidget", () => {
  it("renders only the launcher until it is opened", () => {
    renderWidget();

    expect(launcher()).toHaveAttribute("aria-expanded", "false");
    // The panel chunk has not been requested, so nothing else is on the page.
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(createConversationMock).not.toHaveBeenCalled();
  });

  it("opens, focuses the input, and closes on Escape with focus restored", async () => {
    const user = userEvent.setup();
    renderWidget();

    await open(user);
    const input = screen.getByLabelText(en.chat.placeholder);
    await waitFor(() => expect(input).toHaveFocus());

    await user.keyboard("{Escape}");

    await waitFor(() =>
      expect(launcher()).toHaveAttribute("aria-expanded", "false"),
    );
    // A keyboard visitor lands back on the control they came from.
    expect(launcher()).toHaveFocus();
  });

  it("creates one conversation row on first open only", async () => {
    const user = userEvent.setup();
    renderWidget();

    await open(user);
    await waitFor(() =>
      expect(createConversationMock).toHaveBeenCalledTimes(1),
    );

    await user.keyboard("{Escape}");
    await user.click(launcher());

    expect(createConversationMock).toHaveBeenCalledTimes(1);
  });

  it("streams the reply and logs both turns", async () => {
    const user = userEvent.setup();
    renderWidget();

    await open(user);
    await user.type(
      screen.getByLabelText(en.chat.placeholder),
      "What is the audit?",
    );
    await user.click(screen.getByRole("button", { name: en.chat.send }));

    expect(await screen.findByText(/Hi there\./)).toBeInTheDocument();
    await waitFor(() => {
      expect(logMessageMock).toHaveBeenCalledWith(
        CONVERSATION_ID,
        "user",
        "What is the audit?",
      );
      expect(logMessageMock).toHaveBeenCalledWith(
        CONVERSATION_ID,
        "assistant",
        "Hi there.",
      );
    });
  });

  it("keeps the thread alive when logging fails", async () => {
    // Logging is for our benefit. A failed insert must not cost the visitor
    // their conversation.
    createConversationMock.mockResolvedValue(null);
    logMessageMock.mockRejectedValue(new Error("rls denied"));
    const user = userEvent.setup();
    renderWidget();

    await open(user);
    await user.type(screen.getByLabelText(en.chat.placeholder), "hello");
    await user.click(screen.getByRole("button", { name: en.chat.send }));

    expect(await screen.findByText(/Hi there\./)).toBeInTheDocument();
  });

  it("shows the retry message on a 429 without adding a reply", async () => {
    fetchSpy.mockResolvedValue({ ok: false, status: 429, body: null });
    const user = userEvent.setup();
    renderWidget();

    await open(user);
    await user.type(screen.getByLabelText(en.chat.placeholder), "hello");
    await user.click(screen.getByRole("button", { name: en.chat.send }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(en.leadForm.rateLimited);
    expect(alert).toHaveTextContent(en.cta.callLabel);
  });

  it("offers consent capture after contact details appear, and posts the conversation id", async () => {
    const user = userEvent.setup();
    renderWidget();

    await open(user);
    await user.type(
      screen.getByLabelText(en.chat.placeholder),
      "reach me at ada@example.com",
    );
    await user.click(screen.getByRole("button", { name: en.chat.send }));

    // Offered, never auto-filled: the detector only reveals the form.
    const consentSubmit = await screen.findByRole("button", {
      name: en.chat.consentButton,
    });
    expect(screen.getByLabelText(/Name/)).toHaveValue("");

    await user.type(screen.getByLabelText(/Name/), "Ada Lovelace");
    await user.type(screen.getByLabelText(/Email/), "ada@example.com");

    fetchSpy.mockResolvedValue({ ok: true, status: 200 });
    await user.click(consentSubmit);

    await waitFor(() => {
      const leadCall = fetchSpy.mock.calls.find(([url]) => url === "/api/lead");
      expect(leadCall).toBeDefined();
      const payload = JSON.parse(leadCall![1].body);
      expect(payload.source).toBe("chat_widget");
      expect(payload.conversation_id).toBe(CONVERSATION_ID);
      expect(payload.email).toBe("ada@example.com");
    });

    expect(await screen.findByRole("status")).toHaveTextContent(
      en.chat.consentSuccess,
    );
  });
});

describe("ChatWidget: the lead signal token", () => {
  const REPLY = "Great — drop your details below and the team will reach out.";

  it("opens the form, and shows the token to nobody", async () => {
    // Defect B: a conversation could qualify completely and never surface a
    // form. The model now asks for it, and this is that path end to end.
    const user = userEvent.setup();
    renderWidget();
    const dialog = await open(user);

    expect(consentSubmit()).not.toBeInTheDocument();
    await exchange(user, "yes please, have someone call me", [
      `${REPLY}\n\n`,
      LEAD_FORM_TOKEN,
    ]);

    expect(await screen.findByText(REPLY, { exact: false })).toBeVisible();
    expect(consentSubmit()).toBeInTheDocument();
    // Neither the visible panel nor the transcript we keep may carry it.
    expect(dialog).not.toHaveTextContent("LEAD_FORM");
    expect(logMessageMock).toHaveBeenCalledWith(
      CONVERSATION_ID,
      "assistant",
      REPLY,
    );
  });

  it("puts the cursor in the first field, since the visitor just asked", async () => {
    const user = userEvent.setup();
    renderWidget();
    await open(user);

    await exchange(user, "can someone call me", [
      `${REPLY}\n${LEAD_FORM_TOKEN}`,
    ]);

    await waitFor(() => expect(screen.getByLabelText(/Name/)).toHaveFocus());
  });

  it("posts the conversation id with the lead the token asked for", async () => {
    const user = userEvent.setup();
    renderWidget();
    await open(user);
    await exchange(user, "please have the team reach out", [
      `${REPLY}\n${LEAD_FORM_TOKEN}`,
    ]);

    await user.type(screen.getByLabelText(/Name/), "Ada Lovelace");
    await user.type(screen.getByLabelText(/Email/), "ada@example.com");

    fetchSpy.mockResolvedValue({ ok: true, status: 200 });
    await user.click(consentSubmit()!);

    await waitFor(() => {
      const leadCall = fetchSpy.mock.calls.find(([url]) => url === "/api/lead");
      expect(leadCall).toBeDefined();
      const payload = JSON.parse(leadCall![1].body);
      expect(payload.source).toBe("chat_widget");
      expect(payload.conversation_id).toBe(CONVERSATION_ID);
    });
  });

  it("never replays the token to the model as history", async () => {
    // If it came back as history the model would read it as its own past
    // behaviour and repeat it, and the form would reopen every turn.
    const user = userEvent.setup();
    renderWidget();
    await open(user);

    await exchange(user, "have someone call me", [
      `${REPLY}\n${LEAD_FORM_TOKEN}`,
    ]);
    await exchange(user, "thanks", ["Any time."]);

    const lastChat = fetchSpy.mock.calls
      .filter(([url]) => url === "/api/chat")
      .at(-1);
    expect(lastChat![1].body).not.toContain("LEAD_FORM");
    expect(JSON.parse(lastChat![1].body).history).toContainEqual({
      role: "assistant",
      content: REPLY,
    });
  });
});

describe("ChatWidget: markdown that leaked to production", () => {
  it("renders the text without asterisks or bullet markers", async () => {
    // Defect A. The prompt forbids markdown; this is the renderer holding the
    // line when the model emits it anyway.
    const user = userEvent.setup();
    renderWidget();
    const dialog = await open(user);

    await exchange(user, "what do you offer", [
      "The **audit** is **$2,500**.\n",
      "- one\n- two",
    ]);

    expect(dialog).toHaveTextContent("The audit is $2,500.");
    expect(dialog.textContent).not.toContain("**");
    expect(dialog.textContent).not.toContain("- one");
  });

  it("logs what the model actually wrote, asterisks and all", async () => {
    // The scrub is cosmetic. If it also cleaned the transcript, a prompt
    // regression would be invisible in the database that exists to catch it.
    const user = userEvent.setup();
    renderWidget();
    await open(user);

    await exchange(user, "what do you offer", ["The **audit** is **$2,500**."]);

    expect(logMessageMock).toHaveBeenCalledWith(
      CONVERSATION_ID,
      "assistant",
      "The **audit** is **$2,500**.",
    );
  });
});

describe("ChatWidget: the standing offer chip", () => {
  const NEUTRAL = ["Understood."];

  async function sendPlainMessages(
    user: ReturnType<typeof userEvent.setup>,
    count: number,
  ) {
    for (let i = 0; i < count; i += 1) {
      await exchange(user, `question number ${"x".repeat(i + 1)}`, NEUTRAL);
    }
  }

  it("stays out of the way for the first two messages", async () => {
    const user = userEvent.setup();
    renderWidget();
    await open(user);

    await sendPlainMessages(user, 2);

    expect(
      screen.queryByRole("button", { name: en.chat.captureChip }),
    ).not.toBeInTheDocument();
  });

  it("appears on the third visitor message and opens the form", async () => {
    const user = userEvent.setup();
    renderWidget();
    await open(user);

    await sendPlainMessages(user, 3);

    const chip = await screen.findByRole("button", {
      name: en.chat.captureChip,
    });
    await user.click(chip);

    expect(consentSubmit()).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: en.chat.captureChip }),
    ).not.toBeInTheDocument();
  });

  it("stays dismissed for the rest of the conversation", async () => {
    const user = userEvent.setup();
    renderWidget();
    await open(user);
    await sendPlainMessages(user, 3);

    await user.click(
      screen.getByRole("button", { name: en.chat.captureChipDismiss }),
    );
    expect(
      screen.queryByRole("button", { name: en.chat.captureChip }),
    ).not.toBeInTheDocument();

    // Two more messages, each of which would re-arm a naive counter.
    await sendPlainMessages(user, 2);

    expect(
      screen.queryByRole("button", { name: en.chat.captureChip }),
    ).not.toBeInTheDocument();
  });

  it("does not appear when the assistant already opened the form", async () => {
    const user = userEvent.setup();
    renderWidget();
    await open(user);

    await exchange(user, "have someone contact me", [
      `On it.\n${LEAD_FORM_TOKEN}`,
    ]);
    await sendPlainMessages(user, 3);

    expect(
      screen.queryByRole("button", { name: en.chat.captureChip }),
    ).not.toBeInTheDocument();
  });
});
