import type { Lesson } from "../types";

export const lessonsModule6: Lesson[] = [
  {
    module: "Web & APIs",
    moduleSlug: "web-apis",
    lessonNumber: 26,
    slug: "requests-basics",
    title: "Requests Basics",
    badge: "concept",
    theory: `
## fetching: requests vs pyfetch

In a regular Python script you use the \`requests\` library:

\`\`\`python
import requests

response = requests.get("https://api.example.com/data")
print(response.status_code)
print(response.json())
\`\`\`

This site runs Python in a browser Web Worker via Pyodide, so the network goes through the browser's fetch instead. The Pyodide-native wrapper is \`pyodide.http.pyfetch\`:

\`\`\`python
from pyodide.http import pyfetch

response = await pyfetch("https://jsonplaceholder.typicode.com/users/1")
print(response.status)
data = await response.json()
print(data)
\`\`\`

Same shape, two differences worth knowing:
- It's async. You must \`await\` both the fetch and \`.json()\`.
- It runs from the browser, so the target API has to send CORS headers. Sites that don't, you can't reach directly.

When you ship a real script you'll write \`requests.get\`. The patterns translate.

## status, json, errors

\`\`\`python
response = await pyfetch(url)

response.status     # 200, 404, 500 ...
response.ok         # True if status < 400
await response.string()  # raw text
await response.json()    # parsed JSON
\`\`\`

Handle failures explicitly. Network errors raise; bad status codes don't:

\`\`\`python
try:
    response = await pyfetch(url)
    if response.status >= 400:
        print(f"HTTP {response.status}")
    else:
        data = await response.json()
except Exception as e:
    print(f"request failed: {e}")
\`\`\`

## query params

\`pyfetch\` doesn't have a \`params=\` keyword like \`requests\` does. Build the query string yourself:

\`\`\`python
from urllib.parse import urlencode

params = {"userId": 1}
url = f"https://jsonplaceholder.typicode.com/posts?{urlencode(params)}"
response = await pyfetch(url)
posts = await response.json()
print(f"{len(posts)} posts for user 1")
\`\`\`

## public test API

Examples below hit **jsonplaceholder.typicode.com**. It's a free, CORS-friendly fake API with users, posts, comments, todos. Real HTTP, real JSON, no auth required. Good for practice without spinning up your own backend.
`,
    starterCode: `from pyodide.http import pyfetch

# Fetch a single user from jsonplaceholder
response = await pyfetch("https://jsonplaceholder.typicode.com/users/1")
print(f"status: {response.status}")

if response.ok:
    user = await response.json()
    print(f"name: {user['name']}")
    print(f"email: {user['email']}")
    print(f"company: {user['company']['name']}")
`,
    examples: [
      {
        title: "fetch a real JSON response",
        explanation: "Hit a public CORS-friendly API and read the response. Real HTTP, real status code, real JSON.",
        code: `from pyodide.http import pyfetch

response = await pyfetch("https://jsonplaceholder.typicode.com/users/1")
print(f"status: {response.status}")

user = await response.json()
print(f"id: {user['id']}")
print(f"name: {user['name']}")
print(f"city: {user['address']['city']}")
print(f"website: {user['website']}")`,
      },
      {
        title: "fetch a list and aggregate",
        explanation: "GET a collection, parse it, do real work on it. Same pattern you'd use with a paginated production API.",
        code: `from pyodide.http import pyfetch

response = await pyfetch("https://jsonplaceholder.typicode.com/posts")
if not response.ok:
    print(f"HTTP {response.status}")
else:
    posts = await response.json()
    print(f"got {len(posts)} posts")

    # Count posts per user
    by_user = {}
    for p in posts:
        by_user[p["userId"]] = by_user.get(p["userId"], 0) + 1

    print("posts per user:")
    for user_id in sorted(by_user):
        print(f"  user {user_id}: {by_user[user_id]} posts")`,
      },
      {
        title: "handle an explicit 404",
        explanation: "Hit a URL that returns 404. response.ok is False; nothing raises. You check.",
        code: `from pyodide.http import pyfetch

response = await pyfetch("https://jsonplaceholder.typicode.com/users/999999")
print(f"status: {response.status}")
print(f"ok: {response.ok}")

if response.ok:
    user = await response.json()
    print(user)
else:
    print("user not found, falling back to default behavior")`,
      },
    ],
    challenges: [
      {
        id: "m6l1c1",
        prompt: "Fetch https://jsonplaceholder.typicode.com/users/2 and print exactly the user's email address (the value of the 'email' field, no extra prefix).",
        hint: "await pyfetch, then await response.json(), then index into 'email'.",
        validateFn: `return /\\S+@\\S+\\.\\S+/.test(output) && !output.toLowerCase().includes("error") && !output.includes("404")`,
        solution: `from pyodide.http import pyfetch

response = await pyfetch("https://jsonplaceholder.typicode.com/users/2")
user = await response.json()
print(user["email"])`,
      },
      {
        id: "m6l1c2",
        prompt: "Fetch all posts from https://jsonplaceholder.typicode.com/posts and print exactly one line: 'total posts: N' where N is the actual count.",
        hint: "Get the list with pyfetch + .json(), then len(). The endpoint returns 100 posts.",
        validateFn: `return output.includes("total posts: 100")`,
        solution: `from pyodide.http import pyfetch

response = await pyfetch("https://jsonplaceholder.typicode.com/posts")
posts = await response.json()
print(f"total posts: {len(posts)}")`,
      },
    ],
    projectChallenge: {
      threadId: "sales",
      threadTitle: "Sales Performance Dashboard",
      taskTitle: "Process Sales API Response",
      context: "The inventory system returns sales data via an API. Process the simulated API response to extract sales records and calculate summary statistics.",
      starterCode: `import pandas as pd
import io

# Simulated API response from inventory system
api_response = {
    "status": 200,
    "timestamp": "2023-03-15T10:30:00Z",
    "data": {
        "sales": [
            {"SaleID": "S001", "SalesRep": "Alice Chen", "Region": "North", "Product": "Widget Pro", "Category": "Electronics", "Quantity": 15, "UnitPrice": 49.99, "CustomerSegment": "Enterprise"},
            {"SaleID": "S002", "SalesRep": "Bob Martinez", "Region": "South", "Product": "Gadget Plus", "Category": "Tools", "Quantity": 8, "UnitPrice": 29.99, "CustomerSegment": "SMB"},
            {"SaleID": "S003", "SalesRep": "Carol Davis", "Region": "East", "Product": "Widget Pro", "Category": "Electronics", "Quantity": 22, "UnitPrice": 49.99, "CustomerSegment": "Enterprise"},
            {"SaleID": "S004", "SalesRep": "Dan Wilson", "Region": "West", "Product": "Super Tool", "Category": "Tools", "Quantity": 45, "UnitPrice": 19.99, "CustomerSegment": "Consumer"},
            {"SaleID": "S005", "SalesRep": "Eva Brown", "Region": "North", "Product": "Power Unit", "Category": "Electronics", "Quantity": 10, "UnitPrice": 89.99, "CustomerSegment": "Enterprise"}
        ],
        "total_count": 5
    }
}

# Task:
# 1. Check if response status is 200
# 2. Extract the sales list from the response
# 3. Convert to DataFrame and calculate revenue
# 4. Print summary: total sales count and total revenue
`,
      solution: `import pandas as pd
import io

api_response = {
    "status": 200,
    "timestamp": "2023-03-15T10:30:00Z",
    "data": {
        "sales": [
            {"SaleID": "S001", "SalesRep": "Alice Chen", "Region": "North", "Product": "Widget Pro", "Category": "Electronics", "Quantity": 15, "UnitPrice": 49.99, "CustomerSegment": "Enterprise"},
            {"SaleID": "S002", "SalesRep": "Bob Martinez", "Region": "South", "Product": "Gadget Plus", "Category": "Tools", "Quantity": 8, "UnitPrice": 29.99, "CustomerSegment": "SMB"},
            {"SaleID": "S003", "SalesRep": "Carol Davis", "Region": "East", "Product": "Widget Pro", "Category": "Electronics", "Quantity": 22, "UnitPrice": 49.99, "CustomerSegment": "Enterprise"},
            {"SaleID": "S004", "SalesRep": "Dan Wilson", "Region": "West", "Product": "Super Tool", "Category": "Tools", "Quantity": 45, "UnitPrice": 19.99, "CustomerSegment": "Consumer"},
            {"SaleID": "S005", "SalesRep": "Eva Brown", "Region": "North", "Product": "Power Unit", "Category": "Electronics", "Quantity": 10, "UnitPrice": 89.99, "CustomerSegment": "Enterprise"}
        ],
        "total_count": 5
    }
}

if api_response["status"] == 200:
    sales_list = api_response["data"]["sales"]
    sales = pd.DataFrame(sales_list)
    sales["Revenue"] = sales["Quantity"] * sales["UnitPrice"]

    print(f"API Status: {api_response['status']} OK")
    print(f"Total Sales: {len(sales)}")
    print(f"Total Revenue: \${sales['Revenue'].sum():,.2f}")
else:
    print(f"API Error: {api_response['status']}")`,
      validateFn: `return output.includes("200") && output.includes("Total") && output.includes("Revenue")`,
      hint: "Check status first, then drill into api_response['data']['sales'] and convert to DataFrame",
      xpReward: 50,
    },
  },
  {
    module: "Web & APIs",
    moduleSlug: "web-apis",
    lessonNumber: 27,
    slug: "json-apis",
    title: "JSON from APIs",
    badge: "practice",
    theory: `
## real network

Lesson 26 introduced \`pyfetch\`. This lesson uses it for actual work: hitting a public REST API, getting JSON, turning it into a DataFrame.

Every example below makes a real network request. The test API is \`https://jsonplaceholder.typicode.com\`, a free CORS-friendly stand-in for production APIs. Same shape (users, posts, comments, todos), no auth required.

## the shape you'll keep writing

\`\`\`python
from pyodide.http import pyfetch
import pandas as pd

response = await pyfetch("https://jsonplaceholder.typicode.com/users")
if response.status != 200:
    raise RuntimeError(f"API returned {response.status}")
data = await response.json()
df = pd.DataFrame(data)
\`\`\`

Four steps. \`pyfetch\` → check status → \`.json()\` → \`pd.DataFrame\`. That sequence covers 80% of real API work.

## picking columns

A typical API returns way more fields than you need. Strip down right away:

\`\`\`python
df = pd.DataFrame(data)[["id", "name", "email"]]
\`\`\`

If the response is nested (a list of dicts where one value is itself a dict), use \`pd.json_normalize\` to flatten:

\`\`\`python
from pandas import json_normalize

# {"users": [{"id": 1, "address": {"city": "Boston"}}, ...]}
df = json_normalize(data["users"])
# Yields columns: id, address.city, address.zipcode, ...
\`\`\`

## counting by foreign key

A common API has two endpoints that join on an id. JsonPlaceholder gives you \`/posts\` (with a \`userId\` field) and \`/users\` (with that user's name). Fetch both, merge, aggregate.

\`\`\`python
posts = pd.DataFrame(await (await pyfetch(".../posts")).json())
users = pd.DataFrame(await (await pyfetch(".../users")).json())
joined = posts.merge(users, left_on="userId", right_on="id")
posts_per_user = joined.groupby("name").size()
\`\`\`

## handling non-200

Always read \`response.status\` before \`.json()\`. A 404 or 500 page might still have a JSON body, but it won't have the shape you're expecting.

\`\`\`python
resp = await pyfetch(".../users/9999")  # doesn't exist
if resp.status == 404:
    print("user not found")
elif resp.status >= 500:
    print("server error, retry later")
else:
    user = await resp.json()
\`\`\`
`,
    starterCode: `# Fetch real users from a public API and load into a DataFrame.
import pandas as pd
from pyodide.http import pyfetch

response = await pyfetch("https://jsonplaceholder.typicode.com/users")
if response.status != 200:
    raise RuntimeError(f"API returned {response.status}")

users = await response.json()
df = pd.DataFrame(users)[["id", "name", "username", "email"]]

print(f"Fetched {len(df)} users from the live API")
print(df.head())
`,
    examples: [
      {
        title: "fetching one record and reading the JSON",
        explanation: "GET a single user by id. Check status first, then parse JSON.",
        code: `from pyodide.http import pyfetch

resp = await pyfetch("https://jsonplaceholder.typicode.com/users/1")
print(f"status: {resp.status}")

user = await resp.json()
print(f"name:    {user['name']}")
print(f"email:   {user['email']}")
print(f"company: {user['company']['name']}")`,
      },
      {
        title: "merging two endpoints and aggregating",
        explanation: "Fetch posts and users, join on userId, count posts per user. Real two-table API work in 6 lines.",
        code: `import pandas as pd
from pyodide.http import pyfetch

posts_resp = await pyfetch("https://jsonplaceholder.typicode.com/posts")
users_resp = await pyfetch("https://jsonplaceholder.typicode.com/users")

posts = pd.DataFrame(await posts_resp.json())
users = pd.DataFrame(await users_resp.json())[["id", "name"]]

joined = posts.merge(users, left_on="userId", right_on="id", suffixes=("_post", "_user"))
per_user = joined.groupby("name").size().sort_values(ascending=False)
print(per_user)`,
      },
      {
        title: "handling a 404 gracefully",
        explanation: "Always check response.status before .json(). Missing resources shouldn't crash the script.",
        code: `from pyodide.http import pyfetch

resp = await pyfetch("https://jsonplaceholder.typicode.com/users/9999")
print(f"status: {resp.status}")

if resp.status == 200:
    user = await resp.json()
    print(f"found: {user['name']}")
elif resp.status == 404:
    print("user not found, continuing")
else:
    print(f"unexpected status {resp.status}")`,
      },
    ],
    challenges: [
      {
        id: "m6l2c1",
        prompt: "Fetch user id 3 from https://jsonplaceholder.typicode.com/users/3 and print only their email address.",
        hint: "pyfetch, await response.json(), print user['email']",
        validateFn: `return /\\S+@\\S+\\.\\S+/.test(output) && !output.toLowerCase().includes("error") && !output.includes("404")`,
        solution: `from pyodide.http import pyfetch

resp = await pyfetch("https://jsonplaceholder.typicode.com/users/3")
user = await resp.json()
print(user["email"])`,
      },
      {
        id: "m6l2c2",
        prompt: "Fetch all posts from https://jsonplaceholder.typicode.com/posts, group by userId, and print the user with the most posts in the format 'user X has Y posts' (X and Y are integers).",
        hint: "DataFrame the response, groupby('userId').size(), .idxmax() for the top user",
        validateFn: `return /user\\s+\\d+\\s+has\\s+\\d+\\s+posts/i.test(output) && !output.toLowerCase().includes("error")`,
        solution: `import pandas as pd
from pyodide.http import pyfetch

resp = await pyfetch("https://jsonplaceholder.typicode.com/posts")
posts = pd.DataFrame(await resp.json())
counts = posts.groupby("userId").size()
top = counts.idxmax()
print(f"user {top} has {counts[top]} posts")`,
      },
    ],
    projectChallenge: {
      threadId: "sales",
      threadTitle: "Sales Performance Dashboard",
      taskTitle: "Parse Nested Sales Report",
      context: "The analytics API returns a nested JSON report with sales grouped by region. Parse this structure to create a flat DataFrame showing regional performance.",
      starterCode: `import pandas as pd
import io

# Nested JSON sales report from analytics API
sales_report = {
    "report_date": "2023-Q1",
    "regions": [
        {
            "name": "North",
            "manager": "Alice Chen",
            "sales": [
                {"product": "Widget Pro", "quantity": 37, "revenue": 1849.63},
                {"product": "Power Unit", "quantity": 10, "revenue": 899.90},
                {"product": "Widget Basic", "quantity": 145, "revenue": 3623.55}
            ]
        },
        {
            "name": "South",
            "manager": "Bob Martinez",
            "sales": [
                {"product": "Gadget Plus", "quantity": 8, "revenue": 239.92},
                {"product": "Widget Pro", "quantity": 18, "revenue": 899.82},
                {"product": "Power Unit", "quantity": 12, "revenue": 1079.88}
            ]
        },
        {
            "name": "East",
            "manager": "Carol Davis",
            "sales": [
                {"product": "Widget Pro", "quantity": 22, "revenue": 1099.78},
                {"product": "Super Tool", "quantity": 55, "revenue": 1099.45},
                {"product": "Gadget Plus", "quantity": 25, "revenue": 749.75}
            ]
        }
    ]
}

# Task:
# 1. Flatten the nested structure into a list of dicts
# 2. Each dict should have: Region, Manager, Product, Quantity, Revenue
# 3. Convert to DataFrame and print regional totals
`,
      solution: `import pandas as pd
import io

sales_report = {
    "report_date": "2023-Q1",
    "regions": [
        {
            "name": "North",
            "manager": "Alice Chen",
            "sales": [
                {"product": "Widget Pro", "quantity": 37, "revenue": 1849.63},
                {"product": "Power Unit", "quantity": 10, "revenue": 899.90},
                {"product": "Widget Basic", "quantity": 145, "revenue": 3623.55}
            ]
        },
        {
            "name": "South",
            "manager": "Bob Martinez",
            "sales": [
                {"product": "Gadget Plus", "quantity": 8, "revenue": 239.92},
                {"product": "Widget Pro", "quantity": 18, "revenue": 899.82},
                {"product": "Power Unit", "quantity": 12, "revenue": 1079.88}
            ]
        },
        {
            "name": "East",
            "manager": "Carol Davis",
            "sales": [
                {"product": "Widget Pro", "quantity": 22, "revenue": 1099.78},
                {"product": "Super Tool", "quantity": 55, "revenue": 1099.45},
                {"product": "Gadget Plus", "quantity": 25, "revenue": 749.75}
            ]
        }
    ]
}

# Flatten the structure
rows = []
for region in sales_report["regions"]:
    for sale in region["sales"]:
        rows.append({
            "Region": region["name"],
            "Manager": region["manager"],
            "Product": sale["product"],
            "Quantity": sale["quantity"],
            "Revenue": sale["revenue"]
        })

df = pd.DataFrame(rows)

# Regional totals
print("Regional Performance:")
regional = df.groupby("Region")["Revenue"].sum()
for region, rev in regional.items():
    print(f"  {region}: \${rev:,.2f}")`,
      validateFn: `return output.includes("North") && output.includes("South") && output.includes("East") && output.includes("$")`,
      hint: "Loop through regions, then through each region's sales, building a flat list of dicts",
      xpReward: 50,
    },
  },
  {
    module: "Web & APIs",
    moduleSlug: "web-apis",
    lessonNumber: 28,
    slug: "beautifulsoup-basics",
    title: "BeautifulSoup Basics",
    badge: "concept",
    theory: `
## BeautifulSoup

BeautifulSoup parses HTML/XML, letting you extract data from web pages:

\`\`\`python
from bs4 import BeautifulSoup

html = "<html><body><h1>Title</h1><p>Content</p></body></html>"
soup = BeautifulSoup(html, "html.parser")

print(soup.h1.text)  # "Title"
print(soup.p.text)   # "Content"
\`\`\`

## finding elements

\`\`\`python
# Find first matching element
soup.find("div")
soup.find("div", class_="container")
soup.find("a", href="/page")

# Find all matching elements
soup.find_all("p")
soup.find_all("a")
soup.find_all("div", class_="item")
\`\`\`

## extracting

\`\`\`python
element = soup.find("a")
element.text           # Text content
element.get("href")    # Attribute value
element["href"]        # Same, but may raise error
element.get_text(strip=True)  # Clean text
\`\`\`

## css selectors

\`\`\`python
soup.select("div.container")    # Class selector
soup.select("#main")            # ID selector
soup.select("div p")            # Descendant
soup.select("div > p")          # Direct child
soup.select("a[href]")          # Has attribute
\`\`\`

## scraping a list

\`\`\`python
items = []
for row in soup.find_all("tr"):
    cols = row.find_all("td")
    if cols:
        items.append({
            "name": cols[0].text.strip(),
            "price": cols[1].text.strip()
        })
\`\`\`

## with pyfetch

In this site we fetch HTML over the network with \`pyfetch\` (same-origin works without any CORS hassle), then feed \`response.string()\` to BeautifulSoup. Same code as a regular Python script except for the \`await\`.

\`\`\`python
from pyodide.http import pyfetch
from bs4 import BeautifulSoup

response = await pyfetch("/sample-data/electronics-store.html")
html = await response.string()
soup = BeautifulSoup(html, "html.parser")

print(soup.find("h1").get_text())
\`\`\`

There's a real HTML page bundled with this site at \`/sample-data/electronics-store.html\` for the examples below. It has an inventory table, category list, and "featured" section so you can practice every common selector against actual markup, not a synthetic string.

## what BeautifulSoup can't do

BeautifulSoup parses the HTML that the server sent. That is exactly what you
want for static pages. But many modern sites send a near-empty shell and build
the real content in the browser with JavaScript. BeautifulSoup never sees that
content, because it does not run JavaScript.

⚠️ Warning: if \`find_all\` comes back empty on a page that clearly has data,
the page is probably rendered client-side. Check by viewing the raw source
(\`requests.get(url).text\`), not the browser inspector. If the data is not in
the raw HTML, you need a tool that drives a real browser, like Playwright or
Selenium, or you find the JSON API the page itself calls.

## scrape responsibly

Scraping pulls real resources off someone else's server, and the rules are not
optional:

- Check the site's \`robots.txt\` and terms of service before you scrape.
- Identify yourself with a real \`User-Agent\` and slow down. One request every
  second or two is polite; hammering a site is not.
- Cache what you fetch so you do not re-download the same page on every run.
- Prefer an official API when one exists. It is faster, more stable, and
  allowed.

💡 Key: the goal is to be a guest, not a denial-of-service attack. A scraper
that respects rate limits and robots.txt can run for years; a greedy one gets
your IP banned by lunch.
`,
    starterCode: `# Fetch the sample HTML and parse it with BeautifulSoup.
from pyodide.http import pyfetch
from bs4 import BeautifulSoup

resp = await pyfetch("/sample-data/electronics-store.html")
html = await resp.string()
soup = BeautifulSoup(html, "html.parser")

# Page title
print("title:", soup.find("h1").get_text())

# Category list
categories = [li.get_text() for li in soup.select("ul#category-list li.cat")]
print("categories:", categories)
`,
    examples: [
      {
        title: "finding by tag and by class",
        explanation: "find returns the first match; find_all returns every match. Selectors land on the same elements.",
        code: `from pyodide.http import pyfetch
from bs4 import BeautifulSoup

resp = await pyfetch("/sample-data/electronics-store.html")
soup = BeautifulSoup(await resp.string(), "html.parser")

# First h1 on the page
print("page heading:", soup.find("h1").get_text())

# All section headings
for h2 in soup.find_all("h2"):
    print("section:", h2.get_text())

# Featured list items via CSS selector
for li in soup.select("ul.featured-list li"):
    print("featured:", li.get_text(strip=True))`,
      },
      {
        title: "reading attributes off elements",
        explanation: "Real scraping needs the attribute, not just the text. element[\"attr\"] or element.get(\"attr\") both work.",
        code: `from pyodide.http import pyfetch
from bs4 import BeautifulSoup

resp = await pyfetch("/sample-data/electronics-store.html")
soup = BeautifulSoup(await resp.string(), "html.parser")

# Each featured item carries the SKU in a data attribute.
featured_skus = [li.get("data-sku") for li in soup.select("ul.featured-list li")]
print("featured skus:", featured_skus)

# Pull category names from a structured list rather than free-form text
categories = [c.get_text(strip=True) for c in soup.select("li.cat")]
print("count of categories:", len(categories))`,
      },
      {
        title: "walking a table by hand",
        explanation: "Lesson 29 uses pd.read_html for this. Doing it by hand once teaches you what read_html is doing under the hood.",
        code: `import pandas as pd
from pyodide.http import pyfetch
from bs4 import BeautifulSoup

resp = await pyfetch("/sample-data/electronics-store.html")
soup = BeautifulSoup(await resp.string(), "html.parser")

table = soup.find("table", id="inventory-table")
headers = [th.get_text(strip=True) for th in table.find_all("th")]

rows = []
for tr in table.find("tbody").find_all("tr"):
    cells = [td.get_text(strip=True) for td in tr.find_all("td")]
    rows.append(dict(zip(headers, cells)))

df = pd.DataFrame(rows)
df["Price"] = df["Price"].astype(float)
df["Stock"] = df["Stock"].astype(int)
print(df.head())
print(f"total inventory rows: {len(df)}")`,
      },
    ],
    challenges: [
      {
        id: "m6l3c1",
        prompt: "Fetch /sample-data/electronics-store.html, parse it, and print the page's h1 text exactly as it appears.",
        hint: "soup.find('h1').get_text()",
        validateFn: `return output.includes("Electronics Store") && output.includes("Weekly Inventory")`,
        solution: `from pyodide.http import pyfetch
from bs4 import BeautifulSoup

resp = await pyfetch("/sample-data/electronics-store.html")
soup = BeautifulSoup(await resp.string(), "html.parser")
print(soup.find("h1").get_text())`,
      },
      {
        id: "m6l3c2",
        prompt: "Fetch the same page and print how many distinct categories appear in the category list, in the format 'categories: N' where N is an integer.",
        hint: "len(soup.select('li.cat'))",
        validateFn: `return /categories:\\s*4\\b/.test(output)`,
        solution: `from pyodide.http import pyfetch
from bs4 import BeautifulSoup

resp = await pyfetch("/sample-data/electronics-store.html")
soup = BeautifulSoup(await resp.string(), "html.parser")
count = len(soup.select("li.cat"))
print(f"categories: {count}")`,
      },
    ],
    projectChallenge: {
      threadId: "sales",
      threadTitle: "Sales Performance Dashboard",
      taskTitle: "Extract Sales from HTML",
      context: "The legacy system exports sales data as HTML. Extract the sales information from the HTML table structure using regex patterns.",
      starterCode: `import pandas as pd
import io
import re

# HTML sales report from legacy system
html_report = """
<div class="sales-report">
    <h2>Q1 Sales Summary</h2>
    <div class="sale-card">
        <span class="rep">Alice Chen</span>
        <span class="region">North</span>
        <span class="product">Widget Pro</span>
        <span class="revenue">$749.85</span>
    </div>
    <div class="sale-card">
        <span class="rep">Bob Martinez</span>
        <span class="region">South</span>
        <span class="product">Gadget Plus</span>
        <span class="revenue">$239.92</span>
    </div>
    <div class="sale-card">
        <span class="rep">Carol Davis</span>
        <span class="region">East</span>
        <span class="product">Widget Pro</span>
        <span class="revenue">$1099.78</span>
    </div>
    <div class="sale-card">
        <span class="rep">Dan Wilson</span>
        <span class="region">West</span>
        <span class="product">Super Tool</span>
        <span class="revenue">$899.55</span>
    </div>
</div>
"""

# Task:
# 1. Extract rep names, regions, products, and revenues using regex
# 2. Parse revenue strings (remove $ and convert to float)
# 3. Print each sale and the total revenue
`,
      solution: `import pandas as pd
import io
import re

html_report = """
<div class="sales-report">
    <h2>Q1 Sales Summary</h2>
    <div class="sale-card">
        <span class="rep">Alice Chen</span>
        <span class="region">North</span>
        <span class="product">Widget Pro</span>
        <span class="revenue">$749.85</span>
    </div>
    <div class="sale-card">
        <span class="rep">Bob Martinez</span>
        <span class="region">South</span>
        <span class="product">Gadget Plus</span>
        <span class="revenue">$239.92</span>
    </div>
    <div class="sale-card">
        <span class="rep">Carol Davis</span>
        <span class="region">East</span>
        <span class="product">Widget Pro</span>
        <span class="revenue">$1099.78</span>
    </div>
    <div class="sale-card">
        <span class="rep">Dan Wilson</span>
        <span class="region">West</span>
        <span class="product">Super Tool</span>
        <span class="revenue">$899.55</span>
    </div>
</div>
"""

# Extract each field
reps = re.findall(r'<span class="rep">([^<]+)</span>', html_report)
regions = re.findall(r'<span class="region">([^<]+)</span>', html_report)
products = re.findall(r'<span class="product">([^<]+)</span>', html_report)
revenues = re.findall(r'<span class="revenue">\\$([^<]+)</span>', html_report)

# Build and display results
total = 0
print("Extracted Sales:")
for rep, region, product, rev in zip(reps, regions, products, revenues):
    amount = float(rev.replace(",", ""))
    total += amount
    print(f"  {rep} ({region}): {product} - \${amount:.2f}")

print(f"\\nTotal Revenue: \${total:,.2f}")`,
      validateFn: `return output.includes("Alice") && output.includes("Bob") && output.includes("Total") && output.includes("$")`,
      hint: "Use separate findall patterns for each span class, then zip them together",
      xpReward: 50,
    },
  },
  {
    module: "Web & APIs",
    moduleSlug: "web-apis",
    lessonNumber: 29,
    slug: "scraping-tables",
    title: "Scraping Tables",
    badge: "practice",
    theory: `
## pd.read_html

\`pd.read_html\` parses every table on a page into DataFrames. In a regular script you can hand it a URL. In Pyodide, the network goes through pyfetch, so the recipe is:

\`\`\`python
from pyodide.http import pyfetch
import pandas as pd

resp = await pyfetch("/sample-data/electronics-store.html")
html = await resp.string()
tables = pd.read_html(html)   # list of DataFrames, one per <table>
df = tables[0]
\`\`\`

The site bundles a real HTML page at \`/sample-data/electronics-store.html\` containing an inventory table. The examples below pull from it.

## picking the right table

When a page has more than one table, three tools narrow it down:

\`\`\`python
pd.read_html(html, match="Inventory")          # tables containing this text
pd.read_html(html, attrs={"id": "inventory-table"})  # by attribute
pd.read_html(html, header=0)                   # explicit header row
\`\`\`

## cleaning

\`pd.read_html\` returns strings for every column by default, because HTML doesn't know types. You'll always have a cleanup step.

\`\`\`python
df = pd.read_html(html, attrs={"id": "inventory-table"})[0]
df["Price"] = df["Price"].astype(float)
df["Stock"] = df["Stock"].astype(int)
\`\`\`

Currency or formatted numbers need a regex strip first:

\`\`\`python
df["Revenue"] = df["Revenue"].str.replace(r"[$,]", "", regex=True).astype(float)
\`\`\`

## what read_html can't do

- Pages where the table is rendered by JavaScript after page load. \`pyfetch\` gets the raw HTML; if the table isn't in the initial markup, it's not there to parse.
- Cells with images instead of text. The image alt attribute is sometimes a good fallback, but \`read_html\` ignores it; you have to drop to BeautifulSoup.
- Tables with merged cells (rowspan/colspan). Pandas tries, but you'll often need to clean the output by hand.
`,
    starterCode: `# Fetch the real inventory page and pull the table into a DataFrame.
import pandas as pd
from pyodide.http import pyfetch

resp = await pyfetch("/sample-data/electronics-store.html")
html = await resp.string()

df = pd.read_html(html, attrs={"id": "inventory-table"})[0]
df["Price"] = df["Price"].astype(float)
df["Stock"] = df["Stock"].astype(int)

print(df.head())
print(f"rows: {len(df)}")
print(f"total stock units across catalog: {df['Stock'].sum()}")
`,
    examples: [
      {
        title: "all tables on a page",
        explanation: "When you don't know exactly which table you want, read everything and inspect.",
        code: `import pandas as pd
from pyodide.http import pyfetch

resp = await pyfetch("/sample-data/electronics-store.html")
html = await resp.string()

tables = pd.read_html(html)
print(f"found {len(tables)} tables")
for i, t in enumerate(tables):
    print(f"\\ntable {i} columns: {list(t.columns)}")
    print(t.head(3))`,
      },
      {
        title: "aggregating after the parse",
        explanation: "Once you have a DataFrame, the rest is normal pandas.",
        code: `import pandas as pd
from pyodide.http import pyfetch

resp = await pyfetch("/sample-data/electronics-store.html")
df = pd.read_html(await resp.string(), attrs={"id": "inventory-table"})[0]

df["Price"] = df["Price"].astype(float)
df["Stock"] = df["Stock"].astype(int)

# Stock by category
by_cat = df.groupby("Category")["Stock"].sum().sort_values(ascending=False)
print(by_cat)

# Inventory value by category
df["Value"] = df["Price"] * df["Stock"]
value_by_cat = df.groupby("Category")["Value"].sum().round(2)
print("\\ninventory value by category:")
print(value_by_cat)`,
      },
      {
        title: "filtering during the parse",
        explanation: "Pass match= to skip tables you don't want. Useful when a page has nav tables, sidebar tables, etc.",
        code: `import pandas as pd
from pyodide.http import pyfetch

resp = await pyfetch("/sample-data/electronics-store.html")
html = await resp.string()

# Only tables that contain the word "SKU"
hits = pd.read_html(html, match="SKU")
print(f"matching tables: {len(hits)}")
print(hits[0].head())`,
      },
    ],
    challenges: [
      {
        id: "m6l4c1",
        prompt: "Fetch /sample-data/electronics-store.html, parse the inventory table, and print the total stock count across all rows in the format 'total stock: N' where N is an integer.",
        hint: "pyfetch, pd.read_html(attrs={'id': 'inventory-table'})[0], cast Stock to int, sum it",
        validateFn: `return /total\\s+stock:\\s*1?\\d{3,4}\\b/.test(output)`,
        solution: `import pandas as pd
from pyodide.http import pyfetch

resp = await pyfetch("/sample-data/electronics-store.html")
df = pd.read_html(await resp.string(), attrs={"id": "inventory-table"})[0]
df["Stock"] = df["Stock"].astype(int)
print(f"total stock: {df['Stock'].sum()}")`,
      },
      {
        id: "m6l4c2",
        prompt: "Same page. Find the single category with the highest total inventory value (Price * Stock summed). Print 'top category: NAME' where NAME is the category name.",
        hint: "compute Value column, groupby Category sum Value, idxmax",
        validateFn: `return /top\\s+category:\\s*(Laptops|Phones|Tablets|Accessories)/.test(output)`,
        solution: `import pandas as pd
from pyodide.http import pyfetch

resp = await pyfetch("/sample-data/electronics-store.html")
df = pd.read_html(await resp.string(), attrs={"id": "inventory-table"})[0]
df["Price"] = df["Price"].astype(float)
df["Stock"] = df["Stock"].astype(int)
df["Value"] = df["Price"] * df["Stock"]
top = df.groupby("Category")["Value"].sum().idxmax()
print(f"top category: {top}")`,
      },
    ],
    projectChallenge: {
      threadId: "sales",
      threadTitle: "Sales Performance Dashboard",
      taskTitle: "Parse HTML Sales Report",
      context: "The weekly sales report is distributed as an HTML table. Use pd.read_html to extract the data and clean up the currency formatting for analysis.",
      starterCode: `import pandas as pd
import io

# Weekly sales report as HTML table
html_table = """
<table border="1">
    <thead>
        <tr><th>SalesRep</th><th>Region</th><th>Product</th><th>Units</th><th>Revenue</th></tr>
    </thead>
    <tbody>
        <tr><td>Alice Chen</td><td>North</td><td>Widget Pro</td><td>15</td><td>$749.85</td></tr>
        <tr><td>Bob Martinez</td><td>South</td><td>Gadget Plus</td><td>8</td><td>$239.92</td></tr>
        <tr><td>Carol Davis</td><td>East</td><td>Widget Pro</td><td>22</td><td>$1,099.78</td></tr>
        <tr><td>Dan Wilson</td><td>West</td><td>Super Tool</td><td>45</td><td>$899.55</td></tr>
        <tr><td>Eva Brown</td><td>North</td><td>Power Unit</td><td>10</td><td>$899.90</td></tr>
    </tbody>
</table>
"""

# Task:
# 1. Parse the HTML table with pd.read_html
# 2. Clean the Revenue column (remove $ and commas, convert to float)
# 3. Find the top performer by revenue
# 4. Print the DataFrame and the top performer
`,
      solution: `import pandas as pd
import io

html_table = """
<table border="1">
    <thead>
        <tr><th>SalesRep</th><th>Region</th><th>Product</th><th>Units</th><th>Revenue</th></tr>
    </thead>
    <tbody>
        <tr><td>Alice Chen</td><td>North</td><td>Widget Pro</td><td>15</td><td>$749.85</td></tr>
        <tr><td>Bob Martinez</td><td>South</td><td>Gadget Plus</td><td>8</td><td>$239.92</td></tr>
        <tr><td>Carol Davis</td><td>East</td><td>Widget Pro</td><td>22</td><td>$1,099.78</td></tr>
        <tr><td>Dan Wilson</td><td>West</td><td>Super Tool</td><td>45</td><td>$899.55</td></tr>
        <tr><td>Eva Brown</td><td>North</td><td>Power Unit</td><td>10</td><td>$899.90</td></tr>
    </tbody>
</table>
"""

# Parse HTML table (wrap in io.StringIO so it works across pandas versions)
df = pd.read_html(io.StringIO(html_table))[0]

# Clean revenue column
df["Revenue"] = df["Revenue"].str.replace("$", "", regex=False).str.replace(",", "", regex=False).astype(float)

print("Sales Data:")
print(df)

# Find top performer
top_idx = df["Revenue"].idxmax()
top_rep = df.loc[top_idx, "SalesRep"]
top_rev = df.loc[top_idx, "Revenue"]
print(f"\\nTop Performer: {top_rep} with \${top_rev:,.2f}")`,
      validateFn: `return output.includes("Carol") && output.includes("1099") || output.includes("1,099")`,
      hint: "Use pd.read_html, then str.replace to remove $ and commas before converting to float",
      xpReward: 50,
    },
  },
  {
    module: "Web & APIs",
    moduleSlug: "web-apis",
    lessonNumber: 30,
    slug: "data-pipeline",
    title: "Building a Data Pipeline",
    badge: "challenge",
    theory: `
## the pipeline

Three steps, three functions, one source of truth: an actual JSON endpoint. We'll use \`/posts\` and \`/users\` from jsonplaceholder.

1. **Extract** with \`pyfetch\`. Hit each endpoint, check status, get JSON.
2. **Transform** with pandas. Convert lists of dicts to DataFrames, merge on \`userId\`, classify.
3. **Load** with print/return. Real pipelines write to CSV, a database, or a dashboard; in the browser we render.

Wrapping each phase in a function is what turns a pile of fetch calls into a *pipeline*. It also makes the pieces testable in isolation.

## skeleton

\`\`\`python
async def extract():
    posts_resp = await pyfetch("https://jsonplaceholder.typicode.com/posts")
    users_resp = await pyfetch("https://jsonplaceholder.typicode.com/users")
    if posts_resp.status != 200 or users_resp.status != 200:
        raise RuntimeError("upstream API not available")
    return await posts_resp.json(), await users_resp.json()

def transform(posts_raw, users_raw):
    posts = pd.DataFrame(posts_raw)
    users = pd.DataFrame(users_raw)[["id", "name"]]
    return posts.merge(users, left_on="userId", right_on="id", suffixes=("_post", "_user"))

def load(df):
    counts = df.groupby("name").size().sort_values(ascending=False)
    print(counts)
    return counts
\`\`\`

## logging

The browser console can swallow errors mid-pipeline. A tiny log helper makes it obvious where a run stopped.

\`\`\`python
from datetime import datetime
def log(step, msg):
    print(f"[{datetime.now():%H:%M:%S}] [{step}] {msg}")
\`\`\`

## idempotence

A pipeline you can re-run safely is worth ten times one you can't. That usually means:
- Extract is side-effect-free (just fetching, not mutating server state)
- Transform takes raw data and returns new data, never mutates inputs
- Load either overwrites the destination or uses an upsert key
`,
    starterCode: `# Live ETL pipeline: jsonplaceholder posts + users → per-user post counts.
import pandas as pd
from datetime import datetime
from pyodide.http import pyfetch

def log(step, msg):
    print(f"[{datetime.now():%H:%M:%S}] [{step}] {msg}")

async def extract():
    log("EXTRACT", "fetching posts and users...")
    posts_resp = await pyfetch("https://jsonplaceholder.typicode.com/posts")
    users_resp = await pyfetch("https://jsonplaceholder.typicode.com/users")
    if posts_resp.status != 200 or users_resp.status != 200:
        raise RuntimeError("upstream API not available")
    posts = await posts_resp.json()
    users = await users_resp.json()
    log("EXTRACT", f"{len(posts)} posts, {len(users)} users")
    return posts, users

def transform(posts_raw, users_raw):
    log("TRANSFORM", "merging on userId and tagging long posts...")
    posts = pd.DataFrame(posts_raw)
    users = pd.DataFrame(users_raw)[["id", "name"]]
    joined = posts.merge(users, left_on="userId", right_on="id", suffixes=("_post", "_user"))
    joined["body_chars"] = joined["body"].str.len()
    joined["long_post"] = joined["body_chars"] > joined["body_chars"].median()
    log("TRANSFORM", f"{len(joined)} rows after merge")
    return joined

def load(df):
    log("LOAD", "summarizing per user...")
    by_user = df.groupby("name").agg(
        posts=("title", "count"),
        long_posts=("long_post", "sum"),
        avg_body_chars=("body_chars", "mean"),
    ).round(0).astype(int).sort_values("posts", ascending=False)
    print(by_user)
    return by_user

raw_posts, raw_users = await extract()
joined = transform(raw_posts, raw_users)
summary = load(joined)
`,
    examples: [
      {
        title: "extract-only: pull and store before transforming",
        explanation: "Real pipelines often separate extract from transform so the network step can be re-run independently. Cache the raw payload.",
        code: `import pandas as pd
from pyodide.http import pyfetch

async def extract():
    resp = await pyfetch("https://jsonplaceholder.typicode.com/comments")
    if resp.status != 200:
        raise RuntimeError(f"comments: status {resp.status}")
    return await resp.json()

raw = await extract()
print(f"raw rows: {len(raw)}")
print("first record keys:", list(raw[0].keys()))

# Hold the raw payload as a frame so transform can be run repeatedly without re-fetching.
raw_df = pd.DataFrame(raw)
print(raw_df.head(2))`,
      },
      {
        title: "transform: classify by a derived field",
        explanation: "Pull comments, group by post, then classify each post by its average comment length into tiers.",
        code: `import pandas as pd
from pyodide.http import pyfetch

resp = await pyfetch("https://jsonplaceholder.typicode.com/comments")
comments = pd.DataFrame(await resp.json())

per_post = comments.groupby("postId").agg(
    comment_count=("id", "count"),
    avg_body_chars=("body", lambda s: s.str.len().mean()),
).round(0).astype(int)

per_post["length_tier"] = pd.cut(
    per_post["avg_body_chars"],
    bins=[-1, 150, 175, 10000],
    labels=["terse", "normal", "verbose"],
)
print(per_post.head(10))
print("\\nposts by comment-length tier:")
print(per_post["length_tier"].value_counts())`,
      },
      {
        title: "load: write the summary back to a CSV string",
        explanation: "In a browser we can't write a real file, but we can build the same CSV that load() would write to disk.",
        code: `import pandas as pd
import io
from pyodide.http import pyfetch

resp = await pyfetch("https://jsonplaceholder.typicode.com/todos")
todos = pd.DataFrame(await resp.json())

summary = todos.groupby("userId").agg(
    total=("id", "count"),
    completed=("completed", "sum"),
)
summary["completion_pct"] = (summary["completed"] / summary["total"] * 100).round(1)

# What you'd write to a file in a real script:
buf = io.StringIO()
summary.to_csv(buf)
csv_text = buf.getvalue()

print("first 200 chars of the CSV that load() would persist:\\n")
print(csv_text[:200])`,
      },
    ],
    challenges: [
      {
        id: "m6l5c1",
        prompt: "Fetch all todos from https://jsonplaceholder.typicode.com/todos. Group by userId and compute the number of completed todos per user. Print the user with the most completed todos in the format 'top user: N has K completed' where N and K are integers.",
        hint: "DataFrame the response, groupby userId, sum the 'completed' boolean, idxmax",
        validateFn: `return /top\\s+user:\\s*\\d+\\s+has\\s+\\d+\\s+completed/i.test(output) && !output.toLowerCase().includes("error")`,
        solution: `import pandas as pd
from pyodide.http import pyfetch

resp = await pyfetch("https://jsonplaceholder.typicode.com/todos")
todos = pd.DataFrame(await resp.json())
completed_by_user = todos.groupby("userId")["completed"].sum()
top_user = int(completed_by_user.idxmax())
top_count = int(completed_by_user.max())
print(f"top user: {top_user} has {top_count} completed")`,
      },
      {
        id: "m6l5c2",
        prompt: "Build a full extract/transform/load pipeline that: extracts /posts and /users from jsonplaceholder, merges them on userId, and prints 'pipeline ok: N rows for M users' (N is total joined rows, M is unique authors).",
        hint: "Three functions, returns chained together, len(df) and df['name'].nunique()",
        validateFn: `return /pipeline\\s+ok:\\s*\\d+\\s+rows\\s+for\\s+\\d+\\s+users/i.test(output) && !output.toLowerCase().includes("traceback")`,
        solution: `import pandas as pd
from pyodide.http import pyfetch

async def extract():
    p = await pyfetch("https://jsonplaceholder.typicode.com/posts")
    u = await pyfetch("https://jsonplaceholder.typicode.com/users")
    return await p.json(), await u.json()

def transform(posts_raw, users_raw):
    posts = pd.DataFrame(posts_raw)
    users = pd.DataFrame(users_raw)[["id", "name"]]
    return posts.merge(users, left_on="userId", right_on="id", suffixes=("_post", "_user"))

def load(df):
    print(f"pipeline ok: {len(df)} rows for {df['name'].nunique()} users")

raw_posts, raw_users = await extract()
joined = transform(raw_posts, raw_users)
load(joined)`,
      },
    ],
    projectChallenge: {
      threadId: "sales",
      threadTitle: "Sales Performance Dashboard",
      taskTitle: "Build Sales ETL Pipeline",
      context: "Create a complete ETL pipeline for the sales dashboard. Extract data from the source, transform it with revenue calculations and categorization, then load a summary report.",
      starterCode: `import pandas as pd
import io

sales_csv = """SaleID,SalesRep,Region,Product,Category,Quantity,UnitPrice,SaleDate,CustomerSegment
S001,Alice Chen,North,Widget Pro,Electronics,15,49.99,2023-01-05,Enterprise
S002,Bob Martinez,South,Gadget Plus,Tools,8,29.99,2023-01-08,SMB
S003,Carol Davis,East,Widget Pro,Electronics,22,49.99,2023-01-10,Enterprise
S004,Dan Wilson,West,Super Tool,Tools,45,19.99,2023-01-12,Consumer
S005,Eva Brown,North,Power Unit,Electronics,10,89.99,2023-01-15,Enterprise
S006,Alice Chen,North,Gadget Plus,Tools,30,29.99,2023-01-18,SMB
S007,Bob Martinez,South,Widget Pro,Electronics,18,49.99,2023-01-20,Consumer
S008,Carol Davis,East,Super Tool,Tools,55,19.99,2023-02-01,SMB
S009,Dan Wilson,West,Power Unit,Electronics,8,89.99,2023-02-05,Enterprise
S010,Eva Brown,North,Widget Basic,Electronics,65,24.99,2023-02-10,Consumer
S011,Alice Chen,North,Super Tool,Tools,40,19.99,2023-02-15,Consumer
S012,Bob Martinez,South,Power Unit,Electronics,12,89.99,2023-02-20,Enterprise
S013,Carol Davis,East,Gadget Plus,Tools,25,29.99,2023-03-01,SMB
S014,Dan Wilson,West,Widget Pro,Electronics,20,49.99,2023-03-05,Enterprise
S015,Eva Brown,North,Widget Basic,Electronics,80,24.99,2023-03-10,Consumer"""

# Task: Build a complete ETL pipeline with 3 functions:
# 1. extract() - Load and return the sales DataFrame
# 2. transform(df) - Add Revenue, SaleTier (High/Medium/Low based on revenue)
# 3. load(df) - Print summary by Region and by SaleTier
# Run the full pipeline and print results
`,
      solution: `import pandas as pd
import io

sales_csv = """SaleID,SalesRep,Region,Product,Category,Quantity,UnitPrice,SaleDate,CustomerSegment
S001,Alice Chen,North,Widget Pro,Electronics,15,49.99,2023-01-05,Enterprise
S002,Bob Martinez,South,Gadget Plus,Tools,8,29.99,2023-01-08,SMB
S003,Carol Davis,East,Widget Pro,Electronics,22,49.99,2023-01-10,Enterprise
S004,Dan Wilson,West,Super Tool,Tools,45,19.99,2023-01-12,Consumer
S005,Eva Brown,North,Power Unit,Electronics,10,89.99,2023-01-15,Enterprise
S006,Alice Chen,North,Gadget Plus,Tools,30,29.99,2023-01-18,SMB
S007,Bob Martinez,South,Widget Pro,Electronics,18,49.99,2023-01-20,Consumer
S008,Carol Davis,East,Super Tool,Tools,55,19.99,2023-02-01,SMB
S009,Dan Wilson,West,Power Unit,Electronics,8,89.99,2023-02-05,Enterprise
S010,Eva Brown,North,Widget Basic,Electronics,65,24.99,2023-02-10,Consumer
S011,Alice Chen,North,Super Tool,Tools,40,19.99,2023-02-15,Consumer
S012,Bob Martinez,South,Power Unit,Electronics,12,89.99,2023-02-20,Enterprise
S013,Carol Davis,East,Gadget Plus,Tools,25,29.99,2023-03-01,SMB
S014,Dan Wilson,West,Widget Pro,Electronics,20,49.99,2023-03-05,Enterprise
S015,Eva Brown,North,Widget Basic,Electronics,80,24.99,2023-03-10,Consumer"""

def extract():
    print("[EXTRACT] Loading sales data...")
    df = pd.read_csv(io.StringIO(sales_csv))
    print(f"[EXTRACT] Loaded {len(df)} records")
    return df

def transform(df):
    print("[TRANSFORM] Processing data...")
    df["Revenue"] = df["Quantity"] * df["UnitPrice"]
    df["SaleTier"] = pd.cut(df["Revenue"],
                            bins=[0, 500, 1000, float("inf")],
                            labels=["Low", "Medium", "High"])
    print(f"[TRANSFORM] Added Revenue and SaleTier columns")
    return df

def load(df):
    print("[LOAD] Generating reports...")
    print("\\n=== Revenue by Region ===")
    by_region = df.groupby("Region")["Revenue"].sum()
    for region, rev in by_region.items():
        print(f"  {region}: \${rev:,.2f}")

    print("\\n=== Sales by Tier ===")
    print(df["SaleTier"].value_counts())

    print(f"\\n[LOAD] Total Revenue: \${df['Revenue'].sum():,.2f}")

# Run pipeline
raw = extract()
transformed = transform(raw)
load(transformed)
print("\\n[COMPLETE] Pipeline finished successfully!")`,
      validateFn: `return output.includes("EXTRACT") && output.includes("TRANSFORM") && output.includes("LOAD") && output.includes("Region")`,
      hint: "Create three functions for extract/transform/load, then call them in sequence",
      xpReward: 50,
    },
  },
  {
    module: "Web & APIs",
    moduleSlug: "web-apis",
    lessonNumber: 31,
    slug: "sockets",
    title: "Sockets: Talking Directly to Another Program",
    badge: "concept",
    theory: `
An HTTP request is a polite, highly structured conversation over a socket. A socket is
the raw version: one program listens, another dials, and they exchange bytes until
someone hangs up.

The server side is four calls.

\`\`\`python
import socket

server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server.bind(("127.0.0.1", 5000))   # claim an address and port
server.listen()                     # start queueing connections
conn, addr = server.accept()        # block until someone dials
\`\`\`

The client side is two.

\`\`\`python
client = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
client.connect(("127.0.0.1", 5000))
\`\`\`

⚠️ Warning: sockets move **bytes**, not Python strings. You must \`.encode()\` before
sending and \`.decode()\` after receiving. Forgetting this is the single most common
socket bug and the error message rarely says so plainly.

💡 Key: pick a port above 1023. Everything below that is reserved and needs
administrator rights on most systems.

📝 Note: this lesson does not run here. The browser sandbox has no socket layer, which
is exactly why the web uses HTTP through a browser API instead. To run the real thing,
put the server in one file and the client in another and run them in two terminals.
The challenges below drill the part that actually breaks: encoding and message framing.

✨ Tip: whoever speaks first is a decision you must make and write down. If both sides
wait to receive, both block forever and the program simply hangs with no error.
`,
    starterCode: `# Sockets need a real OS network stack, so this lesson explains and drills
# rather than runs. The encode/decode work below is the part that bites people.

message = "hello server"
as_bytes = message.encode()
print("sending:", as_bytes)
print("received back:", as_bytes.decode())
`,
    examples: [
      {
        title: "encode and decode",
        explanation: "Strings go out as bytes and come back as bytes; you convert both ways",
        code: `msg = "MKE"
data = msg.encode()
print(type(data).__name__, data)
print(data.decode())`,
      },
      {
        title: "Framing a message",
        explanation:
          "TCP is a stream, not a message queue; a delimiter tells you where one message ends",
        code: `stream = "first\\nsecond\\nthird\\n"
for line in stream.split("\\n"):
    if line:
        print("message:", line)`,
      },
    ],
    challenges: [
      {
        id: "m6l6c1",
        prompt:
          "Write round_trip(text) that encodes a string to bytes and decodes it back, returning the decoded string. Print the result for 'hello server' and also print the type name of the encoded form. Output must contain 'bytes' and 'hello server'.",
        hint: "Use text.encode() then .decode(); type(data).__name__ gives the type name.",
        validateFn: `return output.includes("bytes") && output.includes("hello server")`,
        solution: `def round_trip(text):
    data = text.encode()
    print(type(data).__name__)
    return data.decode()

print(round_trip("hello server"))`,
      },
      {
        id: "m6l6c2",
        prompt:
          "TCP is a stream, so messages arrive glued together. Write split_messages(stream) that splits on newline and drops empty pieces, and print how many messages are in 'first\\\\nsecond\\\\nthird\\\\n' as 'messages: N'. It should be 3.",
        hint: "Split on the newline character and filter out empty strings, then print the length.",
        validateFn: `return /messages:\\s*3/.test(output)`,
        solution: `def split_messages(stream):
    return [m for m in stream.split("\\n") if m]

print("messages:", len(split_messages("first\\nsecond\\nthird\\n")))`,
      },
    ],
  },
];
