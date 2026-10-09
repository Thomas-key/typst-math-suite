# Typst Math Suite

**[简体中文](README.md) · [English](README.en.md)**

Type trigger words inside Typst math mode (`$ … $`) and they expand on the spot into symbols or structures — write notes without breaking your flow.

## Features

- **Math-mode gating** — fires only inside `$ … $`.
- **Instant expansion** — replaced on the spot, no completion list, no delay.
- **Tab stops** — the cursor lands where the argument goes; press `Tab` to move on.
- **Nestable** — keep typing trigger words inside an expanded snippet.
- **Postfix triggers** — `xhat` → `hat(x)`: write the letter first, add the accent after.
- **Rules are editable** — built-in rules live in `rules.jsonc` next to the extension; edit it directly (comments allowed), or add and override rules in Settings.

## Highlights

- **Fills the three gaps of native snippets** — native snippets can't detect math mode, can only match from a leading letter, and postfix triggers never make it into the completion list. This extension solves all three.
- **111 word-end rules + 11 regex rules built in** — Greek letters, powers / roots / fractions, sets and relations, derivatives and integrals, limits and sums, brackets and norms… (see "Built-in rules at a glance" below)
- **Two places to edit** — `rules.jsonc` holds the built-in rules, Settings hold yours; a duplicate key takes the value from Settings.

## Where the rules live

|  | Location | Good for |
| --- | --- | --- |
| Built-in rules | `rules.jsonc` in the extension folder | bulk editing, comments, deleting rules you don't want |
| Your own rules | `typstMathSuite.*` in Settings | adding one or two on the fly |

The two are merged: **a duplicate key uses the value from Settings; a new key becomes a new rule.**

- `rules.jsonc` accepts `//` and `/* */` comments and trailing commas.
- Changing `rules.jsonc` requires a **window reload** (Command Palette → `Developer: Reload Window`).
- Changing Settings applies instantly, no reload.

## Customization

### Option 1: `rules.jsonc` (edit the built-in rules)

```jsonc
{
  "inMath": {
    "sr": "^2",             // type sr → ^2
    "sq": "sqrt($1)$0",     // $1 $0 are cursor tab stops
    "//": "frac($1, $2)$0"  // type // → frac(_, _)
  },
  "outMath": {
    "mk": "\\$$1\\$$0"      // type mk → $…$
  },
  "inMathRegex": {
    "([A-Za-z0-9]+)hat$": "hat({1})"   // type xhat → hat(x)
  },
  "outMathRegex": {}
}
```

### Option 2: Settings (add your own rules)

Open Settings (`Ctrl + ,`) and search for `typstMathSuite`:

| Setting | Description |
| --- | --- |
| `typstMathSuite.inMathRules` | Rules **inside** math: `trigger → replacement` |
| `typstMathSuite.outMathRules` | Rules **outside** math |
| `typstMathSuite.inMathRegexRules` | **Regex** rules inside math (postfix; `{1}` = capture group) |
| `typstMathSuite.outMathRegexRules` | **Regex** rules outside math |

```jsonc
"typstMathSuite.inMathRules": {
  "sr": "^2",            // type sr → ^2
  "sq": "sqrt($1)$0",    // $1 $0 are cursor tab stops
  "//": "frac($1, $2)$0" // type // → frac(_, _)
}
```

**Three markers inside a replacement**:

- `$1` `$0` — tab stops (cursor positions)
- `\$` — a literal dollar sign
- `{1}` `{2}` — regex capture groups (regex rules only)

## Built-in rules at a glance

**Greek letters** (26): `@a` `@b` `@g` `@G` `@d` `@D` `@e` `:e` `@z` `@t` `@T` `:t` `@i` `@k` `@l` `@L` `@s` `@S` `@u` `@U` `@o` `@O` `@p` `@m` `@f` `@y`

**Powers / roots / fractions / scripts** (10): `sr` `cb` `rd` `_` `sts` `sq` `//` `ee` `invs` `conj`

**Operator names** (5): `Re` `Im` `bf` `rm` `trace`

**Common symbols** (14): `+-` `-+` `|...` `/...` `del` `xx` `**` `para` `simm` `sim=` `===` `prop` `!>` `=<`

**Sets / relations / number sets** (17): `and` `orr` `inn` `notin` `setm` `sub=` `sup=` `eset` `set` `ext` `LL` `HH` `CC` `RR` `ZZ` `NN` `QQ`

**Algebra symbols** (2): `o+` `ox`

**Accents / decorations** (8): `ddot` `cdot` `dot` `hat` `bar` `tilde` `und` `vec`

**Derivatives / integrals** (9): `par` `ddt` `iiint` `iint` `oint` `oinf` `infi` `dint` `int`

**Brackets / norms / matrices** (14): `brk` `pmat` `bmat` `matrix` `cases` `Norm` `norm` `ceil` `floor` `lra` `lr(` `lr{` `lr[` `lr|`

**Limits / sums / Taylor** (6): `tayl` `lsup` `linf` `lim` `sum` `prod`

## License

MIT
