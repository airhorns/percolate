(function() {
  var block, escape, inline, mangle, marked, next, outputLink, parse, parseText, tag, tok, token, tokens;

  tag = function() {
    var aTag;
    aTag = "(?!(?:" + "a|em|strong|small|s|cite|q|dfn|abbr|data|time|code" + "|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo" + "|span|br|wbr|ins|del|img)\\b)\\w+";
    return aTag;
  };

  block = {
    newline: /^\n+/,
    code: /^ {4,}[^\n]*(?:\n {4,}[^\n]*|\n)*(?:\n+|$)/,
    gfm_code: /^ *``` *(\w+)? *\n([^\0]+?)\s*``` *(?:\n+|$)/,
    percolate_code: /^ *!!! *(\w+)? *\n([^\0]+?)\s*!!! *(?:\n+|$)/,
    hr: /^( *[\-*_]){3,} *(?:\n+|$)/,
    heading: /^ *(#{1,6}) *([^\n]+?) *#* *(?:\n+|$)/,
    lheading: /^ *((?:=|-){1,6}) *([^\n]+?) *(?:=|-)* *(?:\n+|$)/,
    blockquote: /^( *>[^\n]+(\n[^\n]+)*\n*)+/,
    list: /^( *)([*+-]|\d+\.) [^\0]+?(?:\n{2,}(?! )|\s*$)(?!\1bullet)\n*/,
    html: /^ *(?:comment|closed|closing) *(?:\n{2,}|\s*$)/,
    def: /^ *\[([^\]]+)\]: *([^\s]+)(?: +["(]([^\n]+)[")])? *(?:\n+|$)/,
    paragraph: /^([^\n]+\n?(?!body))+\n*/,
    text: /^[^\n]+/
  };

  block.list = (function() {
    var list;
    list = block.list.source;
    list = list.replace("bullet", /(?:[*+-](?!(?: *[-*]){2,})|\d+\.)/.source);
    return new RegExp(list);
  })();

  block.html = (function() {
    var html;
    html = block.html.source;
    html = html.replace("comment", /<!--[^\0]*?-->/.source).replace("closed", /<(tag)[^\0]+?<\/\1>/.source).replace("closing", /<tag(?!:\/|@)\b(?:"[^"]*"|'[^']*'|[^'">])*?>/.source).replace(/tag/g, tag());
    return new RegExp(html);
  })();

  block.paragraph = (function() {
    var body, paragraph, push;
    paragraph = block.paragraph.source;
    body = [];
    (push = function(rule) {
      rule = (block[rule] ? block[rule].source : rule);
      body.push(rule.replace(/(^|[^\[])\^/g, "$1"));
      return push;
    })("gfm_code")("hr")("heading")("lheading")("blockquote")("<" + tag())("def");
    return new RegExp(paragraph.replace("body", body.join("|")));
  })();

  block.lexer = function(src) {
    var tokens;
    tokens = [];
    tokens.links = {};
    src = src.replace(/\r\n|\r/g, "\n").replace(/\t/g, "    ");
    return block.token(src, tokens, true);
  };

  block.token = function(src, tokens, top) {
    var cap, i, item, l, loose, next, space;
    src = src.replace(/^ +$/g, "");
    next = void 0;
    loose = void 0;
    cap = void 0;
    item = void 0;
    space = void 0;
    i = void 0;
    l = void 0;
    while (src) {
      if (cap = block.newline.exec(src)) {
        src = src.substring(cap[0].length);
        tokens.push({
          type: cap[0].length > 1 ? "space" : void 0
        });
      }
      if (cap = block.code.exec(src)) {
        src = src.substring(cap[0].length);
        cap = cap[0].replace(/^ {4}/g, "");
        tokens.push({
          type: "code",
          text: cap.replace(/\n+$/, "")
        });
        continue;
      }
      if (cap = block.percolate_code.exec(src)) {
        src = src.substring(cap[0].length);
        tokens.push({
          type: "percolate_code",
          lang: cap[1],
          text: cap[2]
        });
        continue;
      }
      if (cap = block.gfm_code.exec(src)) {
        src = src.substring(cap[0].length);
        tokens.push({
          type: "code",
          lang: cap[1],
          text: cap[2]
        });
        continue;
      }
      if (cap = block.heading.exec(src)) {
        src = src.substring(cap[0].length);
        tokens.push({
          type: "heading",
          depth: cap[1].length,
          text: cap[2],
          searchable: true
        });
        continue;
      }
      if (cap = block.lheading.exec(src)) {
        src = src.substring(cap[0].length);
        tokens.push({
          type: "heading",
          depth: cap[1].length,
          text: cap[2],
          searchable: false
        });
        continue;
      }
      if (cap = block.hr.exec(src)) {
        src = src.substring(cap[0].length);
        tokens.push({
          type: "hr"
        });
        continue;
      }
      if (cap = block.blockquote.exec(src)) {
        src = src.substring(cap[0].length);
        tokens.push({
          type: "blockquote_start"
        });
        cap = cap[0].replace(/^ *> ?/g, "");
        block.token(cap, tokens, top);
        tokens.push({
          type: "blockquote_end"
        });
        continue;
      }
      if (cap = block.list.exec(src)) {
        src = src.substring(cap[0].length);
        tokens.push({
          type: "list_start",
          ordered: isFinite(cap[2])
        });
        cap = cap[0].match(/^( *)([*+-]|\d+\.)[^\n]*(?:\n(?!\1(?:[*+-]|\d+\.))[^\n]*)*/g);
        next = false;
        l = cap.length;
        i = 0;
        while (i < l) {
          item = cap[i];
          space = item.length;
          item = item.replace(/^ *([*+-]|\d+\.) */, "");
          if (~item.indexOf("\n ")) {
            space -= item.length;
            item = item.replace(new RegExp("^ {1," + space + "}", "gm"), "");
          }
          loose = next || /\n\n(?!\s*$)/.test(item);
          if (i !== l - 1) {
            next = item[item.length - 1] === "\n";
            if (!loose) loose = next;
          }
          tokens.push({
            type: (loose ? "loose_item_start" : "list_item_start")
          });
          block.token(item, tokens);
          tokens.push({
            type: "list_item_end"
          });
          i++;
        }
        tokens.push({
          type: "list_end"
        });
        continue;
      }
      if (cap = block.html.exec(src)) {
        src = src.substring(cap[0].length);
        tokens.push({
          type: "html",
          text: cap[0]
        });
        continue;
      }
      if (top && (cap = block.def.exec(src))) {
        src = src.substring(cap[0].length);
        tokens.links[cap[1].toLowerCase()] = {
          href: cap[2],
          title: cap[3]
        };
        continue;
      }
      if (top && (cap = block.paragraph.exec(src))) {
        src = src.substring(cap[0].length);
        tokens.push({
          type: "paragraph",
          text: cap[0]
        });
        continue;
      }
      if (cap = block.text.exec(src)) {
        src = src.substring(cap[0].length);
        tokens.push({
          type: "text",
          text: cap[0]
        });
        continue;
      }
    }
    return tokens;
  };

  inline = {
    escape: /^\\([\\`*{}\[\]()#+\-.!_>])/,
    autolink: /^<([^ >]+(@|:\/)[^ >]+)>/,
    gfm_autolink: /^(\w+:\/\/[^\s]+[^.,:;"')\]\s])/,
    tag: /^<!--[^\0]*?-->|^<\/?\w+(?:"[^"]*"|'[^']*'|[^'">])*?>/,
    link: /^!?\[((?:\[[^\]]*\]|[^\[\]]|\[|\](?=[^[\]]*\]))*)\]\(([^\)]*)\)/,
    reflink: /^!?\[((?:\[[^\]]*\]|[^\[\]]|\[|\](?=[^[\]]*\]))*)\]\s*\[([^\]]*)\]/,
    nolink: /^!?\[((?:\[[^\]]*\]|[^\[\]])*)\]/,
    strong: /^__([^\0]+?)__(?!_)|^\*\*([^\0]+?)\*\*(?!\*)/,
    em: /^\b_([^\0]+?)_\b|^\*((?:\*\*|[^\0])+?)\*(?!\*)/,
    code: /^(`+)([^\0]*?[^`])\1(?!`)/,
    br: /^ {2,}\n(?!\s*$)/,
    text: /^[^\0]+?(?=[\\<!\[_*`]|\w+:\/\/| {2,}\n|$)/,
    onCode: function(x) {
      return x;
    }
  };

  inline.lexer = function(src) {
    var cap, href, link, links, out, text;
    out = "";
    links = tokens.links;
    link = void 0;
    text = void 0;
    href = void 0;
    cap = void 0;
    while (src) {
      if (cap = inline.escape.exec(src)) {
        src = src.substring(cap[0].length);
        out += cap[1];
        continue;
      }
      if (cap = inline.autolink.exec(src)) {
        src = src.substring(cap[0].length);
        if (cap[2] === "@") {
          text = (cap[1][6] === ":" ? mangle(cap[1].substring(7)) : mangle(cap[1]));
          href = mangle("mailto:") + text;
        } else {
          text = escape(cap[1]);
          href = text;
        }
        out += "<a href=\"" + href + "\">" + text + "</a>";
        continue;
      }
      if (cap = inline.gfm_autolink.exec(src)) {
        src = src.substring(cap[0].length);
        text = escape(cap[1]);
        href = text;
        out += "<a href=\"" + href + "\">" + text + "</a>";
        continue;
      }
      if (cap = inline.tag.exec(src)) {
        src = src.substring(cap[0].length);
        out += cap[0];
        continue;
      }
      if (cap = inline.link.exec(src)) {
        src = src.substring(cap[0].length);
        text = /^\s*<?([^\s]*?)>?(?:\s+"([^\n]+)")?\s*$/.exec(cap[2]);
        if (!text) {
          out += cap[0][0];
          src = cap[0].substring(1) + src;
          continue;
        }
        out += outputLink(cap, {
          href: text[1],
          title: text[2]
        });
        continue;
      }
      if ((cap = inline.reflink.exec(src)) || (cap = inline.nolink.exec(src))) {
        src = src.substring(cap[0].length);
        link = (cap[2] || cap[1]).replace(/\s+/g, " ");
        link = links[link.toLowerCase()];
        if (!link || !link.href) {
          out += cap[0][0];
          src = cap[0].substring(1) + src;
          continue;
        }
        out += outputLink(cap, link);
        continue;
      }
      if (cap = inline.strong.exec(src)) {
        src = src.substring(cap[0].length);
        out += "<strong>" + inline.lexer(cap[2] || cap[1]) + "</strong>";
        continue;
      }
      if (cap = inline.em.exec(src)) {
        src = src.substring(cap[0].length);
        out += "<em>" + inline.lexer(cap[2] || cap[1]) + "</em>";
        continue;
      }
      if (cap = inline.code.exec(src)) {
        src = src.substring(cap[0].length);
        out += "<code>" + inline.onCode(escape(cap[2], true)) + "</code>";
        continue;
      }
      if (cap = inline.br.exec(src)) {
        src = src.substring(cap[0].length);
        out += "<br>";
        continue;
      }
      if (cap = inline.text.exec(src)) {
        src = src.substring(cap[0].length);
        out += escape(cap[0]);
        continue;
      }
    }
    return out;
  };

  outputLink = function(cap, link) {
    if (cap[0][0] !== "!") {
      return "<a href=\"" + escape(link.href) + "\"" + (link.title ? " title=\"" + escape(link.title) + "\"" : "") + ">" + inline.lexer(cap[1]) + "</a>";
    } else {
      return "<img src=\"" + escape(link.href) + "\" alt=\"" + escape(cap[1]) + "\"" + (link.title ? " title=\"" + escape(link.title) + "\"" : "") + ">";
    }
  };

  tokens = void 0;

  token = void 0;

  next = function() {
    return token = tokens.pop();
  };

  tok = function() {
    var body, type;
    switch (token.type) {
      case "space":
        return "";
      case "hr":
        return "<hr>\n";
      case "heading":
        return "<h" + token.depth + (token.id ? " id=\"" + token.id + "\"" : "") + ">" + inline.lexer(token.text) + "</h" + token.depth + ">\n";
      case "code":
        return "<pre><code" + (token.lang ? " class=\"" + token.lang + "\"" : "") + ">" + (token.escaped ? token.text : escape(token.text, true)) + "</code></pre>\n";
      case "percolate_code":
        return token.text;
      case "blockquote_start":
        body = "";
        while (next().type !== "blockquote_end") {
          body += tok();
        }
        return "<blockquote>\n" + body + "</blockquote>\n";
      case "list_start":
        type = (token.ordered ? "ol" : "ul");
        body = "";
        while (next().type !== "list_end") {
          body += tok();
        }
        return "<" + type + ">\n" + body + "</" + type + ">\n";
      case "list_item_start":
        body = "";
        while (next().type !== "list_item_end") {
          body += (token.type === "text" ? parseText() : tok());
        }
        return "<li>" + body + "</li>\n";
      case "loose_item_start":
        body = "";
        while (next().type !== "list_item_end") {
          body += tok();
        }
        return "<li>" + body + "</li>\n";
      case "html":
        return inline.lexer(token.text);
      case "paragraph":
        return "<p>" + inline.lexer(token.text) + "</p>\n";
      case "text":
        return "<p>" + parseText() + "</p>\n";
    }
  };

  parseText = function() {
    var body, top;
    body = token.text;
    top = void 0;
    while ((top = tokens[tokens.length - 1]) && top.type === "text") {
      body += "\n" + next().text;
    }
    return inline.lexer(body);
  };

  parse = function(src) {
    var out;
    tokens = src.reverse();
    out = "";
    while (next()) {
      out += tok();
    }
    tokens = null;
    token = null;
    return out;
  };

  escape = function(html, encode) {
    return html.replace((!encode ? /&(?!#?\w+;)/g : /&/g), "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  };

  mangle = function(text) {
    var ch, i, l, out;
    out = "";
    l = text.length;
    i = 0;
    ch = void 0;
    while (i < l) {
      ch = text.charCodeAt(i);
      if (Math.random() > 0.5) ch = "x" + ch.toString(16);
      out += "&#" + ch + ";";
      i++;
    }
    return out;
  };

  marked = function(src) {
    return parse(block.lexer(src));
  };

  marked.inline = inline;

  marked.parser = parse;

  marked.lexer = block.lexer;

  marked.parse = marked;

  module.exports = marked;

}).call(this);
