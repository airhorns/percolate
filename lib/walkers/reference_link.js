(function() {
  var ReferenceLinkTransformation;
  module.exports = ReferenceLinkTransformation = (function() {
    function ReferenceLinkTransformation() {}
    ReferenceLinkTransformation.prototype.walk = function(root) {
      var node, _i, _len, _ref;
      return;
      if (root.children != null) {
        _ref = root.children;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          node = _ref[_i];
          this.walk(node);
        }
        while (this.replace(root)) {
          true;
        }
      }
      return true;
    };
    ReferenceLinkTransformation.prototype.splice = function(node, start, count) {
      var multi;
      multi = new MultiConsoleNode(node.parent);
      multi.children = node.children.splice(start, count, multi);
      return multi;
    };
    ReferenceLinkTransformation.prototype.replace = function(root) {
      var count, index, node, start, _len, _ref;
      start = 0;
      count = 0;
      _ref = root.children;
      for (index = 0, _len = _ref.length; index < _len; index++) {
        node = _ref[index];
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
    return ReferenceLinkTransformation;
  })();
}).call(this);
