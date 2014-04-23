define([

  'underscore'
  ,'ext.underscore'

], function (

  _

) {
  'use strict';

  var validate = {
    /**
     * @param {string} emailString
     * return {boolean}
     */
    email: function (emailString) {
      var isValid = false;

      if ((/^\S*@\S+\.\S+$/).test(_.trim(emailString))) {
        isValid = true;
      }

      return isValid;
    }

    /**
     * @param {string} numberString
     * return {boolean}
     */
    ,number: function (numberString) {
      return ((+numberString).toString() === numberString);
    }

    /**
     * @param {string} currencyString
     * return {boolean}
     */
    ,currency: function (currencyString) {
      return (/^\d*(\.\d{1,2})?$/g).test(_.trim(currencyString));
    }
  };

  return validate;
});
