class TableOfContentsNode
  @handelize: (text) ->
    text
    .toLowerCase()
    .split('(')[0]
    .split(':')[0]
    .replace(/[\'\"\(\)\[\]]/g, '')
    .replace(/\W/g, ' ')
    .replace(/\ +/g, '-')
    .replace(/(-+)$/g, '')
    .replace(/^(-+)/g, '')

  @extractSignature: (text) -> text.split(':')[0].trim()

  parent: null
  class: ""
  constructor: (@depth, @text, @searchable) ->
    @children = []
    @_extractSignature()

  addChild: (child) ->
    @_clearMemos()
    @children.push child
    child.parent = @
    if @id.length > 0
      child.id = @id + "-" + child.baseID
    grandChildren = child.children.splice(0, child.children.length)
    for grandChild in grandChildren
      child.addChild grandChild
    child

  index: ->
    if !@_index
      @_index = {}
      q = [@]
      while q.length > 0
        item = q.shift()
        q.push child for child in item.children
        @_index[item.handle] = item.id if item.handle
    @_index

  root: ->
    if !@_root
      current = @
      current = current.parent while current.parent
      @_root = current
    @_root

  autolink: (linkContents) ->
    signature = @constructor.extractSignature(linkContents)
    handle = @constructor.handelize(signature)
    console.log "Checking #{signature}, #{handle}"
    index = @index()
    rootIndex = @root().index()
    id = index[signature] || index[handle] || rootIndex[signature] || rootIndex[handle]
    if id?
      console.log "#{linkContents} -> #{id}"
      "<a href=\"#{id}\">#{linkContents}</a>"
    else
      linkContents

  _extractSignature: ->
    @text = @constructor.extractSignature(@text)
    handle = @constructor.handelize(@text)
    @class =
      if @searchable
        switch @depth
          when 1
            ""
          when 2
            "class"
          when 3
            if @text.match /^.+\(.*\).*$/
              "function"
            else
              "property"
          else
            ""
      else
        ""
    @baseID = @id = handle

  _clearMemos: ->
    delete @_index
    delete @_root

class TableOfContents extends TableOfContentsNode
  parent: false

  constructor: ->
    super(0, "")
    @id = ""
    @_root = @

  merge: (subjects...) ->
    @_clearMemos()
    for subject in subjects
      @addChild child for child in subject.children
    @

  _extractSignature: ->

module.exports = {TableOfContents, TableOfContentsNode}
