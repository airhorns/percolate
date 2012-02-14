qqunit = require 'qqunit'
async = require 'async'
eco = require 'eco'
TestFile = require './test_file'

class Generator
  sourceFiles: ['templates/index.html.eco', 'templates/jquery.min.js', 'templates/modernizr.min.js', 'templates/style.css']
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
    main = (file.output() for file in @files).join('\n')
    async.map @sourceFiles, fs.readFile, (err, [template, jquery_source, modernizr_source, css_source]) =>
      unless err
        output = eco.render template, {main, jquery_source, modernizr_source, css_source}
      callback(err, output)

module.exports =
  Generator: Generator
  generate: (files..., callback) ->
    (new Generator(files)).generate(callback)
