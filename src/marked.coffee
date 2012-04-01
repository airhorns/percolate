tag = ->
  atag = "(?!(?:" + "a|em|strong|small|s|cite|q|dfn|abbr|data|time|code" + "|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo" + "|span|br|wbr|ins|del|img)\\b)\\w+"
  atag
replace = (regex) ->
  regex = regex.source
  self = (name, val) ->
    return new RegExp(regex)  unless name
    regex = regex.replace(name, val.source or val)
    self
noop = ->
block =
  newline: /^\n+/
  code: /^( {4}[^\n]+\n*)+/
  fences: noop
  percolate_code: /^ *!!! *(\w+)? *\n([^\0]+?)\s*!!! *(?:\n+|$)/
  hr: /^( *[\-*_]){3,} *(?:\n+|$)/
  heading: /^ *(#{1,6}) *([^\n]+?) *#* *(?:\n+|$)/
  lheading: /^ *((?:=|-){1,6}) *([^\n]+?) *(?:=|-)* *(?:\n+|$)/
  blockquote: /^( *>[^\n]+(\n[^\n]+)*\n*)+/
  list: /^( *)([*+-]|\d+\.) [^\0]+?(?:\n{2,}(?! )(?!\1bullet)\n*|\s*$)/
  html: /^ *(?:comment|closed|closing) *(?:\n{2,}|\s*$)/
  def: /^ *\[([^\]]+)\]: *([^\s]+)(?: +["(]([^\n]+)[")])? *(?:\n+|$)/
  paragraph: /^([^\n]+\n?(?!body))+\n*/
  text: /^[^\n]+/

block.list = replace(block.list)("bullet", /(?:[*+-](?!(?: *[-*]){2,})|\d+\.)/)()
block.html = replace(block.html)("comment", /<!--[^\0]*?-->/)("closed", /<(tag)[^\0]+?<\/\1>/)("closing", /<tag(?!:\/|@)\b(?:"[^"]*"|'[^']*'|[^'">])*?>/)(/tag/g, tag())()
block.paragraph = (->
  paragraph = block.paragraph.source
  body = []
  push = (rule) ->
    rule = (if block[rule] then block[rule].source else rule)
    body.push rule.replace(/(^|[^\[])\^/g, "$1")
    push
  push("hr")("heading")("lheading")("blockquote")("<" + tag())("def")
  new RegExp(paragraph.replace("body", body.join("|")))
)()

block.normal =
  fences: block.fences
  paragraph: block.paragraph

block.gfm =
  fences: /^ *``` *(\w+)? *\n([^\0]+?)\s*``` *(?:\n+|$)/
  paragraph: /^/

block.gfm.paragraph = replace(block.paragraph)("(?!", "(?!" + block.gfm.fences.source.replace(/(^|[^\[])\^/g, "$1") + "|")()
block.lexer = (src) ->
  tokens = []
  tokens.links = {}
  src = src.replace(/\r\n|\r/g, "\n").replace(/\t/g, "    ")
  block.token src, tokens, true

block.token = (src, tokens, top) ->
  src = src.replace(/^ +$/gm, "")
  next = undefined
  loose = undefined
  cap = undefined
  item = undefined
  space = undefined
  i = undefined
  l = undefined
  while src
    if cap = block.newline.exec(src)
      src = src.substring(cap[0].length)
      tokens.push type: "space"  if cap[0].length > 1

    if cap = block.percolate_code.exec(src)
      src = src.substring(cap[0].length)
      tokens.push
        type: "percolate_code"
        lang: cap[1]
        text: cap[2]
      continue

    if cap = block.code.exec(src)
      src = src.substring(cap[0].length)
      cap = cap[0].replace(/^ {4}/gm, "")
      tokens.push
        type: "code"
        text: (if not options.pedantic then cap.replace(/\n+$/, "") else cap)

      continue
    if cap = block.fences.exec(src)
      src = src.substring(cap[0].length)
      tokens.push
        type: "code"
        lang: cap[1]
        text: cap[2]

      continue
    if cap = block.heading.exec(src)
      src = src.substring(cap[0].length)
      tokens.push
        type: "heading"
        depth: cap[1].length
        text: cap[2]
        searchable: true

      continue
    if cap = block.lheading.exec(src)
      src = src.substring(cap[0].length)
      tokens.push
        type: "heading"
        depth: cap[1].length
        text: cap[2]
        searchable: false

      continue
    if cap = block.hr.exec(src)
      src = src.substring(cap[0].length)
      tokens.push type: "hr"
      continue
    if cap = block.blockquote.exec(src)
      src = src.substring(cap[0].length)
      tokens.push type: "blockquote_start"
      cap = cap[0].replace(/^ *> ?/gm, "")
      block.token cap, tokens, top
      tokens.push type: "blockquote_end"
      continue
    if cap = block.list.exec(src)
      src = src.substring(cap[0].length)
      tokens.push
        type: "list_start"
        ordered: isFinite(cap[2])
      cap = cap[0].match(/^( *)([*+-]|\d+\.) [^\n]*(?:\n(?!\1(?:[*+-]|\d+\.) )[^\n]*)*/gm)
      next = false
      l = cap.length
      i = 0
      while i < l
        item = cap[i]
        space = item.length
        item = item.replace(/^ *([*+-]|\d+\.) +/, "")
        if ~item.indexOf("\n ")
          space -= item.length
          item = (if not options.pedantic then item.replace(new RegExp("^ {1," + space + "}", "gm"), "") else item.replace(/^ {1,4}/gm, ""))
        loose = next or /\n\n(?!\s*$)/.test(item)
        if i isnt l - 1
          next = item[item.length - 1] is "\n"
          loose = next  unless loose
        tokens.push type: (if loose then "loose_item_start" else "list_item_start")
        block.token item, tokens
        tokens.push type: "list_item_end"
        i++
      tokens.push type: "list_end"
      continue
    if cap = block.html.exec(src)
      src = src.substring(cap[0].length)
      tokens.push
        type: "html"
        pre: cap[1] is "pre"
        text: cap[0]

      continue
    if top and (cap = block.def.exec(src))
      src = src.substring(cap[0].length)
      tokens.links[cap[1].toLowerCase()] =
        href: cap[2]
        title: cap[3]

      continue
    if top and (cap = block.paragraph.exec(src))
      src = src.substring(cap[0].length)
      tokens.push
        type: "paragraph"
        text: cap[0]

      continue
    if cap = block.text.exec(src)
      src = src.substring(cap[0].length)
      tokens.push
        type: "text"
        text: cap[0]

      continue
  tokens

inline =
  escape: /^\\([\\`*{}\[\]()#+\-.!_>])/
  autolink: /^<([^ >]+(@|:\/)[^ >]+)>/
  url: noop
  tag: /^<!--[^\0]*?-->|^<\/?\w+(?:"[^"]*"|'[^']*'|[^'">])*?>/
  link: /^!?\[(inside)\]\(href\)/
  reflink: /^!?\[(inside)\]\s*\[([^\]]*)\]/
  nolink: /^!?\[((?:\[[^\]]*\]|[^\[\]])*)\]/
  strong: /^__([^\0]+?)__(?!_)|^\*\*([^\0]+?)\*\*(?!\*)/
  em: /^\b_((?:__|[^\0])+?)_\b|^\*((?:\*\*|[^\0])+?)\*(?!\*)/
  code: /^(`+)([^\0]*?[^`])\1(?!`)/
  br: /^ {2,}\n(?!\s*$)/
  text: /^[^\0]+?(?=[\\<!\[_*`]| {2,}\n|$)/
  onCode: (x) -> x

inline._linkInside = /(?:\[[^\]]*\]|[^\]]|\](?=[^\[]*\]))*/
inline._linkHref = /\s*<?([^\s]*?)>?(?:\s+['"]([^\0]*?)['"])?\s*/
inline.link = replace(inline.link)("inside", inline._linkInside)("href", inline._linkHref)()
inline.reflink = replace(inline.reflink)("inside", inline._linkInside)()
inline.normal =
  url: inline.url
  strong: inline.strong
  em: inline.em
  text: inline.text

inline.pedantic =
  strong: /^__(?=\S)([^\0]*?\S)__(?!_)|^\*\*(?=\S)([^\0]*?\S)\*\*(?!\*)/
  em: /^_(?=\S)([^\0]*?\S)_(?!_)|^\*(?=\S)([^\0]*?\S)\*(?!\*)/

inline.gfm =
  url: /^(https?:\/\/[^\s]+[^.,:;"')\]\s])/
  text: /^[^\0]+?(?=[\\<!\[_*`]|https?:\/\/| {2,}\n|$)/

inline.lexer = (src) ->
  out = ""
  links = tokens.links
  link = undefined
  text = undefined
  href = undefined
  cap = undefined
  while src
    if cap = inline.escape.exec(src)
      src = src.substring(cap[0].length)
      out += cap[1]
      continue
    if cap = inline.autolink.exec(src)
      src = src.substring(cap[0].length)
      if cap[2] is "@"
        text = (if cap[1][6] is ":" then mangle(cap[1].substring(7)) else mangle(cap[1]))
        href = mangle("mailto:") + text
      else
        text = escape(cap[1])
        href = text
      out += "<a href=\"" + href + "\">" + text + "</a>"
      continue
    if cap = inline.url.exec(src)
      src = src.substring(cap[0].length)
      text = escape(cap[1])
      href = text
      out += "<a href=\"" + href + "\">" + text + "</a>"
      continue
    if cap = inline.tag.exec(src)
      src = src.substring(cap[0].length)
      out += (if options.sanitize then escape(cap[0]) else cap[0])
      continue
    if cap = inline.link.exec(src)
      src = src.substring(cap[0].length)
      out += outputLink(cap,
        href: cap[2]
        title: cap[3]
      )
      continue
    if (cap = inline.reflink.exec(src)) or (cap = inline.nolink.exec(src))
      src = src.substring(cap[0].length)
      link = (cap[2] or cap[1]).replace(/\s+/g, " ")
      link = links[link.toLowerCase()]
      if not link or not link.href
        out += cap[0][0]
        src = cap[0].substring(1) + src
        continue
      out += outputLink(cap, link)
      continue
    if cap = inline.strong.exec(src)
      src = src.substring(cap[0].length)
      out += "<strong>" + inline.lexer(cap[2] or cap[1]) + "</strong>"
      continue
    if cap = inline.em.exec(src)
      src = src.substring(cap[0].length)
      out += "<em>" + inline.lexer(cap[2] or cap[1]) + "</em>"
      continue
    if cap = inline.code.exec(src)
      src = src.substring(cap[0].length)
      out += "<code>" + inline.onCode(escape(cap[2], true)) + "</code>"
      continue
    if cap = inline.br.exec(src)
      src = src.substring(cap[0].length)
      out += "<br>"
      continue
    if cap = inline.text.exec(src)
      src = src.substring(cap[0].length)
      out += escape(cap[0])
      continue
  out

outputLink = (cap, link) ->
  if cap[0][0] isnt "!"
    "<a href=\"" + escape(link.href) + "\"" + (if link.title then " title=\"" + escape(link.title) + "\"" else "") + ">" + inline.lexer(cap[1]) + "</a>"
  else
    "<img src=\"" + escape(link.href) + "\" alt=\"" + escape(cap[1]) + "\"" + (if link.title then " title=\"" + escape(link.title) + "\"" else "") + ">"

tokens = undefined
token = undefined
next = ->
  token = tokens.pop()

tok = ->
  switch token.type
    when "space"
      ""
    when "hr"
      "<hr>\n"
    when "heading"
      "<h" + token.depth + (if token.id then " id=\"#{token.id}\"" else "") + ">" + inline.lexer(token.text) + "</h" + token.depth + ">\n"
    when "percolate_code"
      token.text
    when "code"
      "<pre><code" + (if token.lang then " class=\"" + token.lang + "\"" else "") + ">" + (if token.escaped then token.text else escape(token.text, true)) + "</code></pre>\n"
    when "blockquote_start"
      body = ""
      body += tok()  while next().type isnt "blockquote_end"
      "<blockquote>\n" + body + "</blockquote>\n"
    when "list_start"
      type = (if token.ordered then "ol" else "ul")
      body = ""
      body += tok()  while next().type isnt "list_end"
      "<" + type + ">\n" + body + "</" + type + ">\n"
    when "list_item_start"
      body = ""
      body += (if token.type is "text" then parseText() else tok())  while next().type isnt "list_item_end"
      "<li>" + body + "</li>\n"
    when "loose_item_start"
      body = ""
      body += tok()  while next().type isnt "list_item_end"
      "<li>" + body + "</li>\n"
    when "html"
      return inline.lexer(token.text)  if options.sanitize
      (if not token.pre and not options.pedantic then inline.lexer(token.text) else token.text)
    when "paragraph"
      "<p>" + inline.lexer(token.text) + "</p>\n"
    when "text"
      "<p>" + parseText() + "</p>\n"

parseText = ->
  body = token.text
  top = undefined
  body += "\n" + next().text  while (top = tokens[tokens.length - 1]) and top.type is "text"
  inline.lexer body

parse = (src) ->
  tokens = src.reverse()
  out = ""
  out += tok()  while next()
  tokens = null
  token = null
  out

escape = (html, encode) ->
  html.replace((if not encode then /&(?!#?\w+;)/g else /&/g), "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace /'/g, "&#39;"

mangle = (text) ->
  out = ""
  l = text.length
  i = 0
  ch = undefined
  while i < l
    ch = text.charCodeAt(i)
    ch = "x" + ch.toString(16)  if Math.random() > 0.5
    out += "&#" + ch + ";"
    i++
  out

noop.exec = noop
marked = (src, opt) ->
  setOptions opt
  parse block.lexer(src)

options = undefined
defaults = undefined
setOptions = (opt) ->
  opt = defaults  unless opt
  return  if options is opt
  options = opt
  if options.gfm
    block.fences = block.gfm.fences
    block.paragraph = block.gfm.paragraph
    inline.text = inline.gfm.text
    inline.url = inline.gfm.url
  else
    block.fences = block.normal.fences
    block.paragraph = block.normal.paragraph
    inline.text = inline.normal.text
    inline.url = inline.normal.url
  if options.pedantic
    inline.em = inline.pedantic.em
    inline.strong = inline.pedantic.strong
  else
    inline.em = inline.normal.em
    inline.strong = inline.normal.strong

marked.inline = inline

marked.options = marked.setOptions = (opt) ->
  defaults = opt
  setOptions opt

marked.options
  gfm: true
  pedantic: false
  sanitize: false

marked.parser = (src, opt) ->
  setOptions opt
  parse src

marked.lexer = (src, opt) ->
  setOptions opt
  block.lexer src

marked.parse = marked
if typeof module isnt "undefined"
  module.exports = marked
else
  @marked = marked
