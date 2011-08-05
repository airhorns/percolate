class MultiConsoleTransformation extends Walker
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

class TransformingWalker extends Walker
  constructor: () ->
    @transformed = false
    super

  walk: (root, first) ->
    unless @transformed 
      for transform in @transformations
        transform.walk(root)
      @transformed = true
    super

class MarkdownOutputWalker extends TransformingWalker
  return_val_rx = /function \((?:.*)\) \{(?:.*)\s*return (.*);\s*\}/m
  whitespace_rx = /\s+/g
  
  transformations: [new MultiConsoleTransformation]
  
  visit: (node) ->
    if node.rendered
      # Something else has already rendered this node.
      return true
    else
      # Get the name of the render function and then call it (or error if it doesn't exist)
      current = node
      loop
        renderer = "render#{current.constructor.name}"
        if @[renderer]?
          break
        else
          current = node.constructor.__super__
          if not current?
            throw new Error("Unrecognized Percolate node #{node.constructor.name}!") 

      # Call the render function
      @output.push @[renderer](node)
      true
  
  renderTextNode: (node) -> "\n #{node.text} \n\n"
  renderBaseNode: (node) -> "# #{node.name} \n"
  renderDocumentationNode: (node) ->  "## #{node.name} \n"
  renderFunctionDocumentationNode: (node) ->  "### #{node.name} \n"
  renderTestCaseNode: (node) -> "#### #{node.name} \n"
  renderExampleTestCaseNode: (node) -> "#### #{node.name} \n"
  renderConsoleNode: (node) ->
    """
     
    #{@renderConsole(node)}
    
    """
  renderMultiConsoleNode: (multi) -> 
    out = for node in multi.children
      node.rendered = true
      @renderConsole(node)
    """
    
    #{out.join('')}
    
    """

  renderReferenceNode: (node) -> "\n*see #{node.identifier()}*\n\n"
    
  renderFunction: (f) ->
    text = f.toString().replace(whitespace_rx, ' ').trim()
    matches = return_val_rx.exec(text)
    matches[1]

  renderAssertionConsole: (node) -> 
    "    js> #{Highlight(@renderFunction(node.actualFunction))}\n    #{Highlight(node.actualValue())}\n"

  render: (node) ->
    @output = []
    @walk(node)
    @output.join('')

class HTMLOutputWalker extends MarkdownOutputWalker
  OutputTemplate = fs.readFileSync(path.join(__dirname, '..', 'templates', 'index.html.eco')).toString()

  constructor: ->
    @objects = {}
    super
  
  visit: (node) ->
    switch node.constructor.name
      when 'FunctionDocumentationNode'
        keys = (@objects[node.parentName()] ||= [])
        keys.push {anchor: @idSafe(node.identifier()), name: node.callSignature()}
    super

  renderBaseNode: (node) -> 
    @wrapHTML "<h1 class=\"base\">#{node.name}</h1>"
  renderDocumentationNode: (node) -> 
    @wrapHTML "<h2 class=\"object\">#{node.name}</h2>"
  renderFunctionDocumentationNode: (node) -> 
    @wrapHTML "<h3 class=\"function\" id=#{@idSafe(node.identifier())}>#{node.callSignature()}</h3>"
  renderReferenceNode: (node) -> 
    "\nsee <a href=\"##{@idSafe(node.identifier())}\">#{node.identifier()}</a>"
  renderConsoleNode: (node) ->
    @wrapConsole(@renderConsole(node))
  renderMultiConsoleNode: (multi) -> 
    out = for node in multi.children
      node.rendered = true
      @renderConsole(node)
    @wrapConsole out.join('')
 
  renderConsole: (node) -> 
    "js> #{Highlight(@renderFunction(node.inputFunction))}\n#{Highlight(util.inspect(node.outputValue()))}\n"
  wrapConsole: (str) -> 
    @wrapHTML """
    <pre><code>#{str}</code></pre>
    """
  wrapHTML: (str) ->
    """
    
    #{str}
    
    """

  idSafe_rx = /[^\.\:a-zA-Z0-9_-]/g
  idSafe: (str) ->
    str.replace(idSafe_rx, '_')

  render: (node) ->
    markdownishOutput = super
    data = 
      title: node.name
      body: ghm.parse(markdownishOutput)
      tableOfContents: @objects 
    eco.render OutputTemplate, data
  
  renderToFile: (test, filename) ->
    fs.writeFileSync(filename, @render(test))

Document = (name, filename, block) ->
  if !block?
    block = filename
  node = new BaseNode(name, block)
  markdownRenderer = new HTMLOutputWalker
  if filename?
    markdownRenderer.renderToFile(node, filename)
  else
    console.log markdownRenderer.render(node)
  true

