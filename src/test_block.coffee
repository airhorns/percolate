CoffeeScript = require 'coffee-script'

try
  CoffeeScript.Nodes = require 'coffee-script/lib/coffee-script/nodes'
catch e
  CoffeeScript.Nodes = require 'coffee-script/lib/nodes'

True = "true"
Empty = ""

warnWithLines = (text) ->
  lines = text.split('\n')
  maxDigits = ("" + lines.length).length
  pad = (i) ->
    chars = (' ' for x in [0...(maxDigits - "#{i}".length)])
    chars.push(i)
    chars.join('')
  for line, i in lines
    console.warn "#{pad(i + 1)}: #{line}"
  true

module.exports = class TestBlock
  extractFunctionNames: ['ok', 'equal', 'equals', 'deepEqual', 'strictEqual', 'show', 'test', 'asyncTest']

  @for: (text, lang, evaluate) ->
    klass = switch lang
      when 'coffee', 'coffeescript' then CoffeeTestBlock
      when 'js', 'javascript' then JavaScriptTestBlock
      else DefaultTestBlock
    new klass(text, evaluate)

  constructor: (@text, @evaluate = true) ->
    @statements = []
    @parse()

  eval: (script) -> eval(script)

class DefaultTestBlock extends TestBlock
  parse: ->

class CoffeeTestBlock extends TestBlock
  defaultCoffeeOptions:
    bare: true

  constructor: (text) ->
    super
    @script = CoffeeScript.compile text
    @eval(@script) if @evaluate

  parse: ->
    try
      @coffeeNodes = CoffeeScript.nodes @text, @defaultCoffeeOptions
    catch e
      console.warn "Compile error in block:"
      warnWithLines(@text)
      throw e

    # Phase 1: collect interesting statements into @statements
    @coffeeNodes.traverseChildren true, (child) =>
      nodeType = child.constructor.name
      if nodeType is 'Call'
        functionName = child.variable?.base?.value
        if functionName && ~@extractFunctionNames.indexOf(functionName)
          @[functionName](child)
      true

    # Phase 2: for all interesting statements, override the compile function of the nodes
    # those statements reference to capture the compiled output. We do it like this
    # because it means the compilation happens in the context of where the nodes actually are,
    # meaning `compile` gets the arguments it should and whatnot. We just interject a little
    # logic to grab the output.
    for statement in @statements
      for k in ['in', 'out', 'message'] when (node = statement[k])? and node.compile?
        do (node, statement, k) =>
          __super__ = node.compile
          node.compile = ->
            result = statement[k] = __super__.apply(@, arguments)
            result

    # Trigger compilation for phase 2.
    @coffeeNodes.compile @defaultCoffeeOptions

    # Phase 3: rewrite the out of a statement to include the assertion message if present.
    for statement in @statements
      if statement.message
        statement.out = "#{statement.out} // #{statement.message.slice(1, -1)}"
      delete statement.message

  ok: (call) ->
    @statements.push
      in: call.args[0]
      out: True
      message: call.args[1]
  equal: (call) ->
    @statements.push
      in: call.args[0]
      out: call.args[1]
      message: call.args[2]
  equals: @::equal
  deepEqual: @::equal
  strictEqual: @::equal

  show: (call) ->
    @statements.push
      in: call.args[0]
      out: Empty

  test: (call) ->
    @name = call.args[0].compile(@defaultCoffeeOptions).slice(1, -1)

  asyncTest: @::test

class JavaScriptTestBlock extends TestBlock
    constructor: (text) ->
      super
      @script = "!function(){#{text}}()"
      @eval(@script) if @evaluate
