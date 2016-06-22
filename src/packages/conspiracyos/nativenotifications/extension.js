/*!
 * OS.js - JavaScript Cloud/Web Desktop Platform
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
(function(Utils, VFS, API) {

  /////////////////////////////////////////////////////////////////////////////
  // MODULE API
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Extension modules requires an init() method
   */
  var nativeNotifications = {
    init: function(metadata, done) {
      var createNativeNotification = function(options) {
        var message = options.message;

        var requestPermissionAndNotify = function(options) {
          var onPermissionResult = function (permission) {
            if (permission === "granted") {
              doNotify(options);
            }
          };

          Notification.requestPermission(onPermissionResult);
        };

        var doNotify = function(options) {
            var prefix = "themes/icons/default/32x32/"

            var notificationOptions = {
              body: options.message,
              icon: prefix + options.icon
            };

            var notification = new Notification(options.title, notificationOptions);

            var closeNotification = function() {
              notification.close();
            }

            var timeout = setTimeout(closeNotification, options.timeout);

            notification.addEventListener('click', function (event) {
              options.onClick(event);
              closeNotification();
              clearTimeout(timeout);
            });
        }

        if (!("Notification" in window)) {
          console.log('Native notifications not supported');
        } else if (Notification.permission === "granted") {
          doNotify(options);
        } else if (Notification.permission !== 'denied') {
          console.log('Native permissions denied, requesting permission');
          requestPermissionAndNotify(options);
        }

        API.createNotification(options);
      };

      API.createNativeNotification = createNativeNotification;
      done();
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * This is an example using the internal Extension system.
   * You can use any namespace you want and override already defined internal methods
   */
  OSjs.Extensions.nativeNotifications = nativeNotifications;

})(OSjs.Utils, OSjs.VFS, OSjs.API);
