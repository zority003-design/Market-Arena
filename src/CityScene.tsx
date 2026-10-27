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

function Block({ position, size, color, roughness = 0.9, metalness = 0, transparent = false, opacity = 1 }: { position: [number, number, number]; size: [number, number, number]; color: string; roughness?: number; metalness?: number; transparent?: boolean; opacity?: number }) {
  return <mesh position={position} castShadow receiveShadow><boxGeometry args={size} /><meshStandardMaterial color={color} roughness={roughness} metalness={metalness} transparent={transparent} opacity={opacity} /></mesh>
}

function Building({ x, z, width, depth, height, color, label, shop = false, night = false }: { x: number; z: number; width: number; depth: number; height: number; color: string; label: string; shop?: boolean; night: boolean }) {
  const floors = Math.max(2, Math.floor(height / 1.15))
  const windows = Math.max(2, Math.floor(width / 0.72))
  return <group position={[x, 0, z]}>
    <Block position={[0, height / 2, 0]} size={[width, height, depth]} color={color} />
    <Block position={[0, height + 0.07, 0]} size={[width + 0.18, 0.14, depth + 0.18]} color={shop ? '#343d3c' : '#3b4449'} />
    <Block position={[0, height - 0.12, depth / 2 + 0.04]} size={[width + 0.08, 0.12, 0.1]} color="#b8b7a9" roughness={0.82} />
    {Array.from({ length: Math.max(2, Math.floor(width / 1.7)) }, (_, i) => {
      const count = Math.max(2, Math.floor(width / 1.7))
      const px = -width / 2 + (i + 0.5) * width / count
      return <Block key={'pier-' + i} position={[px, height / 2, depth / 2 + 0.035]} size={[0.055, height - 0.2, 0.07]} color="#a6a89e" roughness={0.85} />
    })}
    <Block position={[0, 0.18, depth / 2 + 0.035]} size={[width + 0.04, 0.18, 0.1]} color="#5c625e" roughness={0.9} />
    {Array.from({ length: floors }, (_, row) => Array.from({ length: windows }, (_, col) => {
      const wx = -width / 2 + (col + 0.5) * width / windows
      const wy = 0.55 + row * (height - 0.8) / floors
      const lit = night && (row * 3 + col * 5 + Math.round(x)) % 4 !== 0
      return <group key={row + '-' + col}>
        <Block position={[wx, wy, depth / 2 + 0.025]} size={[Math.min(0.43, width / windows * 0.64), shop ? 0.53 : 0.59, 0.055]} color="#35464b" roughness={0.72} metalness={0.12} />
        <Block position={[wx, wy, depth / 2 + 0.058]} size={[Math.min(0.34, width / windows * 0.48), shop ? 0.36 : 0.42, 0.018]} color={lit ? '#f3d8a1' : '#6f929c'} roughness={0.28} metalness={0.12} />
        <Block position={[wx, wy - (shop ? 0.23 : 0.27), depth / 2 + 0.067]} size={[Math.min(0.46, width / windows * 0.7), 0.045, 0.09]} color="#a9b1ad" roughness={0.65} />
        <Block position={[wx, wy, -depth / 2 - 0.025]} size={[Math.min(0.43, width / windows * 0.64), 0.59, 0.055]} color="#35464b" roughness={0.72} />
        <Block position={[wx, wy, -depth / 2 - 0.058]} size={[Math.min(0.34, width / windows * 0.48), 0.42, 0.018]} color={lit ? '#f3d8a1' : '#6f929c'} roughness={0.28} />
      </group>
    })) }
    {shop && <>
      <Block position={[0, 0.66, depth / 2 + 0.035]} size={[width * 0.74, 0.82, 0.07]} color="#263a38" roughness={0.4} />
      <Block position={[0, 1.25, depth / 2 + 0.09]} size={[width * 0.9, 0.13, 0.11]} color="#b58c5a" />
    </>}
    {label ? <Text position={[0, height + 0.35, depth / 2 + 0.03]} fontSize={0.25} maxWidth={width + 1} color="#e4e9df" anchorX="center" outlineWidth={0.012} outlineColor="#182326">{label}</Text> : null}
  </group>
}

function Tree({ position }: { position: [number, number, number] }) {
  return <group position={position}>
    <mesh position={[0, 0.62, 0]} castShadow><cylinderGeometry args={[0.12, 0.17, 1.25, 8]} /><meshStandardMaterial color="#574536" roughness={1} /></mesh>
    <mesh position={[0, 1.72, 0]} castShadow><dodecahedronGeometry args={[0.76, 1]} /><meshStandardMaterial color="#365c48" roughness={1} flatShading /></mesh>
    <mesh position={[-0.3, 1.48, 0.13]} castShadow><dodecahedronGeometry args={[0.46, 1]} /><meshStandardMaterial color="#416d50" roughness={1} flatShading /></mesh>
    <mesh position={[0.31, 1.58, -0.14]} castShadow><dodecahedronGeometry args={[0.48, 1]} /><meshStandardMaterial color="#2e513f" roughness={1} flatShading /></mesh>
    <mesh position={[0.02, 2.0, -0.1]} castShadow><dodecahedronGeometry args={[0.34, 1]} /><meshStandardMaterial color="#4d7151" roughness={1} flatShading /></mesh>
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


function Planter({ position, width = 1.15 }: { position: [number, number, number]; width?: number }) {
  return <group position={position}>
    <Block position={[0, 0.24, 0]} size={[width, 0.46, 0.62]} color="#777d74" roughness={0.94} />
    <Block position={[0, 0.48, 0]} size={[width - 0.08, 0.06, 0.54]} color="#493f32" roughness={1} />
    {Array.from({ length: 5 }, (_, i) => <mesh key={i} position={[(i - 2) * width / 5, 0.72 + (i % 2) * 0.08, (i % 2 ? 0.1 : -0.08)]} rotation={[0.2 * (i % 2), i * 0.8, 0]}>
      <dodecahedronGeometry args={[0.22 + (i % 3) * 0.025, 1]} />
      <meshStandardMaterial color={i % 2 ? '#496b51' : '#5b7857'} roughness={1} />
    </mesh>)}
  </group>
}

function Bench({ position }: { position: [number, number, number] }) {
  return <group position={position}>
    {[-0.58, 0.58].map((x) => <Block key={x} position={[x, 0.28, 0]} size={[0.09, 0.52, 0.42]} color="#414b4c" metalness={0.42} roughness={0.58} />)}
    {[-0.18, 0, 0.18].map((y) => <Block key={y} position={[0, 0.47 + y, 0]} size={[1.38, 0.065, 0.42]} color="#8b7255" roughness={0.78} />)}
    {[-0.1, 0.1].map((z) => <Block key={z} position={[0, 0.88, z]} size={[1.38, 0.07, 0.07]} color="#8b7255" roughness={0.78} />)}
  </group>
}

function RoadDetail({ position, size, color }: { position: [number, number, number]; size: [number, number, number]; color: string }) {
  return <mesh position={position} receiveShadow><boxGeometry args={size} /><meshStandardMaterial color={color} roughness={0.98} metalness={0.01} /></mesh>
}

function DistantBlock({ position, size, color }: { position: [number, number, number]; size: [number, number, number]; color: string }) {
  return <group position={position}>
    <Block position={[0, size[1] / 2, 0]} size={size} color={color} roughness={0.95} />
    {Array.from({ length: Math.max(3, Math.floor(size[0] / 1.1)) }, (_, i) => Array.from({ length: Math.max(2, Math.floor(size[1] / 1.5)) }, (_, j) =>
      <Block key={i + '-' + j} position={[-size[0] / 2 + (i + 0.5) * size[0] / Math.max(3, Math.floor(size[0] / 1.1)), 0.7 + j * 1.2, size[2] / 2 + 0.015]} size={[0.34, 0.48, 0.025]} color={(i + j) % 4 === 0 ? '#d6c59d' : '#40545b'} roughness={0.45} />
    ))}
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
    {/* Modular sidewalk slabs, curbs, crosswalk and drain details break up the toy-like flat ground. */}
    {Array.from({ length: 18 }, (_, i) => <RoadDetail key={'sidewalk-l-' + i} position={[-6.1, 0.092, 13 - i * 2.15]} size={[3.48, 0.045, 2.08]} color={i % 3 === 0 ? '#9c9f95' : '#8d9289'} />)}
    {Array.from({ length: 18 }, (_, i) => <RoadDetail key={'sidewalk-r-' + i} position={[6.1, 0.092, 13 - i * 2.15]} size={[3.48, 0.045, 2.08]} color={i % 3 === 0 ? '#9c9f95' : '#8d9289'} />)}
    {Array.from({ length: 16 }, (_, i) => <RoadDetail key={'curb-l-' + i} position={[-4.23, 0.12, 11 - i * 2.35]} size={[0.17, 0.19, 2.28]} color="#b5b6aa" />)}
    {Array.from({ length: 16 }, (_, i) => <RoadDetail key={'curb-r-' + i} position={[4.23, 0.12, 11 - i * 2.35]} size={[0.17, 0.19, 2.28]} color="#b5b6aa" />)}
    {Array.from({ length: 5 }, (_, i) => <RoadDetail key={'crosswalk-' + i} position={[-2.2 + i * 1.1, 0.052, -1.2]} size={[0.64, 0.025, 2.8]} color="#d3d1c4" />)}
    {Array.from({ length: 8 }, (_, i) => <RoadDetail key={'drain-' + i} position={[i * 0.12 - 0.42, 0.061, 0.82]} size={[0.07, 0.012, 0.36]} color="#252f32" />)}

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
    {/* Layered skyline adds depth beyond the walkable block. */}
    <DistantBlock position={[-13.2, 0, -20.5]} size={[7.4, 12.5, 4.4]} color="#667b80" />
    <DistantBlock position={[-5.7, 0, -22.4]} size={[6.1, 8.4, 4.1]} color="#788783" />
    <DistantBlock position={[2.0, 0, -22.8]} size={[7.2, 14.2, 4.8]} color="#536b74" />
    <DistantBlock position={[10.1, 0, -21.1]} size={[7.0, 10.5, 4.2]} color="#6a7a7d" />
    <Planter position={[-4.5, 0, 1.1]} width={1.25} />
    <Planter position={[4.7, 0, -2.8]} width={1.35} />
    <Planter position={[-7.2, 0, -4.4]} width={1.25} />
    <Planter position={[7.2, 0, -8.9]} width={1.35} />
    <Bench position={[-7.1, 0, 1.2]} />
    <Bench position={[7.1, 0, -3.8]} />
    {[-2, 1.5, 9.2, -9.1].map((x, i) => <Tree key={'tree-' + i} position={[x, 0, i % 2 ? -3.1 : -7.1]} />)}
    {[-8, 0, 8].map((z) => <StreetLamp key={'lamp-' + z} position={[-7.7, 0, z]} night={night} />)}
    {[ -8, 0, 8 ].map((z) => <StreetLamp key={'lamp-r-' + z} position={[7.7, 0, z]} night={night} />)}
    <ContactShadows position={[0, -0.02, -4]} opacity={0.22} scale={40} blur={2.5} far={12} />
  </>
}

function WindowBuilding({ x, z, width, depth, height, color, night }: { x: number; z: number; width: number; depth: number; height: number; color: string; night: boolean }) {
  const floors = Math.max(2, Math.floor(height / 1.55))
  const columns = Math.max(2, Math.floor(width / 0.92))
  return <group position={[x, 0, z]}>
    <Block position={[0, height / 2, 0]} size={[width, height, depth]} color={color} roughness={.94} />
    <Block position={[0, height + .06, 0]} size={[width + .14, .12, depth + .14]} color={night ? '#26353e' : '#737f7e'} roughness={.82} />
    <Block position={[0, height * .56, depth / 2 + .025]} size={[width - .12, .045, .05]} color={night ? '#42515a' : '#c0c2b7'} roughness={.86} />
    {Array.from({ length: floors }, (_, row) => Array.from({ length: columns }, (_, col) => {
      const wx = -width / 2 + (col + .5) * width / columns
      const wy = .65 + row * (height - .9) / floors
      const lit = night && (row * 3 + col * 5 + Math.round(x)) % 4 !== 0
      return <group key={row + '-' + col}>
        <Block position={[wx, wy, depth / 2 + .045]} size={[Math.min(.48, width / columns * .72), .48, .045]} color="#293b43" roughness={.7} />
        <Block position={[wx, wy, depth / 2 + .071]} size={[Math.min(.37, width / columns * .56), .37, .018]} color={lit ? '#e9cf93' : night ? '#405d6b' : '#8eafb7'} roughness={.3} metalness={.08} />
      </group>
    }))}
  </group>
}

function WindowRain() {
  const rain = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (rain.current) rain.current.position.y = -((clock.elapsedTime * 2.4) % 1.25)
  })
  return <group ref={rain}>
    {Array.from({ length: 42 }, (_, i) => <mesh key={i} position={[-9 + (i * 37 % 180) / 10, 1.1 + (i * 19 % 47) / 10, -1 + (i * 13 % 95) / 10]} rotation={[0, 0, -0.18]} frustumCulled={false}>
      <boxGeometry args={[0.018, 0.34, 0.012]} />
      <meshBasicMaterial color="#b9d4e1" transparent opacity={0.52} depthWrite={false} />
    </mesh>)}
  </group>
}

export function CityWindowView({ night, wall = 'left', gameMinutes = 12 * 60 }: { night: boolean; wall?: 'left' | 'back'; gameMinutes?: number }) {
  const position: [number, number, number] = wall === 'back' ? [0.72, 0.16, -6.55] : [-5.72, 0.38, -1.15]
  const rotation: [number, number, number] = wall === 'back' ? [0, 0, 0] : [0, Math.PI / 2, 0]
  const weather = Math.floor((gameMinutes + 360) / 180) % 4
  const rainy = weather === 2
  const overcast = weather === 1 || rainy
  const skyline = Array.from({ length: 14 }, (_, i) => {
    const lane = i % 7, row = Math.floor(i / 7)
    const heights = [5.2, 8.4, 4.1, 10.2, 6.7, 3.8, 7.5, 5.8, 9.1]
    const widths = [2.2, 2.7, 1.8, 2.5, 2, 2.8, 1.7, 2.3, 2.6]
    const dayColors = ['#8c9b9c', '#a1acab', '#758a91', '#9aa6a3', '#6f8288']
    const nightColors = ['#263746', '#344958', '#243b48', '#3b4b56', '#2b3e4a']
    return { x: -9.1 + lane * 2.95 + row * .7, z: -6.4 - row * 4.6, height: heights[(lane + row * 3) % heights.length], width: widths[(lane + row) % widths.length], color: (night ? nightColors : dayColors)[(lane * 3 + row) % (night ? nightColors : dayColors).length] }
  })
  return <group position={position} rotation={rotation} scale={wall === 'back' ? .48 : .46}>
    {/* Sky, haze and distant skyline create real depth instead of a flat wall of boxes. */}
    <Block position={[0, 4.5, -17]} size={[34, 18, .4]} color={night ? '#182a3b' : rainy ? '#82969e' : overcast ? '#a6b3b4' : '#b8d3db'} roughness={1} />
    {!night && !overcast && <mesh position={[7.8, 8.2, -16.65]}><sphereGeometry args={[.75, 20, 16]} /><meshBasicMaterial color="#f4d9a0" /></mesh>}
    {[-7, -1.5, 4.2, 9.2].map((x, i) => <group key={'cloud-' + i} position={[x, 6.4 + (i % 2) * 1.1, -15.7 - (i % 2)]}>
      <mesh position={[-.5, 0, 0]} scale={[1.2, .34, .12]}><sphereGeometry args={[1, 16, 12]} /><meshBasicMaterial color={night ? '#344351' : rainy ? '#687b84' : '#e3e7e1'} transparent opacity={night ? .42 : .66} /></mesh>
      <mesh position={[.12, .16, 0]} scale={[.7, .42, .13]}><sphereGeometry args={[1, 16, 12]} /><meshBasicMaterial color={night ? '#344351' : rainy ? '#687b84' : '#e3e7e1'} transparent opacity={night ? .42 : .66} /></mesh>
    </group>)}
    {skyline.map((b, i) => <WindowBuilding key={'skyline-' + i} x={b.x} z={b.z} width={b.width} depth={1.7 + (i % 3) * .5} height={b.height} color={b.color} night={night} />)}
    <DistantBlock position={[-12.5, 0, -19.8]} size={[7.4, 12.5, 3.4]} color={night ? '#233543' : '#9aa8a8'} />
    <DistantBlock position={[-4.2, 0, -21.4]} size={[6.1, 8.4, 3.1]} color={night ? '#263947' : '#acb8b5'} />
    <DistantBlock position={[4.2, 0, -21.8]} size={[7.2, 14.2, 3.8]} color={night ? '#1f3340' : '#87999d'} />
    <DistantBlock position={[12.1, 0, -20.1]} size={[7.0, 10.5, 3.2]} color={night ? '#2a3c48' : '#a4b0ad'} />
    {/* Near and mid-distance blocks give the window a street-level view, not a flat skyline. */}
    <WindowBuilding x={-5.4} z={-2.4} width={3.1} depth={2.6} height={5.2} color={night ? '#394b53' : '#a0aaa5'} night={night} />
    <WindowBuilding x={-1.5} z={-4.2} width={2.4} depth={2.2} height={7.4} color={night ? '#2c404d' : '#7f9298'} night={night} />
    <WindowBuilding x={3.2} z={-3.3} width={3.3} depth={2.5} height={6.2} color={night ? '#334653' : '#8e9f9e'} night={night} />
    {/* Ground plane, sidewalk, road markings and planted strips. */}
    <Block position={[0, -.12, 1.4]} size={[25, .22, 12]} color={rainy ? '#586363' : '#747c75'} roughness={.98} />
    <Block position={[0, -.005, 3.25]} size={[25, .08, 2.7]} color={rainy ? '#343e43' : '#3e484b'} roughness={.96} />
    <Block position={[0, .04, 1.82]} size={[25, .07, .42]} color="#b4b4a7" roughness={.94} />
    <Block position={[0, .04, 4.67]} size={[25, .07, .42]} color="#b4b4a7" roughness={.94} />
    {[-9,-6,-3,0,3,6,9].map((x) => <Block key={'road-dash-' + x} position={[x, .045, 3.25]} size={[1.05, .012, .055]} color="#d5d0b7" roughness={.85} />)}
    {[-9,-4,1,6,11].map((x, i) => <group key={'car-' + i} position={[x, .13, i % 2 ? 2.65 : 3.82]}>
      <Block position={[0, .18, 0]} size={[1.28, .34, .62]} color={['#6b7779','#8a5b4d','#435c61','#b6a67e','#42514b'][i]} roughness={.55} metalness={.18} />
      <Block position={[0, .4, -.035]} size={[.72, .24, .48]} color="#6c8b92" roughness={.28} metalness={.08} />
      {[-1,1].map(side => <mesh key={side} position={[side * .38, -.015, .31]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.12,.12,.06,14]} /><meshStandardMaterial color="#20272a" roughness={.85} /></mesh>)}
    </group>)}
    {[-9.2, -5.6, 5.4, 9.3].map((x, i) => <group key={'street-light-' + i} position={[x, 0, 1.55]}>
      <Block position={[0, 1.65, 0]} size={[.055, 3.3, .055]} color="#343d40" metalness={.42} roughness={.55} />
      <Block position={[.24, 3.22, 0]} size={[.5, .055, .08]} color="#d0d1c3" roughness={.35} />
      {night && <pointLight position={[.23, 3.1, 0]} intensity={.38} distance={3} color="#f3d8a1" />}
    </group>)}
    {rainy && <WindowRain />}
    {rainy && <Block position={[0, .075, 3.25]} size={[25, .006, 2.7]} color="#627e88" transparent opacity={.13} roughness={.15} />}
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
        (x > 8.4 && x < 13 && z > -15 && z < -10) ||
        // House walls: leave only a narrow doorway lane, and prevent walking through the interior.
        (x > -3.15 && x < -0.72 && z > 2.8 && z < 7.5) ||
        (x > 0.72 && x < 3.15 && z > 2.8 && z < 7.5) ||
        (x > -0.72 && x < 0.72 && z > 3.65 && z < 7.5)
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
    <Canvas shadows dpr={[1, 1.5]} camera={{ position: [0, 1.68, 1.25], fov: 72, near: 0.1, far: 100 }} gl={{ antialias: true, powerPreference: 'high-performance' }} onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.08; gl.shadowMap.type = THREE.PCFSoftShadowMap; gl.outputColorSpace = THREE.SRGBColorSpace }}>
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
