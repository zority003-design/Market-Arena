import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Text } from '@react-three/drei'
import * as THREE from 'three'

type LocationId = 'office' | 'exchange' | 'cafe' | 'newsstand'
type CitySceneProps = {
  gameMinutes: number
  onEnterHome: () => void
  onOpenLocation: (location: LocationId) => void
}

const locations: { id: LocationId; label: string; x: number; z: number; hint: string }[] = [
  { id: 'cafe', label: 'КАФЕ ИНВЕСТОРОВ', x: -5.2, z: -1.6, hint: 'Личные встречи и знакомство с предпринимателями' },
  { id: 'exchange', label: 'БИРЖЕВАЯ ПЛОЩАДЬ', x: 5.3, z: -6.7, hint: 'Котировки, рынок и деловые новости' },
  { id: 'newsstand', label: 'КИОСК НОВОСТЕЙ', x: 0.5, z: -10.2, hint: 'Свежая пресса и рыночные слухи' },
  { id: 'office', label: 'ДЕЛОВОЙ ЦЕНТР', x: 8.3, z: -1.3, hint: 'Офисы и недвижимость' },
]

function Block({ position, size, color, roughness = 0.9, metalness = 0 }: { position: [number, number, number]; size: [number, number, number]; color: string; roughness?: number; metalness?: number }) {
  return <mesh position={position} castShadow receiveShadow><boxGeometry args={size} /><meshStandardMaterial color={color} roughness={roughness} metalness={metalness} /></mesh>
}

function Building({ x, z, width, depth, height, color, label, shop = false, night = false }: { x: number; z: number; width: number; depth: number; height: number; color: string; label: string; shop?: boolean; night: boolean }) {
  const floors = Math.max(2, Math.floor(height / 1.15))
  const windows = Math.max(2, Math.floor(width / 0.72))
  return <group position={[x, 0, z]}>
    <Block position={[0, height / 2, 0]} size={[width, height, depth]} color={color} />
    <Block position={[0, height + 0.07, 0]} size={[width + 0.18, 0.14, depth + 0.18]} color={shop ? '#343d3c' : '#3b4449'} />
    {Array.from({ length: floors }, (_, row) => Array.from({ length: windows }, (_, col) => {
      const wx = -width / 2 + (col + 0.5) * width / windows
      const wy = 0.55 + row * (height - 0.8) / floors
      const lit = night && (row * 3 + col * 5 + Math.round(x)) % 4 !== 0
      return <group key={row + '-' + col}>
        <Block position={[wx, wy, depth / 2 + 0.012]} size={[Math.min(0.34, width / windows * 0.48), shop ? 0.36 : 0.42, 0.035]} color={lit ? '#e5c68b' : '#7396a0'} roughness={0.35} metalness={0.08} />
        <Block position={[wx, wy, -depth / 2 - 0.012]} size={[Math.min(0.34, width / windows * 0.48), 0.42, 0.035]} color={lit ? '#e5c68b' : '#7396a0'} roughness={0.35} />
      </group>
    })) }
    {shop && <>
      <Block position={[0, 0.66, depth / 2 + 0.035]} size={[width * 0.74, 0.82, 0.07]} color="#263a38" roughness={0.4} />
      <Block position={[0, 1.25, depth / 2 + 0.09]} size={[width * 0.9, 0.13, 0.11]} color="#b58c5a" />
    </>}
    <Text position={[0, height + 0.35, depth / 2 + 0.03]} fontSize={0.25} maxWidth={width + 1} color="#e4e9df" anchorX="center" outlineWidth={0.012} outlineColor="#182326">{label}</Text>
  </group>
}

function Tree({ position }: { position: [number, number, number] }) {
  return <group position={position}>
    <mesh position={[0, 0.62, 0]} castShadow><cylinderGeometry args={[0.12, 0.17, 1.25, 8]} /><meshStandardMaterial color="#574536" roughness={1} /></mesh>
    <mesh position={[0, 1.72, 0]} castShadow><icosahedronGeometry args={[0.78, 1]} /><meshStandardMaterial color="#365c48" roughness={1} /></mesh>
    <mesh position={[-0.27, 1.48, 0.13]} castShadow><icosahedronGeometry args={[0.48, 1]} /><meshStandardMaterial color="#416d50" roughness={1} /></mesh>
    <mesh position={[0.29, 1.55, -0.12]} castShadow><icosahedronGeometry args={[0.49, 1]} /><meshStandardMaterial color="#2e513f" roughness={1} /></mesh>
  </group>
}

function StreetLamp({ position, night }: { position: [number, number, number]; night: boolean }) {
  return <group position={position}>
    <Block position={[0, 1.55, 0]} size={[0.08, 3.1, 0.08]} color="#333e42" metalness={0.55} />
    <Block position={[0.27, 3.03, 0]} size={[0.62, 0.08, 0.08]} color="#333e42" metalness={0.55} />
    <mesh position={[0.55, 2.98, 0]}><sphereGeometry args={[0.13, 16, 12]} /><meshStandardMaterial color={night ? '#f4dba0' : '#c9d6cb'} emissive={night ? '#f3c875' : '#000000'} emissiveIntensity={night ? 1.6 : 0} /></mesh>
    {night && <pointLight position={[0.55, 2.8, 0]} intensity={0.65} distance={5} color="#f4d7a0" />}
  </group>
}

function District({ gameMinutes }: { gameMinutes: number }) {
  const night = gameMinutes >= 19 * 60 || gameMinutes < 6 * 60
  const evening = gameMinutes >= 17 * 60 || gameMinutes < 7 * 60
  return <>
    <color attach="background" args={[night ? '#101c2a' : '#9abac7']} />
    <fog attach="fog" args={[night ? '#101c2a' : '#9abac7', 24, 68]} />
    <ambientLight intensity={night ? 0.34 : 1.05} />
    <hemisphereLight args={[night ? '#8298bd' : '#e1eff2', '#4a5548', night ? 0.45 : 1.25]} />
    <directionalLight position={[-12, 18, 8]} intensity={night ? 0.55 : 2.1} color={evening ? '#f0d1a6' : '#fff2dc'} castShadow shadow-mapSize={[2048, 2048]} />
    <Block position={[0, -0.22, -4]} size={[48, 0.4, 44]} color="#59625d" />
    <Block position={[0, -0.01, -4]} size={[8.5, 0.08, 40]} color="#343e43" roughness={0.98} />
    <Block position={[-6.1, 0.015, -4]} size={[3.6, 0.12, 40]} color="#8b9085" />
    <Block position={[6.1, 0.015, -4]} size={[3.6, 0.12, 40]} color="#8b9085" />
    <Block position={[0, 0.035, -4]} size={[0.13, 0.02, 40]} color="#d9c9a3" />
    {Array.from({ length: 10 }, (_, i) => <Block key={'dash-' + i} position={[0, 0.045, 13 - i * 3.8]} size={[0.12, 0.02, 1.55]} color="#e1d6b7" />)}
    <Block position={[-6.2, 0.06, -4]} size={[0.08, 0.03, 40]} color="#b8b8a5" />
    <Block position={[6.2, 0.06, -4]} size={[0.08, 0.03, 40]} color="#b8b8a5" />

    {/* The player's small home is the same landmark that anchors the entrance back into the interior. */}
    <group position={[0, 0, 5.2]}>
      <Block position={[0, 1.65, 0]} size={[6.2, 3.3, 4.4]} color="#c0b29a" />
      <Block position={[0, 3.36, 0]} size={[6.45, 0.22, 4.65]} color="#554b43" />
      <Block position={[0, 3.7, 0]} size={[6.7, 0.52, 4.9]} color="#3c4548" />
      <Block position={[0, 0.95, -2.23]} size={[1.25, 1.95, 0.13]} color="#3b3029" />
      <Block position={[0, 1.04, -2.31]} size={[0.12, 2.05, 0.08]} color="#d0b78c" />
      <Block position={[-1.72, 2.0, -2.25]} size={[0.82, 0.92, 0.1]} color="#a9cbd2" roughness={0.22} />
      <Block position={[1.72, 2.0, -2.25]} size={[0.82, 0.92, 0.1]} color="#a9cbd2" roughness={0.22} />
      <Text position={[0, 4.18, -0.1]} fontSize={0.3} color="#f0e8d9" anchorX="center" outlineWidth={0.015} outlineColor="#222">{'ДОМ 01'}</Text>
    </group>

    <Building x={-5.2} z={-1.6} width={5.1} depth={3.7} height={4.4} color="#7b817a" label="КАФЕ" shop night={night} />
    <Building x={5.3} z={-6.7} width={5.6} depth={4.1} height={8.8} color="#647780" label="БИРЖА" night={night} />
    <Building x={0.5} z={-10.2} width={2.5} depth={1.8} height={2.25} color="#b7a27e" label="ПРЕССА" shop night={night} />
    <Building x={8.3} z={-1.3} width={5.2} depth={4.2} height={7.1} color="#727b7d" label="ОФИСЫ" night={night} />
    <Building x={-10.2} z={-7.8} width={5.3} depth={4.5} height={6.4} color="#8b8b80" label="ЖИЛОЙ ДОМ" night={night} />
    <Building x={11.5} z={-12.5} width={6.2} depth={4.4} height={9.5} color="#596d76" label="ДЕЛОВОЙ ЦЕНТР" night={night} />
    {[-2, 1.5, 9.2, -9.1].map((x, i) => <Tree key={'tree-' + i} position={[x, 0, i % 2 ? -3.1 : -7.1]} />)}
    {[-8, 0, 8].map((z) => <StreetLamp key={'lamp-' + z} position={[-7.7, 0, z]} night={night} />)}
    {[ -8, 0, 8 ].map((z) => <StreetLamp key={'lamp-r-' + z} position={[7.7, 0, z]} night={night} />)}
    <ContactShadows position={[0, -0.02, -4]} opacity={0.22} scale={40} blur={2.5} far={12} />
  </>
}

export function CityWindowView({ night }: { night: boolean }) {
  return <group position={[-5.72, 0.38, -1.15]} rotation={[0, Math.PI / 2, 0]} scale={0.46}>
    <Building x={-1.65} z={-0.6} width={3.4} depth={2.6} height={5.3} color={night ? '#344b5d' : '#7d9296'} label="КАФЕ" shop night={night} />
    <Building x={1.15} z={0.45} width={2.8} depth={2.2} height={4.1} color={night ? '#263b4c' : '#718892'} label="ЖИЛОЙ ДОМ" night={night} />
    <Building x={0.0} z={-3.7} width={3.8} depth={2.8} height={7.2} color={night ? '#2b4053' : '#8aa2aa'} label="БИЗНЕС-ЦЕНТР" night={night} />
    <Block position={[0, 0.04, 2.5]} size={[12, 0.08, 0.8]} color="#343e43" />
    {[-3.2, -1.6, 0, 1.6, 3.2].map((x) => <Tree key={x} position={[x, 0.05, 2.0]} />)}
  </group>
}

function FirstPersonCity({ onEnterHome, onOpenLocation, onNearbyChange }: CitySceneProps & { onNearbyChange: (nearby: LocationId | 'home' | null) => void }) {
  const { camera, gl } = useThree()
  const keys = useRef<Record<string, boolean>>({})
  const yaw = useRef(0)
  const pitch = useRef(-0.05)
  const dragging = useRef(false)
  const last = useRef({ x: 0, y: 0 })
  const nearby = useRef<LocationId | 'home' | null>(null)
  const forward = useRef(new THREE.Vector3())
  const right = useRef(new THREE.Vector3())

  useEffect(() => {
    camera.position.set(0, 1.68, 1.25)
    camera.rotation.order = 'YXZ'
    yaw.current = 0
    pitch.current = -0.05
    camera.rotation.set(pitch.current, yaw.current, 0)
  }, [camera])

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.closest('input,textarea,select,[contenteditable="true"]')) return
      const key = event.key.toLowerCase()
      if (key === 'e') {
        event.preventDefault()
        if (nearby.current === 'home') onEnterHome()
        else if (nearby.current) onOpenLocation(nearby.current)
      }
      const map: Record<string, string> = { KeyW: 'w', KeyA: 'a', KeyS: 's', KeyD: 'd', ArrowUp: 'w', ArrowLeft: 'a', ArrowDown: 's', ArrowRight: 'd' }
      if (map[event.code]) { keys.current[map[event.code]] = true; event.preventDefault() }
      if (key === 'shift') keys.current.shift = true
    }
    const up = (event: KeyboardEvent) => {
      const map: Record<string, string> = { KeyW: 'w', KeyA: 'a', KeyS: 's', KeyD: 'd', ArrowUp: 'w', ArrowLeft: 'a', ArrowDown: 's', ArrowRight: 'd' }
      if (map[event.code]) keys.current[map[event.code]] = false
      if (event.key.toLowerCase() === 'shift') keys.current.shift = false
    }
    const blur = () => { keys.current = {}; dragging.current = false }
    const downPointer = (event: PointerEvent) => {
      if (event.button !== 0) return
      dragging.current = true
      last.current = { x: event.clientX, y: event.clientY }
    }
    const movePointer = (event: PointerEvent) => {
      if (!dragging.current) return
      yaw.current -= (event.clientX - last.current.x) * 0.003
      pitch.current = THREE.MathUtils.clamp(pitch.current - (event.clientY - last.current.y) * 0.0026, -0.8, 0.45)
      last.current = { x: event.clientX, y: event.clientY }
    }
    const upPointer = () => { dragging.current = false }
    window.addEventListener('keydown', down, true)
    window.addEventListener('keyup', up, true)
    window.addEventListener('blur', blur)
    gl.domElement.addEventListener('pointerdown', downPointer)
    window.addEventListener('pointermove', movePointer)
    window.addEventListener('pointerup', upPointer)
    return () => {
      window.removeEventListener('keydown', down, true)
      window.removeEventListener('keyup', up, true)
      window.removeEventListener('blur', blur)
      gl.domElement.removeEventListener('pointerdown', downPointer)
      window.removeEventListener('pointermove', movePointer)
      window.removeEventListener('pointerup', upPointer)
    }
  }, [gl, onEnterHome, onOpenLocation])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.045)
    forward.current.set(-Math.sin(yaw.current), 0, -Math.cos(yaw.current))
    right.current.set(Math.cos(yaw.current), 0, -Math.sin(yaw.current))
    const move = new THREE.Vector3()
    if (keys.current.w) move.add(forward.current)
    if (keys.current.s) move.sub(forward.current)
    if (keys.current.d) move.add(right.current)
    if (keys.current.a) move.sub(right.current)
    if (move.lengthSq()) {
      move.normalize().multiplyScalar((keys.current.shift ? 5.2 : 3.2) * dt)
      const nx = THREE.MathUtils.clamp(camera.position.x + move.x, -13.5, 13.5)
      const nz = THREE.MathUtils.clamp(camera.position.z + move.z, -15.8, 9.3)
      const blocked = (x: number, z: number) =>
        (x > -8.1 && x < -2.4 && z > -4.0 && z < 0.7) ||
        (x > 2.4 && x < 8.3 && z > -9.1 && z < -4.4) ||
        (x > -1.0 && x < 2.0 && z > -11.5 && z < -9.0) ||
        (x > 5.5 && x < 11.1 && z > -3.8 && z < 1.0) ||
        (x > -13 && x < -7.5 && z > -10.5 && z < -5.0) ||
        (x > 8.4 && x < 13 && z > -15 && z < -10)
      if (!blocked(nx, camera.position.z)) camera.position.x = nx
      if (!blocked(camera.position.x, nz)) camera.position.z = nz
    }
    camera.position.y = 1.68
    camera.rotation.set(pitch.current, yaw.current, 0)
    let found: LocationId | 'home' | null = null
    // Door is on the street-facing side of the player's house.
    if (Math.hypot(camera.position.x, camera.position.z - 2.5) < 1.6) found = 'home'
    for (const place of locations) {
      if (Math.hypot(camera.position.x - place.x, camera.position.z - place.z) < 2.5) { found = place.id; break }
    }
    if (found !== nearby.current) { nearby.current = found; onNearbyChange(found) }
  })

  return null
}

export default function CityScene(props: CitySceneProps) {
  const [nearby, setNearby] = useState<LocationId | 'home' | null>(null)
  const nearbyPlace = locations.find((place) => place.id === nearby)
  return <div className="city-3d-root">
    <Canvas shadows dpr={[1, 1.5]} camera={{ position: [0, 1.68, 1.25], fov: 72, near: 0.1, far: 100 }} gl={{ antialias: true, powerPreference: 'high-performance' }} onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.08 }}>
      <District gameMinutes={props.gameMinutes} />
      <FirstPersonCity {...props} onNearbyChange={setNearby} />
    </Canvas>
    <div className="city-3d-crosshair" aria-hidden="true">+</div>
    {nearby && <div className="city-3d-interaction">
      <span className="city-3d-interaction-key">E</span>
      <div><strong>{nearby === 'home' ? 'ВОЙТИ В СВОЙ ДОМ' : nearbyPlace?.label}</strong><small>{nearby === 'home' ? 'Вернуться в комнату и к рабочему столу' : nearbyPlace?.hint}</small></div>
      <button onClick={() => nearby === 'home' ? props.onEnterHome() : props.onOpenLocation(nearby as LocationId)}>Взаимодействовать</button>
    </div>}
  </div>
}
