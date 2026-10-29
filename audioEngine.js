// audioEngine.js - Motor de Audio y Música con Web Audio API

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;

    this.isPlayingMusic = false;
    this.isMuted = false;
    this.sfxEnabled = true;

    this.musicVolume = 0.35;
    this.sfxVolume = 0.5;

    this.currentTrack = 'cyber_groove';
    this.sequencerTimer = null;
    this.stepIndex = 0;
    this.tempo = 118; // BPM

    // Custom audio track element (if user uploads mp3)
    this.customAudio = null;
    this.customSourceNode = null;
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.isMuted ? 0 : 1;
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicVolume;
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxVolume;
      this.sfxGain.connect(this.masterGain);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMusicVolume(val) {
    this.musicVolume = Math.max(0, Math.min(1, val));
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(this.musicVolume, this.ctx.currentTime, 0.05);
    }
    if (this.customAudio) {
      this.customAudio.volume = this.musicVolume;
    }
  }

  setSfxVolume(val) {
    this.sfxVolume = Math.max(0, Math.min(1, val));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setTargetAtTime(this.sfxVolume, this.ctx.currentTime, 0.05);
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 1, this.ctx.currentTime, 0.05);
    }
    if (this.customAudio) {
      this.customAudio.muted = this.isMuted;
    }
    return this.isMuted;
  }

  toggleMusic() {
    this.ensureContext();
    if (this.isPlayingMusic) {
      this.stopMusic();
    } else {
      this.startMusic();
    }
    return this.isPlayingMusic;
  }

  startMusic(trackName = null) {
    this.ensureContext();
    if (trackName) {
      this.currentTrack = trackName;
    }

    if (this.currentTrack === 'custom' && this.customAudio) {
      this.stopMusic();
      this.customAudio.play().catch(e => console.warn(e));
      this.isPlayingMusic = true;
      return;
    }

    if (this.isPlayingMusic) {
      this.stopMusic();
    }

    this.isPlayingMusic = true;
    this.stepIndex = 0;

    // Tempo adjustments based on style
    if (this.currentTrack === 'cyber_groove') this.tempo = 120;
    else if (this.currentTrack === 'ambient_office') this.tempo = 90;
    else if (this.currentTrack === 'disco_party') this.tempo = 128;

    const stepDuration = 60 / this.tempo / 4; // 16th notes
    let nextNoteTime = this.ctx.currentTime + 0.05;

    const schedule = () => {
      if (!this.isPlayingMusic) return;

      while (nextNoteTime < this.ctx.currentTime + 0.25) {
        this.playSequencerStep(this.stepIndex, nextNoteTime);
        nextNoteTime += stepDuration;
        this.stepIndex = (this.stepIndex + 1) % 32;
      }

      this.sequencerTimer = setTimeout(schedule, 40);
    };

    schedule();
  }

  stopMusic() {
    this.isPlayingMusic = false;
    if (this.sequencerTimer) {
      clearTimeout(this.sequencerTimer);
      this.sequencerTimer = null;
    }
    if (this.customAudio) {
      this.customAudio.pause();
    }
  }

  // Multi-track procedural synth engine
  playSequencerStep(step, time) {
    if (!this.ctx || !this.isPlayingMusic) return;

    const track = this.currentTrack;

    if (track === 'cyber_groove') {
      this.playCyberGrooveStep(step, time);
    } else if (track === 'ambient_office') {
      this.playAmbientStep(step, time);
    } else if (track === 'disco_party') {
      this.playDiscoStep(step, time);
    }
  }

  // Track 1: Cyberpunk Synthwave
  playCyberGrooveStep(step, time) {
    const isQuarter = step % 4 === 0;

    // 1. Kick on 0, 8, 16, 24
    if (step % 8 === 0) {
      this.synthKick(time, 0.45);
    }

    // 2. Snare / Clap on 8 and 24
    if (step === 8 || step === 24) {
      this.synthSnare(time, 0.35);
    }

    // 3. Hi-Hat on offbeats
    if (step % 2 === 0) {
      this.synthHiHat(time, step % 4 === 2 ? 0.25 : 0.12);
    }

    // 4. Bassline (16th notes arpeggiated bass)
    const bassNotes = [36, 36, 48, 36, 39, 36, 46, 36, 34, 34, 46, 34, 38, 34, 45, 34];
    const midi = bassNotes[step % 16];
    if (midi) {
      this.synthBass(time, midiToFreq(midi), 0.28, 0.12);
    }

    // 5. Synth Chords / Arpeggio on bars
    if (isQuarter) {
      const chords = [
        [60, 63, 67], // Cm
        [58, 62, 65], // Bb
        [56, 60, 63], // Ab
        [58, 62, 67], // G/Bb
      ];
      const chordIdx = Math.floor(step / 8) % chords.length;
      const chord = chords[chordIdx];
      const note = chord[Math.floor((step % 8) / 2) % chord.length];
      this.synthPluck(time, midiToFreq(note + 12), 0.18, 0.2);
    }
  }

  // Track 2: Dreamy Ambient Office
  playAmbientStep(step, time) {
    // Soft subtle pulse kick on every 16 steps
    if (step % 16 === 0) {
      this.synthKick(time, 0.25, 45, 0.3);
    }

    // Soft chime hi-hat
    if (step % 4 === 2) {
      this.synthHiHat(time, 0.08);
    }

    // Warm Rhodes / Marimba bell arpeggios
    const pentatonic = [60, 63, 65, 67, 70, 72, 75, 77]; // C minor pentatonic
    if (step % 2 === 0 && Math.sin(step * 3.7) > -0.2) {
      const note = pentatonic[(step * 3) % pentatonic.length];
      this.synthBell(time, midiToFreq(note), 0.15, 0.6);
    }

    // Warm drone pad bass every 16 steps
    if (step % 16 === 0) {
      const droneNotes = [48, 44, 46, 43];
      const note = droneNotes[Math.floor(step / 8) % droneNotes.length];
      this.synthPad(time, midiToFreq(note), 0.2, 1.8);
    }
  }

  // Track 3: Disco & Funky Dance
  playDiscoStep(step, time) {
    // Four on the floor kick!
    if (step % 4 === 0) {
      this.synthKick(time, 0.55);
    }

    // Snare on 4 and 12 (quarters 2 and 4)
    if (step % 8 === 4) {
      this.synthSnare(time, 0.4);
    }

    // Open hi-hat on every off-beat (step 2, 6, 10, 14...)
    if (step % 4 === 2) {
      this.synthHiHat(time, 0.28, true);
    } else if (step % 2 === 0) {
      this.synthHiHat(time, 0.12, false);
    }

    // Funky Octave Bass (disco bounce)
    const rootNotes = [41, 41, 44, 46]; // F, Ab, Bb
    const currentRoot = rootNotes[Math.floor(step / 8) % rootNotes.length];
    const isUpper = step % 2 === 1;
    const note = isUpper ? currentRoot + 12 : currentRoot;
    this.synthBass(time, midiToFreq(note), 0.35, 0.11, 'sawtooth');

    // Funky guitar/brass stab on syncopated steps
    if (step === 3 || step === 6 || step === 11 || step === 14) {
      this.synthPluck(time, midiToFreq(currentRoot + 24), 0.2, 0.08);
      this.synthPluck(time, midiToFreq(currentRoot + 27), 0.2, 0.08);
    }
  }

  // --- SYNTHESIZERS ---

  synthKick(time, gainVal = 0.5, startFreq = 130, dur = 0.18) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(32, time + dur);

    gain.gain.setValueAtTime(gainVal, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + dur);
  }

  synthSnare(time, gainVal = 0.3) {
    // Noise buffer
    const bufferSize = this.ctx.sampleRate * 0.14;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.8;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 800;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(gainVal, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    noise.start(time);
  }

  synthHiHat(time, gainVal = 0.15, isOpen = false) {
    const dur = isOpen ? 0.18 : 0.04;
    const bufferSize = this.ctx.sampleRate * dur;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7500;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(gainVal, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    noise.start(time);
  }

  synthBass(time, freq, gainVal = 0.3, dur = 0.12, type = 'triangle') {
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, time);
    filter.frequency.exponentialRampToValueAtTime(200, time + dur);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(gainVal, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + dur);
  }

  synthPluck(time, freq, gainVal = 0.2, dur = 0.25) {
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3200, time);
    filter.frequency.exponentialRampToValueAtTime(400, time + dur);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(gainVal, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + dur);
  }

  synthBell(time, freq, gainVal = 0.15, dur = 0.8) {
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, time);
    osc2.frequency.setValueAtTime(freq * 2.01, time); // Subtle shimmer

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(gainVal, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.musicGain);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + dur);
    osc2.stop(time + dur);
  }

  synthPad(time, freq, gainVal = 0.15, dur = 1.6) {
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 650;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, time);
    gain.gain.linearRampToValueAtTime(gainVal, time + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + dur);
  }

  // --- SOUND EFFECTS (SFX) FOR ANIMATIONS & ACTIONS ---

  // --- SOUND EFFECTS (SFX) FOR ANIMATIONS & ACTIONS ---

  playAnimationSfx(animName) {
    if (!this.sfxEnabled) return;
    this.ensureContext();
    const now = this.ctx.currentTime;

    switch (animName) {
      case 'Joyful_Dance_with_Hand_Sway':
        this.sfxJoyfulDance(now);
        break;
      case 'Wave_One_Hand':
        this.sfxWaveOneHand(now);
        break;
      case 'Big_Wave_Hello':
        this.sfxBigWaveHello(now);
        break;
      case 'All_Night_Dance':
        this.sfxAllNightDance(now);
        break;
      case 'Walking':
        this.sfxFootstep(now);
        break;
      case 'Running':
        this.sfxRunning(now);
        break;
      case 'Skip_Forward':
        this.sfxSkipForward(now);
        break;
      case 'Cherish_Pop_Dance':
        this.sfxCherishPop(now);
        break;
      case 'Denim_Pop_Dance':
        this.sfxDenimPop(now);
        break;
      case 'Shake_It_Off_Dance':
        this.sfxShakeItOff(now);
        break;
      case 'Cheer_with_Both_Hands_1':
        this.sfxCheerFanfare(now);
        break;
      case 'Alert':
        this.sfxAlertSonar(now);
        break;
      case 'Alert_Quick_Turn_Right':
        this.sfxAlertQuickTurn(now);
        break;
      case 'Archery_Aim_with_Lateral_Scan':
        this.sfxArcheryAim(now);
        break;
      case 'Female_Crouch_Pick_Throw_Forward':
        this.sfxCrouchThrow(now);
        break;
      case 'Grip_and_Throw_Down':
        this.sfxGripSlam(now);
        break;
      case 'Headache_Relief':
        this.sfxHeadacheRelief(now);
        break;
      case 'Idle_Torch_Turn_Left':
        this.sfxTorchIdle(now);
        break;
      default:
        this.sfxDanceIntro(now);
        break;
    }
  }

  // 1. Danza Alegre (Joyful Dance): Happy synth arpeggio riff
  sfxJoyfulDance(time) {
    this.synthKick(time, 0.4, 140, 0.16);
    const notes = [523.25, 659.25, 783.99, 880, 783.99]; // C5, E5, G5, A5, G5
    notes.forEach((freq, i) => {
      const t = time + i * 0.08;
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.23);
    });
  }

  // 2. Saludo con una Mano: Sweet melodic 3-note bell chime
  sfxWaveOneHand(time) {
    const notes = [587.33, 739.99, 880]; // D5, F#5, A5
    notes.forEach((freq, idx) => {
      const t = time + idx * 0.09;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.5);
    });
  }

  // 3. Gran Saludo (Big Wave): Bright celestial double chime with sparkle
  sfxBigWaveHello(time) {
    const notes = [440, 554.37, 659.25, 880, 1108.73];
    notes.forEach((freq, idx) => {
      const t = time + idx * 0.07;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      osc1.type = 'sine';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(freq, t);
      osc2.frequency.setValueAtTime(freq * 2, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.16, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.sfxGain);

      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + 0.6);
      osc2.stop(t + 0.6);
    });
  }

  // 4. Baile Toda la Noche (All Night): Club laser riser + energetic techno drop
  sfxAllNightDance(time) {
    this.synthKick(time, 0.45, 160, 0.2);
    // Laser sweep
    const laser = this.ctx.createOscillator();
    laser.type = 'sawtooth';
    laser.frequency.setValueAtTime(900, time);
    laser.frequency.exponentialRampToValueAtTime(150, time + 0.22);

    const laserGain = this.ctx.createGain();
    laserGain.gain.setValueAtTime(0.25, time);
    laserGain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

    laser.connect(laserGain);
    laserGain.connect(this.sfxGain);

    laser.start(time);
    laser.stop(time + 0.23);

    // Synth stab chord on 0.15s
    const chord = [349.23, 440, 523.25]; // F major stab
    chord.forEach((freq) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, time + 0.15);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.18, time + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.38);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(time + 0.15);
      osc.stop(time + 0.4);
    });
  }

  // 5. Correr (Running): Double-tempo fast steps with shoe squeak
  sfxRunning(time) {
    // Two fast steps
    this.sfxFootstep(time);
    this.sfxFootstep(time + 0.11);

    // Light sneaker squeak
    const squeak = this.ctx.createOscillator();
    squeak.type = 'sine';
    squeak.frequency.setValueAtTime(1400, time + 0.05);
    squeak.frequency.linearRampToValueAtTime(1700, time + 0.09);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.08, time + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    squeak.connect(gain);
    gain.connect(this.sfxGain);

    squeak.start(time + 0.05);
    squeak.stop(time + 0.11);
  }

  // 6. Salto hacia Adelante (Skip): Playful cartoon spring boing
  sfxSkipForward(time) {
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, time);
    osc.frequency.exponentialRampToValueAtTime(750, time + 0.25);

    // Fast pitch vibrato for spring effect
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 24;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 60;
    lfo.connect(osc.frequency);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.24, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.26);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    lfo.start(time);
    osc.start(time);
    lfo.stop(time + 0.27);
    osc.stop(time + 0.27);
  }

  // 7. Danza Pop Cherish: Sparkly K-Pop synth pluck with double snap
  sfxCherishPop(time) {
    const notes = [659.25, 783.99, 987.77, 1318.51]; // E5, G5, B5, E6
    notes.forEach((freq, idx) => {
      const t = time + idx * 0.06;
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3000, t);
      filter.frequency.exponentialRampToValueAtTime(500, t + 0.18);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.2);
    });

    // Double snap at end
    this.synthSnare(time + 0.26, 0.25);
  }

  // 8. Danza Denim Pop: Slap-bass twang & retro funk burst
  sfxDenimPop(time) {
    // Slap bass thump
    const bass = this.ctx.createOscillator();
    bass.type = 'sawtooth';
    bass.frequency.setValueAtTime(82.41, time); // Low E
    bass.frequency.linearRampToValueAtTime(164.81, time + 0.04);
    bass.frequency.exponentialRampToValueAtTime(41, time + 0.2);

    const bassGain = this.ctx.createGain();
    bassGain.gain.setValueAtTime(0.35, time);
    bassGain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

    bass.connect(bassGain);
    bassGain.connect(this.sfxGain);

    bass.start(time);
    bass.stop(time + 0.22);

    // Funk brass stab
    const chord = [329.63, 440, 523.25];
    chord.forEach((freq) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time + 0.08);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.18, time + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.28);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(time + 0.08);
      osc.stop(time + 0.3);
    });
  }

  // 9. Danza Shake It Off: Rhythmic maraca/shaker triple burst
  sfxShakeItOff(time) {
    [0, 0.08, 0.16].forEach((offset) => {
      const t = time + offset;
      const bufferSize = this.ctx.sampleRate * 0.06;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1);
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 8500;
      filter.Q.value = 5;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.24, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      noise.start(t);
    });
  }

  // 10. Celebrar con Ambas Manos: Victory fanfare trumpet chords
  sfxCheerFanfare(time) {
    const chords = [
      { t: time, notes: [440, 554.37, 659.25] },        // A major
      { t: time + 0.18, notes: [587.33, 739.99, 880] },   // D major
      { t: time + 0.36, notes: [659.25, 830.61, 987.77] }, // E major victory
    ];

    chords.forEach(({ t, notes }) => {
      notes.forEach((freq) => {
        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(t);
        osc.stop(t + 0.5);
      });
    });
  }

  // 11. Modo Alerta: Tactical futuristic sonar pulse ping
  sfxAlertSonar(time) {
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1174.66, time); // D6
    osc.frequency.exponentialRampToValueAtTime(880, time + 0.28);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.26, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(time);
    osc.stop(time + 0.32);
  }

  // 12. Giro Rápido en Alerta: Rapid swivel whoosh + confirmation chirp
  sfxAlertQuickTurn(time) {
    this.sfxActionWhoosh(time);

    // Confirmation high chirp
    const chirp = this.ctx.createOscillator();
    chirp.type = 'sawtooth';
    chirp.frequency.setValueAtTime(987.77, time + 0.1);
    chirp.frequency.exponentialRampToValueAtTime(1567.98, time + 0.2);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.18, time + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

    chirp.connect(gain);
    gain.connect(this.sfxGain);

    chirp.start(time + 0.1);
    chirp.stop(time + 0.23);
  }

  // 13. Apuntar con Arco: Bow tension creak + target lock tone
  sfxArcheryAim(time) {
    // String tension draw
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, time);
    osc.frequency.linearRampToValueAtTime(420, time + 0.28);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.18, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(time);
    osc.stop(time + 0.32);

    // Target acquire beep
    const beep = this.ctx.createOscillator();
    beep.type = 'sine';
    beep.frequency.setValueAtTime(1760, time + 0.26);

    const beepGain = this.ctx.createGain();
    beepGain.gain.setValueAtTime(0.15, time + 0.26);
    beepGain.gain.exponentialRampToValueAtTime(0.001, time + 0.36);

    beep.connect(beepGain);
    beepGain.connect(this.sfxGain);

    beep.start(time + 0.26);
    beep.stop(time + 0.37);
  }

  // 14. Agacharse y Lanzar: Crouch swoosh + projectile whip throw
  sfxCrouchThrow(time) {
    // Low slide swoosh
    const bufferSize = this.ctx.sampleRate * 0.18;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(300, time);
    filter.frequency.exponentialRampToValueAtTime(1800, time + 0.16);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.22, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(time);

    // Whip snap
    this.synthSnare(time + 0.18, 0.3);
  }

  // 15. Agarrar y Azotar: Sub-bass charge + heavy ground slam impact
  sfxGripSlam(time) {
    // Charge hum
    const hum = this.ctx.createOscillator();
    hum.type = 'sawtooth';
    hum.frequency.setValueAtTime(90, time);
    hum.frequency.linearRampToValueAtTime(240, time + 0.15);

    const humGain = this.ctx.createGain();
    humGain.gain.setValueAtTime(0.2, time);
    humGain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);

    hum.connect(humGain);
    humGain.connect(this.sfxGain);

    hum.start(time);
    hum.stop(time + 0.17);

    // Heavy ground impact slam
    this.synthKick(time + 0.16, 0.65, 180, 0.35);
  }

  // 16. Alivio y Relajación: Soothing singing bowl peaceful tone
  sfxHeadacheRelief(time) {
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(432, time); // 432 Hz calming frequency
    osc2.frequency.setValueAtTime(434, time); // Subtle binaural beat (2Hz)

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, time);
    gain.gain.linearRampToValueAtTime(0.22, time + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.95);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + 1.0);
    osc2.stop(time + 1.0);
  }

  // 17. Postura Reposo (Idle con Antorcha): Cozy crackle & warm ambient hum
  sfxTorchIdle(time) {
    // Warm flame hum
    const hum = this.ctx.createOscillator();
    hum.type = 'triangle';
    hum.frequency.setValueAtTime(140, time);

    const humGain = this.ctx.createGain();
    humGain.gain.setValueAtTime(0.12, time);
    humGain.gain.exponentialRampToValueAtTime(0.001, time + 0.6);

    hum.connect(humGain);
    humGain.connect(this.sfxGain);

    hum.start(time);
    hum.stop(time + 0.65);

    // Crackle noise burst
    [0.08, 0.22, 0.38].forEach((offset) => {
      const t = time + offset;
      const bufferSize = this.ctx.sampleRate * 0.04;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 4000;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      noise.start(t);
    });
  }

  // Backward compatibility playSfx
  playSfx(type) {
    if (!this.sfxEnabled) return;
    this.ensureContext();
    const now = this.ctx.currentTime;
    if (type === 'step') this.sfxFootstep(now);
    else if (type === 'click') this.sfxUiClick(now);
    else this.playAnimationSfx(type);
  }


  // Step on office floor (soft polished acoustic tap)
  sfxFootstep(time) {
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    const randPitch = 160 + (Math.random() * 40 - 20);
    osc.frequency.setValueAtTime(randPitch, time);
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.06);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.22, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(time);
    osc.stop(time + 0.07);
  }

  // Melodic magic chime for waving/greeting
  sfxGreeting(time) {
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time + idx * 0.08);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.18, time + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, time + idx * 0.08 + 0.4);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(time + idx * 0.08);
      osc.stop(time + idx * 0.08 + 0.45);
    });
  }

  // Celebratory flourish
  sfxCheer(time) {
    const chords = [
      [440, 554.37, 659.25], // A major
      [587.33, 739.99, 880], // D major
    ];
    chords.forEach((chord, cIdx) => {
      const cTime = time + cIdx * 0.16;
      chord.forEach((freq) => {
        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, cTime);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.15, cTime);
        gain.gain.exponentialRampToValueAtTime(0.001, cTime + 0.6);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(cTime);
        osc.stop(cTime + 0.65);
      });
    });
  }

  // Dance start beat accent
  sfxDanceIntro(time) {
    this.synthKick(time, 0.4, 150, 0.2);
    // Synth laser riser
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, time);
    osc.frequency.exponentialRampToValueAtTime(880, time + 0.25);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(time);
    osc.stop(time + 0.26);
  }

  // Futuristic cyber alert ping
  sfxAlert(time) {
    [880, 1174.66].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      const t = time + idx * 0.12;
      osc.frequency.setValueAtTime(freq, t);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = freq;
      filter.Q.value = 6;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.2);
    });
  }

  // Swoosh / whoosh for actions like throw/archery
  sfxActionWhoosh(time) {
    const bufferSize = this.ctx.sampleRate * 0.22;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, time);
    filter.frequency.exponentialRampToValueAtTime(2400, time + 0.12);
    filter.frequency.exponentialRampToValueAtTime(300, time + 0.22);
    filter.Q.value = 3;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, time);
    gain.gain.linearRampToValueAtTime(0.28, time + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(time);
  }

  // Tactile button click
  sfxUiClick(time) {
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, time);
    osc.frequency.exponentialRampToValueAtTime(400, time + 0.03);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(time);
    osc.stop(time + 0.035);
  }

  // Allow uploading custom MP3/WAV file
  loadCustomAudioFile(file) {
    const url = URL.createObjectURL(file);
    if (!this.customAudio) {
      this.customAudio = new Audio();
      this.customAudio.loop = true;
    }
    this.customAudio.src = url;
    this.currentTrack = 'custom';
    this.startMusic('custom');
  }
}

function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export const audio = new AudioEngine();
