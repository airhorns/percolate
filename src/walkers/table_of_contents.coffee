InstanceMethodWalker = require './instance_method'

module.exports = class TableOfContentsWalker extends InstanceMethodWalker
  @getTableOfContents: (tree) ->
    walker = new TableOfContentsWalker

    tree.traverse(walker)
    walker.tableOfContents()
  
  constructor: () -> @toc = []
  tableOfContents: () -> @toc
  
  enterFunctionDocumentation: (node) -> 
    parentKeys = @toc[node.parentName()] ||= []
    parentKeys.push 
      anchor: node.identifier()
      name: node.callSignature()
    false
