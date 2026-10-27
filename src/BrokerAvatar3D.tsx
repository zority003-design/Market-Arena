import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows, RoundedBox } from '@react-three/drei'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

type BrokerAvatar3DProps = {
  identity: string
  outfit?: string
  compact?: boolean
  className?: string
}

const palettes = [
  { skin: '#d8a17d', hair: '#30251f', suit: '#203d59', shirt: '#f4f1e9', tie: '#c55c45', accent: '#4b9b8c' },
  { skin: '#edbd98', hair: '#4b3028', suit: '#3e4b50', shirt: '#f8f5ed', tie: '#b68a3c', accent: '#7899a9' },
  { skin: '#b97955', hair: '#171b20', suit: '#394b3d', shirt: '#f3f0e6', tie: '#b95142', accent: '#d5a45d' },
  { skin: '#e0b08b', hair: '#7b4b2b', suit: '#4b354e', shirt: '#f7f3ed', tie: '#c56e55', accent: '#729d83' },
]

function CapsuleLimb({ start, end, radius, color }: { start: [number, number, number]; end: [number, number, number]; radius: number; color: string }) {
  const a = new THREE.Vector3(...start)
  const b = new THREE.Vector3(...end)
  const direction = new THREE.Vector3().subVectors(b, a)
  const midpoint = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5)
  const ref = useRef<THREE.Mesh>(null)
  return <mesh ref={ref} position={midpoint.toArray()} quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize())} castShadow>
    <cylinderGeometry args={[radius * 0.84, radius, direction.length(), 12]} />
    <meshStandardMaterial color={color} roughness={0.62} />
  </mesh>
}

function BrokerModel({ identity, outfit }: { identity: string; outfit: string }) {
  const root = useRef<THREE.Group>(null)
  const identitySeed = useMemo(() => {
    let hash = 0
    for (const char of identity) hash = (hash * 31 + char.charCodeAt(0)) | 0
    return Math.abs(hash)
  }, [identity])
  const palette = palettes[identitySeed % palettes.length]
  const hairStyle = identitySeed % 3
  const formal = outfit === 'premium' || identity === 'team-lead' || identity === 'senior-broker'
  const jacket = formal ? palette.suit : (identity === 'player' && outfit === 'intern' ? '#465a67' : palette.suit)
  useFrame(({ clock }) => {
    if (root.current) {
      root.current.rotation.y = Math.sin(clock.elapsedTime * 0.65) * 0.09
      root.current.position.y = Math.sin(clock.elapsedTime * 1.25) * 0.018
    }
  })
  return <group ref={root} position={[0, -1.08, 0]}>
    {/* Shoes and tailored trousers */}
    <RoundedBox position={[-0.19, 0.13, 0.045]} args={[0.25, 0.16, 0.43]} radius={0.055} smoothness={3} castShadow><meshStandardMaterial color="#20262c" roughness={0.42}/></RoundedBox>
    <RoundedBox position={[0.19, 0.13, 0.045]} args={[0.25, 0.16, 0.43]} radius={0.055} smoothness={3} castShadow><meshStandardMaterial color="#20262c" roughness={0.42}/></RoundedBox>
    <mesh position={[-0.19, 0.68, 0]} scale={[0.19, 0.61, 0.19]} castShadow><capsuleGeometry args={[0.34, 0.62, 8, 14]}/><meshStandardMaterial color="#303b48" roughness={0.75}/></mesh>
    <mesh position={[0.19, 0.68, 0]} scale={[0.19, 0.61, 0.19]} castShadow><capsuleGeometry args={[0.34, 0.62, 8, 14]}/><meshStandardMaterial color="#303b48" roughness={0.75}/></mesh>
    {/* Shirt, jacket, tailored lapels and collar */}
    <mesh position={[0, 1.43, 0]} scale={[0.59, 0.57, 0.34]} castShadow><capsuleGeometry args={[0.42, 0.55, 8, 18]}/><meshStandardMaterial color={jacket} roughness={0.63}/></mesh>
    <mesh position={[0, 0.99, -0.005]} scale={[0.38, 0.21, 0.29]} castShadow><sphereGeometry args={[1, 24, 16]}/><meshStandardMaterial color={jacket} roughness={0.68}/></mesh>
    <mesh position={[-0.33, 1.66, 0]} scale={[0.22, 0.18, 0.29]} castShadow><sphereGeometry args={[1, 20, 14]}/><meshStandardMaterial color={jacket} roughness={0.63}/></mesh>
    <mesh position={[0.33, 1.66, 0]} scale={[0.22, 0.18, 0.29]} castShadow><sphereGeometry args={[1, 20, 14]}/><meshStandardMaterial color={jacket} roughness={0.63}/></mesh>
    <mesh position={[0, 1.48, 0.265]} scale={[0.19, 0.43, 0.035]}><boxGeometry args={[1, 1, 1]}/><meshStandardMaterial color={palette.shirt} roughness={0.48}/></mesh>
    <mesh position={[-0.12, 1.47, 0.302]} rotation={[0, 0, -0.13]}><coneGeometry args={[0.105, 0.56, 4]}/><meshStandardMaterial color={jacket} roughness={0.58}/></mesh>
    <mesh position={[0.12, 1.47, 0.302]} rotation={[0, 0, 0.13]}><coneGeometry args={[0.105, 0.56, 4]}/><meshStandardMaterial color={jacket} roughness={0.58}/></mesh>
    <mesh position={[-0.12, 1.68, 0.323]} rotation={[0, 0, -0.32]}><coneGeometry args={[0.12, 0.38, 3]}/><meshStandardMaterial color={jacket} roughness={0.58}/></mesh>
    <mesh position={[0.12, 1.68, 0.323]} rotation={[0, 0, 0.32]}><coneGeometry args={[0.12, 0.38, 3]}/><meshStandardMaterial color={jacket} roughness={0.58}/></mesh>
    <mesh position={[-0.07, 1.82, 0.14]} rotation={[0, 0, -0.2]}><boxGeometry args={[0.18, 0.16, 0.11]}/><meshStandardMaterial color={palette.shirt} roughness={0.5}/></mesh>
    <mesh position={[0.07, 1.82, 0.14]} rotation={[0, 0, 0.2]}><boxGeometry args={[0.18, 0.16, 0.11]}/><meshStandardMaterial color={palette.shirt} roughness={0.5}/></mesh>
    <mesh position={[0, 1.49, 0.315]}><boxGeometry args={[0.055, 0.31, 0.025]}/><meshStandardMaterial color={palette.tie} roughness={0.42}/></mesh>
    <mesh position={[0, 1.67, 0.32]}><coneGeometry args={[0.045, 0.09, 4]}/><meshStandardMaterial color={palette.tie} roughness={0.42}/></mesh>
    {[1.36, 1.22, 1.08].map(y => <mesh key={y} position={[0.07, y, 0.304]}><sphereGeometry args={[0.022, 10, 8]}/><meshStandardMaterial color={palette.accent} metalness={0.55} roughness={0.35}/></mesh>)}
    <mesh position={[-0.29, 1.47, 0.24]} rotation={[0, 0, 0.03]}><boxGeometry args={[0.105, 0.045, 0.018]}/><meshStandardMaterial color={palette.accent} roughness={0.4}/></mesh>
    {/* Arms, cuffs and hands */}
    <CapsuleLimb start={[-0.4, 1.68, 0]} end={[-0.52, 1.02, 0.11]} radius={0.13} color={jacket}/>
    <CapsuleLimb start={[0.4, 1.68, 0]} end={[0.52, 1.02, 0.11]} radius={0.13} color={jacket}/>
    <mesh position={[-0.52, 0.98, 0.13]} scale={[0.105, 0.14, 0.09]} castShadow><sphereGeometry args={[1, 16, 12]}/><meshStandardMaterial color={palette.skin} roughness={0.8}/></mesh>
    <mesh position={[0.52, 0.98, 0.13]} scale={[0.105, 0.14, 0.09]} castShadow><sphereGeometry args={[1, 16, 12]}/><meshStandardMaterial color={palette.skin} roughness={0.8}/></mesh>
    <mesh position={[-0.41, 1.12, 0.055]} scale={[0.13, 0.08, 0.12]}><sphereGeometry args={[1, 16, 12]}/><meshStandardMaterial color={palette.shirt}/></mesh>
    <mesh position={[0.41, 1.12, 0.055]} scale={[0.13, 0.08, 0.12]}><sphereGeometry args={[1, 16, 12]}/><meshStandardMaterial color={palette.shirt}/></mesh>
    {/* Neck and expressive head */}
    <mesh position={[0, 1.99, 0]}><cylinderGeometry args={[0.14, 0.16, 0.27, 20]}/><meshStandardMaterial color={palette.skin} roughness={0.86}/></mesh>
    <mesh position={[0, 1.91, 0]} scale={[0.19, 0.12, 0.18]}><sphereGeometry args={[1, 20, 16]}/><meshStandardMaterial color={jacket} roughness={0.65}/></mesh>
    <mesh position={[0, 2.28, 0]} scale={[0.32, 0.39, 0.3]} castShadow><sphereGeometry args={[1, 32, 24]}/><meshStandardMaterial color={palette.skin} roughness={0.82}/></mesh>
    {/* Hair silhouette, individual fringe and ears */}
    <mesh position={[0, 2.51, -0.025]} scale={[0.325, 0.19, 0.31]} rotation={[0.06, 0, -0.03]} castShadow><sphereGeometry args={[1, 24, 16]}/><meshStandardMaterial color={palette.hair} roughness={0.94}/></mesh>
    <mesh position={[-0.27, 2.32, -0.005]} scale={[0.065, 0.19, 0.11]}><sphereGeometry args={[1, 16, 12]}/><meshStandardMaterial color={palette.hair} roughness={0.94}/></mesh>
    <mesh position={[0.27, 2.32, -0.005]} scale={[0.065, 0.19, 0.11]}><sphereGeometry args={[1, 16, 12]}/><meshStandardMaterial color={palette.hair} roughness={0.94}/></mesh>
    {hairStyle === 0 && <mesh position={[0.04, 2.53, 0.19]} rotation={[0.28, 0.08, -0.2]} scale={[0.19, 0.09, 0.12]} castShadow><sphereGeometry args={[1, 20, 14]}/><meshStandardMaterial color={palette.hair} roughness={0.9}/></mesh>}
    {hairStyle === 1 && <><mesh position={[-0.1, 2.46, 0.22]} rotation={[0.12, 0, 0.28]} scale={[0.18, 0.1, 0.1]} castShadow><sphereGeometry args={[1, 20, 14]}/><meshStandardMaterial color={palette.hair} roughness={0.9}/></mesh><mesh position={[0.08, 2.42, 0.235]} rotation={[0.1, 0, -0.2]} scale={[0.14, 0.08, 0.08]} castShadow><sphereGeometry args={[1, 20, 14]}/><meshStandardMaterial color={palette.hair} roughness={0.9}/></mesh></>}
    {hairStyle === 2 && <mesh position={[0, 2.43, 0.25]} rotation={[0.12, 0, 0]} scale={[0.28, 0.105, 0.075]} castShadow><sphereGeometry args={[1, 20, 14]}/><meshStandardMaterial color={palette.hair} roughness={0.9}/></mesh>}
    {[-1, 1].map(side => <group key={'ear-' + side} position={[side * 0.305, 2.26, 0.005]}><mesh scale={[0.07, 0.095, 0.055]}><sphereGeometry args={[1, 16, 12]}/><meshStandardMaterial color={palette.skin} roughness={0.84}/></mesh><mesh position={[0, 0, 0.044]} scale={[0.027, 0.047, 0.012]}><sphereGeometry args={[1, 12, 10]}/><meshStandardMaterial color="#ad765e" roughness={0.9}/></mesh></group>)}
    {/* Brows, eyes, nose and subtle smile */}
    {[-1, 1].map(side => <group key={side} position={[side * 0.115, 2.31, 0.267]}>
      <mesh position={[0, 0.055, 0]} rotation={[0, 0, side * -0.1]}><boxGeometry args={[0.09, 0.025, 0.018]}/><meshStandardMaterial color={palette.hair} roughness={0.8}/></mesh>
      <mesh position={[0, 0, 0.012]} scale={[0.042, 0.046, 0.025]}><sphereGeometry args={[1, 16, 12]}/><meshStandardMaterial color="#f8f5ed" roughness={0.35}/></mesh>
      <mesh position={[0, 0, 0.033]} scale={[0.018, 0.027, 0.012]}><sphereGeometry args={[1, 12, 10]}/><meshStandardMaterial color="#252b32" roughness={0.3}/></mesh>
    </group>)}
    <mesh position={[0, 2.23, 0.298]} scale={[0.055, 0.075, 0.055]}><sphereGeometry args={[1, 16, 12]}/><meshStandardMaterial color={palette.skin} roughness={0.84}/></mesh>
    <mesh position={[-0.16, 2.17, 0.267]} scale={[0.065, 0.027, 0.018]}><sphereGeometry args={[1, 16, 10]}/><meshStandardMaterial color="#c98379" transparent opacity={0.28} roughness={0.9}/></mesh>
    <mesh position={[0.16, 2.17, 0.267]} scale={[0.065, 0.027, 0.018]}><sphereGeometry args={[1, 16, 10]}/><meshStandardMaterial color="#c98379" transparent opacity={0.28} roughness={0.9}/></mesh>
    <mesh position={[0, 2.14, 0.286]} rotation={[0, 0, Math.PI]}><torusGeometry args={[0.055, 0.009, 6, 18, Math.PI]}/><meshStandardMaterial color="#714a3d" roughness={0.9}/></mesh>
    {formal && <mesh position={[0.34, 1.67, 0.17]} rotation={[0, 0, -0.15]}><torusGeometry args={[0.065, 0.012, 8, 16]}/><meshStandardMaterial color={palette.accent} metalness={0.65} roughness={0.32}/></mesh>}
  </group>
}

export default function BrokerAvatar3D({ identity, outfit = 'classic', compact = false, className = '' }: BrokerAvatar3DProps) {
  return <div className={`broker-avatar-3d ${compact ? 'compact' : ''} ${className}`}>
    <Canvas camera={{ position: [0, 0.22, 7.1], fov: 26, near: 0.1, far: 30 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
      <color attach="background" args={['#e9f0f7']} />
      <ambientLight intensity={1.55} />
      <hemisphereLight args={['#dbeeff', '#596170', 1.5]} />
      <directionalLight position={[-3, 5, 4]} intensity={2.5} castShadow />
      <directionalLight position={[3, 2, -2]} intensity={1.1} color="#9fc7ff" />
      <BrokerModel identity={identity} outfit={outfit} />
      <ContactShadows position={[0, -0.96, 0]} opacity={0.3} scale={2.6} blur={2.2} far={3.2} />
    </Canvas>
  </div>
}
