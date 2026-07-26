import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Glossary · python-mastery",
  description: "Plain-language definitions of the Python terms used across the course.",
};

const TERMS: { term: string; def: string }[] = [
  { term: "syntax", def: "The grammar rules of the language. Get a comma or a colon wrong and Python stops with a syntax error." },
  { term: "print()", def: "Shows a value on the screen. Your main way to see what your code is doing." },
  { term: "variable", def: "A labeled box that holds a value so you can use it later by name. `score = 10` puts 10 in a box named score." },
  { term: "string", def: "Text. You write it in quotes: `\"hello\"`. The s-t-r type." },
  { term: "f-string", def: "A string with values dropped into it, marked with an f and curly braces: `f\"hi {name}\"`." },
  { term: "integer / float", def: "Numbers. An integer is whole (5). A float has a decimal point (5.0). Python calls them int and float." },
  { term: "boolean", def: "A true-or-false value. Just `True` or `False`. Comes from comparisons like `5 > 3`." },
  { term: "None", def: "Python's word for 'nothing here.' A real value that means 'no value.'" },
  { term: "list", def: "An ordered collection you can change: `[1, 2, 3]`. Add, remove, and look things up by position." },
  { term: "index", def: "A position in a sequence, counting from 0. `mylist[0]` is the first item." },
  { term: "slice", def: "A chunk of a sequence: `mylist[1:3]` takes items 1 and 2." },
  { term: "dictionary", def: "A collection of key-to-value pairs: `{\"name\": \"Sam\"}`. Look things up by key instead of position." },
  { term: "tuple", def: "Like a list but fixed once made: `(1, 2)`. Good for things that should not change." },
  { term: "set", def: "A collection of unique items with fast membership checks: `{1, 2, 3}`. No duplicates, no order." },
  { term: "function", def: "A named, reusable block of code. You `def` it once and call it whenever you need it." },
  { term: "argument / parameter", def: "The inputs to a function. The names in the definition are parameters; the values you pass in are arguments." },
  { term: "return", def: "What a function hands back to whoever called it. Without it, a function gives back None." },
  { term: "loop", def: "Code that repeats. A `for` loop runs once per item; a `while` loop runs until a condition stops being true." },
  { term: "conditional (if)", def: "A choice. `if` runs a block only when something is true; `else` covers the rest." },
  { term: "indentation", def: "The spaces at the start of a line. In Python, indentation is not just style, it is how Python knows what is inside a loop, function, or if." },
  { term: "comment", def: "A note for humans that Python ignores. Anything after a `#` on a line." },
  { term: "comprehension", def: "A compact way to build a list, dict, or set in one line: `[n*2 for n in nums]`." },
  { term: "generator", def: "Something that produces values one at a time instead of building them all at once. Made with `yield`. Saves memory on big sequences." },
  { term: "iterator", def: "Any object you can step through one item at a time, like a list or a file in a for loop." },
  { term: "decorator", def: "A function that wraps another function to add behavior, written with an `@` above the function." },
  { term: "class / object", def: "A class is a blueprint; an object is one thing built from it. A `Dog` class, a specific dog object." },
  { term: "method", def: "A function that belongs to an object. `\"hi\".upper()` calls the upper method on a string." },
  { term: "exception / error", def: "What happens when code hits a problem it cannot continue past. You catch them with `try` / `except`." },
  { term: "module / import", def: "A file of reusable code. `import math` brings someone else's code into yours." },
  { term: "library / package", def: "A bundle of modules you install (like pandas or requests) to get features without writing them yourself." },
  { term: "DataFrame (pandas)", def: "A table of data, like a spreadsheet in code. Rows and named columns. The core of data work in Python." },
  { term: "Series (pandas)", def: "A single column of a DataFrame, on its own." },
  { term: "array (NumPy)", def: "A fast grid of numbers. The math layer that pandas is built on." },
];

export default function GlossaryPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-mono text-sm">
      <header className="border-b border-border/60">
        <div className="max-w-3xl mx-auto px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded">
            <span className="text-accent">$</span> cd ~
          </Link>
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link href="/learn" className="text-muted-foreground hover:text-foreground transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">lessons</Link>
            <Link href="/start" className="text-muted-foreground hover:text-foreground transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">start</Link>
            <Link href="/next-steps" className="text-muted-foreground hover:text-foreground transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">next steps</Link>
          </nav>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
        <h1 className="text-2xl font-semibold">Glossary</h1>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          Plain-language definitions of the words the lessons use. If a term ever trips you up, it is probably here.
          No jargon explained with more jargon.
        </p>

        <dl className="mt-8 divide-y divide-border/40 border-y border-border/60">
          {TERMS.map((t) => (
            <div key={t.term} className="py-4 grid sm:grid-cols-[10rem_1fr] gap-2 sm:gap-4">
              <dt className="text-accent">{t.term}</dt>
              <dd className="text-muted-foreground leading-relaxed">{t.def}</dd>
            </div>
          ))}
        </dl>
      </main>

      <footer className="border-t border-border/60 py-5 text-xs">
        <div className="max-w-3xl mx-auto px-6 flex flex-wrap items-center justify-between gap-3 text-muted-foreground">
          <span><span className="text-success">exit 0</span> · {TERMS.length} terms</span>
          <Link href="/" className="hover:text-foreground transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">~ home</Link>
        </div>
      </footer>
    </div>
  );
}
