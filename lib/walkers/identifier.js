(function() {
  var IdentifierWalker;
  module.exports = IdentifierWalker = (function() {
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
