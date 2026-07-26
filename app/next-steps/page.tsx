import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Next steps · python-mastery",
  description: "Where to go once you have worked through the modules.",
};

export default function NextStepsPage() {
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
            <Link href="/glossary" className="text-muted-foreground hover:text-foreground transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">glossary</Link>
          </nav>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
        <h1 className="text-2xl font-semibold">Where this leads</h1>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          This site teaches the language and gives you a lot of practice. To actually become a developer you
          have to step off the training wheels and build things in a real setup. Here is the honest bridge
          from “I know the syntax” to “I can build stuff.”
        </p>

        <section className="mt-10">
          <p className="text-xs uppercase tracking-widest text-muted-foreground"># what this browser sandbox cannot do</p>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            The Python here runs in your browser, which is amazing for practice with zero setup. But it cannot
            install most libraries, read and write files on your computer, run a web server, talk to a real
            database, or use git. Real projects need all of that. So at some point you move to Python on your
            own machine.
          </p>
        </section>

        <section className="mt-10">
          <p className="text-xs uppercase tracking-widest text-muted-foreground"># 1 · install real python</p>
          <ul className="mt-4 space-y-2 text-muted-foreground leading-relaxed">
            <li>Get Python from <a href="https://www.python.org/downloads/" className="text-accent hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">python.org/downloads</a> (or, on a Mac, <code className="text-foreground">brew install python</code>).</li>
            <li>Get an editor: <a href="https://code.visualstudio.com/" className="text-accent hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">VS Code</a> is free and the most common. Install its Python extension.</li>
            <li>Check it works in a terminal: <code className="text-foreground">python3 --version</code>.</li>
          </ul>
        </section>

        <section className="mt-10">
          <p className="text-xs uppercase tracking-widest text-muted-foreground"># 2 · run your own file</p>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            Make a file called <code className="text-foreground">hello.py</code>, put <code className="text-foreground">print(&quot;hello&quot;)</code> in it, and run it from the terminal:
          </p>
          <pre className="mt-3 p-3 rounded bg-card border border-border/60 text-foreground overflow-x-auto" tabIndex={0} role="group" aria-label="Code block, scrollable">python3 hello.py</pre>
          <p className="mt-3 text-muted-foreground">That is the same code you wrote here, now running for real on your computer.</p>
        </section>

        <section className="mt-10">
          <p className="text-xs uppercase tracking-widest text-muted-foreground"># 3 · isolate projects and install libraries</p>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            The Tooling module covers this in depth. The short version: each project gets its own virtual
            environment so their libraries do not fight.
          </p>
          <pre className="mt-3 p-3 rounded bg-card border border-border/60 text-foreground overflow-x-auto" tabIndex={0} role="group" aria-label="Code block, scrollable">{`python3 -m venv .venv
source .venv/bin/activate     # Windows: .venv\\Scripts\\activate
pip install pandas requests`}</pre>
        </section>

        <section className="mt-10">
          <p className="text-xs uppercase tracking-widest text-muted-foreground"># 4 · learn git and github</p>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            git tracks your code history; GitHub stores it online and is where your portfolio lives. Every job
            expects it. Start with <code className="text-foreground">git init</code>, <code className="text-foreground">git add</code>, <code className="text-foreground">git commit</code>, then push to a GitHub repo.
            <a href="https://docs.github.com/en/get-started/quickstart" className="text-accent hover:underline ml-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">GitHub&apos;s quickstart</a> is a good first walk-through.
          </p>
        </section>

        <section className="mt-10">
          <p className="text-xs uppercase tracking-widest text-muted-foreground"># 5 · build real things</p>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            This is the actual leap. Pick something small and real, finish it, then pick a slightly bigger one.
            Good first builds: a script that renames or sorts your files, a tiny command-line tool, a script
            that pulls data from a public API and saves a CSV, a small Flask or FastAPI web page. You learn
            ten times more from one finished project than from another tutorial.
          </p>
        </section>

        <section className="mt-10">
          <p className="text-xs uppercase tracking-widest text-muted-foreground"># free places to keep going</p>
          <ul className="mt-4 space-y-2 text-muted-foreground leading-relaxed">
            <li><a href="https://docs.python.org/3/tutorial/" className="text-accent hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">The official Python tutorial</a>, dry but accurate, the source of truth.</li>
            <li><a href="https://automatetheboringstuff.com/" className="text-accent hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">Automate the Boring Stuff</a>, free book, practical projects for total beginners.</li>
            <li><a href="https://roadmap.sh/python" className="text-accent hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">roadmap.sh/python</a>, a visual map of what to learn next.</li>
            <li>Also learning databases? <a href="https://damato-sql.vercel.app" className="text-accent hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">the SQL version of this site</a>.</li>
          </ul>
        </section>

        <p className="mt-12 text-muted-foreground leading-relaxed">
          None of this happens in a weekend. “Pro” is months of building, getting stuck, and looking things up.
          That is normal, and it is the same for everyone who does this now. Keep going.
        </p>
      </main>

      <footer className="border-t border-border/60 py-5 text-xs">
        <div className="max-w-3xl mx-auto px-6 flex flex-wrap items-center justify-between gap-3 text-muted-foreground">
          <span><span className="text-success">exit 0</span> · keep building</span>
          <Link href="/learn" className="hover:text-foreground transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">back to lessons</Link>
        </div>
      </footer>
    </div>
  );
}
