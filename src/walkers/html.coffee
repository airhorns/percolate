InstanceMethodWalker = require './instance_method'
TableOfContentsWalker = require './table_of_contents'


class ReferenceTransformWalker extends InstanceMethodWalker
  constructor: (@tableOfContents) ->


module.exports = class HtmlWalker extends InstanceMethodWalker
  @getString: (tree) ->
    return tree if typeof tree is 'string'
    # Get the table of contents
    tableOfContents = TableOfContentsWalker.getTableOfContents(tree)

    # Use it to convert any references into `ReferenceNodes` instead of just inline `CodeNode`s
    walker = new HtmlWalker(tableOfContents)

    tree.traverse(walker)
    return walker.output()
  
  constructor: (@tableOfContents) ->
    @buf = []
  
  for k in ['entered', 'exited']
    do (k) =>
      @::["#{k}Node"] = (node) ->
        key = "#{k}#{node.name}"
        if @[key]?
          @[key](node)
        else
          true

  output: -> @buf.join('')
  
  # Percolate control structs
  enteredBase: (node) -> 
    @buf.push "<h1 class=\"base\">"
    node.documentName.traverse(@)
    @buf.push "</h1>"
    true
  
  enteredDocumentation: (node) ->
    @buf.push "<h2 class=\"object\">"
    node.objectName.traverse(@)
    @buf.push "</h2>"
    true

  enteredFunctionDocumentation: (node) ->
    @buf.push "<h3 class=\"function\" id=\"#{@idSafe(node.identifier())}\">"
    node.objectName.traverse(@)
    @buf.push "</h3>"
    true

  enteredTestCase: (node) ->
    @buf.push "<h4>"
    node.caseName.traverse(@)
    @buf.push "</h4>"
    true
  
  # Inline wrappers
  enteredEmph: (node) -> @buf.push '<em>'; true
  exitedEmph: (node) -> @buf.push '</em>'; true
  enteredStrong: (node) -> @buf.push '<strong>'; true
  exitedStrong: (node) -> @buf.push '</strong>'; true
  enteredCode: (node) -> @buf.push '<code>'; true
  exitedCode: (node) -> @buf.push '</code>'; true

  # Simple outputs
  enteredStr: (node) -> @buf.push node.innerText(); false
  enteredNonSpaceChar: (node) -> @buf.push node.innerText(); false
  enteredSpace: (node) -> @buf.push ' '; false

  idSafe_rx = /[^\.\:a-zA-Z0-9_-]/g
  idSafe: (str) ->
    str.replace(idSafe_rx, '_')
