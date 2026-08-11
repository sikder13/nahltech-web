import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { z } from "zod";

import { trimHistoryToBudget } from "@/lib/chat-history";
import { CHAT_SYSTEM_PROMPT } from "@/lib/chat-prompt";
import { defaultLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { checkLimit, clientIpFrom } from "@/lib/rate-limit";

/**
 * POST /api/chat — the hardened Anthropic proxy (ARCH-1 §4.2).
 *
 * The browser never sees the API key and never supplies the system prompt.
 * Everything the client sends is treated as untrusted: roles are restricted to
 * user and assistant, history is capped in both turns and characters, and
 * unknown properties are stripped rather than forwarded.
 *
 * The old site's audit found an unlimited AI proxy. Two rate-limit windows
 * and a fixed token ceiling make that specific bill impossible to run up here.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = "claude-haiku-4-5-20251001";
const MAX_TOKENS = 400;
const MAX_MESSAGE_CHARS = 1000;
const MAX_HISTORY_TURNS = 20;
const MAX_HISTORY_CHARS_PER_TURN = 2000;

const turnSchema = z.object({
  // 'system' is deliberately absent: the system prompt is ours, and a client
  // that tries to supply one gets a 400 rather than a silent strip.
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(MAX_HISTORY_CHARS_PER_TURN),
});

const chatSchema = z.object({
  message: z.string().trim().min(1).max(MAX_MESSAGE_CHARS),
  history: z.array(turnSchema).max(MAX_HISTORY_TURNS).optional(),
});

export async function POST(request: Request) {
  const t = await getDictionary(defaultLocale);

  const ip = clientIpFrom(request.headers);
  const limit = await checkLimit(`chat:${ip}`, { perMinute: 10, perDay: 100 });
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, message: t.leadForm.rateLimited },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds) },
      },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const { message } = parsed.data;
  const history = trimHistoryToBudget(parsed.data.history ?? [], message);

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const client = new Anthropic();
        const completion = client.messages.stream({
          model: MODEL,
          max_tokens: MAX_TOKENS,
          system: CHAT_SYSTEM_PROMPT,
          messages: [...history, { role: "user" as const, content: message }],
        });

        for await (const event of completion) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch (error) {
        // Never surface a provider error to a visitor. They get the fallback
        // line and a route to a human; the detail goes to the server log.
        console.error(
          "[chat] anthropic request failed",
          error instanceof Error ? error.message : String(error),
        );
        controller.enqueue(encoder.encode(t.chat.fallback));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
      // Stops a proxy from buffering the whole reply and defeating streaming.
      "x-accel-buffering": "no",
    },
  });
}
