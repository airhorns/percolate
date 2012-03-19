(function() {
  var Environment, Generator;
  var __slice = Array.prototype.slice;

  Generator = require('./generator');

  Environment = require('./environment');

  module.exports = {
    Generator: Generator,
    Environment: Environment,
    generate: function() {
      var callback, files, _i;
      files = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), callback = arguments[_i++];
      return (new Generator(files)).generate(callback);
    }
  };

}).call(this);
