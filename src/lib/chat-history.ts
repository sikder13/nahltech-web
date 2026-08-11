export type ChatTurn = {
  role: "user" | "assistant";
  content: string;
};

/** Ceiling across the whole conversation, current message included. */
export const TOTAL_CHAR_BUDGET = 20_000;

/**
 * Trim history from the front until the whole conversation fits the budget.
 *
 * The current message is never dropped — it is the thing being answered. If it
 * alone exceeded the budget the route's schema would already have rejected it,
 * since the per-message cap is far below the total.
 *
 * Lives here rather than in the route module because Next only permits a fixed
 * set of exports from a route file; exporting a helper from one fails the
 * build with a route-type error.
 */
export function trimHistoryToBudget(
  history: ChatTurn[],
  message: string,
  budget: number = TOTAL_CHAR_BUDGET,
): ChatTurn[] {
  const kept = [...history];
  let total =
    message.length + kept.reduce((sum, turn) => sum + turn.content.length, 0);

  while (kept.length > 0 && total > budget) {
    const dropped = kept.shift();
    total -= dropped?.content.length ?? 0;
  }

  return kept;
}
