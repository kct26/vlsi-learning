# HardCode (Ground Up Hardware)

A study kit for hardware engineering online assessments (built while preparing for the NVIDIA Ignite hardware internship). It has two parts:

- **Hardware from the Ground Up**: a 233-page beginner's book, written in LaTeX, that builds hardware from electricity to GPUs: transistors, CMOS gates, timing, power, PVT, manufacturing, memory, Verilog and verification, architecture, GPUs and computer arithmetic. Every chapter ends with exercises and answers.
- **HardCode**, the trainer: a single-page web app for practicing it:
  - a home page with interactive try-it widgets, and a sign-in screen (Google or email) when accounts are turned on;
  - **Roadmap**: an interactive VLSI roadmap of 36 topics (23 theory quests with interactive widgets, the hands-on coding tracks, and the role each path leads to), plus the stages in detail;
  - **Theory**: a 682-problem multiple-choice and true/false list with solved/total progress, covering hardware theory plus Linux, git, scripting, DFT, physical-design flow and signal integrity;
  - a Coding tab with 64 hands-on problems (RTL in Verilog, SystemVerilog and cocotb verification, C and C++, Python, Bash, Tcl and SDC, Perl, CUDA, MATLAB) in Easy, Medium and Hard, with hints and reference solutions;
  - a LeetCode-style judge for 42 of them, running entirely in the browser: **Run** tries the example cases, **Submit** runs every hidden test and records the verdict (Accepted, Wrong Answer, Compile Error, Runtime Error, Time Limit Exceeded). Python runs in Pyodide; C and C++ compile with Clang built for WebAssembly; Verilog is synthesized by Yosys and simulated gate by gate;
  - **Online Assessment**: a timed mock OA in a random company's format (15 hardware questions and 2 judged coding problems in 75 minutes for NVIDIA's Ignite hardware format), with the company revealed when you submit. Other companies are listed as coming soon; add them in `trainer/src/assessments.js`;
  - **Companies**: every theory and coding problem tagged with the companies whose hardware roles test it, LeetCode style, with a page per company (NVIDIA's includes your OA and reported topics);
  - **Roles**: what hardware postings ask for, how well this kit covers it, and the roles to aim for;
  - **Profile**, LeetCode style: solved counts, a year of activity as a heatmap, current and longest streaks, recent submissions, languages and skills, plus backup and reset;
  - timed mock assessments, a light and dark theme, and the Theory list grouped by VLSI area (devices, front-end, back-end and signoff, tools).

> Unofficial study material. Not produced, reviewed or endorsed by NVIDIA. Topics marked "reported" come from anonymous candidate reports (see the book's Appendix E) and are hints about the *kind* of question to expect, not real assessment content.

## Contents

```
book/
  hardware-from-the-ground-up.pdf   the compiled book
  hardware-from-the-ground-up.tex   main file (parts and chapter order)
  preamble.tex                      packages, boxes and macros
  chapters/                         one .tex file per chapter and appendix
docs/
  index.html                        the built trainer (served by GitHub Pages)
  firebase-config.js                optional Google sign-in settings (null = off)
firestore.rules                     database rules: each account sees only its own progress
FIREBASE_SETUP.md                   how to turn on Google sign-in
trainer/
  build.js                          checks the data and builds docs/index.html
  src/
    questions.js                    the multiple-choice bank
    coding.js                       the coding problems, solutions and Python tests
    hidden-tests.js                 hidden tests for the C, C++ and Verilog problems
    judge.js                        the in-browser judge (C/C++ harness, Verilog simulator, checkers)
    companies.js                    companies and which problems carry their tags
    assessments.js                  online assessment formats, one per company
    lessons.js                      quests and lesson cards
    widgets.js                      interactive lesson widgets
    app.js                          the app
    style.css, shell.html           styles and page skeleton
  tests/                            headless-Chrome click-through tests
```

## Use the trainer

Open `docs/index.html` in any browser. It is one self-contained file: no server, no install, works offline.

**Saving progress:**
- By default, progress is saved in that browser.
- To keep one record across all your devices, turn on Google sign-in once by following [FIREBASE_SETUP.md](FIREBASE_SETUP.md). After that, a **Sign in** button appears in the top bar.
- Either way, **Export progress** and **Import progress** on your Profile page make a backup file, and importing merges instead of overwriting.

To put it online with **GitHub Pages**: push this repository, then in the repository's **Settings → Pages**, set **Source** to "Deploy from a branch", the branch to `main`, and the folder to `/docs`. The trainer will be at `https://<your-username>.github.io/<repository-name>/`.

## Edit the problems or lessons

Each problem in `trainer/src/questions.js` is one line:

```js
["14-01", "M", "Question text", ["correct answer", "wrong", "wrong", "wrong"], "Explanation", "o"]
["14-02", "E", "A true/false statement.", true, "Explanation"]
```

- **id**: `CC-NN`. `CC` is the book chapter that teaches the topic, which is also the quest it belongs to.
- **difficulty**: `E`, `M` or `H`.
- **answer**: either four options with the correct one first (the app shuffles them), or `true` / `false`.
- **tags** (optional):
  - `o`: from my OA;
  - `v`: a variant of an OA question;
  - `r`: reported online;
  - `b`: beyond the book (the explanation is the lesson);
  - `a`: computer arithmetic.

Coding problems live in `trainer/src/coding.js`. Each one has:
- `id`, difficulty `d`, `lang` and `area`;
- a statement `p`, an optional example `ex`, `starter` code, `hints`, a reference solution `sol` and an explanation `why`;
- for Python, optional `run` tests (`{fn, tests: [[args], expected]}`), run in the browser with Pyodide.

Hidden tests for C, C++ and Verilog live in `trainer/src/hidden-tests.js`, keyed by problem id:
- **C/C++**: `[expression, expected]` pairs (a `"string"` compares as text), or `[statements, printed text, 'out', label]` to compare output. The first three tests are the examples that **Run** uses.
- **Verilog**: `benches` drive your module and the reference solution with the same stimulus (directed `rows` plus seeded random ones) and compare every output every cycle; `check` names a property checker in `judge.js` for problems where several designs are correct (an LFSR, a divide-by-3 clock, a pulse synchronizer, an asynchronous FIFO, a skid buffer).

The compilers download from the jsDelivr CDN the first time you run that language (Clang about 25 MB, Yosys about 15 MB, Pyodide about 10 MB), then stay cached.

### Company tags

`trainer/src/companies.js` lists the companies. A problem gets a company's tag when:
- it comes from one of the company's `chapters` (theory) or `areas` (coding);
- it carries one of the company's source `tags` (NVIDIA uses `ovr`: your OA, variants, reported);
- or its id is in the company's `ids` list.

To add questions for a company, write them in `questions.js` or `coding.js` as usual, then add their ids to that company's `ids`. Also add them to `reported` if they really came from that company's interviews. To add a company, copy an entry. The build checks that every id exists.

Then rebuild (needs [Node.js](https://nodejs.org)):

```bash
cd trainer
node build.js
```

The build refuses to write the page if anything is inconsistent: duplicate ids, wrong option counts, unknown tags, a lesson pointing at a missing problem, or a quest with fewer than 5 problems for its checkpoint.

## Run the tests

```bash
cd trainer
./tests/run-tests.sh
```

This builds the page and clicks through it in headless Google Chrome:
- the quest flow and checkpoints;
- every lesson and widget;
- the problem list filters, and submitting and retrying problems;
- the profile (streaks, heatmap, recent submissions) and the timed mock;
- the roadmap map and the dark-mode toggle;
- the home page, the Companies and Roles pages, and the company filters;
- deep links and phone-width layout;
- importing a backup, and the sign-in screen and sync (against a simulated Firebase);
- the Coding tab: filters, hints, the solution and submissions tabs, saving your code, and real Run and Submit verdicts for Python, C, C++ and Verilog (this phase waits in real time, because the compilers download in the background).

To check the hidden tests themselves (every reference solution passes, broken versions fail, and the Verilog simulator agrees with Icarus Verilog cycle by cycle):

```bash
npm install @yowasp/yosys@0.68.1207
node tests/judge-check.js
```

This needs `clang` and `iverilog` on your machine.

Set `CHROME=/path/to/chrome` if Chrome is not at the macOS default location.

## Security and privacy

- **Accounts:** each signed-in account can read, write and delete only its own record (`firestore.rules`). Writes must have the exact shape the site saves, under about 900 KB. After editing the rules, publish them in the Firebase console under **Firestore → Rules**.
- **The Firebase web config** in `docs/firebase-config.js` is public by design. The rules are what protect the data.
- **Content-Security-Policy:** the standalone page sets one (in `build.js`) that allows only this site, jsDelivr (the judge's compilers), Google Fonts, and Google and Firebase for sign-in.
- **Saved progress:** it can come from this browser, an account or an imported file, so it is rebuilt field by field as it loads. Nothing stored can be shown as page markup.
- **The judge:** code runs inside the browser, in a Web Worker with a time limit, and is never uploaded.
- **Sign-in gate:** with accounts turned on, signed-out visitors can open only Home and Privacy; anything else asks them to sign in, then takes them there. This shapes the experience, not secrecy: a static page's content is visible in its source.
- **Admin dashboard:** `#admin`, only for the account IDs in `FIREBASE_ADMINS` (in `docs/firebase-config.js`), which must match `isAdmin()` in `firestore.rules`.
- **Privacy:** the site has no analytics, ads or tracking cookies. It has a Privacy page (`#privacy`), and the profile has **Delete my account and data**.

## Build the book

The PDF is included. To rebuild it after editing a chapter, install [Tectonic](https://tectonic-typesetting.github.io) (it downloads the LaTeX packages it needs), then:

```bash
cd book
tectonic hardware-from-the-ground-up.tex
```

## Upload this folder to GitHub

Create an empty repository on GitHub, then from this folder:

```bash
git init
git add .
git commit -m "Ground Up Hardware: book and trainer"
git branch -M main
git remote add origin https://github.com/<your-username>/<repository-name>.git
git push -u origin main
```

Or, on the new repository's page, choose **uploading an existing file** and drag in everything inside this folder.
