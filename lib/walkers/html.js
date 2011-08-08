(function() {
  var HtmlWalker, InstanceMethodWalker, ReferenceTransformWalker, TableOfContentsWalker;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  }, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  InstanceMethodWalker = require('./instance_method');
  TableOfContentsWalker = require('./table_of_contents');
  ReferenceTransformWalker = (function() {
    __extends(ReferenceTransformWalker, InstanceMethodWalker);
    function ReferenceTransformWalker(tableOfContents) {
      this.tableOfContents = tableOfContents;
    }
    return ReferenceTransformWalker;
  })();
  module.exports = HtmlWalker = (function() {
    var idSafe_rx, k, _fn, _i, _len, _ref;
    __extends(HtmlWalker, InstanceMethodWalker);
    HtmlWalker.getString = function(tree) {
      var tableOfContents, walker;
      if (typeof tree === 'string') {
        return tree;
      }
      tableOfContents = TableOfContentsWalker.getTableOfContents(tree);
      walker = new HtmlWalker(tableOfContents);
      tree.traverse(walker);
      return walker.output();
    };
    function HtmlWalker(tableOfContents) {
      this.tableOfContents = tableOfContents;
      this.buf = [];
    }
    _ref = ['entered', 'exited'];
    _fn = __bind(function(k) {
      return this.prototype["" + k + "Node"] = function(node) {
        var key;
        console.error("Node Name: " + node.name);
        if (!(node.name != null)) {
          console.error("Nameless node!: ");
          console.error(node);
          process.exit(1);
        }
        key = "" + k + node.name;
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
    HtmlWalker.prototype.enteredBase = function(node) {
      this.buf.push("<h1 class=\"base\">");
      node.documentName.traverse(this);
      this.buf.push("</h1>");
      return true;
    };
    HtmlWalker.prototype.enteredDocumentation = function(node) {
      this.buf.push("<h2 class=\"object\">");
      node.objectName.traverse(this);
      this.buf.push("</h2>");
      return true;
    };
    HtmlWalker.prototype.enteredFunctionDocumentation = function(node) {
      this.buf.push("<h3 class=\"function\" id=\"" + (this.idSafe(node.identifier())) + "\">");
      node.objectName.traverse(this);
      this.buf.push("</h3>");
      return true;
    };
    HtmlWalker.prototype.enteredTestCase = function(node) {
      this.buf.push("<h4>");
      node.caseName.traverse(this);
      this.buf.push("</h4>");
      return true;
    };
    HtmlWalker.prototype.enteredEmph = function(node) {
      this.buf.push('<em>');
      return true;
    };
    HtmlWalker.prototype.exitedEmph = function(node) {
      this.buf.push('</em>');
      return true;
    };
    HtmlWalker.prototype.enteredStrong = function(node) {
      this.buf.push('<strong>');
      return true;
    };
    HtmlWalker.prototype.exitedStrong = function(node) {
      this.buf.push('</strong>');
      return true;
    };
    HtmlWalker.prototype.enteredCode = function(node) {
      this.buf.push('<code>');
      return true;
    };
    HtmlWalker.prototype.exitedCode = function(node) {
      this.buf.push('</code>');
      return true;
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
    return HtmlWalker;
  }).call(this);
}).call(this);
