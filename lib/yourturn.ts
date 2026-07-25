// "Your turn": one fill-in-the-blank completion exercise per lesson, placed
// between the worked examples and the full challenges. The learner finishes the
// code themselves (with a reveal-answer escape hatch) so practice is active.
// Every `runnable` is verified by running it (starter data preloaded) in the
// test harness. Lessons that cannot run live (pygame, network) use a runnable
// pure-Python analog of the same idea.

import type { FillItem } from "@/lib/checkpoints";

export function getYourTurn(moduleSlug: string, lessonSlug: string): FillItem[] {
  return YOUR_TURN[`${moduleSlug}/${lessonSlug}`] ?? [];
}

const fill = (
  prompt: string,
  template: string,
  answers: string[][],
  explain: string,
  runnable: string,
): FillItem => ({ kind: "fill", prompt, template, answers, explain, runnable });

export const YOUR_TURN: Record<string, FillItem[]> = {
  "start-here/how-this-works": [
    fill("Print the word hello.", "print(___)", [['"hello"', "'hello'"]],
      "Text needs quotes so Python treats it as a string.", 'print("hello")'),
  ],
  "start-here/variables-intro": [
    fill("Store 5 in a variable called x, then print it.", "x ___ 5\nprint(x)", [["="]],
      "A single = assigns the value on the right to the name on the left.", "x = 5\nprint(x)"),
  ],
  "start-here/how-to-learn-here": [
    fill("Print the value held in name.", 'name = "Sam"\nprint(___)', [["name"]],
      "Use the variable name (no quotes) to print its value.", 'name = "Sam"\nprint(name)'),
  ],
  "python-basics/variables-fstrings": [
    fill("Drop name into the greeting with an f-string.", 'name = "Sam"\nprint(f"hi {___}")', [["name"]],
      "Inside {} an f-string inserts the variable's value.", 'name = "Sam"\nprint(f"hi {name}")'),
  ],
  "python-basics/lists-tuples": [
    fill("Print the FIRST item (lists index from 0).", "nums = [10, 20, 30]\nprint(nums[___])", [["0"]],
      "Index 0 is the first element.", "nums = [10, 20, 30]\nprint(nums[0])"),
  ],
  "python-basics/loops-conditionals": [
    fill("Print each number in the loop.", "for n in [1, 2, 3]:\n    print(___)", [["n"]],
      "The loop variable n holds each item in turn.", "for n in [1, 2, 3]:\n    print(n)"),
  ],
  "python-basics/dictionaries": [
    fill("Look up the value for key a.", 'd = {"a": 1, "b": 2}\nprint(d[___])', [['"a"', "'a'"]],
      "Index a dict by its key.", 'd = {"a": 1, "b": 2}\nprint(d["a"])'),
  ],
  "python-basics/functions-comprehensions": [
    fill("Square 0 through 4 with a comprehension.", "squares = [x ___ 2 for x in range(5)]\nprint(squares)", [["**"]],
      "** is the power operator.", "squares = [x ** 2 for x in range(5)]\nprint(squares)"),
  ],
  "pandas-fundamentals/dataframes-series": [
    fill("Show the first few rows of students.", "print(students.___())", [["head"]],
      "head() previews the top rows.", "print(students.head())"),
  ],
  "pandas-fundamentals/selecting-data": [
    fill("Select just the name column.", "print(students[___])", [['"name"', "'name'"]],
      'students["name"] selects one column (a Series).', 'print(students["name"])'),
  ],
  "pandas-fundamentals/filtering-rows": [
    fill("Keep only rows where score is above 90.", "print(students[students[___] > 90])", [['"score"', "'score'"]],
      "Boolean indexing keeps rows where the condition is True.", 'print(students[students["score"] > 90])'),
  ],
  "pandas-fundamentals/sorting-adding-columns": [
    fill("Sort students by score.", 'print(students.___("score"))', [["sort_values"]],
      "sort_values(column) orders the rows.", 'print(students.sort_values("score"))'),
  ],
  "pandas-fundamentals/reading-writing-files": [
    fill("Read a CSV from an in-memory string.", 'df = pd.___(io.StringIO("a,b\\n1,2"))\nprint(df)', [["read_csv"]],
      "read_csv parses comma-separated data into a DataFrame.", 'df = pd.read_csv(io.StringIO("a,b\\n1,2"))\nprint(df)'),
  ],
  "data-cleaning/missing-data": [
    fill("Replace missing values with 0.", "print(students.___(0))", [["fillna"]],
      "fillna(value) fills NaN; dropna() removes those rows.", "print(students.fillna(0))"),
  ],
  "data-cleaning/type-conversion": [
    fill("Convert the age column to float.", 'print(students["age"].___(float))', [["astype"]],
      "astype(type) converts a column's dtype.", 'print(students["age"].astype(float))'),
  ],
  "data-cleaning/string-cleaning": [
    fill("Trim whitespace from every name.", 'print(students["name"].str.___())', [["strip"]],
      "The .str accessor applies string methods to each value.", 'print(students["name"].str.strip())'),
  ],
  "data-cleaning/renaming-dropping": [
    fill("Rename the name column to student.", 'print(students.___(columns={"name": "student"}))', [["rename"]],
      "rename(columns={...}) relabels columns.", 'print(students.rename(columns={"name": "student"}))'),
  ],
  "data-cleaning/duplicates-reset": [
    fill("Remove duplicate rows.", "print(students.___())", [["drop_duplicates"]],
      "drop_duplicates() keeps the first of each repeated row.", "print(students.drop_duplicates())"),
  ],
  "data-cleaning/datetime-handling": [
    fill("Parse the sales date column into real datetimes.", 'print(pd.___(sales["date"]))', [["to_datetime"]],
      "to_datetime turns text into datetime values.", 'print(pd.to_datetime(sales["date"]))'),
  ],
  "grouping-combining/groupby-basics": [
    fill("Average score per subject.", 'print(students.___("subject")["score"].mean())', [["groupby"]],
      "groupby splits, then mean() aggregates each group.", 'print(students.groupby("subject")["score"].mean())'),
  ],
  "grouping-combining/multi-column-groupby": [
    fill("Group by subject AND grade.", 'print(students.groupby([___, "grade"]).size())', [['"subject"', "'subject'"]],
      "Pass a list of columns to group by several keys.", 'print(students.groupby(["subject", "grade"]).size())'),
  ],
  "grouping-combining/merge-join": [
    fill("Join the two tables on name.", 'a = students[["name", "subject"]]\nb = students[["name", "score"]]\nprint(pd.___(a, b, on="name"))', [["merge"]],
      "merge joins two DataFrames on a shared key.", 'a = students[["name", "subject"]]\nb = students[["name", "score"]]\nprint(pd.merge(a, b, on="name"))'),
  ],
  "grouping-combining/concat-pivot": [
    fill("Stack two DataFrames on top of each other.", "print(pd.___([students, students]))", [["concat"]],
      "concat stacks frames along the rows.", "print(pd.concat([students, students]))"),
  ],
  "grouping-combining/fixed-width-files": [
    fill("Read a fixed-width text block.", 'print(pd.___(io.StringIO("a  b\\n1  2")))', [["read_fwf"]],
      "read_fwf parses fixed-width columns.", 'print(pd.read_fwf(io.StringIO("a  b\\n1  2")))'),
  ],
  "string-file-ops/string-methods-deep": [
    fill("Split the text on commas.", 'print("a,b,c".___(","))', [["split"]],
      "split(sep) breaks a string into a list.", 'print("a,b,c".split(","))'),
  ],
  "string-file-ops/regex-basics": [
    fill("Find every run of digits.", 'import re\nprint(re.___(r"\\d+", "a1b22c"))', [["findall"]],
      "re.findall returns all matches of the pattern.", 'import re\nprint(re.findall(r"\\d+", "a1b22c"))'),
  ],
  "string-file-ops/file-io": [
    fill("Read all text from this in-memory file.", 'f = io.StringIO("x\\ny")\nprint(f.___())', [["read"]],
      "An open file object reads with .read(); StringIO acts like one.", 'f = io.StringIO("x\\ny")\nprint(f.read())'),
  ],
  "string-file-ops/json-handling": [
    fill("Parse this JSON string into a dict.", 'print(json.___(\'{"a": 1}\'))', [["loads"]],
      "json.loads parses text; json.dumps does the reverse.", 'print(json.loads(\'{"a": 1}\'))'),
  ],
  "string-file-ops/error-handling": [
    fill("Catch the division error.", 'try:\n    x = 1 / 0\n___ ZeroDivisionError:\n    print("caught")', [["except"]],
      "except handles the error raised in the try block.", 'try:\n    x = 1 / 0\nexcept ZeroDivisionError:\n    print("caught")'),
  ],
  "web-apis/requests-basics": [
    fill("API responses are JSON. Read the id field.", 'resp = \'{"id": 1, "name": "Sam"}\'\ndata = json.loads(resp)\nprint(data[___])', [['"id"', "'id'"]],
      "Parse the response, then index the dict by key.", 'resp = \'{"id": 1, "name": "Sam"}\'\ndata = json.loads(resp)\nprint(data["id"])'),
  ],
  "web-apis/json-apis": [
    fill("Reach into the nested user name.", 'd = json.loads(\'{"user": {"name": "Sam"}}\')\nprint(d["user"][___])', [['"name"', "'name'"]],
      "Chain keys to drill into nested JSON.", 'd = json.loads(\'{"user": {"name": "Sam"}}\')\nprint(d["user"]["name"])'),
  ],
  "web-apis/beautifulsoup-basics": [
    fill("Pull the text out of the paragraph tag.", 'from bs4 import BeautifulSoup\nsoup = BeautifulSoup("<p>hi</p>", "html.parser")\nprint(soup.p.___)', [["text"]],
      ".text gives the readable contents of a tag.", 'from bs4 import BeautifulSoup\nsoup = BeautifulSoup("<p>hi</p>", "html.parser")\nprint(soup.p.text)'),
  ],
  "web-apis/scraping-tables": [
    fill("Count how many <a> tags there are.", 'from bs4 import BeautifulSoup\nsoup = BeautifulSoup("<a>1</a><a>2</a>", "html.parser")\nprint(len(soup.___("a")))', [["find_all"]],
      "find_all returns every matching tag.", 'from bs4 import BeautifulSoup\nsoup = BeautifulSoup("<a>1</a><a>2</a>", "html.parser")\nprint(len(soup.find_all("a")))'),
  ],
  "web-apis/data-pipeline": [
    fill("Summarize the pipeline: total price per category.", 'print(sales.groupby("category")["price"].___())', [["sum"]],
      "groupby + sum is the aggregate step of a pipeline.", 'print(sales.groupby("category")["price"].sum())'),
  ],
  "functions-apply/lambda-functions": [
    fill("Write a lambda that doubles its input.", "double = lambda x: x ___ 2\nprint(double(5))", [["*"]],
      "lambda x: x * 2 is a tiny anonymous function.", "double = lambda x: x * 2\nprint(double(5))"),
  ],
  "functions-apply/apply-map": [
    fill("Add 1 to every score with apply.", 'print(students["score"].___(lambda x: x + 1).head())', [["apply"]],
      "apply runs a function on each value.", 'print(students["score"].apply(lambda x: x + 1).head())'),
  ],
  "functions-apply/custom-aggregations": [
    fill("Aggregate score per subject with a named function.", 'print(students.groupby("subject")["score"].___("mean"))', [["agg"]],
      "agg applies one or more aggregations to each group.", 'print(students.groupby("subject")["score"].agg("mean"))'),
  ],
  "functions-apply/vectorized-operations": [
    fill("Multiply price by quantity, no loop.", 'print((sales["price"] ___ sales["quantity"]).head())', [["*"]],
      "Whole-column math runs element-wise (vectorized).", 'print((sales["price"] * sales["quantity"]).head())'),
  ],
  "functions-apply/capstone": [
    fill("Total quantity sold per category.", 'print(sales.groupby("category")["quantity"].___())', [["sum"]],
      "Group by category, then sum the quantities.", 'print(sales.groupby("category")["quantity"].sum())'),
  ],
  "core-python/comprehensions-generators": [
    fill("Pull the first value from the generator.", "gen = (x for x in range(3))\nprint(___(gen))", [["next"]],
      "A generator yields lazily; next() pulls one value.", "gen = (x for x in range(3))\nprint(next(gen))"),
  ],
  "core-python/iterators-itertools": [
    fill("Chain two lists into one stream.", "import itertools\nprint(list(itertools.___([1, 2], [3, 4])))", [["chain"]],
      "itertools.chain links iterables end to end.", "import itertools\nprint(list(itertools.chain([1, 2], [3, 4])))"),
  ],
  "core-python/decorators": [
    fill("Apply the deco decorator to hi (fill the decorator name).", 'def deco(f):\n    def w():\n        return f()\n    return w\n\n@___\ndef hi():\n    return "hi"\n\nprint(hi())', [["deco"]],
      "@name above a function wraps it with that decorator.", 'def deco(f):\n    def w():\n        return f()\n    return w\n\n@deco\ndef hi():\n    return "hi"\n\nprint(hi())'),
  ],
  "core-python/context-managers": [
    fill("Open the in-memory file with a context manager.", '___ io.StringIO("x") as f:\n    print(f.read())', [["with"]],
      "with sets up and tears down a resource automatically.", 'with io.StringIO("x") as f:\n    print(f.read())'),
  ],
  "core-python/error-handling-deep": [
    fill("Raise a ValueError on purpose.", 'try:\n    ___ ValueError("bad")\nexcept ValueError as e:\n    print(e)', [["raise"]],
      "raise throws an exception you can then catch.", 'try:\n    raise ValueError("bad")\nexcept ValueError as e:\n    print(e)'),
  ],
  "core-python/sets-collections": [
    fill("Print the items in BOTH sets.", "a = {1, 2, 3}\nb = {2, 3, 4}\nprint(a ___ b)", [["&"]],
      "& is set intersection.", "a = {1, 2, 3}\nb = {2, 3, 4}\nprint(a & b)"),
  ],
  "core-python/async-basics": [
    fill("Run the async function to completion.", "import asyncio\nasync def f():\n    return 1\nprint(asyncio.___(f()))", [["run"]],
      "asyncio.run drives an async function from sync code.", "import asyncio\nasync def f():\n    return 1\nprint(asyncio.run(f()))"),
  ],
  "numpy-foundations/arrays-and-dtypes": [
    fill("Make a NumPy array from a list.", "import numpy as np\narr = np.___([1, 2, 3])\nprint(arr.dtype)", [["array"]],
      "np.array builds an array with a single dtype.", "import numpy as np\narr = np.array([1, 2, 3])\nprint(arr.dtype)"),
  ],
  "numpy-foundations/reshape-and-axis": [
    fill("Reshape 6 values into a 2-by-3 grid.", "import numpy as np\nprint(np.array([1, 2, 3, 4, 5, 6]).___(2, 3))", [["reshape"]],
      "reshape(rows, cols) rearranges the values.", "import numpy as np\nprint(np.array([1, 2, 3, 4, 5, 6]).reshape(2, 3))"),
  ],
  "numpy-foundations/broadcasting": [
    fill("Add 10 to every element at once.", "import numpy as np\narr = np.array([1, 2, 3])\nprint(arr ___ 10)", [["+"]],
      "Broadcasting applies the scalar to each element.", "import numpy as np\narr = np.array([1, 2, 3])\nprint(arr + 10)"),
  ],
  "numpy-foundations/vectorization-vs-loops": [
    fill("Average the array without a loop.", "import numpy as np\narr = np.array([1, 2, 3, 4])\nprint(arr.___())", [["mean"]],
      "Vectorized methods like mean() avoid Python loops.", "import numpy as np\narr = np.array([1, 2, 3, 4])\nprint(arr.mean())"),
  ],
  "numpy-foundations/numpy-pandas-crossover": [
    fill("Get the underlying NumPy array of the score column.", 'print(students["score"].___)', [["values"]],
      ".values exposes the NumPy array under a Series.", 'print(students["score"].values)'),
  ],
  "game-dev-pygame/pygame-basics": [
    fill("End the game loop by setting running to False.", "running = True\nwhile running:\n    running = ___\nprint(\"done\")", [["False"]],
      "The loop runs while running is True.", 'running = True\nwhile running:\n    running = False\nprint("done")'),
  ],
  "game-dev-pygame/pygame-movement": [
    fill("Move x by velocity times delta time.", "x = 0\nv = 5\ndt = 0.5\nx ___ v * dt\nprint(x)", [["+="]],
      "Position grows by velocity * dt each frame.", "x = 0\nv = 5\ndt = 0.5\nx += v * dt\nprint(x)"),
  ],
  "game-dev-pygame/pygame-sprites": [
    fill("Add a sprite to the group.", 'sprites = []\nsprites.___({"x": 0})\nprint(len(sprites))', [["append"]],
      "A sprite group is a list you append sprites to.", 'sprites = []\nsprites.append({"x": 0})\nprint(len(sprites))'),
  ],
  "game-dev-pygame/pygame-collision": [
    fill("Two ranges overlap when BOTH edge checks hold.", "a = (0, 0, 10, 10)\nb = (5, 5, 10, 10)\noverlap = a[0] < b[0] + b[2] ___ a[0] + a[2] > b[0]\nprint(overlap)", [["and"]],
      "Rect overlap needs both x-edge conditions true.", "a = (0, 0, 10, 10)\nb = (5, 5, 10, 10)\noverlap = a[0] < b[0] + b[2] and a[0] + a[2] > b[0]\nprint(overlap)"),
  ],
  "game-dev-pygame/pygame-project-breakaway": [
    fill("Add 10 to the score when a brick breaks.", "score = 0\nscore ___ 10\nprint(score)", [["+="]],
      "+= adds to the running total.", "score = 0\nscore += 10\nprint(score)"),
  ],
  "game-dev-pygame/pygame-project-tower-defense": [
    fill("Spawn a wave of 3 enemies.", 'enemies = [{"hp": 5} for _ in range(___)]\nprint(len(enemies))', [["3"]],
      "range(n) controls how many you create.", 'enemies = [{"hp": 5} for _ in range(3)]\nprint(len(enemies))'),
  ],
  "game-dev-pygame/pygame-project-sprite-game": [
    fill("Subtract 20 from the player's hp on a hit.", 'player = {"hp": 100}\nplayer["hp"] ___ 20\nprint(player["hp"])', [["-="]],
      "-= reduces the value in place.", 'player = {"hp": 100}\nplayer["hp"] -= 20\nprint(player["hp"])'),
  ],
  "game-dev-pygame/pygame-sound": [
    fill("Look up the jump sound by its name.", 'sounds = {}\nsounds["jump"] = "jump.wav"\nprint(sounds[___])', [['"jump"', "'jump'"]],
      "Store sounds in a dict keyed by name.", 'sounds = {}\nsounds["jump"] = "jump.wav"\nprint(sounds["jump"])'),
  ],
  "game-dev-pygame/pygame-text-hud": [
    fill("Build the HUD line from the score.", 'score = 42\nhud = f"Score: {___}"\nprint(hud)', [["score"]],
      "An f-string renders live values into HUD text.", 'score = 42\nhud = f"Score: {score}"\nprint(hud)'),
  ],
  "game-dev-pygame/pygame-game-states": [
    fill("Branch on the current game state.", 'state = "menu"\nif state ___ "menu":\n    print("show menu")', [["=="]],
      "== compares the state to a label.", 'state = "menu"\nif state == "menu":\n    print("show menu")'),
  ],
  "game-dev-pygame/pygame-project-breakaway-deep-dive": [
    fill("Build a 2-row by 3-column brick grid.", "bricks = [(c, r) for r in range(2) for c in range(___)]\nprint(len(bricks))", [["3"]],
      "Nested comprehension makes the grid; 2 x 3 = 6.", "bricks = [(c, r) for r in range(2) for c in range(3)]\nprint(len(bricks))"),
  ],
  "data-manipulation-school/string-methods": [
    fill("Uppercase every student name.", 'print(students["name"].str.___())', [["upper"]],
      ".str.upper() uppercases each value.", 'print(students["name"].str.upper())'),
  ],
  "data-manipulation-school/numbers-types": [
    fill("Round pi to 2 decimal places.", "print(___(3.14159, 2))", [["round"]],
      "round(value, n) rounds to n decimals.", "print(round(3.14159, 2))"),
  ],
  "data-manipulation-school/dates-times": [
    fill("Extract the year from each sales date.", 'print(pd.to_datetime(sales["date"]).dt.___.head())', [["year"]],
      "The .dt accessor exposes datetime parts like .year.", 'print(pd.to_datetime(sales["date"]).dt.year.head())'),
  ],
  "data-manipulation-school/combining": [
    fill("Stack the top and bottom rows together.", "print(pd.___([students.head(2), students.tail(2)]))", [["concat"]],
      "concat appends frames along the rows.", "print(pd.concat([students.head(2), students.tail(2)]))"),
  ],
  "data-manipulation-school/pivot-tables": [
    fill("Average score by subject as a pivot table.", 'print(students.___(index="subject", values="score", aggfunc="mean"))', [["pivot_table"]],
      "pivot_table reshapes long data into a summary grid.", 'print(students.pivot_table(index="subject", values="score", aggfunc="mean"))'),
  ],
  "oop-tooling/classes-objects": [
    fill("Save name on the instance in __init__.", 'class Dog:\n    def __init__(self, name):\n        ___.name = name\n\nd = Dog("Rex")\nprint(d.name)', [["self"]],
      "self refers to the specific object.", 'class Dog:\n    def __init__(self, name):\n        self.name = name\n\nd = Dog("Rex")\nprint(d.name)'),
  ],
  "oop-tooling/type-hints-dataclasses": [
    fill("Make P a dataclass.", "from dataclasses import dataclass\n\n___\nclass P:\n    x: int\n\nprint(P(1).x)", [["@dataclass"]],
      "@dataclass writes __init__ for you from the fields.", "from dataclasses import dataclass\n\n@dataclass\nclass P:\n    x: int\n\nprint(P(1).x)"),
  ],
  "oop-tooling/testing-your-code": [
    fill("Check the result with an assertion.", 'def test():\n    ___ 1 + 1 == 2\n\ntest()\nprint("ok")', [["assert"]],
      "assert passes silently when True, fails when False.", 'def test():\n    assert 1 + 1 == 2\n\ntest()\nprint("ok")'),
  ],
  "oop-tooling/logging-debugging": [
    fill("Log an informational message.", 'import logging\nlog = logging.getLogger("x")\nlog.___("starting")\nprint("ok")', [["info"]],
      "logger.info() records an info-level message.", 'import logging\nlog = logging.getLogger("x")\nlog.info("starting")\nprint("ok")'),
  ],
  "oop-tooling/inheritance-polymorphism": [
    fill("Make B inherit from A.", 'class A:\n    def hi(self):\n        return "A"\n\nclass B(___):\n    pass\n\nprint(B().hi())', [["A"]],
      "A subclass inherits the parent's methods.", 'class A:\n    def hi(self):\n        return "A"\n\nclass B(A):\n    pass\n\nprint(B().hi())'),
  ],
  "oop-tooling/properties-encapsulation": [
    fill("Turn x into a read-only property.", "class C:\n    ___\n    def x(self):\n        return 5\n\nprint(C().x)", [["@property"]],
      "@property lets a method be accessed like an attribute.", "class C:\n    @property\n    def x(self):\n        return 5\n\nprint(C().x)"),
  ],
  "oop-tooling/dunder-methods": [
    fill("Trigger __str__ by converting to text.", 'class C:\n    def __str__(self):\n        return "c"\n\nprint(___(C()))', [["str"]],
      "str(obj) calls the object's __str__.", 'class C:\n    def __str__(self):\n        return "c"\n\nprint(str(C()))'),
  ],
  "oop-tooling/abstract-base-classes": [
    fill("Base off ABC to make an abstract base class.", "from abc import ABC, abstractmethod\n\nclass Base(___):\n    pass\n\nprint(issubclass(Base, ABC))", [["ABC"]],
      "Subclassing ABC marks a class as abstract.", "from abc import ABC, abstractmethod\n\nclass Base(ABC):\n    pass\n\nprint(issubclass(Base, ABC))"),
  ],
  "oop-tooling/design-patterns-pythonic": [
    fill("Pick a label with a one-line conditional expression.", 'x = 5\nlabel = "big" ___ x > 3 else "small"\nprint(label)', [["if"]],
      "value_if_true if condition else value_if_false.", 'x = 5\nlabel = "big" if x > 3 else "small"\nprint(label)'),
  ],
  "tooling-environments/venv-and-pip": [
    fill("A requirements file lists one package per line. Split it.", 'reqs = "pandas==2.0\\nnumpy==1.0"\nlines = reqs.___("\\n")\nprint(len(lines))', [["split"]],
      "requirements.txt is parsed line by line.", 'reqs = "pandas==2.0\\nnumpy==1.0"\nlines = reqs.split("\\n")\nprint(len(lines))'),
  ],
  "tooling-environments/pytest-deep-dive": [
    fill("Assert the function returns the right value.", "def add(a, b):\n    return a + b\n\ndef test_add():\n    ___ add(2, 3) == 5\n\ntest_add()\nprint(\"pass\")", [["assert"]],
      "pytest tests are functions full of asserts.", 'def add(a, b):\n    return a + b\n\ndef test_add():\n    assert add(2, 3) == 5\n\ntest_add()\nprint("pass")'),
  ],
  "tooling-environments/mocking-test-doubles": [
    fill("Create a Mock test double.", "from unittest.mock import ___\n\nm = Mock()\nm.foo.return_value = 5\nprint(m.foo())", [["Mock"]],
      "Mock stands in for a real object in tests.", "from unittest.mock import Mock\n\nm = Mock()\nm.foo.return_value = 5\nprint(m.foo())"),
  ],
  "tooling-environments/debugging-profiling": [
    fill("Time a snippet with timeit.", "import timeit\nt = timeit.___(lambda: sum(range(100)), number=10)\nprint(t >= 0)", [["timeit"]],
      "timeit.timeit runs the callable and reports the time.", "import timeit\nt = timeit.timeit(lambda: sum(range(100)), number=10)\nprint(t >= 0)"),
  ],
  "tooling-environments/code-quality": [
    fill("Add a type hint marking name as a str.", 'def greet(name: ___) -> str:\n    return "hi " + name\n\nprint(greet("Sam"))', [["str"]],
      "Type hints document the expected types for tools like mypy.", 'def greet(name: str) -> str:\n    return "hi " + name\n\nprint(greet("Sam"))'),
  ],

  "ai-python/talking-to-a-model": [
    fill("Give the standing instruction the system role.", 'msgs = [{"role": "___", "content": "Be terse."}]\nprint(msgs[0]["role"])', [['system', '"system"', "'system'"]],
      "System sets behavior; user carries the request.", 'msgs = [{"role": "system", "content": "Be terse."}]\nprint(msgs[0]["role"])'),
  ],
  "ai-python/structured-output": [
    fill("Parse a CSV reply into rows.", 'import csv, io\nreply = "MKE,Milwaukee"\nprint(list(csv.___(io.StringIO(reply))))', [["reader"]],
      "csv.reader turns the text into a list of fields you can index.", 'import csv, io\nreply = "MKE,Milwaukee"\nprint(list(csv.reader(io.StringIO(reply))))'),
  ],
  "ai-python/batching-and-failure": [
    fill("Keep the failures instead of losing them.", 'failures = []\ntry:\n    raise ValueError("rate limited")\nexcept Exception as exc:\n    failures.___(exc)\nprint(len(failures))', [["append"]],
      "Collecting failures lets you retry exactly those instead of the whole batch.", 'failures = []\ntry:\n    raise ValueError("rate limited")\nexcept Exception as exc:\n    failures.append(exc)\nprint(len(failures))'),
  ],
  "ai-python/tokens-and-cost": [
    fill("Estimate tokens as roughly four characters each.", 'text = "a" * 400\nprint(max(1, len(text) ___ 4))', [["//"]],
      "Integer division gives a whole-token estimate, good enough for budgeting.", 'text = "a" * 400\nprint(max(1, len(text) // 4))'),
  ],
  "ai-python/embeddings": [
    fill("Get the length of a vector.", 'import numpy as np\nprint(float(np.linalg.___(np.array([3.0, 4.0]))))', [["norm"]],
      "norm of [3,4] is 5; cosine divides by both vectors' norms.", 'import numpy as np\nprint(float(np.linalg.norm(np.array([3.0, 4.0]))))'),
  ],
  "ai-python/retrieval-rag": [
    fill("Split a document into chunks on blank lines.", 'doc = "one\\n\\ntwo"\nprint(len([c for c in doc.___("\\n\\n") if c.strip()]))', [["split"]],
      "Splitting on blank lines keeps whole thoughts together.", 'doc = "one\\n\\ntwo"\nprint(len([c for c in doc.split("\\n\\n") if c.strip()]))'),
  ],
  "ai-python/tool-use": [
    fill("Look a tool up safely instead of calling it directly.", 'TOOLS = {"add": lambda a, b: a + b}\nfn = TOOLS.___("delete_all")\nprint(fn is None)', [["get"]],
      "get returns None for an unknown name instead of raising, so you can return an error.", 'TOOLS = {"add": lambda a, b: a + b}\nfn = TOOLS.get("delete_all")\nprint(fn is None)'),
  ],
  "ai-python/testing-ai-code": [
    fill("Assert the shape rather than the exact words.", 'reply = "The code MKE serves Milwaukee."\nprint("MKE" ___ reply)', [["in"]],
      "A containment check survives a reword; an equality check would not.", 'reply = "The code MKE serves Milwaukee."\nprint("MKE" in reply)'),
  ],
  "ai-python/a-real-call": [
    fill("Build the JSON body you would POST to the demo endpoint.", 'import json\nprint(json.___({"prompt": "Name an airport."}))', [["dumps"]],
      "dumps serialises the dict; the real lesson awaits pyfetch with this as the body.", 'import json\nprint(json.dumps({"prompt": "Name an airport."}))'),
  ],
  "ai-python/concurrency": [
    fill("Chunk work so you never have too many calls in flight.", 'items = list(range(23))\nsize = 8\nprint(len([items[i:i + size] for i in ___(0, len(items), size)]))', [["range"]],
      "range with a step walks the list in fixed-size batches.", 'items = list(range(23))\nsize = 8\nprint(len([items[i:i + size] for i in range(0, len(items), size)]))'),
  ],
  "ai-python/streaming": [
    fill("Join streamed pieces once at the end.", 'chunks = ["The ", "code ", "MKE."]\nprint("".___(chunks))', [["join"]],
      "join once is linear; += in a loop rebuilds the string every pass.", 'chunks = ["The ", "code ", "MKE."]\nprint("".join(chunks))'),
  ],
  "ai-python/agent-loops": [
    fill("Give the loop a budget so it cannot run forever.", 'for step in ___(6):\n    pass\nprint("stopped at", step)', [["range"]],
      "The step budget is the single most important line in an agent loop.", 'for step in range(6):\n    pass\nprint("stopped at", step)'),
  ],
  "ai-python/prompt-caching": [
    fill("Check whether every prefix is identical, so the cache can hit.", 'prefixes = ["You are an assistant."] * 3\nprint(len(___(prefixes)) == 1)', [["set"]],
      "A set of size 1 means nothing varied, so the prefix is cacheable.", 'prefixes = ["You are an assistant."] * 3\nprint(len(set(prefixes)) == 1)'),
  ],
  "databases-python/connect-and-query": [
    fill("Open an in-memory database.", "import sqlite3\nconn = sqlite3.___(':memory:')\nprint(conn.execute('SELECT 1').fetchone()[0])", [["connect"]],
      "connect(':memory:') gives a real database that disappears when the program ends.", "import sqlite3\nconn = sqlite3.connect(':memory:')\nprint(conn.execute('SELECT 1').fetchone()[0])"),
  ],
  "databases-python/sql-injection": [
    fill("Pass the value as a parameter, not as text.", "import sqlite3\nconn = sqlite3.connect(':memory:')\nconn.execute('CREATE TABLE t (c TEXT)')\nconn.execute('INSERT INTO t VALUES (___)', ('MKE',))\nprint(conn.execute('SELECT c FROM t').fetchone()[0])", [["?"]],
      "The database never parses a parameter as SQL, so there is nothing to escape.", "import sqlite3\nconn = sqlite3.connect(':memory:')\nconn.execute('CREATE TABLE t (c TEXT)')\nconn.execute('INSERT INTO t VALUES (?)', ('MKE',))\nprint(conn.execute('SELECT c FROM t').fetchone()[0])"),
  ],
  "databases-python/transactions": [
    fill("Undo everything since the last commit.", "import sqlite3\nconn = sqlite3.connect(':memory:')\nconn.execute('CREATE TABLE t (n INT)')\nconn.commit()\nconn.execute('INSERT INTO t VALUES (1)')\nconn.___()\nprint(conn.execute('SELECT COUNT(*) FROM t').fetchone()[0])", [["rollback"]],
      "rollback throws the uncommitted work away, which is what a failed transfer needs.", "import sqlite3\nconn = sqlite3.connect(':memory:')\nconn.execute('CREATE TABLE t (n INT)')\nconn.commit()\nconn.execute('INSERT INTO t VALUES (1)')\nconn.rollback()\nprint(conn.execute('SELECT COUNT(*) FROM t').fetchone()[0])"),
  ],
  "databases-python/schema-and-constraints": [
    fill("Name the exception a broken constraint raises.", "import sqlite3\nconn = sqlite3.connect(':memory:')\nconn.execute('CREATE TABLE t (c TEXT PRIMARY KEY)')\nconn.execute(\"INSERT INTO t VALUES ('MKE')\")\ntry:\n    conn.execute(\"INSERT INTO t VALUES ('MKE')\")\nexcept sqlite3.___:\n    print('rejected')", [["IntegrityError"]],
      "IntegrityError is the database refusing to hold data that breaks your rules.", "import sqlite3\nconn = sqlite3.connect(':memory:')\nconn.execute('CREATE TABLE t (c TEXT PRIMARY KEY)')\nconn.execute(\"INSERT INTO t VALUES ('MKE')\")\ntry:\n    conn.execute(\"INSERT INTO t VALUES ('MKE')\")\nexcept sqlite3.IntegrityError:\n    print('rejected')"),
  ],
  "databases-python/rows-to-objects": [
    fill("Index a row by column name.", "import sqlite3\nconn = sqlite3.connect(':memory:')\nconn.row_factory = sqlite3.___\nconn.execute('CREATE TABLE t (city TEXT)')\nconn.execute(\"INSERT INTO t VALUES ('Madison')\")\nprint(conn.execute('SELECT city FROM t').fetchone()['city'])", [["Row"]],
      "sqlite3.Row means adding a column no longer shifts every index after it.", "import sqlite3\nconn = sqlite3.connect(':memory:')\nconn.row_factory = sqlite3.Row\nconn.execute('CREATE TABLE t (city TEXT)')\nconn.execute(\"INSERT INTO t VALUES ('Madison')\")\nprint(conn.execute('SELECT city FROM t').fetchone()['city'])"),
  ],
  "databases-python/pandas-and-sql": [
    fill("Read a query straight into a DataFrame.", "import sqlite3, pandas as pd\nconn = sqlite3.connect(':memory:')\nconn.execute('CREATE TABLE t (n INT)')\nconn.execute('INSERT INTO t VALUES (1)')\nprint(len(pd.___('SELECT n FROM t', conn)))", [["read_sql"]],
      "Push filtering into SQL and pull back the smallest result that answers the question.", "import sqlite3, pandas as pd\nconn = sqlite3.connect(':memory:')\nconn.execute('CREATE TABLE t (n INT)')\nconn.execute('INSERT INTO t VALUES (1)')\nprint(len(pd.read_sql('SELECT n FROM t', conn)))"),
  ],
  "building-apis/your-first-endpoint": [
    fill("Merge the code into the record the handler returns.", 'AIRPORTS = {"MKE": {"city": "Milwaukee"}}\ndef get(code):\n    return {"code": code, ___AIRPORTS[code]}\nprint(get("MKE"))', [["**"]],
      "** unpacks the inner dict into the response body.", 'AIRPORTS = {"MKE": {"city": "Milwaukee"}}\ndef get(code):\n    return {"code": code, **AIRPORTS[code]}\nprint(get("MKE"))'),
  ],
  "building-apis/validating-input": [
    fill("Collect every error rather than stopping at the first.", 'errors = []\nif len("x") != 3:\n    errors.___({"field": "code"})\nif 99 > 20:\n    errors.append({"field": "runways"})\nprint(len(errors))', [["append"]],
      "Reporting one problem per submission is how you make an API miserable.", 'errors = []\nif len("x") != 3:\n    errors.append({"field": "code"})\nif 99 > 20:\n    errors.append({"field": "runways"})\nprint(len(errors))'),
  ],
  "building-apis/status-codes-and-errors": [
    fill("Give the status for authenticated but not permitted.", 'def check(authed, allowed):\n    if not authed: return 401\n    if not allowed: return ___\n    return 200\nprint(check(True, False))', [["403"]],
      "401 is who are you; 403 is we know, and you still may not.", 'def check(authed, allowed):\n    if not authed: return 401\n    if not allowed: return 403\n    return 200\nprint(check(True, False))'),
  ],
  "building-apis/dependencies-and-auth": [
    fill("Compare a secret in constant time.", 'import hmac\nprint(hmac.___("sk-a", "sk-a"))', [["compare_digest"]],
      "== short-circuits on the first differing byte, which leaks the value gradually.", 'import hmac\nprint(hmac.compare_digest("sk-a", "sk-a"))'),
  ],
  "building-apis/testing-your-api": [
    fill("Check the response has the keys a caller depends on.", 'body = {"code": "MKE", "city": "Milwaukee"}\nprint({"code", "city"} ___ set(body))', [["<="]],
      "Subset comparison asserts the shape without pinning fields that change.", 'body = {"code": "MKE", "city": "Milwaukee"}\nprint({"code", "city"} <= set(body))'),
  ],
  "shipping-python/dependencies-and-lockfiles": [
    fill("Spot the requirement that is not pinned.", 'lines = ["fastapi==0.115.6", "requests"]\nprint([l for l in lines if "___" not in l])', [["=="]],
      "An unpinned dependency means today's install can differ from tomorrow's.", 'lines = ["fastapi==0.115.6", "requests"]\nprint([l for l in lines if "==" not in l])'),
  ],
  "shipping-python/config-and-secrets": [
    fill("Fail loudly when required config is missing.", 'import os\ntry:\n    os.environ___"DEFINITELY_NOT_SET_12345"]\nexcept KeyError:\n    print("refused to start")', [["["]],
      "os.environ[...] raises; .get() would let a half-configured app boot.", 'import os\ntry:\n    os.environ["DEFINITELY_NOT_SET_12345"]\nexcept KeyError:\n    print("refused to start")'),
  ],
  "shipping-python/containers": [
    fill("Bind so the container is reachable from outside.", 'host = "___"\nprint("reachable" if host == "0.0.0.0" else "unreachable")', [['0.0.0.0', '"0.0.0.0"']],
      "127.0.0.1 inside a container means only the container itself.", 'host = "0.0.0.0"\nprint("reachable" if host == "0.0.0.0" else "unreachable")'),
  ],
  "shipping-python/health-and-shutdown": [
    fill("Return unhealthy when any dependency is down.", 'checks = {"db": False, "cache": True}\nprint(200 if ___(checks.values()) else 503)', [["all"]],
      "all() over the checks means one dead dependency fails the whole health response.", 'checks = {"db": False, "cache": True}\nprint(200 if all(checks.values()) else 503)'),
  ],
};
