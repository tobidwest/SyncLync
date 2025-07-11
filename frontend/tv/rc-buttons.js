//  define shortcuts for remote control keypress handling
if (typeof KeyEvent !== "undefined") {
  if (typeof KeyEvent.VK_LEFT !== "undefined") {
    var VK_LEFT = KeyEvent.VK_LEFT;
    var VK_UP = KeyEvent.VK_UP;
    var VK_RIGHT = KeyEvent.VK_RIGHT;
    var VK_DOWN = KeyEvent.VK_DOWN;
  }
  if (typeof KeyEvent.VK_ENTER !== "undefined") {
    var VK_ENTER = KeyEvent.VK_ENTER;
  }
  if (typeof KeyEvent.VK_RED !== "undefined") {
    var VK_RED = KeyEvent.VK_RED;
    var VK_GREEN = KeyEvent.VK_GREEN;
    var VK_YELLOW = KeyEvent.VK_YELLOW;
    var VK_BLUE = KeyEvent.VK_BLUE;
  }
  if (typeof KeyEvent.VK_PLAY !== "undefined") {
    var VK_PLAY = KeyEvent.VK_PLAY;
    var VK_PAUSE = KeyEvent.VK_PAUSE;
    var VK_PLAY_PAUSE = KeyEvent.VK_PLAY_PAUSE;
    var VK_STOP = KeyEvent.VK_STOP;
  }
  if (typeof KeyEvent.VK_FAST_FWD !== "undefined") {
    var VK_FAST_FWD = KeyEvent.VK_FAST_FWD;
    var VK_REWIND = KeyEvent.VK_REWIND;
  }
  if (typeof KeyEvent.VK_BACK !== "undefined") {
    var VK_BACK = KeyEvent.VK_BACK;
  }
  if (typeof KeyEvent.VK_0 !== "undefined") {
    var VK_0 = KeyEvent.VK_0;
    var VK_1 = KeyEvent.VK_1;
    var VK_2 = KeyEvent.VK_2;
    var VK_3 = KeyEvent.VK_3;
    var VK_4 = KeyEvent.VK_4;
    var VK_5 = KeyEvent.VK_5;
    var VK_6 = KeyEvent.VK_6;
    var VK_7 = KeyEvent.VK_7;
    var VK_8 = KeyEvent.VK_8;
    var VK_9 = KeyEvent.VK_9;
  }
}

// if unsuccessful, prepare for browser emulator
if (typeof VK_LEFT === "undefined") {
  var VK_LEFT = 0x25;
  var VK_UP = 0x26;
  var VK_RIGHT = 0x27;
  var VK_DOWN = 0x28;
}
if (typeof VK_ENTER === "undefined") {
  var VK_ENTER = 0x0d;
}
if (typeof VK_RED === "undefined") {
  var VK_RED = 0x193;
  var VK_GREEN = 0x194;
  var VK_YELLOW = 0x195;
  var VK_BLUE = 0x196;
}
if (typeof VK_PLAY === "undefined") {
  var VK_PLAY = 0x50;
  var VK_PAUSE = 0x51;
  var VK_PLAY_PAUSE = 0x52;
  var VK_STOP = 0x53;
}
if (typeof VK_FAST_FWD === "undefined") {
  var VK_FAST_FWD = 0x46;
  var VK_REWIND = 0x52;
}
if (typeof VK_BACK === "undefined") {
  var VK_BACK = 0x8;
}
if (typeof VK_0 === "undefined") {
  var VK_0 = 0x30;
  var VK_1 = 0x31;
  var VK_2 = 0x32;
  var VK_3 = 0x33;
  var VK_4 = 0x34;
  var VK_5 = 0x35;
  var VK_6 = 0x36;
  var VK_7 = 0x37;
  var VK_8 = 0x38;
  var VK_9 = 0x39;
}

//  define utility functions for keypress handling
var rcUtils = {
  MASK_CONSTANT_RED: 0x1,
  MASK_CONSTANT_GREEN: 0x2,
  MASK_CONSTANT_YELLOW: 0x4,
  MASK_CONSTANT_BLUE: 0x8,
  MASK_CONSTANT_NAVIGATION: 0x10,
  MASK_CONSTANT_PLAYBACK: 0x20,
  MASK_CONSTANT_NUMERIC: 0x100,
  setKeyset: function (app, mask) {
    try {
      app.privateData.keyset.setValue(mask);
    } catch (e) {
      // try as per OIPF DAE v1.1
      try {
        app.private.keyset.setValue(mask);
      } catch (ee) {
        // catch the error while setting keyset value
      }
    }
  },
  registerKeyEventListener: function () {
    document.addEventListener(
      "keydown",
      function (e) {
        if (handleKeyCode(e.keyCode)) {
          e.preventDefault();
        }
      },
      false
    );
  },
};
