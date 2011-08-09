(function() {
  var ConsoleNode, MultiConsoleNode, MultiConsoleTransformation, _ref;
  _ref = require('../nodes'), ConsoleNode = _ref.ConsoleNode, MultiConsoleNode = _ref.MultiConsoleNode;
  module.exports = MultiConsoleTransformation = (function() {
    function MultiConsoleTransformation() {}
    MultiConsoleTransformation.prototype.walk = function(root) {
      var node, _i, _len, _ref2;
      if (root.children != null) {
        _ref2 = root.children;
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          node = _ref2[_i];
          this.walk(node);
        }
        while (this.replace(root)) {
          true;
        }
      }
      return true;
    };
    MultiConsoleTransformation.prototype.splice = function(node, start, count) {
      var multi;
      multi = new MultiConsoleNode(node.parent);
      multi.children = node.children.splice(start, count, multi);
      return multi;
    };
    MultiConsoleTransformation.prototype.replace = function(root) {
      var count, index, node, start, _len, _ref2;
      start = 0;
      count = 0;
      _ref2 = root.children;
      for (index = 0, _len = _ref2.length; index < _len; index++) {
        node = _ref2[index];
        if (node instanceof ConsoleNode) {
          if (count === 0) {
            start = index;
          }
          count += 1;
        } else if (count === 1) {
          count = 0;
        } else if (count > 1) {
          break;
        }
      }
      if (count > 1) {
        this.splice(root, start, count);
        return true;
      } else {
        return false;
      }
    };
    return MultiConsoleTransformation;
  })();
}).call(this);
