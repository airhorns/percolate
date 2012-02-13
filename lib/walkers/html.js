(function() {
  var CSTParser, HtmlWalker, InstanceMethodWalker, fs, path, util;
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
  InstanceMethodWalker = require('./instance_method');
  CSTParser = require('../../lib/parsers/percolate');
  module.exports = HtmlWalker = (function() {
    var k, level, nodeName, _fn, _fn2, _i, _len, _len2, _ref, _ref2;
    __extends(HtmlWalker, InstanceMethodWalker);
    HtmlWalker.getString = function(tree) {
      var walker;
      if (typeof tree === 'string') {
        return tree;
      }
      walker = new HtmlWalker();
      tree.traverse(walker);
      return walker.output();
    };
    function HtmlWalker() {
      this.buf = [];
      this.depth = 0;
    }
    HtmlWalker.prototype.escape = function(value) {
      return ('' + value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\x22/g, '&quot;');
    };
    HtmlWalker.prototype.enteredNode = function(node) {
      var i, key, s, _ref;
      key = "entered" + node['name'];
      this.depth++;
      s = [];
      for (i = 0, _ref = this.depth; 0 <= _ref ? i <= _ref : i >= _ref; 0 <= _ref ? i++ : i--) {
        s.push(' ');
      }
      s.push(key);
      if (this[key] != null) {
        return this[key](node);
      } else {
        return true;
      }
    };
    HtmlWalker.prototype.exitedNode = function(node) {
      var key;
      key = "exited" + node['name'];
      this.depth--;
      if (this[key] != null) {
        return this[key](node);
      }
    };
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
    _ref = {
      1: 'Base',
      2: 'Documentation',
      3: 'FunctionDocumentation',
      4: 'TestCase'
    };
    _fn = function(level, nodeName) {
      return this.prototype["entered" + nodeName] = function(node) {
        this.buf.push("<h" + level + ">");
        this.parseAndTraverse(node.documentName || node.objectName || node.caseName);
        this.buf.push("</h" + level + ">");
        return true;
      };
    };
    for (nodeName = 0, _len = _ref.length; nodeName < _len; nodeName++) {
      level = _ref[nodeName];
      _fn(level, nodeName);
    }
    HtmlWalker.prototype.enteredExampleTestCase = function(node) {
      return this.enteredTestCase(node);
    };
    HtmlWalker.prototype.enteredConsole = function(node) {
      this.buf.push("<pre><code>");
      return true;
    };
    HtmlWalker.prototype.exitedConsole = function(node) {
      return this.buf.push("</code></pre>");
    };
    _ref2 = ['Assertion', 'Show'];
    _fn2 = __bind(function(k) {
      return this.prototype["entered" + k] = function(node) {
        this.buf.push(node.innerText);
        return false;
      };
    }, HtmlWalker);
    for (_i = 0, _len2 = _ref2.length; _i < _len2; _i++) {
      k = _ref2[_i];
      _fn2(k);
    }
    HtmlWalker.prototype.enteredPara = function(node) {
      this.buf.push('<p>');
      this.renderEndLines = true;
      return true;
    };
    HtmlWalker.prototype.exitedPara = function(node) {
      this.renderEndLines = false;
      return this.buf.push('</p>\n\n');
    };
    HtmlWalker.prototype.enteredVerbatim = function(node) {
      this.buf.push('<pre><code>');
      this.renderBlankLines = true;
      return true;
    };
    HtmlWalker.prototype.exitedVerbatim = function(node) {
      this.renderBlankLines = false;
      return this.buf.push('</pre></code>\n\n');
    };
    HtmlWalker.prototype.enteredHorizontalRule = function(node) {
      this.buf.push('<hr />\n\n');
      return false;
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
    HtmlWalker.prototype.enteredSymbol = function(node) {
      this.buf.push(this.escape(node.innerText()));
      return false;
    };
    HtmlWalker.prototype.enteredExplicitLink = function(node) {
      var label, source, title;
      label = HtmlWalker.getString(node.children[0]);
      source = this.escape(HtmlWalker.getString(node.children[4]));
      title = HtmlWalker.getString(node.children[6]);
      this.buf.push("<a href=\"" + source + "\"");
      if (title.length > 0) {
        this.buf.push("title=\"" + title + "\"");
      }
      this.buf.push(">" + label + "</a>");
      return false;
    };
    HtmlWalker.prototype.enteredStr = function(node) {
      this.buf.push(node.innerText());
      return false;
    };
    HtmlWalker.prototype.enteredEntity = HtmlWalker.prototype.enteredStr;
    HtmlWalker.prototype.enteredEscapedChar = function(node) {
      this.buf.push(node.innerText().slice(1));
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
    HtmlWalker.prototype.enteredIndentedLine = function(node) {
      var indent;
      indent = node.children[0].innerText().length;
      this.buf.push(this.escape(node.innerText().slice(indent)));
      return false;
    };
    HtmlWalker.prototype.enteredBlankLine = function(node) {
      if (this.renderBlankLines) {
        this.buf.push(node.innerText());
      }
      return false;
    };
    HtmlWalker.prototype.enteredEndline = function(node) {
      if (this.renderEndLines) {
        this.buf.push(node.innerText());
      }
      return false;
    };
    HtmlWalker.prototype.enteredReference = function(node) {
      return false;
    };
    HtmlWalker.prototype.enteredPlain = function(node) {
      console.error("Error! Entered plain. Text: \n\n " + (node.innerText()) + "\n\n");
      return true;
    };
    return HtmlWalker;
  }).call(this);
}).call(this);
