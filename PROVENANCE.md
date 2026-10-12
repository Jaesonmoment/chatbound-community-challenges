# Source lineage

- `ebs/src/lib/chat-mash-parser.ts`: actual a/l rhythm recognition, separator/repeated-letter handling, length limit and command-like rejection. Converted to JavaScript; non-string values reject instead of being coerced from arbitrary objects.
- `ebs/src/game/chat-rhythm-events.ts`: actual text/number sanitization and limits, active/succeeded/expired/cancelled lifecycle, per-participant and shared action totals, 1-140 direct contribution bounds, and per-participant alternating pointer rule. Sanitizer defaults use neutral community labels. Numeric coercion accepts numbers/strings and safely ignores malformed objects. Database reads/writes and private game effects were omitted.
- `ebs/tests/chat-mash-parser.test.ts` and `ebs/tests/chat-rhythm-events.test.ts`: original examples and sanitizer cases retained as standalone built-in Node checks. Neutral default labels are documented deliberate substitutions.

Storage-independent transitions are newly extracted around those behaviors, not a copied database adapter. They add immutable snapshots, event/scope validation, accepted-message deduplication, strict finite input/time guards, consistent score increments capped at the remaining goal, and deterministic completion/expiry. The new localhost example applies every transition through one in-memory owner and never touches the private game.

No original source was modified. Examples use synthetic guests and generic goals. No story, art, saved configuration, real message, viewer record, credential, database identifier or hosted service is included. Project code is Jaesaen's; no outside implementation/runtime dependency was added.
