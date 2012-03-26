(function() {
  var Generator, TestFile, async, fs, hogan, path, qqunit;

  require('./environment');

  qqunit = require('qqunit');

  async = require('async');

  hogan = require('hogan.js');

  fs = require('fs');

  path = require('path');

  TestFile = require('./test_file');

  Generator = (function() {

    Generator.prototype.sourceFiles = ['templates/index.html.mustache', 'templates/table_of_contents_node.html.mustache', 'templates/jquery.min.js', 'templates/modernizr.min.js', 'templates/script.js', 'templates/style.css', 'templates/code_block.html.mustache'];

    function Generator(projectDirectory, files) {
      var file;
      this.projectDirectory = projectDirectory;
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

    Generator.prototype.test = function(callback) {
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
          return callback(null, stats);
        });
      });
    };

    Generator.prototype.generate = function(callback) {
      var _this = this;
      return this.test(function(err, stats) {
        if (!(stats.failed > 0)) {
          return _this.render(function(err, output) {
            return callback(err, stats, output);
          });
        } else {
          return callback(err, stats, "");
        }
      });
    };

    Generator.prototype.render = function(callback) {
      var defaultTemplateFiles, localTemplateFiles;
      var _this = this;
      defaultTemplateFiles = this.sourceFiles.map(function(file) {
        return path.join(__dirname, '..', file);
      });
      localTemplateFiles = this.sourceFiles.map(function(file) {
        return path.join(_this.projectDirectory, file);
      });
      return async.map(localTemplateFiles, (function(file, callback) {
        return fs.stat(file, function(e, stats) {
          return callback(null, stats && stats.isFile());
        });
      }), function(err, results) {
        var codeBlockTemplate, file, i, result, table_of_contents, templateFiles, _i, _len, _ref;
        if (err) return callback(err);
        templateFiles = (function() {
          var _len, _results;
          _results = [];
          for (i = 0, _len = results.length; i < _len; i++) {
            result = results[i];
            if (result) {
              _results.push(localTemplateFiles[i]);
            } else {
              _results.push(defaultTemplateFiles[i]);
            }
          }
          return _results;
        })();
        table_of_contents = _this.files.map(function(file) {
          return file.tableOfContents;
        }).reduce(function(a, b) {
          return a.merge(b);
        });
        console.log("Rendering and highlighting tests...");
        codeBlockTemplate = hogan.compile(fs.readFileSync(templateFiles[templateFiles.length - 1]).toString());
        _ref = _this.files;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          file = _ref[_i];
          file.codeBlockTemplate = codeBlockTemplate;
        }
        return async.parallel([
          function(callback) {
            return async.map(_this.files, (function(file, callback) {
              return file.output(callback);
            }), function(err, results) {
              if (results != null) results = results.join('\n');
              return callback(err, results);
            });
          }, function(callback) {
            return async.map(templateFiles, fs.readFile, function(err, results) {
              if (!err) {
                results = results.map(function(result) {
                  return result.toString();
                });
                results[0] = hogan.compile(results[0]);
              }
              return callback(err, results);
            });
          }
        ], function(err, _arg) {
          var css_source, jquery_source, main, modernizr_source, output, script_source, table_of_contents_node, template, templates;
          main = _arg[0], templates = _arg[1];
          template = templates[0], table_of_contents_node = templates[1], jquery_source = templates[2], modernizr_source = templates[3], css_source = templates[4], script_source = templates[5];
          output = template.render({
            main: main,
            table_of_contents: table_of_contents,
            jquery_source: jquery_source,
            modernizr_source: modernizr_source,
            css_source: css_source,
            script_source: script_source
          }, {
            table_of_contents_node: table_of_contents_node
          });
          return callback(err, output);
        });
      });
    };

    return Generator;

  })();

  module.exports = Generator;

}).call(this);
