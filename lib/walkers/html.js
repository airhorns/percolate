(function() {
  var CSTParser, FunctionBodyParser, Highlight, HtmlWalker, InstanceMethodWalker, MultiConsoleTransformation, OutputTemplate, ReferenceLinkTransformation, ReferenceTransformWalker, TableOfContentsWalker, eco, fs, hljs, path, util;
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
  eco = require('eco');
  hljs = require('highlight.js');
  util = require('util');
  InstanceMethodWalker = require('./instance_method');
  TableOfContentsWalker = require('./table_of_contents');
  MultiConsoleTransformation = require('./multi_console');
  ReferenceLinkTransformation = require('./reference_link');
  FunctionBodyParser = require('../parsers/function_body');
  CSTParser = require('../../lib/parsers/percolate_parser');
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
  module.exports = HtmlWalker = (function() {
    var idSafe_rx, k, _fn, _fn2, _i, _j, _len, _len2, _ref, _ref2;
    __extends(HtmlWalker, InstanceMethodWalker);
    HtmlWalker.getString = function(tree) {
      var body, data, tableOfContents, walker;
      if (typeof tree === 'string') {
        return tree;
      }
      tableOfContents = TableOfContentsWalker.getTableOfContents(tree);
      (new ReferenceLinkTransformation).walk(tree);
      (new MultiConsoleTransformation).walk(tree);
      walker = new HtmlWalker(tableOfContents);
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
    function HtmlWalker(tableOfContents) {
      this.tableOfContents = tableOfContents;
      this.buf = [];
      this.inMulti = false;
    }
    _ref = ['entered', 'exited'];
    _fn = __bind(function(k) {
      return this.prototype["" + k + "Node"] = function(node) {
        var key;
        key = "" + k + node['name'];
        if (this[key] != null) {
          return this[key](node);
        } else {
          return true;
        }
      };
    }, HtmlWalker);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      k = _ref[_i];
      _fn(k);
    }
    HtmlWalker.prototype.output = function() {
      return this.buf.join('');
    };
    HtmlWalker.prototype.parseAndTraverse = function(nodeOrString) {
      var node;
      if (typeof nodeOrString === 'string') {
        node = CSTParser.parse(nodeOrString);
      } else {
        node = nodeOrString;
      }
      return node.traverse(this);
    };
    HtmlWalker.prototype.enteredBase = function(node) {
      this.buf.push("<h1 class=\"base\" id=\"" + (this.idSafe(node.identifier())) + "\">");
      this.parseAndTraverse(node.documentName);
      this.buf.push("</h1>");
      return true;
    };
    HtmlWalker.prototype.enteredDocumentation = function(node) {
      this.buf.push("<h2 class=\"object\" id=\"" + (this.idSafe(node.identifier())) + "\">");
      this.parseAndTraverse(node.objectName);
      this.buf.push("</h2>");
      return true;
    };
    HtmlWalker.prototype.enteredFunctionDocumentation = function(node) {
      this.buf.push("<h3 class=\"function\" id=\"" + (this.idSafe(node.identifier())) + "\">");
      this.parseAndTraverse(node.objectName);
      this.buf.push("</h3>");
      return true;
    };
    HtmlWalker.prototype.enteredTestCase = function(node) {
      this.buf.push("<h4>");
      this.parseAndTraverse(node.caseName);
      this.buf.push("</h4>");
      return true;
    };
    HtmlWalker.prototype.enteredExampleTestCase = function(node) {
      return this.enteredTestCase(node);
    };
    HtmlWalker.prototype.enteredMultiConsole = function(node) {
      this.enteredConsole(node);
      this.inMulti = true;
      return true;
    };
    HtmlWalker.prototype.exitedMultiConsole = function(node) {
      this.inMulti = false;
      return this.exitedConsole(node);
    };
    HtmlWalker.prototype.enteredConsole = function(node) {
      if (!this.inMulti) {
        this.buf.push("<pre><code>");
      }
      return true;
    };
    HtmlWalker.prototype.exitedConsole = function(node) {
      if (!this.inMulti) {
        return this.buf.push("</code></pre>");
      }
    };
    _ref2 = ['Assertion', 'Show'];
    _fn2 = __bind(function(k) {
      return this.prototype["entered" + k] = function(node) {
        this.enteredConsole(node);
        this.buf.push("js> " + (Highlight(FunctionBodyParser.parse(node.inputFunction))) + "\n" + (Highlight(util.inspect(node.outputValue()))) + "\n");
        this.exitedConsole(node);
        return false;
      };
    }, HtmlWalker);
    for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
      k = _ref2[_j];
      _fn2(k);
    }
    HtmlWalker.prototype.enteredPlain = function(node) {
      this.buf.push('<p>');
      return true;
    };
    HtmlWalker.prototype.exitedPlain = function(node) {
      return this.buf.push('</p>');
    };
    HtmlWalker.prototype.enteredEmph = function(node) {
      this.buf.push('<em>');
      return true;
    };
    HtmlWalker.prototype.exitedEmph = function(node) {
      return this.buf.push('</em>');
    };
    HtmlWalker.prototype.enteredStrong = function(node) {
      this.buf.push('<strong>');
      return true;
    };
    HtmlWalker.prototype.exitedStrong = function(node) {
      return this.buf.push('</strong>');
    };
    HtmlWalker.prototype.enteredCode = function(node) {
      this.buf.push('<code>');
      return true;
    };
    HtmlWalker.prototype.exitedCode = function(node) {
      return this.buf.push('</code>');
    };
    HtmlWalker.prototype.enteredStr = function(node) {
      this.buf.push(node.innerText());
      return false;
    };
    HtmlWalker.prototype.enteredNonSpaceChar = function(node) {
      this.buf.push(node.innerText());
      return false;
    };
    HtmlWalker.prototype.enteredSpace = function(node) {
      this.buf.push(' ');
      return false;
    };
    idSafe_rx = /[^\.\:a-zA-Z0-9_-]/g;
    HtmlWalker.prototype.idSafe = function(str) {
      return str.replace(idSafe_rx, '_');
    };
    HtmlWalker.prototype.wrapConsole = function(str) {
      return "" + str;
    };
    return HtmlWalker;
  }).call(this);
}).call(this);
