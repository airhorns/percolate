fs = require 'fs'
path = require 'path'
{markdown} = require 'markdown'
hljs = require 'highlight.js'
ghm = require "github-flavored-markdown"

Highlight = (str) ->
  hljs.highlight('javascript', str).value

# Nodes
# =====
class LeafNode
  constructor: (@parent) ->

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

class AssertionNode extends LeafNode
  constructor: (@parent, @actualFunction, @assertion) ->
    super

  success: ->
    return @assertion.call(@, @actualValue())
  
  actualValue: ->
    unless @actual?
      context = {}
      setup.call(context) for setup in @parent.setups()
      @actual = @actualFunction.call(context)
    @actual

class MultiAssertionNode extends Node

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
  
  example: () ->
    @children.push new ExampleTestCaseNode(@, arguments...)
  test: () ->
    @children.push new TestCaseNode(@, arguments...)
  see: (context, node) ->
    @children.push new ReferenceNode(@, context, node)
  
class TestCaseNode extends TestContainerNode
  constructor: (@parent, @name, caseFunction) ->
    super

  # API in which docs are written
  explain: (string) ->
    @children.push new TextNode(@, string)

  # Assertions
  equal: (expected, actualFunction) ->
    @children.push new AssertionNode(@, actualFunction, `function(value) {return value == expected;}`)
  notEqual: (expected, actualFunction) ->
    @children.push new AssertionNode(@, actualFunction, `function(value) {return value != expected;}`)
  strictEqual: (expected, actualFunction) ->
    @children.push new AssertionNode(@, actualFunction, (value) -> value == expected)
  notStrictEqual: (expected, actualFunction) ->
    @children.push new AssertionNode(@, actualFunction, (value) -> value != expected)
  
  param: (name, type) ->

class ExampleTestCaseNode extends TestCaseNode
  displayAssertions: true

class DocumentationNode extends TestContainerNode
  constructor: (@parent, @name, blockFunction) ->
    super
  function: () -> 
    @children.push new FunctionDocumentationNode(@, arguments...)

class FunctionDocumentationNode extends DocumentationNode
  constructor: (@parent, @key, blockFunction) ->
    @paramTypes = {}
    super

  function: -> throw "Can't nest function descriptions!"
  
  param: (key, type) ->
    @paramTypes[key] = type

  params: (params) ->
    for key, type of params
      @param(key, type)
    params
  
  description: (text) ->
    @children.push new TextNode(@, text)

class BaseNode extends Node
  constructor: (@name, blockFunction) ->
    super

  title: (@name) ->
  document: () ->
    @children.push new DocumentationNode(@, arguments...)

class Walker
  walk: (root) ->
    result = @visit(root)
    if root.children?
      for node in root.children
        result = @walk(node) && result
    result

  visit: (node) ->
    throw new Error("Must override 'visit' on walker subclasses!")

class TestRunnerWalker extends Walker
  visit: (node) -> 
    if node.success?
      node.success()
    else
      true

class MultiAssertionTransformation extends Walker
  walk: (root) ->
    if root.children?
      # Do lower nodes first so the root's children are stable.
      @walk(node) for node in root.children
      while @replace(root) 
        true
    true

  splice: (node, start, count) ->
    multi = new MultiAssertionNode(node.parent)
    multi.children = node.children.splice(start, count, multi)
    multi
  
  replace: (root) ->
    start = 0
    count = 0
    # Buffer all the assertion nodes into one MultiAssertionNode
    for node, index in root.children
      if node instanceof AssertionNode
        start = index if count == 0
        count += 1
      else if count == 1
        count = 0
      else if count > 1
        break
      
    
    # If after all the children are done we still have some in the buffer, splice those bad boys.
    if count > 1
      @splice(root, start, count)
      true
    else
      false

class TransformingWalker extends Walker
  constructor: () ->
    @transformed = false
    super

  walk: (root, first) ->
    unless @transformed 
      for transform in @transformations
        transform.walk(root)
      @transformed = true
    super

class MarkdownOutputWalker extends TransformingWalker
  return_val_rx = /function \((?:.*)\) \{(?:.*)\s*return (.*);\s*\}/m
  whitespace_rx = /\s+/g
  
  transformations: [new MultiAssertionTransformation]
  constructor: () ->
    @output = []
  
  visit: (node) ->
    if node.rendered
      # Something else has already rendered this node.
      return true
    else
      # Get the name of the render function and then call it (or error if it doesn't exist
      renderer = "render#{node.constructor.name}"
      unless @[renderer]?
        throw new Error("Unrecognized Percolate node #{node.constructor.name}!") 

      # Call the render function
      @output.push @[renderer](node)
      true
  
  renderTextNode: (node) -> "\n #{node.text} \n\n"
  renderBaseNode: (node) -> "# #{node.name} \n"
  renderDocumentationNode: (node) ->  "## #{node.name} \n"
  renderFunctionDocumentationNode: (node) ->  "### #{node.name} \n"
  renderTestCaseNode: (node) -> "#### #{node.name} \n"
  renderExampleTestCaseNode: (node) -> "#### #{node.name} \n"
  renderAssertionNode: (node) ->
    """
     
    #{@renderAssertionConsole(node)}
    
    """
  renderMultiAssertionNode: (multi) -> 
    out = for node in multi.children
      node.rendered = true
      @renderAssertionConsole(node)
    """
    
    #{out.join('')}
    
    """

  renderReferenceNode: (node) -> "\n*see #{node.context}.#{node.node}*\n\n"
    
  renderFunction: (f) ->
    text = f.toString().replace(whitespace_rx, ' ').trim()
    matches = return_val_rx.exec(text)
    matches[1]

  renderAssertionConsole: (node) -> 
    "    js> #{Highlight(@renderFunction(node.actualFunction))}\n    #{Highlight(node.actualValue())}\n"

  render: (test) ->
    @walk(test)
    @output.join('')

class HTMLOutputWalker extends MarkdownOutputWalker
  constructor: ->
    super
    @objects = []

  template: () ->
    fs.readFileSync(path.join(__dirname, '..', 'templates', 'index.html.tpl')).toString()
 
  renderAssertionNode: (node) ->
    @wrapConsole @renderAssertionConsole(node)

  renderMultiAssertionNode: (multi) -> 
    out = for node in multi.children
      node.rendered = true
      @renderAssertionConsole(node)
    @wrapConsole out.join('')
 
  renderAssertionConsole: (node) -> 
    "js> #{Highlight(@renderFunction(node.actualFunction))}\n#{Highlight('' + node.actualValue())}\n"

  wrapConsole: (str) ->
    """

    <pre>
      <code>#{str}</code>
    </pre>

    """

  render: (test) ->
    output = super
    html = ghm.parse(output)
    @template().replace("%body%", html)
  
  renderToFile: (test, filename) ->
    fs.writeFileSync(filename, @render(test))

Document = (name, block) ->
  node = new BaseNode(name, block)
  markdownRenderer = new HTMLOutputWalker
  markdownRenderer.renderToFile(node, './examples/simple.html')

module.exports = {Node, LeafNode, TextNode, AssertionNode, ExampleTestCaseNode, TestCaseNode, DocumentationNode, Walker, MultiAssertionTransformation, TestRunnerWalker, MarkdownOutputWalker, HTMLOutputWalker, document: Document}
