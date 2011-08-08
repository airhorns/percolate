(function() {
  var AssertionNode, BaseNode, ConsoleNode, DocumentationNode, ExampleTestCaseNode, FunctionDocumentationNode, Highlight, IdentifierWalker, LeafNode, MultiConsoleNode, Node, ReferenceNode, ShowNode, TestCaseNode, TestContainerNode, TextNode, assert, eco, fs, ghm, hljs, path, util;
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
  IdentifierWalker = require('./walkers/identifier');
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
    Node.prototype._traverseIdentifier = function(nameOrTree) {
      if (typeof nameOrTree === 'string') {
        return nameOrTree;
      } else {
        return IdentifierWalker.getIdentifier(nameOrTree);
      }
    };
    return Node;
  })();
  TextNode = (function() {
    __extends(TextNode, LeafNode);
    TextNode.prototype.name = 'Text';
    function TextNode(parent, text) {
      this.parent = parent;
      this.text = text;
      TextNode.__super__.constructor.apply(this, arguments);
    }
    return TextNode;
  })();
  ReferenceNode = (function() {
    __extends(ReferenceNode, LeafNode);
    ReferenceNode.prototype.name = 'Reference';
    function ReferenceNode(parent, reference) {
      this.parent = parent;
      this.reference = reference;
      ReferenceNode.__super__.constructor.apply(this, arguments);
    }
    ReferenceNode.prototype.identifier = function() {
      return this._reference || (this._reference = this._traverseIdentifier(this.reference));
    };
    return ReferenceNode;
  })();
  ConsoleNode = (function() {
    __extends(ConsoleNode, LeafNode);
    function ConsoleNode() {
      ConsoleNode.__super__.constructor.apply(this, arguments);
    }
    ConsoleNode.prototype.name = 'Console';
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
    AssertionNode.prototype.name = 'Assertion';
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
    ShowNode.prototype.name = 'Show';
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
    MultiConsoleNode.prototype.name = 'MultiConsole';
    return MultiConsoleNode;
  })();
  TestContainerNode = (function() {
    __extends(TestContainerNode, Node);
    TestContainerNode.prototype.name = 'TestContainer';
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
      var node;
      this.children.push(node = (function(func, args, ctor) {
        ctor.prototype = func.prototype;
        var child = new ctor, result = func.apply(child, args);
        return typeof result === "object" ? result : child;
      })(ShowNode, [this].concat(__slice.call(arguments)), function() {}));
      return node;
    };
    TestContainerNode.prototype.example = function() {
      var node;
      this.children.push(node = (function(func, args, ctor) {
        ctor.prototype = func.prototype;
        var child = new ctor, result = func.apply(child, args);
        return typeof result === "object" ? result : child;
      })(ExampleTestCaseNode, [this].concat(__slice.call(arguments)), function() {}));
      return node;
    };
    TestContainerNode.prototype.test = function() {
      var node;
      this.children.push(node = (function(func, args, ctor) {
        ctor.prototype = func.prototype;
        var child = new ctor, result = func.apply(child, args);
        return typeof result === "object" ? result : child;
      })(TestCaseNode, [this].concat(__slice.call(arguments)), function() {}));
      return node;
    };
    TestContainerNode.prototype.see = function(identifier) {
      var node;
      this.children.push(node = new ReferenceNode(this, identifer));
      return node;
    };
    return TestContainerNode;
  })();
  TestCaseNode = (function() {
    var k, _fn, _i, _len, _ref;
    __extends(TestCaseNode, TestContainerNode);
    TestCaseNode.prototype.name = 'TestCase';
    function TestCaseNode(parent, caseName, caseFunction) {
      this.parent = parent;
      this.caseName = caseName;
      TestCaseNode.__super__.constructor.apply(this, arguments);
    }
    TestCaseNode.prototype.explain = function(string) {
      var node;
      this.children.push(node = new TextNode(this, string));
      return node;
    };
    _ref = ['equal', 'notEqual', 'deepEqual', 'notDeepEqual', 'strictEqual', 'notStrictEqual'];
    _fn = __bind(function(k) {
      return this.prototype[k] = function(expected, actualFunction) {
        var node, self;
        self = this;
        this.children.push(node = new AssertionNode(this, actualFunction, function(actualValue) {
          try {
            assert[k](actualValue, expected);
            return true;
          } catch (e) {
            self.error = e;
            return false;
          }
        }));
        return node;
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
    ExampleTestCaseNode.prototype.name = 'ExampleTestCase';
    ExampleTestCaseNode.prototype.displayAssertions = true;
    return ExampleTestCaseNode;
  })();
  DocumentationNode = (function() {
    __extends(DocumentationNode, TestContainerNode);
    DocumentationNode.prototype.name = 'Documentation';
    function DocumentationNode(parent, objectName, blockFunction) {
      this.parent = parent;
      this.objectName = objectName;
      DocumentationNode.__super__.constructor.apply(this, arguments);
    }
    DocumentationNode.prototype["function"] = function() {
      var node;
      this.children.push(node = (function(func, args, ctor) {
        ctor.prototype = func.prototype;
        var child = new ctor, result = func.apply(child, args);
        return typeof result === "object" ? result : child;
      })(FunctionDocumentationNode, [this].concat(__slice.call(arguments)), function() {}));
      return node;
    };
    DocumentationNode.prototype.document = function() {
      throw "Can't next documentations!";
    };
    DocumentationNode.prototype.describe = function(text) {
      var node;
      this.children.push(node = new TextNode(this, text));
      return node;
    };
    return DocumentationNode;
  })();
  FunctionDocumentationNode = (function() {
    var k, _fn, _i, _len, _ref;
    __extends(FunctionDocumentationNode, DocumentationNode);
    FunctionDocumentationNode.prototype.name = 'FunctionDocumentation';
    function FunctionDocumentationNode(parent, rawSignature, blockFunction) {
      this.parent = parent;
      this.rawSignature = rawSignature;
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
      return "" + (this.key()) + "(" + (this.paramsList()) + ")";
    };
    FunctionDocumentationNode.prototype.signature = function() {
      return "" + (this.parentName()) + "." + (this.callSignature());
    };
    FunctionDocumentationNode.prototype.identifier = function() {
      return "" + (this.parentName()) + "." + (this.key());
    };
    FunctionDocumentationNode.prototype.key = function() {
      return this.rawSignature;
    };
    FunctionDocumentationNode.prototype.parentName = function() {
      var current, k, next, _i, _len, _ref;
      current = this;
      while ((next = current.parent) && next !== current) {
        _ref = ['documentName', 'objectName', 'caseName'];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          k = _ref[_i];
          if (next[k] != null) {
            return next[k];
          }
        }
        current = next;
      }
      return "global";
    };
    _ref = ['key', 'parentName'];
    _fn = __bind(function(k) {
      var basic, storageKey;
      basic = this.prototype[k];
      storageKey = "_" + k;
      return this.prototype[k] = function() {
        if (this[storageKey] == null) {
          this[storageKey] = this._traverseIdentifier(basic.apply(this, arguments));
        }
        return this[storageKey];
      };
    }, FunctionDocumentationNode);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      k = _ref[_i];
      _fn(k);
    }
    FunctionDocumentationNode.prototype.paramsList = function() {
      var k, list, v;
      list = [
        (function() {
          var _ref2, _results;
          _ref2 = this.paramTypes;
          _results = [];
          for (k in _ref2) {
            v = _ref2[k];
            _results.push(k);
          }
          return _results;
        }).call(this)
      ];
      return list.join(', ');
    };
    return FunctionDocumentationNode;
  }).call(this);
  BaseNode = (function() {
    __extends(BaseNode, Node);
    BaseNode.prototype.name = 'Base';
    function BaseNode(documentName, blockFunction) {
      this.documentName = documentName;
      this.parent = false;
      this.children = [];
      if ((blockFunction != null) && typeof blockFunction === 'function') {
        blockFunction.call(this);
      }
    }
    BaseNode.prototype.title = function(documentName) {
      this.documentName = documentName;
    };
    BaseNode.prototype.document = function() {
      var node;
      this.children.push(node = (function(func, args, ctor) {
        ctor.prototype = func.prototype;
        var child = new ctor, result = func.apply(child, args);
        return typeof result === "object" ? result : child;
      })(DocumentationNode, [this].concat(__slice.call(arguments)), function() {}));
      return node;
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
