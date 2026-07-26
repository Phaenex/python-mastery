/**
 * Shared gate exit semantics.
 *
 * 0 = everything ran and passed
 * 1 = everything ran, at least one assertion failed
 * 2 = at least one required measurement did not run
 */
export function gateExitCode({ failures = 0, incomplete = 0 }) {
  if (incomplete > 0) return 2;
  if (failures > 0) return 1;
  return 0;
}
