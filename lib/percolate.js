(function() {
  var AssertionNode, BaseNode, ConsoleNode, Document, DocumentationNode, ExampleTestCaseNode, FunctionDocumentationNode, HTMLOutputWalker, Highlight, LeafNode, MarkdownOutputWalker, MultiConsoleNode, MultiConsoleTransformation, Node, ReferenceNode, ShowNode, TestCaseNode, TestContainerNode, TestRunnerWalker, TextNode, TransformingWalker, Walker, eco, fs, ghm, hljs, markdown, path;
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
  eco = require("eco");
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
    DocumentationNode.prototype.document = function() {
      return this.children.push((function(func, args, ctor) {
        ctor.prototype = func.prototype;
        var child = new ctor, result = func.apply(child, args);
        return typeof result === "object" ? result : child;
      })(DocumentationNode, [this].concat(__slice.call(arguments)), function() {}));
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
    FunctionDocumentationNode.prototype.signature = function() {
      return "" + (this.parentName()) + "." + this.key + "(" + (this.paramsList()) + ")";
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
  MultiConsoleTransformation = (function() {
    __extends(MultiConsoleTransformation, Walker);
    function MultiConsoleTransformation() {
      MultiConsoleTransformation.__super__.constructor.apply(this, arguments);
    }
    MultiConsoleTransformation.prototype.walk = function(root) {
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
    MultiConsoleTransformation.prototype.splice = function(node, start, count) {
      var multi;
      multi = new MultiConsoleNode(node.parent);
      multi.children = node.children.splice(start, count, multi);
      return multi;
    };
    MultiConsoleTransformation.prototype.replace = function(root) {
      var count, index, node, start, _len, _ref;
      start = 0;
      count = 0;
      _ref = root.children;
      for (index = 0, _len = _ref.length; index < _len; index++) {
        node = _ref[index];
        if (node instanceof ConsoleNode) {
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
    return MultiConsoleTransformation;
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
    function MarkdownOutputWalker() {
      MarkdownOutputWalker.__super__.constructor.apply(this, arguments);
    }
    return_val_rx = /function \((?:.*)\) \{(?:.*)\s*return (.*);\s*\}/m;
    whitespace_rx = /\s+/g;
    MarkdownOutputWalker.prototype.transformations = [new MultiConsoleTransformation];
    MarkdownOutputWalker.prototype.visit = function(node) {
      var current, renderer;
      if (node.rendered) {
        return true;
      } else {
        current = node;
        while (true) {
          renderer = "render" + current.constructor.name;
          if (this[renderer] != null) {
            break;
          } else {
            current = node.constructor.__super__;
            if (!(current != null)) {
              throw new Error("Unrecognized Percolate node " + node.constructor.name + "!");
            }
          }
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
      return " \n" + (this.renderConsole(node)) + "\n";
    };
    MarkdownOutputWalker.prototype.renderMultiConsoleNode = function(multi) {
      var node, out;
      out = (function() {
        var _i, _len, _ref, _results;
        _ref = multi.children;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          node = _ref[_i];
          node.rendered = true;
          _results.push(this.renderConsole(node));
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
    MarkdownOutputWalker.prototype.render = function(node) {
      this.output = [];
      this.walk(node);
      return this.output.join('');
    };
    return MarkdownOutputWalker;
  })();
  HTMLOutputWalker = (function() {
    var OutputTemplate;
    __extends(HTMLOutputWalker, MarkdownOutputWalker);
    OutputTemplate = fs.readFileSync(path.join(__dirname, '..', 'templates', 'index.html.eco')).toString();
    function HTMLOutputWalker() {
      this.objects = {};
      HTMLOutputWalker.__super__.constructor.apply(this, arguments);
    }
    HTMLOutputWalker.prototype.visit = function(node) {
      var keys, _base, _name;
      switch (node.constructor.name) {
        case 'FunctionDocumentationNode':
          keys = ((_base = this.objects)[_name = node.parentName()] || (_base[_name] = []));
          keys.push(node);
      }
      return HTMLOutputWalker.__super__.visit.apply(this, arguments);
    };
    HTMLOutputWalker.prototype.renderBaseNode = function(node) {
      return this.wrapHTML("<h1 class=\"base\">" + node.name + "</h1>");
    };
    HTMLOutputWalker.prototype.renderDocumentationNode = function(node) {
      return this.wrapHTML("<h2 class=\"object\">" + node.name + "</h2>");
    };
    HTMLOutputWalker.prototype.renderFunctionDocumentationNode = function(node) {
      return this.wrapHTML("<h3 class=\"function\">" + node.name + "</h3>");
    };
    HTMLOutputWalker.prototype.renderConsoleNode = function(node) {
      return this.wrapConsole(this.renderConsole(node));
    };
    HTMLOutputWalker.prototype.renderMultiConsoleNode = function(multi) {
      var node, out;
      out = (function() {
        var _i, _len, _ref, _results;
        _ref = multi.children;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          node = _ref[_i];
          node.rendered = true;
          _results.push(this.renderConsole(node));
        }
        return _results;
      }).call(this);
      return this.wrapConsole(out.join(''));
    };
    HTMLOutputWalker.prototype.renderConsole = function(node) {
      return "js> " + (Highlight(this.renderFunction(node.inputFunction))) + "\n" + (Highlight('' + node.outputValue())) + "\n";
    };
    HTMLOutputWalker.prototype.wrapConsole = function(str) {
      return this.wrapHTML("<pre><code>" + str + "</code></pre>");
    };
    HTMLOutputWalker.prototype.wrapHTML = function(str) {
      return "\n" + str + "\n";
    };
    HTMLOutputWalker.prototype.render = function(node) {
      var data, markdownishOutput;
      markdownishOutput = HTMLOutputWalker.__super__.render.apply(this, arguments);
      data = {
        title: node.name,
        body: ghm.parse(markdownishOutput),
        objects: this.objects
      };
      return eco.render(OutputTemplate, data);
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
    markdownRenderer.renderToFile(node, './examples/simple.html');
    return true;
  };
  module.exports = {
    Node: Node,
    LeafNode: LeafNode,
    TextNode: TextNode,
    AssertionNode: AssertionNode,
    ExampleTestCaseNode: ExampleTestCaseNode,
    TestCaseNode: TestCaseNode,
    DocumentationNode: DocumentationNode,
    FunctionDocumentationNode: FunctionDocumentationNode,
    BaseNode: BaseNode,
    Walker: Walker,
    MultiConsoleTransformation: MultiConsoleTransformation,
    TestRunnerWalker: TestRunnerWalker,
    MarkdownOutputWalker: MarkdownOutputWalker,
    HTMLOutputWalker: HTMLOutputWalker,
    document: Document
  };
}).call(this);
