(function() {
  var InstanceMethodWalker;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  module.exports = InstanceMethodWalker = (function() {
    var k, _fn, _i, _len, _ref;
    function InstanceMethodWalker() {}
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
    }, InstanceMethodWalker);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      k = _ref[_i];
      _fn(k);
    }
    return InstanceMethodWalker;
  }).call(this);
}).call(this);
