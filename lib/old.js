(function() {
  var Document, HTMLOutputWalker, MarkdownOutputWalker, MultiConsoleTransformation, TransformingWalker;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  MultiConsoleTransformation = (function() {
    __extends(MultiConsoleTransformation, Walker);
    function MultiConsoleTransformation() {
      MultiConsoleTransformation.__super__.constructor.apply(this, arguments);
    }
    MultiConsoleTransformation.prototype.walk = function(root) {
      var node, _i, _len, _ref;
      if (root.children != null) {
        _ref = root.children;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          node = _ref[_i];
          this.walk(node);
        }
        while (this.replace(root)) {
          true;
        }
      }
      return true;
    };
    MultiConsoleTransformation.prototype.splice = function(node, start, count) {
      var multi;
      multi = new MultiConsoleNode(node.parent);
      multi.children = node.children.splice(start, count, multi);
      return multi;
    };
    MultiConsoleTransformation.prototype.replace = function(root) {
      var count, index, node, start, _len, _ref;
      start = 0;
      count = 0;
      _ref = root.children;
      for (index = 0, _len = _ref.length; index < _len; index++) {
        node = _ref[index];
        if (node instanceof ConsoleNode) {
          if (count === 0) {
            start = index;
          }
          count += 1;
        } else if (count === 1) {
          count = 0;
        } else if (count > 1) {
          break;
        }
      }
      if (count > 1) {
        this.splice(root, start, count);
        return true;
      } else {
        return false;
      }
    };
    return MultiConsoleTransformation;
  })();
  TransformingWalker = (function() {
    __extends(TransformingWalker, Walker);
    function TransformingWalker() {
      this.transformed = false;
      TransformingWalker.__super__.constructor.apply(this, arguments);
    }
    TransformingWalker.prototype.walk = function(root, first) {
      var transform, _i, _len, _ref;
      if (!this.transformed) {
        _ref = this.transformations;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          transform = _ref[_i];
          transform.walk(root);
        }
        this.transformed = true;
      }
      return TransformingWalker.__super__.walk.apply(this, arguments);
    };
    return TransformingWalker;
  })();
  MarkdownOutputWalker = (function() {
    var return_val_rx, whitespace_rx;
    __extends(MarkdownOutputWalker, TransformingWalker);
    function MarkdownOutputWalker() {
      MarkdownOutputWalker.__super__.constructor.apply(this, arguments);
    }
    return_val_rx = /function \((?:.*)\) \{(?:.*)\s*return (.*);\s*\}/m;
    whitespace_rx = /\s+/g;
    MarkdownOutputWalker.prototype.transformations = [new MultiConsoleTransformation];
    MarkdownOutputWalker.prototype.visit = function(node) {
      var current, renderer;
      if (node.rendered) {
        return true;
      } else {
        current = node;
        while (true) {
          renderer = "render" + current.constructor.name;
          if (this[renderer] != null) {
            break;
          } else {
            current = node.constructor.__super__;
            if (!(current != null)) {
              throw new Error("Unrecognized Percolate node " + node.constructor.name + "!");
            }
          }
        }
        this.output.push(this[renderer](node));
        return true;
      }
    };
    MarkdownOutputWalker.prototype.renderTextNode = function(node) {
      return "\n " + node.text + " \n\n";
    };
    MarkdownOutputWalker.prototype.renderBaseNode = function(node) {
      return "# " + node.name + " \n";
    };
    MarkdownOutputWalker.prototype.renderDocumentationNode = function(node) {
      return "## " + node.name + " \n";
    };
    MarkdownOutputWalker.prototype.renderFunctionDocumentationNode = function(node) {
      return "### " + node.name + " \n";
    };
    MarkdownOutputWalker.prototype.renderTestCaseNode = function(node) {
      return "#### " + node.name + " \n";
    };
    MarkdownOutputWalker.prototype.renderExampleTestCaseNode = function(node) {
      return "#### " + node.name + " \n";
    };
    MarkdownOutputWalker.prototype.renderConsoleNode = function(node) {
      return " \n" + (this.renderConsole(node)) + "\n";
    };
    MarkdownOutputWalker.prototype.renderMultiConsoleNode = function(multi) {
      var node, out;
      out = (function() {
        var _i, _len, _ref, _results;
        _ref = multi.children;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          node = _ref[_i];
          node.rendered = true;
          _results.push(this.renderConsole(node));
        }
        return _results;
      }).call(this);
      return "\n" + (out.join('')) + "\n";
    };
    MarkdownOutputWalker.prototype.renderReferenceNode = function(node) {
      return "\n*see " + (node.identifier()) + "*\n\n";
    };
    MarkdownOutputWalker.prototype.renderFunction = function(f) {
      var matches, text;
      text = f.toString().replace(whitespace_rx, ' ').trim();
      matches = return_val_rx.exec(text);
      return matches[1];
    };
    MarkdownOutputWalker.prototype.renderAssertionConsole = function(node) {
      return "    js> " + (Highlight(this.renderFunction(node.actualFunction))) + "\n    " + (Highlight(node.actualValue())) + "\n";
    };
    MarkdownOutputWalker.prototype.render = function(node) {
      this.output = [];
      this.walk(node);
      return this.output.join('');
    };
    return MarkdownOutputWalker;
  })();
  HTMLOutputWalker = (function() {
    var OutputTemplate, idSafe_rx;
    __extends(HTMLOutputWalker, MarkdownOutputWalker);
    OutputTemplate = fs.readFileSync(path.join(__dirname, '..', 'templates', 'index.html.eco')).toString();
    function HTMLOutputWalker() {
      this.objects = {};
      HTMLOutputWalker.__super__.constructor.apply(this, arguments);
    }
    HTMLOutputWalker.prototype.visit = function(node) {
      var keys, _base, _name;
      switch (node.constructor.name) {
        case 'FunctionDocumentationNode':
          keys = ((_base = this.objects)[_name = node.parentName()] || (_base[_name] = []));
          keys.push({
            anchor: this.idSafe(node.identifier()),
            name: node.callSignature()
          });
      }
      return HTMLOutputWalker.__super__.visit.apply(this, arguments);
    };
    HTMLOutputWalker.prototype.renderBaseNode = function(node) {
      return this.wrapHTML("<h1 class=\"base\">" + node.name + "</h1>");
    };
    HTMLOutputWalker.prototype.renderDocumentationNode = function(node) {
      return this.wrapHTML("<h2 class=\"object\">" + node.name + "</h2>");
    };
    HTMLOutputWalker.prototype.renderFunctionDocumentationNode = function(node) {
      return this.wrapHTML("<h3 class=\"function\" id=" + (this.idSafe(node.identifier())) + ">" + (node.callSignature()) + "</h3>");
    };
    HTMLOutputWalker.prototype.renderReferenceNode = function(node) {
      return "\nsee <a href=\"#" + (this.idSafe(node.identifier())) + "\">" + (node.identifier()) + "</a>";
    };
    HTMLOutputWalker.prototype.renderConsoleNode = function(node) {
      return this.wrapConsole(this.renderConsole(node));
    };
    HTMLOutputWalker.prototype.renderMultiConsoleNode = function(multi) {
      var node, out;
      out = (function() {
        var _i, _len, _ref, _results;
        _ref = multi.children;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          node = _ref[_i];
          node.rendered = true;
          _results.push(this.renderConsole(node));
        }
        return _results;
      }).call(this);
      return this.wrapConsole(out.join(''));
    };
    HTMLOutputWalker.prototype.renderConsole = function(node) {
      return "js> " + (Highlight(this.renderFunction(node.inputFunction))) + "\n" + (Highlight(util.inspect(node.outputValue()))) + "\n";
    };
    HTMLOutputWalker.prototype.wrapConsole = function(str) {
      return this.wrapHTML("<pre><code>" + str + "</code></pre>");
    };
    HTMLOutputWalker.prototype.wrapHTML = function(str) {
      return "\n" + str + "\n";
    };
    idSafe_rx = /[^\.\:a-zA-Z0-9_-]/g;
    HTMLOutputWalker.prototype.idSafe = function(str) {
      return str.replace(idSafe_rx, '_');
    };
    HTMLOutputWalker.prototype.render = function(node) {
      var data, markdownishOutput;
      markdownishOutput = HTMLOutputWalker.__super__.render.apply(this, arguments);
      data = {
        title: node.name,
        body: ghm.parse(markdownishOutput),
        tableOfContents: this.objects
      };
      return eco.render(OutputTemplate, data);
    };
    HTMLOutputWalker.prototype.renderToFile = function(test, filename) {
      return fs.writeFileSync(filename, this.render(test));
    };
    return HTMLOutputWalker;
  })();
  Document = function(name, filename, block) {
    var markdownRenderer, node;
    if (!(block != null)) {
      block = filename;
    }
    node = new BaseNode(name, block);
    markdownRenderer = new HTMLOutputWalker;
    if (filename != null) {
      markdownRenderer.renderToFile(node, filename);
    } else {
      console.log(markdownRenderer.render(node));
    }
    return true;
  };
}).call(this);
