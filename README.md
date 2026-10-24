# Ground Up Hardware

A study kit for hardware engineering online assessments (built while preparing for the NVIDIA Ignite hardware internship). It has two parts:

- **Hardware from the Ground Up**: a 233-page beginner's book, written in LaTeX, that builds hardware from electricity to GPUs: transistors, CMOS gates, timing, power, PVT, manufacturing, memory, Verilog and verification, architecture, GPUs and computer arithmetic. Every chapter ends with exercises and answers.
- **Ground Up Hardware Trainer**: a single-page web app for practicing it:
  - a 22-quest learning path with interactive widgets;
  - a 609-problem multiple-choice and true/false list with solved/total progress;
  - weekly sets and timed mock assessments;
  - a review of how the material maps to the job posting.

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
trainer/
  build.js                          checks the data and builds docs/index.html
  src/
    questions.js                    the problem bank
    lessons.js                      quests and lesson cards
    widgets.js                      interactive lesson widgets
    app.js                          the app
    style.css, shell.html           styles and page skeleton
  tests/                            headless-Chrome click-through tests
```

## Use the trainer

Open `docs/index.html` in any browser. It is one self-contained file: no server, no install, works offline. Progress is saved in that browser's local storage.

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
- weekly sets, resuming them, and the timed mock;
- the job-match review;
- deep links and phone-width layout.

Set `CHROME=/path/to/chrome` if Chrome is not at the macOS default location.

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
