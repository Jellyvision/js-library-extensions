define([

  'underscore'

], function (

  _

) {
  'use strict';

  /**
   * Removes trailing and leading whitespace.
   * @param {string} str
   * @return {string}
   */
  _.trim = function (str) {
    return str.replace(/^\s*/, '').replace(/\s*$/, '');
  };

});
