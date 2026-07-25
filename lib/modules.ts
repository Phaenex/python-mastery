import type { Module } from "./types";

export const MODULE_METADATA: Omit<Module, "lessons">[] = [
  {
    slug: "start-here",
    title: "Start Here",
    description:
      "Never written code before? Start at zero. Run your first line, learn what a variable is, and see how to use this site. No prior knowledge needed.",
  },
  {
    slug: "python-basics",
    title: "Python Basics",
    description:
      "Variables, data structures, loops, and functions. The stuff you'll use in every script you ever write.",
  },
  {
    slug: "pandas-fundamentals",
    title: "Pandas Fundamentals",
    description:
      "DataFrames, Series, filtering, and sorting. How you actually work with tabular data in Python.",
  },
  {
    slug: "data-cleaning",
    title: "Data Cleaning",
    description:
      "Handle missing data, convert types, clean strings, and prepare messy real-world data for analysis.",
  },
  {
    slug: "grouping-combining",
    title: "Grouping & Combining",
    description:
      "Aggregate data with groupby, merge datasets, and reshape tables with pivot operations.",
  },
  {
    slug: "string-file-ops",
    title: "String & File Ops",
    description:
      "String methods, regular expressions, file I/O, and JSON handling.",
  },
  {
    slug: "web-apis",
    title: "Web & APIs",
    description:
      "Fetch data from APIs, parse JSON responses, and scrape web content with BeautifulSoup.",
  },
  {
    slug: "databases-python",
    title: "Databases from Python",
    description:
      "Connect, query, and write with sqlite3: parameters instead of f-strings, transactions that roll back cleanly, constraints the database enforces itself, rows as objects, and where to draw the line between SQL and pandas. Real SQL, running for real in your browser.",
  },
  {
    slug: "functions-apply",
    title: "Functions & Apply",
    description:
      "Write lambda functions, use apply and map, and master vectorized operations for performance.",
  },
  {
    slug: "core-python",
    title: "Core Python Deep Dive",
    description:
      "Comprehensions, generators, iterators, decorators, context managers, exceptions, sets, and async. The language features that separate someone who can write Python from someone who reads it fluently.",
  },
  {
    slug: "numpy-foundations",
    title: "NumPy Foundations",
    description:
      "Arrays, dtypes, reshape, broadcasting, and vectorization. The math layer under pandas, plus how to drop down to it when you need speed.",
  },
  {
    slug: "ai-python",
    title: "AI Engineering",
    description:
      "Calling models, forcing structured output, surviving rate limits, counting tokens and cost, embeddings, retrieval, tool use, and how to test output that changes every run. The parts of AI work that actually break.",
  },
  {
    slug: "game-dev-pygame",
    title: "Game Dev with Pygame",
    description:
      "Build real games with Python. Learn the game loop, movement physics, sprites, collision detection, and complete a Brick Breakaway clone from scratch.",
  },
  {
    slug: "data-manipulation-school",
    title: "Data Manipulation (WCTC)",
    description:
      "String cleaning, number formatting, date parsing, combining DataFrames, and pivot tables. Exactly what the WCTC Python Data Manipulation course covers.",
  },
  {
    slug: "oop-tooling",
    title: "Object-Oriented Python",
    description:
      "Classes, dataclasses, inheritance and polymorphism, properties, dunder methods, abstract base classes, and Pythonic patterns. How to model real problems with objects instead of piles of functions.",
  },
  {
    slug: "tooling-environments",
    title: "Tooling & Environments",
    description:
      "Virtual environments, pip, pytest, mocking, debugging, profiling, and the linters and formatters real teams run. The workflow around the code that makes a project maintainable.",
  },
];
