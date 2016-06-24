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
(function(Application, Window, Utils, API, VFS, GUI) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // WINDOWS
  /////////////////////////////////////////////////////////////////////////////

  function ApplicationconverseWindow(app, metadata, scheme) {
    Window.apply(this, ['ApplicationconverseWindow', {
      icon: metadata.icon,
      title: metadata.name,
      width: 800,
      height: 400
    }, app, scheme]);
  }

  ApplicationconverseWindow.prototype = Object.create(Window.prototype);
  ApplicationconverseWindow.constructor = Window.prototype;

  ApplicationconverseWindow.prototype.app = null;
  ApplicationconverseWindow.prototype.scheme = null;
  ApplicationconverseWindow.prototype.groupChatIterator = 0;
  ApplicationconverseWindow.prototype.userListIterator = 0;
  
  ApplicationconverseWindow.prototype.init = function(wmRef, app, scheme) {
    var root = Window.prototype.init.apply(this, arguments);
    var self = this;

    this.app = app;

    // Load and render `scheme.html` file
    this.scheme = scheme;
    this.scheme.render(this, 'converseWindow', root);

    // Put your GUI code here (or make a new prototype function and call it):
    //ApplicationconverseWindow.prototype.userList;
    
    this.app.chatService = API.getProcess('chatserviceService', true);
    this.app.chatService.view = this;

    this.app.userList = this.app.chatService.userList;
    this.app.groupChat = this.app.chatService.groupChat;

    this.update();

    return root;
  };

  ApplicationconverseWindow.prototype.update = function() {
    var self = this;

    var updateSideView = function() {
      if(self.userListIterator + 1 === self.app.userList.length) {
        return;
      }
      
      var sideView = self.scheme.find(self, 'UserView');
      var sideViewItems = [];

      var temporaryIterator = 0;
      for(var i=self.userListIterator; i<self.app.userList.length; i++) {
        var sideViewItem = {
          value: self.app.userList[i].jid,
          className: 'user',
          columns: [
            {
              label: self.app.userList[i].name
              //con: API.getIcon('emblems/emblem-readonly.png', '16x16')
            }
          ],
          onCreated: function(nel) {}
        };
        
        sideViewItems.push(sideViewItem);
        temporaryIterator = i;
      } 
      self.userListIterator = temporaryIterator;
      
      sideView.add(sideViewItems);
    };

    var updateChatView = function() {
      if(self.groupChatIterator + 1 === self.app.groupChat.length) {
        return;
      }

      var chatView = self.scheme.find(self, 'ChatView');
      var chatViewItems = [];

      var temporaryIterator = 0;
      
      for(var i=self.groupChatIterator + 1; i<self.app.groupChat.length; i++) {
        var message = self.app.groupChat[i];
        
        var chatViewItem = {
          value: message.to,
          className: 'message',
          columns: [
            {
              label: message.username + ': ' + message.message
              //icon: API.getIcon('emblems/emblem-readonly.png', '16x16')
            }
          ],
          onCreated: function(nel) {}
        };
        
        chatViewItems.push(chatViewItem);
        temporaryIterator = i;
      }
      self.groupChatIterator = temporaryIterator;

      chatView.add(chatViewItems);
    };
      
    updateSideView();
    updateChatView();
  };

  ApplicationconverseWindow.prototype.destroy = function() {
    // This is where you remove objects, dom elements etc attached to your
    // instance. You can remove this if not used.
    this.app.chatService.view = null;

    if ( Window.prototype.destroy.apply(this, arguments) ) {
      return true;
    }
    return false;
  };

  /////////////////////////////////////////////////////////////////////////////
  // APPLICATION
  /////////////////////////////////////////////////////////////////////////////

  function Applicationconverse(args, metadata) {
    Application.apply(this, ['Applicationconverse', args, metadata]);
  }

  Applicationconverse.prototype = Object.create(Application.prototype);
  Applicationconverse.constructor = Application;

  Applicationconverse.prototype.userList = null;
  Applicationconverse.prototype.groupChat = null;
  Applicationconverse.prototype.chatService = null;

  Applicationconverse.prototype.destroy = function() {
    // This is where you remove objects, dom elements etc attached to your
    // instance. You can remove this if not used.
    if ( Application.prototype.destroy.apply(this, arguments) ) {
      return true;
    }
    return false;
  };

  Applicationconverse.prototype.init = function(settings, metadata) {
    Application.prototype.init.apply(this, arguments);

    var self = this;
    this._loadScheme('./scheme.html', function(scheme) {
      self._addWindow(new ApplicationconverseWindow(self, metadata, scheme));
    });
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.Applicationconverse = OSjs.Applications.Applicationconverse || {};
  OSjs.Applications.Applicationconverse.Class = Object.seal(Applicationconverse);

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.GUI);
