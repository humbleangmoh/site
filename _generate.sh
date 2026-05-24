#!/usr/bin/env bash
# Regenerates all site pages from shared templates.
# Run: bash _generate.sh
# Edit PROJECTS below to add/remove project pages; rerun to regenerate.

set -euo pipefail
cd "$(dirname "$0")"

# ---------- ordered list of projects ----------
# slug : display name
# Plain project pages — `<slug>:<display name>`. Each generates a stub
# `projects/<slug>.html` from the template below and appears in the homepage list.
PROJECTS=()

# Subfolder projects (interactive apps). Generator only adds the link to the
# homepage list and the sidebar of stub pages — it does NOT touch the contents
# of `projects/<slug>/`. Each subfolder is hand-maintained.
SUBFOLDER_PROJECTS=(
  "whatsapp:10 years of whatsapp messages"
)

THEME_INIT='<script>
    (function () {
      var saved = localStorage.getItem("theme");
      if (saved === "dark" || saved === "light") {
        document.documentElement.dataset.theme = saved;
      }
    })();
  </script>'

# Build the homepage projects <ul>. Subfolder projects come first.
home_projects_ul() {
  local prefix="$1"  # path prefix from current page to root (always "" for index)
  echo '  <ul class="projects">'
  for entry in "${SUBFOLDER_PROJECTS[@]}"; do
    local slug="${entry%%:*}"
    local name="${entry##*:}"
    echo "    <li><a href=\"${prefix}projects/${slug}/\">${name}</a></li>"
  done
  for entry in "${PROJECTS[@]+"${PROJECTS[@]}"}"; do
    local slug="${entry%%:*}"
    local name="${entry##*:}"
    echo "    <li><a href=\"${prefix}projects/${slug}.html\">${name}</a></li>"
  done
  echo '  </ul>'
}

# Build the sidebar project <ul>, marking the active slug. Subfolder projects
# appear first (same order as the homepage list).
sidebar_projects_ul() {
  local prefix="$1"
  local active_slug="$2"
  echo '      <ul>'
  for entry in "${SUBFOLDER_PROJECTS[@]}"; do
    local slug="${entry%%:*}"
    local name="${entry##*:}"
    echo "        <li><a href=\"${prefix}projects/${slug}/\">${name}</a></li>"
  done
  for entry in "${PROJECTS[@]+"${PROJECTS[@]}"}"; do
    local slug="${entry%%:*}"
    local name="${entry##*:}"
    if [[ "$slug" == "$active_slug" ]]; then
      echo "        <li><a class=\"active\" href=\"${prefix}projects/${slug}.html\">${name}</a></li>"
    else
      echo "        <li><a href=\"${prefix}projects/${slug}.html\">${name}</a></li>"
    fi
  done
  echo '      </ul>'
}

# Compute "../" prefix from depth so file:// previews work too.
path_prefix() {
  local file="$1"
  local depth=$(awk -F/ '{print NF-1}' <<< "$file")
  local prefix=""
  local i
  for ((i=0; i<depth; i++)); do prefix="${prefix}../"; done
  printf "%s" "$prefix"
}

make_home() {
  local file="index.html"
  local prefix=""
  local projects_block
  projects_block=$(home_projects_ul "$prefix")
  cat > "$file" <<HTML
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>projects</title>
  ${THEME_INIT}
  <link rel="stylesheet" href="${prefix}reset.css">
  <link rel="stylesheet" href="${prefix}monospace.css">
  <link rel="stylesheet" href="${prefix}styles.css">
</head>
<body>
<main>
  <h1>projects</h1>
${projects_block}
  <div class="contact">
    <a href="mailto:humbleangmoh@gmail.com">email</a>
    <button id="theme-toggle" type="button" aria-label="Toggle theme">◐</button>
  </div>
</main>
<script src="${prefix}theme.js"></script>
</body>
</html>
HTML
}

make_project() {
  local slug="$1"
  local title="$2"
  local file="projects/${slug}.html"
  local prefix
  prefix=$(path_prefix "$file")
  local nav_block
  nav_block=$(sidebar_projects_ul "$prefix" "$slug")
  mkdir -p "$(dirname "$file")"
  cat > "$file" <<HTML
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  ${THEME_INIT}
  <link rel="stylesheet" href="${prefix}reset.css">
  <link rel="stylesheet" href="${prefix}monospace.css">
  <link rel="stylesheet" href="${prefix}styles.css">
</head>
<body class="has-sidebar">
<aside>
  <nav>
    <div class="section">
      <div class="section-label"><a href="${prefix}index.html">projects</a></div>
${nav_block}
    </div>
  </nav>
  <div class="contact">
    <a href="mailto:humbleangmoh@gmail.com">email</a>
    <button id="theme-toggle" type="button" aria-label="Toggle theme">◐</button>
  </div>
</aside>
<main>
  <h1>${title}</h1>
</main>
<script src="${prefix}theme.js"></script>
</body>
</html>
HTML
}

# ---------- generate ----------

make_home

for entry in "${PROJECTS[@]+"${PROJECTS[@]}"}"; do
  slug="${entry%%:*}"
  name="${entry##*:}"
  make_project "$slug" "$name"
done

count=$(find . -name '*.html' -not -path './.git/*' -not -name 'PROJECT.html' | wc -l | tr -d ' ')
echo "generated ${count} pages"
