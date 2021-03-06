var PioneerDDJWeGO3 = function() {};

var wego3 = PioneerDDJWeGO3;


// =============
// Configuration
// =============


// Accidental Cue button protection when volume is non-zero and slip is on.
wego3.AUDIBLE_CUE_PROTECTION = true;
wego3.AUDIBLE_PLAY_PROTECTION = true;

// Turn on scratch mode for all decks.
wego3.ALL_SCRATCH_ON = true;

// Brake on stop settings (shift play).
wego3.BRAKE_FACTOR = 1.0;
wego3.BRAKE_DIRECTION = 1.0;

// Sets the jogwheels sensivity. 1 is default, 2 is twice as sensitive, 0.5 is half as sensitive.
wego3.JOG_WHEEL_SENSITIVITY =  1.0;
wego3.JOG_WHEEL_SHIFT_FACTOR = 10.0;

// Browser
wego3.BROWSE_KNOB_SHIFT_FACTOR = 10;

// Wikka wikka wikka...
wego3.SCRATCH_SETTINGS = {
  alpha: 1.0 / 8,
  beta: 1.0 / 8 / 32,
  jogResolution: 720,
  vinylSpeed: 33 + 1/3,
  safeScratchTimeout: 20
};

wego3.BOUNCE_LOOP_INTERVALS = [
  1 / 4,
  1 / 2,
  1,
  2
]

wego3.LED_MAP = {
  headphoneCue: {'[Left]': [0x96, 0x54], '[Right]': [0x96, 0x55], '[Master]': [0x96, 0x5b]},
  // loopHalf: {'[Left]': [0x90, 0x12], '[Right]': [0x91, 0x12]},
  // loopDouble: {'[Left]': [0x90, 0x13], '[Right]': [0x91, 0x13]},
  loop: {'[Left]': [0x9b, 0x10], '[Right]': [0x9b, 0x11]},
  fx1: {'[Left]': [0x94, 0x43], '[Right]': [0x95, 0x43]},
  fx2: {'[Left]': [0x94, 0x44], '[Right]': [0x95, 0x44]},
  fx3: {'[Left]': [0x94, 0x45], '[Right]': [0x95, 0x45]},
  sync: {'[Left]': [0x90, 0x58], '[Right]': [0x91, 0x58]},
  play: {'[Left]': [0x90, 0x0b], '[Right]': [0x91, 0x0b]},
  cue: {'[Left]': [0x90, 0x0c], '[Right]': [0x91, 0x0c]},
  cuePoint1: {'[Left]': [0x90, 0x2e], '[Right]': [0x91, 0x2e]},
  cuePoint2: {'[Left]': [0x90, 0x2f], '[Right]': [0x91, 0x2f]},
  cuePoint3: {'[Left]': [0x90, 0x30], '[Right]': [0x91, 0x30]},
  cuePoint4: {'[Left]': [0x90, 0x31], '[Right]': [0x91, 0x31]},
  sampler1: {'[Left]': [0x90, 0x3c], '[Right]': [0x91, 0x3c]},
  sampler2: {'[Left]': [0x90, 0x3e], '[Right]': [0x91, 0x3e]},
  sampler3: {'[Left]': [0x90, 0x40], '[Right]': [0x91, 0x40]},
  sampler4: {'[Left]': [0x90, 0x42], '[Right]': [0x91, 0x42]}
};

wego3.LED_CONTROL_FUNCTIONS = {
  play: 'wego3.playLed',
  pfl: 'wego3.headphoneCueLed',
  beat_active: 'wego3.syncLed',
  hotcue_1_enabled: 'wego3.hotCueLed',
  hotcue_2_enabled: 'wego3.hotCueLed',
  hotcue_3_enabled: 'wego3.hotCueLed',
  hotcue_4_enabled: 'wego3.hotCueLed'
};


// ==============
// Initialization
// ==============


wego3.init = function(id) {
  print('init');
  // Data structures
  wego3.shiftPressed = false;
  wego3.allChannels = [1, 2, 3, 4].
    map(function (x) { return '[Channel' + x + ']'; })
  wego3.highResMSB = {
    '[Channel1]': {},
    '[Channel2]': {},
    '[Channel3]': {},
    '[Channel4]': {},
    '[Master]': {}
  };
  wego3.groupDecks = {
    // groupDecks[group] => deck
    '[Channel1]': 0,
    '[Channel2]': 1,
    '[Channel3]': 2,
    '[Channel4]': 3,
  };
  wego3.deckGroups = [
    // deckGroups[deck] => group
    '[Channel1]',
    '[Channel2]',
    '[Channel3]',
    '[Channel4]'
  ];
  wego3.actualGroupMap = {
    '[Left]': '[Channel1]',
    '[Right]': '[Channel2]',
    '[Master]': '[Master]'
  };
  wego3.actualGroupToggleMap = {
    '[Channel1]': '[Channel3]',
    '[Channel2]': '[Channel4]',
    '[Channel3]': '[Channel1]',
    '[Channel4]': '[Channel2]'
  };
  wego3.virtualGroupMap = {
    '[Channel1]': '[Left]',
    '[Channel2]': '[Right]',
    '[Channel3]': '[Left]',
    '[Channel4]': '[Right]',
    '[Master]': '[Master]'
  };
  var v = wego3.ALL_SCRATCH_ON;
  wego3.scratchMode = [v, v, v, v];
  wego3.slipMode = [true, true, true, true];
  // Engine
  wego3.setAllSoftTakeover();
  // Lighting
  wego3.turnOffAllLeds('[Left]');
  wego3.turnOffAllLeds('[Right]');
  wego3.turnOffAllLeds('[Master]');
  wego3.bindDeckLeds('[Left]', true);
  wego3.bindDeckLeds('[Right]', true);
  wego3.bindGlobalLeds(true);

  // midi.sendShortMsg(0x9b, 0x0c, 0x01); // initialize left deck - 0x00 or 0x01
  // midi.sendShortMsg(0x9b, 0x0d, 0x01); // initialize right deck

};


wego3.shutdown = function() {
  wego3.bindDeckLeds('[Left]', false);
  wego3.bindDeckLeds('[Right]', false);
  wego3.bindGlobalLeds(false);
  wego3.setAllSoftTakeover(false);
  wegp3.turnOffAllLeds();
};


wego3.setAllSoftTakeover = function (isBinding) {
  if (isBinding === undefined) {
    isBinding = true;
  }
  wego3.allChannels.
    forEach(function (c) { wego3.setDeckSoftTakeover(c, isBinding); });
};


wego3.resetAllSoftTakeover = function () {
  wego3.allChannels.
    forEach(function (c) { wego3.resetDeckSoftTakeover(c); });
};


wego3.setDeckSoftTakeover = function (channel, isBinding) {
  engine.softTakeover(channel, 'pregain', isBinding);
  engine.softTakeover(channel, 'volume', isBinding);
  engine.softTakeover(channel, 'rate', isBinding);
  engine.softTakeover(channel, 'filterHigh', isBinding);
  engine.softTakeover(channel, 'filterMid', isBinding);
  engine.softTakeover(channel, 'filterLow', isBinding);
  var effectRack = '[QuickEffectRack1_' + channel + ']';
  engine.softTakeover(effectRack, 'super1', isBinding);
};


wego3.resetDeckSoftTakeover = function (channel) {
  engine.softTakeoverIgnoreNextValue(channel, 'pregain');
  engine.softTakeoverIgnoreNextValue(channel, 'volume');
  engine.softTakeoverIgnoreNextValue(channel, 'rate');
  engine.softTakeoverIgnoreNextValue(channel, 'filterHigh');
  engine.softTakeoverIgnoreNextValue(channel, 'filterMid');
  engine.softTakeoverIgnoreNextValue(channel, 'filterLow');
  var effectRack = '[QuickEffectRack1_' + channel + ']';
  engine.softTakeoverIgnoreNextValue(effectRack, 'super1');
};


// ==============================
// Virtual/actual channel mapping
// ==============================


wego3.actualGroup = function (group) {
  return wego3.actualGroupMap[group] || group;
};


wego3.virtualGroup = function (group) {
  var virtualGroup = wego3.virtualGroupMap[group];
  var currentActualGroup = wego3.actualGroup(virtualGroup);
  if (group == currentActualGroup) {
    return virtualGroup;
  }
};


// =================
// Function builders
// =================


wego3.hiResControl = function (functionName, controlName, callback, min, midMax, max, predicate, shifted, groupNameFn) {
  if (callback == 'linear') {
    if (min === undefined) {
      min = 0.0;
    }
    if (midMax === undefined) {
      max = 1.0;
    } else {
      max = midMax;
    }
    callback = function(fullValue, group) {
      if (!!wego3.shiftPressed != !!shifted) {
        return;
      }
      if (!predicate || predicate()) {
        var newValue = script.absoluteLin(fullValue, min, max, 0, 0x3fff);
        if (groupNameFn) {
          group = groupNameFn(group);
        }
        print(group);
        engine.setValue(group, controlName, newValue);
      }
    };
  } else if (callback == 'nonlinear') {
    if (min === undefined) {
      min = 0.0;
    }
    if (midMax === undefined) {
      midMax = 1.0;
    }
    if (max === undefined) {
      max = 4.0;
    }
    callback = function(fullValue, group) {
      if (!!wego3.shiftPressed != !!shifted) {
        return;
      }
      if (!predicate || predicate()) {
        var newValue = script.absoluteNonLin(fullValue, min, midMax, max, 0, 0x3fff);
        if (groupNameFn) {
          group = groupNameFn(group);
        }
        print(group);
        engine.setValue(group, controlName, newValue);
      }
    };
  }
  shifted = shifted ? 'WhileShiftPressed' : '';
  var msbControlName = functionName + 'MSB' + shifted;
  var lsbControlName = functionName + 'LSB' + shifted;
  var functionName = functionName + shifted;
  wego3[msbControlName] = function (channel, control, value, status, group) {
    group = wego3.actualGroup(group);
    wego3.highResMSB[group][functionName] = value;
  };
  wego3[lsbControlName] = function (channel, control, value, status, group) {
    group = wego3.actualGroup(group);
    var fullValue = (wego3.highResMSB[group][functionName] << 7) + value;
    print(fullValue + ' ' + group + ' ' + functionName);
    callback(fullValue, group);
  };
};


// ===============
// 14-bit controls
// ===============

wego3.canCrossFade = function () {
  // only allow crossfader to operate when slip mode is deactivated
  var actualLeft = wego3.actualGroup('[Left]');
  var actualRight = wego3.actualGroup('[Right]');
  var deckLeft = wego3.groupDecks[actualLeft];
  var deckRight = wego3.groupDecks[actualRight];
  return (!wego3.slipMode[deckLeft] && !wego3.slipMode[deckRight]);
};


wego3.quickEffectRackGroup = function (group) {
  return '[QuickEffectRack1_' + group + ']';
};


wego3.hiResControl('crossFader', 'crossfader', 'linear', -1.0, 1.0, null, wego3.canCrossFade);
wego3.hiResControl('tempoSlider', 'rate', 'linear', 1.0, -1.0);
wego3.hiResControl('filterHighKnob', 'super1', 'linear', 0, 1.0, null, null, true, wego3.quickEffectRackGroup);
wego3.hiResControl('filterHighKnob', 'filterHigh', 'nonlinear');
wego3.hiResControl('filterMidKnob', 'filterMid', 'nonlinear');
wego3.hiResControl('filterMidKnob', 'pregain', 'nonlinear', 0.0, 1.0, 4.0, null, true);
wego3.hiResControl('filterLowKnob', 'filterLow', 'nonlinear');
wego3.hiResControl('deckFader', 'volume', 'linear');
wego3.hiResControl('deckFader', 'volume', 'linear', 0.0, 1.0, null, null, true);



// =======
// Helpers
// =======


wego3.isAudible = function (group) {
  return engine.getValue(group, 'volume');
};


wego3.isPlaying = function (group) {
  return engine.getValue(group, 'play');
};


wego3.isSlipMode = function (group) {
  var deck = wego3.groupDecks[group];
  return wego3.slipMode[deck];
};


wego3.playProtectedValue = function (group, value) {
  var slipMode = wego3.isSlipMode(group);
  var audible = wego3.isAudible(group);
  var playing = wego3.isPlaying(group);
  return value && (!slipMode || !audible || (audible && !playing));
};


// =======
// Buttons
// =======


wego3.browseKnobDirection = function (value) {
  if (value == 0x01) {
    return 1;
  } else if (value == 0x7f) {
    return -1;
  } else {
    return 0;
  }
};


wego3.browseKnob = function (channel, control, value, status, group, shiftFactor) {
  shiftFactor = shiftFactor || 1;
  group = wego3.actualGroup(group);
  var direction = wego3.browseKnobDirection(value);
  engine.setValue('[Playlist]', 'SelectTrackKnob', direction * shiftFactor);
};


wego3.browseKnobShifted = function (channel, control, value, status, group) {
  wego3.browseKnob(channel, control, value, status, group, wego3.BROWSE_KNOB_SHIFT_FACTOR);
};


wego3.browseButton = function (channel, control, value, status, group) {
  // TODO
};


wego3.browseButtonShifted = function (channel, control, value, status, group) {
  engine.setValue('[Playlist]', 'ToggleSelectedSidebarItem', value);
};


wego3.loadButton = function (channel, control, value, status, group) {
  group = wego3.actualGroup(group);
  var playing = engine.getValue(group, 'play');
  engine.setValue(group, 'LoadSelectedTrack', value && !playing);
};


wego3.loadButtonShifted = function (channel, control, value, status, group) {
  if (group == '[Left]') {
    engine.setValue('[Playlist]', 'SelectPrevPlaylist', value);
  } else if (group == '[Right]') {
    engine.setValue('[Playlist]', 'SelectNextPlaylist', value);
  }
};


wego3.shiftButton = function (channel, control, value, status, group) {
  wego3.bindDeckLeds(group, false);
  wego3.turnOffAllLeds(group);
  wego3.shiftPressed = !!value;
  wego3.bindDeckLeds(group, true);
  wego3.resetAllSoftTakeover();
};


wego3.headphoneCueButton = function (channel, control, value, status, group) {
  group = wego3.actualGroup(group);
  if (value) {
    if (group == '[Master]') {
      var current = engine.getValue(group, 'headMix');
      engine.setValue(group, 'headMix', current < 0 ? 0.0 : -1.0);
    } else {
      script.toggleControl(group, 'pfl');
    }
  }
};


// When A or B headphone select is pressed while shifted,
// toggle the deck that is being controlled by that side.
wego3.headphoneCueButtonWhileShiftPressed = function (channel, control, value, status, group) {
  if (value && group !== '[Master]') {
    var currentActualGroup = wego3.actualGroup(group);
    var newActualGroup = wego3.actualGroupToggleMap[currentActualGroup];
    wego3.bindDeckLeds(group, false);
    wego3.turnOffAllLeds(group);
    wego3.actualGroupMap[group] = newActualGroup;
    wego3.bindDeckLeds(group, true);
  }
}


wego3.playButton = function (channel, control, value, status, group) {
  group = wego3.actualGroup(group);
  if (wego3.AUDIBLE_PLAY_PROTECTION) {
    value = wego3.playProtectedValue(group, value);
  }
  if (value) {
    var deck = wego3.groupDecks[group];
    engine.brake(deck + 1, 0);
    script.toggleControl(group, 'play');
    engine.setValue(group, 'reverseroll', 0);
  }
};


wego3.playButtonShifted = function (channel, control, value, status, group) {
  group = wego3.actualGroup(group);
  if (value && engine.getValue(group, 'play')) {
    var deck = wego3.groupDecks[group];
    engine.setValue(group, 'play', 0);
    engine.brake(deck + 1, value, wego3.BRAKE_FACTOR, wego3.BRAKE_DIRECTION);
  }
};


wego3.cueButton = function (channel, control, value, status, group) {
  group = wego3.actualGroup(group);
  if (wego3.AUDIBLE_CUE_PROTECTION) {
    value = wego3.playProtectedValue(group, value);
  }
  engine.setValue(group, 'cue_default', value);
};


wego3.cueButtonShifted = function (channel, control, value, status, group) {
  group = wego3.actualGroup(group);
  engine.setValue(group, 'reverseroll', value);
};


wego3.loopHalfButton = function (channel, control, value, status, group) {
  group = wego3.actualGroup(group);
  engine.setValue(group, 'loop_halve', value);
};


wego3.loopDoubleButton = function (channel, control, value, status, group) {
  group = wego3.actualGroup(group);
  engine.setValue(group, 'loop_double', value);
};


wego3.loopButton = function (channel, control, value, status, group) {
  if (value) {
    group = wego3.actualGroup(group);
    script.toggleControl(group, 'reloop_exit');
    if (!engine.getValue(group, 'reloop_exit')) {
      engine.setValue(group, 'beatloop', 4);
    }
  }
};


wego3.hotCueButton = function (channel, control, value, status, group) {
  var hotCueIndex = control - 0x2d;
  group = wego3.actualGroup(group);
  engine.setValue(group, 'hotcue_' + hotCueIndex + '_activate', value);
};


wego3.hotCueButtonShifted = function (channel, control, value, status, group) {
  var hotCueIndex = control - 0x5e;
  if (value) {
    group = wego3.actualGroup(group);
    engine.setValue(group, 'hotcue_' + hotCueIndex + '_clear', 1);
  }
};


wego3.samplerButton = function (channel, control, value, status, group) {
  group = wego3.actualGroup(group);
  var index = (control - 0x3c) / 2;
  var controlName = [
    'mute',
    'filterHighKill',
    'filterMidKill',
    'filterLowKill'
  ][index];
  engine.setValue(group, controlName, value);
};


wego3.samplerButtonShifted = function (channel, control, value, status, group) {
  group = wego3.actualGroup(group);
  var index = (control - 0x3d) / 2;
  var controlName = 'beatlooproll_' + wego3.BOUNCE_LOOP_INTERVALS[index] + '_activate';
  engine.setValue(group, controlName, value);
};


wego3.syncButton = function (channel, control, value, status, group) {
  group = wego3.actualGroup(group);
  if (value) {
    script.toggleControl(group, 'sync_enabled');
  }
};


wego3.syncButtonShifted = function (channel, control, value, status, group) {
  group = wego3.actualGroup(group);
  if (value) {
    var deck = wego3.groupDecks[group];
    wego3.slipMode[deck] = !wego3.slipMode[deck];
    wego3.syncLed(0, group);
  }
};


wego3.cueSamplerToggleButton = function (channel, control, value, status, group) {
  // ********** :::::: TODO ::::: ********** //
  print('cueSamplerToggleButton');
  script.midiDebug(channel, control, value, status, group);
};


wego3.fxButton = function (channel, control, value, status, group) {
  // TODO: allow holding as well as toggling
  if (value) {
    var fxNumber = control - 0x42;
    group = wego3.actualGroup(group);
    var fxGroup = '[EffectRack1_EffectUnit' + fxNumber + ']';
    var controlName = 'group_' + group + '_enable';
    script.toggleControl(fxGroup, controlName);
  }
};


wego3.fxButtonShifted = function (channel, control, value, status, group) {
  // TODO: allow holding as well as toggling
  if (value) {
    var fxNumber = control - 0x4c;
    var fxGroup = '[EffectRack1_EffectUnit' + fxNumber + ']';
    var controlName = 'group_[Headphone]_enable';
    print('fxgroup=' + fxGroup + ' controlname=' + controlName);
    script.toggleControl(fxGroup, controlName);
  }
};


// ==========
// Jog wheels
// ==========


wego3.jogWheelDelta = function (value) {
  return value - 0x40;
};


wego3.jogRingTick = function (channel, control, value, status, group, shiftFactor) {
  shiftFactor = shiftFactor || 1.0;
  group = wego3.actualGroup(group);
  wego3.pitchBendFromJog(group, wego3.jogWheelDelta(value) * shiftFactor);
};


wego3.jogRingTickShifted = function (channel, control, value, status, group) {
  wego3.jogRingTick(channel, control, value, status, group, wego3.JOG_WHEEL_SHIFT_FACTOR);
};


wego3.jogPlatterTick = function (channel, control, value, status, group, shiftFactor) {
  shiftFactor = shiftFactor || 1.0;
  group = wego3.actualGroup(group);
  var deck = wego3.groupDecks[group];
  if (wego3.scratchMode[deck]) {
    engine.scratchTick(deck + 1, wego3.jogWheelDelta(value) * shiftFactor);
  } else {
    wego3.pitchBendFromJog(group, wego3.jogWheelDelta(value) * shiftFactor);
  }
};


wego3.jogPlatterTickShifted = function (channel, control, value, status, group) {
  wego3.jogPlatterTick(channel, control, value, status, group, wego3.JOG_WHEEL_SHIFT_FACTOR);
};


wego3.jogTouch = function (channel, control, value, status, group) {
  group = wego3.actualGroup(group);
  var deck = wego3.groupDecks[group];
  var playing = engine.getValue(group, 'play');
  if (wego3.scratchMode[deck]) {
    if (value) {
      engine.scratchEnable(
        deck + 1,
        wego3.SCRATCH_SETTINGS.jogResolution,
        wego3.SCRATCH_SETTINGS.vinylSpeed,
        wego3.SCRATCH_SETTINGS.alpha,
        wego3.SCRATCH_SETTINGS.beta
      );
      engine.setValue(group, 'slip_enabled', playing && wego3.slipMode[deck]);
    } else {
      engine.scratchDisable(deck + 1, true);
      if (playing) {
        engine.beginTimer(50, 'wego3.disableSlip("' + group + '")', true);
      }
    }
  }
};


wego3.jogTouchShifted = wego3.jogTouch;


wego3.disableSlip = function (group) {
  engine.setValue(group, 'slip_enabled', false);
};


wego3.pitchBendFromJog = function (group, movement) {
  var group = (typeof group === 'string' ? group : wego3.deckGroups[group]);
  engine.setValue(group, 'jog', movement / 5 * wego3.JOG_WHEEL_SENSITIVITY);
};


// ========
// Lighting
// ========

wego3.setLed = function (group, name, value) {
  print('LED name ' + name + ', value ' + value);
  if (wego3.LED_MAP[name] === undefined || wego3.LED_MAP[name][group] === undefined) {
    // No light is defined for this group.
    return;
  }
  var ledInfo = wego3.LED_MAP[name][group];
  var command = ledInfo[0];
  var midino = ledInfo[1];
  midi.sendShortMsg(command, midino, value);
};

wego3.turnOffAllLeds = function (group) {
  for (var k in wego3.LED_MAP) {
    wego3.setLed(group, k, 0);
  }
};

wego3.playLed = function (value, group, control) {
  group = wego3.virtualGroup(group);
  wego3.setLed(group, 'play', value);
};

wego3.headphoneCueLed = function (value, group, control) {
  group = wego3.virtualGroup(group);
  wego3.setLed(group, 'headphoneCue', !!value * 0x7f);
};

wego3.masterCueLed = function (value, group, control) {
  group = wego3.virtualGroup(group);
  wego3.setLed(group, 'headphoneCue', (value >= 0.0) * 0x7f);
};

wego3.syncLed = function (value, group, control) {
  var deck = wego3.groupDecks[group];
  group = wego3.virtualGroup(group);
  if (!wego3.slipMode[deck]) {
    value = !value;
  }
  wego3.setLed(group, 'sync', !!value * 0x7f);
};

wego3.hotCueLed = function (value, group, control) {
  for (var i = 1; i <= 4; ++i) {
    if (control === 'hotcue_' + i + '_enabled') {
      var ledName = 'cuePoint' + i;
      group = wego3.virtualGroup(group);
      wego3.setLed(group, ledName, !!value * 0x7f);
    }
  }
};

wego3.fxLed = function (value, group, control) {
  print('fxLed value=' + value + ' group=' + group + ' control=' + control);
  for (var fx = 1; fx <= 3; ++fx) {
    for (var cn = 1; cn <= 4; ++cn) {
      var fxMatches = (group === '[EffectRack1_EffectUnit' + fx + ']');
      var cnMatches = (control === 'group_[Channel' + cn + ']_enable');
      if (fxMatches && cnMatches) {
        var ledName = 'fx' + fx;
        var actual = '[Channel' + cn + ']';
        var virtual = wego3.virtualGroup(actual);
        wego3.setLed(virtual, ledName, !!value * 0x7f);
      }
    }
  }
};

wego3.bindGlobalLeds = function(isBinding) {
  engine.connectControl('[Master]', 'headMix', 'wego3.masterCueLed', !isBinding);
  if (isBinding) {
    engine.trigger('[Master]', 'headMix');
  }
};

wego3.bindDeckLeds = function(group, isBinding) {
  group = wego3.actualGroup(group);
  script.bindConnections(group, wego3.LED_CONTROL_FUNCTIONS, !isBinding);
  // Effects (they use different group names)
  var effectsGroup;
  if (wego3.shiftPressed) {
    effectsGroup = '[Headphone]';
  } else {
    effectsGroup = group;
  }
  for (var i = 1; i <= 3; ++i) {
    engine.connectControl('[EffectRack1_EffectUnit' + i + ']', 'group_' + effectsGroup + '_enable', 'wego3.fxLed', !isBinding);
    if (isBinding) {
      engine.trigger('[EffectRack1_EffectUnit' + i + ']', 'group_' + effectsGroup + '_enable');
    }
  }
};



// ========================
// Enable shifted functions
// ========================

for (var fnName in wego3) {
  print(fnName);
  if (fnName.substr(-17) == 'WhileShiftPressed') {
    (function (fnName) {
      var unshiftedName = fnName.substr(0, fnName.length - 17);
      print('Setting up shifted/unshifted for ' + fnName + '/' + unshiftedName);
      var shiftedFn = wego3[fnName];
      var unshiftedFn = wego3[unshiftedName];
      wego3[unshiftedName] = function (channel, control, value, status, group) {
        if (wego3.shiftPressed) {
          shiftedFn(channel, control, value, status, group);
        } else {
          unshiftedFn(channel, control, value, status, group);
        }
      };
    })(fnName);
  }
}
