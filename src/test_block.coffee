CoffeeScript = require 'coffee-script'
CoffeeScript.Nodes = require 'coffee-script/lib/nodes'
True = CoffeeScript.nodes "true"
Empty = CoffeeScript.nodes "{}"
global.show = ->

module.exports = class TestBlock
  extractFunctionNames: ['ok', 'equal', 'equals', 'deepEqual', 'strictEqual', 'show']

  @for: (text, lang) ->
    klass = switch lang
      when 'coffee', 'coffeescript' then CoffeeTestBlock
      when 'js', 'javascript' then JavaScriptTestBlock
      else throw new Error("Can't parse lang #{lang} for percolate blocks, sorry.")
    new klass(text)

  constructor: (@text) ->
    @statements = []
    @parse()

  eval: (script) -> eval(script)

class CoffeeTestBlock extends TestBlock
  defaultCoffeeOptions:
    bare: true

  constructor: (text) ->
    super
    @script = CoffeeScript.compile text
    @eval(@script)

  parse: ->
    @coffeeNodes = CoffeeScript.nodes @text, @defaultCoffeeOptions
    @coffeeNodes.traverseChildren true, (child) =>
      nodeType = child.constructor.name
      if nodeType is 'Call'
        functionName = child.variable?.base?.value
        if functionName && ~@extractFunctionNames.indexOf(functionName)
          @[functionName](child)
      true

    for statement in @statements
      for k in ['in', 'out', 'message'] when statement[k]?
        do (k, statement) =>
          __super__ = statement[k].compile
          statement[k].compile = ->
            return statement[k] = __super__.apply(@, arguments)
    @coffeeNodes.compile @defaultCoffeeOptions

    for statement in @statements
      if statement.message
        statement.out = "// #{statement.message.slice(1, -1)} \n #{statement.out}"
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

class JavaScriptTestBlock extends TestBlock
    constructor: (text) ->
      super
      @script = "!function(){#{text}}()"
      @eval(@script)
