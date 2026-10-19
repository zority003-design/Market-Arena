import { Canvas } from '@react-three/fiber'
import { ContactShadows, Float, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

type ItemId = 'desk-lamp' | 'used-chair' | 'headset' | 'ring-light' | 'hd-camera' | 'neutral-backdrop' | 'second-monitor' | 'chromakey-kit' | 'pro-mic'

function Metal({ color = '#7f9295', roughness = 0.28 }: { color?: string; roughness?: number }) {
  return <meshStandardMaterial color={color} metalness={0.72} roughness={roughness} />
}
function Dark() { return <meshStandardMaterial color="#202a31" metalness={0.42} roughness={0.3} /> }
function Glow({ color = '#bfe9d6' }: { color?: string }) {
  return <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.55} roughness={0.28} />
}
function ProductModel({ id }: { id: ItemId }) {
  return <Float speed={1.15} rotationIntensity={0.08} floatIntensity={0.08}>
    <group rotation={[0, -0.28, 0]} scale={0.9}>
      {id === 'desk-lamp' && <group>
        <mesh position={[0, -0.35, 0]} scale={[0.62, 0.09, 0.4]}><cylinderGeometry args={[0.55, 0.62, 0.13, 40]} /><Metal color="#b5a17a" /></mesh>
        <mesh position={[0, -0.06, 0]} rotation={[0, 0, -0.12]}><cylinderGeometry args={[0.045, 0.055, 0.56, 16]} /><Metal /></mesh>
        <mesh position={[0.13, 0.23, 0]} rotation={[0, 0, 0.62]}><cylinderGeometry args={[0.035, 0.035, 0.5, 16]} /><Metal /></mesh>
        <mesh position={[0.33, 0.42, 0]} rotation={[0, 0, -0.42]}><cylinderGeometry args={[0.23, 0.31, 0.25, 32, 1, true]} /><meshStandardMaterial color="#344b49" metalness={0.5} roughness={0.32} side={THREE.DoubleSide} /></mesh>
        <mesh position={[0.33, 0.3, 0]} rotation={[0, 0, -0.42]}><circleGeometry args={[0.22, 32]} /><Glow color="#f6d69b" /></mesh>
      </group>}
      {id === 'used-chair' && <group>
        <mesh position={[0, 0.06, -0.14]}><boxGeometry args={[0.56, 0.62, 0.16]} /><meshStandardMaterial color="#344d4b" roughness={0.72} /></mesh>
        <mesh position={[0, -0.28, 0.05]}><boxGeometry args={[0.65, 0.15, 0.55]} /><meshStandardMaterial color="#466c62" roughness={0.7} /></mesh>
        <mesh position={[0, -0.42, 0.05]}><cylinderGeometry args={[0.06, 0.07, 0.34, 16]} /><Metal /></mesh>
        {[-1,1].map(x => [-1,1].map(z => <mesh key={x+':'+z} position={[x*0.22,-0.59,z*0.18]} rotation={[0,0,x*z*0.18]}><cylinderGeometry args={[0.025,0.035,0.28,10]} /><Metal color="#58656a" /></mesh>))}
        <mesh position={[0, -0.21, 0.3]}><boxGeometry args={[0.06,0.18,0.07]} /><Dark /></mesh>
      </group>}
      {id === 'headset' && <group>
        <mesh position={[0,0.03,0]} rotation={[0,0,0.05]}><torusGeometry args={[0.37,0.065,14,48,Math.PI]} /><Dark /></mesh>
        {[-1,1].map(x => <group key={x} position={[x*0.35,-0.12,0]}><mesh><boxGeometry args={[0.18,0.29,0.18]} /><Dark /></mesh><mesh position={[0,0,0.1]}><boxGeometry args={[0.12,0.22,0.035]} /><meshStandardMaterial color="#314d49" roughness={0.45} /></mesh></group>)}
        <mesh position={[0.34,-0.28,0.05]} rotation={[0,0,-0.5]}><cylinderGeometry args={[0.018,0.018,0.3,8]} /><Metal /></mesh>
        <mesh position={[0.22,-0.39,0.1]}><sphereGeometry args={[0.055,16,12]} /><Glow /></mesh>
      </group>}
      {id === 'ring-light' && <group>
        <mesh position={[0,0.26,0]}><torusGeometry args={[0.34,0.045,12,48]} /><Glow color="#f4dfad" /></mesh>
        <mesh position={[0,0.26,-0.035]}><torusGeometry args={[0.27,0.018,8,48]} /><Metal /></mesh>
        <mesh position={[0,-0.23,0]}><cylinderGeometry args={[0.025,0.035,0.68,12]} /><Metal /></mesh>
        <mesh position={[0,-0.55,0]}><cylinderGeometry args={[0.18,0.2,0.05,24]} /><Dark /></mesh>
        {[-1,1].map(x => <mesh key={x} position={[x*0.13,-0.59,0]} rotation={[0,0,x*0.15]}><boxGeometry args={[0.06,0.04,0.25]} /><Metal /></mesh>)}
      </group>}
      {id === 'hd-camera' && <group>
        <mesh position={[0,0,0]}><boxGeometry args={[0.72,0.42,0.38]} /><Dark /></mesh>
        <mesh position={[0,0,0.21]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[0.19,0.22,0.12,32]} /><meshStandardMaterial color="#111a20" metalness={0.5} roughness={0.2} /></mesh>
        <mesh position={[0,0,0.29]}><circleGeometry args={[0.14,32]} /><meshStandardMaterial color="#2f7f78" metalness={0.55} roughness={0.18} /></mesh>
        <mesh position={[-0.02,0.04,0.31]}><circleGeometry args={[0.065,24]} /><meshStandardMaterial color="#b9e8d7" emissive="#3a9d8b" emissiveIntensity={0.25} /></mesh>
        <mesh position={[0,0.25,0]}><boxGeometry args={[0.28,0.09,0.22]} /><Metal /></mesh>
        <mesh position={[0,-0.27,0]}><boxGeometry args={[0.28,0.14,0.22]} /><Dark /></mesh>
      </group>}
      {id === 'neutral-backdrop' && <group>
        <mesh position={[0,0.03,-0.07]}><boxGeometry args={[0.95,1.05,0.06]} /><meshStandardMaterial color="#c5c9c4" roughness={0.94} /></mesh>
        <mesh position={[-0.49,0.03,-0.07]}><boxGeometry args={[0.055,1.16,0.08]} /><Metal /></mesh>
        <mesh position={[0.49,0.03,-0.07]}><boxGeometry args={[0.055,1.16,0.08]} /><Metal /></mesh>
        <mesh position={[0,0.61,-0.07]}><boxGeometry args={[1.04,0.055,0.1]} /><Metal /></mesh>
        <mesh position={[-0.49,-0.57,-0.07]}><boxGeometry args={[0.32,0.045,0.34]} /><Metal /></mesh>
        <mesh position={[0.49,-0.57,-0.07]}><boxGeometry args={[0.32,0.045,0.34]} /><Metal /></mesh>
      </group>}
      {id === 'second-monitor' && <group>
        <mesh position={[0,0.12,-0.03]}><boxGeometry args={[0.95,0.62,0.1]} /><Dark /></mesh>
        <mesh position={[0,0.12,0.03]}><planeGeometry args={[0.84,0.51]} /><meshStandardMaterial color="#102d2d" emissive="#0c302b" emissiveIntensity={0.45} roughness={0.25} /></mesh>
        {[0,1,2,3].map(i => <mesh key={i} position={[-0.27+i*0.17,0.04,0.045]}><boxGeometry args={[0.07,0.12+(i%2)*0.17,0.008]} /><Glow color={i===2?'#e8c985':'#3ac69c'} /></mesh>)}
        <mesh position={[0,-0.3,-0.02]}><cylinderGeometry args={[0.035,0.045,0.23,12]} /><Metal /></mesh>
        <mesh position={[0,-0.43,0.02]}><boxGeometry args={[0.38,0.04,0.22]} /><Metal /></mesh>
      </group>}
      {id === 'chromakey-kit' && <group>
        <mesh position={[0,0.04,-0.06]}><boxGeometry args={[1.0,1.08,0.035]} /><meshStandardMaterial color="#287f4d" roughness={0.94} side={THREE.DoubleSide} /></mesh>
        <mesh position={[-0.52,0.04,-0.06]}><cylinderGeometry args={[0.025,0.025,1.24,10]} /><Metal /></mesh>
        <mesh position={[0.52,0.04,-0.06]}><cylinderGeometry args={[0.025,0.025,1.24,10]} /><Metal /></mesh>
        <mesh position={[0,0.66,-0.06]}><cylinderGeometry args={[0.025,0.025,1.12,10]} rotation={[0,0,Math.PI/2} /><Metal /></mesh>
        <mesh position={[-0.32,-0.59,-0.06]}><boxGeometry args={[0.36,0.04,0.3]} /><Metal /></mesh>
        <mesh position={[0.32,-0.59,-0.06]}><boxGeometry args={[0.36,0.04,0.3]} /><Metal /></mesh>
      </group>}
      {id === 'pro-mic' && <group>
        <mesh position={[0,-0.35,0]}><cylinderGeometry args={[0.18,0.2,0.06,28]} /><Metal /></mesh>
        <mesh position={[0,-0.08,0]}><cylinderGeometry args={[0.035,0.04,0.5,16]} /><Metal /></mesh>
        <mesh position={[0,0.2,0]} rotation={[0,0,-0.35]}><cylinderGeometry args={[0.025,0.025,0.43,12]} /><Metal /></mesh>
        <mesh position={[0.12,0.37,0]} rotation={[0,0,-0.35]}><cylinderGeometry args={[0.11,0.12,0.32,24]} /><Dark /></mesh>
        <mesh position={[0.12,0.39,0.01]} rotation={[0,0,-0.35]}><cylinderGeometry args={[0.095,0.095,0.23,24]} /><meshStandardMaterial color="#687e7b" metalness={0.5} roughness={0.32} /></mesh>
        {Array.from({length:5},(_,i)=><mesh key={i} position={[0.12,0.32+i*0.035,0.075]} rotation={[0,0,-0.35]}><boxGeometry args={[0.14,0.008,0.006]} /><Dark /></mesh>)}
      </group>}
    </group>
  </Float>
}

export default function ShopItemPreview3D({ id }: { id: string }) {
  const safeId = (['desk-lamp','used-chair','headset','ring-light','hd-camera','neutral-backdrop','second-monitor','chromakey-kit','pro-mic'].includes(id) ? id : 'desk-lamp') as ItemId
  return <div className="shop-item-3d-preview" aria-label={'3D-модель товара: ' + safeId.replace(/-/g,' ')}>
    <Canvas camera={{ position: [2.8, 1.65, 3.4], fov: 35 }} dpr={[1,1.5]} gl={{ antialias: true, alpha: true }}>
      <color attach="background" args={['#101a1b']} />
      <ambientLight intensity={1.05} />
      <directionalLight position={[3,4,4]} intensity={2.1} castShadow />
      <pointLight position={[-3,1,2]} intensity={1.2} color="#6ad9b1" />
      <ProductModel id={safeId} />
      <ContactShadows position={[0,-0.67,0]} opacity={0.45} scale={2.8} blur={2.5} far={1.5} />
      <OrbitControls enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={1.25} minPolarAngle={Math.PI/3} maxPolarAngle={Math.PI/2} />
    </Canvas>
  </div>
}
