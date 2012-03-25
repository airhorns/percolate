(function() {
  var Environment, Generator;
  var __slice = Array.prototype.slice;

  Generator = require('./generator');

  Environment = require('./environment');

  module.exports = {
    Generator: Generator,
    Environment: Environment,
    generate: function() {
      var callback, files, projectDirectory, _i;
      projectDirectory = arguments[0], files = 3 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []), callback = arguments[_i++];
      return (new Generator(projectDirectory, files)).generate(callback);
    },
    test: function() {
      var callback, files, projectDirectory, _i;
      projectDirectory = arguments[0], files = 3 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []), callback = arguments[_i++];
      return (new Generator(projectDirectory, files)).test(callback);
    }
  };

}).call(this);
