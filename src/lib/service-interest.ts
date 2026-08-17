import { serviceRouteKeys, type ServiceKey } from "@/lib/routes";

import type { ServiceInterest } from "@/lib/supabase/types";

/**
 * Which page a lead came from, as the database spells it.
 *
 * The route keys are camelCase because they index the dictionary; the enum is
 * snake_case because it is Postgres. The two happen to line up word for word
 * today, so this could have been a `toSnakeCase` call — and that is exactly
 * why it is written out instead. A derived mapping silently invents a value
 * the moment a sixth service is added with a name the enum does not carry,
 * and the failure would land as a rejected lead at the point of submission.
 *
 * `satisfies Record<ServiceKey, ServiceInterest>` makes both halves checked:
 * every service page must appear, and every value must already exist in the
 * enum. Adding a service without adding its enum value fails the build rather
 * than the visitor. `service-interest.test.ts` re-checks it against the
 * migration files, so the type is not the only thing standing behind it.
 */
export const serviceInterestByPage = {
  aiConsultancy: "ai_consultancy",
  aiSearchVisibility: "ai_search_visibility",
  aiAutomation: "ai_automation",
  webDevelopment: "web_development",
  softwareDevelopment: "software_development",
} as const satisfies Record<ServiceKey, ServiceInterest>;

export function serviceInterestFor(key: ServiceKey): ServiceInterest {
  return serviceInterestByPage[key];
}

/** Every service page is mapped — asserted here as well as by the type. */
export const mappedServiceKeys = serviceRouteKeys;
