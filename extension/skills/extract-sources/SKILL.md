---
name: extract-sources
description: Process source material with Supermemory when an attachment, URL, audio, video, or long text needs OCR, transcription, parsing, durable indexing, a reusable document handle, or lower-token analysis. Use when the source is too large or unsupported for direct model inspection, the user asks to extract or index it, it must remain searchable after the current turn, or remember-context needs a source-backed document ID.
---

# Extract sources with Supermemory

Use the tools from this skill's mounted extension namespace whose runtime names
end in `__extract` and `__read_document`.

## Choose the source path

Use direct model inspection when a supported attachment is already available
and the user only needs an immediate answer. Use Supermemory extraction when
processing should be offloaded, the source needs durable or repeated access, or
another workflow needs provenance.

## Process one source

1. Call `__extract` with one source:
   - `file`: pass the exact Eve attachment path under `/workspace/attachments`;
   - `url`: pass the complete URL;
   - `text`: pass the raw source text.
2. Keep the returned `documentId`; it is the durable handle for this source.
3. Call `__read_document` with that ID, `container: agent_extraction`, and
   `offset: 0`.
4. When processing is not complete, read the same document again after
   processing advances.
5. Continue from `nextOffset` only while more content is necessary for the
   user's question. Read the complete source only for tasks that genuinely
   require complete understanding.

When `remember-context` invokes this workflow, return the exact document ID and
the source evidence needed to compose the memory. The remember workflow owns
the final synthesis and passes the document ID as provenance.
