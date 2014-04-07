define([

  'jquery'
  ,'underscore'
  ,'backbone'

], function (

  $
  ,_
  ,Backbone

) {
  'use strict';

  /**
   * General-purpose disposal method.  Useful for cleaning up an object that is
   * no longer needed.  This method is geared towards cleaning up Backbone
   * subclasses, but may be useful for other varieties of objects.
   * @param {Object} object The object to clean up.
   */
  Backbone.dispose = function (object) {
    // Backbone subclasses have stopListening, call it
    if (typeof object.stopListening === 'function') {
      object.stopListening();
    }

    // Presence of .length causes _.each to treat object like an array, which
    // will break this method.
    delete object.length;

    _.each(object, function (val, key) {
      if (val instanceof $) {
        val.off().remove();
      }
      delete object[key];
    }, this);
  };
});
