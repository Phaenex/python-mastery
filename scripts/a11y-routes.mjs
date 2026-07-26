/**
 * Shared page inventory for browser accessibility gates.
 *
 * Dynamic routes come from the target deployment itself. That distinction matters when
 * auditing production: importing the local curriculum would let a stale deployment be
 * "verified" against routes it does not contain, or omit routes production does contain.
 */

export const STATIC_PAGE_ROUTES = [
  '/',
  '/start',
  '/learn',
  '/projects',
  '/stats',
  '/glossary',
  '/next-steps',
  '/review',
];

export const NOT_FOUND_ROUTE = '/definitely-not-a-real-page';

// These retain the expensive light/dark × desktop/phone matrix across distinct lesson
// families. Every other lesson and project still receives the baseline audit.
export const MATRIX_CONTENT_ROUTES = [
  '/learn/start-here/how-this-works',
  '/learn/ai-python/embeddings',
  '/learn/databases-python/sql-injection',
  '/learn/game-dev-pygame/pygame-basics',
  '/projects/ai-doc-assistant',
];

export class A11yInventoryError extends Error {
  constructor(message) {
    super(message);
    this.name = 'A11yInventoryError';
  }
}

const isPositiveInteger = (value) => Number.isInteger(value) && value > 0;

/**
 * Validate untrusted JSON returned by a target deployment.
 *
 * @returns the normalized inventory plus route groups used by the gates
 */
export function validateRouteInventory(value) {
  if (!value || typeof value !== 'object') {
    throw new A11yInventoryError('inventory is not a JSON object');
  }
  if (value.version !== 1) {
    throw new A11yInventoryError(`unsupported inventory version ${String(value.version)}`);
  }
  if (!value.counts || typeof value.counts !== 'object') {
    throw new A11yInventoryError('inventory counts are missing');
  }

  const { modules, lessons, projects } = value.counts;
  if (![modules, lessons, projects].every(isPositiveInteger)) {
    throw new A11yInventoryError('module, lesson, and project counts must be positive integers');
  }
  if (!Array.isArray(value.lessonRoutes) || !Array.isArray(value.projectRoutes)) {
    throw new A11yInventoryError('lessonRoutes and projectRoutes must be arrays');
  }
  if (value.lessonRoutes.length !== lessons || value.projectRoutes.length !== projects) {
    throw new A11yInventoryError(
      `declared ${lessons} lessons/${projects} projects but received ` +
      `${value.lessonRoutes.length}/${value.projectRoutes.length} routes`,
    );
  }

  const lessonPattern = /^\/learn\/[^/]+\/[^/]+$/;
  const projectPattern = /^\/projects\/[^/]+$/;
  const invalidLessons = value.lessonRoutes.filter(
    (route) => typeof route !== 'string' || !lessonPattern.test(route),
  );
  const invalidProjects = value.projectRoutes.filter(
    (route) => typeof route !== 'string' || !projectPattern.test(route),
  );
  if (invalidLessons.length || invalidProjects.length) {
    throw new A11yInventoryError(
      `invalid route shape: ${[...invalidLessons, ...invalidProjects].slice(0, 3).join(', ')}`,
    );
  }

  const contentRoutes = [...value.lessonRoutes, ...value.projectRoutes];
  if (new Set(contentRoutes).size !== contentRoutes.length) {
    throw new A11yInventoryError('inventory contains duplicate routes');
  }
  const moduleSlugs = new Set(value.lessonRoutes.map((route) => route.split('/')[2]));
  if (moduleSlugs.size !== modules) {
    throw new A11yInventoryError(
      `declared ${modules} modules but lesson routes contain ${moduleSlugs.size}`,
    );
  }

  const missingMatrixRoutes = MATRIX_CONTENT_ROUTES.filter(
    (route) => !contentRoutes.includes(route),
  );
  if (missingMatrixRoutes.length) {
    throw new A11yInventoryError(
      `representative routes missing from catalog: ${missingMatrixRoutes.join(', ')}`,
    );
  }

  return {
    version: 1,
    counts: { modules, lessons, projects },
    lessonRoutes: [...value.lessonRoutes],
    projectRoutes: [...value.projectRoutes],
    contentRoutes,
    allPageRoutes: [...STATIC_PAGE_ROUTES, ...contentRoutes, NOT_FOUND_ROUTE],
  };
}

export async function loadRouteInventory(base, options = {}) {
  const fetchImpl = options.fetchImpl || fetch;
  const timeout = options.timeout ?? 15000;
  const url = `${String(base).replace(/\/+$/, '')}/api/a11y/routes`;
  let response;
  try {
    response = await fetchImpl(url, { signal: AbortSignal.timeout(timeout) });
  } catch (error) {
    throw new A11yInventoryError(
      `could not fetch ${url}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  if (!response.ok) {
    throw new A11yInventoryError(`${url} returned HTTP ${response.status}`);
  }

  let value;
  try {
    value = await response.json();
  } catch (error) {
    throw new A11yInventoryError(
      `${url} did not return JSON: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  return validateRouteInventory(value);
}

/**
 * Keep catalog-wide static scans in the deterministic loading state. Spawning and
 * tearing down 117 Pyodide workers would spend minutes repeatedly initializing the same
 * runtime while adding no structural coverage. Dedicated runtime gates use real workers
 * and exercise ready, success, and error states.
 */
export async function prepareStaticAuditPage(page) {
  await page.addInitScript(() => {
    localStorage.setItem('python-mastery-onboarding-seen', '1');
    class IdleAuditWorker {
      onmessage = null;
      onerror = null;
      postMessage() {}
      terminate() {}
      addEventListener() {}
      removeEventListener() {}
    }
    Object.defineProperty(window, 'Worker', {
      configurable: true,
      writable: true,
      value: IdleAuditWorker,
    });
  });
}
