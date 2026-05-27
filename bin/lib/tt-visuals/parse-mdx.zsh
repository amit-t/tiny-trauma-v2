#!/usr/bin/env zsh
# bin/lib/tt-visuals/parse-mdx.zsh — extract frontmatter fields and visual
# markers from one mdx file. Sourced, not executed.

[[ -n "${_TT_PARSE_MDX_SOURCED:-}" ]] && return 0
typeset -g _TT_PARSE_MDX_SOURCED=1

# Usage: tt_parse_frontmatter_field <mdx-path> <field-name>
# Prints the raw value (empty string if absent). Strips surrounding quotes.
tt_parse_frontmatter_field() {
  local mdx_path="$1" field="$2"
  [[ -f "$mdx_path" ]] || return 0
  awk -v f="$field" '
    /^---[[:space:]]*$/ { fm = (fm == 0 ? 1 : 2); next }
    fm == 1 {
      line = $0
      pos = index(line, ":")
      if (pos == 0) next
      key = substr(line, 1, pos - 1)
      gsub(/[[:space:]]+$/, "", key)
      if (key != f) next
      val = substr(line, pos + 1)
      gsub(/^[[:space:]]+|[[:space:]]+$/, "", val)
      gsub(/^"|"$/, "", val)
      gsub(/^'\''|'\''$/, "", val)
      print val
      exit
    }
  ' "$mdx_path"
}

# Usage: tt_parse_markers <mdx-path>
# Prints one line per marker found in the body, in source order, in form:
#   hero:empty
#   hero:override:<text>
#   hero-mp4:empty
#   hero-mp4:override:<text>
#   inline:empty
#   inline:override:<text>
#   gif:empty
#   gif:override:<text>
#   skip
tt_parse_markers() {
  local mdx_path="$1"
  [[ -f "$mdx_path" ]] || return 0
  awk '
    BEGIN { fm = 0 }
    /^---[[:space:]]*$/ { fm = (fm == 0 ? 1 : 2); next }
    fm < 2 { next }
    {
      line = $0
      while (match(line, /\[\[visual[^]]*\]\]/) > 0) {
        tok = substr(line, RSTART + 2, RLENGTH - 4)
        line = substr(line, RSTART + RLENGTH)
        # tok like:  visual:   visual: text   visual gif: text   visual hero mp4: text   visual skip
        body = substr(tok, 7)                    # strip leading "visual"
        sub(/^[[:space:]]+/, "", body)

        if (body == "skip") { print "skip"; continue }

        # split on first ":"
        cpos = index(body, ":")
        if (cpos == 0) continue
        head = substr(body, 1, cpos - 1)
        text = substr(body, cpos + 1)
        sub(/^[[:space:]]+/, "", text)
        sub(/[[:space:]]+$/, "", head)

        if (head == "")            kind = "inline"
        else if (head == "gif")    kind = "gif"
        else if (head == "hero")   kind = "hero"
        else if (head == "hero mp4") kind = "hero-mp4"
        else continue

        if (text == "") printf "%s:empty\n", kind
        else            printf "%s:override:%s\n", kind, text
      }
    }
  ' "$mdx_path"
}
