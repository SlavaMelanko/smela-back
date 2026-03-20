---
name: cloc
description: Count lines of code in the src folder and display a formatted markdown table split by source, tests, and other categories. Use when the user asks for a lines of code summary or cloc report.
---

# Cloc Skill

Generate a lines-of-code breakdown for the `src/` directory, split into **source**, **tests**, and **other** categories, then print a copy-pasteable markdown table.

## Steps

### 1. Discover all languages

Run `cloc src` to get the full language list and totals.

### 2. Identify "primary" languages

A language is **primary** (gets its own source/test split) if it has **≥ 1000 lines of code** in the `cloc src` output (excluding test files). Currently that is **TypeScript**.

Any language below 1000 lines goes into the **Other** bucket.

### 3. Run the three commands

```bash
# Source — primary languages, no test files, no other-category extensions
cloc src --not-match-f='\.test\.' --exclude-ext=json,md,sql

# Tests — test files only
cloc src --match-f='\.test\.'

# Other — everything that isn't a primary language
cloc src --match-f='\.(json|md|sql)$'
```

> **Dynamic other extensions**: if step 1 reveals new languages with < 1000 lines (e.g. `yaml`, `css`), add their extensions to the `--match-f` pattern in the Other command and to `--exclude-ext` in the Source command.

### 4. Aggregate totals

Sum Files / Blank / Comment / Code across all three rows for the Total row.

### 5. Output the table

Output the table as a raw markdown code block (wrapped in triple backticks) so the user can copy and paste it directly into GitHub release notes or any `.md` file.

- Format numbers with thousands separators
- The **Other** category label should list the actual extensions found (e.g. `Other (JSON, MD, SQL)`)
- Add a **%** column as the last column — each row shows that category's share of total **Code** lines, rounded to the nearest whole percent
- Bold the **Total** row, which shows `100%`

Example output:

````
```
| Category | Files | Blank | Comment | Code | % |
|---|---|---|---|---|---|
| TypeScript (source) | 312 | 1,822 | 644 | 7,100 | 34% |
| TypeScript (tests) | 80 | 2,790 | 129 | 11,441 | 55% |
| Other (JSON, MD, SQL) | 9 | 148 | 12 | 2,248 | 11% |
| **Total** | **401** | **4,760** | **785** | **20,789** | **100%** |
```
````
