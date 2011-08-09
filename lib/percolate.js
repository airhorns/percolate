(function() {
  var Percolate, fs, helpers, nodes, parsers, path, walkers;
  fs = require('fs');
  path = require('path');
  helpers = require('./helpers');
  walkers = require('./walkers');
  parsers = require('./parsers');
  nodes = require('./nodes');
  Percolate = {
    compile: function(source, type) {
      var parser, percolateTree;
      if (type == null) {
        type = 'markdown';
      }
      parser = (function() {
        switch (type) {
          case 'markdown':
          case 'percolate':
            return parsers.MarkdownParser;
          case 'coffee':
            return parsers.CoffeeScriptParser;
          default:
            throw "Unsupported input type " + type + "! Supported types are: markdown, percolate, coffeescript.";
        }
      })();
      percolateTree = parser.getPercolateTree(source);
      return walkers.HtmlWalker.getString(percolateTree);
    },
    compileFromFile: function(sourceFileName) {
      var source;
      source = fs.readFileSync(sourceFileName).toString();
      return this.compile(source, path.extname(sourceFileName).slice(1));
    },
    compileInPlace: function(sourceFileName) {
      var output, outputFileName;
      output = this.compileFromFile(sourceFileName);
      (outputFileName = sourceFileName.split('.')).pop();
      outputFileName.push('html');
      outputFileName = outputFileName.join('.');
      return fs.writeFileSync(outputFileName, output);
    }
  };
  module.exports = helpers.extend(Percolate, helpers, walkers, parsers, nodes);
}).call(this);
