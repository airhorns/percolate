(function() {
  var AssertionNode, BaseNode, ConsoleNode, DocumentationNode, ExampleTestCaseNode, FunctionDocumentationNode, Highlight, LeafNode, MultiConsoleNode, Node, ReferenceNode, ShowNode, TestCaseNode, TestContainerNode, TextNode, assert, eco, fs, ghm, hljs, path, util;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  }, __slice = Array.prototype.slice, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  fs = require('fs');
  path = require('path');
  hljs = require('highlight.js');
  ghm = require("github-flavored-markdown");
  eco = require("eco");
  assert = require("assert");
  util = require('util');
  Highlight = function(str) {
    return hljs.highlight('javascript', str).value;
  };
  LeafNode = (function() {
    function LeafNode(parent) {
      this.parent = parent;
    }
    LeafNode.prototype.traverse = function(walker) {
      var child, _i, _len, _ref;
      if (!walker.enteredNode || walker.enteredNode(this) !== false) {
        _ref = this.children || [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          child = _ref[_i];
          if (typeof child !== "string") {
            child.traverse(walker);
          } else if (walker.traversesTextNodes) {
            walker.enteredNode(child);
            walker.exitedNode(child);
          }
        }
        if (walker.exitedNode) {
          return walker.exitedNode(this);
        }
      }
    };
    return LeafNode;
  })();
  Node = (function() {
    __extends(Node, LeafNode);
    function Node(parent) {
      var block;
      this.parent = parent;
      this.children = [];
      Node.__super__.constructor.apply(this, arguments);
      block = arguments[arguments.length - 1];
      if (typeof block === 'function') {
        block.call(this);
      }
    }
    return Node;
  })();
  TextNode = (function() {
    __extends(TextNode, LeafNode);
    function TextNode(parent, text) {
      this.parent = parent;
      this.text = text;
      TextNode.__super__.constructor.apply(this, arguments);
    }
    return TextNode;
  })();
  ReferenceNode = (function() {
    __extends(ReferenceNode, LeafNode);
    function ReferenceNode(parent, context, node) {
      this.parent = parent;
      this.context = context;
      this.node = node;
      ReferenceNode.__super__.constructor.apply(this, arguments);
    }
    ReferenceNode.prototype.identifier = function() {
      return "" + this.context + "." + this.node;
    };
    return ReferenceNode;
  })();
  ConsoleNode = (function() {
    __extends(ConsoleNode, LeafNode);
    function ConsoleNode() {
      ConsoleNode.__super__.constructor.apply(this, arguments);
    }
    ConsoleNode.prototype.outputValue = function() {
      var context, setup, _i, _len, _ref;
      if (this.output == null) {
        context = {};
        _ref = this.parent.setups();
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          setup = _ref[_i];
          setup.call(context);
        }
        this.output = this.inputFunction.call(context);
      }
      return this.output;
    };
    return ConsoleNode;
  })();
  AssertionNode = (function() {
    __extends(AssertionNode, ConsoleNode);
    function AssertionNode(parent, inputFunction, assertion) {
      this.parent = parent;
      this.inputFunction = inputFunction;
      this.assertion = assertion;
      AssertionNode.__super__.constructor.apply(this, arguments);
    }
    AssertionNode.prototype.success = function() {
      return this.assertion.call(this, this.outputValue());
    };
    return AssertionNode;
  })();
  ShowNode = (function() {
    __extends(ShowNode, ConsoleNode);
    function ShowNode(parent, inputFunction) {
      this.parent = parent;
      this.inputFunction = inputFunction;
      this.parent.setup(this.inputFunction);
      ShowNode.__super__.constructor.apply(this, arguments);
    }
    return ShowNode;
  })();
  MultiConsoleNode = (function() {
    __extends(MultiConsoleNode, Node);
    function MultiConsoleNode() {
      MultiConsoleNode.__super__.constructor.apply(this, arguments);
    }
    return MultiConsoleNode;
  })();
  TestContainerNode = (function() {
    __extends(TestContainerNode, Node);
    function TestContainerNode(parent) {
      this.parent = parent;
      this.setupFunctions = [];
      TestContainerNode.__super__.constructor.apply(this, arguments);
    }
    TestContainerNode.prototype.setups = function() {
      if (this.parent.setups != null) {
        return this.parent.setups().concat(this.setupFunctions);
      } else {
        return this.setupFunctions;
      }
    };
    TestContainerNode.prototype.setup = function(f) {
      return this.setupFunctions.push(f);
    };
    TestContainerNode.prototype.show = function() {
      return this.children.push((function(func, args, ctor) {
        ctor.prototype = func.prototype;
        var child = new ctor, result = func.apply(child, args);
        return typeof result === "object" ? result : child;
      })(ShowNode, [this].concat(__slice.call(arguments)), function() {}));
    };
    TestContainerNode.prototype.example = function() {
      return this.children.push((function(func, args, ctor) {
        ctor.prototype = func.prototype;
        var child = new ctor, result = func.apply(child, args);
        return typeof result === "object" ? result : child;
      })(ExampleTestCaseNode, [this].concat(__slice.call(arguments)), function() {}));
    };
    TestContainerNode.prototype.test = function() {
      return this.children.push((function(func, args, ctor) {
        ctor.prototype = func.prototype;
        var child = new ctor, result = func.apply(child, args);
        return typeof result === "object" ? result : child;
      })(TestCaseNode, [this].concat(__slice.call(arguments)), function() {}));
    };
    TestContainerNode.prototype.see = function(context, node) {
      return this.children.push(new ReferenceNode(this, context, node));
    };
    return TestContainerNode;
  })();
  TestCaseNode = (function() {
    var k, _fn, _i, _len, _ref;
    __extends(TestCaseNode, TestContainerNode);
    function TestCaseNode(parent, name, caseFunction) {
      this.parent = parent;
      this.name = name;
      TestCaseNode.__super__.constructor.apply(this, arguments);
    }
    TestCaseNode.prototype.explain = function(string) {
      return this.children.push(new TextNode(this, string));
    };
    _ref = ['equal', 'notEqual', 'deepEqual', 'notDeepEqual', 'strictEqual', 'notStrictEqual'];
    _fn = __bind(function(k) {
      return this.prototype[k] = function(expected, actualFunction) {
        var self;
        self = this;
        return this.children.push(new AssertionNode(this, actualFunction, function(actualValue) {
          try {
            assert[k](actualValue, expected);
            return true;
          } catch (e) {
            self.error = e;
            return false;
          }
        }));
      };
    }, TestCaseNode);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      k = _ref[_i];
      _fn(k);
    }
    TestCaseNode.prototype.ok = function(actualFunction) {
      return this.equal(true, actualFunction);
    };
    TestCaseNode.prototype.param = function(name, type) {};
    return TestCaseNode;
  }).call(this);
  ExampleTestCaseNode = (function() {
    __extends(ExampleTestCaseNode, TestCaseNode);
    function ExampleTestCaseNode() {
      ExampleTestCaseNode.__super__.constructor.apply(this, arguments);
    }
    ExampleTestCaseNode.prototype.displayAssertions = true;
    return ExampleTestCaseNode;
  })();
  DocumentationNode = (function() {
    __extends(DocumentationNode, TestContainerNode);
    function DocumentationNode(parent, name, blockFunction) {
      this.parent = parent;
      this.name = name;
      DocumentationNode.__super__.constructor.apply(this, arguments);
    }
    DocumentationNode.prototype["function"] = function() {
      return this.children.push((function(func, args, ctor) {
        ctor.prototype = func.prototype;
        var child = new ctor, result = func.apply(child, args);
        return typeof result === "object" ? result : child;
      })(FunctionDocumentationNode, [this].concat(__slice.call(arguments)), function() {}));
    };
    DocumentationNode.prototype.document = function() {
      throw "Can't next documentations!";
    };
    DocumentationNode.prototype.describe = function(text) {
      return this.children.push(new TextNode(this, text));
    };
    return DocumentationNode;
  })();
  FunctionDocumentationNode = (function() {
    __extends(FunctionDocumentationNode, DocumentationNode);
    function FunctionDocumentationNode(parent, key, blockFunction) {
      this.parent = parent;
      this.key = key;
      this.paramTypes = {};
      FunctionDocumentationNode.__super__.constructor.apply(this, arguments);
    }
    FunctionDocumentationNode.prototype["function"] = function() {
      throw "Can't nest function descriptions!";
    };
    FunctionDocumentationNode.prototype.document = function() {
      throw "Break out of this function description before trying to document something else!";
    };
    FunctionDocumentationNode.prototype.param = function(key, type) {
      return this.paramTypes[key] = type;
    };
    FunctionDocumentationNode.prototype.params = function(params) {
      var key, type;
      for (key in params) {
        type = params[key];
        this.param(key, type);
      }
      return params;
    };
    FunctionDocumentationNode.prototype.callSignature = function() {
      return "" + this.key + "(" + (this.paramsList()) + ")";
    };
    FunctionDocumentationNode.prototype.signature = function() {
      return "" + (this.parentName()) + "." + (this.callSignature());
    };
    FunctionDocumentationNode.prototype.identifier = function() {
      return "" + (this.parentName()) + "." + this.key;
    };
    FunctionDocumentationNode.prototype.parentName = function() {
      var current, next;
      current = this;
      while ((next = current.parent) && next !== current) {
        if (next.name != null) {
          return next.name;
        }
        current = next;
      }
      return "global";
    };
    FunctionDocumentationNode.prototype.paramsList = function() {
      var k, list, v;
      list = [
        (function() {
          var _ref, _results;
          _ref = this.paramTypes;
          _results = [];
          for (k in _ref) {
            v = _ref[k];
            _results.push(k);
          }
          return _results;
        }).call(this)
      ];
      return list.join(', ');
    };
    return FunctionDocumentationNode;
  })();
  BaseNode = (function() {
    __extends(BaseNode, Node);
    function BaseNode(name, blockFunction) {
      this.name = name;
      this.parent = false;
      this.children = [];
      if ((blockFunction != null) && typeof blockFunction === 'function') {
        blockFunction.call(this);
      }
    }
    BaseNode.prototype.title = function(name) {
      this.name = name;
    };
    BaseNode.prototype.document = function() {
      return this.children.push((function(func, args, ctor) {
        ctor.prototype = func.prototype;
        var child = new ctor, result = func.apply(child, args);
        return typeof result === "object" ? result : child;
      })(DocumentationNode, [this].concat(__slice.call(arguments)), function() {}));
    };
    return BaseNode;
  })();
  module.exports = {
    Node: Node,
    LeafNode: LeafNode,
    TextNode: TextNode,
    AssertionNode: AssertionNode,
    ExampleTestCaseNode: ExampleTestCaseNode,
    TestCaseNode: TestCaseNode,
    DocumentationNode: DocumentationNode,
    FunctionDocumentationNode: FunctionDocumentationNode,
    BaseNode: BaseNode
  };
}).call(this);
