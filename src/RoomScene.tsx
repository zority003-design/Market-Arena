import { useCallback, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Text } from '@react-three/drei'
import * as THREE from 'three'
import { playSound } from './audio'

type RoomSceneProps = {
  onInteract: () => void
  onCanInteractChange: (value: boolean) => void
  onInteractObject: (object: 'lamp' | 'light' | 'curtains' | 'wardrobe') => void
  onNearbyObjectChange: (object: 'lamp' | 'light' | 'curtains' | 'wardrobe' | null) => void
  introActive: boolean
  onIntroComplete: () => void
  active: boolean
  ownedItems: string[]
  housingId: string
  gameMinutes: number
  onSleepInteract: () => void
  onCanSleepChange: (value: boolean) => void
  deskLampOn: boolean
  roomLightOn: boolean
  curtainsOpen: boolean
}

function FirstPersonRig({ active, onInteract, onCanInteractChange, onInteractObject, onNearbyObjectChange, introActive, onIntroComplete, onSleepInteract, onCanSleepChange }: { active: boolean; onInteract: () => void; onCanInteractChange: (value: boolean) => void; onInteractObject: (object: 'lamp' | 'light' | 'curtains' | 'wardrobe') => void; onNearbyObjectChange: (object: 'lamp' | 'light' | 'curtains' | 'wardrobe' | null) => void; introActive: boolean; onIntroComplete: () => void; onSleepInteract: () => void; onCanSleepChange: (value: boolean) => void }) {
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
  const nearbyObject = useRef<'lamp' | 'light' | 'curtains' | 'wardrobe' | null>(null)
  const introActiveRef = useRef(introActive)
  introActiveRef.current = introActive
  const introProgress = useRef(0)
  const introFinished = useRef(false)

  useEffect(() => {
    camera.position.set(0, 1.66, 3.55)
    camera.rotation.order = 'YXZ'
    yaw.current = 0
    pitch.current = -0.04
    camera.rotation.set(pitch.current, yaw.current, 0)
  }, [camera])

  useEffect(() => {
    if (!active) { onCanInteractChange(false); onCanSleepChange(false); onNearbyObjectChange(null); nearbyObject.current = null; interactable.current = false; sleepable.current = false; keys.current = {}; return }
    const down = (event: KeyboardEvent) => {
      if (!active) return
      const target = event.target as HTMLElement | null
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return
      if (event.key.toLowerCase() === 'e' && active && !introActiveRef.current) { if (sleepable.current) { event.preventDefault(); onSleepInteract(); return } if (nearbyObject.current) { event.preventDefault(); onInteractObject(nearbyObject.current); return } if (interactable.current) { event.preventDefault(); onInteract(); return } }
      keys.current[event.key.toLowerCase()] = true
      if (['w', 'a', 's', 'd', ' '].includes(event.key.toLowerCase())) event.preventDefault()
    }
    const up = (event: KeyboardEvent) => { keys.current[event.key.toLowerCase()] = false }
    const blur = () => { keys.current = {} }
    const element = gl.domElement
    const pointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return
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
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    element.addEventListener('pointerdown', pointerDown)
    window.addEventListener('pointermove', pointerMove)
    window.addEventListener('pointerup', pointerUp)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
      element.removeEventListener('pointerdown', pointerDown)
      window.removeEventListener('pointermove', pointerMove)
      window.removeEventListener('pointerup', pointerUp)
    }
  }, [gl, active, onInteract, onCanInteractChange, onInteractObject, onNearbyObjectChange, onSleepInteract, onCanSleepChange])

  useEffect(() => {
    if (!introActive) return
    camera.position.set(2.52, 0.76, 0.85)
    yaw.current = 0.1
    pitch.current = 0.12
    introProgress.current = 0
    introFinished.current = false
  }, [camera, introActive])

  useFrame((_, delta) => {
    if (!active) return
    const dt = Math.min(delta, 0.04)
    if (introActive) {
      introProgress.current = Math.min(1, introProgress.current + dt / 3.1)
      const t = introProgress.current * introProgress.current * (3 - 2 * introProgress.current)
      camera.position.set(2.52 + (1.45 - 2.52) * t, 0.76 + (1.66 - 0.76) * t, 0.85 + (2.15 - 0.85) * t)
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
      playSound('step')
      velocity.current.normalize().multiplyScalar(2.4 * dt)
      const stepX = velocity.current.x
      const stepZ = velocity.current.z
      const blocked = (x: number, z: number) =>
        (x > -1.38 && x < 1.62 && z > -2.98 && z < -1.72) ||
        (x > -0.43 && x < 0.63 && z > -1.38 && z < -0.58) ||
        (x > 1.48 && x < 3.62 && z > -0.78 && z < 2.78) ||
        (x > 2.48 && x < 3.88 && z > -3.92 && z < -3.22) ||
        (x > 3.16 && x < 3.72 && z > 2.64 && z < 3.24)
      const nextX = THREE.MathUtils.clamp(camera.position.x + stepX, -3.52, 3.52)
      if (!blocked(nextX, camera.position.z)) camera.position.x = nextX
      const nextZ = THREE.MathUtils.clamp(camera.position.z + stepZ, -3.52, 3.52)
      if (!blocked(camera.position.x, nextZ)) camera.position.z = nextZ
    }
    camera.position.y = 1.66
    camera.rotation.set(pitch.current, yaw.current, 0)
    const distance = Math.hypot(camera.position.x - 0.1, camera.position.z + 0.9)
    const canUse = distance < 1.25 && camera.position.z > -1.83
    if (canUse !== interactable.current) { interactable.current = canUse; onCanInteractChange(canUse) }
    const objectDistances: Array<{ id: 'lamp' | 'light' | 'curtains' | 'wardrobe'; x: number; z: number; radius: number }> = [
      { id: 'lamp', x: -1.03, z: -2.67, radius: 1.12 }, { id: 'light', x: -3.35, z: 2.05, radius: 0.72 },
      { id: 'curtains', x: -3.48, z: -1.12, radius: 1.02 }, { id: 'wardrobe', x: -3.03, z: -2.72, radius: 1.15 },
    ]
    const foundObject = objectDistances.find((item) => Math.hypot(camera.position.x - item.x, camera.position.z - item.z) < item.radius)?.id ?? null
    if (foundObject !== nearbyObject.current) { nearbyObject.current = foundObject; onNearbyObjectChange(foundObject) }
    const bedDistance = Math.hypot(camera.position.x - 1.2, camera.position.z - 0.8)
    const canSleep = bedDistance < 1.05 && camera.position.x > 0.55
    if (canSleep !== sleepable.current) { sleepable.current = canSleep; onCanSleepChange(canSleep) }
  })

  return null
}

function Box({ position, size, color, roughness = 0.8, metalness = 0, rotation, transparent = false, opacity = 1 }: {
  position: [number, number, number]
  size: [number, number, number]
  color: string
  roughness?: number
  metalness?: number
  rotation?: [number, number, number]
  transparent?: boolean
  opacity?: number
}) {
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} transparent={transparent} opacity={opacity} depthWrite={!transparent} />
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

function FloorBoards() {
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
        color: woodPalette[(row * 3 + col * 2) % woodPalette.length],
      }
    })
  }).flat(), [])

  return <group>{boards.map((board) => <Box key={board.key} position={board.position} size={board.size} color={board.color} roughness={0.76} />)}</group>
}


function Room({ onInteract, onCanInteractChange, onInteractObject, onNearbyObjectChange, introActive, onIntroComplete, active, ownedItems, housingId, gameMinutes, onSleepInteract, onCanSleepChange, deskLampOn, roomLightOn, curtainsOpen }: RoomSceneProps) {
  const screenRef = useRef<THREE.Mesh>(null!)
  const glowRef = useRef<THREE.PointLight>(null!)
  const interactable = useRef(false)
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
      <Box position={[0, 3.35, 0]} size={[8, 0.16, 8]} color="#222b34" />
      <Box position={[0, 1.62, -3.98]} size={[8, 3.4, 0.18]} color={housingId === "dorm" ? "#68717a" : housingId === "shared-flat" ? "#817c74" : housingId === "studio" ? "#a09b8e" : housingId === "city-apartment" ? "#b4b0a6" : "#c2b7a5"} />
      <Box position={[-3.98, 0.62, 0]} size={[0.18, 1.24, 8]} color="#5c646d" />
      <Box position={[-3.98, 3.09, 0]} size={[0.18, 0.46, 8]} color="#5c646d" />
      <Box position={[-3.98, 1.66, -3.09]} size={[0.18, 3.32, 1.82]} color="#5c646d" />
      <Box position={[-3.98, 1.66, 1.94]} size={[0.18, 3.32, 4.12]} color="#5c646d" />
      <Box position={[3.98, 1.62, 0]} size={[0.18, 3.4, 8]} color="#454d56" />
      <Box position={[0, 0.02, 0]} size={[7.8, 0.05, 7.8]} color={housingId === "dorm" ? "#30251f" : housingId === "shared-flat" ? "#4b3c32" : housingId === "studio" ? "#55483a" : housingId === "city-apartment" ? "#645747" : "#75644f"} roughness={0.98} />
      <FloorBoards />

      {/* Back wall details and skirting */}
      <Box position={[0, 0.14, -3.86]} size={[7.7, 0.16, 0.07]} color="#b4a18b" />
      <Box position={[-3.86, 0.14, 0]} size={[0.07, 0.16, 7.7]} color="#9b8a78" />
      <Box position={[3.86, 0.14, 0]} size={[0.07, 0.16, 7.7]} color="#8b7a6b" />
      {/* A framed market chart instead of unexplained wall stripes. */}
      <Box position={[-1.9, 1.96, -3.84]} size={[1.82, 1.22, 0.055]} color="#222b30" roughness={0.55} />
      <Box position={[-1.9, 1.96, -3.805]} size={[1.68, 1.08, 0.012]} color="#10201f" roughness={0.8} />
      <Text position={[-2.64, 2.42, -3.78]} fontSize={0.075} color="#a7c4b5" anchorX="left" anchorY="middle">KOTL · 1D</Text>
      <Text position={[-1.23, 2.42, -3.78]} fontSize={0.075} color="#dc8178" anchorX="right" anchorY="middle">−4,2%</Text>
      {[1.58, 1.82, 2.06, 2.3].map((y) => <Box key={y} position={[-1.9, y, -3.794]} size={[1.58, 0.006, 0.006]} color="#203b36" />)}
      {[-2.55, -2.15, -1.75, -1.35].map((x) => <Box key={x} position={[x, 1.96, -3.793]} size={[0.006, 0.92, 0.006]} color="#203b36" />)}





      {/* Candles and volume bars make the wall chart read as a real market chart, not random stripes. */}
      {[
        { x: -2.62, y: 1.78, h: 0.22, up: true }, { x: -2.38, y: 1.91, h: 0.31, up: true },
        { x: -2.14, y: 1.85, h: 0.18, up: false }, { x: -1.9, y: 2.05, h: 0.34, up: true },
        { x: -1.66, y: 2.16, h: 0.27, up: false }, { x: -1.42, y: 2.29, h: 0.32, up: true },
      ].map((candle) => <group key={'wall-candle-' + candle.x}>
        <Box position={[candle.x, candle.y, -3.776]} size={[0.025, candle.h + 0.1, 0.008]} color={candle.up ? '#58dca5' : '#dc8178'} />
        <Box position={[candle.x, candle.y, -3.769]} size={[0.075, candle.h * 0.45, 0.008]} color={candle.up ? '#58dca5' : '#dc8178'} />
      </group>)}

      {/* Window on left wall */}
      {/* Open window aperture: frame pieces leave the center transparent so the skyline is actually visible. */}
      <Box position={[-3.86, 2.05, -2.18]} size={[0.09, 1.62, 0.09]} color="#2a3946" roughness={0.35} />
      <Box position={[-3.86, 2.05, -0.12]} size={[0.09, 1.62, 0.09]} color="#2a3946" roughness={0.35} />
      <Box position={[-3.86, 2.82, -1.15]} size={[0.09, 0.09, 2.12]} color="#2a3946" roughness={0.35} />
      <Box position={[-3.86, 1.28, -1.15]} size={[0.09, 0.09, 2.12]} color="#2a3946" roughness={0.35} />
      <Box position={[-6.25, 2.05, -1.15]} size={[0.08, 3.8, 4.2]} color={gameMinutes >= 19 * 60 || gameMinutes < 6 * 60 ? "#182b40" : "#a9d4e4"} roughness={1} />
      <Box position={[-3.79, 2.05, -1.15]} size={[0.018, 1.43, 1.86]} color="#9ecbe0" roughness={0.12} metalness={0.08} transparent opacity={0.055} />
      {/* Clear window by default: rain is not a permanent weather state. */}
      {/* A real 3D city sits beyond the open window cut-out, not on the glass as a flat picture. */}
      {[
        { z: -1.92, y: 1.72, h: 1.18, w: 0.46, d: 0.55 },
        { z: -1.48, y: 1.98, h: 1.65, w: 0.38, d: 0.42 },
        { z: -1.02, y: 1.58, h: 0.88, w: 0.45, d: 0.5 },
        { z: -0.58, y: 1.84, h: 1.38, w: 0.4, d: 0.48 },
        { z: -0.18, y: 1.52, h: 0.78, w: 0.34, d: 0.38 },
      ].map((building, i) => (
        <group key={i}>
          <Box position={[-4.55 - (i % 2) * 0.22, building.y, building.z]} size={[building.d, building.h, building.w]} color={gameMinutes >= 19 * 60 || gameMinutes < 6 * 60 ? (i % 2 ? '#293b4b' : '#344653') : (i % 2 ? '#607b89' : '#526d7a')} roughness={0.96} />
          {Array.from({ length: Math.max(2, Math.floor(building.h / 0.2)) }, (_, row) => (
            <Box key={row} position={[-4.55 - (i % 2) * 0.22 + building.d / 2 + 0.008, building.y - building.h / 2 + 0.12 + row * 0.19, building.z]} size={[0.012, 0.045, building.w * 0.58]} color={gameMinutes >= 19 * 60 || gameMinutes < 6 * 60 ? '#f3d48d' : '#9ec4c9'} roughness={0.6} />
          ))}
        </group>
      ))}
      <Box position={[-3.75, 2.05, -1.15]} size={[0.06, 1.48, 0.055]} color="#e0d5c2" />
      <Box position={[-3.75, 2.05, -1.15]} size={[0.06, 0.055, 1.9]} color="#e0d5c2" />
      <Box position={[-3.73, 2.72, -1.15]} size={[0.12, 0.12, 2.18]} color="#6b5144" />
      <Box position={[-3.72, 2.04, curtainsOpen ? -1.95 : -1.62]} size={[0.075, 1.34, curtainsOpen ? 0.26 : 0.62]} color="#70545a" roughness={0.96} />
      <Box position={[-3.72, 2.04, curtainsOpen ? -0.35 : -0.68]} size={[0.075, 1.34, curtainsOpen ? 0.26 : 0.62]} color="#70545a" roughness={0.96} />
      {[-2.05, -1.75, -1.45, -1.15, -0.85, -0.55, -0.25].map((z) => (
        <Box key={z} position={[-3.69, 2.67, z]} size={[0.14, 0.07, 0.22]} color="#b7a58d" />
      ))}

      {/* A real wall light switch, close enough to interact with using E. */}
      <Box position={[-3.84, 1.55, 2.05]} size={[0.035, 0.2, 0.16]} color="#c5c1b4" roughness={0.7} />
      <Box position={[-3.81, 1.55, 2.05]} size={[0.025, 0.075, 0.055]} color="#f1ead9" roughness={0.35} />

      {/* Desk and metal frame */}
      <Box position={[0.15, 0.88, -2.36]} size={[2.7, 0.13, 1.05]} color="#674a37" roughness={0.5} />
      <Box position={[0.15, 0.81, -2.36]} size={[2.58, 0.035, 0.94]} color="#8d684b" roughness={0.4} />
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
      <group position={[3.3, 0.82, -0.92]}>
        <Box position={[0, 0.09, 0]} size={[0.3, 0.18, 0.12]} color="#252d31" roughness={0.42} />
        <Box position={[0, 0.1, 0.066]} size={[0.22, 0.095, 0.008]} color="#172a2b" roughness={0.28} />
        <Cylinder position={[0, 0.1, 0.074]} rotation={[Math.PI / 2, 0, 0]} radius={0.062} height={0.009} color="#d6c8a5" roughness={0.45} />
        <Box position={[0, 0.117, 0.081]} size={[0.006, 0.036, 0.005]} color="#2a3937" rotation={[0, 0, -((gameMinutes % 720) / 720) * Math.PI * 2]} />
        <Box position={[0, 0.104, 0.084]} size={[0.005, 0.052, 0.005]} color="#2a3937" rotation={[0, 0, -((gameMinutes % 60) / 60) * Math.PI * 2]} />
        <Cylinder position={[0, 0.1, 0.087]} rotation={[Math.PI / 2, 0, 0]} radius={0.006} height={0.006} color="#a34c3f" />
        <Cylinder position={[-0.105, 0.2, 0]} radius={0.055} height={0.025} color="#454c4c" metalness={0.3} />
        <Cylinder position={[0.105, 0.2, 0]} radius={0.055} height={0.025} color="#454c4c" metalness={0.3} />
      </group>
      <group position={[3.45, 0.32, 2.92]}>
        <Box position={[0, 0.23, 0]} size={[0.48, 0.46, 0.48]} color="#51575a" roughness={0.9} />
        <Box position={[0, 0.47, 0]} size={[0.5, 0.035, 0.5]} color="#687174" roughness={0.85} />
        {[-0.12, 0, 0.12].map((x) => <Box key={x} position={[x, 0.23, 0.245]} size={[0.018, 0.32, 0.008]} color="#343d40" />)}
        <Box position={[-0.08, 0.49, -0.02]} size={[0.18, 0.025, 0.16]} color="#536d76" rotation={[0, 0.2, -0.08]} />
        <Box position={[0.08, 0.5, 0.05]} size={[0.2, 0.03, 0.16]} color="#7c5d55" rotation={[0, -0.15, 0.04]} />
      </group>
      <Box position={[1.42, 0.09, 2.82]} size={[0.32, 0.08, 0.46]} color="#394a50" rotation={[0, -0.15, 0]} roughness={0.95} />
      <Box position={[1.73, 0.09, 2.9]} size={[0.31, 0.08, 0.44]} color="#4e4642" rotation={[0, 0.12, 0]} roughness={0.95} />

      {/* Bed and rumpled bedding */}
      <Box position={[2.52, 0.36, 0.95]} size={[1.9, 0.35, 3.1]} color="#493c36" />
      <Box position={[2.52, 0.59, 0.95]} size={[1.82, 0.16, 3.02]} color="#d0c8b8" roughness={0.98} />
      <Box position={[2.52, 0.7, -0.13]} size={[1.75, 0.11, 0.82]} color="#b3c1c4" roughness={1} />
      <Box position={[2.52, 0.69, 1.2]} size={[1.72, 0.09, 1.65]} color="#536c78" roughness={1} rotation={[0.02, 0, -0.025]} />
      <Box position={[2.52, 0.75, 1.9]} size={[0.85, 0.12, 0.52]} color="#c8c2b5" roughness={1} />
      <Box position={[2.52, 0.17, 2.55]} size={[1.92, 0.24, 0.14]} color="#5b4436" />
      {[-0.72, 0.72].map((x) => [-0.25, 2.12].map((z) => <Box key={x + ":" + z} position={[2.52 + x, 0.17, 0.95 + z]} size={[0.1, 0.3, 0.1]} color="#49372e" roughness={0.82} />))}

      {/* Shelf with clutter */}
      <Box position={[3.2, 2.18, -3.62]} size={[1.2, 0.08, 0.48]} color="#6b4b38" />
      <Box position={[3.2, 1.4, -3.62]} size={[1.2, 0.08, 0.48]} color="#6b4b38" />
      {[-0.32, 0.28].map((x) => (
        <Box key={x} position={[3.2 + x, 1.79, -3.62]} size={[0.06, 0.75, 0.43]} color="#4b382e" />
      ))}
      {[
        { x: 2.82, y: 1.68, c: '#9a5e49', h: 0.45 },
        { x: 2.98, y: 1.65, c: '#d0b27d', h: 0.39 },
        { x: 3.14, y: 1.7, c: '#526f70', h: 0.48 },
        { x: 3.35, y: 1.65, c: '#a7a6a0', h: 0.38 },
        { x: 3.5, y: 1.69, c: '#7c514a', h: 0.44 },
        { x: 2.9, y: 2.43, c: '#667b70', h: 0.35 },
        { x: 3.1, y: 2.4, c: '#d1b27b', h: 0.31 },
        { x: 3.35, y: 2.43, c: '#8d6457', h: 0.35 },
      ].map((book, i) => (
        <Box key={i} position={[book.x, book.y, -3.58]} size={[0.13, book.h, 0.3]} color={book.c} />
      ))}

      {/* Wall poster, framed market doodle */}
      <Box position={[-1.95, 2.15, -3.84]} size={[1.15, 0.9, 0.06]} color="#2e393d" />
      <Box position={[-1.95, 2.15, -3.8]} size={[1.03, 0.78, 0.02]} color="#182b2b" />
      <Box position={[-2.18, 2.04, -3.78]} size={[0.04, 0.26, 0.012]} color="#3bca9b" rotation={[0, 0, 0.22]} />
      <Box position={[-2.02, 2.14, -3.78]} size={[0.04, 0.42, 0.012]} color="#3bca9b" rotation={[0, 0, -0.15]} />
      <Box position={[-1.86, 2.22, -3.78]} size={[0.04, 0.56, 0.012]} color="#3bca9b" rotation={[0, 0, 0.28]} />
      <Box position={[-1.7, 2.3, -3.78]} size={[0.04, 0.34, 0.012]} color="#e2b86f" rotation={[0, 0, -0.2]} />

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
      <group position={[-3.05, 0.16, -2.92]}>
        <Box position={[0, 0.92, 0]} size={[1.0, 1.88, 0.68]} color="#49382e" roughness={0.9} /><Box position={[0, 0.92, 0.355]} size={[0.92, 1.78, 0.035]} color="#74523d" roughness={0.78} />
        <Box position={[-0.225, 0.92, 0.378]} size={[0.43, 1.7, 0.025]} color="#876247" roughness={0.8} /><Box position={[0.225, 0.92, 0.378]} size={[0.43, 1.7, 0.025]} color="#6e4d39" roughness={0.8} />
        <Box position={[0, 1.87, 0.37]} size={[0.96, 0.07, 0.06]} color="#a17a57" />{[-0.07, 0.07].map((x) => <Cylinder key={x} position={[x, 0.92, 0.405]} radius={0.025} height={0.12} color="#c3a46f" metalness={0.6} rotation={[Math.PI / 2, 0, 0]} />)}
        <Box position={[0, 0.19, 0.36]} size={[0.9, 0.08, 0.04]} color="#382b25" />
      </group>
      {/* Taller floor plant and small pots on the shelf. */}
      <group position={[3.25, 0.1, 2.95]}><Cylinder position={[0, 0.25, 0]} radius={0.24} height={0.5} color="#795846" />{Array.from({ length: 13 }, (_, i) => { const angle = i * 2.399; const height = 0.62 + (i % 5) * 0.13; return <mesh key={i} position={[Math.cos(angle) * (0.12 + (i % 3) * 0.04), height, Math.sin(angle) * (0.12 + (i % 3) * 0.04)]} rotation={[0.4 + (i % 3) * 0.18, angle, 0.45]}><sphereGeometry args={[0.13 + (i % 4) * 0.015, 12, 10]} /><meshStandardMaterial color={i % 3 === 0 ? '#315c43' : i % 2 ? '#477b51' : '#5d8e5d'} roughness={0.94} /></mesh> })}</group>

      {/* Worn rug */}
      <Box position={[0.1, 0.078, 0.5]} size={[3.1, 0.035, 2.1]} color="#3b4d50" roughness={1} />
      <Box position={[0.1, 0.098, 0.5]} size={[2.92, 0.008, 1.92]} color="#5c6966" roughness={1} />
      {[-0.92, 1.12].map((z) => <Box key={z} position={[0.1, 0.102, z]} size={[2.88, 0.006, 0.018]} color="#b29a70" roughness={1} />)}
      {[-1.34, 1.54].map((x) => <Box key={x} position={[x, 0.102, 0.5]} size={[0.018, 0.006, 1.84]} color="#b29a70" roughness={1} />)}
      <ContactShadows position={[0, 0.055, 0]} opacity={0.32} scale={9} blur={2.6} far={4.5} />
      <FirstPersonRig active={active} onInteract={onInteract} onCanInteractChange={handleCanInteractChange} onInteractObject={onInteractObject} onNearbyObjectChange={onNearbyObjectChange} introActive={introActive} onIntroComplete={onIntroComplete} onSleepInteract={onSleepInteract} onCanSleepChange={onCanSleepChange} />
    </>
  )
}

export default function RoomScene({ onInteract, onCanInteractChange, onInteractObject, onNearbyObjectChange, introActive, onIntroComplete, active, ownedItems, housingId, gameMinutes, onSleepInteract, onCanSleepChange, deskLampOn, roomLightOn, curtainsOpen }: RoomSceneProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.6]}
      camera={{ position: [0, 1.66, 3.55], fov: 64, near: 0.1, far: 40 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.setClearColor('#101922')
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.12
      }}
    >
      <Room onInteract={onInteract} onCanInteractChange={onCanInteractChange} onInteractObject={onInteractObject} onNearbyObjectChange={onNearbyObjectChange} introActive={introActive} onIntroComplete={onIntroComplete} active={active} ownedItems={ownedItems} housingId={housingId} gameMinutes={gameMinutes} onSleepInteract={onSleepInteract} onCanSleepChange={onCanSleepChange} deskLampOn={deskLampOn} roomLightOn={roomLightOn} curtainsOpen={curtainsOpen} />
    </Canvas>
  )
}
