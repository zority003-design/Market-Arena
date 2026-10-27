import { useCallback, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import { playSound } from './audio'
import { CityWindowView } from './CityScene'
import { BrokerModel } from './BrokerAvatar3D'

type RoomTextureKind = 'wood' | 'fabric' | 'plaster'

function makeBossHippoArtTexture() {
  const texture = new THREE.TextureLoader().load('/hippo-boss.svg')
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  return texture
}
function makeRoomTexture(kind: RoomTextureKind) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  if (!ctx) return new THREE.CanvasTexture(canvas)
  const image = ctx.createImageData(256, 256)
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
    const i = (y * 256 + x) * 4
    const seed = (x * 374761393 + y * 668265263 + x * y * 1442695041) >>> 0
    const grain = ((seed ^ (seed >>> 13)) % 25) - 12
    const woodGrain = kind === 'wood' ? Math.sin(y * 0.17 + Math.sin(x * 0.04) * 3) * 11 + (x % 29 === 0 ? -9 : 0) : 0
    const fabricWeave = kind === 'fabric' ? ((x % 4 === 0 ? -8 : 0) + (y % 4 === 0 ? -7 : 0)) : 0
    const value = Math.max(0, Math.min(255, (kind === 'plaster' ? 238 : 232) + grain + woodGrain + fabricWeave))
    image.data[i] = value; image.data[i + 1] = value; image.data[i + 2] = value; image.data[i + 3] = 255
  }
  ctx.putImageData(image, 0, 0)
  if (kind === 'wood') {
    ctx.strokeStyle = 'rgba(70,45,27,0.13)'
    for (let y = 0; y < 256; y += 23) { ctx.beginPath(); ctx.moveTo(0, y); ctx.bezierCurveTo(80, y + 5, 170, y - 5, 256, y + 2); ctx.stroke() }
  } else if (kind === 'fabric') {
    ctx.strokeStyle = 'rgba(0,0,0,0.12)'
    for (let n = 0; n < 256; n += 4) { ctx.beginPath(); ctx.moveTo(n, 0); ctx.lineTo(n, 256); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, n); ctx.lineTo(256, n); ctx.stroke() }
  } else {
    for (let n = 0; n < 320; n++) { ctx.fillStyle = n % 2 ? 'rgba(0,0,0,0.025)' : 'rgba(255,255,255,0.08)'; ctx.fillRect((n * 37) % 256, (n * 71) % 256, 1 + n % 2, 1 + n % 3) }
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping; texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(kind === 'wood' ? 2 : 1, kind === 'fabric' ? 2 : 1)
  texture.anisotropy = 4
  return texture
}

type RoomSceneProps = {
  onInteract: () => void
  onExitCity: () => void
  onCanExitCityChange: (value: boolean) => void
  onCanInteractChange: (value: boolean) => void
  onInteractObject: (object: 'lamp' | 'light' | 'curtains' | 'wardrobe') => void
  onNearbyObjectChange: (object: 'lamp' | 'light' | 'curtains' | 'wardrobe' | null) => void
  introActive: boolean
  onIntroComplete: () => void
  active: boolean
  ownedItems: string[]
  ownedEmployees: string[]
  ownedBusinessAssets: string[]
  businessUpgrades: string[]
  housingId: string
  gameMinutes: number
  onSleepInteract: () => void
  onCanSleepChange: (value: boolean) => void
  deskLampOn: boolean
  roomLightOn: boolean
  curtainsOpen: boolean
}

function FirstPersonRig({ active, onInteract, onExitCity, onCanExitCityChange, onCanInteractChange, onInteractObject, onNearbyObjectChange, introActive, onIntroComplete, onSleepInteract, onCanSleepChange }: { active: boolean; onInteract: () => void; onExitCity: () => void; onCanExitCityChange: (value: boolean) => void; onCanInteractChange: (value: boolean) => void; onInteractObject: (object: 'lamp' | 'light' | 'curtains' | 'wardrobe') => void; onNearbyObjectChange: (object: 'lamp' | 'light' | 'curtains' | 'wardrobe' | null) => void; introActive: boolean; onIntroComplete: () => void; onSleepInteract: () => void; onCanSleepChange: (value: boolean) => void }) {
  const { camera, gl } = useThree()
  const keys = useRef<Record<string, boolean>>({})
  const dragging = useRef(false)
  const last = useRef({ x: 0, y: 0 })
  const yaw = useRef(0)
  const pitch = useRef(-0.04)
  const velocity = useRef(new THREE.Vector3())
  const forward = useRef(new THREE.Vector3())
  const right = useRef(new THREE.Vector3())
  const interactable = useRef(false)
  const sleepable = useRef(false)
  const exitable = useRef(false)
  const nearbyObject = useRef<'lamp' | 'light' | 'curtains' | 'wardrobe' | null>(null)
  const introActiveRef = useRef(introActive)
  introActiveRef.current = introActive
  const activeRef = useRef(active)
  activeRef.current = active
  const introProgress = useRef(0)
  const introFinished = useRef(false)

  useEffect(() => {
    camera.position.set(0, 1.66, 3.12)
    camera.rotation.order = 'YXZ'
    yaw.current = 0
    pitch.current = -0.04
    camera.rotation.set(pitch.current, yaw.current, 0)
  }, [camera])

  useEffect(() => {
    if (!active) { onCanInteractChange(false); onCanSleepChange(false); onCanExitCityChange(false); onNearbyObjectChange(null); nearbyObject.current = null; interactable.current = false; sleepable.current = false; exitable.current = false; keys.current = {}; return }
    // Focus the scene as soon as the room becomes active; controls must not depend on clicking the canvas first.
    gl.domElement.focus({ preventScroll: true })
    const moveKeyFor = (event: KeyboardEvent) => {
      const byCode: Record<string, string> = { KeyW: 'w', KeyA: 'a', KeyS: 's', KeyD: 'd', ArrowUp: 'w', ArrowLeft: 'a', ArrowDown: 's', ArrowRight: 'd' }
      const byCharacter: Record<string, string> = { w: 'w', a: 'a', s: 's', d: 'd', ц: 'w', ф: 'a', ы: 's', в: 'd', 'arrowup': 'w', 'arrowleft': 'a', 'arrowdown': 's', 'arrowright': 'd' }
      return byCode[event.code] ?? byCharacter[event.key.toLowerCase()] ?? ''
    }
    const down = (event: KeyboardEvent) => {
      if (!activeRef.current) return
      const target = event.target as HTMLElement | null
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return
      const key = event.key.toLowerCase()
      const moveKey = moveKeyFor(event)
      if (moveKey) {
        keys.current[moveKey] = true
        event.preventDefault()
        return
      }
      if ((event.code === 'KeyE' || key === 'e' || key === 'у') && !introActiveRef.current) { event.preventDefault(); if (sleepable.current) { onSleepInteract(); return } if (nearbyObject.current) { onInteractObject(nearbyObject.current); return } if (interactable.current) { onInteract(); return } }
    }
    const up = (event: KeyboardEvent) => {
      const moveKey = moveKeyFor(event)
      if (moveKey) keys.current[moveKey] = false
    }
    const blur = () => { keys.current = {} }
    const element = gl.domElement
    const pointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return
      element.focus({ preventScroll: true })
      dragging.current = true
      last.current = { x: event.clientX, y: event.clientY }
    }
    const pointerMove = (event: PointerEvent) => {
      if (!dragging.current) return
      const dx = event.clientX - last.current.x
      const dy = event.clientY - last.current.y
      last.current = { x: event.clientX, y: event.clientY }
      yaw.current -= dx * 0.0035
      pitch.current = THREE.MathUtils.clamp(pitch.current - dy * 0.003, -1.05, 0.62)
    }
    const pointerUp = () => { dragging.current = false }
    window.addEventListener('keydown', down, true)
    window.addEventListener('keyup', up, true)
    window.addEventListener('blur', blur)
    element.addEventListener('pointerdown', pointerDown)
    window.addEventListener('pointermove', pointerMove)
    window.addEventListener('pointerup', pointerUp)
    return () => {
      window.removeEventListener('keydown', down, true)
      window.removeEventListener('keyup', up, true)
      window.removeEventListener('blur', blur)
      element.removeEventListener('pointerdown', pointerDown)
      window.removeEventListener('pointermove', pointerMove)
      window.removeEventListener('pointerup', pointerUp)
    }
  }, [gl, active, onInteract, onCanInteractChange, onInteractObject, onNearbyObjectChange, onSleepInteract, onCanSleepChange, onExitCity, onCanExitCityChange])

  useEffect(() => {
    if (!active || introActive) return
    // Re-focus after the wake-up animation so WASD is immediately available.
    gl.domElement.focus({ preventScroll: true })
    keys.current = {}
  }, [active, camera, gl, introActive])

  useEffect(() => {
    if (!introActive || !active) return
    // Fail-safe: if the render loop pauses during the intro, never leave movement locked.
    const timer = window.setTimeout(() => onIntroComplete(), 3600)
    return () => window.clearTimeout(timer)
  }, [active, introActive, onIntroComplete])

  useEffect(() => {
    if (!introActive) return
    camera.position.set(2.52, 0.76, 0.85)
    yaw.current = 0.1
    pitch.current = 0.12
    introProgress.current = 0
    introFinished.current = false
    keys.current = {}
  }, [camera, introActive])

  useFrame((_, delta) => {
    if (!active) return
    const dt = Math.min(delta, 0.04)
    if (introActive) {
      introProgress.current = Math.min(1, introProgress.current + dt / 2.45)
      // Wake up in place, then ease off the mattress; avoid the old long diagonal glide that felt like flying.
      const p = introProgress.current
      const t = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2
      camera.position.set(2.52 + (0.12 - 2.52) * t, 0.76 + (1.66 - 0.76) * t + Math.sin(p * Math.PI) * 0.025, 0.85 + (2.65 - 0.85) * t)
      pitch.current = 0.12 * (1 - t) - 0.04 * t
      yaw.current = 0.1 * (1 - t)
      camera.rotation.set(pitch.current, yaw.current, 0)
      if (introProgress.current >= 1 && !introFinished.current) { introFinished.current = true; onIntroComplete() }
      return
    }
    forward.current.set(-Math.sin(yaw.current), 0, -Math.cos(yaw.current))
    right.current.set(Math.cos(yaw.current), 0, -Math.sin(yaw.current))
    velocity.current.set(0, 0, 0)
    const k = keys.current
    if (k.w || k.arrowup) velocity.current.add(forward.current)
    if (k.s || k.arrowdown) velocity.current.sub(forward.current)
    if (k.d || k.arrowright) velocity.current.add(right.current)
    if (k.a || k.arrowleft) velocity.current.sub(right.current)
    if (velocity.current.lengthSq() > 0) {
      // Movement is driven by held physical keys, independent of keyboard layout.
      if (Math.random() < dt * 2.4) playSound('step')
      velocity.current.normalize().multiplyScalar(3.15 * dt)
      const stepX = velocity.current.x
      const stepZ = velocity.current.z
      const blocked = (x: number, z: number) =>
        (x > -1.38 && x < 1.62 && z > -2.98 && z < -1.72) ||
        (x > -0.43 && x < 0.63 && z > -1.38 && z < -0.58) ||
        (x > 1.52 && x < 3.62 && z > -0.66 && z < 2.58) ||
        (x > 0.91 && x < 1.58 && z > -0.52 && z < 0.02) ||
        (x > 2.48 && x < 3.88 && z > -3.92 && z < -3.22) ||
        false
      const nextX = THREE.MathUtils.clamp(camera.position.x + stepX, -3.52, 3.52)
      if (!blocked(nextX, camera.position.z)) camera.position.x = nextX
      const nextZ = THREE.MathUtils.clamp(camera.position.z + stepZ, -3.52, 3.52)
      if (!blocked(camera.position.x, nextZ)) camera.position.z = nextZ
    }
    camera.position.y = 1.66
    camera.rotation.set(pitch.current, yaw.current, 0)
    if (exitable.current) { exitable.current = false; onCanExitCityChange(false) }
    const distance = Math.hypot(camera.position.x - 0.1, camera.position.z + 0.9)
    const canUse = distance < 1.25 && camera.position.z > -1.83
    if (canUse !== interactable.current) { interactable.current = canUse; onCanInteractChange(canUse) }
    const objectDistances: Array<{ id: 'lamp' | 'light' | 'curtains' | 'wardrobe'; x: number; z: number; radius: number }> = [
      { id: 'lamp', x: -1.03, z: -2.67, radius: 1.12 }, { id: 'light', x: -3.35, z: 2.05, radius: 0.72 },
      { id: 'curtains', x: -3.48, z: -1.12, radius: 1.02 }, { id: 'wardrobe', x: -3.03, z: -2.72, radius: 1.15 },
    ]
    const foundObject = objectDistances.find((item) => Math.hypot(camera.position.x - item.x, camera.position.z - item.z) < item.radius)?.id ?? null
    if (foundObject !== nearbyObject.current) { nearbyObject.current = foundObject; onNearbyObjectChange(foundObject) }
    const bedDistance = Math.hypot(camera.position.x - 2.55, camera.position.z - 0.8)
    const canSleep = bedDistance < 1.9 && camera.position.x < 2.0 && camera.position.x > 0.75
    if (canSleep !== sleepable.current) { sleepable.current = canSleep; onCanSleepChange(canSleep) }
  })

  return null
}

function Box({ position, size, color, roughness = 0.8, metalness = 0, rotation, transparent = false, opacity = 1, emissive, emissiveIntensity = 0, textureKind }: {
  position: [number, number, number]
  size: [number, number, number]
  color: string
  roughness?: number
  metalness?: number
  rotation?: [number, number, number]
  transparent?: boolean
  opacity?: number
  emissive?: string
  emissiveIntensity?: number
  textureKind?: RoomTextureKind
}) {
  const surfaceTexture = useMemo(() => textureKind ? makeRoomTexture(textureKind) : null, [textureKind])
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} map={surfaceTexture ?? undefined} bumpMap={surfaceTexture ?? undefined} bumpScale={textureKind === 'wood' ? 0.045 : textureKind === 'fabric' ? 0.025 : 0.028} roughness={roughness} metalness={metalness} emissive={emissive} emissiveIntensity={emissiveIntensity} transparent={transparent} opacity={opacity} depthWrite={!transparent} />
    </mesh>
  )
}

function Cylinder({ position, radius, height, color, metalness = 0, roughness = 0.55, rotation }: {
  position: [number, number, number]
  radius: number
  height: number
  color: string
  metalness?: number
  roughness?: number
  rotation?: [number, number, number]
}) {
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <cylinderGeometry args={[radius, radius, height, 24]} />
      <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
    </mesh>
  )
}

const woodPalette = ['#73523d', '#805c43', '#674936', '#896447', '#76543d']

function FloorBoards({ housingId }: { housingId: string }) {
  const palette = housingId === 'dorm' ? ['#514b46', '#5b534b', '#46423f', '#655b52'] : housingId === 'premium-apartment' ? ['#c9b99c', '#bca987', '#d7c9ad', '#ad9977'] : woodPalette
  const boards = useMemo(() => Array.from({ length: 20 }, (_, row) => {
    const widths = row % 2 ? [2.35, 2.55, 2.9] : [1.9, 2.7, 3.2]
    let cursor = -3.9
    return widths.map((width, col) => {
      const x = cursor + width / 2
      cursor += width
      return {
        key: row + '-' + col,
        position: [x, 0.056, -3.705 + row * 0.39] as [number, number, number],
        size: [width - 0.025, 0.022, 0.365] as [number, number, number],
        color: palette[(row * 3 + col * 2) % palette.length],
      }
    })
  }).flat(), [])

  return <group>{boards.map((board) => <Box key={board.key} position={board.position} size={board.size} color={board.color} roughness={0.76} />)}</group>
}


function Room({ onInteract, onExitCity, onCanExitCityChange, onCanInteractChange, onInteractObject, onNearbyObjectChange, introActive, onIntroComplete, active, ownedItems, ownedEmployees, ownedBusinessAssets, businessUpgrades, housingId, gameMinutes, onSleepInteract, onCanSleepChange, deskLampOn, roomLightOn, curtainsOpen }: RoomSceneProps) {
  const screenRef = useRef<THREE.Mesh>(null!)
  const kittenArtTexture = useMemo(() => makeBossHippoArtTexture(), [])
  const glowRef = useRef<THREE.PointLight>(null!)
  const interactable = useRef(false)
  const backWallColor = housingId === 'dorm' ? '#425566' : housingId === 'shared-flat' ? '#6d817c' : housingId === 'studio' ? '#7c8a81' : housingId === 'city-apartment' ? '#9b9b8b' : '#d8d7d1'
  const panoramicWindow = housingId === 'premium-apartment'
  const dormRoom = housingId === 'dorm'
  const showStaffDesks = ownedItems.includes('partner-desk') || ownedEmployees.length > 0 || ownedBusinessAssets.includes('referral-desk') || businessUpgrades.includes('partner-office')
  const handleCanInteractChange = useCallback((value: boolean) => { interactable.current = value; onCanInteractChange(value) }, [onCanInteractChange])

  useFrame(({ clock }) => {
    const pulse = 0.88 + Math.sin(clock.elapsedTime * 1.4) * 0.06
    if (glowRef.current) glowRef.current.intensity = pulse * 1.3
  })

  return (
    <>
      <color attach="background" args={['#101922']} />
      <fog attach="fog" args={['#101922', 8, 18]} />
      <ambientLight intensity={roomLightOn ? 0.55 : 0.16} />
      <hemisphereLight args={['#b8d7ed', '#25252a', roomLightOn ? 1.05 : 0.32]} />
      <directionalLight position={[-3.8, 6, 2]} intensity={roomLightOn ? 2.25 : 0.45} color="#ffe2bd" castShadow shadow-mapSize={[1536, 1536]} />
      <pointLight position={[-3.2, 2.2, -1.5]} intensity={2.2} distance={7} color="#7bb7d9" />
      <pointLight ref={glowRef} position={[0, 1.55, -2.12]} intensity={1.2} distance={2.8} color="#31d6a0" />

      {/* Room shell */}
      <Box position={[0, -0.12, 0]} size={[8, 0.24, 8]} color="#4a3a32" roughness={0.95} />
      {/* Classic matte-white ceiling, slim perimeter trim and warm recessed downlights. */}
      <Box position={[0, 3.22, 0]} size={[7.98, 0.2, 7.98]} color="#f2f0e9" roughness={0.97} />
      <Box position={[0, 3.105, 0]} size={[7.84, 0.035, 7.84]} color="#dedbd2" roughness={0.9} />
      <Box position={[0, 3.082, 0]} size={[7.72, 0.025, 7.72]} color="#fbfaf5" roughness={0.92} />
      {[-2.55, 0, 2.55].flatMap((x) => [-2.55, 0, 2.55].map((z) => <group key={'ceiling-downlight-' + x + '-' + z} position={[x, 3.055, z]}><Cylinder position={[0, 0, 0]} radius={0.16} height={0.025} color="#d5d1c7" metalness={0.12} roughness={0.6} /><Cylinder position={[0, -0.016, 0]} radius={0.105} height={0.012} color="#fff7df" roughness={0.3} /></group>))}
      {[-3.78, 3.78].map((x) => <Box key={'ceiling-perimeter-' + x} position={[x, 3.095, 0]} size={[0.055, 0.08, 7.76]} color="#c9c5ba" roughness={0.84} />)}
      {/* Front wall opposite the desk: deliberately overlaps the floor edge to seal the exterior slit. */}
      <Box position={[0, 1.57, -3.98]} size={[8, 3.54, 0.28]} color={backWallColor} roughness={0.92} textureKind="plaster" />
      {/* Rear wall uses the same plaster texture as the side walls, with warm timber wainscoting and clear panel seams. */}
      <Box position={[0, 0.55, -3.865]} size={[7.76, 0.66, 0.055]} color={panoramicWindow ? "#d1c7b3" : "#806044"} roughness={0.9} textureKind="wood" />
      {Array.from({ length: 15 }, (_, i) => <Box key={'rear-wall-panel-' + i} position={[-3.72 + i * 0.53, 0.55, -3.825]} size={[0.025, 0.58, 0.025]} color={panoramicWindow ? "#b8a16c" : "#4e3b2d"} roughness={0.88} textureKind="wood" />)}
      <Box position={[0, 0.91, -3.82]} size={[7.78, 0.045, 0.045]} color={panoramicWindow ? "#b8a16c" : "#c09a6a"} roughness={0.65} textureKind="wood" />
      <Box position={[0, 1.24, -3.82]} size={[7.78, 0.035, 0.045]} color={panoramicWindow ? "#b8a16c" : "#c09a6a"} roughness={0.65} textureKind="wood" />
      {[-3.72, -1.85, 0, 1.85, 3.72].map((x, i) => <Box key={'rear-wall-upper-trim-' + i} position={[x, 1.72, -3.865]} size={[0.045, 1.45, 0.045]} color={panoramicWindow ? "#c8b990" : "#8b765e"} roughness={0.9} textureKind="wood" />)}
      {/* Left-side window opening, with a proper sill and dark metal frame. */}
      <Box position={[-3.98, 1.62, panoramicWindow ? -3.45 : -3.15]} size={[0.18, 3.4, panoramicWindow ? 0.9 : 1.7]} color={backWallColor} textureKind="plaster" />
      <Box position={[-3.98, 1.62, panoramicWindow ? 2.3 : 2.0]} size={[0.18, 3.4, panoramicWindow ? 3.4 : 4.0]} color={backWallColor} textureKind="plaster" />
      <Box position={[-3.98, 2.91, -1.15]} size={[0.18, 0.82, panoramicWindow ? 3.5 : 2.3]} color={backWallColor} textureKind="plaster" />
      <Box position={[-3.98, 0.48, -1.15]} size={[0.18, 0.96, panoramicWindow ? 3.5 : 2.3]} color={backWallColor} textureKind="plaster" />
      <Box position={[3.98, 1.62, 0]} size={[0.18, 3.4, 8]} color={backWallColor} textureKind="plaster" />
      {/* Opposite wall: the old scene was missing the entire +Z side, exposing the room like a cutaway. */}
      <Box position={[0, 1.58, 3.98]} size={[8, 3.56, 0.28]} color={backWallColor} roughness={0.92} textureKind="plaster" />
      {/* Plain uninterrupted blue-gray wall opposite the bed; decorative seams removed at the user's request. */}
      <Box position={[0, 0.16, 3.80]} size={[7.76, 0.22, 0.08]} color="#344c59" roughness={0.9} textureKind="wood" />

      <Box position={[0, 0.02, 0]} size={[7.8, 0.05, 7.8]} color={housingId === "dorm" ? "#30251f" : housingId === "shared-flat" ? "#4b3c32" : housingId === "studio" ? "#55483a" : housingId === "city-apartment" ? "#645747" : housingId === "premium-apartment" ? "#b7a98f" : "#75644f"} roughness={0.98} textureKind="wood" />
      <FloorBoards housingId={housingId} />

      {/* Warm wood skirting, consistent around the room. */}
      <Box position={[0, 0.14, -3.86]} size={[7.76, 0.17, 0.09]} color="#624a38" roughness={0.74} textureKind="wood" />
      {/* Split the window-wall trim around the opening so it cannot create a pale stripe across the glass. */}
      <Box position={[-3.86, 0.14, -3.15]} size={[0.09, 0.17, 1.7]} color="#624a38" roughness={0.74} textureKind="wood" />
      <Box position={[-3.86, 0.14, 2.0]} size={[0.09, 0.17, 4.0]} color="#624a38" roughness={0.74} textureKind="wood" />
      <Box position={[3.86, 0.14, 0]} size={[0.09, 0.17, 7.76]} color="#624a38" roughness={0.74} textureKind="wood" />
      <Box position={[0, 0.255, -3.86]} size={[7.76, 0.035, 0.085]} color="#a88963" roughness={0.58} textureKind="wood" />
      <Box position={[-3.86, 0.255, -3.15]} size={[0.085, 0.035, 1.7]} color="#a88963" roughness={0.58} textureKind="wood" />
      <Box position={[-3.86, 0.255, 2.0]} size={[0.085, 0.035, 4.0]} color="#a88963" roughness={0.58} textureKind="wood" />
      <Box position={[3.86, 0.255, 0]} size={[0.085, 0.035, 7.76]} color="#a88963" roughness={0.58} textureKind="wood" />

      {/* One clean framed illustration; old chart meshes are removed completely. */}
      <Box position={[-2.25, 2.0, -3.84]} size={[1.62, 1.48, 0.09]} color="#493a30" roughness={0.52} />
      <Box position={[-2.25, 2.0, -3.785]} size={[1.48, 1.34, 0.018]} color="#e7d6b8" roughness={0.85} />
      <Box position={[-2.25, 2.0, -3.765]} size={[1.42, 1.29, 0.025]} color="#b08a52" roughness={0.42} metalness={0.2} />
      <mesh position={[-2.25, 2.0, -3.748]}><planeGeometry args={[1.34, 1.21]} /><meshBasicMaterial map={kittenArtTexture} toneMapped={false} /></mesh>

      {/* A compact floating shelf, a few books and a framed certificate make the wall feel inhabited. */}
      <Box position={[1.35, 2.55, -3.82]} size={[1.75, 0.09, 0.26]} color="#604632" textureKind="wood" roughness={0.72} />
      <Box position={[0.68, 2.43, -3.83]} size={[0.07, 0.22, 0.1]} color="#4d3a2c" />
      <Box position={[2.02, 2.43, -3.83]} size={[0.07, 0.22, 0.1]} color="#4d3a2c" />
      {[
        { x: 0.82, h: 0.25, color: "#9a5748" },
        { x: 0.94, h: 0.29, color: "#d0b879" },
        { x: 1.06, h: 0.22, color: "#527b6b" },
        { x: 1.18, h: 0.27, color: "#40586a" },
      ].map((book) => <Box key={book.x} position={[book.x, 2.595 + book.h / 2, -3.82]} size={[0.095, book.h, 0.15]} color={book.color} roughness={0.9} />)}
      <Box position={[1.72, 2.79, -3.81]} size={[0.34, 0.42, 0.055]} color="#8c7354" />
      <Box position={[1.72, 2.79, -3.775]} size={[0.27, 0.35, 0.018]} color="#e9dfc9" />
      <Box position={[1.72, 2.82, -3.76]} size={[0.16, 0.018, 0.008]} color="#6b9b82" />
      <Box position={[1.72, 2.77, -3.76]} size={[0.11, 0.012, 0.008]} color="#b9a77d" />

      {/* Soft woven rug adds texture to the centre of the room. */}
      <Box position={[0.15, 0.067, 0.52]} size={[2.35, 0.025, 2.05]} color="#596f67" roughness={1} textureKind="fabric" />
      <Box position={[0.15, 0.082, 0.52]} size={[2.18, 0.009, 1.88]} color="#9a8a70" roughness={1} />
      {[-0.72, -0.36, 0, 0.36, 0.72].map((offset) => <Box key={'rug-line-' + offset} position={[0.15 + offset, 0.089, 0.52]} size={[0.025, 0.006, 1.78]} color="#50685f" roughness={1} />)}

      {/* Side-window city view: the skyline is now to the left of the desk, not behind the monitor. */}
      <CityWindowView night={gameMinutes >= 19 * 60 || gameMinutes < 6 * 60} wall="left" gameMinutes={gameMinutes} />
      <Box position={[-3.79, 1.9, panoramicWindow ? -3.0 : -2.3]} size={[0.16, 1.9, 0.12]} color={housingId === 'premium-apartment' ? "#b8b6ad" : "#293b43"} roughness={0.38} metalness={0.18} />
      <Box position={[-3.79, 1.9, panoramicWindow ? -1.2 : 0.0]} size={[0.16, 1.9, 0.12]} color={housingId === 'premium-apartment' ? "#b8b6ad" : "#293b43"} roughness={0.38} metalness={0.18} />
      {panoramicWindow && <Box position={[-3.79, 1.9, 0.6]} size={[0.16, 1.9, 0.12]} color="#b8b6ad" roughness={0.38} metalness={0.18} />}
      {panoramicWindow && <Box position={[-3.78, 1.9, -1.2]} size={[0.08, 1.78, 3.52]} color="#b5b5ae" roughness={0.28} metalness={0.32} transparent opacity={0.13} />}
      <Box position={[-3.79, 2.82, -1.15]} size={[0.16, 0.12, panoramicWindow ? 3.62 : 2.45]} color={housingId === 'premium-apartment' ? "#b8b6ad" : "#293b43"} roughness={0.38} metalness={0.18} />
      <Box position={[-3.79, 0.98, -1.15]} size={[0.18, 0.14, panoramicWindow ? 3.62 : 2.45]} color={housingId === 'premium-apartment' ? "#c4bca8" : "#7d6a56"} roughness={0.66} />
      <Box position={[-3.82, 1.9, -1.15]} size={[0.014, 1.62, panoramicWindow ? 3.45 : 2.2]} color={gameMinutes >= 19 * 60 || gameMinutes < 6 * 60 ? "#182d42" : "#9ed9ec"} roughness={0.14} metalness={0.06} transparent opacity={0.055} />
      <Box position={[-3.72, 1.9, -1.15]} size={[0.075, 1.62, 0.055]} color={housingId === 'premium-apartment' ? "#d6d2c7" : "#9eb7bd"} roughness={0.42} metalness={0.22} />
      <Box position={[-3.72, 1.9, -1.15]} size={[0.075, 0.055, panoramicWindow ? 3.52 : 2.35]} color={housingId === 'premium-apartment' ? "#d6d2c7" : "#9eb7bd"} roughness={0.42} metalness={0.22} />
      <Box position={[-3.72, 1.9, -1.15]} size={[0.075, 1.58, 0.045]} color={housingId === 'premium-apartment' ? "#d6d2c7" : "#9eb7bd"} roughness={0.42} metalness={0.22} />
      <Box position={[-3.72, 1.9, -1.15]} size={[0.075, 0.045, panoramicWindow ? 3.5 : 2.32]} color={housingId === 'premium-apartment' ? "#d6d2c7" : "#9eb7bd"} roughness={0.42} metalness={0.22} />
      {!panoramicWindow && <><Box position={[-3.7, 1.92, curtainsOpen ? -2.16 : -1.725]} size={[0.1, 1.42, curtainsOpen ? 0.24 : 1.15]} color="#c9b79a" roughness={0.96} textureKind="fabric" />
      <Box position={[-3.7, 1.92, curtainsOpen ? -0.14 : -0.575]} size={[0.1, 1.42, curtainsOpen ? 0.24 : 1.15]} color="#c9b79a" roughness={0.96} textureKind="fabric" /></>}

      {/* Small lived-in details: plant, books and framed personal photo. */}
      <Box position={[-3.72, 1.55, 2.05]} size={[0.035, 0.2, 0.16]} color="#c5c1b4" roughness={0.7} />
      <Box position={[-3.69, 1.55, 2.05]} size={[0.025, 0.075, 0.055]} color="#f1ead9" roughness={0.35} />
      {/* Desk and metal frame */}
      <Box position={[0.15, 0.88, -2.36]} size={[2.7, 0.13, 1.05]} color="#674a37" roughness={0.5} textureKind="wood" />
      <Box position={[0.15, 0.81, -2.36]} size={[2.58, 0.035, 0.94]} color="#8d684b" roughness={0.4} textureKind="wood" />
      {[-1.05, 1.35].map((x) => (
        <group key={x}>
          <Box position={[x, 0.43, -2.02]} size={[0.075, 0.76, 0.075]} color="#343a3f" metalness={0.72} />
          <Box position={[x, 0.43, -2.7]} size={[0.075, 0.76, 0.075]} color="#343a3f" metalness={0.72} />
        </group>
      ))}
      <Box position={[0.15, 0.45, -2.36]} size={[2.38, 0.055, 0.06]} color="#343a3f" metalness={0.65} />
      {/* Compact desktop tower, with vents and a power LED. */}
      <Box position={[-1.57, 0.39, -2.22]} size={[0.39, 0.68, 0.58]} color="#222a30" roughness={0.42} metalness={0.28} />
      <Box position={[-1.57, 0.39, -1.923]} size={[0.29, 0.55, 0.012]} color="#303b42" roughness={0.48} />
      {Array.from({ length: 7 }, (_, i) => <Box key={i} position={[-1.57, 0.19 + i * 0.055, -1.914]} size={[0.19, 0.012, 0.008]} color="#11191e" roughness={0.8} />)}
      <Box position={[-1.57, 0.65, -1.912]} size={[0.035, 0.035, 0.01]} color="#43d9a4" roughness={0.25} />

      {/* Purchasable desk and hired brokers become real room furniture, not inventory-only icons. */}
      {showStaffDesks && Array.from({ length: Math.max(1, Math.min(3, ownedEmployees.length || 1)) }, (_, index) => {
        const z = -2.55 + index * 2.0
        const employeeId = ownedEmployees[index]
        const jacket = ['#25445a', '#354b3d', '#493a50'][index % 3]
        return <group key={'staff-workstation-' + index}>
          <Box position={[2.48, 0.88, z]} size={[1.28, 0.12, 0.76]} color="#5d4636" roughness={0.55} textureKind="wood" />
          {[-0.52, 0.52].flatMap((dx) => [-0.27, 0.27].map((dz) => <Box key={dx + '-' + dz} position={[2.48 + dx, 0.44, z + dz]} size={[0.055, 0.78, 0.055]} color="#38434a" metalness={0.62} />))}
          <Box position={[2.48, 1.18, z - 0.22]} size={[0.66, 0.46, 0.06]} color="#151e24" metalness={0.3} roughness={0.3} />
          <Box position={[2.48, 1.18, z - 0.185]} size={[0.57, 0.36, 0.008]} color="#0d3d34" />
          <Box position={[2.39, 1.22, z - 0.178]} size={[0.24, 0.014, 0.005]} color="#47d7a4" />
          <Box position={[2.57, 1.12, z - 0.178]} size={[0.25, 0.012, 0.005]} color="#699a91" />
          {employeeId && <group position={[2.48, 0, z + 0.78]}>
            <BrokerModel identity={employeeId} outfit={employeeId.includes('senior') || employeeId.includes('team-lead') ? 'premium' : 'classic'} pose="seated" />
          </group>}
        </group>
      })}
      {/* Monitor, screen faces into the room */}
      <Box position={[0.1, 1.38, -2.64]} size={[1.42, 0.9, 0.09]} color="#151b21" roughness={0.28} metalness={0.25} />
      <mesh
        ref={screenRef}
        position={[0.1, 1.39, -2.585]}
        onClick={(event) => { event.stopPropagation(); if (interactable.current) onInteract() }}
        onPointerOver={() => { document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { document.body.style.cursor = 'default' }}
      >
        <planeGeometry args={[1.29, 0.75]} />
        <meshBasicMaterial color="#0b201d" />
      </mesh>
      {/* Small desk plant and personal items make the room feel lived-in. */}
      <mesh position={[1.12, 1.01, -2.2]} castShadow><cylinderGeometry args={[0.105, 0.13, 0.2, 24]} /><meshStandardMaterial color="#c28e68" roughness={0.84} /></mesh>
      <mesh position={[1.12, 1.115, -2.2]} castShadow><cylinderGeometry args={[0.09, 0.09, 0.018, 24]} /><meshStandardMaterial color="#332b23" roughness={1} /></mesh>
      {[-1, 0, 1].map((side) => <mesh key={'desk-leaf-' + side} position={[1.12 + side * 0.09, 1.24 + (side === 0 ? 0.06 : 0), -2.2]} rotation={[0, 0, side * -0.35]} scale={[0.65, 1.45, 0.38]} castShadow><sphereGeometry args={[0.095, 20, 16]} /><meshStandardMaterial color={side === 0 ? "#4d9970" : "#377d5c"} roughness={0.9} /></mesh>)}
      <Box position={[0.93, 0.976, -2.57]} size={[0.26, 0.045, 0.18]} color="#8b6045" roughness={0.86} />
      <Box position={[0.91, 1.01, -2.57]} size={[0.25, 0.025, 0.17]} color="#e0d3b9" roughness={0.92} />
      <Box position={[0.9, 1.033, -2.57]} size={[0.23, 0.02, 0.16]} color="#567b70" roughness={0.9} />
      {/* Monitor shows a tiny market chart that evolves with the in-game clock. */}
      <Box position={[-0.28, 1.66, -2.573]} size={[0.44, 0.018, 0.008]} color="#32d7a1" />
      <Box position={[-0.28, 1.59, -2.573]} size={[0.56, 0.009, 0.008]} color="#548c7d" />
      <Box position={[-0.28, 1.54, -2.573]} size={[0.38, 0.009, 0.008]} color="#548c7d" />
      <Box position={[0.43, 1.52, -2.573]} size={[0.34, 0.31, 0.008]} color="#143b32" />
      {[0, 1, 2, 3].map((row) => <Box key={'grid-y-' + row} position={[0.43, 1.42 + row * 0.065, -2.565]} size={[0.3, 0.006, 0.004]} color="#285447" />)}
      {Array.from({ length: 7 }, (_, i) => {
        const x = 0.30 + i * 0.043
        const y = 1.42 + ((i * 5 + Math.floor(gameMinutes / 10) * 3) % 6) * 0.035
        const rising = (i + Math.floor(gameMinutes / 10)) % 3 !== 0
        const candleColor = rising ? '#55e7b4' : '#d77c70'
        return <group key={'candle-' + i}>
          <Box position={[x, y, -2.558]} size={[0.006, 0.095, 0.004]} color={candleColor} />
          <Box position={[x, y + (rising ? 0.012 : -0.012), -2.555]} size={[0.025, 0.035 + (i % 3) * 0.012, 0.004]} color={candleColor} />
        </group>
      })}
      <Cylinder position={[0.1, 0.95, -2.61]} radius={0.09} height={0.12} color="#343c43" metalness={0.65} />
      <Box position={[0.1, 0.91, -2.61]} size={[0.44, 0.035, 0.23]} color="#313940" metalness={0.55} />
      <Box position={[0.1, 0.885, -2.61]} size={[0.27, 0.012, 0.16]} color="#11171c" roughness={0.35} />

      {/* Keyboard and mouse */}
      <Box position={[0.08, 0.96, -1.94]} size={[0.88, 0.045, 0.29]} color="#222a31" roughness={0.45} />
      {Array.from({ length: 5 }, (_, row) => Array.from({ length: 13 }, (_, col) => (
        <Box key={row + '-' + col} position={[-0.32 + col * 0.067, 0.986, -2.045 + row * 0.048]} size={[0.045, 0.009, 0.027]} color={row === 0 && col === 6 ? '#3b9e81' : '#69757d'} roughness={0.35} />
      )))}
      <Box position={[0.77, 0.99, -1.95]} size={[0.12, 0.065, 0.19]} color="#242b32" roughness={0.35} />
      <Box position={[0.77, 1.025, -1.95]} size={[0.018, 0.006, 0.07]} color="#75828b" />

      {/* Papers, mug and desk lamp */}
      <Box position={[-0.88, 0.96, -2.02]} size={[0.34, 0.018, 0.42]} color="#e1d8c8" rotation={[0, 0.09, 0]} />
      <Box position={[-0.88, 0.972, -2.02]} size={[0.25, 0.004, 0.012]} color="#858c91" rotation={[0, 0.09, 0]} />
      <Box position={[-0.88, 0.972, -2.08]} size={[0.23, 0.004, 0.012]} color="#858c91" rotation={[0, 0.09, 0]} />
      <Cylinder position={[1.1, 1.01, -2.03]} radius={0.095} height={0.15} color="#d7d0c2" />
      <Cylinder position={[1.1, 1.09, -2.03]} radius={0.075} height={0.012} color="#31251f" />
      <Cylinder position={[-1.03, 1.05, -2.67]} radius={0.04} height={0.22} color="#343b41" metalness={0.5} />
      <Box position={[-1.03, 1.17, -2.67]} size={[0.28, 0.07, 0.17]} color={ownedItems.includes("desk-lamp") ? "#f2ce83" : "#bba16f"} rotation={[0, 0, -0.25]} />
      <pointLight position={[-1.03, 1.12, -2.56]} intensity={deskLampOn ? 1.25 : 0} distance={2.4} color="#ffd69a" />

      {/* Purchasable equipment changes the physical scene, not only a menu statistic. */}
      {ownedItems.includes("ring-light") && <group position={[1.12, 1.68, -2.1]}>
        <mesh><torusGeometry args={[0.22, 0.025, 8, 32]} /><meshStandardMaterial color="#c7d2d1" metalness={0.72} roughness={0.25} /></mesh>
        <Box position={[0, -0.32, 0]} size={[0.035, 0.28, 0.035]} color="#69777b" metalness={0.55} />
        <pointLight position={[0, 0, 0.08]} intensity={0.45} distance={1.5} color="#e1f4ed" />
      </group>}
      {ownedItems.includes("hd-camera") && <group>
        <Box position={[0.1, 1.86, -2.64]} size={[0.22, 0.075, 0.09]} color="#222c31" roughness={0.28} metalness={0.35} />
        <Cylinder position={[0.1, 1.86, -2.585]} radius={0.026} height={0.014} color="#43d9a4" metalness={0.3} />
      </group>}
      {ownedItems.includes("second-monitor") && <group>
        <Box position={[1.27, 1.34, -2.64]} size={[0.68, 0.49, 0.07]} color="#171f25" roughness={0.28} metalness={0.3} />
        <Box position={[1.27, 1.34, -2.595]} size={[0.59, 0.4, 0.008]} color="#102b29" roughness={0.3} />
        <Box position={[1.13, 1.43, -2.586]} size={[0.22, 0.014, 0.006]} color="#3fd6a2" />
        <Box position={[1.34, 1.37, -2.586]} size={[0.28, 0.012, 0.006]} color="#739c94" />
        <Box position={[1.34, 1.31, -2.586]} size={[0.25, 0.012, 0.006]} color="#739c94" />
        <Cylinder position={[1.27, 1.05, -2.62]} radius={0.035} height={0.12} color="#505b62" metalness={0.55} />
      </group>}
      {ownedItems.includes("headset") && <mesh position={[-0.45, 1.015, -1.78]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.09, 0.025, 8, 24]} />
        <meshStandardMaterial color="#202a30" roughness={0.5} metalness={0.15} />
      </mesh>}
      {ownedItems.includes("pro-mic") && <group position={[0.94, 1.02, -1.86]}>
        <Cylinder position={[0, 0.09, 0]} radius={0.025} height={0.18} color="#353f46" metalness={0.55} />
        <mesh position={[0, 0.2, 0]}><sphereGeometry args={[0.055, 12, 10]} /><meshStandardMaterial color="#171f24" metalness={0.4} roughness={0.35} /></mesh>
      </group>}
      {ownedItems.includes("neutral-backdrop") && !ownedItems.includes("chromakey-kit") && <Box position={[0.1, 2.0, -3.12]} size={[2.55, 1.85, 0.035]} color="#737b78" roughness={0.98} />}
      {ownedItems.includes("chromakey-kit") && <group>
        <Box position={[0.1, 2.0, -3.12]} size={[2.65, 1.95, 0.04]} color="#1d8d65" roughness={0.96} />
        <Box position={[-1.22, 2.0, -3.09]} size={[0.045, 2.0, 0.05]} color="#4d5c5d" metalness={0.35} />
        <Box position={[1.42, 2.0, -3.09]} size={[0.045, 2.0, 0.05]} color="#4d5c5d" metalness={0.35} />
      </group>}

      {/* More believable swivel chair: padded seat, back, armrests, five-spoke base and casters. */}
      <Box position={[0.1, 0.52, -1.08]} size={[0.72, 0.16, 0.68]} color={ownedItems.includes("used-chair") ? "#344e4c" : "#2a3a3d"} roughness={0.72} />
      <Box position={[0.1, 0.61, -1.08]} size={[0.61, 0.055, 0.57]} color={ownedItems.includes("used-chair") ? "#47635e" : "#35494b"} roughness={0.88} />
      <Box position={[0.1, 0.93, -0.78]} size={[0.7, 0.72, 0.13]} color={ownedItems.includes("used-chair") ? "#35504c" : "#263538"} roughness={0.7} />
      <Box position={[0.1, 1.18, -0.765]} size={[0.46, 0.13, 0.145]} color="#344447" roughness={0.82} />
      {[-0.27, 0.47].map((x) => <group key={x}>
        <Box position={[x, 0.72, -1.08]} size={[0.07, 0.09, 0.45]} color="#303b3e" />
        <Box position={[x, 0.78, -1.04]} size={[0.09, 0.055, 0.4]} color="#3a474a" />
      </group>)}
      <Cylinder position={[0.1, 0.32, -1.08]} radius={0.055} height={0.38} color="#363e44" metalness={0.7} />
      {[0, 72, 144, 216, 288].map((angle) => <group key={angle} rotation={[0, angle * Math.PI / 180, 0]} position={[0.1, 0.14, -1.08]}>
        <Box position={[0.2, 0, 0]} size={[0.42, 0.045, 0.055]} color="#3a454a" metalness={0.68} />
        <Cylinder position={[0.39, -0.045, 0]} rotation={[Math.PI / 2, 0, 0]} radius={0.045} height={0.06} color="#1d2529" metalness={0.4} />
      </group>)}

      {/* Small lived-in details: a bedside alarm clock, laundry basket and slippers. */}
      <group position={[1.25, 0.82, -0.28]}>
        {/* A real bedside table supports the alarm clock instead of leaving it floating. */}
        <Box position={[0, -0.015, 0]} size={[0.42, 0.035, 0.3]} color="#684b38" roughness={0.82} textureKind="wood" />
        {[-1, 1].flatMap((x) => [-1, 1].map((z) => <Box key={x + '-' + z} position={[x * 0.165, -0.39, z * 0.105]} size={[0.035, 0.74, 0.035]} color="#49372d" roughness={0.9} textureKind="wood" />))}
        <Box position={[0, 0.09, 0]} size={[0.3, 0.18, 0.12]} color="#252d31" roughness={0.42} />
        <Box position={[0, 0.1, 0.066]} size={[0.22, 0.095, 0.008]} color="#172a2b" roughness={0.28} />
        <Cylinder position={[0, 0.1, 0.074]} rotation={[Math.PI / 2, 0, 0]} radius={0.062} height={0.009} color="#d6c8a5" roughness={0.45} />
        <Box position={[0, 0.117, 0.081]} size={[0.006, 0.036, 0.005]} color="#2a3937" rotation={[0, 0, -((gameMinutes % 720) / 720) * Math.PI * 2]} />
        <Box position={[0, 0.104, 0.084]} size={[0.005, 0.052, 0.005]} color="#2a3937" rotation={[0, 0, -((gameMinutes % 60) / 60) * Math.PI * 2]} />
        <Cylinder position={[0, 0.1, 0.087]} rotation={[Math.PI / 2, 0, 0]} radius={0.006} height={0.006} color="#a34c3f" />
        <Cylinder position={[-0.105, 0.2, 0]} radius={0.055} height={0.025} color="#454c4c" metalness={0.3} />
        <Cylinder position={[0.105, 0.2, 0]} radius={0.055} height={0.025} color="#454c4c" metalness={0.3} />
      </group>

      {/* Removed misplaced floor props to keep the entry path clear. */}

      {!dormRoom && <>
      {/* Bed aligned to the room axis: headboard and pillows at the window end, clear footboard at the opposite end. */}
      <Box position={[2.55, 0.36, 0.95]} size={[1.9, 0.35, 3.1]} color="#493c36" textureKind="wood" />
      <Box position={[2.55, 0.59, 0.95]} size={[1.82, 0.16, 3.02]} color="#ded8cb" roughness={0.98} textureKind="fabric" />
      <Box position={[2.55, 0.69, 0.98]} size={[1.72, 0.09, 1.72]} color="#526b78" roughness={1} textureKind="fabric" />
      <Box position={[2.55, 0.72, -0.22]} size={[0.82, 0.12, 0.48]} color="#ded8cb" roughness={1} />
      <Box position={[2.55, 0.72, -0.53]} size={[1.92, 0.72, 0.12]} color="#5b4436" />
      <Box position={[2.55, 0.17, 2.55]} size={[1.92, 0.24, 0.14]} color="#5b4436" />
      {[-0.72, 0.72].map((x) => [-1.32, 1.32].map((z) => <Box key={x + ":" + z} position={[2.55 + x, 0.17, 0.95 + z]} size={[0.1, 0.3, 0.1]} color="#49372e" roughness={0.82} />))}
      </>}
      {dormRoom && <group>
        {/* Shared dormitory bunk: cheap steel frame and two thin mattresses. */}
        <Box position={[2.55,0.34,0.95]} size={[1.82,0.18,2.92]} color="#303a42" metalness={0.48} roughness={0.58}/>
        <Box position={[2.55,0.52,0.95]} size={[1.72,0.16,2.82]} color="#a8b4bc" textureKind="fabric"/>
        <Box position={[2.55,1.38,0.95]} size={[1.82,0.14,2.92]} color="#303a42" metalness={0.48} roughness={0.58}/>
        <Box position={[2.55,1.54,0.95]} size={[1.72,0.14,2.82]} color="#b4c0c7" textureKind="fabric"/>
        <Box position={[2.55,1.82,-0.51]} size={[1.82,0.58,0.09]} color="#39464f" metalness={0.45}/>
        <Box position={[2.55,0.72,-0.51]} size={[1.82,0.34,0.09]} color="#39464f" metalness={0.45}/>
        {[-0.82,0.82].map(x=>[-0.48,2.38].map(z=><Box key={x+':'+z} position={[2.55+x,0.79,0.95+z]} size={[0.055,1.45,0.055]} color="#3b4850" metalness={0.55}/>))}
        <Box position={[1.55,0.82,0.62]} size={[0.08,1.38,0.08]} color="#56636c" metalness={0.5}/>
        {Array.from({length:5},(_,i)=><Box key={'bunk-rung-'+i} position={[1.55,0.3+i*0.24,0.62]} size={[0.08,0.045,0.34]} color="#77858c" metalness={0.6}/>) }
        <Box position={[2.55,1.65,1.65]} size={[0.82,0.11,0.42]} color="#d5dce0" textureKind="fabric"/>
      </group>}
      {/* Keep the wall beside the door clear and uncluttered. */}

      {panoramicWindow && <group>
        {/* Premium fit-out: cove lighting, brass trim, low designer sofa and glass coffee table. */}
        <Box position={[0,3.0,0]} size={[7.45,0.035,7.45]} color="#d5c7a5" metalness={0.22} roughness={0.35}/>
        <Box position={[0,2.96,0]} size={[7.25,0.025,7.25]} color="#f5e8c9" emissive="#f3d9a0" emissiveIntensity={0.16} roughness={0.35}/>
        <Box position={[-1.65,0.34,1.42]} size={[1.85,0.42,0.72]} color="#d5d0c5" roughness={0.74} textureKind="fabric"/>
        <Box position={[-1.65,0.68,1.73]} size={[1.85,0.48,0.16]} color="#c3bdae" roughness={0.74} textureKind="fabric"/>
        <Box position={[-2.48,0.52,1.39]} size={[0.14,0.38,0.7]} color="#b8ad98" roughness={0.72}/>
        <Box position={[-0.82,0.52,1.39]} size={[0.14,0.38,0.7]} color="#b8ad98" roughness={0.72}/>
        <Box position={[-1.65,0.18,0.63]} size={[1.22,0.08,0.58]} color="#b8b7b0" metalness={0.28} roughness={0.22} transparent opacity={0.82}/>
        <Cylinder position={[-2.08,0.09,0.45]} radius={0.035} height={0.16} color="#bca16c" metalness={0.7}/>
        <Cylinder position={[-1.22,0.09,0.45]} radius={0.035} height={0.16} color="#bca16c" metalness={0.7}/>
        <Box position={[0.15,2.65,-3.76]} size={[1.85,0.06,0.06]} color="#c9ad70" metalness={0.62}/>
      </group>}
      {dormRoom && <group>
        {/* Dormitory clutter is intentionally modest and inexpensive. */}
        <Box position={[-2.35,1.5,-3.78]} size={[0.72,0.62,0.035]} color="#8b9ba4" roughness={0.9}/>
        <Box position={[-2.35,1.5,-3.75]} size={[0.6,0.5,0.02]} color="#d6d2c5" roughness={0.9}/>
        <Box position={[-2.35,1.62,-3.73]} size={[0.42,0.018,0.01]} color="#b66c53"/>
        <Box position={[-2.35,1.5,-3.73]} size={[0.36,0.018,0.01]} color="#557a90"/>
        <Box position={[-2.35,1.38,-3.73]} size={[0.46,0.018,0.01]} color="#65836a"/>
        <Box position={[-1.65,0.24,2.7]} size={[0.55,0.44,0.55]} color="#7a858a" roughness={0.98}/>
        <Box position={[-1.65,0.48,2.7]} size={[0.48,0.035,0.48]} color="#9da7ad" roughness={0.98}/>
      </group>}
      {/* Small plant */}
      <Cylinder position={[-3.25, 0.24, 2.6]} radius={0.19} height={0.42} color="#8a6551" />
      {[
        { x: -3.35, y: 0.62, z: 2.58, r: 0.12 },
        { x: -3.13, y: 0.69, z: 2.62, r: 0.14 },
        { x: -3.25, y: 0.82, z: 2.55, r: 0.13 },
        { x: -3.4, y: 0.78, z: 2.68, r: 0.1 },
        { x: -3.12, y: 0.55, z: 2.48, r: 0.1 },
      ].map((leaf, i) => (
        <mesh key={i} position={[leaf.x, leaf.y, leaf.z]} rotation={[0.2, i * 0.7, 0.55]}>
          <sphereGeometry args={[leaf.r, 12, 10]} />
          <meshStandardMaterial color={i % 2 ? '#3d7253' : '#5b9165'} roughness={0.9} />
        </mesh>
      ))}

      {/* A full-height second-hand wardrobe with doors and brass handles. */}
      <group position={[-3.05, 0.04, -2.92]}>
        <Box position={[0, 0.92, 0]} size={[1.0, 1.88, 0.68]} color="#49382e" roughness={0.9} textureKind="wood" /><Box position={[0, 0.92, 0.355]} size={[0.92, 1.78, 0.035]} color="#74523d" roughness={0.78} textureKind="wood" />
        <Box position={[-0.225, 0.92, 0.378]} size={[0.43, 1.7, 0.025]} color="#876247" roughness={0.8} textureKind="wood" /><Box position={[0.225, 0.92, 0.378]} size={[0.43, 1.7, 0.025]} color="#6e4d39" roughness={0.8} textureKind="wood" />
        <Box position={[0, 1.87, 0.37]} size={[0.96, 0.07, 0.06]} color="#a17a57" />{[-0.07, 0.07].map((x) => <Cylinder key={x} position={[x, 0.92, 0.405]} radius={0.025} height={0.12} color="#c3a46f" metalness={0.6} rotation={[Math.PI / 2, 0, 0]} />)}
        <Box position={[0, 0.19, 0.36]} size={[0.9, 0.08, 0.04]} color="#382b25" />
      </group>
      {/* Keep the original small floor plant as the room's only shrub to avoid duplicate-looking bushes. */}

      {/* Worn rug */}
      <Box position={[0.1, 0.078, 0.5]} size={[3.1, 0.035, 2.1]} color="#3b4d50" roughness={1} />
      <Box position={[0.1, 0.098, 0.5]} size={[2.92, 0.008, 1.92]} color="#5c6966" roughness={1} />
      {[-0.92, 1.12].map((z) => <Box key={z} position={[0.1, 0.102, z]} size={[2.88, 0.006, 0.018]} color="#b29a70" roughness={1} />)}
      {[-1.34, 1.54].map((x) => <Box key={x} position={[x, 0.102, 0.5]} size={[0.018, 0.006, 1.84]} color="#b29a70" roughness={1} />)}
      <ContactShadows position={[0, 0.055, 0]} opacity={0.32} scale={9} blur={2.6} far={4.5} />
      <FirstPersonRig active={active} onInteract={onInteract} onExitCity={onExitCity} onCanExitCityChange={onCanExitCityChange} onCanInteractChange={handleCanInteractChange} onInteractObject={onInteractObject} onNearbyObjectChange={onNearbyObjectChange} introActive={introActive} onIntroComplete={onIntroComplete} onSleepInteract={onSleepInteract} onCanSleepChange={onCanSleepChange} />
    </>
  )
}

export default function RoomScene({ onInteract, onExitCity, onCanExitCityChange, onCanInteractChange, onInteractObject, onNearbyObjectChange, introActive, onIntroComplete, active, ownedItems, ownedEmployees, ownedBusinessAssets, businessUpgrades, housingId, gameMinutes, onSleepInteract, onCanSleepChange, deskLampOn, roomLightOn, curtainsOpen }: RoomSceneProps) {
  return (
    <div className="room-scene-root">
      <Canvas
        tabIndex={0}
        shadows
        dpr={[1, 1.6]}
        camera={{ position: [0, 1.66, 3.12], fov: 64, near: 0.1, far: 40 }}
        gl={{ antialias: true, powerPreference: 'high-performance', alpha: true }}
        onCreated={({ gl }) => {
          gl.setClearColor('#101922', 0)
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 1.12
        }}
      >
        <Room onInteract={onInteract} onExitCity={onExitCity} onCanExitCityChange={onCanExitCityChange} onCanInteractChange={onCanInteractChange} onInteractObject={onInteractObject} onNearbyObjectChange={onNearbyObjectChange} introActive={introActive} onIntroComplete={onIntroComplete} active={active} ownedItems={ownedItems} ownedEmployees={ownedEmployees} ownedBusinessAssets={ownedBusinessAssets} businessUpgrades={businessUpgrades} housingId={housingId} gameMinutes={gameMinutes} onSleepInteract={onSleepInteract} onCanSleepChange={onCanSleepChange} deskLampOn={deskLampOn} roomLightOn={roomLightOn} curtainsOpen={curtainsOpen} />
      </Canvas>
      {active && !introActive && <div className="room-keyboard-hint">WASD / ↑ ↓ ← → — движение <span>·</span> зажми ЛКМ и двигай мышью — обзор <span>·</span> E — действие</div>}
    </div>
  )
}
