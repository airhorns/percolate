(function() {
  var CoffeeScript, CoffeeTestBlock, JavaScriptTestBlock, TestBlock, True;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  }, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  CoffeeScript = require('coffee-script');
  True = CoffeeScript.nodes("true");
  module.exports = TestBlock = (function() {
    TestBlock.prototype.assertionNames = ['ok', 'equal', 'equals', 'deepEqual', 'strictEqual'];
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
      var k, statement, _i, _j, _len, _len2, _ref, _ref2, _results;
      this.coffeeNodes = CoffeeScript.nodes(this.text, this.defaultCoffeeOptions);
      this.coffeeNodes.traverseChildren(true, __bind(function(child) {
        var functionName, nodeType, _ref, _ref2;
        nodeType = child.constructor.name;
        if (nodeType === 'Call') {
          functionName = (_ref = child.variable) != null ? (_ref2 = _ref.base) != null ? _ref2.value : void 0 : void 0;
          if (functionName && ~this.assertionNames.indexOf(functionName)) {
            this[functionName](child);
          }
        }
        return true;
      }, this));
      _ref = this.statements;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        statement = _ref[_i];
        _ref2 = ['in', 'out'];
        for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
          k = _ref2[_j];
          statement[k] = statement[k].compile(this.defaultCoffeeOptions);
        }
        if (statement.message) {
          statement.out = "// " + (statement.message.compile(this.defaultCoffeeOptions).slice(1, -1)) + " \n " + statement.out;
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
