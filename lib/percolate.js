(function() {
  var Generator, TestFile, async, fs, hogan, path, qqunit;
  var __slice = Array.prototype.slice;

  qqunit = require('qqunit');

  async = require('async');

  hogan = require('hogan');

  fs = require('fs');

  path = require('path');

  TestFile = require('./test_file');

  Generator = (function() {

    Generator.prototype.sourceFiles = ['templates/index.html.mustache', 'templates/jquery.min.js', 'templates/modernizr.min.js', 'templates/style.css'];

    function Generator(files) {
      var file;
      if (!(files.length > 0)) {
        throw new Error("Percolate needs some files to generate with!");
      }
      this.files = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = files.length; _i < _len; _i++) {
          file = files[_i];
          _results.push(new TestFile(file));
        }
        return _results;
      })();
    }

    Generator.prototype.generate = function(callback) {
      var file;
      var _this = this;
      return async.parallel((function() {
        var _i, _len, _ref, _results;
        _ref = this.files;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          file = _ref[_i];
          _results.push(file.require);
        }
        return _results;
      }).call(this), function(err, results) {
        if (err) return callback(err);
        return qqunit.Runner.run([], function(stats) {
          return _this.render(function(err, output) {
            return callback(err, stats, output);
          });
        });
      });
    };

    Generator.prototype.render = function(callback) {
      var file, main, table_of_contents, templateFiles;
      var _this = this;
      templateFiles = this.sourceFiles.map(function(file) {
        return path.join(__dirname, '..', file);
      });
      main = ((function() {
        var _i, _len, _ref, _results;
        _ref = this.files;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          file = _ref[_i];
          _results.push(file.output());
        }
        return _results;
      }).call(this)).join('\n');
      table_of_contents = this.files.map(function(file) {
        return file.tableOfContents;
      }).reduce(function(a, b) {
        return a.merge(b);
      });
      return async.map(templateFiles, fs.readFile, function(err, results) {
        var css_source, jquery_source, modernizr_source, output, template, _ref;
        _ref = results.map(function(result) {
          return result.toString();
        }), template = _ref[0], jquery_source = _ref[1], modernizr_source = _ref[2], css_source = _ref[3];
        if (!err) {
          template = hogan.compile(template);
          output = template.render({
            main: main,
            table_of_contents: table_of_contents,
            jquery_source: jquery_source,
            modernizr_source: modernizr_source,
            css_source: css_source
          });
        }
        return callback(err, output);
      });
    };

    return Generator;

  })();

  module.exports = {
    Generator: Generator,
    generate: function() {
      var callback, files, _i;
      files = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), callback = arguments[_i++];
      return (new Generator(files)).generate(callback);
    }
  };

}).call(this);
