import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function PortraitHead({ tier }: { tier: number }) {
  const head = useRef<THREE.Group>(null)
  const eyes = useRef<THREE.Group>(null)
  const mouth = useRef<THREE.Mesh>(null)
  const skin = tier >= 4 ? '#8f7767' : tier === 3 ? '#b99a83' : tier === 2 ? '#c8ad95' : '#bda18a'
  const hair = tier >= 4 ? '#38231f' : tier === 3 ? '#222426' : tier === 2 ? '#60412e' : '#33241f'
  const shirt = tier >= 4 ? '#493b35' : tier === 3 ? '#293b49' : tier === 2 ? '#425e5c' : '#354d46'

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (head.current) {
      head.current.rotation.y = Math.sin(t * 0.48) * 0.045
      head.current.rotation.x = Math.sin(t * 0.72) * 0.018
      head.current.position.y = 1.1 + Math.sin(t * 1.6) * 0.008
    }
    if (eyes.current) {
      const blink = Math.max(0, 1 - Math.abs((t % 5.6) - 4.65) / 0.085)
      eyes.current.scale.y = Math.max(0.08, 1 - blink * 0.92)
    }
    if (mouth.current) mouth.current.scale.y = 0.025 + Math.max(0, Math.sin(t * 8.2 + tier)) * 0.085
  })

  return <group>
    <mesh position={[0, 0.38, 0]} castShadow><cylinderGeometry args={[0.22, 0.28, 0.62, 32]} /><meshStandardMaterial color={skin} roughness={0.9} /></mesh>
    <mesh position={[0, -0.28, -0.02]} scale={[1.2, 0.78, 0.56]} castShadow><sphereGeometry args={[0.72, 48, 32]} /><meshStandardMaterial color={shirt} roughness={0.86} /></mesh>
    <mesh position={[0, 0.01, 0.43]} scale={[0.36, 0.39, 0.1]}><sphereGeometry args={[1, 32, 24]} /><meshStandardMaterial color={shirt === '#293b49' ? '#d8d9d1' : '#c5c8bc'} roughness={0.9} /></mesh>
    <group ref={head} position={[0, 1.1, 0]}>
      <mesh position={[0, 0.52, 0]} scale={[0.66, 0.84, 0.59]} castShadow receiveShadow><sphereGeometry args={[1, 64, 48]} /><meshStandardMaterial color={skin} roughness={0.82} /></mesh>
      <mesh position={[0, 1.02, -0.01]} scale={[0.69, 0.46, 0.62]} castShadow><sphereGeometry args={[1, 48, 32]} /><meshStandardMaterial color={hair} roughness={0.92} /></mesh>
      <mesh position={[-0.48, 0.57, 0.06]} scale={[0.16, 0.24, 0.13]} castShadow><sphereGeometry args={[1, 24, 20]} /><meshStandardMaterial color={hair} roughness={0.94} /></mesh>
      <mesh position={[0.48, 0.57, 0.06]} scale={[0.16, 0.24, 0.13]} castShadow><sphereGeometry args={[1, 24, 20]} /><meshStandardMaterial color={hair} roughness={0.94} /></mesh>
      {[-1, 1].map(side => <group key={side} position={[side * 0.65, 0.46, 0]}>
        <mesh castShadow><sphereGeometry args={[0.14, 24, 20]} /><meshStandardMaterial color={skin} roughness={0.9} /></mesh>
        <mesh position={[0, 0, 0.105]}><sphereGeometry args={[0.065, 20, 16]} /><meshStandardMaterial color="#947967" roughness={0.95} /></mesh>
      </group>)}
      <group ref={eyes} position={[0, 0.56, 0.52]}>
        {[-1, 1].map(side => <group key={side} position={[side * 0.255, 0, 0]}>
          <mesh scale={[0.15, 0.075, 0.055]}><sphereGeometry args={[1, 32, 20]} /><meshStandardMaterial color="#f0e4d2" roughness={0.45} /></mesh>
          <mesh position={[0, 0, 0.048]} scale={[0.052, 0.055, 0.026]}><sphereGeometry args={[1, 24, 20]} /><meshStandardMaterial color={tier >= 3 ? '#46352b' : '#4a655e'} roughness={0.4} /></mesh>
          <mesh position={[0.012, 0.012, 0.07]}><sphereGeometry args={[0.014, 12, 10]} /><meshBasicMaterial color="#fff8e8" /></mesh>
          <mesh position={[0, 0.12, -0.015]} rotation={[0, 0, side * -0.08]}><capsuleGeometry args={[0.035, 0.2, 8, 16]} /><meshStandardMaterial color={hair} roughness={0.96} /></mesh>
        </group>)}
      </group>
      <mesh position={[0, 0.29, 0.58]} scale={[0.105, 0.2, 0.12]} castShadow><sphereGeometry args={[1, 32, 24]} /><meshStandardMaterial color={skin} roughness={0.76} /></mesh>
      <mesh position={[0, 0.19, 0.66]} scale={[0.14, 0.052, 0.045]} castShadow><sphereGeometry args={[1, 32, 20]} /><meshStandardMaterial color="#9c7067" roughness={0.75} /></mesh>
      <mesh ref={mouth} position={[0, 0.125, 0.653]} scale={[0.115, 0.025, 0.035]}><sphereGeometry args={[1, 24, 16]} /><meshStandardMaterial color="#713d37" roughness={0.85} /></mesh>
      {tier >= 3 && <mesh position={[0, 0.01, 0.47]} scale={[0.43, 0.28, 0.18]}><sphereGeometry args={[1, 40, 24]} /><meshStandardMaterial color={hair} roughness={0.98} /></mesh>}
      {tier >= 2 && <mesh position={[0, 0.79, 0.34]} scale={[0.25, 0.07, 0.22]}><sphereGeometry args={[1, 32, 20]} /><meshStandardMaterial color={hair} roughness={0.92} /></mesh>}
    </group>
    <mesh position={[-0.7, 0.02, -0.1]} rotation={[0, 0, -0.28]} scale={[0.1, 0.4, 0.12]}><capsuleGeometry args={[1, 0.6, 8, 16]} /><meshStandardMaterial color={shirt} roughness={0.9} /></mesh>
    <mesh position={[0.7, 0.02, -0.1]} rotation={[0, 0, 0.28]} scale={[0.1, 0.4, 0.12]}><capsuleGeometry args={[1, 0.6, 8, 16]} /><meshStandardMaterial color={shirt} roughness={0.9} /></mesh>
  </group>
}

export default function ClientPortrait3D({ tier }: { tier: number }) {
  return <div className="client-portrait-3d" aria-label="Анимированный 3D-портрет клиента">
    <Canvas dpr={[1, 1.6]} camera={{ position: [0, 1.45, 5.0], fov: 38, near: 0.1, far: 20 }} gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }} onCreated={({ gl, camera }) => { gl.setClearColor(0x000000, 0); gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 0.98; gl.outputColorSpace = THREE.SRGBColorSpace; camera.lookAt(0, 1.12, 0) }}>
      <ambientLight intensity={1.15} />
      <hemisphereLight args={['#d9e6f1', '#4b4039', 0.72]} />
      <directionalLight position={[-2.5, 4, 3]} intensity={2.1} color="#ffe1c4" castShadow />
      <pointLight position={[2.2, 1.4, 1.2]} intensity={0.7} color="#91c5b5" />
      <PortraitHead tier={tier} />
    </Canvas>
  </div>
}
