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
(function(Service, Window, Utils, API, VFS, GUI) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // SERVICE
  /////////////////////////////////////////////////////////////////////////////

  function chatserviceService(args, metadata) {
    Service.apply(this, ['chatserviceService', args, metadata]);
  }

  chatserviceService.prototype = Object.create(Service.prototype);
  chatserviceService.constructor = Service;

  chatserviceService.prototype.connection = null;
  chatserviceService.prototype.user = {
    id: -1,
    name: "Illuminus"
  };

  chatserviceService.prototype.chats = {};
  chatserviceService.prototype.groupChat = [];
  chatserviceService.prototype.chatPanel = null;
  chatserviceService.prototype.userList = [];
  chatserviceService.prototype.view = null;

  chatserviceService.prototype.destroy = function() {
    this.connection.disconnect();
    this.chatPanel.onDisconnected();

    if ( Service.prototype.destroy.apply(this, arguments) ) {
      return true;
    }
    return false;
  };

  chatserviceService.prototype.init = function(settings, metadata) {
    Service.prototype.init.apply(this, arguments);

    var windowManager = OSjs.Core.getWindowManager();
    var panel = windowManager.getPanel();
    chatserviceService.prototype.chatPanel = panel.getItemByType(OSjs.Applications.CoreWM.PanelItems.Chat);

    var self = this;
    this.connection = new Strophe.Connection("ws://chat.conspiracyos.com:5280/websocket");

    this.connection.rawInput = function (data) { console.log('RECV: ' + data); };
    this.connection.rawOutput = function (data) { console.log('SEND: ' + data); };

    Strophe.log = function (level, msg) { console.log('LOG: ' + msg); };

    var onConnected = function(status) {
      switch(status) {
        case Strophe.Status.CONNECTING:
          console.log('Strophe is connecting.');
          break;
        case Strophe.Status.CONNFAIL:
          console.log('Strophe failed to connect.');
          break;
        case Strophe.Status.DISCONNECTING:
          console.log('Strophe is disconnecting.');
          break;
        case Strophe.Status.DISCONNECTED:
          console.log('Strophe is disconnected.');
          break;
        case Strophe.Status.CONNECTED:
          console.log('connected');
          self.onConnected();
          break;
      }
    };

    this.user.name = generate_name('egyptian');

    this.connection.connect(this.user.name + "@chat.conspiracyos.com", "", onConnected);
  };

  chatserviceService.prototype.updateView = function() {
    if(this.view && this.view.update) {
      this.view.update();
    }
  };

  chatserviceService.prototype.onConnected = function() {
    var self = this;

    this.user.id = this.connection.jid;

    var onMessage = function(msg) {

      var message = {
        message: msg.getElementsByTagName('body')[0].textContent,
        to: msg.getAttribute('to'),
        from: msg.getAttribute('from'),
        type: msg.getAttribute('type'),
        username: msg.getAttribute('from').split('/')[1]
      };

      switch(message.type) {
        case "chat":
          onChat(message);
          break;
        case "groupchat":
          onGroupchat(message);
          break;
      }

      chatserviceService.prototype.chatPanel.onMessage(message);
      self.updateView();

      return true;
    };

    var onChat = function(message) {
      if(typeof self.chats[message.from] !== "object") {
        self.chats[message.from] = [];
      }
      self.chats[message.from].push(message);
      var onClickEvent = function(event) {};
      self.notify(message.username, message.message, onClickEvent);
      console.log('[C] ' + message.username + ' - ' + message.message);
    };

    var onGroupchat = function(message) {
      self.groupChat.push(message);
      console.log('[G] ' + message.username + ' - ' + message.message);
    };

    this.connection.addHandler(onMessage, null, 'message', null, null,  null);

    this.chatPanel.onConnected();

    var room = 'conspiracyos@conference.chat.conspiracyos.com';

    this.join(room);
    this.fetchUserlist(room);
  };

  chatserviceService.prototype.notify = function(username, message, onClick) {
    var options = {
     icon: "conspiracyos/tools.png",
     title: "ConspiracyOS IM",
     message: '@' + username[0] + ': ' + message,
     timeout: 5000,
     onClick: onClick
    };

    API.createNativeNotification(options);
  };

  chatserviceService.prototype.join = function(room) {
    var muc = this.connection.muc;

    var onSuccess = function() {
      console.log('Room joined');
    };

    var onError = function(error) {
      console.log(error);
    };

    //muc.createInstantRoom(room, onSuccess, onError);
    
    muc.join(room, this.user.name, onSuccess, onError);
  };

  chatserviceService.prototype.fetchUserlist = function(room) {
    var self = this;
    var muc = this.connection.muc;

    var onSuccess = function(iq) {
      var userItems = iq.getElementsByTagName('item');
      var users = [];
      for(var i=0; i<userItems.length; i++) {
        var user = {
          name: userItems[i].getAttribute('name'),
          jid: userItems[i].getAttribute('jid')
        };
        users.push(user);
      }
      self.userList = users;
    };

    var onError = function(error) {
      console.log(error);
    };

    muc.queryOccupants(room, onSuccess, onError);
  };

  chatserviceService.prototype.send = function(msg) {
    console.log('StropheConnection::send()', msg);

    var to = "test_desktop@chat.conspiracyos.com/7189151270195910090188";

    var reply = $msg({to: to, from: this.user.id, type: 'chat'})
                  .cnode(Strophe.xmlElement('body', 'Haaaaj!')).up()
                  .c('active', {xmlns: "http://jabber.org/protocol/chatstates"});

    /*var reply = $msg({to: msg.jid, from: this.user.id, type: 'chat'})
                  .cnode(Strophe.xmlElement('body', msg.message)).up()
                  .c('active', {xmlns: "http://jabber.org/protocol/chatstates"});*/
    this.connection.send(reply.tree());
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.chatserviceService = OSjs.Applications.chatserviceService || {};
  OSjs.Applications.chatserviceService.Class = Object.seal(chatserviceService);

})(OSjs.Core.Service, OSjs.Core.Window, OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.GUI);
