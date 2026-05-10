#!/usr/bin/env bash
# Regenerates all site pages from one shared sidebar template.
# Run: bash _generate.sh
# Edit the SIDEBAR and the make_page calls below to add/remove pages.

set -euo pipefail
cd "$(dirname "$0")"

SIDEBAR='<aside>
  <div class="name"><a href="/">humbleangmoh</a></div>

  <nav>
    <div class="section">
      <div class="section-label">about</div>
      <ul>
        <li><a href="/about/intro.html">intro</a></li>
        <li><a href="/about/contact.html">contact</a></li>
      </ul>
    </div>

    <div class="section">
      <div class="section-label">projects</div>
      <ul>
        <li><a href="/projects/project-one.html">project-one</a></li>
        <li><a href="/projects/project-two.html">project-two</a></li>
        <li><a href="/projects/project-three.html">project-three</a></li>
      </ul>
    </div>

    <div class="section">
      <div class="section-label">notes</div>
      <ul>
        <li><a href="/notes/pdf2image.html">pdf2image</a></li>
      </ul>
    </div>
  </nav>

  <div class="contact">
    <a href="mailto:humbleangmoh@gmail.com">email</a>
    <a href="https://github.com/humbleangmoh">github</a>
  </div>
</aside>'

ACTIVE_SCRIPT='<script>
  document.querySelectorAll("aside a").forEach(function (a) {
    if (a.getAttribute("href") === location.pathname) a.classList.add("active");
  });
</script>'

make_page() {
  local file="$1"
  local breadcrumb="$2"
  local title="$3"
  local content="$4"
  mkdir -p "$(dirname "$file")"
  cat > "$file" <<HTML
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — humbleangmoh</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
${SIDEBAR}
<main>
  <div class="breadcrumb">${breadcrumb}</div>
  <h1>${title}</h1>
${content}
</main>
${ACTIVE_SCRIPT}
</body>
</html>
HTML
}

# ---------- pages ----------

make_page "index.html" \
  "you are here: home" \
  "humbleangmoh" \
  '  <p>welcome. use the sidebar to navigate.</p>'

make_page "about/intro.html" \
  'you are here: <a href="/about/intro.html">about</a> &gt; intro' \
  "intro" \
  '  <p>A random professional (property development) working with AI tools.</p>'

make_page "about/contact.html" \
  'you are here: <a href="/about/intro.html">about</a> &gt; contact' \
  "contact" \
  '  <ul>
    <li>email — <a href="mailto:humbleangmoh@gmail.com">humbleangmoh@gmail.com</a></li>
    <li>github — <a href="https://github.com/humbleangmoh">humbleangmoh</a></li>
  </ul>'

make_page "projects/project-one.html" \
  'you are here: <a href="/projects/project-one.html">projects</a> &gt; project-one' \
  "project-one" \
  '  <p>short description of project one.</p>'

make_page "projects/project-two.html" \
  'you are here: <a href="/projects/project-one.html">projects</a> &gt; project-two' \
  "project-two" \
  '  <p>short description of project two.</p>'

make_page "projects/project-three.html" \
  'you are here: <a href="/projects/project-one.html">projects</a> &gt; project-three' \
  "project-three" \
  '  <p>short description of project three.</p>'

make_page "notes/pdf2image.html" \
  'you are here: <a href="/notes/pdf2image.html">notes</a> &gt; pdf2image' \
  "pdf2image" \
  '  <p><span class="date">2026-05-10</span></p>
  <p>I have had more success making useful tools when I just convert PDFs to images. Frontier LLMs are still not great at working directly with PDFs in my experience, and it also makes for a snappier experience if you create HTML artifacts.</p>'

echo "generated $(find . -name '*.html' -not -path './.git/*' | wc -l | tr -d ' ') pages"
