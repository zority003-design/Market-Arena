import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows, RoundedBox } from '@react-three/drei'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

type BrokerAvatar3DProps = { identity: string; outfit?: string; compact?: boolean; className?: string }
type Pose = 'standing' | 'seated'

const palettes = [
  { skin: '#d8a17d', skinLight: '#f0c09a', hair: '#30251f', suit: '#203d59', shirt: '#f4f1e9', tie: '#c55c45', accent: '#4b9b8c' },
  { skin: '#edbd98', skinLight: '#ffdab5', hair: '#4b3028', suit: '#3e4b50', shirt: '#f8f5ed', tie: '#b68a3c', accent: '#7899a9' },
  { skin: '#b97955', skinLight: '#d99b72', hair: '#171b20', suit: '#394b3d', shirt: '#f3f0e6', tie: '#b95142', accent: '#d5a45d' },
  { skin: '#e0b08b', skinLight: '#f5c7a1', hair: '#7b4b2b', suit: '#4b354e', shirt: '#f7f3ed', tie: '#c56e55', accent: '#729d83' },
  { skin: '#c68e6b', skinLight: '#e9b28d', hair: '#202b32', suit: '#344d66', shirt: '#f3f0e8', tie: '#c59c53', accent: '#6cae9a' },
  { skin: '#efc8a5', skinLight: '#ffe0bd', hair: '#5a392b', suit: '#424148', shirt: '#fff8ec', tie: '#557d8d', accent: '#b77d5e' },
  { skin: '#a96e50', skinLight: '#d1936d', hair: '#171717', suit: '#263d3b', shirt: '#eee9dd', tie: '#c29b4b', accent: '#6fa48d' },
  { skin: '#d7a07d', skinLight: '#f0c09b', hair: '#9a6943', suit: '#4a394b', shirt: '#f7f1e7', tie: '#a95c48', accent: '#789eae' },
]

function Limb({ start, end, radius, color }: { start: [number, number, number]; end: [number, number, number]; radius: number; color: string }) {
  const a = useMemo(() => new THREE.Vector3(...start), [start[0], start[1], start[2]])
  const b = useMemo(() => new THREE.Vector3(...end), [end[0], end[1], end[2]])
  const direction = useMemo(() => new THREE.Vector3().subVectors(b, a), [a, b])
  const midpoint = useMemo(() => new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5), [a, b])
  const quaternion = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize()), [direction])
  return <group>
    <mesh position={midpoint.toArray()} quaternion={quaternion} castShadow receiveShadow>
      <cylinderGeometry args={[radius * 0.86, radius, direction.length(), 18, 1]} />
      <meshStandardMaterial color={color} roughness={0.68} />
    </mesh>
    <mesh position={start} castShadow><sphereGeometry args={[radius, 18, 14]} /><meshStandardMaterial color={color} roughness={0.68} /></mesh>
    <mesh position={end} castShadow><sphereGeometry args={[radius * 0.94, 18, 14]} /><meshStandardMaterial color={color} roughness={0.68} /></mesh>
  </group>
}

export function BrokerModel({ identity, outfit, pose = 'standing' }: { identity: string; outfit: string; pose?: Pose }) {
  const root = useRef<THREE.Group>(null)
  const torso = useRef<THREE.Group>(null)
  const seed = useMemo(() => {
    let hash = 2166136261
    for (const char of identity) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619) }
    return hash >>> 0
  }, [identity])
  const palette = palettes[seed % palettes.length]
  const hairStyle = (seed >>> 3) % 4
  const formal = outfit === 'premium' || identity === 'team-lead' || identity === 'senior-broker'
  const jacket = identity === 'player' ? (outfit === 'intern' ? '#62777c' : outfit === 'premium' ? '#17283f' : '#244d70') : palette.suit
  const trousers = identity === 'player' ? (outfit === 'intern' ? '#465256' : outfit === 'premium' ? '#1d2633' : '#293642') : '#293642'
  const shirtColor = identity === 'player' && outfit === 'premium' ? '#fffdf4' : palette.shirt
  const tieColor = identity === 'player' ? (outfit === 'intern' ? '#a7b2b0' : outfit === 'premium' ? '#caa45b' : '#c55c45') : palette.tie
  const seated = pose === 'seated'

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    // Keep a stable floor-level origin: idle animation never overwrites the model's vertical placement.
    if (root.current) root.current.rotation.y = Math.sin(t * 0.46 + (seed % 17)) * 0.035
    if (torso.current) torso.current.scale.y = 1 + Math.sin(t * 1.55 + seed % 9) * 0.003
  })

  return <group ref={root} position={seated ? [0, -0.15, 0] : [0, 0, 0]} scale={seated ? 0.72 : 1} rotation={[0, 0, 0]}>
    {/* Legs connect into a shaped pelvis. Standing and seated silhouettes share the same body proportions. */}
    {seated ? <>
      <Limb start={[-0.18, 1.12, 0]} end={[-0.19, 0.72, 0.36]} radius={0.145} color={trousers}/>
      <Limb start={[0.18, 1.12, 0]} end={[0.19, 0.72, 0.36]} radius={0.145} color={trousers}/>
      <Limb start={[-0.19, 0.72, 0.36]} end={[-0.19, 0.43, 0.39]} radius={0.105} color={trousers}/>
      <Limb start={[0.19, 0.72, 0.36]} end={[0.19, 0.43, 0.39]} radius={0.105} color={trousers}/>
      <RoundedBox position={[-0.19, 0.34, 0.48]} args={[0.23, 0.14, 0.3]} radius={0.055} smoothness={4} castShadow><meshStandardMaterial color="#20262c" roughness={0.4}/></RoundedBox>
      <RoundedBox position={[0.19, 0.34, 0.48]} args={[0.23, 0.14, 0.3]} radius={0.055} smoothness={4} castShadow><meshStandardMaterial color="#20262c" roughness={0.4}/></RoundedBox>
    </> : <>
      <RoundedBox position={[-0.19, 0.13, 0.06]} args={[0.25, 0.15, 0.42]} radius={0.055} smoothness={4} castShadow><meshStandardMaterial color="#20262c" roughness={0.4}/></RoundedBox>
      <RoundedBox position={[0.19, 0.13, 0.06]} args={[0.25, 0.15, 0.42]} radius={0.055} smoothness={4} castShadow><meshStandardMaterial color="#20262c" roughness={0.4}/></RoundedBox>
      <mesh position={[-0.19, 0.2, 0.19]}><boxGeometry args={[0.16, 0.025, 0.025]}/><meshStandardMaterial color="#6d777b" metalness={0.45}/></mesh>
      <mesh position={[0.19, 0.2, 0.19]}><boxGeometry args={[0.16, 0.025, 0.025]}/><meshStandardMaterial color="#6d777b" metalness={0.45}/></mesh>
      <Limb start={[-0.18, 1.08, 0]} end={[-0.19, 0.24, 0.02]} radius={0.145} color={trousers}/>
      <Limb start={[0.18, 1.08, 0]} end={[0.19, 0.24, 0.02]} radius={0.145} color={trousers}/>
    </>}
    <RoundedBox position={[0, 1.13, 0]} args={[0.48, 0.34, 0.32]} radius={0.12} smoothness={5} castShadow><meshStandardMaterial color={trousers} roughness={0.78}/></RoundedBox>
    <group ref={torso}>
      {/* Tailored torso with overlapping cloth pieces rather than disconnected floating primitives. */}
      <RoundedBox position={[0, 1.56, 0]} args={[0.68, 0.82, 0.4]} radius={0.17} smoothness={7} castShadow receiveShadow><meshStandardMaterial color={jacket} roughness={0.64}/></RoundedBox>
      <RoundedBox position={[0, 1.2, 0.015]} args={[0.54, 0.2, 0.35]} radius={0.08} smoothness={5} castShadow><meshStandardMaterial color={jacket} roughness={0.68}/></RoundedBox>
      <RoundedBox position={[0, 1.58, 0.209]} args={[0.25, 0.62, 0.025]} radius={0.035} smoothness={3}><meshStandardMaterial color={shirtColor} roughness={0.52}/></RoundedBox>
      <mesh position={[-0.1, 1.91, 0.235]} rotation={[0, 0, -0.12]}><boxGeometry args={[0.17, 0.14, 0.04]}/><meshStandardMaterial color={shirtColor}/></mesh>
      <mesh position={[0.1, 1.91, 0.235]} rotation={[0, 0, 0.12]}><boxGeometry args={[0.17, 0.14, 0.04]}/><meshStandardMaterial color={shirtColor}/></mesh>
      <mesh position={[-0.14, 1.65, 0.233]} rotation={[0, 0, -0.2]}><boxGeometry args={[0.18, 0.53, 0.035]}/><meshStandardMaterial color={jacket}/></mesh>
      <mesh position={[0.14, 1.65, 0.233]} rotation={[0, 0, 0.2]}><boxGeometry args={[0.18, 0.53, 0.035]}/><meshStandardMaterial color={jacket}/></mesh>
      <mesh position={[0, 1.59, 0.258]}><shapeGeometry args={[new THREE.Shape().moveTo(-0.055,0.19).lineTo(0.055,0.19).lineTo(0.08,0.1).lineTo(0,-0.18).lineTo(-0.08,0.1).closePath()]}/><meshStandardMaterial color={tieColor} roughness={0.42}/></mesh>
      <mesh position={[0, 1.78, 0.263]}><boxGeometry args={[0.09, 0.055, 0.025]}/><meshStandardMaterial color={tieColor}/></mesh>
      {[1.42,1.28,1.14].map((y) => <mesh key={y} position={[0.08,y,0.207]}><sphereGeometry args={[0.022,12,10]}/><meshStandardMaterial color={formal ? '#d5b15e' : '#c8d0d0'} metalness={0.5} roughness={0.35}/></mesh>)}
      <mesh position={[-0.26,1.65,0.213]}><boxGeometry args={[0.1,0.035,0.02]}/><meshStandardMaterial color={palette.accent} metalness={0.2}/></mesh>
      {/* Shoulder caps, upper arms, forearms and hands are joined at elbows and wrists. */}
      <mesh position={[-0.36,1.86,0]} scale={[0.19,0.19,0.22]} castShadow><sphereGeometry args={[1,20,16]}/><meshStandardMaterial color={jacket} roughness={0.65}/></mesh>
      <mesh position={[0.36,1.86,0]} scale={[0.19,0.19,0.22]} castShadow><sphereGeometry args={[1,20,16]}/><meshStandardMaterial color={jacket} roughness={0.65}/></mesh>
      <Limb start={[-0.39,1.82,0]} end={seated ? [-0.42,1.45,0.29] : [-0.47,1.18,0.06]} radius={0.135} color={jacket}/>
      <Limb start={[0.39,1.82,0]} end={seated ? [0.42,1.45,0.29] : [0.47,1.18,0.06]} radius={0.135} color={jacket}/>
      <Limb start={seated ? [-0.42,1.45,0.29] : [-0.47,1.18,0.06]} end={seated ? [-0.42,1.22,0.47] : [-0.48,0.93,0.16]} radius={0.105} color={palette.skin}/>
      <Limb start={seated ? [0.42,1.45,0.29] : [0.47,1.18,0.06]} end={seated ? [0.42,1.22,0.47] : [0.48,0.93,0.16]} radius={0.105} color={palette.skin}/>
      <mesh position={seated ? [-0.42,1.17,0.48] : [-0.48,0.87,0.17]} scale={[0.095,0.12,0.08]} castShadow><sphereGeometry args={[1,18,14]}/><meshStandardMaterial color={palette.skinLight} roughness={0.82}/></mesh>
      <mesh position={seated ? [0.42,1.17,0.48] : [0.48,0.87,0.17]} scale={[0.095,0.12,0.08]} castShadow><sphereGeometry args={[1,18,14]}/><meshStandardMaterial color={palette.skinLight} roughness={0.82}/></mesh>
      {/* Neck sinks into the collar and jaw to remove the old floating-head look. */}
      <mesh position={[0,2.02,0]}><cylinderGeometry args={[0.125,0.15,0.3,24]}/><meshStandardMaterial color={palette.skin} roughness={0.82}/></mesh>
      <mesh position={[0,2.04,0.12]} scale={[0.15,0.12,0.12]}><sphereGeometry args={[1,20,16]}/><meshStandardMaterial color={palette.skin}/></mesh>
      <mesh position={[0,2.36,0]} scale={[0.3,0.36,0.27]} castShadow><sphereGeometry args={[1,32,24]}/><meshStandardMaterial color={palette.skin} roughness={0.8}/></mesh>
      <mesh position={[0,2.2,0.16]} scale={[0.22,0.15,0.14]}><sphereGeometry args={[1,24,18]}/><meshStandardMaterial color={palette.skinLight} roughness={0.86}/></mesh>
      <mesh position={[-0.305,2.34,0]} scale={[0.065,0.105,0.06]} castShadow><sphereGeometry args={[1,18,14]}/><meshStandardMaterial color={palette.skin}/></mesh>
      <mesh position={[0.305,2.34,0]} scale={[0.065,0.105,0.06]} castShadow><sphereGeometry args={[1,18,14]}/><meshStandardMaterial color={palette.skin}/></mesh>
      <mesh position={[-0.305,2.34,0.046]} scale={[0.027,0.052,0.02]}><sphereGeometry args={[1,14,10]}/><meshStandardMaterial color={palette.skinLight}/></mesh>
      <mesh position={[0.305,2.34,0.046]} scale={[0.027,0.052,0.02]}><sphereGeometry args={[1,14,10]}/><meshStandardMaterial color={palette.skinLight}/></mesh>
      {/* Facial features face forward (+Z); eyes, brows, nose and mouth remain legible in the camera preview. */}
      <mesh position={[-0.112,2.405,0.245]} scale={[0.068,0.044,0.022]}><sphereGeometry args={[1,20,14]}/><meshStandardMaterial color="#fff7e9"/></mesh>
      <mesh position={[0.112,2.405,0.245]} scale={[0.068,0.044,0.022]}><sphereGeometry args={[1,20,14]}/><meshStandardMaterial color="#fff7e9"/></mesh>
      <mesh position={[-0.103,2.405,0.267]} scale={[0.023,0.032,0.012]}><sphereGeometry args={[1,16,12]}/><meshStandardMaterial color="#24303b"/></mesh>
      <mesh position={[0.121,2.405,0.267]} scale={[0.023,0.032,0.012]}><sphereGeometry args={[1,16,12]}/><meshStandardMaterial color="#24303b"/></mesh>
      <mesh position={[-0.11,2.465,0.247]} rotation={[0,0,-0.13]}><boxGeometry args={[0.14,0.027,0.025]}/><meshStandardMaterial color={palette.hair}/></mesh>
      <mesh position={[0.11,2.465,0.247]} rotation={[0,0,0.13]}><boxGeometry args={[0.14,0.027,0.025]}/><meshStandardMaterial color={palette.hair}/></mesh>
      <mesh position={[0,2.34,0.285]} scale={[0.052,0.064,0.046]}><sphereGeometry args={[1,18,14]}/><meshStandardMaterial color={palette.skinLight}/></mesh>
      <mesh position={[0,2.25,0.276]} scale={[0.07,0.018,0.014]}><sphereGeometry args={[1,18,10]}/><meshStandardMaterial color="#874e43" roughness={0.9}/></mesh>
      <mesh position={[0,2.58,-0.025]} scale={[0.305,0.19,0.29]} castShadow><sphereGeometry args={[1,28,18]}/><meshStandardMaterial color={palette.hair} roughness={0.92}/></mesh>
      {hairStyle === 0 && <mesh position={[0.035,2.53,0.205]} rotation={[0.08,0,-0.2]} scale={[0.19,0.085,0.095]} castShadow><sphereGeometry args={[1,20,14]}/><meshStandardMaterial color={palette.hair}/></mesh>}
      {hairStyle === 1 && <><mesh position={[-0.12,2.52,0.205]} rotation={[0,0,0.18]} scale={[0.15,0.095,0.095]}><sphereGeometry args={[1,20,14]}/><meshStandardMaterial color={palette.hair}/></mesh><mesh position={[0.08,2.49,0.22]} rotation={[0,0,-0.2]} scale={[0.16,0.08,0.08]}><sphereGeometry args={[1,20,14]}/><meshStandardMaterial color={palette.hair}/></mesh></>}
      {hairStyle === 2 && <mesh position={[0,2.59,-0.12]} scale={[0.3,0.18,0.24]}><sphereGeometry args={[1,20,14]}/><meshStandardMaterial color={palette.hair}/></mesh>}
      {hairStyle === 3 && <><mesh position={[-0.18,2.51,0.14]} rotation={[0,0,0.15]} scale={[0.1,0.16,0.09]}><sphereGeometry args={[1,18,12]}/><meshStandardMaterial color={palette.hair}/></mesh><mesh position={[0.18,2.51,0.14]} rotation={[0,0,-0.15]} scale={[0.1,0.16,0.09]}><sphereGeometry args={[1,18,12]}/><meshStandardMaterial color={palette.hair}/></mesh></>}
      {formal && <mesh position={[0.305,2.51,0.04]} scale={[0.055,0.1,0.07]}><sphereGeometry args={[1,16,12]}/><meshStandardMaterial color={palette.hair}/></mesh>}
    </group>
    <ContactShadows position={[0, seated ? 0.2 : 0.015, 0]} opacity={0.28} scale={1.65} blur={2.1} far={2.8} />
  </group>
}

export default function BrokerAvatar3D({ identity, outfit = 'classic', compact = false, className = '' }: BrokerAvatar3DProps) {
  return <div className={`broker-avatar-3d ${compact ? 'compact' : ''} ${className}`}>
    <Canvas camera={{ position: [0, compact ? 2.05 : 1.8, compact ? 3.65 : 5.9], fov: compact ? 29 : 34, near: 0.1, far: 30 }} onCreated={({ camera }) => camera.lookAt(0, compact ? 1.48 : 1.28, 0)} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={1.25} />
      <hemisphereLight args={['#dbeeff', '#596170', 1.2]} />
      <directionalLight position={[-3, 5, 4]} intensity={2.4} castShadow />
      <directionalLight position={[3, 2, -2]} intensity={0.9} color="#9fc7ff" />
      <BrokerModel identity={identity} outfit={outfit} />
      <ContactShadows position={[0, 0.01, 0]} opacity={0.3} scale={1.7} blur={2.1} far={2.8} />
    </Canvas>
  </div>
}
