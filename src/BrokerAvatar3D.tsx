import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows, RoundedBox } from '@react-three/drei'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { getEquippedAppearance } from './game/item-catalog.mjs'

type CharacterAppearance = { jacketColor?: string; trousersColor?: string; shoeColor?: string; watch?: boolean; glasses?: boolean; backpack?: boolean; belt?: boolean; skinTone?: string; skinToneLight?: string; hairColor?: string; hairStyle?: number }
type BrokerAvatar3DProps = { identity: string; outfit?: string; compact?: boolean; className?: string; pose?: Pose; appearance?: CharacterAppearance }
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

export function BrokerModel({ identity, outfit, pose = 'standing', appearance }: { identity: string; outfit: string; pose?: Pose; appearance?: CharacterAppearance }) {
  const root = useRef<THREE.Group>(null)
  const persistedStyle = useMemo(() => {
    if (appearance || identity !== 'player') return appearance
    try {
      const slot = localStorage.getItem('market-arena-active-save-slot') || '1'
      const equipped = JSON.parse(localStorage.getItem('market-arena-equipped-' + slot) || '[]')
      const custom = JSON.parse(localStorage.getItem('market-arena-character-appearance-' + slot) || '{}')
      return { ...getEquippedAppearance(Array.isArray(equipped) ? equipped : []), ...(custom && typeof custom === 'object' ? custom : {}) }
    } catch { return undefined }
  }, [appearance, identity])
  const characterAppearance = appearance ?? persistedStyle
  const torso = useRef<THREE.Group>(null)
  const typingArms = useRef<THREE.Group>(null)
  const seed = useMemo(() => {
    let hash = 2166136261
    for (const char of identity) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619) }
    return hash >>> 0
  }, [identity])
  const palette = palettes[seed % palettes.length]
  const hairStyle = characterAppearance?.hairStyle ?? ((seed >>> 3) % 4)
  const formal = outfit === 'premium' || identity === 'team-lead' || identity === 'senior-broker' || identity === 'broker-specialist'
  const playerIntern = identity === 'player' && outfit === 'intern'
  const playerPremium = identity === 'player' && outfit === 'premium'
  const juniorStaff = identity === 'junior-broker'
  const casualJacket = playerIntern || juniorStaff
  const jacket = identity === 'player' ? (characterAppearance?.jacketColor ?? (outfit === 'intern' ? '#657b7d' : outfit === 'premium' ? '#17283f' : '#263f5b')) : juniorStaff ? '#63797c' : palette.suit
  const trousers = identity === 'player' ? (characterAppearance?.trousersColor ?? (playerIntern ? '#46565a' : playerPremium ? '#202a37' : '#293746')) : (juniorStaff ? '#394650' : '#263442')
  const shirtColor = playerPremium ? '#fffdf4' : casualJacket ? '#e4e9e4' : palette.shirt
  const skinColor = characterAppearance?.skinTone ?? palette.skin
  const skinLightColor = characterAppearance?.skinToneLight ?? characterAppearance?.skinTone ?? palette.skinLight
  const hairColor = characterAppearance?.hairColor ?? palette.hair
  const tieColor = identity === 'player' ? (playerIntern ? '#a7b2b0' : playerPremium ? '#d3ad5e' : '#a84f49') : palette.tie
  const seated = pose === 'seated'


  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    // Keep a stable floor-level origin: idle animation never overwrites the model's vertical placement.
    if (root.current) root.current.rotation.y = Math.sin(t * 0.46 + (seed % 17)) * 0.035
    if (torso.current) torso.current.scale.y = 1 + Math.sin(t * 1.55 + seed % 9) * 0.003
    if (typingArms.current) {
      const typing = seated ? Math.sin(t * 8.5 + seed % 5) * 0.035 : 0
      typingArms.current.rotation.z = typing
      typingArms.current.position.y = seated ? Math.abs(Math.sin(t * 8.5 + seed % 5)) * 0.018 : 0
    }
  })

  return <group ref={root} position={seated ? [0, -0.15, 0] : [0, 0, 0]} scale={seated ? 0.72 : 1} rotation={[0, 0, 0]}>
    {/* Legs connect into a shaped pelvis. Standing and seated silhouettes share the same body proportions. */}
    {seated ? <>
      <Limb start={[-0.18, 1.12, 0]} end={[-0.19, 0.72, 0.36]} radius={0.145} color={trousers}/>
      <Limb start={[0.18, 1.12, 0]} end={[0.19, 0.72, 0.36]} radius={0.145} color={trousers}/>
      <Limb start={[-0.19, 0.72, 0.36]} end={[-0.19, 0.43, 0.39]} radius={0.105} color={trousers}/>
      <Limb start={[0.19, 0.72, 0.36]} end={[0.19, 0.43, 0.39]} radius={0.105} color={trousers}/>
      <RoundedBox position={[-0.19, 0.34, 0.48]} args={[0.23, 0.14, 0.3]} radius={0.055} smoothness={4} castShadow><meshStandardMaterial color={characterAppearance?.shoeColor ?? '#20262c'} roughness={0.4}/></RoundedBox>
      <RoundedBox position={[0.19, 0.34, 0.48]} args={[0.23, 0.14, 0.3]} radius={0.055} smoothness={4} castShadow><meshStandardMaterial color={characterAppearance?.shoeColor ?? '#20262c'} roughness={0.4}/></RoundedBox>
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
      {/* Jacket lapels and a contrasting inner shirt make formal outfits read clearly at small sizes. */}
      {!casualJacket && <>
        <mesh position={[-0.105,1.79,0.258]} rotation={[0,0,-0.22]}><boxGeometry args={[0.105,0.34,0.035]}/><meshStandardMaterial color={playerPremium ? '#263a52' : jacket} roughness={0.58}/></mesh>
        <mesh position={[0.105,1.79,0.258]} rotation={[0,0,0.22]}><boxGeometry args={[0.105,0.34,0.035]}/><meshStandardMaterial color={playerPremium ? '#263a52' : jacket} roughness={0.58}/></mesh>
      </>}
      {casualJacket && <>
        <mesh position={[-0.14,1.76,0.257]} rotation={[0,0,-0.16]}><boxGeometry args={[0.12,0.36,0.03]}/><meshStandardMaterial color="#748b8d" roughness={0.85}/></mesh>
        <mesh position={[0.14,1.76,0.257]} rotation={[0,0,0.16]}><boxGeometry args={[0.12,0.36,0.03]}/><meshStandardMaterial color="#748b8d" roughness={0.85}/></mesh>
      </>}
      {!casualJacket && <>
        <mesh position={[0, 1.59, 0.258]}><shapeGeometry args={[new THREE.Shape().moveTo(-0.055,0.19).lineTo(0.055,0.19).lineTo(0.08,0.1).lineTo(0,-0.18).lineTo(-0.08,0.1).closePath()]}/><meshStandardMaterial color={tieColor} roughness={0.42}/></mesh>
        <mesh position={[0, 1.78, 0.263]}><boxGeometry args={[0.09, 0.055, 0.025]}/><meshStandardMaterial color={tieColor}/></mesh>
      </>}
      {[1.42,1.28,1.14].map((y) => <mesh key={y} position={[0.08,y,0.228]}><sphereGeometry args={[0.022,12,10]}/><meshStandardMaterial color={playerPremium ? '#d7b35d' : formal ? '#d5b15e' : '#c8d0d0'} metalness={0.5} roughness={0.35}/></mesh>)}
      {!casualJacket && <group>
        <mesh position={[-0.235,1.55,0.254]}><boxGeometry args={[0.12,0.075,0.025]}/><meshStandardMaterial color={playerPremium ? '#fff8e7' : palette.shirt} roughness={0.45}/></mesh>
        <mesh position={[-0.235,1.58,0.27]}><boxGeometry args={[0.08,0.018,0.012]}/><meshStandardMaterial color={playerPremium ? '#d7b35d' : palette.accent} metalness={0.25}/></mesh>
      </group>}
      {/* Cuffs and watch give the hands a clear connection to the sleeves. */}
      <mesh position={[-0.475,seated ? 1.245 : 0.965,seated ? 0.37 : 0.14]} rotation={[0,0,-0.1]}><boxGeometry args={[0.13,0.075,0.09]}/><meshStandardMaterial color={shirtColor} roughness={0.62}/></mesh>
      <mesh position={[0.475,seated ? 1.245 : 0.965,seated ? 0.37 : 0.14]} rotation={[0,0,0.1]}><boxGeometry args={[0.13,0.075,0.09]}/><meshStandardMaterial color={shirtColor} roughness={0.62}/></mesh>
      {formal && <mesh position={[0.49,seated ? 1.25 : 0.97,seated ? 0.43 : 0.19]}><cylinderGeometry args={[0.045,0.045,0.055,16]}/><meshStandardMaterial color={playerPremium ? '#d7b35d' : '#4e6674'} metalness={0.65} roughness={0.28}/></mesh>}
      {playerPremium ? <>
        <mesh position={[-0.25,1.76,0.235]} rotation={[0,0,-0.18]}><boxGeometry args={[0.13,0.075,0.035]}/><meshStandardMaterial color="#f5f0df" roughness={0.38}/></mesh>
        <mesh position={[0.035,1.53,0.282]}><boxGeometry args={[0.018,0.12,0.018]}/><meshStandardMaterial color="#f0d17a" metalness={0.75} roughness={0.25}/></mesh>
      </> : playerIntern ? <>
        <mesh position={[-0.06,1.78,0.235]}><boxGeometry args={[0.018,0.15,0.018]}/><meshStandardMaterial color="#d3ddd7" roughness={0.8}/></mesh>
        <mesh position={[0.06,1.78,0.235]}><boxGeometry args={[0.018,0.15,0.018]}/><meshStandardMaterial color="#d3ddd7" roughness={0.8}/></mesh>
      </> : <mesh position={[-0.26,1.65,0.213]}><boxGeometry args={[0.1,0.035,0.02]}/><meshStandardMaterial color={palette.accent} metalness={0.2}/></mesh>}
      {/* Shoulder caps, upper arms, forearms and hands are joined at elbows and wrists. */}
      <group ref={typingArms}>
      <mesh position={[-0.36,1.86,0]} scale={[0.19,0.19,0.22]} castShadow><sphereGeometry args={[1,20,16]}/><meshStandardMaterial color={jacket} roughness={0.65}/></mesh>
      <mesh position={[0.36,1.86,0]} scale={[0.19,0.19,0.22]} castShadow><sphereGeometry args={[1,20,16]}/><meshStandardMaterial color={jacket} roughness={0.65}/></mesh>
      <Limb start={[-0.39,1.82,0]} end={seated ? [-0.42,1.45,0.29] : [-0.47,1.18,0.06]} radius={0.135} color={jacket}/>
      <Limb start={[0.39,1.82,0]} end={seated ? [0.42,1.45,0.29] : [0.47,1.18,0.06]} radius={0.135} color={jacket}/>
      <Limb start={seated ? [-0.42,1.45,0.29] : [-0.47,1.18,0.06]} end={seated ? [-0.42,1.22,0.47] : [-0.48,0.93,0.16]} radius={0.105} color={skinColor}/>
      <Limb start={seated ? [0.42,1.45,0.29] : [0.47,1.18,0.06]} end={seated ? [0.42,1.22,0.47] : [0.48,0.93,0.16]} radius={0.105} color={skinColor}/>
      </group>
      <mesh position={seated ? [-0.42,1.17,0.48] : [-0.48,0.87,0.17]} scale={[0.095,0.12,0.08]} castShadow><sphereGeometry args={[1,18,14]}/><meshStandardMaterial color={skinLightColor} roughness={0.82}/></mesh>
      <mesh position={seated ? [0.42,1.17,0.48] : [0.48,0.87,0.17]} scale={[0.095,0.12,0.08]} castShadow><sphereGeometry args={[1,18,14]}/><meshStandardMaterial color={skinLightColor} roughness={0.82}/></mesh>
      {/* Neck sinks into the collar and jaw to remove the old floating-head look. */}
      <mesh position={[0,2.02,0]}><cylinderGeometry args={[0.125,0.15,0.3,24]}/><meshStandardMaterial color={skinColor} roughness={0.82}/></mesh>
      <mesh position={[0,2.04,0.12]} scale={[0.15,0.12,0.12]}><sphereGeometry args={[1,20,16]}/><meshStandardMaterial color={skinColor}/></mesh>
      <mesh position={[0,2.36,0]} scale={[0.3,0.36,0.27]} castShadow><sphereGeometry args={[1,32,24]}/><meshStandardMaterial color={skinColor} roughness={0.8}/></mesh>
      <mesh position={[0,2.2,0.16]} scale={[0.22,0.15,0.14]}><sphereGeometry args={[1,24,18]}/><meshStandardMaterial color={skinLightColor} roughness={0.86}/></mesh>
      <mesh position={[-0.305,2.34,0]} scale={[0.065,0.105,0.06]} castShadow><sphereGeometry args={[1,18,14]}/><meshStandardMaterial color={skinColor}/></mesh>
      <mesh position={[0.305,2.34,0]} scale={[0.065,0.105,0.06]} castShadow><sphereGeometry args={[1,18,14]}/><meshStandardMaterial color={skinColor}/></mesh>
      <mesh position={[-0.305,2.34,0.046]} scale={[0.027,0.052,0.02]}><sphereGeometry args={[1,14,10]}/><meshStandardMaterial color={skinLightColor}/></mesh>
      <mesh position={[0.305,2.34,0.046]} scale={[0.027,0.052,0.02]}><sphereGeometry args={[1,14,10]}/><meshStandardMaterial color={skinLightColor}/></mesh>
      {/* Facial features face forward (+Z); eyes, brows, nose and mouth remain legible in the camera preview. */}
      <mesh position={[-0.112,2.405,0.245]} scale={[0.068,0.044,0.022]}><sphereGeometry args={[1,20,14]}/><meshStandardMaterial color="#fff7e9"/></mesh>
      <mesh position={[0.112,2.405,0.245]} scale={[0.068,0.044,0.022]}><sphereGeometry args={[1,20,14]}/><meshStandardMaterial color="#fff7e9"/></mesh>
      <mesh position={[-0.103,2.405,0.267]} scale={[0.023,0.032,0.012]}><sphereGeometry args={[1,16,12]}/><meshStandardMaterial color="#24303b"/></mesh>
      <mesh position={[0.121,2.405,0.267]} scale={[0.023,0.032,0.012]}><sphereGeometry args={[1,16,12]}/><meshStandardMaterial color="#24303b"/></mesh>
      <mesh position={[-0.11,2.465,0.247]} rotation={[0,0,-0.13]}><boxGeometry args={[0.14,0.027,0.025]}/><meshStandardMaterial color={hairColor}/></mesh>
      <mesh position={[0.11,2.465,0.247]} rotation={[0,0,0.13]}><boxGeometry args={[0.14,0.027,0.025]}/><meshStandardMaterial color={hairColor}/></mesh>
      <mesh position={[0,2.34,0.285]} scale={[0.052,0.064,0.046]}><sphereGeometry args={[1,18,14]}/><meshStandardMaterial color={skinLightColor}/></mesh>
      <mesh position={[0,2.25,0.276]} scale={[0.07,0.018,0.014]}><sphereGeometry args={[1,18,10]}/><meshStandardMaterial color="#874e43" roughness={0.9}/></mesh>
      <mesh position={[0,2.58,-0.025]} scale={[0.305,0.19,0.29]} castShadow><sphereGeometry args={[1,28,18]}/><meshStandardMaterial color={hairColor} roughness={0.92}/></mesh>
      {hairStyle === 0 && <mesh position={[0.035,2.53,0.205]} rotation={[0.08,0,-0.2]} scale={[0.19,0.085,0.095]} castShadow><sphereGeometry args={[1,20,14]}/><meshStandardMaterial color={hairColor}/></mesh>}
      {hairStyle === 1 && <><mesh position={[-0.12,2.52,0.205]} rotation={[0,0,0.18]} scale={[0.15,0.095,0.095]}><sphereGeometry args={[1,20,14]}/><meshStandardMaterial color={hairColor}/></mesh><mesh position={[0.08,2.49,0.22]} rotation={[0,0,-0.2]} scale={[0.16,0.08,0.08]}><sphereGeometry args={[1,20,14]}/><meshStandardMaterial color={hairColor}/></mesh></>}
      {hairStyle === 2 && <mesh position={[0,2.59,-0.12]} scale={[0.3,0.18,0.24]}><sphereGeometry args={[1,20,14]}/><meshStandardMaterial color={hairColor}/></mesh>}
      {hairStyle === 3 && <><mesh position={[-0.18,2.51,0.14]} rotation={[0,0,0.15]} scale={[0.1,0.16,0.09]}><sphereGeometry args={[1,18,12]}/><meshStandardMaterial color={hairColor}/></mesh><mesh position={[0.18,2.51,0.14]} rotation={[0,0,-0.15]} scale={[0.1,0.16,0.09]}><sphereGeometry args={[1,18,12]}/><meshStandardMaterial color={hairColor}/></mesh></>}
      {formal && <mesh position={[0.305,2.51,0.04]} scale={[0.055,0.1,0.07]}><sphereGeometry args={[1,16,12]}/><meshStandardMaterial color={hairColor}/></mesh>}
      {identity === 'player' && characterAppearance?.belt && <group position={[0,1.16,0.19]}><mesh><boxGeometry args={[0.48,0.055,0.035]}/><meshStandardMaterial color="#4a3429" roughness={0.6}/></mesh><mesh position={[0,0,0.025]}><boxGeometry args={[0.07,0.045,0.012]}/><meshStandardMaterial color="#b49a63" metalness={0.65}/></mesh></group>}
      {identity === 'player' && characterAppearance?.watch && <group position={[0.49,seated?1.24:0.98,seated?0.42:0.18]}><mesh rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[0.055,0.055,0.035,24]}/><meshStandardMaterial color="#b59a62" metalness={0.78} roughness={0.25}/></mesh><mesh position={[0,0.022,0]}><circleGeometry args={[0.039,24]}/><meshStandardMaterial color="#d8e0dc" metalness={0.25}/></mesh></group>}
      {identity === 'player' && characterAppearance?.glasses && <group position={[0,2.405,0.285]}><mesh position={[-0.112,0,0]}><torusGeometry args={[0.078,0.009,8,24]}/><meshStandardMaterial color="#38444a" metalness={0.7}/></mesh><mesh position={[0.112,0,0]}><torusGeometry args={[0.078,0.009,8,24]}/><meshStandardMaterial color="#38444a" metalness={0.7}/></mesh><mesh><boxGeometry args={[0.075,0.012,0.012]}/><meshStandardMaterial color="#38444a" metalness={0.7}/></mesh></group>}
      {identity === 'player' && characterAppearance?.backpack && <group position={[0,1.47,-0.27]}><mesh scale={[0.28,0.42,0.13]}><boxGeometry args={[1,1,1]}/><meshStandardMaterial color="#344b50" roughness={0.86}/></mesh><mesh position={[0,0.05,-0.12]} scale={[0.2,0.16,0.025]}><boxGeometry args={[1,1,1]}/><meshStandardMaterial color="#526e69" roughness={0.8}/></mesh></group>}
      {(identity === 'senior-broker' || identity === 'team-lead') && <>
        <mesh position={[-0.112,2.405,0.274]}><torusGeometry args={[0.073,0.009,8,24]}/><meshStandardMaterial color="#53616a" metalness={0.65} roughness={0.28}/></mesh>
        <mesh position={[0.112,2.405,0.274]}><torusGeometry args={[0.073,0.009,8,24]}/><meshStandardMaterial color="#53616a" metalness={0.65} roughness={0.28}/></mesh>
        <mesh position={[0,2.405,0.274]}><boxGeometry args={[0.08,0.014,0.012]}/><meshStandardMaterial color="#53616a" metalness={0.65}/></mesh>
      </>}
    </group>
    <ContactShadows position={[0, seated ? 0.2 : 0.015, 0]} opacity={0.28} scale={1.65} blur={2.1} far={2.8} />
  </group>
}


export function BrokerWebcamScene({ identity = 'player', outfit = 'intern', housingId = 'studio' }: { identity?: string; outfit?: string; housingId?: string }) {
  const office = housingId === 'office'
  const premium = housingId === 'premium-apartment'
  const apartment = housingId === 'city-apartment' || premium
  const wall = office ? '#536575' : premium ? '#c8c1b2' : apartment ? '#a7b8b0' : '#667b83'
  const floor = office ? '#303b46' : premium ? '#a68e6f' : apartment ? '#987d61' : '#725b49'
  const desk = office ? '#4b5964' : premium ? '#4b3b31' : '#5a4031'
  return <div className="broker-webcam-scene">
    <Canvas camera={{ position: [0, 2.05, 5.4], fov: 39, near: 0.1, far: 40 }} onCreated={({ camera }) => camera.lookAt(0, 1.35, -0.15)} dpr={[1, 1.5]} gl={{ antialias: true, alpha: false }}>
      <color attach="background" args={[wall]} />
      <ambientLight intensity={1.15} />
      <hemisphereLight args={['#dcecff', '#55483d', 1.1]} />
      <directionalLight position={[-3, 5, 4]} intensity={2.1} castShadow />
      <directionalLight position={[3, 3, -2]} intensity={0.75} color="#b8d9ff" />
      {/* The room itself is visible behind the broker, not a flat portrait backdrop. */}
      <mesh position={[0, 1.8, -1.65]} receiveShadow><boxGeometry args={[5.4, 3.7, 0.16]} /><meshStandardMaterial color={wall} roughness={0.92} /></mesh>
      <mesh position={[0, -0.12, -0.1]} receiveShadow><boxGeometry args={[5.4, 0.16, 4.8]} /><meshStandardMaterial color={floor} roughness={0.88} /></mesh>
      <mesh position={[-1.55, 1.95, -1.53]}><boxGeometry args={[1.55, 1.45, 0.04]} /><meshStandardMaterial color={office ? '#243c4b' : '#d9e9ee'} emissive={office ? '#0a1c27' : '#b8d7e4'} emissiveIntensity={0.25} /></mesh>
      <mesh position={[-1.55, 1.95, -1.49]}><boxGeometry args={[1.38, 1.28, 0.035]} /><meshStandardMaterial color={premium ? '#93b5c8' : '#88b4c6'} emissive="#78b5d1" emissiveIntensity={0.28} /></mesh>
      <mesh position={[-2.34, 1.95, -1.49]}><boxGeometry args={[0.08, 1.58, 0.09]} /><meshStandardMaterial color={desk} /></mesh>
      <mesh position={[-0.76, 1.95, -1.49]}><boxGeometry args={[0.08, 1.58, 0.09]} /><meshStandardMaterial color={desk} /></mesh>
      <mesh position={[-1.55, 2.68, -1.49]}><boxGeometry args={[1.65, 0.08, 0.09]} /><meshStandardMaterial color={desk} /></mesh>
      <mesh position={[-1.55, 1.22, -1.49]}><boxGeometry args={[1.65, 0.08, 0.09]} /><meshStandardMaterial color={desk} /></mesh>
      <mesh position={[1.55, 2.2, -1.53]}><boxGeometry args={[0.75, 0.62, 0.06]} /><meshStandardMaterial color={premium ? '#8e765b' : '#304957'} /></mesh>
      <mesh position={[1.55, 2.2, -1.48]}><boxGeometry args={[0.61, 0.48, 0.025]} /><meshStandardMaterial color={premium ? '#e7d6b4' : '#b4c5c8'} /></mesh>
      <mesh position={[1.55, 2.2, -1.45]}><boxGeometry args={[0.08, 0.12, 0.02]} /><meshStandardMaterial color="#4b7862" /></mesh>
      <mesh position={[0, 0.88, 0.48]}><boxGeometry args={[3.35, 0.13, 0.92]} /><meshStandardMaterial color={desk} roughness={0.62} /></mesh>
      <mesh position={[-1.12, 0.43, 0.55]}><boxGeometry args={[0.12, 0.83, 0.16]} /><meshStandardMaterial color={desk} /></mesh>
      <mesh position={[1.12, 0.43, 0.55]}><boxGeometry args={[0.12, 0.83, 0.16]} /><meshStandardMaterial color={desk} /></mesh>
      <mesh position={[0, 1.25, 0.22]} rotation={[-0.12, 0, 0]}><boxGeometry args={[0.83, 0.5, 0.07]} /><meshStandardMaterial color="#18232d" metalness={0.25} roughness={0.35} /></mesh>
      <mesh position={[0, 1.26, 0.17]} rotation={[-0.12, 0, 0]}><boxGeometry args={[0.73, 0.39, 0.025]} /><meshStandardMaterial color="#4d8f9b" emissive="#286d86" emissiveIntensity={0.6} /></mesh>
      <mesh position={[0, 0.98, 0.22]}><boxGeometry args={[0.09, 0.16, 0.09]} /><meshStandardMaterial color="#263744" /></mesh>
      <mesh position={[0, 0.88, 0.2]}><boxGeometry args={[0.38, 0.035, 0.22]} /><meshStandardMaterial color="#263744" /></mesh>
      <mesh position={[-1.25, 1.18, 0.3]}><cylinderGeometry args={[0.035, 0.05, 0.52, 12]} /><meshStandardMaterial color="#d5b46b" metalness={0.45} /></mesh>
      <mesh position={[-1.25, 1.45, 0.3]}><coneGeometry args={[0.22, 0.22, 16]} /><meshStandardMaterial color="#e1c47f" emissive="#e1c47f" emissiveIntensity={0.22} /></mesh>
      <BrokerModel identity={identity} outfit={outfit} pose="seated" />
    </Canvas>
  </div>
}

export default function BrokerAvatar3D({ identity, outfit = 'classic', compact = false, className = '', pose = 'standing', appearance }: BrokerAvatar3DProps) {
  const persistedAppearance = useMemo(() => {
    if (appearance || identity !== 'player') return appearance
    try {
      const slot = localStorage.getItem('market-arena-active-save-slot') || '1'
      const equipped = JSON.parse(localStorage.getItem('market-arena-equipped-' + slot) || '[]')
      const custom = JSON.parse(localStorage.getItem('market-arena-character-appearance-' + slot) || '{}')
      return { ...getEquippedAppearance(Array.isArray(equipped) ? equipped : []), ...(custom && typeof custom === 'object' ? custom : {}) }
    } catch { return undefined }
  }, [appearance, identity])
  return <div className={`broker-avatar-3d ${compact ? 'compact' : ''} ${className}`}>
    <Canvas camera={{ position: [0, compact ? 2.05 : 1.8, compact ? 3.65 : 5.9], fov: compact ? 29 : 34, near: 0.1, far: 30 }} onCreated={({ camera }) => camera.lookAt(0, compact ? 1.48 : 1.28, 0)} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={1.25} />
      <hemisphereLight args={['#dbeeff', '#596170', 1.2]} />
      <directionalLight position={[-3, 5, 4]} intensity={2.4} castShadow />
      <directionalLight position={[3, 2, -2]} intensity={0.9} color="#9fc7ff" />
      <BrokerModel identity={identity} outfit={outfit} pose={pose} appearance={persistedAppearance} />
      <ContactShadows position={[0, 0.01, 0]} opacity={0.3} scale={1.7} blur={2.1} far={2.8} />
    </Canvas>
  </div>
}
