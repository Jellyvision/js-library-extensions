/* jshint camelcase: false */
/* global Modernizr: true */
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
   * @return {boolean}
   */
  function isAudioSupported () {
    return (Modernizr.audio.ogg || Modernizr.audio.mp3);
  }

  Backbone.supportedAudioSuffixes = ['mp3', 'ogg'];

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
      object.off();
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

  // BACKBONE.VIEW.PROTOTYPE EXTENSIONS
  //

  Backbone.View.prototype.teardown = function () {
    var i, len;

    // Clear timeouts
    if (typeof this._timeoutHandles !== 'undefined') {
      var timeoutHandles = this._timeoutHandles;
      i = 0;
      len = timeoutHandles.length;
      for (i; i < len; i++) {
        clearTimeout(timeoutHandles[i]);
      }

      // Empty the array
      this._timeoutHandles.length = 0;
    }

    // Abort all in-progress XHR requests
    if (typeof this._jqXhrsContainers !== 'undefined') {
      var jqXhrContainers = this._jqXhrsContainers;
      var jqXhrContainer;
      i = 0;
      len = jqXhrContainers.length;
      for (i; i < len; i++) {
        jqXhrContainer = jqXhrContainers[i];

        // JSONP requests cannot be aborted
        if (!jqXhrContainer.isJsonp) {
          jqXhrContainer.jqXhr.abort();
        }
      }

      this._jqXhrsContainers.length = 0;
    }
  };

  /**
   * @param {Function} callback
   * @param {number} timeoutMs
   * @return {number} The value returned from window.setTimeout
   */
  Backbone.View.prototype.setTimeout = function (callback, timeoutMs) {
    if (typeof this._timeoutHandles === 'undefined') {
      this._timeoutHandles = [];
    }

    var timeoutHandle;
    var wrappedCallback = _.wrap(callback, _.bind(function (rawCallback) {
      this._timeoutHandles = _.without(this._timeoutHandles, timeoutHandle);
      rawCallback();
    }, this));

    timeoutHandle = setTimeout(wrappedCallback, timeoutMs);
    this._timeoutHandles.push(timeoutHandle);

    return timeoutHandle;
  };

  /**
   * @param {number} timeoutHandle The value that was returned from
   * Backbone.View#setTimeout.
   */
  Backbone.View.prototype.clearTimeout = function (timeoutHandle) {
    if (typeof this._timeoutHandles === 'undefined') {
      return;
    }

    this._timeoutHandles = _.without(this._timeoutHandles, timeoutHandle);
    clearTimeout(timeoutHandle);
  };

  /**
   * Wrapper for $.ajax, but does not return anything.  Method signature is
   * identical to $.ajax.
   *
   * @param {string|Object}
   * @param {Object=}
   */
  Backbone.View.prototype.ajax = function () {
    if (typeof this._jqXhrsContainers === 'undefined') {
      this._jqXhrsContainers = [];
    }

    var isJsonp = false;
    var settingsObject = typeof arguments[0] === 'object' ?
        arguments[0] : arguments[1];

    // Duck-type to see if the request is JSONP
    if (settingsObject.jsonp ||
        settingsObject.jsonpCallback ||
        settingsObject.dataType === 'jsonp') {
      isJsonp = true;
      // Wrap each JSONP callback function that may have been provided.
      // JSONP requests cannot be .abort-ed, so just modify them to not run
      // if the View has been torn down.
      _.forEach(['complete', 'dataFilter', 'error', 'success'],
          function (functionName) {
        var fn = settingsObject[functionName];

        if (typeof fn === 'function') {
          // Overwrite the provided callback method
          settingsObject[functionName] = _.wrap(fn, _.bind(function () {

            // If all of the properties have been removed, this View has been
            // torn down
            if (_.keys(this).length) {
              // View still exists, go ahead and invoke the callback
              fn();
            }
          }, this));
        }
      }, this);
    }

    var jqXhr = $.ajax.apply($, arguments);
    var jqXhrContainer = {
      jqXhr: jqXhr
      ,isJsonp: isJsonp
    };
    this._jqXhrsContainers.push(jqXhrContainer);

    // Add an .always handler to the jqXhr to remove it from the internal
    // list upon request completion
    jqXhr.always(_.bind(function () {
       this._jqXhrsContainers =
           _.without(this._jqXhrsContainers, jqXhrContainer);
    }, this));

    // DO NOT return the jqXHR object.  This method does not support .ajax
    // chaining.  This is deliberate, it is a design choice to prevent
    // callbacks from executing for unloaded Views.
    return;
  };

  /**
   * Get or set the asset root for this View.
   * @param {string=} opt_path
   * @return {string}
   */
  Backbone.View.prototype.assetRoot = function (opt_path) {
    if (opt_path) {
      this._assetRoot = opt_path;
    }

    return this._assetRoot;
  };

  /**
   * Get a resolved URL for an asset of this View.
   * @param {string} asset
   * @return {string}
   */
  Backbone.View.prototype.assetPath = function (asset) {
    return (this._assetRoot || '') + asset;
  };
});
