import type { Lesson } from "../types";

// Packaging and deployment. None of this can literally run in a browser: there is no
// Docker daemon, no PyPI, no server. What is checkable is the reasoning, and the
// reasoning is where people actually get hurt: a lockfile that was never committed, a
// secret baked into an image, a container that ignores SIGTERM, a health check that
// lies. Every challenge drills one of those as ordinary Python.

export const lessonsModuleShipping: Lesson[] = [
  {
    module: "Shipping Python",
    moduleSlug: "shipping-python",
    lessonNumber: 1,
    slug: "dependencies-and-lockfiles",
    title: "Pinning, Locking, and Reproducible Installs",
    badge: "concept",
    theory: `
"It works on my machine" is almost always a dependency story.

\`requirements.txt\` with \`fastapi\` in it does not describe a version. Install it today and
tomorrow and you may get different code. Your machine has whatever you installed months
ago; the server gets whatever is newest.

There are three levels and they are not the same thing:

\`\`\`
fastapi                  # anything. never do this in production
fastapi>=0.110,<0.120    # a range. fine for a library
fastapi==0.115.6         # pinned. fine for an application
\`\`\`

Pinning your direct dependencies is still not enough, because **their** dependencies move
underneath you. That is what a lockfile is for: every package in the whole tree, exact
version, with a hash. \`uv.lock\`, \`poetry.lock\`, \`requirements.txt\` compiled by
\`pip-compile\`.

💡 Key: a library declares ranges so it can coexist with others. An application pins and
commits a lockfile so today's deploy matches yesterday's. Getting these backwards causes
either unresolvable conflicts or unrepeatable builds.

⚠️ Warning: a lockfile that is not committed does nothing. Neither does one that nobody
regenerates, which is how a project ends up pinned to a version with a known CVE for a
year.

✨ Tip: separate what you need to run from what you need to develop. Shipping pytest,
ruff and mypy into a production image makes it bigger and widens the attack surface for
no benefit.
`,
    starterCode: `REQUIREMENTS = """fastapi==0.115.6
uvicorn==0.34.0
pydantic>=2.0
requests
"""

def unpinned(text):
    """Lines that do not pin an exact version."""
    out = []
    for line in text.strip().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "==" not in line:
            out.append(line)
    return out

print("unpinned:", unpinned(REQUIREMENTS))
`,
    examples: [
      {
        title: "Application versus library",
        explanation: "Pin an app for repeatability; use ranges in a library so it can coexist",
        code: `print("app:     fastapi==0.115.6")
print("library: fastapi>=0.110,<0.120")`,
      },
      {
        title: "Splitting dev from runtime",
        explanation: "Test tools do not belong in a production image",
        code: `runtime = {"fastapi", "uvicorn", "psycopg"}
dev = {"pytest", "ruff", "mypy"}
print("shipped:", sorted(runtime))
print("not shipped:", sorted(dev))`,
      },
    ],
    challenges: [
      {
        id: "ship1c1",
        prompt:
          "Using the REQUIREMENTS text in the editor, write unpinned(text) returning the lines with no exact pin, skipping blanks and comments. Print 'unpinned: N'. You should get 2.",
        hint: 'Skip empty lines and ones starting with #, then keep the lines that do not contain "==".',
        validateFn: `return /unpinned:\\s*2/.test(output)`,
        solution: `REQUIREMENTS = """fastapi==0.115.6
uvicorn==0.34.0
pydantic>=2.0
requests
"""

def unpinned(text):
    out = []
    for line in text.strip().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "==" not in line:
            out.append(line)
    return out

print("unpinned:", len(unpinned(REQUIREMENTS)))`,
      },
      {
        id: "ship1c2",
        prompt:
          "Write split_requirements(all_pkgs, dev_pkgs) returning (runtime, dev) as sorted lists, and print the runtime list. It must contain fastapi and uvicorn but not pytest.",
        hint: "Runtime is everything in all_pkgs that is not in dev_pkgs; sort both before returning.",
        validateFn: `return output.includes("fastapi") && output.includes("uvicorn") && !output.includes("pytest")`,
        solution: `def split_requirements(all_pkgs, dev_pkgs):
    runtime = sorted(p for p in all_pkgs if p not in dev_pkgs)
    return runtime, sorted(dev_pkgs)

runtime, dev = split_requirements(
    {"fastapi", "uvicorn", "psycopg", "pytest", "ruff"},
    {"pytest", "ruff"},
)
print(runtime)`,
      },
    ],
  },

  {
    module: "Shipping Python",
    moduleSlug: "shipping-python",
    lessonNumber: 2,
    slug: "config-and-secrets",
    title: "Config from the Environment, Secrets Never in Git",
    badge: "challenge",
    theory: `
One rule, and it has teeth: **a credential must never be written to a path git is not
already ignoring.** Not "we will untrack it later". Untracking does nothing, because git
history is permanent. Once a key is in a pushed commit, the only real remedy is rotating
the key.

The order of operations, every time:

1. Add the pattern to \`.gitignore\` **before** the file exists.
2. Prove it: \`git check-ignore -v .env\` must print a match.
3. Only then write the value.

Config comes from the environment, never from a literal:

\`\`\`python
import os

DATABASE_URL = os.environ["DATABASE_URL"]          # required: fail loudly
LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO")    # optional: sane default
\`\`\`

\`os.environ["X"]\` raises immediately when it is missing. \`os.environ.get("X")\` returns
None and lets your app boot half-configured and fail later somewhere confusing. Use the
first for anything required, and validate at startup rather than at first use.

⚠️ Warning: never log a config object. One \`print(settings)\` or a debug endpoint that
dumps the environment puts every secret in your log aggregator, where far more people can
read it than could read the original.

💡 Key: \`.env.example\` with every key and a placeholder value belongs in git. \`.env\` with
the real values never does.
`,
    starterCode: `import os

def load_config(env):
    """Required keys raise; optional keys get defaults."""
    missing = [k for k in ("DATABASE_URL", "API_KEY") if k not in env]
    if missing:
        raise KeyError(f"missing required config: {', '.join(sorted(missing))}")
    return {
        "database_url": env["DATABASE_URL"],
        "api_key": env["API_KEY"],
        "log_level": env.get("LOG_LEVEL", "INFO"),
    }

print(load_config({"DATABASE_URL": "postgres://x", "API_KEY": "sk-1"})["log_level"])
try:
    load_config({"DATABASE_URL": "postgres://x"})
except KeyError as e:
    print("startup refused:", e)
`,
    examples: [
      {
        title: "Fail at startup, not at first use",
        explanation: "A missing key should stop the boot, not surface an hour later",
        code: `env = {"DATABASE_URL": "postgres://x"}
required = ["DATABASE_URL", "API_KEY"]
missing = [k for k in required if k not in env]
print("missing:", missing, "-> refuse to start" if missing else "-> ok")`,
      },
      {
        title: "Redact before anything prints",
        explanation: "Config objects reach logs far more often than people expect",
        code: `cfg = {"api_key": "sk-live-abc123", "log_level": "INFO"}
safe = {k: ("<redacted>" if "key" in k or "secret" in k else v) for k, v in cfg.items()}
print(safe)`,
      },
    ],
    challenges: [
      {
        id: "ship2c1",
        prompt:
          "Write load_config(env) that raises KeyError listing every missing required key at once (DATABASE_URL and API_KEY). Call it with an empty dict, catch the error, and print it. The message must mention both keys.",
        hint: "Collect all missing keys into a list first, then raise once with them joined.",
        validateFn: `return output.includes("DATABASE_URL") && output.includes("API_KEY")`,
        solution: `def load_config(env):
    missing = [k for k in ("DATABASE_URL", "API_KEY") if k not in env]
    if missing:
        raise KeyError(f"missing required config: {', '.join(sorted(missing))}")
    return env

try:
    load_config({})
except KeyError as e:
    print(e)`,
      },
      {
        id: "ship2c2",
        prompt:
          "Write redact(cfg) that replaces any value whose key contains 'key', 'secret' or 'token' with '<redacted>', and print the result for a config holding an api_key and a log_level. The output must not contain the literal secret value sk-live-abc123.",
        hint: "Dict comprehension checking whether the lowered key contains any of the sensitive words.",
        validateFn: `return output.includes("redacted") && !output.includes("sk-live-abc123")`,
        solution: `SENSITIVE = ("key", "secret", "token", "password")

def redact(cfg):
    return {
        k: ("<redacted>" if any(s in k.lower() for s in SENSITIVE) else v)
        for k, v in cfg.items()
    }

print(redact({"api_key": "sk-live-abc123", "log_level": "INFO"}))`,
      },
    ],
  },

  {
    module: "Shipping Python",
    moduleSlug: "shipping-python",
    lessonNumber: 3,
    slug: "containers",
    title: "Containers: Same Thing Everywhere",
    badge: "concept",
    theory: `
A container packages your code, its dependencies, and the interpreter into one image, so
the thing you tested is the thing that runs.

A workable Python Dockerfile:

\`\`\`dockerfile
FROM python:3.12-slim

WORKDIR /app

# copy requirements first: this layer is cached until they change
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN useradd --create-home appuser
USER appuser

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
\`\`\`

Three details in there matter more than the rest.

**Copy requirements before the code.** Docker caches per layer. If you copy everything
first, changing one line of Python reinstalls every dependency, and your builds go from
seconds to minutes.

**Do not run as root.** A container escape as root is a much worse day than one as
\`appuser\`. It is two lines.

**Bind to 0.0.0.0, not 127.0.0.1.** Inside a container, localhost means the container
itself, so nothing outside can reach you. This is the single most common "it runs but I
cannot connect" bug.

⚠️ Warning: \`COPY . .\` copies \`.env\` unless a \`.dockerignore\` excludes it. That is how
secrets end up baked into an image and pushed to a registry. Add \`.dockerignore\` at the
same time as \`.gitignore\`, and put the same things in it.

💡 Key: \`python:3.12-slim\` over \`python:3.12\` is smaller and has less in it to exploit.
Alpine is smaller still but uses musl, which breaks wheels and can make numpy builds
slow and miserable. Slim is usually the right default.
`,
    starterCode: `DOCKERIGNORE = """.env
.git
__pycache__
*.pyc
.venv
"""

def would_be_copied(files, ignore_text):
    ignored = {l.strip() for l in ignore_text.strip().splitlines() if l.strip()}
    copied = []
    for f in files:
        if f in ignored or any(f.endswith(p.lstrip("*")) for p in ignored if p.startswith("*")):
            continue
        copied.append(f)
    return copied

print(would_be_copied(["main.py", ".env", "app.pyc", "requirements.txt"], DOCKERIGNORE))
`,
    examples: [
      {
        title: "Layer order decides your build time",
        explanation: "Requirements first means a code change does not reinstall the world",
        code: `print("COPY requirements.txt .   <- cached until deps change")
print("RUN pip install ...")
print("COPY . .                  <- changes every commit")`,
      },
      {
        title: "The localhost trap",
        explanation: "Inside a container 127.0.0.1 is the container, so nothing reaches you",
        code: `print("--host 127.0.0.1  -> unreachable from outside")
print("--host 0.0.0.0    -> correct in a container")`,
      },
    ],
    challenges: [
      {
        id: "ship3c1",
        prompt:
          "Using DOCKERIGNORE from the editor, write would_be_copied(files, ignore_text) and print what gets copied from ['main.py', '.env', 'app.pyc', 'requirements.txt']. The output must include main.py but must not include .env.",
        hint: "Build a set of ignored entries, skip exact matches, and handle the *.pyc pattern by suffix.",
        validateFn: `return output.includes("main.py") && !output.includes(".env")`,
        solution: `DOCKERIGNORE = """.env
.git
__pycache__
*.pyc
.venv
"""

def would_be_copied(files, ignore_text):
    ignored = {l.strip() for l in ignore_text.strip().splitlines() if l.strip()}
    copied = []
    for f in files:
        if f in ignored:
            continue
        if any(f.endswith(p.lstrip("*")) for p in ignored if p.startswith("*")):
            continue
        copied.append(f)
    return copied

print(would_be_copied(["main.py", ".env", "app.pyc", "requirements.txt"], DOCKERIGNORE))`,
      },
      {
        id: "ship3c2",
        prompt:
          "Write audit_dockerfile(lines) returning a list of warnings: flag running as root (no USER line), and flag binding to 127.0.0.1. Print the warnings for a Dockerfile with both problems. Output should mention root and 0.0.0.0.",
        hint: "Check whether any line starts with USER; check whether any line contains 127.0.0.1.",
        validateFn: `return output.toLowerCase().includes("root") && output.includes("0.0.0.0")`,
        solution: `def audit_dockerfile(lines):
    warnings = []
    if not any(l.strip().startswith("USER ") for l in lines):
        warnings.append("runs as root: add a USER line")
    if any("127.0.0.1" in l for l in lines):
        warnings.append("binds 127.0.0.1: use 0.0.0.0 inside a container")
    return warnings

dockerfile = [
    "FROM python:3.12-slim",
    "COPY . .",
    'CMD ["uvicorn", "main:app", "--host", "127.0.0.1"]',
]
for w in audit_dockerfile(dockerfile):
    print(w)`,
      },
    ],
  },

  {
    module: "Shipping Python",
    moduleSlug: "shipping-python",
    lessonNumber: 4,
    slug: "health-and-shutdown",
    title: "Health Checks and Graceful Shutdown",
    badge: "practice",
    theory: `
Once something else is deciding whether your process lives, two things it does not have
by default become important.

**A health check that tells the truth.** A route returning \`{"ok": true}\` unconditionally
is worse than none, because it makes an orchestrator keep routing traffic to a process
whose database connection died an hour ago.

\`\`\`python
@app.get("/health")
def health():
    checks = {"db": can_reach_db(), "cache": can_reach_cache()}
    ok = all(checks.values())
    return JSONResponse({"ok": ok, "checks": checks}, status_code=200 if ok else 503)
\`\`\`

Separate **liveness** from **readiness**. Liveness means the process is not wedged, so
restart me if it fails. Readiness means I can serve traffic right now, so stop sending
requests but do not kill me. Wiring a slow dependency into liveness gets your service
restart-looped during someone else's outage.

**Graceful shutdown.** A deploy sends SIGTERM and gives you a few seconds. Ignore it and
in-flight requests die mid-response.

\`\`\`python
import signal

def handle_term(signum, frame):
    shutting_down.set()      # stop accepting, finish what is running

signal.signal(signal.SIGTERM, handle_term)
\`\`\`

⚠️ Warning: the drain window is finite. Kubernetes defaults to 30 seconds, then SIGKILL,
which is not negotiable. Work that takes longer belongs in a queue, not in a request.

💡 Key: readiness should fail **before** shutdown begins. Say "not ready", let the load
balancer stop sending, then drain. Reversing that order drops requests on every deploy.
`,
    starterCode: `def health(db_ok, cache_ok):
    checks = {"db": db_ok, "cache": cache_ok}
    ok = all(checks.values())
    return (200 if ok else 503), {"ok": ok, "checks": checks}

print(health(True, True))
print(health(False, True))
`,
    examples: [
      {
        title: "Liveness and readiness are different questions",
        explanation: "One restarts you; the other only stops traffic",
        code: `def liveness(process_responsive): return 200 if process_responsive else 503
def readiness(db_ok, draining): return 503 if draining or not db_ok else 200
print("live:", liveness(True), "| ready while draining:", readiness(True, True))`,
      },
      {
        title: "The shutdown order that does not drop requests",
        explanation: "Fail readiness first, then drain, then exit",
        code: `steps = ["readiness -> 503", "wait for load balancer", "finish in-flight", "exit"]
for i, s in enumerate(steps, 1): print(i, s)`,
      },
    ],
    challenges: [
      {
        id: "ship4c1",
        prompt:
          "Write health(db_ok, cache_ok) returning a (status, body) tuple: 200 when everything is up, 503 when anything is down. Print the status for all-up and then for a dead database. Output should show 200 then 503.",
        hint: "Build a checks dict, use all() on its values, and pick the status from that.",
        validateFn: `const o = output;
return o.includes("200") && o.includes("503") && o.indexOf("200") < o.indexOf("503")`,
        solution: `def health(db_ok, cache_ok):
    checks = {"db": db_ok, "cache": cache_ok}
    ok = all(checks.values())
    return (200 if ok else 503), {"ok": ok, "checks": checks}

print(health(True, True)[0])
print(health(False, True)[0])`,
      },
      {
        id: "ship4c2",
        prompt:
          "Model the shutdown sequence. Write shutdown_order() returning the four steps as a list of strings, starting with failing readiness and ending with exit, and print them one per line. The first line must mention readiness and the last must mention exit.",
        hint: "Return the list in order, then loop and print. Readiness fails first so the load balancer stops sending.",
        validateFn: `const lines = output.trim().split("\\n").map(s => s.toLowerCase());
return lines.length >= 4 && lines[0].includes("readiness") && lines[lines.length - 1].includes("exit")`,
        solution: `def shutdown_order():
    return [
        "fail readiness so the load balancer stops sending",
        "wait for it to notice",
        "finish in-flight requests",
        "exit",
    ]

for step in shutdown_order():
    print(step)`,
      },
    ],
  },
];
