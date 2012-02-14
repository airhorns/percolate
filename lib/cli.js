(function() {
  var argv;
  argv = require('optimist').usage('Generate documentation for a file.\nUsage: $0').demand(1).argv;
  console.log(argv);
  console.log(argv._);
}).call(this);
