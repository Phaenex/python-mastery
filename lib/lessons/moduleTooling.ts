import type { Lesson } from "../types";

// Note: this in-browser runtime cannot create virtualenvs, run pip, or invoke
// pytest/ruff as separate processes. The theory teaches the real workflow; the
// runnable challenges practice the underlying Python (parsing requirement
// specs, unittest.mock, timeit) so every solution still executes here.

export const lessonsModuleTooling: Lesson[] = [
  {
    module: "Tooling & Environments",
    moduleSlug: "tooling-environments",
    lessonNumber: 1,
    slug: "venv-and-pip",
    title: "Virtual Environments & pip",
    badge: "concept",
    theory: `
Two projects on your machine will eventually need different versions of the same
library. Install everything globally and they fight. A virtual environment gives
each project its own isolated set of packages.

\`\`\`bash
python -m venv .venv          # create it
source .venv/bin/activate     # turn it on (Windows: .venv\\Scripts\\activate)
pip install pandas requests   # installs into THIS project only
\`\`\`

While it's active, \`python\` and \`pip\` point at the project's copy, not the
system one. Deactivate with \`deactivate\`.

You pin what you depend on so a teammate (or future you) can rebuild it exactly:

\`\`\`bash
pip freeze > requirements.txt   # write current versions
pip install -r requirements.txt # reproduce them elsewhere
\`\`\`

A \`requirements.txt\` line is just \`name==version\`:

\`\`\`text
pandas==2.1.0
requests==2.31.0
\`\`\`

📝 Note: modern projects often use \`pyproject.toml\` to declare dependencies
instead, and tools like \`uv\` or \`poetry\` resolve and lock them. The idea is
the same: declare what you need, pin it, reproduce it.

⚠️ Warning: never \`pip install\` into the system Python. The day you do, an OS
tool that depends on a specific version breaks, and the fix is ugly. Always work
inside a venv.
`,
    starterCode: `# A requirements line is "name==version". Split it apart:
line = "pandas==2.1.0"
name, version = line.split("==")
print(f"{name} {version}")
`,
    examples: [
      {
        title: "parse one requirement spec",
        explanation: "Split on == to separate the package from its pinned version",
        code: `line = "requests==2.31.0"
name, version = line.split("==")
print("package:", name)
print("version:", version)`,
      },
      {
        title: "read a whole requirements file",
        explanation: "Split the text into lines and pull out the names",
        code: `requirements = """pandas==2.1.0
requests==2.31.0
numpy==1.26.0"""

names = [line.split("==")[0] for line in requirements.splitlines()]
print(names)`,
      },
    ],
    challenges: [
      {
        id: "tool1c1",
        prompt:
          "The string 'requests==2.31.0' is a requirements line. Split it on '==' into name and version, and print them as 'requests 2.31.0'.",
        hint: "name, version = line.split('=='); then an f-string",
        validateFn: `return output.includes("requests 2.31.0")`,
        solution: `line = "requests==2.31.0"
name, version = line.split("==")
print(f"{name} {version}")`,
      },
      {
        id: "tool1c2",
        prompt:
          "Given the multi-line requirements string with three lines (pandas, requests, numpy), count how many packages it lists and print '3 packages'. Use splitlines().",
        hint: "len(requirements.splitlines()) gives the count",
        validateFn: `return output.includes("3 packages")`,
        solution: `requirements = """pandas==2.1.0
requests==2.31.0
numpy==1.26.0"""

count = len(requirements.splitlines())
print(f"{count} packages")`,
      },
    ],
  },
  {
    module: "Tooling & Environments",
    moduleSlug: "tooling-environments",
    lessonNumber: 2,
    slug: "pytest-deep-dive",
    title: "pytest Deep Dive",
    badge: "concept",
    theory: `
\`pytest\` is the testing tool most Python projects actually use. You install it
(\`pip install pytest\`), write functions whose names start with \`test_\`, and
run \`pytest\` in the terminal. It finds them, runs them, and reports.

The magic is that it uses plain \`assert\`. No \`self.assertEqual\`, just the
normal keyword, and when it fails pytest shows you both sides.

\`\`\`python
def add(a, b):
    return a + b

def test_add():
    assert add(2, 3) == 5
    assert add(0, 0) == 0
\`\`\`

To run the same test on many inputs, you parametrize it instead of copy-pasting:

\`\`\`python
import pytest

@pytest.mark.parametrize("a,b,expected", [(2, 3, 5), (10, 5, 15)])
def test_add(a, b, expected):
    assert add(a, b) == expected
\`\`\`

A fixture is reusable setup; you request it by naming it as a parameter:

\`\`\`python
@pytest.fixture
def sample():
    return [1, 2, 3]

def test_length(sample):
    assert len(sample) == 3
\`\`\`

💡 Key: a good test names what it checks, runs fast, and fails for exactly one
reason. When it goes red you should know what broke without opening a debugger.

📝 Note: this runtime has no pytest installed, so the challenges below call the
test functions directly. In a real project you would never call them yourself,
\`pytest\` discovers and runs them for you.
`,
    starterCode: `def add(a, b):
    return a + b


def test_add():
    assert add(2, 3) == 5
    assert add(0, 0) == 0


test_add()
print("passed")
`,
    examples: [
      {
        title: "a test is a function full of asserts",
        explanation: "If every assert holds, the function returns and we know it's green",
        code: `def clean(s):
    return s.strip().lower()


def test_clean():
    assert clean("  Hi ") == "hi"
    assert clean("ABC") == "abc"


test_clean()
print("test_clean passed")`,
      },
      {
        title: "parametrize by hand to see the idea",
        explanation: "One assertion, many cases; pytest does this loop for you",
        code: `def add(a, b):
    return a + b


cases = [(2, 3, 5), (10, 5, 15), (-1, 1, 0)]
for a, b, expected in cases:
    assert add(a, b) == expected

print(f"all {len(cases)} cases passed")`,
      },
    ],
    challenges: [
      {
        id: "tool2c1",
        prompt:
          "Write a function add(a, b) and a test_add() that asserts add(2, 3) == 5 and add(0, 0) == 0. Call test_add(), then print 'passed'.",
        hint: "if either assert fails it raises; reaching the print means both held",
        validateFn: `return output.includes("passed")`,
        solution: `def add(a, b):
    return a + b


def test_add():
    assert add(2, 3) == 5
    assert add(0, 0) == 0


test_add()
print("passed")`,
      },
      {
        id: "tool2c2",
        prompt:
          "Write a function is_even(n) returning True for even numbers. Parametrize by hand: loop over cases = [(2, True), (3, False), (10, True)] and assert is_even(n) == expected for each. Print 'all cases passed'.",
        hint: "for n, expected in cases: assert is_even(n) == expected",
        validateFn: `return output.includes("all cases passed")`,
        solution: `def is_even(n):
    return n % 2 == 0


cases = [(2, True), (3, False), (10, True)]
for n, expected in cases:
    assert is_even(n) == expected

print("all cases passed")`,
      },
    ],
  },
  {
    module: "Tooling & Environments",
    moduleSlug: "tooling-environments",
    lessonNumber: 3,
    slug: "mocking-test-doubles",
    title: "Mocking & Test Doubles",
    badge: "concept",
    theory: `
Some code talks to things you don't want in a test: a payment API, a database, a
clock. A mock is a stand-in you control. It records how it was called and returns
whatever you tell it to, so the test stays fast and predictable.

\`unittest.mock\` is in the standard library.

\`\`\`python
from unittest.mock import Mock

api = Mock()
api.get_user.return_value = {"name": "ada"}

result = api.get_user(42)
print(result)                       # {'name': 'ada'}
api.get_user.assert_called_once_with(42)
\`\`\`

The mock did not call a real API. It returned the value you set and remembered
the arguments, so you can assert it was used correctly.

\`patch\` temporarily replaces a real object with a mock for the duration of a
test, then puts the original back:

\`\`\`python
from unittest.mock import patch

with patch("random.randint", return_value=4):
    import random
    print(random.randint(1, 6))     # always 4 here
\`\`\`

💡 Key: mock the boundary, not the thing you are testing. Replace the network
call so you can test your own logic around it. If you mock everything, the test
proves nothing.
`,
    starterCode: `from unittest.mock import Mock

api = Mock()
api.get_user.return_value = {"name": "ada"}

print(api.get_user(42))
api.get_user.assert_called_once_with(42)
print("verified")
`,
    examples: [
      {
        title: "a mock returns what you tell it",
        explanation: "No real service involved; return_value sets the answer",
        code: `from unittest.mock import Mock

clock = Mock()
clock.now.return_value = "2026-01-01"

print(clock.now())
print(clock.now())`,
      },
      {
        title: "a mock remembers how it was called",
        explanation: "call_count and assert_called_with verify your code used it right",
        code: `from unittest.mock import Mock

send = Mock()
send("hello")
send("world")

print("called", send.call_count, "times")
send.assert_called_with("world")
print("last call verified")`,
      },
    ],
    challenges: [
      {
        id: "tool3c1",
        prompt:
          "Create a Mock named api. Set api.return_value to {'status': 'ok'}. Call api() and print the value under its 'status' key. It should print ok.",
        hint: "api = Mock(); api.return_value = {'status': 'ok'}; print(api()['status'])",
        validateFn: `return output.includes("ok")`,
        solution: `from unittest.mock import Mock

api = Mock()
api.return_value = {"status": "ok"}

print(api()["status"])`,
      },
      {
        id: "tool3c2",
        prompt:
          "Create a Mock named log. Call it twice with any arguments. Print log.call_count (it should be 2), then call log.assert_called() and print 'verified' if it does not raise.",
        hint: "log.call_count after two calls is 2; assert_called() passes if it was called at least once",
        validateFn: `return output.includes("2") && output.includes("verified")`,
        solution: `from unittest.mock import Mock

log = Mock()
log("first")
log("second")

print(log.call_count)
log.assert_called()
print("verified")`,
      },
    ],
  },
  {
    module: "Tooling & Environments",
    moduleSlug: "tooling-environments",
    lessonNumber: 4,
    slug: "debugging-profiling",
    title: "Debugging & Profiling",
    badge: "concept",
    theory: `
When something breaks, the traceback is your map. Read it bottom-up: the last
line is the error type and message, and the lines above are the call chain that
led there, newest at the bottom.

To stop and look around, drop a \`breakpoint()\` into the code. When Python hits
it you get an interactive prompt where \`n\` runs the next line, \`s\` steps into a
call, \`c\` continues, and \`p name\` prints a variable. It beats scattering
\`print\` everywhere and then forgetting to delete them.

When something is slow, measure before you guess. \`timeit\` times tiny snippets
accurately by running them many times:

\`\`\`python
import timeit

t = timeit.timeit("sum(range(100))", number=10000)
print(f"ran in {t:.4f}s total")
\`\`\`

For a whole program, \`cProfile\` shows which functions eat the time:

\`\`\`python
import cProfile
cProfile.run("expensive_function()")
\`\`\`

⚠️ Warning: do not optimize on a hunch. The slow part is almost never where you
think. Profile first, fix the actual hotspot, measure again.

💡 Key: the fastest debugging loop is a failing test that reproduces the bug.
Once you can trigger it on demand, the fix is usually obvious.
`,
    starterCode: `import timeit

t = timeit.timeit("sum(range(100))", number=1000)
print("timed" if isinstance(t, float) else "no")
`,
    examples: [
      {
        title: "time a snippet with timeit",
        explanation: "number is how many times it runs, for an accurate average",
        code: `import timeit

t = timeit.timeit("[x*x for x in range(100)]", number=1000)
print(f"finished, total time is a {type(t).__name__}")`,
      },
      {
        title: "read an error type off a caught exception",
        explanation: "type(e).__name__ is the same name you'd see at the bottom of a traceback",
        code: `data = {"a": 1}
try:
    value = data["missing"]
except Exception as e:
    print("error type:", type(e).__name__)`,
      },
    ],
    challenges: [
      {
        id: "tool4c1",
        prompt:
          "Use timeit.timeit to time the snippet 'sum(range(50))' with number=1000. Store the result and print 'timed' if it is a float (it always will be).",
        hint: "t = timeit.timeit('sum(range(50))', number=1000); print('timed' if isinstance(t, float) else 'no')",
        validateFn: `return output.includes("timed")`,
        solution: `import timeit

t = timeit.timeit("sum(range(50))", number=1000)
print("timed" if isinstance(t, float) else "no")`,
      },
      {
        id: "tool4c2",
        prompt:
          "Look up the key 'missing' in the dict {'a': 1} inside a try/except. Catch the exception and print the error's type name using type(e).__name__. It should print KeyError.",
        hint: "except Exception as e: print(type(e).__name__)",
        validateFn: `return output.includes("KeyError")`,
        solution: `data = {"a": 1}
try:
    value = data["missing"]
except Exception as e:
    print(type(e).__name__)`,
      },
    ],
  },
  {
    module: "Tooling & Environments",
    moduleSlug: "tooling-environments",
    lessonNumber: 5,
    slug: "code-quality",
    title: "Code Quality: Style, Linting, Types",
    badge: "concept",
    theory: `
Readable code is cheaper to keep alive than clever code. Python has a shared
style guide, PEP 8, and tools that enforce it so you never argue about it in a
review.

- \`black\` formats your code automatically. Run it and stop thinking about
  spacing, quotes, and line breaks forever.
- \`ruff\` is a fast linter. It flags unused imports, undefined names, and
  hundreds of common mistakes in a fraction of a second.
- \`mypy\` checks your type hints. If a function says it returns \`int\` and you
  return \`None\` somewhere, mypy catches it before the program runs.

\`\`\`bash
black .        # format everything
ruff check .   # lint
mypy .         # type-check
\`\`\`

The conventions worth internalizing: \`snake_case\` for functions and variables,
\`CapWords\` for classes, \`UPPER_CASE\` for constants, four-space indents, and
short focused functions.

\`\`\`python
def average(numbers: list[float]) -> float:
    """Return the mean of a non-empty list of numbers."""
    return sum(numbers) / len(numbers)
\`\`\`

That signature tells a reader (and mypy, and your editor) exactly what goes in
and what comes out. The docstring says what it does in one line.

✨ Tip: wire these into CI so every pull request runs them. A failing format or
type check should block the merge, the same way a failing test does.
`,
    starterCode: `def average(numbers: list[float]) -> float:
    """Return the mean of a non-empty list of numbers."""
    return sum(numbers) / len(numbers)


print(average([10, 20, 30]))
`,
    examples: [
      {
        title: "a typed, documented function",
        explanation: "Hints plus a one-line docstring make the contract obvious",
        code: `def greet(name: str) -> str:
    """Return a greeting for the given name."""
    return f"hi {name}"


print(greet("sam"))`,
      },
      {
        title: "naming conventions in one place",
        explanation: "snake_case values, CapWords class, UPPER_CASE constant",
        code: `MAX_SCORE = 100


class ScoreBoard:
    def __init__(self):
        self.high_score = 0

    def record(self, points: int) -> None:
        self.high_score = min(points, MAX_SCORE)


board = ScoreBoard()
board.record(120)
print(board.high_score)`,
      },
    ],
    challenges: [
      {
        id: "tool5c1",
        prompt:
          "Write a function add_numbers(a: int, b: int) -> int with a one-line docstring that returns a + b. Print add_numbers(4, 5). It should print 9.",
        hint: "put a \"\"\"docstring\"\"\" as the first line of the body, then return a + b",
        validateFn: `return output.trim().split(/\\s+/).includes("9")`,
        solution: `def add_numbers(a: int, b: int) -> int:
    """Return the sum of two integers."""
    return a + b


print(add_numbers(4, 5))`,
      },
      {
        id: "tool5c2",
        prompt:
          "Define a constant MAX_SCORE = 100 (UPPER_CASE) and a function clamp_score(points: int) -> int that returns the smaller of points and MAX_SCORE. Print clamp_score(150). It should print 100.",
        hint: "return min(points, MAX_SCORE); constants go in UPPER_CASE by convention",
        validateFn: `return output.trim().split(/\\s+/).includes("100")`,
        solution: `MAX_SCORE = 100


def clamp_score(points: int) -> int:
    """Return points capped at MAX_SCORE."""
    return min(points, MAX_SCORE)


print(clamp_score(150))`,
      },
    ],
  },
  {
    module: "Tooling & Environments",
    moduleSlug: "tooling-environments",
    lessonNumber: 6,
    slug: "jupyter-notebooks",
    title: "Notebooks: When They Help and When They Hurt",
    badge: "concept",
    theory: `
A notebook is a JSON file full of cells. Markdown cells explain, code cells run, and
outputs are saved alongside the code that produced them. That combination is why
notebooks won for exploration, teaching, and anything you need to hand to a human.

\`\`\`json
{"cells": [
  {"cell_type": "markdown", "source": ["# Airport analysis"]},
  {"cell_type": "code", "source": ["print(df.shape)"], "outputs": []}
]}
\`\`\`

Because it is only JSON, you can inspect a notebook with the standard library. That is
worth knowing when one will not open, or when you want to count cells in a submission
without launching Jupyter.

**Where notebooks help:** exploring unfamiliar data, showing your work, teaching, and
anything where the output belongs next to the code that made it.

**Where they hurt:** anything that has to run twice the same way. Cells can be executed
out of order, so a notebook that works on your screen can be genuinely unreproducible.
The state in memory is not visible in the file.

⚠️ Warning: "Restart and Run All" before you trust or submit a notebook. If it fails,
it was passing only because of a variable defined in a cell you later edited or deleted.

✨ Tip: exporting to HTML or PDF with \`nbconvert\` is usually what a submission actually
requires, and it is one command:
\`jupyter nbconvert --to html analysis.ipynb\`

💡 Key: when code stops being explored and starts being depended on, move it into a
\`.py\` module and import it. Notebooks are a great workshop and a poor warehouse.
`,
    starterCode: `import json

notebook = json.loads("""
{"cells": [
  {"cell_type": "markdown", "source": ["# Airport analysis"]},
  {"cell_type": "code", "source": ["print(1 + 1)"], "outputs": []},
  {"cell_type": "code", "source": ["print('done')"], "outputs": []}
]}
""")

for cell in notebook["cells"]:
    print(cell["cell_type"], "->", cell["source"][0])
`,
    examples: [
      {
        title: "Counting cells by type",
        explanation: "A notebook is JSON, so this needs no Jupyter at all",
        code: `import json
nb = json.loads('{"cells":[{"cell_type":"code"},{"cell_type":"markdown"}]}')
codes = [c for c in nb["cells"] if c["cell_type"] == "code"]
print(len(codes), "code cells")`,
      },
      {
        title: "Export for submission",
        explanation: "The grader usually wants the rendered version, not the .ipynb",
        code: `print("jupyter nbconvert --to html analysis.ipynb")`,
      },
    ],
    challenges: [
      {
        id: "toolc6a",
        prompt:
          "Using the notebook JSON in the editor, write count_cells(nb, kind) that returns how many cells have that cell_type. Print the code-cell count as 'code cells: N'. It should be 2.",
        hint: 'Loop nb["cells"] and count the ones whose "cell_type" equals kind.',
        validateFn: `return /code cells:\\s*2/.test(output)`,
        solution: `import json

notebook = json.loads("""
{"cells": [
  {"cell_type": "markdown", "source": ["# Airport analysis"]},
  {"cell_type": "code", "source": ["print(1 + 1)"], "outputs": []},
  {"cell_type": "code", "source": ["print('done')"], "outputs": []}
]}
""")

def count_cells(nb, kind):
    return len([c for c in nb["cells"] if c["cell_type"] == kind])

print("code cells:", count_cells(notebook, "code"))`,
      },
      {
        id: "toolc6b",
        prompt:
          "Write extract_code(nb) that returns all code-cell source lines joined into one string, and print it. The output must contain both print statements from the notebook.",
        hint: 'Collect "".join(c["source"]) for code cells, then join those with newlines.',
        validateFn: `return output.includes("1 + 1") && output.includes("done")`,
        solution: `import json

notebook = json.loads("""
{"cells": [
  {"cell_type": "markdown", "source": ["# Airport analysis"]},
  {"cell_type": "code", "source": ["print(1 + 1)"], "outputs": []},
  {"cell_type": "code", "source": ["print('done')"], "outputs": []}
]}
""")

def extract_code(nb):
    return "\\n".join("".join(c["source"]) for c in nb["cells"] if c["cell_type"] == "code")

print(extract_code(notebook))`,
      },
    ],
  },
];
