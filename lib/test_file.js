(function() {
  var CoffeeScript, TableOfContents, TableOfContentsNode, TestBlock, TestFile, async, fs, marked, path, pygments, _ref;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  fs = require('fs');

  path = require('path');

  async = require('async');

  CoffeeScript = require('coffee-script');

  marked = require('./marked');

  pygments = require('pygments');

  TestBlock = require('./test_block');

  _ref = require('./table_of_contents'), TableOfContents = _ref.TableOfContents, TableOfContentsNode = _ref.TableOfContentsNode;

  module.exports = TestFile = (function() {

    TestFile.prototype._required = false;

    function TestFile(filePath) {
      this.filePath = filePath;
      this.require = __bind(this.require, this);
    }

    TestFile.prototype.require = function(callback) {
      var _this = this;
      return fs.readFile(this.filePath, function(err, data) {
        if (!err) {
          _this.fileContents = data.toString();
          _this.tokens = marked.lexer(_this.fileContents);
          _this._required = true;
          _this.tableOfContents = _this._extractTableOfContents();
          return _this._highlightTokens(callback);
        }
      });
    };

    TestFile.prototype.output = function() {
      if (!this._required) throw new Error("Must require file first.");
      return marked.parser(this.tokens);
    };

    TestFile.prototype._extractTableOfContents = function() {
      var child, currentRoot, i, table, token, _len, _ref2;
      currentRoot = table = new TableOfContents;
      _ref2 = this.tokens;
      for (i = 0, _len = _ref2.length; i < _len; i++) {
        token = _ref2[i];
        if (!(token.type === 'heading')) continue;
        child = new TableOfContentsNode(token.depth, token.text, token.searchable);
        while (child.depth <= currentRoot.depth) {
          currentRoot = currentRoot.parent;
        }
        currentRoot.addChild(child);
        currentRoot = child;
      }
      return table;
    };

    TestFile.prototype._highlightTokens = function(callback) {
      var i, queue, token, _len, _ref2;
      queue = this._generateHighlightQueue();
      _ref2 = this.tokens;
      for (i = 0, _len = _ref2.length; i < _len; i++) {
        token = _ref2[i];
        if (token.type === 'code') {
          if (token.percolate) {
            this._queuePercolateToken(token, queue);
          } else if (token.lang) {
            this._queueCodeToken(token, queue);
          }
        }
      }
      if (queue.length() > 0) {
        return queue.drain = callback;
      } else {
        return callback();
      }
    };

    TestFile.prototype._queuePercolateToken = function(token, queue) {
      var currentLanguage, statement, statements, _i, _len, _results;
      var _this = this;
      currentLanguage = token.lang || 'coffeescript';
      statements = TestBlock["for"](token.text, currentLanguage).statements;
      token.escaped = true;
      token.lang = 'javascript';
      _results = [];
      for (_i = 0, _len = statements.length; _i < _len; _i++) {
        statement = statements[_i];
        _results.push((function(token, statement) {
          return async.parallel({
            inJob: function(callback) {
              return queue.push({
                text: statement["in"],
                lang: token.lang
              }, callback);
            },
            outJob: function(callback) {
              return queue.push({
                text: statement.out,
                lang: token.lang
              }, callback);
            }
          }, function(err, _arg) {
            var inJob, outJob;
            inJob = _arg.inJob, outJob = _arg.outJob;
            if (err) throw err;
            return token.text = "<div class=\"in\">" + inJob.text + "</div><div class=\"out\">" + outJob.text + "</div>";
          });
        })(token, statement));
      }
      return _results;
    };

    TestFile.prototype._queueCodeToken = function(token, queue) {
      return queue.push({
        text: token.text,
        lang: token.lang
      }, function(err, job) {
        token.text = job.text;
        return token.escaped = true;
      });
    };

    TestFile.prototype._generateHighlightQueue = function() {
      return async.queue(function(job, callback) {
        if (!((job.text != null) && (job.lang != null))) debugger;
        return pygments.colorize(job.text, job.lang, 'html', function(text) {
          job.text = text;
          return callback(null, job);
        });
      }, 5);
    };

    return TestFile;

  })();

}).call(this);
