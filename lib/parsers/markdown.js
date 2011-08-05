(function() {
  var CSTParser, InstanceMethodWalker, MarkdownConverter, MarkdownParser, Nodes, helpers;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  CSTParser = require('../../lib/percolate_parser');
  helpers = require('../helpers');
  Nodes = require('../nodes');
  InstanceMethodWalker = require('../walkers/instance_method');
  MarkdownConverter = (function() {
    __extends(MarkdownConverter, InstanceMethodWalker);
    function MarkdownConverter() {
      this.base = new Nodes.BaseNode("Percolate Generated Documentation");
    }
    MarkdownConverter.prototype.traversesTextNodes = false;
    MarkdownConverter.prototype.convertHeading = function(level, text, node) {
      switch (level) {
        case 1:
          return this.base.title(text);
        case 2:
          this.document = this.base.document(text);
          delete this["function"];
          return delete this.test;
        case 3:
          if (!(this.document != null)) {
            node.error = "Can't describe a function without an object above for it to belong to! Use a ## or --- header before this node.";
            throw node.message();
          } else {
            return this["function"] = this.document["function"](text);
          }
          break;
        case 4:
          if (!(this["function"] != null)) {
            node.error = "Can't start a test case outside of a function description! Use a ### header to describe a function before this test.";
            throw node.message();
          } else {
            return this.test = this["function"].example(text);
          }
          break;
        default:
          throw "Unsupported heading level!";
      }
    };
    MarkdownConverter.prototype.enteredAtxHeading = function(node) {
      this.convertHeading(node.children[0].range.length, node.children[2], node);
      return true;
    };
    return MarkdownConverter;
  })();
  MarkdownParser = (function() {
    function MarkdownParser() {}
    MarkdownParser.getPercolateTree = function(markdownSource) {
      var CST, walker;
      CST = CSTParser.parse(markdownSource);
      walker = new MarkdownConverter;
      CST.traverse(walker);
      return walker.base;
    };
    return MarkdownParser;
  })();
  module.exports = MarkdownParser;
}).call(this);
