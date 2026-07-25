// Module checkpoints: a short mixed quiz at the end of each module that checks
// understanding (multiple choice) and gives fill-in-the-blank code practice.
// Every item is grounded in concepts that module teaches, with no forward
// references. Fill-in `runnable` is the canonical fully-filled snippet and is
// verified by running it (with the starter data preloaded) in the test harness.

export interface McqItem {
  kind: "mcq";
  question: string;
  options: string[];
  answer: number; // index into options
  explain: string;
}

export interface FillItem {
  kind: "fill";
  prompt: string;
  // The snippet with one or more `___` blanks.
  template: string;
  // Accepted answers per blank (compared case- and whitespace-insensitively).
  // The first entry of each blank, substituted into the template, must equal
  // `runnable`.
  answers: string[][];
  explain: string;
  runnable: string;
}

export type CheckpointItem = McqItem | FillItem;

export function getCheckpoint(moduleSlug: string): CheckpointItem[] {
  return MODULE_CHECKPOINTS[moduleSlug] ?? [];
}

export function hasCheckpoint(moduleSlug: string): boolean {
  return (MODULE_CHECKPOINTS[moduleSlug]?.length ?? 0) > 0;
}

export const MODULE_CHECKPOINTS: Record<string, CheckpointItem[]> = {
  "start-here": [
    {
      kind: "mcq",
      question: "What does print() do?",
      options: ["Saves a file", "Shows a value as output", "Adds two numbers", "Deletes a variable"],
      answer: 1,
      explain: "print() displays whatever you put in the parentheses as output.",
    },
    {
      kind: "mcq",
      question: "Which of these is text (a string)?",
      options: ["42", '"hello"', "True", "3.14"],
      answer: 1,
      explain: "Quotes make it a string. No quotes and it is a number or a keyword.",
    },
    {
      kind: "fill",
      prompt: "Print the word hello.",
      template: "print(___)",
      answers: [['"hello"', "'hello'"]],
      explain: "Text needs quotes so Python treats it as a string.",
      runnable: 'print("hello")',
    },
    {
      kind: "fill",
      prompt: "Store your name in a variable called name, then print it.",
      template: 'name ___ "Sam"\nprint(name)',
      answers: [["="]],
      explain: "The single = assigns the value on the right to the name on the left.",
      runnable: 'name = "Sam"\nprint(name)',
    },
  ],

  "python-basics": [
    {
      kind: "mcq",
      question: "What does an f-string let you do?",
      options: ["Run faster code", "Drop a variable straight into text with {}", "Make a list", "Loop forever"],
      answer: 1,
      explain: 'f"hi {name}" inserts the value of name into the text.',
    },
    {
      kind: "mcq",
      question: "A list lets you...",
      options: ["Store one value only", "Hold several values in order", "Look values up by name", "Run a function"],
      answer: 1,
      explain: "Lists hold an ordered collection. Dicts look up by a key name.",
    },
    {
      kind: "fill",
      prompt: "Print the FIRST item of the list (lists are indexed from 0).",
      template: "nums = [10, 20, 30]\nprint(nums[___])",
      answers: [["0"]],
      explain: "Index 0 is the first element; nums[0] is 10.",
      runnable: "nums = [10, 20, 30]\nprint(nums[0])",
    },
    {
      kind: "fill",
      prompt: "Build a list of the squares of 0 through 4 with a comprehension.",
      template: "squares = [x ___ 2 for x in range(5)]\nprint(squares)",
      answers: [["**"]],
      explain: "** is the power operator, so x ** 2 squares each value.",
      runnable: "squares = [x ** 2 for x in range(5)]\nprint(squares)",
    },
  ],

  "pandas-fundamentals": [
    {
      kind: "mcq",
      question: "What is a DataFrame?",
      options: ["A single value", "A two-dimensional table of rows and columns", "A loop", "A function"],
      answer: 1,
      explain: "A DataFrame is a table; a single column of it is a Series.",
    },
    {
      kind: "mcq",
      question: "students[students[\"score\"] > 90] returns...",
      options: ["The score column", "Only the rows where score is above 90", "The number 90", "An error"],
      answer: 1,
      explain: "Boolean indexing keeps only the rows where the condition is True.",
    },
    {
      kind: "fill",
      prompt: "Select just the name column from the students DataFrame and print it.",
      template: "print(students[___])",
      answers: [['"name"', "'name'"]],
      explain: 'students["name"] selects a single column (a Series).',
      runnable: 'print(students["name"])',
    },
    {
      kind: "fill",
      prompt: "Sort the students by score and print the result.",
      template: "print(students.___(\"score\"))",
      answers: [["sort_values"]],
      explain: "sort_values(column) orders the rows by that column.",
      runnable: 'print(students.sort_values("score"))',
    },
  ],

  "data-cleaning": [
    {
      kind: "mcq",
      question: "What does df.dropna() do?",
      options: ["Drops a column", "Removes rows that contain missing values", "Fills blanks with 0", "Sorts the data"],
      answer: 1,
      explain: "dropna() removes rows with NaN; fillna() replaces them instead.",
    },
    {
      kind: "mcq",
      question: "To change a column from text to whole numbers you would use...",
      options: ['.astype(int)', ".dropna()", ".groupby()", ".head()"],
      answer: 0,
      explain: "astype(int) converts the column's type to integer.",
    },
    {
      kind: "fill",
      prompt: "Replace any missing values in a copy of students with 0 and print it.",
      template: "print(students.___(0))",
      answers: [["fillna"]],
      explain: "fillna(value) replaces missing entries with the value you give.",
      runnable: "print(students.fillna(0))",
    },
  ],

  "grouping-combining": [
    {
      kind: "mcq",
      question: "df.groupby(\"subject\")[\"score\"].mean() gives you...",
      options: ["Every score", "The average score per subject", "The number of subjects", "A sorted list"],
      answer: 1,
      explain: "groupby splits by subject, then mean() averages score within each group.",
    },
    {
      kind: "mcq",
      question: "merge() is used to...",
      options: ["Sort one table", "Combine two tables on a shared key column", "Delete duplicates", "Rename columns"],
      answer: 1,
      explain: "merge joins two DataFrames where a key column matches (like a SQL JOIN).",
    },
    {
      kind: "fill",
      prompt: "Get the average score per subject and print it.",
      template: 'print(students.___("subject")["score"].mean())',
      answers: [["groupby"]],
      explain: "groupby(column) groups rows so the aggregate runs per group.",
      runnable: 'print(students.groupby("subject")["score"].mean())',
    },
  ],

  "string-file-ops": [
    {
      kind: "mcq",
      question: 'What does "hello".upper() return?',
      options: ['"hello"', '"HELLO"', '"Hello"', "an error"],
      answer: 1,
      explain: "upper() returns an uppercase copy of the string.",
    },
    {
      kind: "mcq",
      question: "json.loads(text) does what?",
      options: ["Writes a file", "Turns a JSON string into a Python dict/list", "Uppercases text", "Opens a URL"],
      answer: 1,
      explain: "loads parses a JSON string into Python objects; dumps does the reverse.",
    },
    {
      kind: "fill",
      prompt: "Read the value for the key a from this parsed JSON and print it.",
      template: 'd = json.loads(\'{"a": 1, "b": 2}\')\nprint(d[___])',
      answers: [['"a"', "'a'"]],
      explain: "Once parsed, the JSON object is a dict you index by key.",
      runnable: 'd = json.loads(\'{"a": 1, "b": 2}\')\nprint(d["a"])',
    },
  ],

  "web-apis": [
    {
      kind: "mcq",
      question: "An API usually returns data in which format?",
      options: ["A photo", "JSON", "A spreadsheet", "A PDF"],
      answer: 1,
      explain: "Most web APIs respond with JSON, which parses cleanly into Python.",
    },
    {
      kind: "mcq",
      question: "In this sandbox, fetching a URL is asynchronous, so you must...",
      options: ["Use await on the fetch and the response", "Loop until it loads", "Save a file first", "Nothing special"],
      answer: 0,
      explain: "await pauses until the data arrives; the lesson covers it at the point of use.",
    },
    {
      kind: "fill",
      prompt: "This dict came from a parsed API response. Print the user's name.",
      template: 'user = json.loads(\'{"name": "Sam", "age": 30}\')\nprint(user[___])',
      answers: [['"name"', "'name'"]],
      explain: "API JSON becomes a dict; index it by the key you want.",
      runnable: 'user = json.loads(\'{"name": "Sam", "age": 30}\')\nprint(user["name"])',
    },
  ],

  "functions-apply": [
    {
      kind: "mcq",
      question: "A lambda is...",
      options: ["A loop", "A small one-line function with no name", "A type of list", "A pandas method"],
      answer: 1,
      explain: "lambda x: x * 2 is a tiny anonymous function.",
    },
    {
      kind: "mcq",
      question: "series.apply(func) does what?",
      options: ["Sorts the series", "Runs func on each value and returns the results", "Deletes values", "Counts rows"],
      answer: 1,
      explain: "apply maps a function over every element of the Series.",
    },
    {
      kind: "fill",
      prompt: "Write a lambda that doubles its input, then call it on 5.",
      template: "double = lambda x: x ___ 2\nprint(double(5))",
      answers: [["*"]],
      explain: "x * 2 doubles the value; double(5) prints 10.",
      runnable: "double = lambda x: x * 2\nprint(double(5))",
    },
  ],

  "core-python": [
    {
      kind: "mcq",
      question: "A set is a collection that...",
      options: ["Keeps duplicates and order", "Holds only unique items, unordered", "Looks values up by key", "Is always sorted"],
      answer: 1,
      explain: "Sets drop duplicates and have no fixed order.",
    },
    {
      kind: "mcq",
      question: "A generator (using yield) is useful because it...",
      options: ["Runs faster always", "Produces values lazily, one at a time", "Sorts data", "Is a kind of class"],
      answer: 1,
      explain: "Generators yield values on demand instead of building a whole list.",
    },
    {
      kind: "fill",
      prompt: "Print the items that are in BOTH sets (their intersection).",
      template: "a = {1, 2, 3}\nb = {2, 3, 4}\nprint(a ___ b)",
      answers: [["&"]],
      explain: "& is set intersection; a & b is {2, 3}.",
      runnable: "a = {1, 2, 3}\nb = {2, 3, 4}\nprint(a & b)",
    },
  ],

  "numpy-foundations": [
    {
      kind: "mcq",
      question: "A NumPy array differs from a list because it...",
      options: ["Can hold any mix of types", "Holds one dtype and supports fast vectorized math", "Cannot be indexed", "Is always 2D"],
      answer: 1,
      explain: "Arrays are single-dtype and do element-wise math without a loop.",
    },
    {
      kind: "mcq",
      question: "arr.mean(axis=0) on a 2D array computes the mean...",
      options: ["Of everything", "Down each column", "Across each row", "Of the first value"],
      answer: 1,
      explain: "axis=0 collapses rows, giving one mean per column.",
    },
    {
      kind: "fill",
      prompt: "Print the mean of this array.",
      template: "import numpy as np\narr = np.array([1, 2, 3, 4])\nprint(arr.___())",
      answers: [["mean"]],
      explain: "mean() averages the array; here that is 2.5.",
      runnable: "import numpy as np\narr = np.array([1, 2, 3, 4])\nprint(arr.mean())",
    },
    {
      kind: "fill",
      prompt: "Reshape these 6 values into a 2-by-3 grid and print it.",
      template: "import numpy as np\nm = np.array([1, 2, 3, 4, 5, 6]).___(2, 3)\nprint(m)",
      answers: [["reshape"]],
      explain: "reshape(rows, cols) rearranges the values into the new shape.",
      runnable: "import numpy as np\nm = np.array([1, 2, 3, 4, 5, 6]).reshape(2, 3)\nprint(m)",
    },
  ],

  "game-dev-pygame": [
    {
      kind: "mcq",
      question: "The classic game loop runs which order every frame?",
      options: ["draw, update, handle input", "handle input, update, draw", "update, draw, quit", "draw only"],
      answer: 1,
      explain: "Read input, update the world, then draw the new frame, over and over.",
    },
    {
      kind: "mcq",
      question: "Multiplying movement by delta time (dt) makes motion...",
      options: ["Random", "The same speed regardless of frame rate", "Faster on slow machines", "Stop"],
      answer: 1,
      explain: "Scaling by dt keeps speed consistent whether the game runs at 30 or 120 fps.",
    },
    {
      kind: "mcq",
      question: "Collision detection between two rectangles checks whether they...",
      options: ["Have the same color", "Overlap in space", "Are the same size", "Move the same direction"],
      answer: 1,
      explain: "Rect collision is about overlap of their areas, not color or size.",
    },
    {
      kind: "fill",
      prompt: "Move x by velocity times delta time (the position update each frame).",
      template: "x = 0\nvx = 5\ndt = 0.5\nx = x ___ vx * dt\nprint(x)",
      answers: [["+"]],
      explain: "New position is old position plus velocity * dt, here 2.5.",
      runnable: "x = 0\nvx = 5\ndt = 0.5\nx = x + vx * dt\nprint(x)",
    },
  ],

  "data-manipulation-school": [
    {
      kind: "mcq",
      question: "The .str accessor on a Series lets you...",
      options: ["Run SQL", "Apply string methods to every value", "Sort numerically", "Drop rows"],
      answer: 1,
      explain: 'students["name"].str.upper() uppercases every name.',
    },
    {
      kind: "mcq",
      question: "A pivot table mainly...",
      options: ["Deletes columns", "Reshapes long data into a summary grid", "Sorts rows", "Renames a column"],
      answer: 1,
      explain: "Pivot turns rows of values into a wide summary, one cell per group.",
    },
    {
      kind: "fill",
      prompt: "Uppercase every student name and print the result.",
      template: 'print(students["name"].str.___())',
      answers: [["upper"]],
      explain: "The .str accessor applies upper() to each string in the column.",
      runnable: 'print(students["name"].str.upper())',
    },
  ],

  "oop-tooling": [
    {
      kind: "mcq",
      question: "In a class, what is self?",
      options: ["The class name", "A reference to the specific instance", "A loop variable", "A module"],
      answer: 1,
      explain: "self is the particular object the method is running on.",
    },
    {
      kind: "mcq",
      question: "Inheritance lets a class...",
      options: ["Run faster", "Reuse and extend another class's behavior", "Avoid __init__", "Store more data"],
      answer: 1,
      explain: "A subclass inherits the parent's methods and can add or override them.",
    },
    {
      kind: "fill",
      prompt: "Store the name on the instance in __init__ so d.name works.",
      template: 'class Dog:\n    def __init__(self, name):\n        ___.name = name\n\nd = Dog("Rex")\nprint(d.name)',
      answers: [["self"]],
      explain: "self.name = name saves the value on this specific object.",
      runnable: 'class Dog:\n    def __init__(self, name):\n        self.name = name\n\nd = Dog("Rex")\nprint(d.name)',
    },
  ],

  "tooling-environments": [
    {
      kind: "mcq",
      question: "A virtual environment (venv) is for...",
      options: ["Making code run faster", "Isolating a project's packages from the system", "Writing tests", "Formatting code"],
      answer: 1,
      explain: "A venv keeps each project's dependencies separate and reproducible.",
    },
    {
      kind: "mcq",
      question: "In a test, what does assert do?",
      options: ["Prints a value", "Raises an error if the condition is False", "Imports a module", "Loops"],
      answer: 1,
      explain: "assert passes silently when True and fails the test when False.",
    },
    {
      kind: "fill",
      prompt: "Write the keyword that checks a condition in a test.",
      template: 'def test_add():\n    ___ 1 + 1 == 2\n\ntest_add()\nprint("ok")',
      answers: [["assert"]],
      explain: "assert 1 + 1 == 2 passes; a failing assert would raise AssertionError.",
      runnable: 'def test_add():\n    assert 1 + 1 == 2\n\ntest_add()\nprint("ok")',
    },
  ],

  "ai-python": [
    {
      kind: "mcq",
      question: "Why is it dangerous to f-string user text straight into a system prompt?",
      options: [
        "It costs more tokens",
        "The user's text becomes instructions the model may follow",
        "It breaks JSON parsing",
        "System prompts cannot contain variables",
      ],
      answer: 1,
      explain:
        "Instructions and untrusted text should live in different roles, with the untrusted part fenced, or the caller can redirect the model.",
    },
    {
      kind: "mcq",
      question: "A batch of 500 model calls dies on row 34. What was the mistake?",
      options: [
        "Not enough tokens",
        "The try/except wrapped the whole loop instead of each item",
        "The temperature was too high",
        "The prompt was too short",
      ],
      answer: 1,
      explain:
        "Catch per item and collect failures, so one bad row is one bad row rather than the end of the run.",
    },
    {
      kind: "mcq",
      question: "Cosine similarity ignores vector magnitude. Why does that help?",
      options: [
        "It makes the math faster",
        "A long and a short document about the same topic still look similar",
        "It avoids division entirely",
        "It guarantees a positive score",
      ],
      answer: 1,
      explain: "Direction carries the meaning; length mostly carries how much text there was.",
    },
    {
      kind: "fill",
      prompt: "Compute cosine similarity between two vectors.",
      template:
        "import numpy as np\na = np.array([1.0, 0.0])\nb = np.array([1.0, 0.0])\nprint(float(np.dot(a, b) / (np.linalg.___(a) * np.linalg.___(b))))",
      answers: [["norm"], ["norm"]],
      explain: "np.linalg.norm is the vector length; dividing by both gives the angle.",
      runnable:
        "import numpy as np\na = np.array([1.0, 0.0])\nb = np.array([1.0, 0.0])\nprint(float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))))",
    },
    {
      kind: "fill",
      prompt: "Stop one failure from ending the whole batch.",
      template:
        "results, failures = [], []\nfor item in ['ok', 'BAD']:\n    ___:\n        if item == 'BAD':\n            raise ValueError('rate limited')\n        results.append(item)\n    except Exception as exc:\n        failures.append(exc)\nprint(len(results), len(failures))",
      answers: [["try"]],
      explain: "try inside the loop keeps the successes you already have.",
      runnable:
        "results, failures = [], []\nfor item in ['ok', 'BAD']:\n    try:\n        if item == 'BAD':\n            raise ValueError('rate limited')\n        results.append(item)\n    except Exception as exc:\n        failures.append(exc)\nprint(len(results), len(failures))",
    },
  ],
  "databases-python": [
    {
      kind: "mcq",
      question: "Why is cur.execute(f\"... WHERE name = '{name}'\") unsafe?",
      options: [
        "It is slower than a parameter",
        "The value is parsed as SQL, so input can change the query",
        "sqlite does not support f-strings",
        "It uses more memory",
      ],
      answer: 1,
      explain:
        "With a parameter the database receives query and value separately, so the value can never be executed.",
    },
    {
      kind: "mcq",
      question: "Your script inserts in a loop, prints happily, exits, and the table is empty. Why?",
      options: [
        "The table was dropped",
        "No commit, so the transaction was never made permanent",
        "sqlite cannot insert in a loop",
        "The rows went to a different table",
      ],
      answer: 1,
      explain: "Nothing is durable until commit. `with conn:` does it for you on a clean exit.",
    },
    {
      kind: "mcq",
      question: "In sqlite, foreign keys are...",
      options: [
        "Always enforced",
        "Off unless you set PRAGMA foreign_keys = ON per connection",
        "Only available in Postgres",
        "Enforced only inside a transaction",
      ],
      answer: 1,
      explain:
        "This is the classic sqlite trap: code that seems fine locally then fails on Postgres, which always enforces.",
    },
    {
      kind: "fill",
      prompt: "Insert a row safely, without string formatting.",
      template:
        "import sqlite3\nconn = sqlite3.connect(':memory:')\nconn.execute('CREATE TABLE t (code TEXT)')\nconn.execute('INSERT INTO t VALUES (___)', ('MKE',))\nprint(conn.execute('SELECT code FROM t').fetchone()[0])",
      answers: [["?"]],
      explain: "The ? placeholder keeps the value out of the SQL text entirely.",
      runnable:
        "import sqlite3\nconn = sqlite3.connect(':memory:')\nconn.execute('CREATE TABLE t (code TEXT)')\nconn.execute('INSERT INTO t VALUES (?)', ('MKE',))\nprint(conn.execute('SELECT code FROM t').fetchone()[0])",
    },
    {
      kind: "fill",
      prompt: "Get rows you can index by column name instead of by number.",
      template:
        "import sqlite3\nconn = sqlite3.connect(':memory:')\nconn.row_factory = sqlite3.___\nconn.execute('CREATE TABLE t (city TEXT)')\nconn.execute(\"INSERT INTO t VALUES ('Milwaukee')\")\nprint(conn.execute('SELECT city FROM t').fetchone()['city'])",
      answers: [["Row"]],
      explain: "sqlite3.Row makes a column rename break loudly instead of silently shifting indexes.",
      runnable:
        "import sqlite3\nconn = sqlite3.connect(':memory:')\nconn.row_factory = sqlite3.Row\nconn.execute('CREATE TABLE t (city TEXT)')\nconn.execute(\"INSERT INTO t VALUES ('Milwaukee')\")\nprint(conn.execute('SELECT city FROM t').fetchone()['city'])",
    },
  ],
  "building-apis": [
    {
      kind: "mcq",
      question: "A caller sends a valid token but lacks permission. Which status?",
      options: ["401", "403", "404", "422"],
      answer: 1,
      explain:
        "401 means we do not know who you are. 403 means we do, and you still may not. Returning 401 sends them to debug the wrong problem.",
    },
    {
      kind: "mcq",
      question: "Why is returning 200 with {\"error\": \"...\"} a bad idea?",
      options: [
        "It uses more bandwidth",
        "Callers must parse the body to learn it failed, and monitoring sees success",
        "JSON cannot hold an error key",
        "It breaks CORS",
      ],
      answer: 1,
      explain: "The status code is the part every client and every dashboard reads first.",
    },
    {
      kind: "mcq",
      question: "Validation should collect every field error because...",
      options: [
        "It is faster",
        "Reporting one problem per submission makes an API miserable to use",
        "The spec requires it",
        "Otherwise the request retries",
      ],
      answer: 1,
      explain: "Fix-one-resubmit-find-another is the worst form filling experience there is.",
    },
    {
      kind: "fill",
      prompt: "Compare a secret without leaking it through timing.",
      template:
        "import hmac\nprint(hmac.___(\"sk-abc\", \"sk-abc\"))",
      answers: [["compare_digest"]],
      explain: "== returns early on the first differing byte, which leaks the value one character at a time.",
      runnable: "import hmac\nprint(hmac.compare_digest(\"sk-abc\", \"sk-abc\"))",
    },
  ],
  "shipping-python": [
    {
      kind: "mcq",
      question: "Your container runs but nothing can reach it. Most likely cause?",
      options: [
        "Missing requirements.txt",
        "It binds 127.0.0.1, which inside a container means only the container",
        "The image is too small",
        "No health check",
      ],
      answer: 1,
      explain: "Bind 0.0.0.0 in a container. This is the most common 'it works but I cannot connect' bug.",
    },
    {
      kind: "mcq",
      question: "Why copy requirements.txt before copying your code in a Dockerfile?",
      options: [
        "Alphabetical order",
        "Layer caching: changing one line of Python would otherwise reinstall every dependency",
        "pip requires it",
        "It makes the image smaller",
      ],
      answer: 1,
      explain: "Builds go from seconds to minutes if the dependency layer is invalidated by every commit.",
    },
    {
      kind: "mcq",
      question: "A health check that always returns ok is worse than none because...",
      options: [
        "It uses CPU",
        "The orchestrator keeps routing traffic to a process whose dependencies are dead",
        "It fails the linter",
        "It requires authentication",
      ],
      answer: 1,
      explain: "A check that cannot fail is not a check. Separate liveness from readiness.",
    },
    {
      kind: "fill",
      prompt: "Refuse to start when required config is missing.",
      template:
        "env = {}\nmissing = [k for k in ('DATABASE_URL',) if k ___ env]\nprint('missing:', missing)",
      answers: [["not in"]],
      explain: "Validate at startup so a half-configured process never boots.",
      runnable:
        "env = {}\nmissing = [k for k in ('DATABASE_URL',) if k not in env]\nprint('missing:', missing)",
    },
  ],
};
