(function() {
  var Percolate, fs, helpers, nodes, parsers, path, walkers;
  fs = require('fs');
  path = require('path');
  helpers = require('./helpers');
  walkers = require('./walkers');
  parsers = require('./parsers');
  nodes = require('./nodes');
  Percolate = {
    compile: function(source, inputType, outputType) {
      var parser, percolateTree, walker;
      if (inputType == null) {
        inputType = 'markdown';
      }
      if (outputType == null) {
        outputType = 'percolate';
      }
      parser = (function() {
        switch (inputType) {
          case 'markdown':
          case 'percolate':
          case 'text':
            return parsers.MarkdownParser;
          case 'coffee':
            return parsers.CoffeeScriptParser;
          default:
            throw new Error("Unsupported input type " + type + "! Supported types are: markdown, percolate, coffeescript.");
        }
      })();
      walker = (function() {
        switch (outputType) {
          case 'percolate':
            return walkers.PercolateHtmlWalker;
          case 'html':
            return walkers.HtmlWalker;
          default:
            throw new Error("Unsupported output type " + type + "! Supported types are: percolate, html.");
        }
      })();
      percolateTree = parser.getPercolateTree(source);
      return walker.getString(percolateTree);
    },
    compileFromFile: function(sourceFileName, inputType, outputType) {
      var source;
      if (inputType == null) {
        inputType = null;
      }
      if (outputType == null) {
        outputType = 'percolate';
      }
      source = fs.readFileSync(sourceFileName).toString();
      return this.compile(source, inputType || path.extname(sourceFileName).slice(1), outputType);
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
