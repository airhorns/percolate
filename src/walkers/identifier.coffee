module.exports = class IdentifierWalker
  @getIdentifier: (tree) ->
    walker = new IdentifierWalker
    tree.traverse walker
    walker.output()

  constructor: ->
    @buf = []
  
  enteredStr: (node) -> @buf.push node.innerText(); false
  enteredNonSpaceChar: (node) -> @buf.push node.innerText(); false
  enteredSpace: (node) -> @buf.push ' '; false
  
  output: ->
    @buf.join('')
