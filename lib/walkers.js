(function() {
  module.exports = {
    Walker: {},
    TestRunnerWalker: require('./walkers/test_runner'),
    HtmlWalker: require('./walkers/html'),
    PercolateHtmlWalker: require('./walkers/percolate_html'),
    TableOfContentsWalker: require('./walkers/table_of_contents'),
    MultiConsoleTransformation: require('./walkers/multi_console'),
    ReferenceLinkTransformation: require('./walkers/reference_link')
  };
}).call(this);
