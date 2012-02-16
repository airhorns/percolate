(function() {
  var CoffeeScript, CoffeeTestBlock, Empty, JavaScriptTestBlock, TestBlock, True;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  CoffeeScript = require('coffee-script');

  CoffeeScript.Nodes = require('coffee-script/lib/nodes');

  True = CoffeeScript.nodes("true");

  Empty = CoffeeScript.nodes("{}");

  global.show = function() {};

  module.exports = TestBlock = (function() {

    TestBlock.prototype.extractFunctionNames = ['ok', 'equal', 'equals', 'deepEqual', 'strictEqual', 'show'];

    TestBlock["for"] = function(text, lang) {
      var klass;
      klass = (function() {
        switch (lang) {
          case 'coffee':
          case 'coffeescript':
            return CoffeeTestBlock;
          case 'js':
          case 'javascript':
            return JavaScriptTestBlock;
          default:
            throw new Error("Can't parse lang " + lang + " for percolate blocks, sorry.");
        }
      })();
      return new klass(text);
    };

    function TestBlock(text) {
      this.text = text;
      this.statements = [];
      this.parse();
    }

    TestBlock.prototype.eval = function(script) {
      return eval(script);
    };

    return TestBlock;

  })();

  CoffeeTestBlock = (function() {

    __extends(CoffeeTestBlock, TestBlock);

    CoffeeTestBlock.prototype.defaultCoffeeOptions = {
      bare: true
    };

    function CoffeeTestBlock(text) {
      CoffeeTestBlock.__super__.constructor.apply(this, arguments);
      this.script = CoffeeScript.compile(text);
      this.eval(this.script);
    }

    CoffeeTestBlock.prototype.parse = function() {
      var k, statement, _i, _j, _k, _len, _len2, _len3, _ref, _ref2, _ref3, _results;
      var _this = this;
      this.coffeeNodes = CoffeeScript.nodes(this.text, this.defaultCoffeeOptions);
      this.coffeeNodes.traverseChildren(true, function(child) {
        var functionName, nodeType, _ref, _ref2;
        nodeType = child.constructor.name;
        if (nodeType === 'Call') {
          functionName = (_ref = child.variable) != null ? (_ref2 = _ref.base) != null ? _ref2.value : void 0 : void 0;
          if (functionName && ~_this.extractFunctionNames.indexOf(functionName)) {
            _this[functionName](child);
          }
        }
        return true;
      });
      _ref = this.statements;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        statement = _ref[_i];
        _ref2 = ['in', 'out', 'message'];
        for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
          k = _ref2[_j];
          if (statement[k] != null) {
            (function(k, statement) {
              var __super__;
              __super__ = statement[k].compile;
              return statement[k].compile = function() {
                return statement[k] = __super__.apply(this, arguments);
              };
            })(k, statement);
          }
        }
      }
      this.coffeeNodes.compile(this.defaultCoffeeOptions);
      _ref3 = this.statements;
      _results = [];
      for (_k = 0, _len3 = _ref3.length; _k < _len3; _k++) {
        statement = _ref3[_k];
        if (statement.message) {
          statement.out = "// " + (statement.message.slice(1, -1)) + " \n " + statement.out;
        }
        _results.push(delete statement.message);
      }
      return _results;
    };

    CoffeeTestBlock.prototype.ok = function(call) {
      return this.statements.push({
        "in": call.args[0],
        out: True,
        message: call.args[1]
      });
    };

    CoffeeTestBlock.prototype.equal = function(call) {
      return this.statements.push({
        "in": call.args[0],
        out: call.args[1],
        message: call.args[2]
      });
    };

    CoffeeTestBlock.prototype.equals = CoffeeTestBlock.prototype.equal;

    CoffeeTestBlock.prototype.deepEqual = CoffeeTestBlock.prototype.equal;

    CoffeeTestBlock.prototype.strictEqual = CoffeeTestBlock.prototype.equal;

    CoffeeTestBlock.prototype.show = function(call) {
      return this.statements.push({
        "in": call.args[0],
        out: Empty
      });
    };

    return CoffeeTestBlock;

  })();

  JavaScriptTestBlock = (function() {

    __extends(JavaScriptTestBlock, TestBlock);

    function JavaScriptTestBlock(text) {
      JavaScriptTestBlock.__super__.constructor.apply(this, arguments);
      this.script = "!function(){" + text + "}()";
      this.eval(this.script);
    }

    return JavaScriptTestBlock;

  })();

}).call(this);
