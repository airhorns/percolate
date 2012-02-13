# Library requires
fs = require 'fs'
path = require 'path'
util = require 'util'

# Local requires
InstanceMethodWalker = require './instance_method'
CSTParser = require '../../lib/parsers/percolate'

module.exports = class HtmlWalker extends InstanceMethodWalker
  @getString: (tree) ->
    return tree if typeof tree is 'string'
    walker = new HtmlWalker()

    tree.traverse(walker)
    walker.output()

  constructor: () ->
    @buf = []
    @depth = 0

  escape: (value) ->
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\x22/g, '&quot;')

  enteredNode: (node) ->
    key = "entered#{node['name']}"
    @depth++
    s = []
    s.push ' ' for i in [0..@depth]
    s.push key
    #console.error s.join('')
    if @[key]?
      @[key](node)
    else
      #console.error "Unrecognized node: #{node.name}"
      true

  exitedNode: (node) ->
    key = "exited#{node['name']}"
    @depth--
    if @[key]?
      @[key](node)

  output: -> @buf.join('')

  # When given a string, parses raw markdown string into a tree, and traverses that tree
  # When given a tree, traverses that tree.
  parseAndTraverse: (nodeOrString) ->
    if typeof nodeOrString is 'string'
      node = CSTParser.parse(nodeOrString)
    else
      node = nodeOrString
    node.traverse(@)

  # Percolate control structs
  for level, nodeName in {1: 'Base', 2: 'Documentation', 3: 'FunctionDocumentation', 4: 'TestCase'}
    do (level, nodeName) ->
      @::["entered#{nodeName}"] = (node) ->
        @buf.push "<h#{level}>"
        @parseAndTraverse(node.documentName || node.objectName || node.caseName)
        @buf.push "</h#{level}>"
        true

  enteredExampleTestCase: (node) -> @enteredTestCase(node)

  enteredConsole: (node) ->
    @buf.push "<pre><code>"
    true

  exitedConsole: (node) ->
    @buf.push "</code></pre>"

  for k in ['Assertion', 'Show']
    do (k) =>
      @::["entered#{k}"] = (node) ->
        @buf.push node.innerText
        false

  # Block wrappers
  enteredPara: (node) ->
    @buf.push '<p>'
    @renderEndLines = true
    true

  exitedPara: (node) ->
    @renderEndLines = false
    @buf.push '</p>\n\n'

  enteredVerbatim: (node) ->
    @buf.push '<pre><code>'
    @renderBlankLines = true
    true
  exitedVerbatim: (node) ->
    @renderBlankLines = false
    @buf.push '</pre></code>\n\n'

  enteredHorizontalRule: (node) ->
    @buf.push '<hr />\n\n'
    false

  # Inline wrappers
  enteredEmph: (node) -> @buf.push '<em>'; true
  exitedEmph: (node) -> @buf.push '</em>'
  enteredStrong: (node) -> @buf.push '<strong>'; true
  exitedStrong: (node) -> @buf.push '</strong>'
  enteredCode: (node) -> @buf.push '<code>'; true
  exitedCode: (node) -> @buf.push '</code>'

  enteredSymbol: (node) -> @buf.push @escape(node.innerText()); false

  enteredExplicitLink: (node) ->
    label = HtmlWalker.getString(node.children[0])
    source = @escape(HtmlWalker.getString(node.children[4]))
    title = HtmlWalker.getString(node.children[6])
    @buf.push "<a href=\"#{source}\""
    if title.length > 0
      @buf.push "title=\"#{title}\""
    @buf.push ">#{label}</a>"
    false

  # Simple outputs
  enteredStr: (node) -> @buf.push node.innerText(); false
  enteredEntity: @::enteredStr
  enteredEscapedChar: (node) -> @buf.push node.innerText().slice(1); false
  enteredNonSpaceChar: (node) -> @buf.push node.innerText(); false
  enteredSpace: (node) -> @buf.push ' '; false

  enteredIndentedLine: (node) ->
    indent = node.children[0].innerText().length
    @buf.push(@escape(node.innerText().slice(indent)))
    false

  enteredBlankLine: (node) ->
    if @renderBlankLines
      @buf.push node.innerText()
    false

  enteredEndline: (node) ->
    if @renderEndLines
      @buf.push node.innerText()
    false

  # Reference
  enteredReference: (node) -> false

  enteredPlain: (node) -> console.error("Error! Entered plain. Text: \n\n #{node.innerText()}\n\n"); true
