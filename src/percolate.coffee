qqunit = require 'qqunit'
async = require 'async'
hogan = require 'hogan'
fs = require 'fs'
path = require 'path'
TestFile = require './test_file'

class Generator
  sourceFiles: ['templates/index.html.mustache', 'templates/jquery.min.js', 'templates/modernizr.min.js', 'templates/style.css']

  constructor: (files) ->
    throw new Error("Percolate needs some files to generate with!") unless files.length > 0
    @files = (new TestFile(file) for file in files)

  generate: (callback) ->
    async.parallel (file.require for file in @files), (err, results) =>
      return callback(err) if err
      qqunit.Runner.run [], (stats) =>
        @render (err, output) =>
          callback(err, stats, output)

  render: (callback) ->
    templateFiles = @sourceFiles.map (file) -> path.join(__dirname, '..', file)
    main = (file.output() for file in @files).join('\n')
    table_of_contents = @files
      .map((file) -> file.tableOfContents)
      .reduce((a, b) -> a.merge(b))

    async.map templateFiles, fs.readFile, (err, results) =>
      [template, jquery_source, modernizr_source, css_source] = results.map (result) -> result.toString()
      unless err
        template = hogan.compile(template)
        output = template.render {main, table_of_contents, jquery_source, modernizr_source, css_source}
      callback(err, output)

module.exports =
  Generator: Generator
  generate: (files..., callback) ->
    (new Generator(files)).generate(callback)
