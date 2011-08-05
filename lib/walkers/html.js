(function() {
  var HtmlWalker, InstanceMethodWalker;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  }, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  InstanceMethodWalker = require('./instance_method');
  module.exports = HtmlWalker = (function() {
    var k, _fn, _i, _len, _ref;
    __extends(HtmlWalker, InstanceMethodWalker);
    HtmlWalker.getString = function(tree) {
      var walker;
      walker = new HtmlWalker;
      tree.traverse(walker);
      return walker.output();
    };
    function HtmlWalker() {
      this.buf = [];
    }
    _ref = ['entered', 'exited'];
    _fn = __bind(function(k) {
      return this.prototype["" + k + "Node"] = function(node) {
        var key;
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
    HtmlWalker.prototype.enteredStr = function(node) {
      this.buf.push(node.innerText());
      return false;
    };
    HtmlWalker.prototype.enteredEmph = function(node) {
      this.buf.push('<em>');
      return true;
    };
    HtmlWalker.prototype.exitedEmph = function(node) {
      this.buf.push('</em>');
      return true;
    };
    return HtmlWalker;
  }).call(this);
}).call(this);
