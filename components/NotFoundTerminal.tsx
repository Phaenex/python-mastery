"use client";

import { usePathname } from "next/navigation";

/**
 * The shell-output body of the 404 page.
 *
 * This is split out purely so app/not-found.tsx can be a server component and export
 * metadata: a client component cannot, and without it the 404 shared the bare
 * "python-mastery" title with five other routes. Only the path readout needs the client.
 */
export function NotFoundTerminal() {
  const pathname = usePathname();
  const target = pathname && pathname !== "/" ? pathname : "/the-page";

  return (
    <>
      <p>
        <span className="text-accent">damato@python</span>
        <span className="text-muted-foreground">:</span>
        <span className="text-muted-foreground">~$</span>{" "}
        <span>cd {target}</span>
      </p>
      <p className="mt-2 text-error">
        bash: cd: {target}: No such file or directory
      </p>
    </>
  );
}
