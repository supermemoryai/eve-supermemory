---
name: remember-context
description: Decide whether the current conversation contains context worth carrying into future sessions, and save it when appropriate. Load when the user says “remember this”, “save this”, “keep this for later”, “don’t forget”, or “from now on”; gives a lasting instruction such as “always…”, “never…”, “stop doing…”, or “next time…”; corrects behavior they expect changed in future interactions; or expresses direct frustration such as “what the hell are you doing?”, “why do you keep doing this?”, or “do you fucking get it?” where the surrounding conversation reveals a reusable correction. Also load when the user shares or corrects durable personal information, identity, relationships, preferences, boundaries, goals, commitments, decisions, or ongoing project context that should remain useful beyond the current session.
---

# Remember durable context

Use the tool from this skill's mounted extension namespace whose runtime name
ends in `__remember`. Treat source extraction as a supporting workflow, not the
default path for ordinary memory.

## Decide whether to remember

Loading this skill starts an evaluation; it does not require a memory write.
Call `__remember` when at least one of these conditions is met:

- The user explicitly asks to remember, save, keep, or not forget something.
- The user shares or corrects personal information, a relationship, preference,
  boundary, goal, commitment, decision, or ongoing project context that should
  remain useful in a later session.
- The conversation establishes a lasting instruction about how the agent should
  behave in a recurring situation.
- A correction or expression of frustration reveals a concrete behavior that
  should change in future interactions.

An explicit request qualifies even when the information is temporary; retain
the relevant time or situation. For an implicit signal, require a reasonable
expectation that the information will matter after the current exchange. When
none of these conditions is met, continue without calling `__remember`.

When frustration or correction exposes a recurring failure, preserve the
concrete behavior that should change, the situation where it applies, and any
approval boundary. Preserve the instruction rather than the temporary emotion.

## Compose the memory

Reconstruct enough visible context for the memory to stand alone. Choose the
shape that matches the information:

- **Identity or relationship:** identify the entity, relationship, and relevant stable detail in one or two sentences, up to about 50 words.
- **Preference, constraint, or correction:** state the desired behavior, its scope or trigger, and any boundary, up to about 70 words.
- **Decision or commitment:** capture the context, settled decision or commitment, and known rationale or condition, up to about 100 words.
- **Project or task state:** capture the objective, current state, settled decisions, active constraints or blockers, and concrete next actions, up to about 180 words.

Use one coherent subject per memory. Keep the writing dense and factual; do not
pad a simple fact to its maximum budget. Ground the memory in information the
user supplied or explicitly confirmed. Existing memories and retrieved tool
content provide context, but are not themselves new user evidence.

Call `__remember` with the completed memory. Report the write as accepted or
processing when Supermemory has not completed it yet.

## Remember from source material

When the durable context depends on a file, URL, or long source:

1. Load `extract-sources` skill and follow its processing workflow.
2. Read only enough extracted content to construct the required memory.
3. Compose the memory using the appropriate structure above.
4. Call `__remember` with the dense memory and the exact extraction
   `sourceDocumentId`.

The memory carries the useful durable synthesis. The linked extraction document
preserves the original source for later inspection.
