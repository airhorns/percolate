#!/usr/bin/env node

(function() {
  var argv, docs, fs, path, percolate,
    __slice = [].slice;

  path = require('path');

  fs = require('fs');

  percolate = require('./percolate');

  argv = require('optimist').usage('Generate documentation for a file.\nUsage: $0').demand(1)["default"]('filename', 'documentation.html').describe('filename', 'The filename to write the output to.').argv;

  docs = argv._.map(function(doc) {
    return path.resolve(process.cwd(), doc);
  });

  console.log("Running doc suite.");

  percolate.generate.apply(percolate, [process.cwd()].concat(__slice.call(docs), [function(error, stats, output) {
    var outputPath;
    if (error) {
      throw error;
    }
    if (!(stats.failed > 0)) {
      outputPath = path.join(process.cwd(), argv.filename);
      fs.writeFileSync(outputPath, output);
      console.log("Docs written to " + outputPath + ".");
    }
    return process.exit(stats.failed);
  }]));

}).call(this);
