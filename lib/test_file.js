(function() {
  var CoffeeScript, TestBlock, TestFile, async, fs, marked, path, pygments;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  fs = require('fs');
  path = require('path');
  async = require('async');
  CoffeeScript = require('coffee-script');
  marked = require('./marked');
  pygments = require('pygments');
  TestBlock = require('./test_block');
  module.exports = TestFile = (function() {
    TestFile.prototype._required = false;
    function TestFile(filePath) {
      this.filePath = filePath;
      this.require = __bind(this.require, this);
    }
    TestFile.prototype.require = function(callback) {
      return fs.readFile(this.filePath, __bind(function(err, data) {
        if (!err) {
          this.fileContents = data.toString();
          this._required = true;
          return this._parse(callback);
        }
      }, this));
    };
    TestFile.prototype._parse = function(callback) {
      var currentLanguage, highlightingQueue, i, statement, statements, token, _fn, _i, _len, _len2, _ref;
      this.tokens = marked.lexer(this.fileContents);
      highlightingQueue = async.queue(function(job, callback) {
        return pygments.colorize(job.text, job.lang, 'html', function(text) {
          job.text = text;
          return callback(null, job);
        });
      }, 5);
      _ref = this.tokens;
      for (i = 0, _len = _ref.length; i < _len; i++) {
        token = _ref[i];
        if (token.type === 'code') {
          if (token.percolate) {
            currentLanguage = token.lang || 'coffeescript';
            statements = TestBlock["for"](token.text, currentLanguage).statements;
            token.escaped = true;
            token.lang = 'javascript';
            _fn = __bind(function(token, statement) {
              return async.parallel({
                inJob: function(callback) {
                  return highlightingQueue.push({
                    text: statement["in"],
                    lang: token.lang
                  }, callback);
                },
                outJob: function(callback) {
                  return highlightingQueue.push({
                    text: statement.out,
                    lang: token.lang
                  }, callback);
                }
              }, __bind(function(err, _arg) {
                var inJob, outJob;
                inJob = _arg.inJob, outJob = _arg.outJob;
                if (err) {
                  throw err;
                }
                return token.text = "<div class=\"in\">" + inJob.text + "</div><div class=\"out\">" + outJob.text + "</div>";
              }, this));
            }, this);
            for (_i = 0, _len2 = statements.length; _i < _len2; _i++) {
              statement = statements[_i];
              _fn(token, statement);
            }
          } else if (token.lang) {
            highlightingQueue.push(token);
          }
        }
      }
      if (highlightingQueue.length() > 0) {
        return highlightingQueue.drain = callback;
      } else {
        return callback();
      }
    };
    TestFile.prototype.output = function() {
      if (!this._required) {
        throw new Error("Must require file first.");
      }
      return marked.parser(this.tokens);
    };
    return TestFile;
  })();
}).call(this);
