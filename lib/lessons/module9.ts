import type { Lesson } from "../types";

export const lessonsModule9: Lesson[] = [
  {
    module: "Data Manipulation (WCTC)",
    moduleSlug: "data-manipulation-school",
    lessonNumber: 46,
    slug: "string-methods",
    title: "String Methods in Pandas",
    badge: "concept",
    theory: `
## the .str accessor

Pandas exposes a \`str\` accessor that lets you call string methods across an entire column at once. It's one of the most useful features once you know it's there.

\`\`\`python
df["name"].str.upper()   # uppercase everything
df["name"].str.lower()   # lowercase everything
df["name"].str.strip()   # remove leading/trailing whitespace
\`\`\`

Without the \`.str\` you'd have to loop through rows. With it, everything just works on the whole column.

## common methods

**Changing case:**
\`\`\`python
df["text"].str.upper()      # ALL CAPS
df["text"].str.lower()      # all lowercase
df["text"].str.title()      # Title Case
df["text"].str.capitalize() # First letter only
\`\`\`

**Cleaning up whitespace:**
\`\`\`python
df["text"].str.strip()   # both ends
df["text"].str.lstrip()  # left side only
df["text"].str.rstrip()  # right side only
\`\`\`

**Replacing text:**
\`\`\`python
df["text"].str.replace("old", "new")
df["text"].str.replace(r"\\d+", "", regex=True)  # remove all digits
\`\`\`

## searching with contains

This one's super handy for filtering. It returns True/False for each row.

\`\`\`python
# Find rows where name contains "son"
df[df["name"].str.contains("son")]

# Case insensitive
df[df["name"].str.contains("bob", case=False)]

# Use regex
df[df["email"].str.contains(r"@gmail\\.com$", regex=True)]
\`\`\`

Watch out though; \`contains\` throws errors if you have NaN values. Use \`na=False\` to avoid that:

\`\`\`python
df[df["name"].str.contains("son", na=False)]
\`\`\`

## extract

If you need to pull out specific parts of strings, \`extract\` uses regex groups.

\`\`\`python
# Extract the domain from emails
df["email"].str.extract(r"@(.+)")

# Extract area code from phone numbers
df["phone"].str.extract(r"\\((\\d{3})\\)")
\`\`\`

The parentheses in the regex define what gets captured. This part tripped me up at first but it makes sense once you see it.

## splitting

\`\`\`python
# Split into a list
df["name"].str.split(" ")

# Split into separate columns
df["name"].str.split(" ", expand=True)

# Get just the first part
df["name"].str.split(" ").str[0]
\`\`\`

That last one chains the \`str\` accessor twice. A bit weird looking but it works.
`,
    starterCode: `# Using the built-in students dataset
print("Original names:")
print(students["name"])

# Try some string methods
print("\\nUppercase:")
print(students["name"].str.upper())
`,
    examples: [
      {
        title: "cleaning messy text",
        explanation: "Strip whitespace and standardize case; happens all the time with real data",
        code: `import io
csv_data = """name,email
  Alice  ,ALICE@GMAIL.COM
Bob ,bob@yahoo.com
  carol,Carol@OUTLOOK.COM  """

df = pd.read_csv(io.StringIO(csv_data))
print("Before:")
print(df)

# Clean it up
df["name"] = df["name"].str.strip().str.title()
df["email"] = df["email"].str.strip().str.lower()

print("\\nAfter:")
print(df)`,
      },
      {
        title: "using contains to filter",
        explanation: "Find all rows where a column contains certain text",
        code: `# Filter students whose name contains 'a'
has_a = students[students["name"].str.contains("a", case=False)]
print("Names with 'a':")
print(has_a[["name", "subject"]])

# Filter by subject
math_students = students[students["subject"].str.contains("Math")]
print("\\nMath students:")
print(math_students)`,
      },
      {
        title: "splitting and extracting",
        explanation: "Pull apart strings when you need specific pieces",
        code: `import io
csv_data = """full_name,email
Alice Johnson,alice.johnson@company.com
Bob Smith,bob.smith@company.com
Carol Davis,carol.davis@other.org"""

df = pd.read_csv(io.StringIO(csv_data))

# Split name into first and last
df[["first", "last"]] = df["full_name"].str.split(" ", expand=True)

# Extract domain from email
df["domain"] = df["email"].str.extract(r"@(.+)")

print(df[["first", "last", "domain"]])`,
      },
    ],
    challenges: [
      {
        id: "m9l1c1",
        prompt: "Convert all student names to lowercase and print the result.",
        hint: "Use .str.lower() on the name column",
        validateFn: `return output.includes("alice") && output.includes("bob") && !output.includes("Alice")`,
        solution: `print(students["name"].str.lower())`,
      },
      {
        id: "m9l1c2",
        prompt: "Filter the students DataFrame to show only students whose subject contains 'Sci' (use case insensitive search) and print their names.",
        hint: "Use str.contains() with case=False, then select the name column",
        validateFn: `return output.includes("Bob") && output.includes("Eve") && output.includes("Hank")`,
        solution: `science_students = students[students["subject"].str.contains("Sci", case=False)]
print(science_students["name"])`,
      },
    ],
  },
  {
    module: "Data Manipulation (WCTC)",
    moduleSlug: "data-manipulation-school",
    lessonNumber: 47,
    slug: "numbers-types",
    title: "Working with Numbers & Types",
    badge: "concept",
    theory: `
## checking dtypes

First thing you wanna do with any new dataset is check what types you're working with.

\`\`\`python
df.dtypes          # see all column types
df["col"].dtype    # just one column
df.info()          # types plus null counts
\`\`\`

Common types you'll see:
- \`int64\`; integers
- \`float64\`; decimals
- \`object\`; usually strings (the label is misleading)
- \`bool\`; True/False
- \`datetime64\`; dates

## astype

When pandas reads a CSV, it guesses types. Sometimes it guesses wrong.

\`\`\`python
# Convert to different types
df["price"] = df["price"].astype(float)
df["quantity"] = df["quantity"].astype(int)
df["active"] = df["active"].astype(bool)
\`\`\`

If the conversion isn't possible (like turning "hello" into an int), it'll throw an error. Which is actually helpful.

## pd.to_numeric for messy data

Here's the thing; \`astype\` is strict. If you have even one bad value, it fails. \`pd.to_numeric\` is more forgiving.

\`\`\`python
# errors='coerce' turns bad values into NaN instead of crashing
df["price"] = pd.to_numeric(df["price"], errors="coerce")
\`\`\`

I use \`errors="coerce"\` way more than I expected. Real data is messy.

## rounding

\`\`\`python
df["price"].round(2)     # round to 2 decimal places
df["price"].round(0)     # round to whole number
df["price"].round(-1)    # round to nearest 10
\`\`\`

You can also use numpy functions:
\`\`\`python
import numpy as np
np.floor(df["price"])    # always round down
np.ceil(df["price"])     # always round up
\`\`\`

## formatting via apply

For display formatting, \`apply\` is your friend.

\`\`\`python
# Format as currency
df["price"].apply(lambda x: f"\${x:,.2f}")

# Format as percentage
df["rate"].apply(lambda x: f"{x:.1%}")

# Add commas to large numbers
df["population"].apply(lambda x: f"{x:,}")
\`\`\`

## mixed-type columns

Sometimes a column has both numbers and text. This happens more than you'd think.

\`\`\`python
# Check if values are numeric
pd.to_numeric(df["col"], errors="coerce").notna()

# Find the non-numeric rows
mask = pd.to_numeric(df["col"], errors="coerce").isna()
print(df[mask])  # shows you the problem rows
\`\`\`

This is super useful for debugging data quality issues.
`,
    starterCode: `# Check the types in students
print("Data types:")
print(students.dtypes)

print("\\nScores column:")
print(students["score"])
print(f"Type: {students['score'].dtype}")
`,
    examples: [
      {
        title: "converting and cleaning number columns",
        explanation: "Handle a column that has some non-numeric values mixed in",
        code: `import io
csv_data = """product,price
Widget,29.99
Gadget,N/A
Tool,15.50
Item,unknown"""

df = pd.read_csv(io.StringIO(csv_data))
print("Original:")
print(df)
print(f"\\nPrice dtype: {df['price'].dtype}")

# Convert with coerce (bad values become NaN)
df["price"] = pd.to_numeric(df["price"], errors="coerce")
print("\\nAfter to_numeric:")
print(df)`,
      },
      {
        title: "rounding and formatting",
        explanation: "Make numbers look nice for display",
        code: `import io
csv_data = """item,price,quantity
A,29.997,150
B,49.123,80
C,12.555,200"""

df = pd.read_csv(io.StringIO(csv_data))

# Round to 2 decimals
df["price_rounded"] = df["price"].round(2)

# Format as currency
df["price_display"] = df["price"].apply(lambda x: f"\${x:.2f}")

print(df)`,
      },
      {
        title: "type conversion chain",
        explanation: "Sometimes you need multiple conversions to get data right",
        code: `import io
csv_data = """id,value,active
001,100.5,1
002,200.0,0
003,150.75,1"""

df = pd.read_csv(io.StringIO(csv_data))
print("Before:")
print(df.dtypes)

# id should be string (has leading zeros)
df["id"] = df["id"].astype(str).str.zfill(3)

# active should be boolean
df["active"] = df["active"].astype(bool)

print("\\nAfter:")
print(df.dtypes)
print(df)`,
      },
    ],
    challenges: [
      {
        id: "m9l2c1",
        prompt: "Calculate the average score from the students DataFrame, round it to 1 decimal place, and print it.",
        hint: "Use .mean() then .round() or round()",
        validateFn: `return output.includes("85") || output.includes("85.2") || output.includes("85.3")`,
        solution: `avg_score = students["score"].mean().round(1)
print(f"Average score: {avg_score}")`,
      },
      {
        id: "m9l2c2",
        prompt: "Create a new column 'score_display' that formats each score with a % sign (like '95%') and print the first 3 rows.",
        hint: "Use apply with a lambda to format each value",
        validateFn: `return output.includes("95%") && output.includes("82%")`,
        solution: `students["score_display"] = students["score"].apply(lambda x: f"{x}%")
print(students[["name", "score", "score_display"]].head(3))`,
      },
    ],
  },
  {
    module: "Data Manipulation (WCTC)",
    moduleSlug: "data-manipulation-school",
    lessonNumber: 48,
    slug: "dates-times",
    title: "Dates and Times",
    badge: "concept",
    theory: `
## pd.to_datetime

Pandas doesn't automatically recognize dates. You gotta tell it.

\`\`\`python
df["date"] = pd.to_datetime(df["date"])
\`\`\`

It's pretty smart about formats; it can figure out "2024-01-15", "01/15/2024", "Jan 15, 2024" and more. But if it's something weird, specify the format:

\`\`\`python
# For dates like "15-01-2024"
df["date"] = pd.to_datetime(df["date"], format="%d-%m-%Y")
\`\`\`

## the .dt accessor

Just like \`.str\` for strings, \`.dt\` gives you access to date parts.

\`\`\`python
df["date"].dt.year       # 2024
df["date"].dt.month      # 1-12
df["date"].dt.day        # 1-31
df["date"].dt.weekday    # 0=Monday, 6=Sunday
df["date"].dt.day_name() # "Monday", "Tuesday", etc
df["date"].dt.month_name() # "January", "February", etc
\`\`\`

\`dt.weekday\` returns 0 for Monday, which is the part that's easy to forget.

## date arithmetic

You can do math with dates. It's actually pretty intuitive.

\`\`\`python
from datetime import timedelta

# Add 7 days
df["date"] + timedelta(days=7)

# Days between two dates
df["end_date"] - df["start_date"]

# This gives you a Timedelta, get the days with .dt.days
(df["end_date"] - df["start_date"]).dt.days
\`\`\`

## Timedelta offsets

\`\`\`python
from datetime import timedelta

timedelta(days=30)
timedelta(hours=2)
timedelta(weeks=1)
timedelta(days=1, hours=12)  # 1.5 days
\`\`\`

Or use pandas offsets for business logic:
\`\`\`python
import pandas as pd

pd.DateOffset(months=1)   # add exactly 1 month
pd.DateOffset(years=1)    # add exactly 1 year
\`\`\`

## strftime

When you need dates as strings in a specific format:

\`\`\`python
df["date"].dt.strftime("%Y-%m-%d")    # 2024-01-15
df["date"].dt.strftime("%m/%d/%Y")    # 01/15/2024
df["date"].dt.strftime("%B %d, %Y")   # January 15, 2024
df["date"].dt.strftime("%A")          # Monday
\`\`\`

Common format codes:
- \`%Y\`; 4-digit year
- \`%m\`; 2-digit month
- \`%d\`; 2-digit day
- \`%B\`; full month name
- \`%A\`; full day name
- \`%H:%M:%S\`; time

## filtering by date

\`\`\`python
# Filter to a specific month
jan_data = df[df["date"].dt.month == 1]

# Filter to a date range
mask = (df["date"] >= "2024-01-01") & (df["date"] < "2024-02-01")
jan_data = df[mask]

# Filter to weekdays only
weekdays = df[df["date"].dt.weekday < 5]
\`\`\`
`,
    starterCode: `# Sales data has dates
print("Sales data:")
print(sales)

# Convert date column to datetime
sales["date"] = pd.to_datetime(sales["date"])
print("\\nDate type:", sales["date"].dtype)
`,
    examples: [
      {
        title: "extracting date components",
        explanation: "Pull out year, month, day, weekday from dates",
        code: `import io
csv_data = """order_id,order_date
1,2024-01-15
2,2024-02-20
3,2024-03-10"""

df = pd.read_csv(io.StringIO(csv_data))
df["order_date"] = pd.to_datetime(df["order_date"])

df["year"] = df["order_date"].dt.year
df["month"] = df["order_date"].dt.month
df["day_name"] = df["order_date"].dt.day_name()

print(df)`,
      },
      {
        title: "date arithmetic",
        explanation: "Calculate differences between dates and add offsets",
        code: `import io
from datetime import timedelta

csv_data = """task,start_date,end_date
Project A,2024-01-01,2024-01-15
Project B,2024-02-01,2024-02-28
Project C,2024-03-01,2024-03-10"""

df = pd.read_csv(io.StringIO(csv_data))
df["start_date"] = pd.to_datetime(df["start_date"])
df["end_date"] = pd.to_datetime(df["end_date"])

# Calculate duration
df["duration_days"] = (df["end_date"] - df["start_date"]).dt.days

# Add a week to end date
df["extended"] = df["end_date"] + timedelta(days=7)

print(df[["task", "duration_days", "extended"]])`,
      },
      {
        title: "formatting for display",
        explanation: "Convert dates to nice readable strings",
        code: `import io
csv_data = """event,event_date
Conference,2024-06-15
Meeting,2024-07-22
Workshop,2024-08-03"""

df = pd.read_csv(io.StringIO(csv_data))
df["event_date"] = pd.to_datetime(df["event_date"])

# Different formats
df["formal"] = df["event_date"].dt.strftime("%B %d, %Y")
df["short"] = df["event_date"].dt.strftime("%m/%d/%y")
df["weekday"] = df["event_date"].dt.strftime("%A")

print(df)`,
      },
    ],
    challenges: [
      {
        id: "m9l3c1",
        prompt: "Convert the sales 'date' column to datetime, extract the month, and print the unique months.",
        hint: "Use pd.to_datetime(), then .dt.month, then .unique()",
        validateFn: `return output.includes("1")`,
        solution: `sales["date"] = pd.to_datetime(sales["date"])
print(sales["date"].dt.month.unique())`,
      },
      {
        id: "m9l3c2",
        prompt: "Add a new column 'day_name' to sales showing the day of week (Monday, Tuesday, etc.) and print the first 3 rows.",
        hint: "Use .dt.day_name() to get the weekday name",
        validateFn: `return output.includes("day") || output.includes("Monday") || output.includes("Tuesday") || output.includes("Wednesday") || output.includes("Thursday") || output.includes("Friday")`,
        solution: `sales["date"] = pd.to_datetime(sales["date"])
sales["day_name"] = sales["date"].dt.day_name()
print(sales.head(3))`,
      },
    ],
  },
  {
    module: "Data Manipulation (WCTC)",
    moduleSlug: "data-manipulation-school",
    lessonNumber: 49,
    slug: "combining",
    title: "Combining DataFrames",
    badge: "concept",
    theory: `
## combining DataFrames

Real data is almost never in one table. You've got customers in one place, orders in another, products somewhere else. Combining them is like half the job.

## merge

\`merge\` is the main one. It's basically SQL joins.

\`\`\`python
# Join on a common column
result = pd.merge(orders, customers, on="customer_id")

# Different column names in each table
result = pd.merge(orders, customers, left_on="cust_id", right_on="customer_id")
\`\`\`

## join types

\`\`\`python
# Inner join (default); only matching rows
pd.merge(df1, df2, on="id", how="inner")

# Left join; all rows from left, matching from right
pd.merge(df1, df2, on="id", how="left")

# Right join; all rows from right, matching from left
pd.merge(df1, df2, on="id", how="right")

# Outer join; all rows from both
pd.merge(df1, df2, on="id", how="outer")
\`\`\`

Inner is the default and what you want most of the time. Left join is second most common, the "give me all my orders, and whatever customer info exists" pattern.

## duplicate column names

If both DataFrames have a column with the same name (besides the join key), you get suffixes:

\`\`\`python
# By default you get _x and _y
pd.merge(df1, df2, on="id")
# Creates name_x and name_y

# Custom suffixes
pd.merge(df1, df2, on="id", suffixes=("_left", "_right"))
\`\`\`

## concat

Use \`concat\` when you want to stack DataFrames on top of each other (or side by side).

\`\`\`python
# Stack vertically (add more rows)
combined = pd.concat([df1, df2])

# Stack horizontally (add more columns)
combined = pd.concat([df1, df2], axis=1)
\`\`\`

Watch the index though; by default it keeps the original indexes. Use \`ignore_index=True\` to reset:

\`\`\`python
combined = pd.concat([df1, df2], ignore_index=True)
\`\`\`

## join (index-based)

\`join\` is basically merge but uses the index by default.

\`\`\`python
# Join on index
df1.join(df2)

# Join df1's index to df2's column
df1.join(df2.set_index("key"), on="key")
\`\`\`

\`merge\` gets used more often than \`join\` because it's more explicit about what's happening.

`,
    starterCode: `# Let's create some related data to merge
import io

orders_csv = """order_id,customer_id,product,amount
1,101,Widget,150
2,102,Gadget,200
3,101,Tool,75
4,103,Widget,150"""

customers_csv = """customer_id,name,city
101,Alice,NYC
102,Bob,LA
104,Carol,Chicago"""

orders = pd.read_csv(io.StringIO(orders_csv))
customers = pd.read_csv(io.StringIO(customers_csv))

print("Orders:")
print(orders)
print("\\nCustomers:")
print(customers)
`,
    examples: [
      {
        title: "inner vs left join",
        explanation: "See the difference; inner drops unmatched, left keeps all from left side",
        code: `import io

orders_csv = """order_id,customer_id,amount
1,101,150
2,102,200
3,103,75"""

customers_csv = """customer_id,name
101,Alice
102,Bob"""

orders = pd.read_csv(io.StringIO(orders_csv))
customers = pd.read_csv(io.StringIO(customers_csv))

print("Inner join (only matching):")
inner = pd.merge(orders, customers, on="customer_id", how="inner")
print(inner)

print("\\nLeft join (all orders):")
left = pd.merge(orders, customers, on="customer_id", how="left")
print(left)`,
      },
      {
        title: "concatenating dataframes",
        explanation: "Stack data from multiple sources together",
        code: `import io

jan_csv = """product,sales
A,100
B,150"""

feb_csv = """product,sales
A,120
B,180"""

jan = pd.read_csv(io.StringIO(jan_csv))
feb = pd.read_csv(io.StringIO(feb_csv))

# Add month column before combining
jan["month"] = "Jan"
feb["month"] = "Feb"

combined = pd.concat([jan, feb], ignore_index=True)
print(combined)`,
      },
      {
        title: "multiple key merge",
        explanation: "Sometimes you need to match on more than one column",
        code: `import io

sales_csv = """year,region,revenue
2023,North,50000
2023,South,45000
2024,North,55000"""

targets_csv = """year,region,target
2023,North,48000
2023,South,50000
2024,North,52000"""

sales = pd.read_csv(io.StringIO(sales_csv))
targets = pd.read_csv(io.StringIO(targets_csv))

# Merge on both year AND region
result = pd.merge(sales, targets, on=["year", "region"])
result["hit_target"] = result["revenue"] >= result["target"]
print(result)`,
      },
    ],
    challenges: [
      {
        id: "m9l4c1",
        prompt: "Merge the orders and customers DataFrames using an inner join on customer_id. Print the line 'Inner join:' first, then the result.",
        hint: "print(\"Inner join:\") then pd.merge(orders, customers, on=\"customer_id\", how=\"inner\")",
        // Checks only the text after the label. The editor is pre-seeded with this
        // lesson's starterCode, which prints the customers table (Carol included), so a
        // validator that scanned the whole output could never be satisfied by a learner
        // who wrote their answer under "# Your code here:" as instructed.
        validateFn: `const i = output.lastIndexOf("Inner join:");
if (i === -1) return false;
const merged = output.slice(i);
return merged.includes("Alice") && merged.includes("Bob") && !merged.includes("Carol") && !merged.includes("NaN")`,
        solution: `result = pd.merge(orders, customers, on="customer_id", how="inner")
print("Inner join:")
print(result)`,
      },
      {
        id: "m9l4c2",
        prompt: "Use a left join to keep all orders and add customer names. Print the line 'Left join:' first, then the result, so you can see which order has missing customer info (NaN).",
        hint: "print(\"Left join:\") then pd.merge(orders, customers, on=\"customer_id\", how=\"left\")",
        // Scoped to the labelled section for the same reason as the inner-join challenge,
        // and because the seeded starterCode already prints both "103" and the orders
        // table: an unscoped check passed without the learner merging anything at all.
        validateFn: `const i = output.lastIndexOf("Left join:");
if (i === -1) return false;
const merged = output.slice(i);
return merged.includes("103") && (merged.includes("NaN") || merged.includes("nan")) && merged.includes("Alice")`,
        solution: `result = pd.merge(orders, customers, on="customer_id", how="left")
print("Left join:")
print(result)`,
      },
    ],
  },
  {
    module: "Data Manipulation (WCTC)",
    moduleSlug: "data-manipulation-school",
    lessonNumber: 50,
    slug: "pivot-tables",
    title: "Pivot Tables & Reshaping",
    badge: "concept",
    theory: `
## pivot_table

If you've used pivot tables in Excel, this is the same idea but way more powerful.

\`\`\`python
pd.pivot_table(
    df,
    values="sales",        # what to aggregate
    index="region",        # rows
    columns="product",     # columns
    aggfunc="sum"          # how to aggregate
)
\`\`\`

Multiple aggregations:
\`\`\`python
pd.pivot_table(
    df,
    values="sales",
    index="region",
    aggfunc=["sum", "mean", "count"]
)
\`\`\`

## groupby + unstack

This is another way to get pivot-style output. Sometimes it's cleaner.

\`\`\`python
# Group then unstack
df.groupby(["region", "product"])["sales"].sum().unstack()
\`\`\`

The result looks exactly like a pivot table. I actually prefer this approach sometimes because it's more explicit about what's happening.

## melt (wide to long)

Sometimes data comes in wide format and you need it long. \`melt\` fixes that.

\`\`\`python
# Wide format:
#   name  Jan  Feb  Mar
#   Alice  100  120  130

# Convert to long:
pd.melt(df, id_vars=["name"], var_name="month", value_name="sales")

# Result:
#   name  month  sales
#   Alice   Jan    100
#   Alice   Feb    120
#   Alice   Mar    130
\`\`\`

This is super useful when you need to plot data or do time series analysis.

## stack / unstack

These are for reshaping multi-index data.

\`\`\`python
# unstack; move inner index to columns
grouped = df.groupby(["region", "year"])["sales"].sum()
grouped.unstack()  # years become columns

# stack; move columns to index (opposite of unstack)
pivoted.stack()
\`\`\`

## fill_value for missing combos

When pivoting, some combinations might not exist in your data. You get NaN.

\`\`\`python
pd.pivot_table(
    df,
    values="sales",
    index="region",
    columns="product",
    fill_value=0  # fill missing with 0 instead of NaN
)
\`\`\`

## margins (totals)

\`\`\`python
pd.pivot_table(
    df,
    values="sales",
    index="region",
    columns="product",
    aggfunc="sum",
    margins=True,      # add row/column totals
    margins_name="Total"
)
\`\`\`

Pivot tables with margins are useful for reports. You get row and column totals in one call.
`,
    starterCode: `# Using the sales data
print("Sales data:")
print(sales)

# Simple pivot: total quantity by category
pivot = pd.pivot_table(
    sales,
    values="quantity",
    index="category",
    aggfunc="sum"
)
print("\\nQuantity by category:")
print(pivot)
`,
    examples: [
      {
        title: "basic pivot table",
        explanation: "Summarize sales by region and product",
        code: `import io
csv_data = """region,product,sales
North,Widget,100
North,Gadget,150
South,Widget,80
South,Gadget,120
North,Widget,90"""

df = pd.read_csv(io.StringIO(csv_data))

pivot = pd.pivot_table(
    df,
    values="sales",
    index="region",
    columns="product",
    aggfunc="sum"
)
print(pivot)`,
      },
      {
        title: "using melt to reshape",
        explanation: "Convert wide data to long format; happens a lot with imported spreadsheets",
        code: `import io
# Wide format data (common in spreadsheets)
csv_data = """product,Q1,Q2,Q3,Q4
Widget,100,120,115,130
Gadget,80,85,90,95"""

df = pd.read_csv(io.StringIO(csv_data))
print("Wide format:")
print(df)

# Melt to long format
long = pd.melt(
    df,
    id_vars=["product"],
    var_name="quarter",
    value_name="sales"
)
print("\\nLong format:")
print(long)`,
      },
      {
        title: "pivot with margins (totals)",
        explanation: "Add row and column totals to your pivot table",
        code: `import io
csv_data = """dept,year,budget
Sales,2023,50000
Sales,2024,55000
Engineering,2023,80000
Engineering,2024,90000
Marketing,2023,30000
Marketing,2024,35000"""

df = pd.read_csv(io.StringIO(csv_data))

pivot = pd.pivot_table(
    df,
    values="budget",
    index="dept",
    columns="year",
    aggfunc="sum",
    margins=True,
    margins_name="Total"
)
print(pivot)`,
      },
    ],
    challenges: [
      {
        id: "m9l5c1",
        prompt: "Create a pivot table from sales showing the sum of 'price' for each 'category'. Print the result.",
        hint: "Use pd.pivot_table() with values='price', index='category', aggfunc='sum'",
        validateFn: `return (output.includes("Electronics") && output.includes("Tools")) || output.includes("179") || output.includes("39")`,
        solution: `pivot = pd.pivot_table(
    sales,
    values="price",
    index="category",
    aggfunc="sum"
)
print(pivot)`,
      },
      {
        id: "m9l5c2",
        prompt: "Use groupby and unstack to show total quantity sold by category. This gives the same result as a pivot table but using a different approach.",
        hint: "Use df.groupby('category')['quantity'].sum(); no unstack needed for a single group",
        validateFn: `return output.includes("Electronics") && output.includes("Tools") && (output.includes("275") || output.includes("620"))`,
        solution: `result = sales.groupby("category")["quantity"].sum()
print(result)`,
      },
    ],
  },
];
