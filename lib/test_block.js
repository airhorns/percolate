(function() {
  var CoffeeScript, CoffeeTestBlock, DefaultTestBlock, Elipsis, Empty, JavaScriptTestBlock, TestBlock, True, warnWithLines,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  CoffeeScript = require('coffee-script');

  try {
    CoffeeScript.Nodes = require('coffee-script/lib/coffee-script/nodes');
  } catch (e) {
    CoffeeScript.Nodes = require('coffee-script/lib/nodes');
  }

  True = "true";

  Empty = "";

  Elipsis = "...";

  warnWithLines = function(text) {
    var i, line, lines, maxDigits, pad, _i, _len;
    lines = text.split('\n');
    maxDigits = ("" + lines.length).length;
    pad = function(i) {
      var chars, x;
      chars = (function() {
        var _i, _ref, _results;
        _results = [];
        for (x = _i = 0, _ref = maxDigits - ("" + i).length; 0 <= _ref ? _i < _ref : _i > _ref; x = 0 <= _ref ? ++_i : --_i) {
          _results.push(' ');
        }
        return _results;
      })();
      chars.push(i);
      return chars.join('');
    };
    for (i = _i = 0, _len = lines.length; _i < _len; i = ++_i) {
      line = lines[i];
      console.warn("" + (pad(i + 1)) + ": " + line);
    }
    return true;
  };

  module.exports = TestBlock = (function() {

    TestBlock.name = 'TestBlock';

    TestBlock.prototype.extractFunctionNames = ['ok', 'equal', 'equals', 'deepEqual', 'strictEqual', 'show', 'test', 'asyncTest', 'setTimeout', 'delay'];

    TestBlock["for"] = function(text, lang, evaluate) {
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
            return DefaultTestBlock;
        }
      })();
      return new klass(text, evaluate);
    };

    function TestBlock(text, evaluate) {
      this.text = text;
      this.evaluate = evaluate != null ? evaluate : true;
      this.statements = [];
      this.parse();
    }

    TestBlock.prototype["eval"] = function(script) {
      return eval(script);
    };

    return TestBlock;

  })();

  DefaultTestBlock = (function(_super) {

    __extends(DefaultTestBlock, _super);

    DefaultTestBlock.name = 'DefaultTestBlock';

    function DefaultTestBlock() {
      return DefaultTestBlock.__super__.constructor.apply(this, arguments);
    }

    DefaultTestBlock.prototype.parse = function() {};

    return DefaultTestBlock;

  })(TestBlock);

  CoffeeTestBlock = (function(_super) {

    __extends(CoffeeTestBlock, _super);

    CoffeeTestBlock.name = 'CoffeeTestBlock';

    CoffeeTestBlock.prototype.defaultCoffeeOptions = {
      bare: true
    };

    function CoffeeTestBlock(text) {
      CoffeeTestBlock.__super__.constructor.apply(this, arguments);
      this.script = CoffeeScript.compile(text);
      if (this.evaluate) {
        this["eval"](this.script);
      }
    }

    CoffeeTestBlock.prototype.parse = function() {
      var k, node, statement, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2, _results,
        _this = this;
      try {
        this.coffeeNodes = CoffeeScript.nodes(this.text, this.defaultCoffeeOptions);
      } catch (e) {
        console.warn("Compile error in block:");
        warnWithLines(this.text);
        throw e;
      }
      this.coffeeNodes.traverseChildren(true, function(child) {
        var functionName, nodeType, _ref, _ref1;
        nodeType = child.constructor.name;
        if (nodeType === 'Call') {
          functionName = (_ref = child.variable) != null ? (_ref1 = _ref.base) != null ? _ref1.value : void 0 : void 0;
          if (functionName && ~_this.extractFunctionNames.indexOf(functionName)) {
            _this[functionName](child);
          }
        }
        return true;
      });
      _ref = this.statements;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        statement = _ref[_i];
        _ref1 = ['in', 'out', 'message'];
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          k = _ref1[_j];
          if (((node = statement[k]) != null) && (node.compile != null)) {
            (function(node, statement, k) {
              var __super__;
              __super__ = node.compile;
              return node.compile = function() {
                var result;
                result = statement[k] = __super__.apply(this, arguments);
                return result;
              };
            })(node, statement, k);
          }
        }
      }
      this.coffeeNodes.compile(this.defaultCoffeeOptions);
      _ref2 = this.statements;
      _results = [];
      for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
        statement = _ref2[_k];
        if (statement.message) {
          statement.out = "" + statement.out + " // " + (statement.message.slice(1, -1));
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

    CoffeeTestBlock.prototype.setTimeout = function(call) {
      return this.statements.push({
        "in": Empty,
        out: Elipsis
      });
    };

    CoffeeTestBlock.prototype.delay = CoffeeTestBlock.prototype.setTimeout;

    CoffeeTestBlock.prototype.test = function(call) {
      return this.name = call.args[0].compile(this.defaultCoffeeOptions).slice(1, -1);
    };

    CoffeeTestBlock.prototype.asyncTest = CoffeeTestBlock.prototype.test;

    return CoffeeTestBlock;

  })(TestBlock);

  JavaScriptTestBlock = (function(_super) {

    __extends(JavaScriptTestBlock, _super);

    JavaScriptTestBlock.name = 'JavaScriptTestBlock';

    function JavaScriptTestBlock(text) {
      JavaScriptTestBlock.__super__.constructor.apply(this, arguments);
      this.script = "!function(){" + text + "}()";
      if (this.evaluate) {
        this["eval"](this.script);
      }
    }

    return JavaScriptTestBlock;

  })(TestBlock);

}).call(this);
