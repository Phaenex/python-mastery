import type { Lesson } from "../types";

// Databases from Python. Unusually for this site, all of this is genuinely real:
// sqlite3 is in the CPython standard library, so Pyodide has it, which means every
// query below actually executes against a real database engine in the browser. No
// simulation, no stand-in. The SQL you write here is the SQL you would write against
// Postgres, minus dialect differences called out where they matter.
//
// Databases are the missing bridge on this site: the SQL material lives in a separate
// app and never touches Python, which is not how the job works.

export const lessonsModuleDatabases: Lesson[] = [
  {
    module: "Databases from Python",
    moduleSlug: "databases-python",
    lessonNumber: 1,
    slug: "connect-and-query",
    title: "Connect, Query, and Get Rows Back",
    badge: "concept",
    theory: `
Every database library in Python follows the same shape, because they all implement the
same specification (DB-API 2.0). Learn it once with sqlite3 and psycopg or mysqlclient
will look familiar.

\`\`\`python
import sqlite3

conn = sqlite3.connect(":memory:")   # or a filename
cur = conn.cursor()
cur.execute("SELECT 1")
print(cur.fetchone())
\`\`\`

Four objects, and that is the whole model:

- **Connection** is your session with the database.
- **Cursor** runs statements and holds the results.
- **fetchone / fetchall / fetchmany** pull rows out.
- **commit** makes your changes permanent.

\`\`\`python
conn.execute("CREATE TABLE airports (code TEXT, city TEXT)")
conn.execute("INSERT INTO airports VALUES ('MKE', 'Milwaukee')")
rows = conn.execute("SELECT * FROM airports").fetchall()
\`\`\`

💡 Key: \`":memory:"\` gives you a real database that vanishes when the program ends.
Perfect for learning and for tests, and it is what every lesson here uses.

✨ Tip: rows come back as tuples by default, so \`row[0]\` is the first column. That is
fine for a quick script and miserable in real code. Lesson 5 fixes it properly.

📝 Note: this is not a simulation. sqlite3 is part of the Python standard library, so it
is compiled into the browser runtime. You are running a real SQL engine right now.
`,
    starterCode: `import sqlite3

conn = sqlite3.connect(":memory:")
conn.execute("CREATE TABLE airports (code TEXT, city TEXT, state TEXT)")
conn.execute("INSERT INTO airports VALUES ('MKE', 'Milwaukee', 'WI')")
conn.execute("INSERT INTO airports VALUES ('ORD', 'Chicago', 'IL')")

for row in conn.execute("SELECT code, city FROM airports"):
    print(row[0], "->", row[1])
`,
    examples: [
      {
        title: "fetchone versus fetchall",
        explanation: "One row as a tuple, or every row as a list of tuples",
        code: `import sqlite3
conn = sqlite3.connect(":memory:")
conn.execute("CREATE TABLE t (n INT)")
conn.executemany("INSERT INTO t VALUES (?)", [(1,), (2,), (3,)])
print("one:", conn.execute("SELECT n FROM t").fetchone())
print("all:", conn.execute("SELECT n FROM t").fetchall())`,
      },
      {
        title: "executemany for bulk inserts",
        explanation: "One statement, many parameter tuples, far faster than a Python loop",
        code: `import sqlite3
conn = sqlite3.connect(":memory:")
conn.execute("CREATE TABLE t (code TEXT)")
conn.executemany("INSERT INTO t VALUES (?)", [("MKE",), ("ORD",), ("MSN",)])
print(conn.execute("SELECT COUNT(*) FROM t").fetchone()[0], "rows")`,
      },
    ],
    challenges: [
      {
        id: "db1c1",
        prompt:
          "Create an in-memory database with an airports table (code, city, state), insert the three Wisconsin and Illinois airports from the editor plus MSN/Madison/WI, then print the total row count as 'rows: N'. You should get rows: 3.",
        hint: "conn.executemany with a list of tuples, then SELECT COUNT(*) and fetchone()[0].",
        validateFn: `return /rows:\\s*3/.test(output)`,
        solution: `import sqlite3

conn = sqlite3.connect(":memory:")
conn.execute("CREATE TABLE airports (code TEXT, city TEXT, state TEXT)")
conn.executemany("INSERT INTO airports VALUES (?, ?, ?)", [
    ("MKE", "Milwaukee", "WI"),
    ("ORD", "Chicago", "IL"),
    ("MSN", "Madison", "WI"),
])
print("rows:", conn.execute("SELECT COUNT(*) FROM airports").fetchone()[0])`,
      },
      {
        id: "db1c2",
        prompt:
          "Query only the Wisconsin airports and print each code on its own line. Your output should contain MKE and MSN but not ORD.",
        hint: "SELECT code FROM airports WHERE state = 'WI', then loop the cursor and print row[0].",
        validateFn: `return output.includes("MKE") && output.includes("MSN") && !output.includes("ORD")`,
        solution: `import sqlite3

conn = sqlite3.connect(":memory:")
conn.execute("CREATE TABLE airports (code TEXT, city TEXT, state TEXT)")
conn.executemany("INSERT INTO airports VALUES (?, ?, ?)", [
    ("MKE", "Milwaukee", "WI"),
    ("ORD", "Chicago", "IL"),
    ("MSN", "Madison", "WI"),
])
for row in conn.execute("SELECT code FROM airports WHERE state = 'WI'"):
    print(row[0])`,
      },
    ],
  },

  {
    module: "Databases from Python",
    moduleSlug: "databases-python",
    lessonNumber: 2,
    slug: "sql-injection",
    title: "Parameters, Not F-Strings",
    badge: "challenge",
    theory: `
This is the most important lesson in the module and it is one rule.

**Never build SQL with string formatting. Pass parameters.**

\`\`\`python
# catastrophic
cur.execute(f"SELECT * FROM users WHERE name = '{name}'")

# correct
cur.execute("SELECT * FROM users WHERE name = ?", (name,))
\`\`\`

Look at what the first one does when \`name\` is \`' OR '1'='1\`:

\`\`\`sql
SELECT * FROM users WHERE name = '' OR '1'='1'
\`\`\`

Every row, returned. Change the payload slightly and it drops your table instead. This
is not a theoretical exploit; it is consistently one of the most common serious web
vulnerabilities in the world, and the fix is one character.

With a parameter, the database receives the query and the value **separately**. The
value is never parsed as SQL, so there is nothing to escape and nothing to get wrong.

⚠️ Warning: the placeholder is \`?\` in sqlite3 and \`%s\` in psycopg. That is a library
difference, not a style choice. Using the wrong one is an error, not a vulnerability.

💡 Key: parameters are for **values**, not for table or column names. You cannot write
\`SELECT ? FROM t\`. If a column name has to be dynamic, check it against a list you
control, exactly like the tool dispatcher in the AI track.

✨ Tip: the trailing comma in \`(name,)\` matters. \`(name)\` is just \`name\` in parentheses,
not a tuple, and you will get a confusing type error.
`,
    starterCode: `import sqlite3

conn = sqlite3.connect(":memory:")
conn.execute("CREATE TABLE users (name TEXT, email TEXT)")
conn.executemany("INSERT INTO users VALUES (?, ?)", [
    ("nick", "nick@example.com"),
    ("admin", "admin@example.com"),
])

# The attack: this input is designed to escape the quotes.
evil = "' OR '1'='1"

unsafe = f"SELECT name FROM users WHERE name = '{evil}'"
print("unsafe returned:", len(conn.execute(unsafe).fetchall()), "rows")

safe = conn.execute("SELECT name FROM users WHERE name = ?", (evil,)).fetchall()
print("safe returned:", len(safe), "rows")
`,
    examples: [
      {
        title: "Parameters are values only",
        explanation: "A dynamic column has to be validated against a list you control",
        code: `ALLOWED = {"code", "city", "state"}
column = "city"
if column not in ALLOWED:
    raise ValueError("bad column")
print(f"SELECT {column} FROM airports  <- safe only because it was checked")`,
      },
      {
        title: "The tuple comma",
        explanation: "Without the comma it is not a tuple and the driver complains",
        code: `name = "nick"
print(type((name,)).__name__, "vs", type((name)).__name__)`,
      },
    ],
    challenges: [
      {
        id: "db2c1",
        prompt:
          "Run the editor's code and show the difference. Print 'unsafe: N rows' and 'safe: M rows'. The unsafe query should return 2 (every user) and the parameterized one 0.",
        hint: "Build the f-string query and execute it, then execute the same logic with a ? placeholder and pass (evil,) as parameters.",
        validateFn: `return /unsafe:\\s*2\\s*rows/.test(output) && /safe:\\s*0\\s*rows/.test(output)`,
        solution: `import sqlite3

conn = sqlite3.connect(":memory:")
conn.execute("CREATE TABLE users (name TEXT, email TEXT)")
conn.executemany("INSERT INTO users VALUES (?, ?)", [
    ("nick", "nick@example.com"),
    ("admin", "admin@example.com"),
])

evil = "' OR '1'='1"
unsafe = conn.execute(f"SELECT name FROM users WHERE name = '{evil}'").fetchall()
safe = conn.execute("SELECT name FROM users WHERE name = ?", (evil,)).fetchall()
print(f"unsafe: {len(unsafe)} rows")
print(f"safe: {len(safe)} rows")`,
      },
      {
        id: "db2c2",
        prompt:
          "Write safe_sort_column(name) that returns the column name only when it is in an allowlist of code, city, state, and otherwise raises ValueError. Print the result for 'city', then print 'rejected' after catching the error for 'city; DROP TABLE users'.",
        hint: "Keep a set of allowed names; raise ValueError when the argument is not in it; wrap the bad call in try/except and print rejected.",
        validateFn: `return output.includes("city") && output.toLowerCase().includes("rejected")`,
        solution: `ALLOWED = {"code", "city", "state"}

def safe_sort_column(name):
    if name not in ALLOWED:
        raise ValueError(f"disallowed column: {name}")
    return name

print(safe_sort_column("city"))
try:
    safe_sort_column("city; DROP TABLE users")
except ValueError:
    print("rejected")`,
      },
    ],
  },

  {
    module: "Databases from Python",
    moduleSlug: "databases-python",
    lessonNumber: 3,
    slug: "transactions",
    title: "Transactions: All of It or None of It",
    badge: "practice",
    theory: `
Moving money between two accounts is two statements. If the process dies between them,
one account is short and the other never gained it. A transaction makes that impossible:
either both statements land or neither does.

\`\`\`python
try:
    conn.execute("UPDATE accounts SET balance = balance - 100 WHERE id = 1")
    conn.execute("UPDATE accounts SET balance = balance + 100 WHERE id = 2")
    conn.commit()
except Exception:
    conn.rollback()
    raise
\`\`\`

Nothing you write is permanent until \`commit\`. \`rollback\` throws away everything since
the last commit, as though it never happened.

The context manager does this for you, and is what you should reach for:

\`\`\`python
with conn:
    conn.execute(...)
    conn.execute(...)
# commits on clean exit, rolls back if the block raised
\`\`\`

⚠️ Warning: \`with conn:\` manages the **transaction**, not the connection. It does not
close anything. That surprises people who expect it to behave like \`with open(...)\`.

💡 Key: the classic data-loss bug is a script that inserts in a loop and never commits.
It runs, prints happily, exits, and the database is empty. If your writes vanish,
suspect a missing commit before you suspect anything else.
`,
    starterCode: `import sqlite3

conn = sqlite3.connect(":memory:")
conn.execute("CREATE TABLE accounts (id INT, balance INT)")
conn.executemany("INSERT INTO accounts VALUES (?, ?)", [(1, 500), (2, 100)])
conn.commit()

def balances():
    return conn.execute("SELECT id, balance FROM accounts ORDER BY id").fetchall()

print("before:", balances())

try:
    with conn:
        conn.execute("UPDATE accounts SET balance = balance - 100 WHERE id = 1")
        raise ValueError("something failed mid-transfer")
except ValueError:
    pass

print("after failed transfer:", balances())
`,
    examples: [
      {
        title: "A clean transfer commits both halves",
        explanation: "The with block commits when it exits without an exception",
        code: `import sqlite3
conn = sqlite3.connect(":memory:")
conn.execute("CREATE TABLE a (id INT, bal INT)")
conn.executemany("INSERT INTO a VALUES (?,?)", [(1,500),(2,100)])
with conn:
    conn.execute("UPDATE a SET bal = bal - 100 WHERE id = 1")
    conn.execute("UPDATE a SET bal = bal + 100 WHERE id = 2")
print(conn.execute("SELECT bal FROM a ORDER BY id").fetchall())`,
      },
      {
        title: "The silent data-loss bug",
        explanation: "Writes without a commit disappear when the connection closes",
        code: `import sqlite3
conn = sqlite3.connect(":memory:")
conn.execute("CREATE TABLE t (n INT)")
conn.execute("INSERT INTO t VALUES (1)")
print("visible in this session:", conn.execute("SELECT COUNT(*) FROM t").fetchone()[0])
print("but never committed, so a new connection would see nothing")`,
      },
    ],
    challenges: [
      {
        id: "db3c1",
        prompt:
          "Using the editor's accounts table, attempt a transfer inside a with conn: block that raises partway through. Print the balances afterwards as a list. Account 1 must still be 500, proving the rollback happened.",
        hint: "Wrap the with block in try/except, raise inside it after the first UPDATE, then print the fetchall of balances.",
        validateFn: `return output.includes("500") && !/\\b400\\b/.test(output)`,
        solution: `import sqlite3

conn = sqlite3.connect(":memory:")
conn.execute("CREATE TABLE accounts (id INT, balance INT)")
conn.executemany("INSERT INTO accounts VALUES (?, ?)", [(1, 500), (2, 100)])
conn.commit()

try:
    with conn:
        conn.execute("UPDATE accounts SET balance = balance - 100 WHERE id = 1")
        raise ValueError("failed mid-transfer")
except ValueError:
    pass

print(conn.execute("SELECT balance FROM accounts ORDER BY id").fetchall())`,
      },
      {
        id: "db3c2",
        prompt:
          "Now do a transfer that succeeds. Move 100 from account 1 to account 2 inside a with conn: block and print the balances. You should see 400 and 200.",
        hint: "Two UPDATE statements inside with conn:, then print the fetchall.",
        validateFn: `return output.includes("400") && output.includes("200")`,
        solution: `import sqlite3

conn = sqlite3.connect(":memory:")
conn.execute("CREATE TABLE accounts (id INT, balance INT)")
conn.executemany("INSERT INTO accounts VALUES (?, ?)", [(1, 500), (2, 100)])
conn.commit()

with conn:
    conn.execute("UPDATE accounts SET balance = balance - 100 WHERE id = 1")
    conn.execute("UPDATE accounts SET balance = balance + 100 WHERE id = 2")

print(conn.execute("SELECT balance FROM accounts ORDER BY id").fetchall())`,
      },
    ],
  },

  {
    module: "Databases from Python",
    moduleSlug: "databases-python",
    lessonNumber: 4,
    slug: "schema-and-constraints",
    title: "Let the Database Enforce Your Rules",
    badge: "practice",
    theory: `
Validation in Python protects you from your own code. Constraints in the schema protect
you from every other route into the database: a migration script, a colleague's job, a
console session at midnight.

\`\`\`sql
CREATE TABLE airports (
    code    TEXT PRIMARY KEY,
    city    TEXT NOT NULL,
    state   TEXT NOT NULL CHECK (length(state) = 2),
    runways INTEGER DEFAULT 1
)
\`\`\`

- **PRIMARY KEY** means unique and not null. Duplicates are rejected.
- **NOT NULL** means the column must have a value.
- **CHECK** enforces a rule the database evaluates itself.
- **FOREIGN KEY** means a value must exist in another table.

When a write breaks a rule, the driver raises \`sqlite3.IntegrityError\`. That exception is
a feature. It is the database refusing to hold bad data.

⚠️ Warning: sqlite does not enforce foreign keys unless you turn them on, per connection:
\`conn.execute("PRAGMA foreign_keys = ON")\`. Forgetting this is a classic sqlite trap,
and code that seems to work locally then fails against Postgres, which always enforces.

💡 Key: put the rule in the schema when it must always be true. Put it in Python when it
depends on context. "State codes are two characters" is always true. "Only admins can do
this" is not a database rule.
`,
    starterCode: `import sqlite3

conn = sqlite3.connect(":memory:")
conn.execute("""
    CREATE TABLE airports (
        code  TEXT PRIMARY KEY,
        city  TEXT NOT NULL,
        state TEXT NOT NULL CHECK (length(state) = 2)
    )
""")

conn.execute("INSERT INTO airports VALUES ('MKE', 'Milwaukee', 'WI')")

try:
    conn.execute("INSERT INTO airports VALUES ('MKE', 'Duplicate', 'WI')")
except sqlite3.IntegrityError as exc:
    print("rejected duplicate:", exc)
`,
    examples: [
      {
        title: "A CHECK constraint refusing bad data",
        explanation: "The rule lives in the schema, so nothing can write around it",
        code: `import sqlite3
conn = sqlite3.connect(":memory:")
conn.execute("CREATE TABLE t (state TEXT CHECK (length(state) = 2))")
try:
    conn.execute("INSERT INTO t VALUES ('Wisconsin')")
except sqlite3.IntegrityError as e:
    print("rejected:", e)`,
      },
      {
        title: "Foreign keys are off by default in sqlite",
        explanation: "One PRAGMA per connection, and it must be set before you rely on it",
        code: `import sqlite3
conn = sqlite3.connect(":memory:")
print("before:", conn.execute("PRAGMA foreign_keys").fetchone()[0])
conn.execute("PRAGMA foreign_keys = ON")
print("after:", conn.execute("PRAGMA foreign_keys").fetchone()[0])`,
      },
    ],
    challenges: [
      {
        id: "db4c1",
        prompt:
          "Create the airports table with the constraints in the editor, insert MKE successfully, then attempt an insert with the state 'Wisconsin'. Catch the IntegrityError and print 'rejected: bad state'. Output must contain that phrase.",
        hint: "Wrap the bad INSERT in try/except sqlite3.IntegrityError and print your message.",
        validateFn: `return output.toLowerCase().includes("rejected: bad state")`,
        solution: `import sqlite3

conn = sqlite3.connect(":memory:")
conn.execute("""
    CREATE TABLE airports (
        code  TEXT PRIMARY KEY,
        city  TEXT NOT NULL,
        state TEXT NOT NULL CHECK (length(state) = 2)
    )
""")
conn.execute("INSERT INTO airports VALUES ('MKE', 'Milwaukee', 'WI')")

try:
    conn.execute("INSERT INTO airports VALUES ('MSN', 'Madison', 'Wisconsin')")
except sqlite3.IntegrityError:
    print("rejected: bad state")`,
      },
      {
        id: "db4c2",
        prompt:
          "Turn foreign keys on and prove it. Print the PRAGMA foreign_keys value before and after enabling it, as 'before: 0' and 'after: 1'.",
        hint: 'conn.execute("PRAGMA foreign_keys").fetchone()[0] reads it; PRAGMA foreign_keys = ON sets it.',
        validateFn: `return /before:\\s*0/.test(output) && /after:\\s*1/.test(output)`,
        solution: `import sqlite3

conn = sqlite3.connect(":memory:")
print("before:", conn.execute("PRAGMA foreign_keys").fetchone()[0])
conn.execute("PRAGMA foreign_keys = ON")
print("after:", conn.execute("PRAGMA foreign_keys").fetchone()[0])`,
      },
    ],
  },

  {
    module: "Databases from Python",
    moduleSlug: "databases-python",
    lessonNumber: 5,
    slug: "rows-to-objects",
    title: "Stop Indexing Tuples",
    badge: "practice",
    theory: `
\`row[0]\`, \`row[1]\`, \`row[2]\`. It works until someone adds a column in the middle and
every index after it silently means something else. Nothing errors. The data is just
wrong from then on.

Two fixes, both a single line.

**Row factory** gives you rows you can access by name:

\`\`\`python
conn.row_factory = sqlite3.Row
row = conn.execute("SELECT code, city FROM airports").fetchone()
print(row["city"])
\`\`\`

**Dataclasses** give you a real object with types, which pairs with everything from the
OOP module:

\`\`\`python
from dataclasses import dataclass

@dataclass
class Airport:
    code: str
    city: str
    state: str

rows = conn.execute("SELECT code, city, state FROM airports").fetchall()
airports = [Airport(*r) for r in rows]
\`\`\`

💡 Key: \`Airport(*r)\` still depends on column order. If you want to be safe against a
reordered SELECT, use \`sqlite3.Row\` and build with keywords: \`Airport(**dict(r))\`.

✨ Tip: this is the seam where an ORM like SQLAlchemy takes over. Understanding what it
does for you, mapping rows onto objects, makes it a convenience rather than magic.

⚠️ Warning: never write \`SELECT *\` in code you keep. The columns you get depend on the
schema at runtime, which is exactly the fragility you are trying to remove. Name them.
`,
    starterCode: `import sqlite3
from dataclasses import dataclass

@dataclass
class Airport:
    code: str
    city: str
    state: str

conn = sqlite3.connect(":memory:")
conn.row_factory = sqlite3.Row
conn.execute("CREATE TABLE airports (code TEXT, city TEXT, state TEXT)")
conn.executemany("INSERT INTO airports VALUES (?,?,?)", [
    ("MKE", "Milwaukee", "WI"),
    ("ORD", "Chicago", "IL"),
])

for r in conn.execute("SELECT code, city, state FROM airports"):
    a = Airport(**dict(r))
    print(a.code, a.city)
`,
    examples: [
      {
        title: "sqlite3.Row indexes by name",
        explanation: "Adding a column no longer breaks every access after it",
        code: `import sqlite3
conn = sqlite3.connect(":memory:")
conn.row_factory = sqlite3.Row
conn.execute("CREATE TABLE t (code TEXT, city TEXT)")
conn.execute("INSERT INTO t VALUES ('MKE','Milwaukee')")
r = conn.execute("SELECT code, city FROM t").fetchone()
print(r["city"])`,
      },
      {
        title: "Why SELECT * is a trap",
        explanation: "Positional unpacking breaks the moment the schema changes",
        code: `row = ("MKE", "Milwaukee", "WI")
code, city, state = row
print(code, city, state, "<- add a column and this silently shifts")`,
      },
    ],
    challenges: [
      {
        id: "db5c1",
        prompt:
          "Set conn.row_factory to sqlite3.Row, query the airports, and print each city by name rather than by index. Output should contain Milwaukee and Chicago.",
        hint: 'Set conn.row_factory = sqlite3.Row before querying, then use row["city"].',
        validateFn: `return output.includes("Milwaukee") && output.includes("Chicago")`,
        solution: `import sqlite3

conn = sqlite3.connect(":memory:")
conn.row_factory = sqlite3.Row
conn.execute("CREATE TABLE airports (code TEXT, city TEXT, state TEXT)")
conn.executemany("INSERT INTO airports VALUES (?,?,?)", [
    ("MKE", "Milwaukee", "WI"),
    ("ORD", "Chicago", "IL"),
])
for r in conn.execute("SELECT code, city, state FROM airports"):
    print(r["city"])`,
      },
      {
        id: "db5c2",
        prompt:
          "Build a list of Airport dataclass instances from the query using keyword construction, then print how many you built and the state of the first one, as 'built: 2' and 'first state: WI'.",
        hint: "Airport(**dict(r)) works because row_factory gives you a mapping. len() the list, then access .state.",
        validateFn: `return /built:\\s*2/.test(output) && /first state:\\s*WI/.test(output)`,
        solution: `import sqlite3
from dataclasses import dataclass

@dataclass
class Airport:
    code: str
    city: str
    state: str

conn = sqlite3.connect(":memory:")
conn.row_factory = sqlite3.Row
conn.execute("CREATE TABLE airports (code TEXT, city TEXT, state TEXT)")
conn.executemany("INSERT INTO airports VALUES (?,?,?)", [
    ("MKE", "Milwaukee", "WI"),
    ("ORD", "Chicago", "IL"),
])

airports = [Airport(**dict(r)) for r in conn.execute("SELECT code, city, state FROM airports")]
print("built:", len(airports))
print("first state:", airports[0].state)`,
      },
    ],
  },

  {
    module: "Databases from Python",
    moduleSlug: "databases-python",
    lessonNumber: 6,
    slug: "pandas-and-sql",
    title: "pandas and SQL, Together",
    badge: "practice",
    theory: `
You now know both halves of this: the pandas modules and this one. They meet in two
functions.

\`\`\`python
import pandas as pd

df = pd.read_sql("SELECT code, city FROM airports", conn)
df.to_sql("airports_copy", conn, index=False, if_exists="replace")
\`\`\`

The real question is not how, it is **where the work should happen**.

**Do it in SQL when** you are filtering or aggregating a large table. The database is
built for it, has indexes, and sending fewer rows over the wire is almost always the
win. \`SELECT ... WHERE state = 'WI'\` beats loading everything and filtering in pandas.

**Do it in pandas when** the operation is awkward in SQL, or you are iterating on
analysis and want the whole working set in memory.

The mistake is \`pd.read_sql("SELECT * FROM huge_table", conn)\` followed by a filter that
throws away 99% of it. You paid to move all of it for nothing.

💡 Key: push filtering and aggregation down to the database, pull the smallest result
that answers your question, then use pandas for shaping and analysis.

✨ Tip: \`read_sql\` takes parameters too, so the injection rule from lesson 2 still
applies: \`pd.read_sql("SELECT * FROM t WHERE state = ?", conn, params=(state,))\`.
`,
    starterCode: `import sqlite3
import pandas as pd

conn = sqlite3.connect(":memory:")
conn.execute("CREATE TABLE airports (code TEXT, city TEXT, state TEXT, runways INT)")
conn.executemany("INSERT INTO airports VALUES (?,?,?,?)", [
    ("MKE", "Milwaukee", "WI", 5),
    ("ORD", "Chicago", "IL", 8),
    ("MSN", "Madison", "WI", 3),
])

df = pd.read_sql("SELECT code, city, state, runways FROM airports", conn)
print(df)
print("\\nshape:", df.shape)
`,
    examples: [
      {
        title: "Aggregate in SQL, not in pandas",
        explanation: "The database returns two rows instead of a million",
        code: `import sqlite3, pandas as pd
conn = sqlite3.connect(":memory:")
conn.execute("CREATE TABLE a (state TEXT, runways INT)")
conn.executemany("INSERT INTO a VALUES (?,?)", [("WI",5),("IL",8),("WI",3)])
print(pd.read_sql("SELECT state, SUM(runways) AS total FROM a GROUP BY state", conn))`,
      },
      {
        title: "Parameters work here too",
        explanation: "read_sql takes params; the injection rule does not stop applying",
        code: `import sqlite3, pandas as pd
conn = sqlite3.connect(":memory:")
conn.execute("CREATE TABLE a (code TEXT, state TEXT)")
conn.executemany("INSERT INTO a VALUES (?,?)", [("MKE","WI"),("ORD","IL")])
print(pd.read_sql("SELECT code FROM a WHERE state = ?", conn, params=("WI",)))`,
      },
    ],
    challenges: [
      {
        id: "db6c1",
        prompt:
          "Use pd.read_sql with a GROUP BY to get total runways per state, and print the resulting DataFrame. The output must contain both WI and IL, and the WI total of 8.",
        hint: "SELECT state, SUM(runways) AS total FROM airports GROUP BY state, then print the frame.",
        validateFn: `return output.includes("WI") && output.includes("IL") && output.includes("8")`,
        solution: `import sqlite3
import pandas as pd

conn = sqlite3.connect(":memory:")
conn.execute("CREATE TABLE airports (code TEXT, city TEXT, state TEXT, runways INT)")
conn.executemany("INSERT INTO airports VALUES (?,?,?,?)", [
    ("MKE", "Milwaukee", "WI", 5),
    ("ORD", "Chicago", "IL", 8),
    ("MSN", "Madison", "WI", 3),
])

df = pd.read_sql("SELECT state, SUM(runways) AS total FROM airports GROUP BY state", conn)
print(df)`,
      },
      {
        id: "db6c2",
        prompt:
          "Write a DataFrame back to the database with to_sql as a table called summary, then read it back with read_sql and print 'roundtrip rows: N'. You should get 2.",
        hint: 'df.to_sql("summary", conn, index=False, if_exists="replace"), then read it back and print len().',
        validateFn: `return /roundtrip rows:\\s*2/.test(output)`,
        solution: `import sqlite3
import pandas as pd

conn = sqlite3.connect(":memory:")
conn.execute("CREATE TABLE airports (code TEXT, state TEXT, runways INT)")
conn.executemany("INSERT INTO airports VALUES (?,?,?)", [
    ("MKE", "WI", 5), ("ORD", "IL", 8), ("MSN", "WI", 3),
])

df = pd.read_sql("SELECT state, SUM(runways) AS total FROM airports GROUP BY state", conn)
df.to_sql("summary", conn, index=False, if_exists="replace")

back = pd.read_sql("SELECT state, total FROM summary", conn)
print("roundtrip rows:", len(back))`,
      },
    ],
  },
];
