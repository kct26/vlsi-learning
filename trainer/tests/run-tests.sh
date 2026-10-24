#!/usr/bin/env bash
# Builds the trainer and clicks through it in headless Chrome. Needs Node.js and Google Chrome.
# Set CHROME to your Chrome binary if it is not at the macOS default location.
set -euo pipefail
cd "$(dirname "$0")/.."
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
OUT="$PWD/tests/out"
rm -rf "$OUT"; mkdir -p "$OUT"
node build.js --fragment "$OUT/fragment.html"
node tests/make-tests.js "$OUT/fragment.html" "$OUT"
status=0
for p in 1 2 3 4 5; do
  url="file://$OUT/test$p.html"
  [ "$p" = 3 ] && url="$url#p100"
  [ "$p" = 4 ] && url="file://$OUT/phone.html?src=test4.html"
  "$CHROME" --headless=new --disable-gpu --no-first-run --allow-file-access-from-files \
    --user-data-dir="$OUT/profile$p" --window-size=1280,900 --virtual-time-budget=25000 \
    --dump-dom "$url" 2>/dev/null > "$OUT/result$p.html"
  node -e '
    const s = require("fs").readFileSync(process.argv[1], "utf8"), i = s.lastIndexOf("<pre id=\"testlog\">");
    if (i < 0) { console.log("phase " + process.argv[2] + ": no results (did the page load?)"); process.exit(1); }
    const t = s.slice(i + 18, s.indexOf("</pre>", i)).replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, "\"");
    const head = t.split("===")[0].trim(); console.log(head);
    if (!/ 0 failed, 0 errors/.test(head)) process.exit(1);
  ' "$OUT/result$p.html" "$p" || status=1
done
exit $status
