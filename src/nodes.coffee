fs = require 'fs'
path = require 'path'
hljs = require 'highlight.js'
ghm = require "github-flavored-markdown"
eco = require "eco"
assert = require "assert"
util = require 'util'

Highlight = (str) ->
  hljs.highlight('javascript', str).value

# Nodes
# =====
class LeafNode
  constructor: (@parent) ->
  traverse: (walker) ->
    if !walker.enteredNode or walker.enteredNode(@) != false
      for child in @children || []
        if typeof child != "string"
          child.traverse(walker)
        else if walker.traversesTextNodes
          walker.enteredNode(child)
          walker.exitedNode(child)

      if walker.exitedNode
        walker.exitedNode(@)

class Node extends LeafNode
  constructor: (@parent) ->
    @children = []
    super
    block = arguments[arguments.length - 1]
    if typeof block is 'function'
      block.call(@)

class TextNode extends LeafNode
  constructor: (@parent, @text) -> 
    super

class ReferenceNode extends LeafNode
  constructor: (@parent, @context, @node) ->
    super

  identifier: -> "#{@context}.#{@node}"

class ConsoleNode extends LeafNode
  outputValue: ->
    unless @output?
      context = {}
      setup.call(context) for setup in @parent.setups()
      @output = @inputFunction.call(context)
    @output

class AssertionNode extends ConsoleNode
  constructor: (@parent, @inputFunction, @assertion) ->
    super

  success: ->
    return @assertion.call(@, @outputValue())
  
class ShowNode extends ConsoleNode
  constructor: (@parent, @inputFunction) ->
    @parent.setup @inputFunction
    super

class MultiConsoleNode extends Node

class TestContainerNode extends Node
  constructor: (@parent) ->
    @setupFunctions = []
    super

  setups: ->
    if @parent.setups?
      @parent.setups().concat(@setupFunctions)
    else
      @setupFunctions

  setup: (f) ->
    @setupFunctions.push f
  show: () ->
    @children.push node = new ShowNode(@, arguments...)
    node
  example: () ->
    @children.push node = new ExampleTestCaseNode(@, arguments...)
    node
  test: () ->
    @children.push node = new TestCaseNode(@, arguments...)
    node
  see: (context, node) ->
    @children.push node = new ReferenceNode(@, context, node)
    node
  
class TestCaseNode extends TestContainerNode
  constructor: (@parent, @name, caseFunction) ->
    super

  # API in which docs are written
  explain: (string) ->
    @children.push node = new TextNode(@, string)
    node

  # Assertions
  for k in ['equal', 'notEqual', 'deepEqual', 'notDeepEqual', 'strictEqual', 'notStrictEqual']
    do (k) =>
      @::[k] = (expected, actualFunction) ->
        self = this
        @children.push node = new AssertionNode @, actualFunction, (actualValue) ->
          try
            assert[k](actualValue, expected)
            return true
          catch e
            self.error = e
            return false
        node

  ok: (actualFunction) ->
    @equal true, actualFunction
  
  param: (name, type) ->

class ExampleTestCaseNode extends TestCaseNode
  displayAssertions: true

class DocumentationNode extends TestContainerNode
  constructor: (@parent, @name, blockFunction) ->
    super
  function: () -> 
    @children.push node = new FunctionDocumentationNode(@, arguments...)
    node
  document: () -> throw "Can't next documentations!"
  describe: (text) ->
    @children.push node = new TextNode(@, text)
    node

class FunctionDocumentationNode extends DocumentationNode
  constructor: (@parent, @key, blockFunction) ->
    @paramTypes = {}
    super

  function: -> throw "Can't nest function descriptions!"
  document: -> throw "Break out of this function description before trying to document something else!"

  param: (key, type) ->
    @paramTypes[key] = type

  params: (params) ->
    for key, type of params
      @param(key, type)
    params
  
  callSignature: ->
    "#{@key}(#{@paramsList()})"

  signature: ->
    "#{@parentName()}.#{@callSignature()}"
  
  identifier: ->
    "#{@parentName()}.#{@key}"

  parentName: ->
    current = @
    while (next = current.parent) && next != current
      return next.name if next.name?
      current = next

    return "global"

  paramsList: ->
    list = [k for k, v of @paramTypes]
    list.join(', ')

class BaseNode extends Node
  constructor: (@name, blockFunction) ->
    @parent = false
    @children = []
    blockFunction.call(@) if blockFunction? and typeof blockFunction is 'function'
  title: (@name) ->
  document: () ->
    @children.push node = new DocumentationNode(@, arguments...)
    node


module.exports = {Node, LeafNode, TextNode, AssertionNode, ExampleTestCaseNode, TestCaseNode, DocumentationNode, FunctionDocumentationNode, BaseNode}
