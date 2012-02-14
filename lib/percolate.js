(function() {
  var Generator, TestFile, async, eco, qqunit;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __slice = Array.prototype.slice;
  qqunit = require('qqunit');
  async = require('async');
  eco = require('eco');
  TestFile = require('./test_file');
  Generator = (function() {
    Generator.prototype.sourceFiles = ['templates/index.html.eco', 'templates/jquery.min.js', 'templates/modernizr.min.js', 'templates/style.css'];
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
      return async.parallel((function() {
        var _i, _len, _ref, _results;
        _ref = this.files;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          file = _ref[_i];
          _results.push(file.require);
        }
        return _results;
      }).call(this), __bind(function(err, results) {
        if (err) {
          return callback(err);
        }
        return qqunit.Runner.run([], __bind(function(stats) {
          return this.render(__bind(function(err, output) {
            return callback(err, stats, output);
          }, this));
        }, this));
      }, this));
    };
    Generator.prototype.render = function(callback) {
      var file, main;
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
      return async.map(this.sourceFiles, fs.readFile, __bind(function(err, _arg) {
        var css_source, jquery_source, modernizr_source, output, template;
        template = _arg[0], jquery_source = _arg[1], modernizr_source = _arg[2], css_source = _arg[3];
        if (!err) {
          output = eco.render(template, {
            main: main,
            jquery_source: jquery_source,
            modernizr_source: modernizr_source,
            css_source: css_source
          });
        }
        return callback(err, output);
      }, this));
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
