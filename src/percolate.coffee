fs = require 'fs'
path = require 'path'
{markdown} = require 'markdown'
hljs = require 'highlight.js'
ghm = require "github-flavored-markdown"
eco = require "eco"
assert = require "assert"
util = require 'util'

Highlight = (str) ->
  hljs.highlight('javascript', str).value

class Spy
  constructor: (original) ->
    @called = false
    @callCount = 0
    @calls = []
    @original = original
    @fixedReturn = false

  whichReturns: (value) ->
    @fixedReturn = true
    @fixedReturnValue = value
    @

# Simple mock function implementation stolen from Jasmine.
# Use `createSpy` to get back a function which tracks if it has been
# called, how many times, with what arguments, and optionally returns
# something specific. Example:
#
#    observer = createSpy()
#
#    object.on('click', observer)
#    object.fire('click', {foo: 'bar'})
#
#    equal observer.called, true
#    equal observer.callCount, 1
#    deepEqual observer.lastCallArguments, [{foo: 'bar'}]
#
createSpy = (original) ->
  spy = new Spy(original)

  f = (args...) ->
    f.called = true
    f.callCount++
    f.lastCall =
      context: this
      arguments: args

    f.lastCallArguments = f.lastCall.arguments
    f.lastCallContext = f.lastCall.context
    f.calls.push f.lastCall
    
    unless f.fixedReturn
      f.original?.call(this, args...)
    else
      f.fixedReturnValue

  for k, v of spy
    f[k] = v

  f

# `spyOn` can also be used as a shortcut to create or replace a
# method on an existing object with a spy. Example:
#
#    object = new DooHickey
#
#    spyOn(object, 'doStuff')
#
#    equal object.doStuff.callCount, 0
#    object.doStuff()
#    equal object.doStuff.callCount, 1
#
spyOn = (obj, method) ->
  obj[method] = createSpy(obj[method])

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
    @children.push new ShowNode(@, arguments...)
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
  for k in ['equal', 'notEqual', 'deepEqual', 'notDeepEqual', 'strictEqual', 'notStrictEqual']
    do (k) =>
      @::[k] = (expected, actualFunction) ->
        self = this
        @children.push new AssertionNode @, actualFunction, (actualValue) ->
          try
            assert[k](actualValue, expected)
            return true
          catch e
            self.error = e
            return false

  ok: (actualFunction) ->
    @equal true, actualFunction
  
  param: (name, type) ->

class ExampleTestCaseNode extends TestCaseNode
  displayAssertions: true

class DocumentationNode extends TestContainerNode
  constructor: (@parent, @name, blockFunction) ->
    super
  function: () -> 
    @children.push new FunctionDocumentationNode(@, arguments...)
  document: () ->
    @children.push new DocumentationNode(@, arguments...)
  describe: (text) ->
    @children.push new TextNode(@, text)

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

class MultiConsoleTransformation extends Walker
  walk: (root) ->
    if root.children?
      # Do lower nodes first so the root's children are stable.
      @walk(node) for node in root.children
      while @replace(root) 
        true
    true

  splice: (node, start, count) ->
    multi = new MultiConsoleNode(node.parent)
    multi.children = node.children.splice(start, count, multi)
    multi
  
  replace: (root) ->
    start = 0
    count = 0
    # Buffer all the assertion nodes into one MultiConsoleNode
    for node, index in root.children
      if node instanceof ConsoleNode
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
  
  transformations: [new MultiConsoleTransformation]
  
  visit: (node) ->
    if node.rendered
      # Something else has already rendered this node.
      return true
    else
      # Get the name of the render function and then call it (or error if it doesn't exist)
      current = node
      loop
        renderer = "render#{current.constructor.name}"
        if @[renderer]?
          break
        else
          current = node.constructor.__super__
          if not current?
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
  renderConsoleNode: (node) ->
    """
     
    #{@renderConsole(node)}
    
    """
  renderMultiConsoleNode: (multi) -> 
    out = for node in multi.children
      node.rendered = true
      @renderConsole(node)
    """
    
    #{out.join('')}
    
    """

  renderReferenceNode: (node) -> "\n*see #{node.identifier()}*\n\n"
    
  renderFunction: (f) ->
    text = f.toString().replace(whitespace_rx, ' ').trim()
    matches = return_val_rx.exec(text)
    matches[1]

  renderAssertionConsole: (node) -> 
    "    js> #{Highlight(@renderFunction(node.actualFunction))}\n    #{Highlight(node.actualValue())}\n"

  render: (node) ->
    @output = []
    @walk(node)
    @output.join('')

class HTMLOutputWalker extends MarkdownOutputWalker
  OutputTemplate = fs.readFileSync(path.join(__dirname, '..', 'templates', 'index.html.eco')).toString()

  constructor: ->
    @objects = {}
    super
  
  visit: (node) ->
    switch node.constructor.name
      when 'FunctionDocumentationNode'
        keys = (@objects[node.parentName()] ||= [])
        keys.push {anchor: @idSafe(node.identifier()), name: node.callSignature()}
    super

  renderBaseNode: (node) -> 
    @wrapHTML "<h1 class=\"base\">#{node.name}</h1>"
  renderDocumentationNode: (node) -> 
    @wrapHTML "<h2 class=\"object\">#{node.name}</h2>"
  renderFunctionDocumentationNode: (node) -> 
    @wrapHTML "<h3 class=\"function\" id=#{@idSafe(node.identifier())}>#{node.callSignature()}</h3>"
  renderReferenceNode: (node) -> 
    "\nsee <a href=\"##{@idSafe(node.identifier())}\">#{node.identifier()}</a>"
  renderConsoleNode: (node) ->
    @wrapConsole(@renderConsole(node))
  renderMultiConsoleNode: (multi) -> 
    out = for node in multi.children
      node.rendered = true
      @renderConsole(node)
    @wrapConsole out.join('')
 
  renderConsole: (node) -> 
    "js> #{Highlight(@renderFunction(node.inputFunction))}\n#{Highlight(util.inspect(node.outputValue()))}\n"
  wrapConsole: (str) -> 
    @wrapHTML """
    <pre><code>#{str}</code></pre>
    """
  wrapHTML: (str) ->
    """
    
    #{str}
    
    """

  idSafe_rx = /[^\.\:a-zA-Z0-9_-]/g
  idSafe: (str) ->
    str.replace(idSafe_rx, '_')

  render: (node) ->
    markdownishOutput = super
    data = 
      title: node.name
      body: ghm.parse(markdownishOutput)
      tableOfContents: @objects 
    eco.render OutputTemplate, data
  
  renderToFile: (test, filename) ->
    fs.writeFileSync(filename, @render(test))

Document = (name, filename, block) ->
  if !block?
    block = filename
  node = new BaseNode(name, block)
  markdownRenderer = new HTMLOutputWalker
  if filename?
    markdownRenderer.renderToFile(node, filename)
  else
    console.log markdownRenderer.render(node)
  true

module.exports = {Node, LeafNode, TextNode, AssertionNode, ExampleTestCaseNode, TestCaseNode, DocumentationNode, FunctionDocumentationNode, BaseNode, Walker, MultiConsoleTransformation, TestRunnerWalker, MarkdownOutputWalker, HTMLOutputWalker, document: Document, createSpy, spyOn}
