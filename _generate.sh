#!/usr/bin/env bash
# Regenerates all site pages from one shared sidebar template.
# Run: bash _generate.sh
# Edit the SIDEBAR and the make_page calls below to add/remove pages.

set -euo pipefail
cd "$(dirname "$0")"

SIDEBAR='<aside>
  <div class="name"><a href="/index.html">humbleangmoh</a></div>

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
        <li><a href="/notes/its-happening.html">260510 it'\''s happening</a></li>
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
    try {
      if (new URL(a.href).pathname === location.pathname) a.classList.add("active");
    } catch (e) {}
  });
</script>'

make_page() {
  local file="$1"
  local breadcrumb="$2"
  local title="$3"
  local content="$4"

  # Compute relative-path prefix from directory depth so file:// previews work.
  # /index.html  -> "" (depth 0)
  # /notes/x.html -> "../" (depth 1)
  local depth=$(awk -F/ '{print NF-1}' <<< "$file")
  local prefix=""
  local i
  for ((i=0; i<depth; i++)); do prefix="${prefix}../"; done

  # Rewrite absolute hrefs (href="/...") to relative for both sidebar and breadcrumb.
  local sidebar_rel="${SIDEBAR//href=\"\//href=\"${prefix}}"
  local breadcrumb_rel="${breadcrumb//href=\"\//href=\"${prefix}}"

  mkdir -p "$(dirname "$file")"
  cat > "$file" <<HTML
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — humbleangmoh</title>
  <link rel="stylesheet" href="${prefix}styles.css">
</head>
<body>
${sidebar_rel}
<main>
  <div class="breadcrumb">${breadcrumb_rel}</div>
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
    <li>twitter — <a href="https://x.com/humbleangmoh">humbleangmoh</a></li>
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

make_page "notes/its-happening.html" \
  "you are here: <a href=\"/notes/its-happening.html\">notes</a> &gt; 260510 it's happening" \
  "it's happening" \
  "  <p><span class=\"date\">2026-05-10</span></p>

  <p>4 years ago I wrote this on a forum thread about AI automation:</p>

  <blockquote>
    <p>I work in AEC (Architecture, Engineering, Construction). The vast majority of people in the industry are barely aware of recent advances in AI. But should they actually be worried about their job prospects over the next decade? I get the sense that this crowd would say \"Yes!\".</p>
    <p>I can only speak from my own experience, but I find it genuinely hard to picture. If nothing else, because anything you try to do in meatspace takes forever. There are plenty of solid 'digital' tools that have existed for 10+ years and still haven't gained any traction in the industry. I know AGI is different, but it's worth mentioning how slow things change, and how much of a grinding bureaucracy most companies are.</p>
  </blockquote>

  <p>In the last 6 months AI has gone from, to me, having fringe usefulness, to something that actually makes me more productive at work. I can officially say 'it's happening' - and not just for software engineers.</p>

  <p>I work in project management of real-estate development projects, and I think AI tools have arrived as a genuine disruptive force. The disruption hasn't happened yet - but it's coming.</p>

  <p>This site is for me to post and share some of my own noodling around with these tools, as a random worker whose daily tasks cover a lot of what the economy 'is'.</p>

  <p>Please <a href=\"mailto:humbleangmoh@gmail.com\">email</a> or <a href=\"https://x.com/humbleangmoh\">tweet</a> to get in touch</p>"

echo "generated $(find . -name '*.html' -not -path './.git/*' | wc -l | tr -d ' ') pages"
