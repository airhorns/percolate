(function() {
  var CSTParser, CoffeeScript, InstanceMethodWalker, MarkdownConverter, MarkdownParser, Nodes, helpers;
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
  CoffeeScript = require('coffee-script');
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
          this["case"] = this.document = this.base.document(text);
          delete this["function"];
          return delete this.test;
        case 3:
          if (!(this.document != null)) {
            node.error = "Can't describe a function without an object above for it to belong to! Use a ## or --- header before this node.";
            throw node.message();
          } else {
            return this["case"] = this["function"] = this.document["function"](text);
          }
          break;
        case 4:
          if (!(this["function"] != null)) {
            node.error = "Can't start a test case outside of a function description! Use a ### header to describe a function before this test.";
            throw node.message();
          } else {
            return this["case"] = this.test = this["function"].example(text);
          }
      }
    };
    MarkdownConverter.prototype.enteredAtxHeading = function(node) {
      var textNode;
      textNode = new node.constructor('TextNode', node.source, node.range.location, node.range.length);
      textNode.children = node.children.slice(2, -1);
      this.convertHeading(node.children[0].range.length, textNode, node);
      return true;
    };
    MarkdownConverter.prototype.enteredVerbatim = function(node) {
      var coffeeScript, f, js;
      if (!(this["case"] != null)) {
        node.error = "Can't run code outside of a function or object description! Try adding a second or third level heading.";
        throw node.message();
      } else {
        coffeeScript = node.innerText();
        try {
          js = CoffeeScript.compile(coffeeScript, {
            bare: true
          });
          f = new Function(js);
          f.call(this["case"]);
        } catch (_e) {}
        return false;
      }
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
      console.error("Walker base is " + walker.base, "Name is: " + walker.base.name);
      return walker.base;
    };
    return MarkdownParser;
  })();
  module.exports = MarkdownParser;
}).call(this);
