type SoundKind = 'ui' | 'step' | 'computer' | 'alarm' | 'deal' | 'decline' | 'hangup' | 'notification' | 'tick' | 'countdown' | 'lamp' | 'curtain' | 'wardrobe' | 'sleep' | 'typing' | 'murmur'

type AudioSettings = {
  enabled: boolean
  ambience: boolean
  music: boolean
  musicVolume: number
  voice: boolean
  curtainsOpen: boolean
  inRoom: boolean
  inCall: boolean
  paused: boolean
  volume: number
}

let context: AudioContext | null = null
let master: GainNode | null = null
let ambienceGain: GainNode | null = null
let cityFilter: BiquadFilterNode | null = null
let rainGain: GainNode | null = null
let noiseSource: AudioBufferSourceNode | null = null
let rainSource: AudioBufferSourceNode | null = null
let settings: AudioSettings = {
  enabled: true, ambience: true, music: true, musicVolume: 0.42, voice: false, curtainsOpen: true, inRoom: true, inCall: false, paused: false, volume: 0.72,
}
let cityOscillator: OscillatorNode | null = null
let lastStepAt = 0
// Use the two MP3 soundtrack files shipped in public/audio.
const musicTracks = ['/audio/Endless%20Solitude.mp3', '/audio/Market%20Pulse.mp3']
let musicAudio: HTMLAudioElement | null = null
let nextMusicIndex = 0

function playProjectTrack() {
  if (!musicAudio || !settings.music || settings.paused) return
  musicAudio.src = musicTracks[nextMusicIndex]
  musicAudio.currentTime = 0
  musicAudio.volume = Math.max(0, Math.min(1, settings.musicVolume))
  void musicAudio.play().catch(() => {})
}

function startProjectMusic() {
  if (typeof window === 'undefined' || !settings.music || settings.paused) return
  if (!musicAudio) {
    musicAudio = new Audio()
    musicAudio.preload = 'auto'
    musicAudio.addEventListener('ended', () => {
      if (!settings.music || settings.paused) return
      nextMusicIndex = (nextMusicIndex + 1) % musicTracks.length
      playProjectTrack()
    })
  }
  if (!musicAudio.src) playProjectTrack()
  else if (musicAudio.paused) void musicAudio.play().catch(() => {})
  musicAudio.volume = Math.max(0, Math.min(1, settings.musicVolume))
}

function stopProjectMusic() {
  if (musicAudio) musicAudio.pause()
}

function installMusicUnlock() {
  if (typeof window === 'undefined' || musicUnlockInstalled) return
  musicUnlockInstalled = true
  const unlock = () => {
    if (settings.music && !settings.paused) startProjectMusic()
    window.removeEventListener('pointerdown', unlock, true)
    window.removeEventListener('keydown', unlock, true)
  }
  window.addEventListener('pointerdown', unlock, true)
  window.addEventListener('keydown', unlock, true)
}

function updateMusic() {
  if (typeof window === 'undefined') return
  if (settings.music && !settings.paused) {
    startProjectMusic()
    if (musicAudio) {
      musicAudio.volume = Math.max(0, Math.min(1, settings.musicVolume))
      if (musicAudio.paused && musicAudio.src) void musicAudio.play().catch(() => {})
    }
  } else stopProjectMusic()
}

function ensureAudio() {
  if (typeof window === 'undefined') return null
  if (!context) {
    const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextCtor) return null
    context = new AudioContextCtor()
    master = context.createGain()
    master.gain.value = settings.enabled ? 0.68 * settings.volume : 0
    master.connect(context.destination)

    ambienceGain = context.createGain()
    ambienceGain.gain.value = 0
    ambienceGain.connect(master)

    cityFilter = context.createBiquadFilter()
    cityFilter.type = 'lowpass'
    cityFilter.frequency.value = 380
    cityFilter.connect(ambienceGain)

    const makeNoise = (duration: number) => {
      const buffer = context!.createBuffer(1, context!.sampleRate * duration, context!.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.32
      return buffer
    }
    noiseSource = context.createBufferSource()
    noiseSource.buffer = makeNoise(3)
    noiseSource.loop = true
    const cityTone = context.createBiquadFilter()
    cityTone.type = 'lowpass'
    cityTone.frequency.value = 520
    noiseSource.connect(cityTone)
    cityTone.connect(cityFilter)
    noiseSource.start()

    rainGain = context.createGain()
    rainGain.gain.value = 0
    rainGain.connect(master)
    const rainTone = context.createBiquadFilter()
    rainTone.type = 'highpass'
    rainTone.frequency.value = 900
    rainSource = context.createBufferSource()
    rainSource.buffer = makeNoise(2)
    rainSource.loop = true
    rainSource.connect(rainTone)
    rainTone.connect(rainGain)
    rainSource.start()

    cityOscillator = context.createOscillator()
    cityOscillator.type = 'sine'
    cityOscillator.frequency.value = 62
    const trafficTone = context.createBiquadFilter()
    trafficTone.type = 'lowpass'
    trafficTone.frequency.value = 130
    const trafficGain = context.createGain()
    trafficGain.gain.value = 0.06
    cityOscillator.connect(trafficTone)
    trafficTone.connect(trafficGain)
    trafficGain.connect(cityFilter)
    cityOscillator.start()
  }
  if (context.state === 'suspended') void context.resume()
  return context
}

function updateAmbience() {
  const ctx = ensureAudio()
  if (!ctx || !master || !ambienceGain || !rainGain) return
  const audible = settings.enabled && settings.ambience && settings.inRoom && !settings.paused && !settings.inCall
  const curtainFactor = settings.curtainsOpen ? 1 : 0.18
  const nightFactor = 1
  ambienceGain.gain.setTargetAtTime(audible ? curtainFactor * 0.12 * nightFactor : 0, ctx.currentTime, 0.8)
  rainGain.gain.setTargetAtTime(0, ctx.currentTime, 0.8)
  master.gain.setTargetAtTime(settings.enabled ? 0.68 * Math.max(0, Math.min(1, settings.volume)) : 0, ctx.currentTime, 0.05)
  updateMusic()
}

export function configureAudio(next: Partial<AudioSettings>) {
  installMusicUnlock()
  settings = { ...settings, ...next }
  updateAmbience()
  updateMusic()
}

function tone(frequency: number, duration: number, type: OscillatorType, volume: number, endFrequency?: number) {
  const ctx = ensureAudio()
  if (!ctx || !master || !settings.enabled) return
  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()
  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime)
  if (endFrequency) oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), ctx.currentTime + duration)
  gain.gain.setValueAtTime(0.0001, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), ctx.currentTime + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration)
  oscillator.connect(gain)
  gain.connect(master)
  oscillator.start()
  oscillator.stop(ctx.currentTime + duration + 0.03)
}

export function playSound(kind: SoundKind, intensity = 1) {
  installMusicUnlock()
  const ctx = ensureAudio()
  updateMusic()
  if (!ctx || !settings.enabled) return
  switch (kind) {
    case 'ui':
      tone(680, 0.045, 'sine', 0.055, 540)
      break
    case 'step':
      if (ctx.currentTime - lastStepAt < 0.28) return
      lastStepAt = ctx.currentTime
      tone(105, 0.085, 'triangle', 0.1, 58)
      tone(46, 0.07, 'sine', 0.05, 34)
      break
    case 'computer':
      tone(170, 0.18, 'sine', 0.12, 430)
      window.setTimeout(() => tone(620, 0.11, 'sine', 0.045, 740), 100)
      break
    case 'alarm':
      tone(880, 0.22, 'square', 0.065, 700)
      window.setTimeout(() => tone(880, 0.22, 'square', 0.065, 700), 260)
      window.setTimeout(() => tone(880, 0.22, 'square', 0.065, 700), 520)
      break
    case 'deal':
      tone(520, 0.12, 'sine', 0.08, 660)
      window.setTimeout(() => tone(780, 0.18, 'sine', 0.08, 990), 100)
      break
    case 'decline':
      tone(240, 0.24, 'triangle', 0.085, 145)
      break
    case 'hangup':
      tone(420, 0.16, 'sine', 0.07, 190)
      break
    case 'notification':
      tone(740, 0.1, 'sine', 0.06, 880)
      break
    case 'tick':
      tone(1420, 0.018, 'sine', 0.014, 1250)
      break
    case 'countdown':
      tone(1180, 0.075, 'sine', 0.09 * Math.max(1, intensity), 980)
      break
    case 'lamp':
      tone(130, 0.045, 'square', 0.035, 85)
      break
    case 'curtain':
      tone(180, 0.13, 'sawtooth', 0.025, 95)
      break
    case 'wardrobe':
      tone(210, 0.16, 'triangle', 0.045, 130)
      window.setTimeout(() => tone(360, 0.09, 'sine', 0.025, 280), 100)
      break
    case 'sleep':
      tone(330, 0.22, 'sine', 0.05, 220)
      break
    case 'typing': {
      const frequency = 720 + Math.random() * 620
      tone(frequency, 0.018 + Math.random() * 0.012, 'square', 0.012, frequency * 0.78)
      break
    }
    case 'murmur': {
      // Soft, non-verbal voice-like background texture: deliberately quiet and short.
      const base = 115 + Math.random() * 65
      tone(base, 0.22, 'triangle', 0.012, base * (0.88 + Math.random() * 0.16))
      window.setTimeout(() => tone(base * (1.15 + Math.random() * 0.18), 0.16, 'triangle', 0.009, base * 0.92), 110)
      break
    }
  }
}

export function speakText(text: string, role: 'client' | 'player' = 'client') {
  if (!settings.voice || typeof window === 'undefined' || !('speechSynthesis' in window)) return
  const clean = text.replace(/<[^>]*>/g, '').trim()
  if (!clean) return
  const utterance = new SpeechSynthesisUtterance(clean)
  utterance.lang = 'ru-RU'
  utterance.rate = role === 'client' ? 0.88 : 0.95
  utterance.pitch = role === 'client' ? 0.98 : 1.0
  utterance.volume = 0.84
  const voices = window.speechSynthesis.getVoices()
  const russian = voices.find((voice) => voice.lang.toLowerCase().startsWith('ru'))
  if (russian) utterance.voice = russian
  window.speechSynthesis.speak(utterance)
}

export function stopSpeech() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel()
}

export function isVoiceEnabled() {
  return settings.voice
}
