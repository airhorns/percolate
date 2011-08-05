module.exports = class InstanceMethodWalker
  for k in ['entered', 'exited']
    do (k) =>
      @::["#{k}Node"] = (node) ->
        key = "#{k}#{node.name}"
        if @[key]?
          @[key](node)
        else
          true
