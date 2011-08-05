(function() {
  module.exports = {
    Walker: {},
    TestRunnerWalker: require('./walkers/test_runner'),
    HtmlWalker: require('./walkers/html')
  };
}).call(this);
