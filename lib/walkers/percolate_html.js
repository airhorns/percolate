(function() {
  var FunctionBodyParser, Highlight, HtmlWalker, InstanceMethodWalker, MultiConsoleTransformation, OutputTemplate, PercolateHtmlWalker, ReferenceLinkTransformation, ReferenceTransformWalker, TableOfContentsWalker, eco, fs, hljs, path, util;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  }, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  fs = require('fs');
  path = require('path');
  util = require('util');
  eco = require('eco');
  hljs = require('highlight.js');
  TableOfContentsWalker = require('./table_of_contents');
  InstanceMethodWalker = require('./instance_method');
  HtmlWalker = require('./html');
  MultiConsoleTransformation = require('./multi_console');
  ReferenceLinkTransformation = require('./reference_link');
  FunctionBodyParser = require('../parsers/function_body');
  OutputTemplate = (function() {
    var template;
    template = void 0;
    return function() {
      if (template == null) {
        template = fs.readFileSync(path.join(__dirname, '..', '..', 'templates', 'index.html.eco')).toString();
      }
      return template;
    };
  })();
  ReferenceTransformWalker = (function() {
    __extends(ReferenceTransformWalker, InstanceMethodWalker);
    function ReferenceTransformWalker(tableOfContents) {
      this.tableOfContents = tableOfContents;
    }
    return ReferenceTransformWalker;
  })();
  Highlight = function(str) {
    return hljs.highlight('javascript', str).value;
  };
  module.exports = PercolateHtmlWalker = (function() {
    var idSafe_rx, k, _fn, _i, _len, _ref;
    __extends(PercolateHtmlWalker, HtmlWalker);
    function PercolateHtmlWalker() {
      PercolateHtmlWalker.__super__.constructor.apply(this, arguments);
    }
    PercolateHtmlWalker.getString = function(tree) {
      var body, data, tableOfContents, walker;
      if (typeof tree === 'string') {
        return tree;
      }
      tableOfContents = TableOfContentsWalker.getTableOfContents(tree);
      (new ReferenceLinkTransformation).walk(tree);
      (new MultiConsoleTransformation).walk(tree);
      walker = new PercolateHtmlWalker(tableOfContents);
      tree.traverse(walker);
      body = walker.output();
      if (tree.name === 'Base') {
        console.error(tableOfContents);
        data = {
          title: tree.identifier(),
          body: body,
          tableOfContents: tableOfContents
        };
        return eco.render(OutputTemplate(), data);
      } else {
        return body;
      }
    };
    PercolateHtmlWalker.prototype.parseAndTraverse = function(nodeOrString) {
      var node;
      if (typeof nodeOrString === 'string') {
        node = CSTParser.parse(nodeOrString);
      } else {
        node = nodeOrString;
      }
      return node.traverse(this);
    };
    PercolateHtmlWalker.prototype.enteredBase = function(node) {
      this.buf.push("<h1 class=\"base\" id=\"" + (this.idSafe(node.identifier())) + "\">");
      this.parseAndTraverse(node.documentName);
      this.buf.push("</h1>");
      return true;
    };
    PercolateHtmlWalker.prototype.enteredDocumentation = function(node) {
      this.buf.push("<h2 class=\"object\" id=\"" + (this.idSafe(node.identifier())) + "\">");
      this.parseAndTraverse(node.objectName);
      this.buf.push("</h2>");
      return true;
    };
    PercolateHtmlWalker.prototype.enteredFunctionDocumentation = function(node) {
      this.buf.push("<h3 class=\"function\" id=\"" + (this.idSafe(node.identifier())) + "\">");
      this.parseAndTraverse(node.objectName);
      this.buf.push("</h3>");
      return true;
    };
    PercolateHtmlWalker.prototype.enteredTestCase = function(node) {
      this.buf.push("<h4>");
      this.parseAndTraverse(node.caseName);
      this.buf.push("</h4>");
      return true;
    };
    PercolateHtmlWalker.prototype.enteredExampleTestCase = function(node) {
      return this.enteredTestCase(node);
    };
    PercolateHtmlWalker.prototype.enteredMultiConsole = function(node) {
      this.enteredConsole(node);
      this.inMulti = true;
      return true;
    };
    PercolateHtmlWalker.prototype.exitedMultiConsole = function(node) {
      this.inMulti = false;
      return this.exitedConsole(node);
    };
    PercolateHtmlWalker.prototype.enteredConsole = function(node) {
      if (!this.inMulti) {
        this.buf.push("<pre><code>");
      }
      return true;
    };
    PercolateHtmlWalker.prototype.exitedConsole = function(node) {
      if (!this.inMulti) {
        return this.buf.push("</code></pre>");
      }
    };
    _ref = ['Assertion', 'Show'];
    _fn = __bind(function(k) {
      return this.prototype["entered" + k] = function(node) {
        this.enteredConsole(node);
        this.buf.push("js> " + (Highlight(FunctionBodyParser.parse(node.inputFunction))) + "\n" + (Highlight(util.inspect(node.outputValue()))) + "\n");
        this.exitedConsole(node);
        return false;
      };
    }, PercolateHtmlWalker);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      k = _ref[_i];
      _fn(k);
    }
    PercolateHtmlWalker.prototype.enteredVerbatim = function(node) {
      var coffeeScript, f, js;
      if (!(this["case"] != null)) {
        console.error("here");
        node.error = "Can't run code outside of a function or object description! Try adding a second or third level heading.";
        throw new Error(node.message());
      } else {
        coffeeScript = node.innerText();
        try {
          js = CoffeeScript.compile(coffeeScript, {
            bare: true
          });
        } catch (compileError) {
          throw compileError;
        }
        try {
          js = "var __f = function() {\n  try {\n  \n" + js + "\n  } catch (executionError) {\n    console.error(\"Execution error!\");\n    throw executionError;\n  }\n}; __f;";
          f = eval(js);
          f.call(this["case"]);
        } catch (setupError) {
          node.error = "Exception raised while running code block.";
          console.error(node.message());
          console.error("Compiled source:");
          console.error(js);
          throw setupError;
        }
      }
      return false;
    };
    PercolateHtmlWalker.prototype.enteredPlain = function(node) {
      this.buf.push('<p>');
      return true;
    };
    PercolateHtmlWalker.prototype.exitedPlain = function(node) {
      return this.buf.push('</p>');
    };
    PercolateHtmlWalker.prototype.enteredEmph = function(node) {
      this.buf.push('<em>');
      return true;
    };
    PercolateHtmlWalker.prototype.exitedEmph = function(node) {
      return this.buf.push('</em>');
    };
    PercolateHtmlWalker.prototype.enteredStrong = function(node) {
      this.buf.push('<strong>');
      return true;
    };
    PercolateHtmlWalker.prototype.exitedStrong = function(node) {
      return this.buf.push('</strong>');
    };
    PercolateHtmlWalker.prototype.enteredCode = function(node) {
      this.buf.push('<code>');
      return true;
    };
    PercolateHtmlWalker.prototype.exitedCode = function(node) {
      return this.buf.push('</code>');
    };
    PercolateHtmlWalker.prototype.enteredStr = function(node) {
      this.buf.push(node.innerText());
      return false;
    };
    PercolateHtmlWalker.prototype.enteredNonSpaceChar = function(node) {
      this.buf.push(node.innerText());
      return false;
    };
    PercolateHtmlWalker.prototype.enteredSpace = function(node) {
      this.buf.push(' ');
      return false;
    };
    idSafe_rx = /[^\.\:a-zA-Z0-9_-]/g;
    PercolateHtmlWalker.prototype.idSafe = function(str) {
      return str.replace(idSafe_rx, '_');
    };
    PercolateHtmlWalker.prototype.wrapConsole = function(str) {
      return "" + str;
    };
    return PercolateHtmlWalker;
  }).call(this);
}).call(this);
