import type { Project } from "../types";

// The capstone for the AI Engineering track. Every other project here is data work;
// this one builds a retrieval pipeline end to end, which is the thing the eight AI
// lessons teach in pieces and never assemble.
//
// It runs entirely offline. The embedding is a small deterministic keyword vector
// rather than a model call, because Pyodide has no network. That swap changes nothing
// about the pipeline: chunking, ranking, grounding, citation checking and evaluation
// are identical whether the vectors come from a keyword count or from an API. Swapping
// in a real embedding function at the end is a one-line change, and the last step says so.
const DOCS = `MKE is the airport serving the city of Milwaukee, Wisconsin.

The main runway at MKE was resurfaced in the spring of 2024.

Winter weather in Wisconsin closes the airport for a few days most years.

ORD is the airport serving Chicago, and it is one of the busiest in the world.`;

export const aiDocAssistantProject: Project = {
  slug: "ai-doc-assistant",
  title: "Capstone: A Document Assistant That Cites Its Sources",
  description:
    "Build a retrieval pipeline from nothing: chunk a document, embed it, rank chunks against a question, ground the prompt, then check the answer actually cites what it used. This is the AI track assembled into one working thing. No API key and no network needed.",
  difficulty: "intermediate",
  estimatedTime: "40 min",
  dataset: DOCS,
  datasetName: "Four short paragraphs about airports",
  datasetDescription:
    "Small enough to reason about by eye, which is the point: you can check the ranking by hand and tell whether retrieval is working before you trust it on anything bigger.",
  steps: [
    {
      id: "rag-1",
      title: "Chunk the document",
      description: `A model cannot search your files, so first you cut them into pieces small enough to be specific.

Split \`DOCS\` on blank lines, drop anything empty, and print \`chunks: N\`.

**Goal:** \`chunks: 4\`

Splitting on blank lines keeps whole thoughts together. Cutting every 500 characters instead is the most common reason a retrieval demo returns nonsense: it slices sentences in half and the halves mean nothing.`,
      starterCode: `DOCS = """MKE is the airport serving the city of Milwaukee, Wisconsin.

The main runway at MKE was resurfaced in the spring of 2024.

Winter weather in Wisconsin closes the airport for a few days most years.

ORD is the airport serving Chicago, and it is one of the busiest in the world."""

# Split into chunks on blank lines, drop empties, print how many you got.
`,
      hints: [
        'DOCS.split("\\n\\n") gives you the pieces.',
        "Strip each piece and keep only the ones that are not empty.",
        'chunks = [c.strip() for c in DOCS.split("\\n\\n") if c.strip()]',
      ],
      validateFn: `return /chunks:\\s*4/.test(output)`,
    },
    {
      id: "rag-2",
      title: "Turn text into vectors",
      description: `Now make each chunk comparable to a question. A real system calls an embedding model; here you build a small deterministic vector by counting keywords, which behaves the same way for ranking.

Write \`embed(text)\` returning a numpy array counting how often each of \`KEYS\` appears, plus a small constant so no vector is all zeros.

Print the vector for the runway chunk.

**Goal:** the printed vector shows a non-zero count in the runway position.

The \`+ 0.01\` matters: cosine similarity divides by vector length, and an all-zero vector divides by zero.`,
      starterCode: `import numpy as np

KEYS = ["airport", "runway", "city", "weather", "chicago", "winter"]

def embed(text):
    # Count each keyword in text, return a numpy array, add 0.01 to every slot.
    pass

print(embed("The main runway at MKE was resurfaced in the spring of 2024."))
`,
      hints: [
        "text.lower().count(k) counts one keyword.",
        "Build a list with a comprehension over KEYS, then wrap it in np.array(...).",
        'return np.array([float(text.lower().count(k)) for k in KEYS]) + 0.01',
      ],
      validateFn: `return /1\\.01|1\\.01\\b/.test(output) || /\\[\\s*0?\\.01\\s+1\\.01/.test(output)`,
    },
    {
      id: "rag-3",
      title: "Rank chunks against a question",
      description: `This is the step that decides whether the whole thing works. If ranking is wrong, no amount of prompt wording saves the answer.

Write \`cosine(a, b)\` and \`rank(question, chunks)\` returning chunks sorted best-first. Print the top chunk for the question "which runway was resurfaced".

**Goal:** the printed chunk mentions the runway.

Check this by eye on four chunks now. On four thousand you will not be able to, and you will be glad you confirmed the method while you still could.`,
      starterCode: `import numpy as np

KEYS = ["airport", "runway", "city", "weather", "chicago", "winter"]

def embed(text):
    return np.array([float(text.lower().count(k)) for k in KEYS]) + 0.01

chunks = [
    "MKE is the airport serving the city of Milwaukee, Wisconsin.",
    "The main runway at MKE was resurfaced in the spring of 2024.",
    "Winter weather in Wisconsin closes the airport for a few days most years.",
    "ORD is the airport serving Chicago, and it is one of the busiest in the world.",
]

# Write cosine(a, b) and rank(question, chunks), then print the best chunk.
`,
      hints: [
        "cosine is the dot product divided by the product of both norms.",
        "np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))",
        "sorted(chunks, key=lambda c: cosine(embed(question), embed(c)), reverse=True)",
      ],
      validateFn: `return output.toLowerCase().includes("runway")`,
    },
    {
      id: "rag-4",
      title: "Ground the prompt",
      description: `Now build the request. Put the retrieved chunks in the prompt with numbered sources so the answer can point at them.

Write \`build_prompt(question, top_chunks)\` returning a messages list. The user message must wrap the numbered sources in \`<context>\` tags and end with \`Q: \` and the question.

Print the user message content.

**Goal:** the output contains \`<context>\`, \`[1]\`, and \`Q:\`.

Numbering the sources is what makes the next step possible. Without it, "cite your sources" is a request the model can only pretend to honour.`,
      starterCode: `question = "which runway was resurfaced"
top_chunks = [
    "The main runway at MKE was resurfaced in the spring of 2024.",
    "MKE is the airport serving the city of Milwaukee, Wisconsin.",
]

def build_prompt(question, top_chunks):
    # Number each chunk as [1], [2], ... inside <context> tags.
    # System message should tell the model to answer only from the context and cite.
    pass

msgs = build_prompt(question, top_chunks)
print(msgs[1]["content"])
`,
      hints: [
        'Number them with enumerate(top_chunks, 1) and an f-string like f"[{i}] {chunk}".',
        'Join the numbered lines with "\\n" and wrap the result in <context> tags.',
        'The user content is f"<context>{sources}</context>\\n\\nQ: {question}"',
      ],
      validateFn: `return output.includes("<context>") && output.includes("[1]") && output.includes("Q:")`,
    },
    {
      id: "rag-5",
      title: "Check the answer actually cites something",
      description: `An instruction to "answer only from the context" is a request, not a guarantee. A model with an empty or irrelevant context will often answer from memory anyway, confidently.

Write \`has_citation(answer, n_sources)\` returning True only when the answer references at least one source marker that exists. Test it against an answer that cites \`[1]\`, one that cites nothing, and one that cites \`[9]\` when only 2 sources were given.

**Goal:** print \`True\`, \`False\`, \`False\` on three lines.

That third case is the interesting one. A model inventing \`[9]\` looks cited and is not.`,
      starterCode: `import re

def has_citation(answer, n_sources):
    # Find every [n] in the answer and keep only the ones within range.
    pass

print(has_citation("The runway was resurfaced in 2024 [1].", 2))
print(has_citation("The runway was resurfaced in 2024.", 2))
print(has_citation("The runway was resurfaced in 2024 [9].", 2))
`,
      hints: [
        're.findall(r"\\[(\\d+)\\]", answer) pulls out the numbers as strings.',
        "Convert to int and keep those between 1 and n_sources.",
        'return any(1 <= int(m) <= n_sources for m in re.findall(r"\\[(\\d+)\\]", answer))',
      ],
      validateFn: `const lines = output.trim().split(/\\s*\\n\\s*/).filter(Boolean).map(s => s.toLowerCase());
return lines.length >= 3 && lines[0] === "true" && lines[1] === "false" && lines[2] === "false"`,
    },
    {
      id: "rag-6",
      title: "Evaluate the whole pipeline",
      description: `Last step, and the one most people skip. You cannot assert on the exact words a model returns, so assert on properties instead, across a small set of questions you know the answers to.

Write \`evaluate(cases)\` where each case is \`(question, expected_keyword)\`. For each one, retrieve the top chunk and count it as a pass when the expected keyword appears in it. Print \`passed: N/M\`.

**Goal:** \`passed: 3/3\`

This is your regression test. When you swap the keyword \`embed\` for a real embedding model, or reword the prompt, run this again. If retrieval quietly got worse, this is the only thing that will tell you.`,
      starterCode: `import numpy as np

KEYS = ["airport", "runway", "city", "weather", "chicago", "winter"]

def embed(text):
    return np.array([float(text.lower().count(k)) for k in KEYS]) + 0.01

def cosine(a, b):
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

chunks = [
    "MKE is the airport serving the city of Milwaukee, Wisconsin.",
    "The main runway at MKE was resurfaced in the spring of 2024.",
    "Winter weather in Wisconsin closes the airport for a few days most years.",
    "ORD is the airport serving Chicago, and it is one of the busiest in the world.",
]

cases = [
    ("which runway was resurfaced", "runway"),
    ("what closes the airport in winter", "weather"),
    ("which airport serves chicago", "Chicago"),
]

def evaluate(cases):
    # Retrieve the best chunk per question, pass when the keyword is in it.
    pass

evaluate(cases)
`,
      hints: [
        "Reuse the ranking from step 3 to get the single best chunk per question.",
        "Compare case-insensitively: keyword.lower() in best.lower().",
        'Count passes, then print(f"passed: {passed}/{len(cases)}").',
      ],
      validateFn: `return /passed:\\s*3\\s*\\/\\s*3/.test(output)`,
    },
  ],
};
