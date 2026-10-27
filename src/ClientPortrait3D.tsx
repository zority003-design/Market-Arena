import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

type ClientMood = 'skeptical' | 'neutral' | 'interested' | 'angry' | 'happy'
type PortraitProps = { tier: number; variant?: 'client' | 'player'; outfit?: 'intern' | 'classic' | 'premium'; mood?: ClientMood }

const SKINS = ['#d9a47f', '#f0c6a3', '#b97e5e', '#e5b997', '#9a624a', '#d7a184']
const HAIRS = ['#2b201d', '#3c3029', '#6e4930', '#17191c', '#b68b56', '#4c3530']
const SHIRTS = ['#263b49', '#e5e6df', '#24352e', '#604238', '#35435f', '#20262c']

function FreshCharacter({ tier, variant, outfit, mood }: Required<PortraitProps>) {
  const root = useRef<THREE.Group>(null)
  const head = useRef<THREE.Group>(null)
  const palette = useMemo(() => {
    const seed = Math.max(0, Math.floor(tier) + (variant === 'player' ? 2 : 0))
    return { skin: SKINS[seed % SKINS.length], hair: HAIRS[(seed * 3 + 1) % HAIRS.length], shirt: outfit === 'premium' ? '#1c2730' : outfit === 'classic' ? '#344c58' : SHIRTS[(seed + 2) % SHIRTS.length], tie: ['#b64e3d', '#b79a59', '#467a68', '#7657a6'][seed % 4] }
  }, [tier, variant, outfit])
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (root.current) root.current.position.y = Math.sin(t * 1.15) * 0.018
    if (head.current) {
      head.current.rotation.y = Math.sin(t * 0.48 + tier) * 0.045
      head.current.rotation.z = mood === 'skeptical' ? -0.055 : mood === 'angry' ? 0.025 : Math.sin(t * 0.7) * 0.012
    }
  })
  const skinMat = <meshStandardMaterial color={palette.skin} roughness={0.78} />
  const hairMat = <meshStandardMaterial color={palette.hair} roughness={0.88} />
  const shirtMat = <meshStandardMaterial color={palette.shirt} roughness={0.78} />
  const browTilt = mood === 'skeptical' ? -0.16 : mood === 'angry' ? 0.18 : 0
  const mouthWidth = mood === 'happy' || mood === 'interested' ? 0.17 : 0.13
  return <group ref={root} position={[0, -0.16, 0]}>
    {/* A newly built head-and-shoulders character, with independent facial and clothing geometry. */}
    <mesh position={[0, 0.34, -0.16]} scale={[0.76, 0.77, 0.35]}><sphereGeometry args={[1, 36, 28]} /><meshStandardMaterial color="#10181d" roughness={0.94} /></mesh>
    <mesh position={[0, 0.03, 0]} scale={[0.94, 0.55, 0.44]}><sphereGeometry args={[1, 36, 28]} /><meshStandardMaterial color={palette.shirt} roughness={0.8} /></mesh>
    <mesh position={[0, 0.42, 0.06]} scale={[0.2, 0.38, 0.2]}><cylinderGeometry args={[0.18, 0.2, 0.52, 24]} />{skinMat}</mesh>
    <group ref={head} position={[0, 1.06, 0.04]}>
      <mesh position={[0, 0, 0]} scale={[0.47, 0.59, 0.42]}><sphereGeometry args={[1, 40, 32]} />{skinMat}</mesh>
      {/* ears */}
      {[-1, 1].map(side => <mesh key={'ear'+side} position={[side * 0.45, -0.04, -0.005]} scale={[0.12, 0.17, 0.09]}><sphereGeometry args={[1, 20, 16]} />{skinMat}</mesh>)}
      {/* hair cap, sideburns and a distinct swept fringe */}
      <mesh position={[0, 0.31, -0.015]} scale={[0.49, 0.32, 0.43]}><sphereGeometry args={[1, 36, 24]} />{hairMat}</mesh>
      <mesh position={[0.02, 0.25, 0.36]} rotation={[0.12, 0.02, -0.1]} scale={[0.35, 0.14, 0.12]}><sphereGeometry args={[1, 28, 20]} />{hairMat}</mesh>
      {[-1,1].map(side => <mesh key={'lock'+side} position={[side*0.39,-0.08,0.12]} rotation={[0,0,side*-0.08]} scale={[0.09,0.25,0.1]}><capsuleGeometry args={[0.6,0.8,5,10]} />{hairMat}</mesh>)}
      {/* eyes, irises and brows */}
      {[-1,1].map(side => <group key={'eye'+side} position={[side*0.185,0.055,0.365]}>
        <mesh scale={[0.105,0.066,0.045]}><sphereGeometry args={[1,24,16]} /><meshStandardMaterial color="#f3eee5" roughness={0.35}/></mesh>
        <mesh position={[0.006,-0.002,0.04]} scale={[0.039,0.043,0.02]}><sphereGeometry args={[1,20,16]} /><meshStandardMaterial color={tier % 2 ? '#52776d' : '#4a5c70'} roughness={0.4}/></mesh>
        <mesh position={[0.01,0.002,0.055]} scale={[0.017,0.026,0.012]}><sphereGeometry args={[1,16,12]} /><meshStandardMaterial color="#17191b"/></mesh>
        <mesh position={[0,browTilt,0.018]} rotation={[0,0,side*(mood==='skeptical'?0.2:0.04)]} scale={[0.13,0.025,0.035]}><capsuleGeometry args={[0.55,0.8,4,10]}/>{hairMat}</mesh>
      </group>)}
      {/* nose bridge and tip */}
      <mesh position={[0,-0.055,0.405]} rotation={[0.12,0,0]} scale={[0.075,0.17,0.08]}><sphereGeometry args={[1,24,20]}/>{skinMat}</mesh>
      <mesh position={[0,-0.13,0.43]} scale={[0.085,0.055,0.07]}><sphereGeometry args={[1,20,16]}/>{skinMat}</mesh>
      {/* mouth expression is deliberately readable at small video-call sizes */}
      <mesh position={[0,-0.235,0.392]} scale={[mouthWidth, mood==='happy'?0.045:0.018,0.022]}><sphereGeometry args={[1,24,16]}/><meshStandardMaterial color={mood==='angry'?'#6d302b':'#824c43'} roughness={0.7}/></mesh>
      {mood === 'happy' && <mesh position={[0,-0.247,0.414]} scale={[0.105,0.012,0.01]}><sphereGeometry args={[1,20,12]}/><meshStandardMaterial color="#f4e8d8"/></mesh>}
      {variant === 'player' && <mesh position={[0,0.43,0.05]} rotation={[0.1,0,-0.2]} scale={[0.22,0.08,0.2]}><sphereGeometry args={[1,24,16]}/><meshStandardMaterial color="#202a30" roughness={0.7}/></mesh>}
    </group>
    {/* tailored collar and tie: separate pieces, not painted-on details */}
    <mesh position={[-0.15,0.42,0.355]} rotation={[0,0,-0.16]} scale={[0.16,0.23,0.035]}><coneGeometry args={[1,1,4]}><meshStandardMaterial color={outfit==='intern'?palette.shirt:'#e9e7df'} roughness={0.7}/></coneGeometry></mesh>
    <mesh position={[0.15,0.42,0.355]} rotation={[0,0,0.16]} scale={[0.16,0.23,0.035]}><coneGeometry args={[1,1,4]}><meshStandardMaterial color={outfit==='intern'?palette.shirt:'#e9e7df'} roughness={0.7}/></coneGeometry></mesh>
    {outfit !== 'intern' && <group>
      <mesh position={[0,0.34,0.405]} scale={[0.055,0.075,0.025]}><sphereGeometry args={[1,16,12]}/><meshStandardMaterial color={palette.tie}/></mesh>
      <mesh position={[0,0.15,0.42]} rotation={[0,0,0.03]} scale={[0.055,0.21,0.027]}><coneGeometry args={[1,1,4]}/><meshStandardMaterial color={palette.tie} roughness={0.55}/></mesh>
      <mesh position={[-0.28,0.12,0.36]} rotation={[0,0,0.1]} scale={[0.06,0.18,0.045]}><boxGeometry args={[1,1,1]}/><meshStandardMaterial color="#b8a06b" metalness={0.45} roughness={0.4}/></mesh>
    </group>}
  </group>
}

export default function ClientPortrait3D({ tier, variant = 'client', outfit = 'intern', mood = 'neutral' }: PortraitProps) {
  return <div className={'client-portrait-3d mood-' + mood} aria-label={(variant === 'player' ? 'Новый 3D-портрет игрока: ' : 'Новый 3D-портрет клиента: ') + mood}>
    <Canvas dpr={[1, 1.5]} camera={{ position: [0, 1.15, 4.6], fov: 37, near: 0.1, far: 20 }} gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }} onCreated={({ gl, camera }) => { gl.setClearColor(0x000000, 0); gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.02; gl.outputColorSpace = THREE.SRGBColorSpace; camera.lookAt(0, 0.93, 0) }}>
      <ambientLight intensity={1.35} />
      <hemisphereLight args={['#d9e6f1', '#3a302d', 0.8]} />
      <directionalLight position={[-2.5, 3.5, 3]} intensity={2.15} color="#ffe0c5" />
      <pointLight position={[2.2, 1.3, 1.2]} intensity={0.65} color="#91c5b5" />
      <FreshCharacter tier={tier} variant={variant} outfit={outfit} mood={mood} />
    </Canvas>
  </div>
}
