(function() {
  var Environment, getFancyArray, k, qqunit, v;
  var __slice = Array.prototype.slice;

  qqunit = require('qqunit');

  getFancyArray = function() {
    var array;
    array = [];
    array.clear = function() {
      while (this.length > 0) {
        this.pop();
      }
      return true;
    };
    return Object.defineProperty(array, "last", {
      enumerable: false,
      get: function() {
        return this[this.length - 1];
      }
    });
  };

  Environment = {
    show: function() {},
    showLog: function() {},
    log: function() {
      var arg, args, _i, _len;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      for (_i = 0, _len = args.length; _i < _len; _i++) {
        arg = args[_i];
        global.logged.push(arg);
      }
      return true;
    },
    logged: getFancyArray()
  };

  for (k in Environment) {
    v = Environment[k];
    global[k] = v;
  }

  QUnit.testDone(function(_arg) {
    var name;
    name = _arg.name;
    return global.logged = Environment.logged = getFancyArray();
  });

}).call(this);
