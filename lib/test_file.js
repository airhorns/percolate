(function() {
  var CoffeeScript, TableOfContents, TableOfContentsNode, TestBlock, TestFile, async, fs, marked, path, pygments, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  fs = require('fs');

  path = require('path');

  async = require('async');

  CoffeeScript = require('coffee-script');

  marked = require('./marked');

  pygments = require('pygments');

  TestBlock = require('./test_block');

  _ref = require('./table_of_contents'), TableOfContents = _ref.TableOfContents, TableOfContentsNode = _ref.TableOfContentsNode;

  module.exports = TestFile = (function() {

    TestFile.highlightQueue = (function() {
      var queue;
      return queue = async.queue(function(job, callback) {
        return pygments.colorize(job.text, job.lang, 'html', function(text) {
          if (!(text != null) || text.length < 1) {
            console.warn("Job failed!");
            console.warn(job.text);
          }
          job.text = text.slice(0, -1);
          return callback(null, job);
        });
      }, 4);
    })();

    TestFile.prototype.codeBlockTemplate = false;

    TestFile.prototype._required = false;

    function TestFile(filePath) {
      this.filePath = filePath;
      this.require = __bind(this.require, this);

    }

    TestFile.prototype.require = function(callback) {
      var _this = this;
      return fs.readFile(this.filePath, function(err, data) {
        QUnit.module(_this.filePath);
        if (!err) {
          _this.fileContents = data.toString();
          _this.tokens = marked.lexer(_this.fileContents);
          _this.tableOfContents = _this._extractTableOfContents();
          _this.testBlocks = _this._extractTestBlocks();
          _this._required = true;
          return callback(err);
        }
      });
    };

    TestFile.prototype.output = function(callback) {
      var _this = this;
      if (!this._required) {
        throw new Error("Must require file first.");
      }
      return this._highlightTokens(function(err) {
        var result;
        if (!err) {
          result = _this._renderMarkdown();
        }
        return callback(err, result);
      });
    };

    TestFile.prototype._renderMarkdown = function() {
      var oldOnCode, output,
        _this = this;
      oldOnCode = marked.inline.onCode;
      marked.inline.onCode = function(contents) {
        return _this.tableOfContents.autolink(contents);
      };
      output = marked.parser(this.tokens);
      marked.inline.onCode = oldOnCode;
      return output;
    };

    TestFile.prototype._extractTableOfContents = function() {
      var child, currentRoot, i, table, token, _i, _len, _ref1;
      currentRoot = table = new TableOfContents;
      _ref1 = this.tokens;
      for (i = _i = 0, _len = _ref1.length; _i < _len; i = ++_i) {
        token = _ref1[i];
        if (!(token.type === 'heading')) {
          continue;
        }
        child = new TableOfContentsNode(token.depth, token.text, token.searchable);
        while (child.depth <= currentRoot.depth) {
          currentRoot = currentRoot.parent;
        }
        currentRoot.addChild(child);
        token.id = child.id;
        currentRoot = child;
      }
      return table;
    };

    TestFile.prototype._extractTestBlocks = function() {
      var block, blocks, currentLanguage, evaluate, i, token, _i, _len, _ref1, _ref2;
      blocks = [];
      try {
        _ref1 = this.tokens;
        for (i = _i = 0, _len = _ref1.length; _i < _len; i = ++_i) {
          token = _ref1[i];
          if ((_ref2 = token.type) === 'percolate_code' || _ref2 === 'code') {
            currentLanguage = token.lang || 'coffeescript';
            evaluate = token.type === 'percolate_code';
            block = TestBlock["for"](token.text, currentLanguage, evaluate);
            block.token = token;
            blocks.push(block);
          }
        }
      } catch (e) {
        console.warn("Error in file " + this.filePath + "!");
        throw e;
      }
      return blocks;
    };

    TestFile.prototype._highlightTokens = function(callback) {
      var block, queue, _i, _len, _ref1;
      queue = this._generateHighlightQueue();
      _ref1 = this.testBlocks;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        block = _ref1[_i];
        if (block.token.type === 'percolate_code') {
          this._queuePercolateBlock(block, queue);
        } else if (block.token.type === 'code' && block.token.lang) {
          this._queueCodeToken(block.token, queue);
        }
      }
      if (queue.length() > 0) {
        return queue.drain = callback;
      } else {
        return callback();
      }
    };

    TestFile.prototype._queuePercolateBlock = function(testBlock, queue) {
      var currentLanguage, i, jobCount, jobCreator, jobs, statement, statements, token, _i, _len,
        _this = this;
      token = testBlock.token;
      currentLanguage = token.lang || 'coffeescript';
      statements = testBlock.statements;
      token.escaped = true;
      token.lang = 'javascript';
      token.text = '';
      jobCreator = function(text, callback) {
        var job;
        job = {
          text: text,
          lang: token.lang
        };
        if (text.length > 0) {
          return queue.push(job, callback);
        } else {
          return callback(void 0, job);
        }
      };
      jobs = {};
      jobCount = statements.length - 1;
      for (i = _i = 0, _len = statements.length; _i < _len; i = ++_i) {
        statement = statements[i];
        jobs["in" + i] = jobCreator.bind(this, statement['in']);
        jobs["out" + i] = jobCreator.bind(this, statement['out']);
      }
      return async.parallel(jobs, function(err, results) {
        var renderContext, _j;
        if (err) {
          throw err;
        }
        renderContext = {
          jobs: [],
          title: testBlock.name,
          language: token.lang
        };
        for (i = _j = 0; 0 <= jobCount ? _j <= jobCount : _j >= jobCount; i = 0 <= jobCount ? ++_j : --_j) {
          renderContext.jobs.push({
            "in": results["in" + i],
            out: results["out" + i]
          });
        }
        token.text = _this.codeBlockTemplate.render(renderContext);
        return true;
      });
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
      var _this = this;
      return async.queue(function(job, callback) {
        return _this.constructor.highlightQueue.push(job, callback);
      }, 10000);
    };

    return TestFile;

  })();

}).call(this);
