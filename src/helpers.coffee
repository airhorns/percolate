class Spy
  constructor: (original) ->
    @called = false
    @callCount = 0
    @calls = []
    @original = original
    @fixedReturn = false

  whichReturns: (value) ->
    @fixedReturn = true
    @fixedReturnValue = value
    @

# Simple mock function implementation stolen from Jasmine.
# Use `createSpy` to get back a function which tracks if it has been
# called, how many times, with what arguments, and optionally returns
# something specific. Example:
#
#    observer = createSpy()
#
#    object.on('click', observer)
#    object.fire('click', {foo: 'bar'})
#
#    equal observer.called, true
#    equal observer.callCount, 1
#    deepEqual observer.lastCallArguments, [{foo: 'bar'}]
#
createSpy = (original) ->
  spy = new Spy(original)

  f = (args...) ->
    f.called = true
    f.callCount++
    f.lastCall =
      context: this
      arguments: args

    f.lastCallArguments = f.lastCall.arguments
    f.lastCallContext = f.lastCall.context
    f.calls.push f.lastCall
    
    unless f.fixedReturn
      f.original?.call(this, args...)
    else
      f.fixedReturnValue

  for k, v of spy
    f[k] = v

  f

# `spyOn` can also be used as a shortcut to create or replace a
# method on an existing object with a spy. Example:
#
#    object = new DooHickey
#
#    spyOn(object, 'doStuff')
#
#    equal object.doStuff.callCount, 0
#    object.doStuff()
#    equal object.doStuff.callCount, 1
#
spyOn = (obj, method) ->
  obj[method] = createSpy(obj[method])

extend = (onto, objects...) ->
  for object in objects
    for k, v of object
      onto[k] = v
  onto

module.exports = {extend, spyOn, createSpy, Spy}
