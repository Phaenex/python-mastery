import { getA11yRouteInventory } from "@/lib/a11y-routes";

// The catalog changes only when a new deployment changes the source collections.
export const dynamic = "force-static";

export function GET() {
  return Response.json(getA11yRouteInventory());
}
