import { getSupabaseBrowserClient } from "@/lib/supabase/client";

import type {
  ChatConversationInsert,
  ChatMessageInsert,
} from "@/lib/supabase/types";

/**
 * Anon-role chat logging from the browser (ARCH-1 §4.2).
 *
 * Every function here fails soft. Logging is for our benefit, not the
 * visitor's — a conversation must keep working when the insert does not, so
 * failures warn to the console and nothing else.
 *
 * The anon role has no SELECT privilege anywhere, so `INSERT ... RETURNING`
 * is unavailable: ids are generated here and inserted explicitly.
 */

const SESSION_KEY = "nahltech:chat-session";

/**
 * Session storage, not local storage.
 *
 * A chat session is scoped to the browsing session by design. Persisting a
 * conversation id across days would quietly link visits that the visitor has
 * no reason to expect are linked, for a feature that gains nothing from it.
 */
function readSessionId(): string {
  try {
    const existing = window.sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;

    const created = crypto.randomUUID();
    window.sessionStorage.setItem(SESSION_KEY, created);
    return created;
  } catch {
    // Private mode, or storage disabled. An ephemeral id still groups the
    // messages of this page view.
    return crypto.randomUUID();
  }
}

export async function createConversation(): Promise<string | null> {
  const client = getSupabaseBrowserClient();
  if (!client) return null;

  const id = crypto.randomUUID();
  const row: ChatConversationInsert = {
    id,
    session_id: readSessionId(),
    landing_page: `${window.location.pathname}${window.location.search}`.slice(
      0,
      500,
    ),
    locale: document.documentElement.lang || "en",
    user_agent: navigator.userAgent.slice(0, 500),
  };

  try {
    const { error } = await client.from("chat_conversations").insert(row);
    if (error) {
      console.warn("[chat] conversation not logged", error.message);
      return null;
    }
    return id;
  } catch (error) {
    console.warn("[chat] conversation not logged", error);
    return null;
  }
}

export async function logMessage(
  conversationId: string | null,
  role: "user" | "assistant",
  content: string,
): Promise<void> {
  if (!conversationId || !content) return;

  const client = getSupabaseBrowserClient();
  if (!client) return;

  const row: ChatMessageInsert = {
    id: crypto.randomUUID(),
    conversation_id: conversationId,
    role,
    // The column enforces 8000; truncate rather than have the insert rejected.
    content: content.slice(0, 8000),
  };

  try {
    const { error } = await client.from("chat_messages").insert(row);
    if (error) console.warn("[chat] message not logged", error.message);
  } catch (error) {
    console.warn("[chat] message not logged", error);
  }
}
