---
name: forget-memory
description: Remove information retained by Supermemory when the user says “forget that”, “delete this from memory”, “remove what you know about…”, “do not retain this”, or “erase everything related to…”. Use for one specific stored fact, a corrected fact whose old version must be removed, or a broad topic, person, project, category, or request to clear all related memories.
---

# Forget from Supermemory

Use the tools from this skill's mounted extension namespace whose runtime names
end in `__forget` and `__forget_matching`. Use `search-memory` as a supporting
workflow when an exact memory ID is not already known.

## Choose the boundary

- Use the exact-memory flow when the user identifies one specific retained
  fact and one unambiguous memory result represents it.
- Use the matching flow when the user says “all”, “everything”, “anything
  about”, or otherwise intends to remove a related group.
- When the user replaces incorrect stored information, remove the old memory
  first. Load `remember-context` afterward when the corrected information should
  remain available.

## Forget one exact memory

1. Load `search-memory` and search with `scope: memories` unless the exact
   memory result is already available.
2. Identify one unambiguous result containing a `memory` field.
3. Pass its exact `results[].id` to `__forget` as `memoryId`.

If several results could represent the request, clarify the intended boundary
or use the matching flow when the user wants the whole group removed.

## Forget matching memories

1. Call `__forget_matching` with `dryRun: true` and a precise description of
   the complete boundary. This changes nothing.
2. Show the candidate count and enough candidate detail in `ask_question` for
   the user to choose whether to proceed.
3. Only when the user confirms, finalize with the same tool, `dryRun: false`,
   and the exact `candidates[].id` values from the preview. Their answer to
   `ask_question` is the complete confirmation boundary.
4. Report the finalized count.

This workflow removes derived memory entries. Source-document deletion is a
separate capability.
