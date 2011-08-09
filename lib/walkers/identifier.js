(function() {
  var IdentifierWalker, InstanceMethodWalker;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  InstanceMethodWalker = require('./instance_method');
  module.exports = IdentifierWalker = (function() {
    __extends(IdentifierWalker, InstanceMethodWalker);
    IdentifierWalker.getIdentifier = function(tree) {
      var walker;
      walker = new IdentifierWalker;
      tree.traverse(walker);
      return walker.output();
    };
    function IdentifierWalker() {
      this.buf = [];
    }
    IdentifierWalker.prototype.enteredStr = function(node) {
      this.buf.push(node.innerText());
      return false;
    };
    IdentifierWalker.prototype.enteredNonSpaceChar = function(node) {
      this.buf.push(node.innerText());
      return false;
    };
    IdentifierWalker.prototype.enteredSpace = function(node) {
      this.buf.push(' ');
      return false;
    };
    IdentifierWalker.prototype.output = function() {
      return this.buf.join('');
    };
    return IdentifierWalker;
  })();
}).call(this);
