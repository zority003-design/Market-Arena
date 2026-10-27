import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

type Outfit = 'intern' | 'classic' | 'premium'

function BrokerModel({ outfit }: { outfit: Outfit }) {
  const rig = useRef<THREE.Group>(null)
  const jacket = outfit === 'premium' ? '#172630' : outfit === 'classic' ? '#344a5d' : '#6c897e'
  const shirt = outfit === 'intern' ? '#6c897e' : '#e8e4db'
  const pants = outfit === 'premium' ? '#202a31' : '#303943'
  const hair = outfit === 'premium' ? '#1d1c1b' : '#342820'
  const colors = useMemo(() => ({ skin: '#c89b7c', jacket, shirt, pants, hair, shoe: '#171b20', tie: outfit === 'premium' ? '#b89b58' : '#a64f42' }), [outfit, jacket, shirt, pants, hair])
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (rig.current) {
      rig.current.position.y = Math.sin(t * 1.1) * 0.018
      rig.current.rotation.y = Math.sin(t * 0.36) * 0.035
    }
  })
  return <group ref={rig} position={[0, -0.15, 0]}>
    {/* Newly modeled full-body broker: separate torso, limbs, face, hairstyle and tailoring. */}
    <mesh position={[0,1.55,0]} scale={[0.46,0.57,0.27]}><capsuleGeometry args={[0.42,0.42,8,20]}/><meshStandardMaterial color={colors.jacket} roughness={0.82}/></mesh>
    <mesh position={[0,1.62,0.276]} scale={[0.18,0.43,0.025]}><boxGeometry args={[1,1,1]}/><meshStandardMaterial color={colors.shirt} roughness={0.85}/></mesh>
    <mesh position={[0,1.56,0.31]} scale={[0.045,0.27,0.025]} rotation={[0,0,0.01]}><coneGeometry args={[1,1,4]}/><meshStandardMaterial color={colors.tie} roughness={0.6}/></mesh>
    <mesh position={[0,2.08,0]} scale={[0.16,0.23,0.16]}><cylinderGeometry args={[0.15,0.17,0.32,24]}/><meshStandardMaterial color={colors.skin} roughness={0.82}/></mesh>
    <group position={[0,2.48,0]}>
      <mesh scale={[0.31,0.4,0.28]}><sphereGeometry args={[1,36,28]}/><meshStandardMaterial color={colors.skin} roughness={0.8}/></mesh>
      <mesh position={[0,0.19,-0.015]} scale={[0.325,0.24,0.29]}><sphereGeometry args={[1,32,24]}/><meshStandardMaterial color={colors.hair} roughness={0.9}/></mesh>
      <mesh position={[0.025,0.19,0.235]} rotation={[0.08,0,-0.08]} scale={[0.23,0.09,0.07]}><sphereGeometry args={[1,24,16]}/><meshStandardMaterial color={colors.hair} roughness={0.9}/></mesh>
      {[-1,1].map(side => <group key={side}>
        <mesh position={[side*0.13,0.015,0.243]} scale={[0.075,0.045,0.035]}><sphereGeometry args={[1,20,14]}/><meshStandardMaterial color="#f2e7d7"/></mesh>
        <mesh position={[side*0.13,0.014,0.272]} scale={[0.022,0.03,0.015]}><sphereGeometry args={[1,16,12]}/><meshStandardMaterial color="#364b54"/></mesh>
        <mesh position={[side*0.13,0.085,0.245]} rotation={[0,0,side*0.06]} scale={[0.09,0.022,0.025]}><capsuleGeometry args={[0.5,0.7,4,8]}/><meshStandardMaterial color={colors.hair}/></mesh>
      </group>)}
      <mesh position={[0,-0.055,0.28]} scale={[0.045,0.09,0.06]}><sphereGeometry args={[1,20,16]}/><meshStandardMaterial color={colors.skin} roughness={0.82}/></mesh>
      <mesh position={[0,-0.16,0.25]} scale={[0.075,0.018,0.018]}><sphereGeometry args={[1,20,12]}/><meshStandardMaterial color="#814d43" roughness={0.8}/></mesh>
      <mesh position={[-0.31,-0.02,0]} scale={[0.07,0.11,0.07]}><sphereGeometry args={[1,16,12]}/><meshStandardMaterial color={colors.skin}/></mesh>
      <mesh position={[0.31,-0.02,0]} scale={[0.07,0.11,0.07]}><sphereGeometry args={[1,16,12]}/><meshStandardMaterial color={colors.skin}/></mesh>
    </group>
    {/* Arms angle slightly forward, like a confident presenter. */}
    {[-1,1].map(side => <group key={side} position={[side*0.43,1.78,0.02]} rotation={[0,0,side*-0.17]}>
      <mesh position={[side*0.04,-0.24,0]} rotation={[0,0,side*0.16]} scale={[0.13,0.32,0.14]}><capsuleGeometry args={[0.5,0.8,8,16]}/><meshStandardMaterial color={colors.jacket} roughness={0.82}/></mesh>
      <mesh position={[side*0.09,-0.52,0.04]} rotation={[0,0,side*0.1]} scale={[0.105,0.27,0.11]}><capsuleGeometry args={[0.5,0.7,8,16]}/><meshStandardMaterial color={colors.shirt} roughness={0.8}/></mesh>
      <mesh position={[side*0.11,-0.72,0.06]} scale={[0.09,0.1,0.075]}><sphereGeometry args={[1,18,14]}/><meshStandardMaterial color={colors.skin}/></mesh>
    </group>)}
    {[-1,1].map(side => <group key={side} position={[side*0.19,0.94,0]}>
      <mesh position={[0,-0.38,0]} scale={[0.16,0.42,0.18]}><capsuleGeometry args={[0.45,0.9,8,16]}/><meshStandardMaterial color={colors.pants} roughness={0.86}/></mesh>
      <mesh position={[0,-0.77,0.04]} scale={[0.145,0.38,0.15]}><capsuleGeometry args={[0.42,0.85,8,16]}/><meshStandardMaterial color={colors.pants} roughness={0.86}/></mesh>
      <mesh position={[0,-1.01,0.12]} scale={[0.16,0.105,0.29]}><capsuleGeometry args={[0.45,0.5,6,12]}/><meshStandardMaterial color={colors.shoe} roughness={0.6}/></mesh>
      <mesh position={[0,-0.82,0.18]} scale={[0.11,0.018,0.025]}><boxGeometry args={[1,1,1]}/><meshStandardMaterial color={outfit==='premium'?'#b89b58':'#171b20'} metalness={0.35}/></mesh>
    </group>)}
    {outfit !== 'intern' && <group>
      <mesh position={[-0.12,1.88,0.28]} rotation={[0,0,-0.12]} scale={[0.12,0.18,0.025]}><coneGeometry args={[1,1,4]}/><meshStandardMaterial color={colors.shirt}/></mesh>
      <mesh position={[0.12,1.88,0.28]} rotation={[0,0,0.12]} scale={[0.12,0.18,0.025]}><coneGeometry args={[1,1,4]}/><meshStandardMaterial color={colors.shirt}/></mesh>
    </group>}
  </group>
}

export default function PlayerModel3D({ outfit }: { outfit: Outfit }) {
  return <div className="player-model-3d" aria-label="Новая полнофигурная 3D-модель брокера">
    <Canvas dpr={[1,1.5]} camera={{position:[0,1.35,6],fov:30,near:0.1,far:30}} gl={{alpha:true,antialias:true,powerPreference:'low-power'}} onCreated={({gl,camera})=>{gl.setClearColor(0x000000,0);gl.toneMapping=THREE.ACESFilmicToneMapping;gl.toneMappingExposure=1.05;gl.outputColorSpace=THREE.SRGBColorSpace;camera.lookAt(0,1.22,0)}}>
      <ambientLight intensity={1.2}/>
      <hemisphereLight args={['#e0e8f2','#38312d',0.75]}/>
      <directionalLight position={[-3,4,4]} intensity={2.1} color="#ffe0c5"/>
      <pointLight position={[2,2,1]} intensity={0.6} color="#8ad9bc"/>
      <BrokerModel outfit={outfit}/>
    </Canvas>
  </div>
}
