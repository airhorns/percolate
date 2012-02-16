class TableOfContentsNode
  parent: null

  constructor: (@depth, @text, @searchable) ->
    @children = []

  addChild: (child) ->
    @children.push child
    child.parent = @
    child

  duplicate: ->
    duplicate = new @constructor(@depth, @text, @searchable)
    duplicate.addChild child.duplicate() for child in @children
    duplicate

class TableOfContents extends TableOfContentsNode
  parent: false
  root: true

  constructor: -> super(0, "")

  merge: (subjects...) ->
    root = new TableOfContents
    subjects.unshift(@)
    for subject in subjects
      root.addChild child for child in subject.duplicate().children
    root

module.exports = {TableOfContents, TableOfContentsNode}
