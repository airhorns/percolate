InstanceMethodWalker = require './instance_method'

module.exports = class IdentifierWalker extends InstanceMethodWalker
  @getIdentifier: (tree) ->
    walker = new IdentifierWalker
    tree.traverse walker
    return walker.output()

  constructor: ->
    @buf = []
  
  enteredStr: (node) -> 
    @buf.push node.innerText()
    false

  enteredNonSpaceChar: (node) -> 
    @buf.push node.innerText()
    false

  enteredSpace: (node) -> 
    @buf.push ' '
    false
  
  output: -> @buf.join('')
