{ConsoleNode, MultiConsoleNode} = require '../nodes'

module.exports = class MultiConsoleTransformation
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

