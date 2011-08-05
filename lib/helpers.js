(function() {
  var Spy, createSpy, extend, spyOn;
  var __slice = Array.prototype.slice;
  Spy = (function() {
    function Spy(original) {
      this.called = false;
      this.callCount = 0;
      this.calls = [];
      this.original = original;
      this.fixedReturn = false;
    }
    Spy.prototype.whichReturns = function(value) {
      this.fixedReturn = true;
      this.fixedReturnValue = value;
      return this;
    };
    return Spy;
  })();
  createSpy = function(original) {
    var f, k, spy, v;
    spy = new Spy(original);
    f = function() {
      var args, _ref;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      f.called = true;
      f.callCount++;
      f.lastCall = {
        context: this,
        arguments: args
      };
      f.lastCallArguments = f.lastCall.arguments;
      f.lastCallContext = f.lastCall.context;
      f.calls.push(f.lastCall);
      if (!f.fixedReturn) {
        return (_ref = f.original) != null ? _ref.call.apply(_ref, [this].concat(__slice.call(args))) : void 0;
      } else {
        return f.fixedReturnValue;
      }
    };
    for (k in spy) {
      v = spy[k];
      f[k] = v;
    }
    return f;
  };
  spyOn = function(obj, method) {
    return obj[method] = createSpy(obj[method]);
  };
  extend = function() {
    var k, object, objects, onto, v, _i, _len;
    onto = arguments[0], objects = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    for (_i = 0, _len = objects.length; _i < _len; _i++) {
      object = objects[_i];
      for (k in object) {
        v = object[k];
        onto[k] = v;
      }
    }
    return onto;
  };
  module.exports = {
    extend: extend,
    spyOn: spyOn,
    createSpy: createSpy,
    Spy: Spy
  };
}).call(this);
