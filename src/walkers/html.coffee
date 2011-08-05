InstanceMethodWalker = require './instance_method'

module.exports = class HtmlWalker extends InstanceMethodWalker
  @getString: (tree) ->
    walker = new HtmlWalker
    tree.traverse(walker)
    return walker.output()
  
  constructor: ->
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
  enteredStr: (node) -> @buf.push node.innerText(); false
  enteredEmph: (node) -> @buf.push '<em>'; true
  exitedEmph: (node) -> @buf.push '</em>'; true
  enteredStrong: (node) -> @buf.push '<strong>'; true
  exitedStrong: (node) -> @buf.push '</strong>'; true
  enteredCode: (node) -> @buf.push '<code>'
  exitedCode: (node) -> @buf.push '</code>'
  enteredSpace: (node) -> @buf.push ' '
