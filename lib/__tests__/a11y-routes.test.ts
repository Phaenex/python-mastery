import { describe, expect, it, vi } from "vitest";
import { getA11yRouteInventory } from "../a11y-routes";
import {
  A11yInventoryError,
  loadRouteInventory,
  validateRouteInventory,
} from "../../scripts/a11y-routes.mjs";
import { gateExitCode } from "../../scripts/a11y-result.mjs";

const inventory = getA11yRouteInventory();

describe("accessibility route inventory", () => {
  it("covers the current canonical catalog", () => {
    expect(inventory.counts).toEqual({
      modules: 18,
      lessons: 111,
      projects: 6,
    });
    expect(new Set(inventory.lessonRoutes).size).toBe(111);
    expect(new Set(inventory.projectRoutes).size).toBe(6);
  });

  it("passes the same validation used by the browser gates", () => {
    const validated = validateRouteInventory(inventory);
    expect(validated.contentRoutes).toHaveLength(117);
    expect(validated.allPageRoutes).toHaveLength(126);
  });

  it("rejects missing, duplicate, and malformed routes", () => {
    expect(() =>
      validateRouteInventory({
        ...inventory,
        lessonRoutes: inventory.lessonRoutes.slice(1),
      }),
    ).toThrow(A11yInventoryError);

    expect(() =>
      validateRouteInventory({
        ...inventory,
        lessonRoutes: [
          ...inventory.lessonRoutes.slice(0, -1),
          inventory.lessonRoutes[0],
        ],
      }),
    ).toThrow(/duplicate/i);

    expect(() =>
      validateRouteInventory({
        ...inventory,
        projectRoutes: [
          ...inventory.projectRoutes.slice(0, -1),
          "/not-a-project",
        ],
      }),
    ).toThrow(/invalid route shape/i);
  });

  it("fails closed when the target cannot provide an inventory", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response("missing", { status: 404 }),
    );
    await expect(
      loadRouteInventory("https://example.test", { fetchImpl }),
    ).rejects.toThrow(/HTTP 404/);
  });

  it("never reports an incomplete gate as passing", () => {
    expect(gateExitCode({ failures: 0, incomplete: 0 })).toBe(0);
    expect(gateExitCode({ failures: 1, incomplete: 0 })).toBe(1);
    expect(gateExitCode({ failures: 0, incomplete: 1 })).toBe(2);
    expect(gateExitCode({ failures: 1, incomplete: 1 })).toBe(2);
  });
});
