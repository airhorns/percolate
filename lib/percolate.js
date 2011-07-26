(function() {
  var AssertionNode, BaseNode, Document, DocumentationNode, ExampleTestCaseNode, FunctionDocumentationNode, HTMLOutputWalker, Highlight, LeafNode, MarkdownOutputWalker, MultiAssertionNode, MultiAssertionTransformation, Node, ReferenceNode, TestCaseNode, TestContainerNode, TestRunnerWalker, TextNode, TransformingWalker, Walker, fs, ghm, hljs, markdown, path;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  }, __slice = Array.prototype.slice;
  fs = require('fs');
  path = require('path');
  markdown = require('markdown').markdown;
  hljs = require('highlight.js');
  ghm = require("github-flavored-markdown");
  Highlight = function(str) {
    return hljs.highlight('javascript', str).value;
  };
  LeafNode = (function() {
    function LeafNode(parent) {
      this.parent = parent;
    }
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
    return ReferenceNode;
  })();
  AssertionNode = (function() {
    __extends(AssertionNode, LeafNode);
    function AssertionNode(parent, actualFunction, assertion) {
      this.parent = parent;
      this.actualFunction = actualFunction;
      this.assertion = assertion;
      AssertionNode.__super__.constructor.apply(this, arguments);
    }
    AssertionNode.prototype.success = function() {
      return this.assertion.call(this, this.actualValue());
    };
    AssertionNode.prototype.actualValue = function() {
      var context, setup, _i, _len, _ref;
      if (this.actual == null) {
        context = {};
        _ref = this.parent.setups();
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          setup = _ref[_i];
          setup.call(context);
        }
        this.actual = this.actualFunction.call(context);
      }
      return this.actual;
    };
    return AssertionNode;
  })();
  MultiAssertionNode = (function() {
    __extends(MultiAssertionNode, Node);
    function MultiAssertionNode() {
      MultiAssertionNode.__super__.constructor.apply(this, arguments);
    }
    return MultiAssertionNode;
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
    __extends(TestCaseNode, TestContainerNode);
    function TestCaseNode(parent, name, caseFunction) {
      this.parent = parent;
      this.name = name;
      TestCaseNode.__super__.constructor.apply(this, arguments);
    }
    TestCaseNode.prototype.explain = function(string) {
      return this.children.push(new TextNode(this, string));
    };
    TestCaseNode.prototype.equal = function(expected, actualFunction) {
      return this.children.push(new AssertionNode(this, actualFunction, function(value) {return value == expected;}));
    };
    TestCaseNode.prototype.notEqual = function(expected, actualFunction) {
      return this.children.push(new AssertionNode(this, actualFunction, function(value) {return value != expected;}));
    };
    TestCaseNode.prototype.strictEqual = function(expected, actualFunction) {
      return this.children.push(new AssertionNode(this, actualFunction, function(value) {
        return value === expected;
      }));
    };
    TestCaseNode.prototype.notStrictEqual = function(expected, actualFunction) {
      return this.children.push(new AssertionNode(this, actualFunction, function(value) {
        return value !== expected;
      }));
    };
    TestCaseNode.prototype.param = function(name, type) {};
    return TestCaseNode;
  })();
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
    FunctionDocumentationNode.prototype.description = function(text) {
      return this.children.push(new TextNode(this, text));
    };
    return FunctionDocumentationNode;
  })();
  BaseNode = (function() {
    __extends(BaseNode, Node);
    function BaseNode(name, blockFunction) {
      this.name = name;
      BaseNode.__super__.constructor.apply(this, arguments);
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
  Walker = (function() {
    function Walker() {}
    Walker.prototype.walk = function(root) {
      var node, result, _i, _len, _ref;
      result = this.visit(root);
      if (root.children != null) {
        _ref = root.children;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          node = _ref[_i];
          result = this.walk(node) && result;
        }
      }
      return result;
    };
    Walker.prototype.visit = function(node) {
      throw new Error("Must override 'visit' on walker subclasses!");
    };
    return Walker;
  })();
  TestRunnerWalker = (function() {
    __extends(TestRunnerWalker, Walker);
    function TestRunnerWalker() {
      TestRunnerWalker.__super__.constructor.apply(this, arguments);
    }
    TestRunnerWalker.prototype.visit = function(node) {
      if (node.success != null) {
        return node.success();
      } else {
        return true;
      }
    };
    return TestRunnerWalker;
  })();
  MultiAssertionTransformation = (function() {
    __extends(MultiAssertionTransformation, Walker);
    function MultiAssertionTransformation() {
      MultiAssertionTransformation.__super__.constructor.apply(this, arguments);
    }
    MultiAssertionTransformation.prototype.walk = function(root) {
      var node, _i, _len, _ref;
      if (root.children != null) {
        _ref = root.children;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          node = _ref[_i];
          this.walk(node);
        }
        while (this.replace(root)) {
          true;
        }
      }
      return true;
    };
    MultiAssertionTransformation.prototype.splice = function(node, start, count) {
      var multi;
      multi = new MultiAssertionNode(node.parent);
      multi.children = node.children.splice(start, count, multi);
      return multi;
    };
    MultiAssertionTransformation.prototype.replace = function(root) {
      var count, index, node, start, _len, _ref;
      start = 0;
      count = 0;
      _ref = root.children;
      for (index = 0, _len = _ref.length; index < _len; index++) {
        node = _ref[index];
        if (node instanceof AssertionNode) {
          if (count === 0) {
            start = index;
          }
          count += 1;
        } else if (count === 1) {
          count = 0;
        } else if (count > 1) {
          break;
        }
      }
      if (count > 1) {
        this.splice(root, start, count);
        return true;
      } else {
        return false;
      }
    };
    return MultiAssertionTransformation;
  })();
  TransformingWalker = (function() {
    __extends(TransformingWalker, Walker);
    function TransformingWalker() {
      this.transformed = false;
      TransformingWalker.__super__.constructor.apply(this, arguments);
    }
    TransformingWalker.prototype.walk = function(root, first) {
      var transform, _i, _len, _ref;
      if (!this.transformed) {
        _ref = this.transformations;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          transform = _ref[_i];
          transform.walk(root);
        }
        this.transformed = true;
      }
      return TransformingWalker.__super__.walk.apply(this, arguments);
    };
    return TransformingWalker;
  })();
  MarkdownOutputWalker = (function() {
    var return_val_rx, whitespace_rx;
    __extends(MarkdownOutputWalker, TransformingWalker);
    return_val_rx = /function \((?:.*)\) \{(?:.*)\s*return (.*);\s*\}/m;
    whitespace_rx = /\s+/g;
    MarkdownOutputWalker.prototype.transformations = [new MultiAssertionTransformation];
    function MarkdownOutputWalker() {
      this.output = [];
    }
    MarkdownOutputWalker.prototype.visit = function(node) {
      var renderer;
      if (node.rendered) {
        return true;
      } else {
        renderer = "render" + node.constructor.name;
        if (this[renderer] == null) {
          throw new Error("Unrecognized Percolate node " + node.constructor.name + "!");
        }
        this.output.push(this[renderer](node));
        return true;
      }
    };
    MarkdownOutputWalker.prototype.renderTextNode = function(node) {
      return "\n " + node.text + " \n\n";
    };
    MarkdownOutputWalker.prototype.renderBaseNode = function(node) {
      return "# " + node.name + " \n";
    };
    MarkdownOutputWalker.prototype.renderDocumentationNode = function(node) {
      return "## " + node.name + " \n";
    };
    MarkdownOutputWalker.prototype.renderFunctionDocumentationNode = function(node) {
      return "### " + node.name + " \n";
    };
    MarkdownOutputWalker.prototype.renderTestCaseNode = function(node) {
      return "#### " + node.name + " \n";
    };
    MarkdownOutputWalker.prototype.renderExampleTestCaseNode = function(node) {
      return "#### " + node.name + " \n";
    };
    MarkdownOutputWalker.prototype.renderAssertionNode = function(node) {
      return " \n" + (this.renderAssertionConsole(node)) + "\n";
    };
    MarkdownOutputWalker.prototype.renderMultiAssertionNode = function(multi) {
      var node, out;
      out = (function() {
        var _i, _len, _ref, _results;
        _ref = multi.children;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          node = _ref[_i];
          node.rendered = true;
          _results.push(this.renderAssertionConsole(node));
        }
        return _results;
      }).call(this);
      return "\n" + (out.join('')) + "\n";
    };
    MarkdownOutputWalker.prototype.renderReferenceNode = function(node) {
      return "\n*see " + node.context + "." + node.node + "*\n\n";
    };
    MarkdownOutputWalker.prototype.renderFunction = function(f) {
      var matches, text;
      text = f.toString().replace(whitespace_rx, ' ').trim();
      matches = return_val_rx.exec(text);
      return matches[1];
    };
    MarkdownOutputWalker.prototype.renderAssertionConsole = function(node) {
      return "    js> " + (Highlight(this.renderFunction(node.actualFunction))) + "\n    " + (Highlight(node.actualValue())) + "\n";
    };
    MarkdownOutputWalker.prototype.render = function(test) {
      this.walk(test);
      return this.output.join('');
    };
    return MarkdownOutputWalker;
  })();
  HTMLOutputWalker = (function() {
    __extends(HTMLOutputWalker, MarkdownOutputWalker);
    function HTMLOutputWalker() {
      HTMLOutputWalker.__super__.constructor.apply(this, arguments);
      this.objects = [];
    }
    HTMLOutputWalker.prototype.template = function() {
      return fs.readFileSync(path.join(__dirname, '..', 'templates', 'index.html.tpl')).toString();
    };
    HTMLOutputWalker.prototype.renderAssertionNode = function(node) {
      return this.wrapConsole(this.renderAssertionConsole(node));
    };
    HTMLOutputWalker.prototype.renderMultiAssertionNode = function(multi) {
      var node, out;
      out = (function() {
        var _i, _len, _ref, _results;
        _ref = multi.children;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          node = _ref[_i];
          node.rendered = true;
          _results.push(this.renderAssertionConsole(node));
        }
        return _results;
      }).call(this);
      return this.wrapConsole(out.join(''));
    };
    HTMLOutputWalker.prototype.renderAssertionConsole = function(node) {
      return "js> " + (Highlight(this.renderFunction(node.actualFunction))) + "\n" + (Highlight('' + node.actualValue())) + "\n";
    };
    HTMLOutputWalker.prototype.wrapConsole = function(str) {
      return "\n<pre>\n  <code>" + str + "</code>\n</pre>\n";
    };
    HTMLOutputWalker.prototype.render = function(test) {
      var html, output;
      output = HTMLOutputWalker.__super__.render.apply(this, arguments);
      html = ghm.parse(output);
      return this.template().replace("%body%", html);
    };
    HTMLOutputWalker.prototype.renderToFile = function(test, filename) {
      return fs.writeFileSync(filename, this.render(test));
    };
    return HTMLOutputWalker;
  })();
  Document = function(name, block) {
    var markdownRenderer, node;
    node = new BaseNode(name, block);
    markdownRenderer = new HTMLOutputWalker;
    return markdownRenderer.renderToFile(node, './examples/simple.html');
  };
  module.exports = {
    Node: Node,
    LeafNode: LeafNode,
    TextNode: TextNode,
    AssertionNode: AssertionNode,
    ExampleTestCaseNode: ExampleTestCaseNode,
    TestCaseNode: TestCaseNode,
    DocumentationNode: DocumentationNode,
    Walker: Walker,
    MultiAssertionTransformation: MultiAssertionTransformation,
    TestRunnerWalker: TestRunnerWalker,
    MarkdownOutputWalker: MarkdownOutputWalker,
    HTMLOutputWalker: HTMLOutputWalker,
    document: Document
  };
}).call(this);
