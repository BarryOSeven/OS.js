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
(function(CoreWM, Panel, PanelItem, PanelItemDialog, Utils, API, VFS, GUI, Window) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // Search Settings Dialog
  /////////////////////////////////////////////////////////////////////////////

  /////////////////////////////////////////////////////////////////////////////
  // ITEM
  /////////////////////////////////////////////////////////////////////////////

  /**
   * PanelItem: Search
   */
  function PanelItemChat(settings) {
    PanelItem.apply(this, ['PanelItemChat corewm-panel-right', 'Chat', settings, {
      hideMenu: true
    }]);

    this.$box = null;
    this.$message = null;
    this.visible = false;
    this.events = [];
    this.hookId = -1;
    this.currentIndex = -1;
    this.currentCount = 0;
  }

  PanelItemChat.prototype = Object.create(PanelItem.prototype);
  PanelItemChat.constructor = PanelItem;

  PanelItemChat.Name = 'Chat'; // Static name
  PanelItemChat.Description = 'Show chat status'; // Static description
  PanelItemChat.Icon = 'conspiracyos/chat_idle.png'; // Static icon
  PanelItemChat.HasOptions = false;

  PanelItemChat.prototype.panelImage = null;
  PanelItemChat.prototype.iconTimer = null;
  PanelItemChat.prototype.isConnected = false;

  PanelItemChat.prototype.init = function() {
    var self = this;
    var root = PanelItem.prototype.init.apply(this, arguments);

    var img = document.createElement('img');
    img.src = API.getIcon('conspiracyos/chat_idle.png');
    this.panelImage = img;

    var input = document.createElement('input');
    input.setAttribute('type', 'text');

    var guinput = document.createElement('gui-text');
    guinput.appendChild(input);

    var ul = document.createElement('ul');

    this.$message = document.createElement('div');
    this.$message.appendChild(document.createTextNode(API._('SEARCH_LOADING')));

    this.$box = document.createElement('corewm-search');
    this.$box.className = 'custom-notification';
    this.$box.appendChild(guinput);
    this.$box.appendChild(this.$message);
    this.$box.appendChild(ul);

    var keyEvents = {};
    keyEvents[Utils.Keys.DOWN] = function(ev) {
      self.navigateDown();
    };
    keyEvents[Utils.Keys.UP] = function(ev) {
      self.navigateUp();
    };
    keyEvents[Utils.Keys.ESC] = function(ev) {
      self.hide();
    };
    keyEvents[Utils.Keys.ENTER] = function(ev) {
      if ( this.value.length ) {
        self.search(this.value);
        this.value = '';
      } else {
        self.navigateOpen();
      }
    };

    API.addHook('onBlurMenu', function() {
      self.hide();
    });

    this.events.push(Utils.$bind(root, 'click', function(ev) {
      ev.stopPropagation();

      //reset icon
      if(self.isConnected) {
        self.panelImage.src = API.getIcon('conspiracyos/chat_connected.png');
      } else {
        self.panelImage.src = API.getIcon('conspiracyos/chat_idle.png');
      }

      if(!self.isChatOpened()) {
        API.launch('Applicationconverse', {});
      }
      
    }));

    /*this.events.push(Utils.$bind(input, 'mousedown', function(ev) {
      ev.stopPropagation();
    }));

    this.events.push(Utils.$bind(input, 'keydown', function(ev) {
      if ( keyEvents[ev.keyCode] ) {
        ev.preventDefault();
        ev.stopPropagation();

        keyEvents[ev.keyCode].call(this, ev);
      }
    }));

    this.events.push(Utils.$bind(ul, 'mousedown', function(ev) {
      ev.stopPropagation();
    }));

    this.events.push(Utils.$bind(ul, 'click', function(ev) {
      var target = ev.target;
      if ( target.tagName === 'LI' ) {
        self.launch(target);
      }
    }));

    this.events.push(Utils.$bind(this.$box, 'mousedown', function() {
      if ( input ) {
        input.focus();
      }
    }));*/

    var li = document.createElement('li');
    li.appendChild(img);
    this._$container.appendChild(li);

    document.body.appendChild(this.$box);

    return root;
  };

  PanelItemChat.prototype.isChatOpened = function() {
    var processes = API.getProcesses();
    var isChatOpened = false;
    for(var i=0; i<processes.length; i++) {
      var process = processes[i];
      if(process && process.__pname && process.__pname === "Applicationconverse") {
          isChatOpened = true;
          break;
      }
    }

    return isChatOpened;
  };

  PanelItemChat.prototype.onDisconnected = function() {
    this.isConnected = false;
    this.panelImage.src = API.getIcon('conspiracyos/chat_idle.png');
  };

  PanelItemChat.prototype.onConnected = function() {
    this.isConnected = true;
    this.panelImage.src = API.getIcon('conspiracyos/chat_connected.png');
  };


  PanelItemChat.prototype.onMessage = function(message) {
    var self = this;
    var pmIcon = API.getIcon('conspiracyos/chat_pm.png');

    var onChatMessage = function() {
      clearTimeout(self.iconTimer);
      self.panelImage.src = pmIcon;
    };

    var onGroupchatMessage = function() {
      //check if no PM is present (more urgent)
      if(self.panelImage.src.indexOf(pmIcon) == -1) {
        clearTimeout(self.iconTimer);
        self.panelImage.src = API.getIcon('conspiracyos/chat_new.png');

        var switchUrgence = function() {
          self.panelImage.src = API.getIcon('conspiracyos/chat_messages.png');
        };

        self.iconTimer = setTimeout(switchUrgence, 5000);
      }
    };

    switch(message.type) {
      case "chat":
        onChatMessage();
        break;
      case "groupchat":
        onGroupchatMessage();
        break;
    }

  };


  /*PanelItemSearch.prototype.applySettings = function() {
  };

  PanelItemSearch.prototype.openSettings = function() {
    API.launch('ApplicationSettings', {category: 'search'});
  };*/

  PanelItemChat.prototype.destroy = function() {
    this.$message = Utils.$remove(this.$message);
    this.$box = Utils.$remove(this.$box);

    if ( this.hookId >= 0 ) {
      API.removeHook(this.hookId);
    }

    this.events.forEach(function(ev) {
      ev.destroy();
    });

    this.events = [];

    PanelItem.prototype.destroy.apply(this, arguments);
  };

  PanelItemChat.prototype.launch = function(target) {
    var launch = target.getAttribute('data-launch');
    var args = JSON.parse(target.getAttribute('data-args'));
    var file = target.getAttribute('data-file');
    var mime = target.getAttribute('data-mime');
    var type = target.getAttribute('data-type');

    if ( file ) {
      if ( type === 'dir' ) {
        API.launch('ApplicationFileManager', {path: file});
      } else {
        API.open(new VFS.File(file, mime));
      }
    } else {
      API.launch(launch, args);
    }

    this.hide();
  };

  PanelItemChat.prototype.show = function() {
    if ( !this.$box || this.visible ) {
      return;
    }

    var wm = OSjs.Core.getWindowManager();
    var space = wm.getWindowSpace(true);

    Utils.$empty(this.$box.querySelector('ul'));
    this.$box.style.marginTop = String(space.top) + 'px';
    this.$box.querySelector('input').value = '';
    this.$box.setAttribute('data-visible', String(true));

    this.$box.querySelector('input').focus();
    this.visible = true;

    this.$message.style.display = 'none';
  };

  PanelItemChat.prototype.hide = function() {
    if ( !this.$box || !this.visible ) {
      return;
    }

    this.$box.setAttribute('data-visible', String(false));
    this.visible = false;
  };

  PanelItemChat.prototype.search = function(q) {
    if ( !this.$box ) {
      return;
    }

    this.currentIndex = -1;
    this.currentCount = 0;

    Utils.$empty(this.$message);
    this.$message.appendChild(document.createTextNode(API._('SEARCH_LOADING')));
    this.$message.style.display = 'block';

    var self = this;
    OSjs.Core.getSearchEngine().search(q, {limit: 10, recursive: true}, function(errors, result) {
      if ( errors.length ) {
        console.error('PanelItemChat::search()', 'errors', errors);
      } else {
        self.renderResult(result);
      }
    });
  };

  PanelItemChat.prototype.renderResult = function(list) {
    if ( !this.$box ) {
      return;
    }

    var root = this.$box.querySelector('ul');
    Utils.$empty(root);

    this.currentCount = list.length;

    if ( this.currentCount ) {
      this.$message.style.display = 'none';
    } else {
      Utils.$empty(this.$message);
      this.$message.appendChild(document.createTextNode(API._('SEARCH_NO_RESULTS')));
      this.$message.style.display = 'block';
    }

    list.forEach(function(l) {
      var img = document.createElement('img');
      img.src = l.icon;

      var title = document.createElement('div');
      title.className = 'Title';
      title.appendChild(document.createTextNode(l.title));

      var description = document.createElement('div');
      description.className = 'Message';
      description.appendChild(document.createTextNode(l.description));

      var node = document.createElement('li');
      node.setAttribute('data-launch', l.launch.application);
      node.setAttribute('data-args', JSON.stringify(l.launch.args));
      if ( l.launch.file ) {
        node.setAttribute('data-file', l.launch.file.path);
        node.setAttribute('data-mime', l.launch.file.mime);
        node.setAttribute('data-type', l.launch.file.type);
      }

      node.appendChild(img);
      node.appendChild(title);
      node.appendChild(description);
      root.appendChild(node);
    });
  };

  PanelItemChat.prototype.updateSelection = function() {
    var root = this.$box.querySelector('ul');
    var child = root.children[this.currentIndex];

    root.querySelectorAll('li').forEach(function(el) {
      Utils.$removeClass(el, 'active');
    });

    Utils.$addClass(child, 'active');
  };

  PanelItemChat.prototype.navigateUp = function() {
    if ( !this.currentCount ) {
      return;
    }

    if ( this.currentIndex > 0 ) {
      this.currentIndex--;
    } else {
      this.currentIndex = this.currentCount - 1;
    }

    this.updateSelection();
  };

  PanelItemChat.prototype.navigateDown = function() {
    if ( !this.currentCount ) {
      return;
    }

    if ( this.currentIndex < 0 || this.currentIndex >= (this.currentCount - 1) ) {
      this.currentIndex = 0;
    } else {
      this.currentIndex++;
    }

    this.updateSelection();
  };

  PanelItemChat.prototype.navigateOpen = function() {
    if ( this.currentIndex === -1 || !this.currentCount ) {
      return;
    }

    var root = this.$box.querySelector('ul');
    var child = root.children[this.currentIndex];
    if ( child ) {
      this.launch(child);
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications                                    = OSjs.Applications || {};
  OSjs.Applications.CoreWM                             = OSjs.Applications.CoreWM || {};
  OSjs.Applications.CoreWM.PanelItems                  = OSjs.Applications.CoreWM.PanelItems || {};
  OSjs.Applications.CoreWM.PanelItems.Chat             = PanelItemChat;

})(
  OSjs.Applications.CoreWM.Class,
  OSjs.Applications.CoreWM.Panel,
  OSjs.Applications.CoreWM.PanelItem,
  OSjs.Applications.CoreWM.PanelItemDialog,
  OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.GUI, OSjs.Core.Window);
