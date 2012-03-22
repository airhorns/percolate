require './environment'
qqunit = require 'qqunit'
async = require 'async'
hogan = require 'hogan'
fs = require 'fs'
path = require 'path'
TestFile = require './test_file'

class Generator
  sourceFiles: ['templates/index.html.mustache', 'templates/table_of_contents_node.html.mustache', 'templates/jquery.min.js', 'templates/modernizr.min.js', 'templates/style.css']

  constructor: (files) ->
    throw new Error("Percolate needs some files to generate with!") unless files.length > 0
    @files = (new TestFile(file) for file in files)

  generate: (callback) ->
    async.parallel (file.require for file in @files), (err, results) =>
      return callback(err) if err
      qqunit.Runner.run [], (stats) =>
        unless stats.failed > 0
          @render (err, output) =>
            callback(err, stats, output)
        else
          callback(err, stats, "")

  render: (callback) ->
    templateFiles = @sourceFiles.map (file) -> path.join(__dirname, '..', file)

    # Generate complete TOC
    table_of_contents = @files
      .map((file) -> file.tableOfContents)
      .reduce((a, b) -> a.merge(b))

    console.log "Rendering and highlighting tests..."
    # Get output
    async.parallel [
      (callback) =>
        async.map @files, ((file, callback) -> file.output(callback)), (err, results) ->
          results = results.join('\n') if results?
          callback(err, results)
      ,
      (callback) =>
        async.map templateFiles, fs.readFile, (err, results) =>
          unless err
            results = results.map (result) -> result.toString()
            results[0] = hogan.compile(results[0])
          callback(err, results)
      ]
    , (err, [main, templates]) =>
      [template, table_of_contents_node, jquery_source, modernizr_source, css_source] = templates
      output = template.render {main, table_of_contents, jquery_source, modernizr_source, css_source}, {table_of_contents_node}
      callback(err, output)

module.exports = Generator
