import type { Lesson } from "../types";

// Building an API rather than consuming one. The web-apis module covers calling
// somebody else's service; this covers being the service, which is close to half of
// professional Python work and was entirely absent.
//
// Pyodide cannot bind a port, so uvicorn never runs here. That matters less than it
// sounds: a FastAPI handler is an ordinary function, and testing it by calling it
// directly is exactly what FastAPI's own TestClient does under the hood. Every
// challenge exercises the logic you would actually get wrong. The decorators and the
// uvicorn line are in the theory, where they belong.

export const lessonsModuleApis: Lesson[] = [
  {
    module: "Building APIs",
    moduleSlug: "building-apis",
    lessonNumber: 1,
    slug: "your-first-endpoint",
    title: "A Handler Is Just a Function",
    badge: "concept",
    theory: `
The whole idea of FastAPI is that an endpoint is a normal Python function with a
decorator that says which URL reaches it.

\`\`\`python
from fastapi import FastAPI

app = FastAPI()

@app.get("/airports/{code}")
def get_airport(code: str):
    return {"code": code, "city": "Milwaukee"}
\`\`\`

Three things are happening, and none of them are magic.

**Routing.** \`@app.get("/airports/{code}")\` says: a GET request to that path calls this
function, and the \`{code}\` piece of the URL becomes the \`code\` argument.

**Type coercion.** The annotation \`code: str\` is not decoration. FastAPI reads it and
converts the incoming string. Annotate \`runways: int\` and a request with \`abc\` gets a
422 before your function ever runs.

**Serialization.** You return a dict; FastAPI turns it into JSON and sets the headers.

Running it is one line, outside Python:

\`\`\`
uvicorn main:app --reload
\`\`\`

💡 Key: because the handler is an ordinary function, you can call it directly in a test.
No server, no HTTP, no port. That is the whole reason this module can be hands-on here.

📝 Note: the browser cannot bind a port, so nothing below starts a server. You are
writing and calling the handlers, which is where the bugs live anyway.
`,
    starterCode: `# A handler is just a function. Here is one, called directly.
AIRPORTS = {
    "MKE": {"city": "Milwaukee", "state": "WI"},
    "ORD": {"city": "Chicago", "state": "IL"},
}

def get_airport(code: str):
    return {"code": code, **AIRPORTS[code]}

print(get_airport("MKE"))
`,
    examples: [
      {
        title: "The decorator, for reference",
        explanation: "This is the only part that needs a running server",
        code: `print('@app.get("/airports/{code}")')
print("def get_airport(code: str): ...")
print("uvicorn main:app --reload")`,
      },
      {
        title: "Annotations do real work",
        explanation: "FastAPI coerces using the annotation before your code runs",
        code: `def handler(runways: int):
    return {"runways": runways, "type": type(runways).__name__}
print(handler(int("5")))`,
      },
    ],
    challenges: [
      {
        id: "api1c1",
        prompt:
          "Write get_airport(code) that returns a dict with the code plus its city and state from AIRPORTS. Print the result for 'ORD'. Output must contain Chicago and IL.",
        hint: "Return {\"code\": code, **AIRPORTS[code]} and print the call.",
        validateFn: `return output.includes("Chicago") && output.includes("IL")`,
        solution: `AIRPORTS = {
    "MKE": {"city": "Milwaukee", "state": "WI"},
    "ORD": {"city": "Chicago", "state": "IL"},
}

def get_airport(code: str):
    return {"code": code, **AIRPORTS[code]}

print(get_airport("ORD"))`,
      },
      {
        id: "api1c2",
        prompt:
          "Add a list endpoint. Write list_airports(state) returning a list of codes in that state, and print the result for 'WI' after adding MSN/Madison/WI to the data. Output should contain MKE and MSN but not ORD.",
        hint: "Loop AIRPORTS.items() and keep the codes whose value has the matching state.",
        validateFn: `return output.includes("MKE") && output.includes("MSN") && !output.includes("ORD")`,
        solution: `AIRPORTS = {
    "MKE": {"city": "Milwaukee", "state": "WI"},
    "ORD": {"city": "Chicago", "state": "IL"},
    "MSN": {"city": "Madison", "state": "WI"},
}

def list_airports(state: str):
    return [code for code, a in AIRPORTS.items() if a["state"] == state]

print(list_airports("WI"))`,
      },
    ],
  },

  {
    module: "Building APIs",
    moduleSlug: "building-apis",
    lessonNumber: 2,
    slug: "validating-input",
    title: "Validate at the Edge",
    badge: "practice",
    theory: `
Every value arriving from outside your process is untrusted until something checks it.
The place to check is the boundary, once, so the rest of your code can assume the data
is already good.

FastAPI does this with Pydantic models:

\`\`\`python
from pydantic import BaseModel, Field

class NewAirport(BaseModel):
    code: str = Field(min_length=3, max_length=3)
    city: str
    runways: int = Field(ge=1, le=20)
\`\`\`

A request that violates any of that gets a 422 with a body explaining which field failed,
and your handler is never called.

The pattern underneath is not specific to Pydantic, and it is worth writing by hand once
so the library stops being mysterious:

\`\`\`python
def validate(payload):
    errors = []
    if len(payload.get("code", "")) != 3:
        errors.append({"field": "code", "msg": "must be 3 characters"})
    if not 1 <= payload.get("runways", 0) <= 20:
        errors.append({"field": "runways", "msg": "must be 1-20"})
    return errors
\`\`\`

💡 Key: collect **all** the errors, do not raise on the first one. A form that reports one
problem per submission is how you make people hate your API.

⚠️ Warning: validation is not authorization. "Is this a well-formed airport code" and
"is this person allowed to add airports" are different questions, answered in different
places. Confusing them is a real security bug, not a style issue.
`,
    starterCode: `def validate(payload):
    """Return a list of field errors. Empty list means the payload is good."""
    errors = []
    code = payload.get("code", "")
    if len(code) != 3 or not code.isupper():
        errors.append({"field": "code", "msg": "must be 3 uppercase letters"})
    runways = payload.get("runways", 0)
    if not isinstance(runways, int) or not 1 <= runways <= 20:
        errors.append({"field": "runways", "msg": "must be an integer 1-20"})
    return errors

print(validate({"code": "MKE", "runways": 5}))
print(validate({"code": "milwaukee", "runways": 99}))
`,
    examples: [
      {
        title: "Report every problem at once",
        explanation: "Two bad fields should produce two errors, not just the first",
        code: `errors = [{"field": "code", "msg": "bad"}, {"field": "runways", "msg": "bad"}]
print(len(errors), "errors returned together")`,
      },
      {
        title: "The 422 shape",
        explanation: "A machine-readable body beats a sentence of prose",
        code: `import json
print(json.dumps({"detail": [{"field": "code", "msg": "must be 3 uppercase letters"}]}))`,
      },
    ],
    challenges: [
      {
        id: "api2c1",
        prompt:
          "Using validate() from the editor, check a payload with both fields wrong and print how many errors came back as 'errors: N'. It should be 2, proving you collect all of them rather than stopping at the first.",
        hint: 'Call validate({"code": "milwaukee", "runways": 99}) and print the length of the result.',
        validateFn: `return /errors:\\s*2/.test(output)`,
        solution: `def validate(payload):
    errors = []
    code = payload.get("code", "")
    if len(code) != 3 or not code.isupper():
        errors.append({"field": "code", "msg": "must be 3 uppercase letters"})
    runways = payload.get("runways", 0)
    if not isinstance(runways, int) or not 1 <= runways <= 20:
        errors.append({"field": "runways", "msg": "must be an integer 1-20"})
    return errors

print("errors:", len(validate({"code": "milwaukee", "runways": 99})))`,
      },
      {
        id: "api2c2",
        prompt:
          "Write handle_create(payload) that returns a (status, body) tuple: 422 with the error list when validation fails, 201 with the created record when it passes. Print the status for a bad payload and then for a good one. Output should show 422 then 201.",
        hint: "Call validate first; return (422, {'detail': errors}) when it is non-empty, otherwise (201, payload).",
        validateFn: `const o = output;
return o.includes("422") && o.includes("201") && o.indexOf("422") < o.indexOf("201")`,
        solution: `def validate(payload):
    errors = []
    code = payload.get("code", "")
    if len(code) != 3 or not code.isupper():
        errors.append({"field": "code", "msg": "must be 3 uppercase letters"})
    runways = payload.get("runways", 0)
    if not isinstance(runways, int) or not 1 <= runways <= 20:
        errors.append({"field": "runways", "msg": "must be an integer 1-20"})
    return errors

def handle_create(payload):
    errors = validate(payload)
    if errors:
        return 422, {"detail": errors}
    return 201, payload

print(handle_create({"code": "x", "runways": 0})[0])
print(handle_create({"code": "MKE", "runways": 5})[0])`,
      },
    ],
  },

  {
    module: "Building APIs",
    moduleSlug: "building-apis",
    lessonNumber: 3,
    slug: "status-codes-and-errors",
    title: "Status Codes Are the API",
    badge: "practice",
    theory
: `
The status code is the first thing every client reads, and half of them never read
anything else. Getting it right is not pedantry; it decides whether callers retry, give
up, or alert someone.

The ones you will actually use:

- **200** here is what you asked for
- **201** created, and \`Location\` points at the new thing
- **204** done, deliberately no body
- **400** the request is malformed
- **401** you are not authenticated
- **403** authenticated, but not allowed
- **404** no such thing
- **409** conflict, it already exists
- **422** well-formed but semantically invalid
- **500** we broke

The distinction people get wrong most often is **401 versus 403**. Not logged in is 401.
Logged in and still not permitted is 403. Returning 403 for a missing token sends the
client off to debug the wrong problem.

The second most common mistake is returning 200 with \`{"error": "..."}\` in the body. Now
every caller has to parse the body to discover it failed, monitoring shows a healthy
service, and retries never fire.

\`\`\`python
from fastapi import HTTPException

if code not in AIRPORTS:
    raise HTTPException(status_code=404, detail=f"no airport {code}")
\`\`\`

⚠️ Warning: never put an exception message straight into a response. Tracebacks leak file
paths, library versions, and sometimes credentials. Log the detail, return something
generic. That is exactly what the tutor route on this site does.

💡 Key: 4xx means the caller can fix it. 5xx means only you can. That is the line.
`,
    starterCode: `AIRPORTS = {"MKE": {"city": "Milwaukee"}}

def get_airport(code, authenticated=True, is_admin=False):
    if not authenticated:
        return 401, {"detail": "authentication required"}
    if code not in AIRPORTS:
        return 404, {"detail": f"no airport {code}"}
    return 200, AIRPORTS[code]

print(get_airport("MKE"))
print(get_airport("XXX"))
print(get_airport("MKE", authenticated=False))
`,
    examples: [
      {
        title: "401 and 403 answer different questions",
        explanation: "Who are you, versus you may not do that",
        code: `def check(authed, allowed):
    if not authed: return 401
    if not allowed: return 403
    return 200
print(check(False, False), check(True, False), check(True, True))`,
      },
      {
        title: "The anti-pattern",
        explanation: "A 200 carrying an error makes every caller parse the body to find out",
        code: `bad = (200, {"error": "not found"})
good = (404, {"detail": "not found"})
print("bad:", bad[0], "| good:", good[0])`,
      },
    ],
    challenges: [
      {
        id: "api3c1",
        prompt:
          "Write handle(code, authed, admin) returning just the status code: 401 when not authenticated, 403 when authenticated but not admin, 404 when the code is unknown, 200 otherwise. Print the results for four cases in that order. Output should contain 401, 403, 404 and 200.",
        hint: "Check authentication first, then permission, then existence. Order matters.",
        validateFn: `return ["401","403","404","200"].every(c => output.includes(c))`,
        solution: `AIRPORTS = {"MKE": {"city": "Milwaukee"}}

def handle(code, authed, admin):
    if not authed:
        return 401
    if not admin:
        return 403
    if code not in AIRPORTS:
        return 404
    return 200

print(handle("MKE", False, False))
print(handle("MKE", True, False))
print(handle("XXX", True, True))
print(handle("MKE", True, True))`,
      },
      {
        id: "api3c2",
        prompt:
          "Write safe_error(exc) that takes an exception and returns a (status, body) tuple which never leaks the exception text. Print the body for ValueError('/Users/nick/secret.py line 12'). The output must not contain the word secret.",
        hint: "Return (500, {'detail': 'internal error'}) regardless of the exception; log the real one separately.",
        validateFn: `return output.toLowerCase().includes("internal error") && !output.toLowerCase().includes("secret")`,
        solution: `def safe_error(exc):
    # the real detail belongs in your logs, not in the response
    return 500, {"detail": "internal error"}

status, body = safe_error(ValueError("/Users/nick/secret.py line 12"))
print(status, body)`,
      },
    ],
  },

  {
    module: "Building APIs",
    moduleSlug: "building-apis",
    lessonNumber: 4,
    slug: "dependencies-and-auth",
    title: "Dependencies and Who Is Allowed",
    badge: "practice",
    theory: `
Every endpoint needs the same few things: a database connection, the current user, a
config object. Copying that setup into twenty handlers is how it drifts.

FastAPI's answer is dependency injection:

\`\`\`python
from fastapi import Depends, HTTPException

def get_current_user(token: str = Header(...)):
    user = lookup(token)
    if user is None:
        raise HTTPException(401, "invalid token")
    return user

@app.get("/me")
def me(user = Depends(get_current_user)):
    return user
\`\`\`

The handler declares what it needs; the framework provides it. In a test you override the
dependency with a fake user and never touch the auth system at all.

Underneath it is a plain function returning a value, which is why it is testable.

**Authentication** is who you are. **Authorization** is what you may do. Keep them
separate: one function resolves the user, another checks permission. Fusing them into a
single \`is_admin_and_logged_in\` is where confused-deputy bugs come from.

⚠️ Warning: compare secrets with a constant-time comparison, not \`==\`. A plain
comparison returns faster on an early mismatch, which leaks the value one character at a
time. \`hmac.compare_digest\` exists for this.

💡 Key: the token identifies the caller. It never decides what they may do. Look
permissions up server-side from the identity, because anything in the token is something
the client can lie about unless you signed it.
`,
    starterCode: `import hmac

USERS = {"tok-nick": {"name": "nick", "role": "admin"},
         "tok-guest": {"name": "guest", "role": "viewer"}}

def get_current_user(token):
    return USERS.get(token)

def require_role(user, role):
    return user is not None and user["role"] == role

print(get_current_user("tok-nick"))
print("admin?", require_role(get_current_user("tok-guest"), "admin"))
print("constant-time compare:", hmac.compare_digest("abc", "abc"))
`,
    examples: [
      {
        title: "Overriding a dependency in a test",
        explanation: "The reason DI is worth it: swap the real user resolver for a fake",
        code: `def real_user(token): return None
def fake_user(token): return {"name": "test", "role": "admin"}
resolver = fake_user
print(resolver("anything"))`,
      },
      {
        title: "Why not ==",
        explanation: "compare_digest does not short-circuit on the first differing byte",
        code: `import hmac
print(hmac.compare_digest("secret", "secret"), hmac.compare_digest("secret", "secrey"))`,
      },
    ],
    challenges: [
      {
        id: "api4c1",
        prompt:
          "Write authorize(token, required_role) returning a status code: 401 when the token is unknown, 403 when the user's role does not match, 200 when it does. Print the results for an unknown token, the guest asking for admin, and nick asking for admin. Output must contain 401, 403 and 200.",
        hint: "Resolve the user first and return 401 if None; then compare roles for 403; otherwise 200.",
        validateFn: `return ["401","403","200"].every(c => output.includes(c))`,
        solution: `USERS = {"tok-nick": {"name": "nick", "role": "admin"},
         "tok-guest": {"name": "guest", "role": "viewer"}}

def authorize(token, required_role):
    user = USERS.get(token)
    if user is None:
        return 401
    if user["role"] != required_role:
        return 403
    return 200

print(authorize("tok-nobody", "admin"))
print(authorize("tok-guest", "admin"))
print(authorize("tok-nick", "admin"))`,
      },
      {
        id: "api4c2",
        prompt:
          "Use hmac.compare_digest to check an API key safely. Write check_key(given, expected) returning True or False, and print the result for a matching pair and a near-miss. Output should show True then False.",
        hint: "import hmac and return hmac.compare_digest(given, expected).",
        validateFn: `const o = output.toLowerCase();
return o.includes("true") && o.includes("false") && o.indexOf("true") < o.indexOf("false")`,
        solution: `import hmac

def check_key(given, expected):
    return hmac.compare_digest(given, expected)

print(check_key("sk-abc123", "sk-abc123"))
print(check_key("sk-abc124", "sk-abc123"))`,
      },
    ],
  },

  {
    module: "Building APIs",
    moduleSlug: "building-apis",
    lessonNumber: 5,
    slug: "testing-your-api",
    title: "Testing an API Without a Server",
    badge: "practice",
    theory: `
FastAPI ships a \`TestClient\` that talks to your app in-process. No port, no network, no
waiting.

\`\`\`python
from fastapi.testclient import TestClient

client = TestClient(app)

def test_get_airport():
    r = client.get("/airports/MKE")
    assert r.status_code == 200
    assert r.json()["city"] == "Milwaukee"

def test_unknown_airport():
    assert client.get("/airports/XXX").status_code == 404
\`\`\`

What is worth asserting, in order of value:

1. **The status code.** Cheap, and it catches the most damaging class of bug.
2. **The shape.** Are the keys the caller depends on present.
3. **The values**, where they are deterministic.

Test the failures at least as hard as the successes. Every API is well tested on the
happy path and breaks in production on the one nobody tried: a missing field, a wrong
type, a permission the caller does not have.

💡 Key: because a handler is a function, most of this can be tested by calling it
directly, with no client at all. Use \`TestClient\` when routing, headers, or serialization
is the thing under test. Call the function when the logic is.

✨ Tip: give the test database its own connection per test. Tests that share state pass
alone and fail together, and that is a miserable afternoon.
`,
    starterCode: `AIRPORTS = {"MKE": {"city": "Milwaukee"}}

def get_airport(code):
    if code not in AIRPORTS:
        return 404, {"detail": "not found"}
    return 200, AIRPORTS[code]

def test_found():
    status, body = get_airport("MKE")
    assert status == 200
    assert body["city"] == "Milwaukee"

def test_missing():
    status, _ = get_airport("XXX")
    assert status == 404

test_found()
test_missing()
print("2 passed")
`,
    examples: [
      {
        title: "Assert the shape, not the whole body",
        explanation: "Keys the caller relies on; not fields that change",
        code: `body = {"code": "MKE", "city": "Milwaukee", "updated": "2026-07-25"}
assert {"code", "city"} <= set(body)
print("shape ok")`,
      },
      {
        title: "A failing assert is the point",
        explanation: "This is what a broken endpoint looks like in a test run",
        code: `try:
    assert 404 == 200, "expected 200, got 404"
except AssertionError as e:
    print("caught:", e)`,
      },
    ],
    challenges: [
      {
        id: "api5c1",
        prompt:
          "Write three tests for get_airport: found returns 200 with the right city, missing returns 404, and the body of a found response contains a 'city' key. Run all three and print 'passed: 3'.",
        hint: "Three functions with asserts, call them in sequence, then print the count.",
        validateFn: `return /passed:\\s*3/.test(output)`,
        solution: `AIRPORTS = {"MKE": {"city": "Milwaukee"}}

def get_airport(code):
    if code not in AIRPORTS:
        return 404, {"detail": "not found"}
    return 200, AIRPORTS[code]

def test_found():
    status, body = get_airport("MKE")
    assert status == 200 and body["city"] == "Milwaukee"

def test_missing():
    assert get_airport("XXX")[0] == 404

def test_shape():
    assert "city" in get_airport("MKE")[1]

passed = 0
for t in (test_found, test_missing, test_shape):
    t(); passed += 1
print("passed:", passed)`,
      },
      {
        id: "api5c2",
        prompt:
          "Prove a test catches a regression. Break get_airport so it returns 200 for unknown codes, run the missing-code test, catch the AssertionError, and print 'regression caught'.",
        hint: "Remove the 404 branch, wrap the test call in try/except AssertionError, and print inside the except.",
        validateFn: `return output.toLowerCase().includes("regression caught")`,
        solution: `AIRPORTS = {"MKE": {"city": "Milwaukee"}}

def get_airport(code):
    # regression: the 404 branch was dropped
    return 200, AIRPORTS.get(code, {})

def test_missing():
    assert get_airport("XXX")[0] == 404, "unknown code must be 404"

try:
    test_missing()
except AssertionError:
    print("regression caught")`,
      },
    ],
  },
];
