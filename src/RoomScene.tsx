import { useEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows } from '@react-three/drei'
import * as THREE from 'three'

type RoomSceneProps = {
  onInteract: () => void
}

function FirstPersonRig() {
  const { camera, gl } = useThree()
  const keys = useRef<Record<string, boolean>>({})
  const dragging = useRef(false)
  const last = useRef({ x: 0, y: 0 })
  const yaw = useRef(0)
  const pitch = useRef(-0.04)
  const velocity = useRef(new THREE.Vector3())
  const forward = useRef(new THREE.Vector3())
  const right = useRef(new THREE.Vector3())

  useEffect(() => {
    camera.position.set(0, 1.66, 3.55)
    camera.rotation.order = 'YXZ'
    camera.rotation.set(pitch.current, yaw.current, 0)

    const down = (event: KeyboardEvent) => {
      keys.current[event.key.toLowerCase()] = true
      if (['w', 'a', 's', 'd', ' '].includes(event.key.toLowerCase())) event.preventDefault()
    }
    const up = (event: KeyboardEvent) => { keys.current[event.key.toLowerCase()] = false }
    const blur = () => { keys.current = {} }
    const pointerUp = () => { dragging.current = false }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    window.addEventListener('pointerup', pointerUp)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
      window.removeEventListener('pointerup', pointerUp)
    }
  }, [camera])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.04)
    forward.current.set(-Math.sin(yaw.current), 0, -Math.cos(yaw.current))
    right.current.set(Math.cos(yaw.current), 0, -Math.sin(yaw.current))
    velocity.current.set(0, 0, 0)
    const k = keys.current
    if (k.w || k.arrowup) velocity.current.add(forward.current)
    if (k.s || k.arrowdown) velocity.current.sub(forward.current)
    if (k.d || k.arrowright) velocity.current.add(right.current)
    if (k.a || k.arrowleft) velocity.current.sub(right.current)
    if (velocity.current.lengthSq() > 0) {
      velocity.current.normalize().multiplyScalar(2.4 * dt)
      camera.position.add(velocity.current)
      camera.position.x = THREE.MathUtils.clamp(camera.position.x, -3.3, 3.3)
      camera.position.z = THREE.MathUtils.clamp(camera.position.z, -3.45, 3.45)
    }
    camera.position.y = 1.66
    camera.rotation.set(pitch.current, yaw.current, 0)
  })

  return (
    <mesh
      visible={false}
      onPointerDown={(event) => {
        dragging.current = true
        last.current = { x: event.clientX, y: event.clientY }
      }}
      onPointerMove={(event) => {
        if (!dragging.current) return
        const dx = event.clientX - last.current.x
        const dy = event.clientY - last.current.y
        last.current = { x: event.clientX, y: event.clientY }
        yaw.current -= dx * 0.0035
        pitch.current = THREE.MathUtils.clamp(pitch.current - dy * 0.003, -1.05, 0.62)
      }}
    >
      <planeGeometry />
      <meshBasicMaterial />
    </mesh>
  )
}

function Box({ position, size, color, roughness = 0.8, metalness = 0, rotation }: {
  position: [number, number, number]
  size: [number, number, number]
  color: string
  roughness?: number
  metalness?: number
  rotation?: [number, number, number]
}) {
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />
    </mesh>
  )
}

function Cylinder({ position, radius, height, color, metalness = 0, roughness = 0.55 }: {
  position: [number, number, number]
  radius: number
  height: number
  color: string
  metalness?: number
  roughness?: number
}) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <cylinderGeometry args={[radius, radius, height, 24]} />
      <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
    </mesh>
  )
}

function Room({ onInteract }: RoomSceneProps) {
  const screenRef = useRef<THREE.Mesh>(null!)
  const glowRef = useRef<THREE.PointLight>(null!)

  useFrame(({ clock }) => {
    const pulse = 0.88 + Math.sin(clock.elapsedTime * 1.4) * 0.06
    if (glowRef.current) glowRef.current.intensity = pulse * 1.3
  })

  return (
    <>
      <color attach="background" args={['#101922']} />
      <fog attach="fog" args={['#101922', 8, 18]} />
      <ambientLight intensity={0.55} />
      <hemisphereLight args={['#b8d7ed', '#25252a', 1.05]} />
      <directionalLight position={[-3.8, 6, 2]} intensity={2.25} color="#ffe2bd" castShadow shadow-mapSize={[1536, 1536]} />
      <pointLight position={[-3.2, 2.2, -1.5]} intensity={2.2} distance={7} color="#7bb7d9" />
      <pointLight ref={glowRef} position={[0, 1.55, -2.12]} intensity={1.2} distance={2.8} color="#31d6a0" />

      {/* Room shell */}
      <Box position={[0, -0.12, 0]} size={[8, 0.24, 8]} color="#4a3a32" roughness={0.95} />
      <Box position={[0, 3.35, 0]} size={[8, 0.16, 8]} color="#222b34" />
      <Box position={[0, 1.62, -3.98]} size={[8, 3.4, 0.18]} color="#68717a" />
      <Box position={[-3.98, 1.62, 0]} size={[0.18, 3.4, 8]} color="#5c646d" />
      <Box position={[3.98, 1.62, 0]} size={[0.18, 3.4, 8]} color="#454d56" />
      <Box position={[0, 0.02, 0]} size={[7.8, 0.05, 7.8]} color="#695348" roughness={0.98} />

      {/* Back wall details and skirting */}
      <Box position={[0, 0.14, -3.86]} size={[7.7, 0.16, 0.07]} color="#b4a18b" />
      <Box position={[-1.9, 2.6, -3.86]} size={[1.8, 0.06, 0.04]} color="#424951" />
      <Box position={[-1.9, 1.25, -3.86]} size={[1.8, 0.06, 0.04]} color="#424951" />

      {/* Window on left wall */}
      <Box position={[-3.86, 2.05, -1.15]} size={[0.09, 1.62, 2.05]} color="#2a3946" roughness={0.35} />
      <Box position={[-3.79, 2.05, -1.15]} size={[0.035, 1.43, 1.86]} color="#9ecbe0" roughness={0.22} metalness={0.08} />
      <Box position={[-3.75, 2.05, -1.15]} size={[0.06, 1.48, 0.055]} color="#e0d5c2" />
      <Box position={[-3.75, 2.05, -1.15]} size={[0.06, 0.055, 1.9]} color="#e0d5c2" />
      <Box position={[-3.73, 2.72, -1.15]} size={[0.12, 0.12, 2.18]} color="#6b5144" />
      {[-2.05, -1.75, -1.45, -1.15, -0.85, -0.55, -0.25].map((z) => (
        <Box key={z} position={[-3.69, 2.67, z]} size={[0.14, 0.07, 0.22]} color="#b7a58d" />
      ))}

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

      {/* Monitor, screen faces into the room */}
      <Box position={[0.1, 1.38, -2.64]} size={[1.42, 0.9, 0.09]} color="#151b21" roughness={0.28} metalness={0.25} />
      <mesh
        ref={screenRef}
        position={[0.1, 1.39, -2.585]}
        onClick={(event) => { event.stopPropagation(); onInteract() }}
        onPointerOver={() => { document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { document.body.style.cursor = 'default' }}
      >
        <planeGeometry args={[1.29, 0.75]} />
        <meshBasicMaterial color="#0b201d" />
      </mesh>
      {/* Screen terminal details */}
      <Box position={[-0.26, 1.57, -2.573]} size={[0.46, 0.018, 0.008]} color="#32d7a1" />
      <Box position={[-0.26, 1.49, -2.573]} size={[0.58, 0.012, 0.008]} color="#548c7d" />
      <Box position={[-0.26, 1.43, -2.573]} size={[0.42, 0.012, 0.008]} color="#548c7d" />
      <Box position={[0.43, 1.52, -2.573]} size={[0.34, 0.31, 0.008]} color="#143b32" />
      <Box position={[0.43, 1.57, -2.565]} size={[0.2, 0.018, 0.008]} color="#55e7b4" />
      <Cylinder position={[0.1, 0.95, -2.61]} radius={0.09} height={0.12} color="#343c43" metalness={0.65} />
      <Box position={[0.1, 0.91, -2.61]} size={[0.44, 0.035, 0.23]} color="#313940" metalness={0.55} />

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
      <Box position={[-1.03, 1.17, -2.67]} size={[0.28, 0.07, 0.17]} color="#bba16f" rotation={[0, 0, -0.25]} />
      <pointLight position={[-1.03, 1.12, -2.56]} intensity={0.65} distance={2.4} color="#ffd69a" />

      {/* Chair */}
      <Box position={[0.1, 0.52, -0.98]} size={[0.72, 0.16, 0.68]} color="#2a3a3d" roughness={0.72} />
      <Box position={[0.1, 0.93, -1.27]} size={[0.7, 0.72, 0.13]} color="#263538" roughness={0.7} />
      <Cylinder position={[0.1, 0.28, -0.98]} radius={0.07} height={0.42} color="#363e44" metalness={0.7} />
      {[-0.22, 0.42].map((x) => (
        <Box key={x} position={[x, 0.17, -0.98]} size={[0.045, 0.25, 0.045]} color="#353e45" metalness={0.7} />
      ))}

      {/* Bed and rumpled bedding */}
      <Box position={[2.52, 0.36, 0.95]} size={[1.9, 0.35, 3.1]} color="#493c36" />
      <Box position={[2.52, 0.59, 0.95]} size={[1.82, 0.16, 3.02]} color="#d0c8b8" roughness={0.98} />
      <Box position={[2.52, 0.7, -0.13]} size={[1.75, 0.11, 0.82]} color="#b3c1c4" roughness={1} />
      <Box position={[2.52, 0.69, 1.2]} size={[1.72, 0.09, 1.65]} color="#536c78" roughness={1} rotation={[0.02, 0, -0.025]} />
      <Box position={[2.52, 0.75, 1.9]} size={[0.85, 0.12, 0.52]} color="#c8c2b5" roughness={1} />
      <Box position={[2.52, 0.17, 2.55]} size={[1.92, 0.24, 0.14]} color="#5b4436" />

      {/* Bedside crate and books */}
      <Box position={[3.3, 0.38, -0.92]} size={[0.65, 0.72, 0.66]} color="#6a5141" />
      <Box position={[3.3, 0.78, -0.92]} size={[0.69, 0.08, 0.7]} color="#8a6b50" />
      <Box position={[3.25, 0.86, -0.91]} size={[0.35, 0.1, 0.26]} color="#9d4f3f" />
      <Box position={[3.26, 0.94, -0.91]} size={[0.35, 0.06, 0.26]} color="#d1b67f" />

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

      {/* Worn rug */}
      <Box position={[0.1, 0.035, 0.5]} size={[3.1, 0.035, 2.1]} color="#3b4d50" roughness={1} />
      <Box position={[0.1, 0.055, 0.5]} size={[2.92, 0.008, 1.92]} color="#5c6966" roughness={1} />
      <ContactShadows position={[0, 0.055, 0]} opacity={0.32} scale={9} blur={2.6} far={4.5} />
      <FirstPersonRig />
    </>
  )
}

export default function RoomScene({ onInteract }: RoomSceneProps) {
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
      <Room onInteract={onInteract} />
    </Canvas>
  )
}
