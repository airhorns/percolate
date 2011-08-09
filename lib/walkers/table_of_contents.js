(function() {
  var InstanceMethodWalker, TableOfContentsWalker;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  InstanceMethodWalker = require('./instance_method');
  module.exports = TableOfContentsWalker = (function() {
    __extends(TableOfContentsWalker, InstanceMethodWalker);
    TableOfContentsWalker.getTableOfContents = function(tree) {
      var walker;
      walker = new TableOfContentsWalker;
      tree.traverse(walker);
      return walker.tableOfContents();
    };
    function TableOfContentsWalker() {
      this.toc = {};
    }
    TableOfContentsWalker.prototype.tableOfContents = function() {
      return this.toc;
    };
    TableOfContentsWalker.prototype.enteredFunctionDocumentation = function(node) {
      var parentKeys, _base, _name;
      parentKeys = (_base = this.toc)[_name = node.parentName()] || (_base[_name] = []);
      parentKeys.push({
        anchor: node.identifier(),
        name: node.callSignature()
      });
      return false;
    };
    return TableOfContentsWalker;
  })();
}).call(this);
