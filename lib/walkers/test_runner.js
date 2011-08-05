(function() {
  var TestRunnerWalker;
  TestRunnerWalker = (function() {
    function TestRunnerWalker() {}
    TestRunnerWalker.prototype.enteredNode = function(node) {
      if (node.success != null) {
        return node.success();
      } else {
        return true;
      }
    };
    return TestRunnerWalker;
  })();
}).call(this);
