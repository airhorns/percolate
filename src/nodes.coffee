fs = require 'fs'
path = require 'path'
hljs = require 'highlight.js'
ghm = require "github-flavored-markdown"
eco = require "eco"
assert = require "assert"
util = require 'util'

IdentifierWalker = require './walkers/identifier'
FunctionSignatureParser = require '../lib/parsers/function_signature'

Highlight = (str) ->
  hljs.highlight('javascript', str).value

# Nodes
# =====
class LeafNode
  constructor: (@parent) ->
    @name = @constructor.__nodeName ||= @constructor.name.replace('Node', '')

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

  _traverseIdentifier: (nameOrTree) ->
    if typeof nameOrTree is 'string'
      nameOrTree
    else
      IdentifierWalker.getIdentifier(nameOrTree)

class TextNode extends LeafNode
  constructor: (@parent, @text) -> 
    super
    true

class ReferenceNode extends LeafNode
  constructor: (@parent, @reference) ->
    super

  identifier: -> 
    @_reference ||= @_traverseIdentifier(@reference)

class ConsoleNode extends LeafNode
  outputValue: ->
    unless @output?
      context = {}
      @safeCall(setup, context) for setup in @parent.setups()
      @output = @safeCall(@inputFunction, context)
    @output
  
  safeCall: (f, context) ->
    try
      f.call(context)
    catch e
      console.error f.toString()
      throw e
    
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
  see: (identifier) ->
    @children.push node = new ReferenceNode(@, identifer)
    node
  
class TestCaseNode extends TestContainerNode
  constructor: (@parent, @caseName, caseFunction) ->
    super

  identifier: -> @_renderedCaseName ||= @_traverseIdentifier(@caseName)

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
  constructor: (@parent, @objectName, blockFunction) ->
    super

  identifier: -> @_renderedObjectName ||= @_traverseIdentifier(@objectName)

  function: () -> 
    @children.push node = new FunctionDocumentationNode(@, arguments...)
    node
  document: () -> throw new Error("Can't nest documentations!")
  describe: (text) ->
    @children.push node = new TextNode(@, text)
    node
  
  identifier: -> 
    @_renderedObjectName ||= @_traverseIdentifier(@objectName)
    @_renderedObjectName

class FunctionDocumentationNode extends DocumentationNode

  constructor: (@parent, @rawSignature, blockFunction) ->
    @paramTypes = {}
    @_parseSignature(@rawSignature)
    super
  
  function: -> throw new Error("Can't nest function descriptions!")
  document: -> throw new Error("Break out of this function description before trying to document something else!")
  
  _parseSignature: (raw) ->
    passed = @_traverseIdentifier(raw)
    CST = FunctionSignatureParser.parse(passed)

    currentKey = ""
    currentType = ""
    
    # Walk over the CST of the function signature, pulling out 
    # the name of the function from the FunctionName node, and the key: type pairs from
    # the Argument nodes.
    walker =
      traversesTextNodes: false
      enteredNode: (node) =>
        switch node.name
          when 'SyntaxError'
            throw new Error(node.message())
          when '#document'
            if node.children.length == 0
              node.error = "Couldn't parse function signature! Should be of the form: get(argument, argument2)"
              throw new Error(node.message())
            else
              true
          when 'FunctionName'
            @rawSignature = node.innerText()
          when 'Argument'
            # node.children[0] is an ArgumentName node
            # node.children[3] is an ArgumentType node
            node.children[0].traverse(walker)
            node.children[3].traverse(walker)
            @param(currentKey, currentType)
            currentKey = ""
            currentType = ""
            false
          when 'ArgumentName'
            currentKey = node.innerText()
            false
          when 'NormalType', 'BracketedType'
            currentType = node.innerText()
            false
          else
            true

    CST.traverse walker

  param: (key, type) ->
    @paramTypes[key] = type

  params: (params) ->
    for key, type of params
      @param(key, type)
    params
  
  callSignature: ->
    "#{@key()}(#{@paramsList()})"

  signature: ->
    "#{@parentName()}.#{@callSignature()}"
  
  identifier: ->
    "#{@parentName()}.#{@key()}"
  
  key: -> @rawSignature
    
  parentName: ->
    current = @
    while (next = current.parent) && next != current
      for k in ['documentName', 'objectName', 'caseName']
        return next[k] if next[k]?
        
      current = next

    return "global"
  
  # Wrap the two functions which might need traversal in that traversal, and cache the results.
  for k in ['key', 'parentName']
    do (k) =>
      basic = @::[k]
      storageKey = "_#{k}"
      @::[k] = -> 
        @[storageKey] ||= @_traverseIdentifier(basic.apply(@,arguments))

  paramsList: ->
    list = [k for k, v of @paramTypes]
    list.join(', ')
  
class BaseNode extends Node
  constructor: (@documentName, blockFunction) ->
    @name = 'Base'
    @parent = false
    @children = []
    blockFunction.call(@) if blockFunction? and typeof blockFunction is 'function'
  title: (@documentName) ->
  document: () ->
    @children.push node = new DocumentationNode(@, arguments...)
    node

  identifier: -> @_renderedDocumentName ||= @_traverseIdentifier(@documentName)
module.exports = {Node, LeafNode, TextNode, AssertionNode, ConsoleNode, MultiConsoleNode, ExampleTestCaseNode, TestCaseNode, DocumentationNode, FunctionDocumentationNode, BaseNode}
