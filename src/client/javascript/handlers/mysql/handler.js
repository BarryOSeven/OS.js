/*!
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Mysql Handler: Login screen and session/settings handling via database
 * PLEASE NOTE THAT THIS AN EXAMPLE ONLY, AND SHOUD BE MODIFIED BEFORE USAGE
 *
 * Copyright (c) 2011-2016, Anders Evenrud <andersevenrud@gmail.com>
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * @author  Anders Evenrud <andersevenrud@gmail.com>
 * @licence Simplified BSD License
 */

//
// See doc/handler-mysql.txt
//

(function(API, Utils, VFS) {
  'use strict';

  window.OSjs  = window.OSjs || {};
  OSjs.Core    = OSjs.Core   || {};

  function getSettings() {
    var result = {};

    var key;
    for ( var i = 0; i < localStorage.length; i++ ) {
      key = localStorage.key(i);
      if ( key.match(/^conspiracyos\//) ) {
        try {
          result[key.replace(/^conspiracyos\//, '')] = JSON.parse(localStorage.getItem(key));
        } catch ( e ) {
          console.warn('DemoHandler::getSetting()', 'exception', e, e.stack);
        }
      }
    }
    console.log("FETCHED SETTINGS FROM LOCALSTORAGE!");
    console.log(result);
    return result;
  }


  /////////////////////////////////////////////////////////////////////////////
  // HANDLER
  /////////////////////////////////////////////////////////////////////////////

  /**
   * @extends OSjs.Core._Handler
   * @class
   */
  function MysqlHandler() {
    OSjs.Core._Handler.apply(this, arguments);

    var curr = API.getConfig('Version');
    var version = localStorage.getItem('__version__');
    if ( curr !== version ) {
      console.warn('DemoHandler()', 'You are running', version, 'version is', curr, 'flushing for compability!');
      localStorage.clear();
    }
    localStorage.setItem('__version__', String(curr));
  }

  MysqlHandler.prototype = Object.create(OSjs.Core._Handler.prototype);
  MysqlHandler.constructor = OSjs.Core._Handler;

  MysqlHandler.prototype.init = function(callback) {
    console.info('MysqlHandler::init()');

    var self = this;

    OSjs.Core._Handler.prototype.init.call(this, function() {
      function finished(result) {
        result.userSettings = getSettings();
        self.onLogin(result, function() {
          callback();
        });
      }

      if ( window.location.href.match(/^file\:\/\//) ) { // NW
        finished({
          userData: {
            id: 0,
            username: 'illuminus',
            name: 'illuminus',
            groups: ["api","application","fs","upload","curl"]
          }
        });
      } else {
        self.login('illuminus', '', function(error, result) {
          if ( error ) {
            callback(error);
          } else {
            finished(result);
          }
        });
      }
    });
  };

  /**
   * MysqlHandler settings api call
   */
  MysqlHandler.prototype.saveSettings = function(pool, storage, callback) {
    Object.keys(storage).forEach(function(key) {
      if ( pool && key !== pool ) {
        return;
      }

      try {
        localStorage.setItem('conspiracyos/' + key, JSON.stringify(storage[key]));
      } catch ( e ) {
        console.warn('MysqlHandler::_save()', 'exception', e, e.stack);
      }
    });

    callback();
  };

  //OSjs.Core._Handler.use.defaults(MysqlHandler);

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Core.Handler = MysqlHandler;

})(OSjs.API, OSjs.Utils, OSjs.VFS);
