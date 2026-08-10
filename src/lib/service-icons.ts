import type { IconName } from "@/components/ui/Icon";
import type { ServiceKey } from "@/lib/routes";

/**
 * Icons are presentation, not content, so they live here rather than in the
 * dictionary. Keyed by service so nav, grids and hub cards agree.
 */
export const serviceIcons: Record<ServiceKey, IconName> = {
  aiConsultancy: "analyze",
  aiSearchVisibility: "sparkle",
  aiAutomation: "method",
  webDevelopment: "build",
  softwareDevelopment: "app",
};
