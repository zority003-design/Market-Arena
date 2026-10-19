import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function makeSurfaceTexture(kind: 'skin' | 'hair' | 'fabric') {
  // Procedural 512px micro-surface maps: subtle pores, strand flow, and a woven cloth grain.
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')
  if (!ctx) return new THREE.CanvasTexture(canvas)
  const image = ctx.createImageData(canvas.width, canvas.height)
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const i = (y * canvas.width + x) * 4
      const hash = (x * 374761393 + y * 668265263 + ((x + 31) * (y + 17)) * 1442695041) >>> 0
      const grain = ((hash ^ (hash >>> 13)) % 23) - 11
      const weave = kind === 'fabric' ? ((x % 5 === 0 ? -12 : 0) + (y % 5 === 0 ? -8 : 0)) : 0
      const strand = kind === 'hair' ? Math.sin(x * 0.21 + Math.sin(y * 0.025) * 2.4) * 10 : 0
      const pore = kind === 'skin' && hash % 127 === 0 ? -13 : 0
      const base = kind === 'skin' ? 239 : kind === 'hair' ? 192 : 232
      const value = Math.max(0, Math.min(255, base + grain * (kind === 'skin' ? 0.55 : 1.1) + weave + strand + pore))
      image.data[i] = Math.max(0, Math.min(255, value + (kind === 'skin' ? 2 : 0)))
      image.data[i + 1] = value
      image.data[i + 2] = Math.max(0, Math.min(255, value - (kind === 'skin' ? 2 : 0)))
      image.data[i + 3] = 255
    }
  }
  ctx.putImageData(image, 0, 0)
  if (kind === 'hair') {
    for (let i = 0; i < 180; i++) {
      const x = (i * 37) % 512
      ctx.strokeStyle = i % 3 === 0 ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)'
      ctx.lineWidth = i % 5 === 0 ? 1.5 : 0.65
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.bezierCurveTo(x + 18, 160, x - 14, 340, x + 7, 512)
      ctx.stroke()
    }
  } else if (kind === 'fabric') {
    ctx.strokeStyle = 'rgba(0,0,0,0.10)'
    ctx.lineWidth = 1
    for (let i = 0; i < 512; i += 5) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 512); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(512, i); ctx.stroke()
    }
    for (let i = 0; i < 40; i++) {
      const x = (i * 73) % 512
      const y = (i * 127) % 512
      ctx.strokeStyle = 'rgba(255,255,255,0.16)'
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 10, y + 2); ctx.stroke()
    }
  } else {
    for (let i = 0; i < 700; i++) {
      const x = (i * 73) % 512
      const y = (i * 137) % 512
      ctx.fillStyle = i % 4 === 0 ? 'rgba(130,82,65,0.10)' : 'rgba(255,245,228,0.12)'
      ctx.beginPath(); ctx.ellipse(x, y, 0.55 + (i % 3) * 0.25, 0.7, 0, 0, Math.PI * 2); ctx.fill()
    }
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(kind === 'fabric' ? 2 : 1, kind === 'fabric' ? 2.5 : 1)
  texture.anisotropy = 4
  texture.needsUpdate = true
  return texture
}
function makeTorsoGeometry() {
  const segments = 48
  const rings = 28
  const vertices: number[] = []
  const uvs: number[] = []
  const indices: number[] = []
  for (let iy = 0; iy <= rings; iy++) {
    const t = iy / rings
    const y = -0.55 + t * 1.1
    const shoulder = Math.exp(-Math.pow((t - 0.78) / 0.22, 2))
    const waist = Math.exp(-Math.pow((t - 0.28) / 0.22, 2))
    const rx = 0.43 + 0.28 * shoulder - 0.035 * waist
    const rz = 0.27 + 0.105 * shoulder
    for (let ix = 0; ix <= segments; ix++) {
      const u = ix / segments
      const angle = u * Math.PI * 2
      const x = rx * Math.cos(angle)
      const z = rz * Math.sin(angle)
      vertices.push(x, y, z)
      uvs.push(u, t)
      if (iy < rings && ix < segments) {
        const a = iy * (segments + 1) + ix
        const b = a + segments + 1
        indices.push(a, b, a + 1, b, b + 1, a + 1)
      }
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

function makeHeadGeometry() {
  const segments = 64
  const rings = 48
  const vertices: number[] = []
  const uvs: number[] = []
  const indices: number[] = []
  for (let iy = 0; iy <= rings; iy++) {
    const t = iy / rings
    const y = -0.82 + t * 1.64
    const sinProfile = Math.max(0.015, Math.sin(Math.PI * t))
    const jaw = t < 0.25 ? 0.76 + t * 0.96 : t > 0.82 ? 1 - (t - 0.82) * 1.1 : 1
    const rx = 0.66 * Math.pow(sinProfile, 0.42) * jaw
    const rz = 0.59 * Math.pow(sinProfile, 0.48) * (t < 0.22 ? 0.82 : 1)
    for (let ix = 0; ix <= segments; ix++) {
      const u = ix / segments
      const angle = u * Math.PI * 2
      const front = Math.max(0, Math.sin(angle))
      const x = rx * Math.cos(angle)
      const z = rz * Math.sin(angle) + front * 0.025 * Math.exp(-Math.pow((y - 0.08) / 0.42, 2))
      vertices.push(x, y, z)
      uvs.push(u, t)
      if (iy < rings && ix < segments) {
        const a = iy * (segments + 1) + ix
        const b = a + segments + 1
        indices.push(a, b, a + 1, b, b + 1, a + 1)
      }
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

function PortraitHead({ tier, variant, outfit }: { tier: number; variant: 'client' | 'player'; outfit: 'intern' | 'classic' | 'premium' }) {
  const head = useRef<THREE.Group>(null)
  const eyes = useRef<THREE.Group>(null)
  const mouth = useRef<THREE.Mesh>(null)
  const skin = variant === 'player' ? '#b68e72' : tier >= 4 ? '#8f7767' : tier === 3 ? '#b99a83' : tier === 2 ? '#c8ad95' : '#bda18a'
  const hair = variant === 'player' ? '#1d272b' : tier >= 4 ? '#38231f' : tier === 3 ? '#222426' : tier === 2 ? '#60412e' : '#33241f'
  const shirt = variant === 'player' ? (outfit === 'premium' ? '#202a36' : outfit === 'classic' ? '#293f4b' : '#354d46') : tier >= 4 ? '#493b35' : tier === 3 ? '#293b49' : tier === 2 ? '#425e5c' : '#354d46'
  const skinTexture = useMemo(() => makeSurfaceTexture('skin'), [])
  const hairTexture = useMemo(() => makeSurfaceTexture('hair'), [])
  const fabricTexture = useMemo(() => makeSurfaceTexture('fabric'), [])
  const headGeometry = useMemo(() => makeHeadGeometry(), [])
  const torsoGeometry = useMemo(() => makeTorsoGeometry(), [])

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
    if (mouth.current) mouth.current.scale.y = 0.018 + Math.max(0, Math.sin(t * 6.2 + tier)) * 0.048
  })

  return <group>
    <mesh position={[0, 0.38, 0]} castShadow><cylinderGeometry args={[0.22, 0.28, 0.62, 32]} /><meshStandardMaterial color={skin} map={skinTexture} bumpMap={skinTexture} bumpScale={0.018} roughness={0.84} /></mesh>
    <mesh position={[0, -0.28, -0.02]} geometry={torsoGeometry} castShadow receiveShadow><meshStandardMaterial color={shirt} map={fabricTexture} bumpMap={fabricTexture} bumpScale={0.035} roughness={0.82} /></mesh>
    <mesh position={[0, -0.13, 0.435]} scale={[0.18, 0.34, 0.045]}><sphereGeometry args={[1, 32, 24]} /><meshStandardMaterial color="#d9d7cd" map={fabricTexture} bumpMap={fabricTexture} bumpScale={0.025} roughness={0.88} /></mesh>
    {variant === 'client' || outfit !== 'intern' ? <><mesh position={[0, -0.18, 0.49]} rotation={[0, 0, Math.PI]}><coneGeometry args={[0.052, 0.28, 4]} /><meshStandardMaterial color={outfit === 'premium' ? '#b99b59' : tier >= 3 ? '#7b4238' : '#263e49'} roughness={0.58} metalness={0.08} /></mesh><mesh position={[-0.19, -0.02, 0.395]} rotation={[0, 0, -0.28]}><boxGeometry args={[0.17, 0.54, 0.045]} /><meshStandardMaterial color={outfit === 'premium' ? '#343d49' : '#263d37'} map={fabricTexture} bumpMap={fabricTexture} bumpScale={0.03} roughness={0.76} /></mesh><mesh position={[0.19, -0.02, 0.395]} rotation={[0, 0, 0.28]}><boxGeometry args={[0.17, 0.54, 0.045]} /><meshStandardMaterial color={outfit === 'premium' ? '#343d49' : '#263d37'} map={fabricTexture} bumpMap={fabricTexture} bumpScale={0.03} roughness={0.76} /></mesh>{outfit === 'premium' && <mesh position={[0.28, -0.1, 0.44]}><sphereGeometry args={[0.025, 16, 12]} /><meshStandardMaterial color="#e2c078" metalness={0.65} roughness={0.25} /></mesh>}</> : null}
    <mesh position={[0, 0.01, 0.43]} scale={[0.36, 0.39, 0.1]}><sphereGeometry args={[1, 32, 24]} /><meshStandardMaterial color={shirt === '#293b49' ? '#d8d9d1' : '#c5c8bc'} map={fabricTexture} bumpMap={fabricTexture} bumpScale={0.03} roughness={0.86} /></mesh>
    <group ref={head} position={[0, 1.1, 0]}>
      <mesh position={[0, 0.52, 0]} geometry={headGeometry} castShadow receiveShadow><meshStandardMaterial color={skin} map={skinTexture} bumpMap={skinTexture} bumpScale={0.022} roughness={0.78} /></mesh>
      <mesh position={[0, 1.02, -0.015]} scale={[0.66, 0.34, 0.59]} castShadow><sphereGeometry args={[1, 48, 32]} /><meshStandardMaterial color={hair} map={hairTexture} bumpMap={hairTexture} bumpScale={0.055} roughness={0.88} /></mesh>
      <mesh position={[-0.48, 0.57, 0.06]} scale={[0.16, 0.24, 0.13]} castShadow><sphereGeometry args={[1, 24, 20]} /><meshStandardMaterial color={hair} map={hairTexture} bumpMap={hairTexture} bumpScale={0.055} roughness={0.9} /></mesh>
      <mesh position={[0.48, 0.57, 0.06]} scale={[0.16, 0.24, 0.13]} castShadow><sphereGeometry args={[1, 24, 20]} /><meshStandardMaterial color={hair} map={hairTexture} roughness={0.94} /></mesh>
      {[-1, 1].map(side => <group key={side} position={[side * 0.65, 0.46, 0]}>
        <mesh castShadow><sphereGeometry args={[0.14, 24, 20]} /><meshStandardMaterial color={skin} map={skinTexture} roughness={0.9} /></mesh>
        <mesh position={[0, 0, 0.105]}><sphereGeometry args={[0.065, 20, 16]} /><meshStandardMaterial color="#947967" roughness={0.95} /></mesh>
      </group>)}
      <group ref={eyes} position={[0, 0.56, 0.52]}>
        {[-1, 1].map(side => <group key={side} position={[side * 0.255, 0, 0]}>
          <mesh scale={[0.15, 0.075, 0.055]}><sphereGeometry args={[1, 32, 20]} /><meshStandardMaterial color="#f0e4d2" roughness={0.45} /></mesh>
          <mesh position={[0, 0, 0.048]} scale={[0.052, 0.055, 0.026]}><sphereGeometry args={[1, 24, 20]} /><meshStandardMaterial color={tier >= 3 ? '#46352b' : '#4a655e'} roughness={0.4} /></mesh>
          <mesh position={[0.012, 0.012, 0.07]}><sphereGeometry args={[0.014, 12, 10]} /><meshBasicMaterial color="#fff8e8" /></mesh>
          <mesh position={[0, 0.125, 0.012]} rotation={[0, 0, Math.PI / 2 + side * -0.12]}><capsuleGeometry args={[0.026, 0.16, 8, 16]} /><meshStandardMaterial color={hair} map={hairTexture} bumpMap={hairTexture} bumpScale={0.04} roughness={0.92} /></mesh>
        </group>)}
      </group>
      <mesh position={[0, 0.3, 0.585]} scale={[0.075, 0.13, 0.09]} castShadow><sphereGeometry args={[1, 32, 24]} /><meshStandardMaterial color={skin} map={skinTexture} bumpMap={skinTexture} bumpScale={0.02} roughness={0.74} /></mesh>
      <mesh position={[0, 0.36, 0.62]} scale={[0.047, 0.12, 0.075]} castShadow><sphereGeometry args={[1, 32, 24]} /><meshStandardMaterial color={skin} map={skinTexture} bumpMap={skinTexture} bumpScale={0.018} roughness={0.76} /></mesh>
      <mesh position={[0, 0.255, 0.67]} scale={[0.068, 0.052, 0.052]} castShadow><sphereGeometry args={[1, 28, 20]} /><meshStandardMaterial color={skin} map={skinTexture} roughness={0.72} /></mesh>
      {[-1, 1].map(side => <group key={'nostril-' + side} position={[side * 0.037, 0.235, 0.703]}><mesh scale={[0.014, 0.009, 0.008]}><sphereGeometry args={[1, 16, 12]} /><meshStandardMaterial color="#78564b" roughness={0.95} /></mesh></group>)}
      {[-1, 1].map(side => <mesh key={'cheek-' + side} position={[side * 0.36, 0.27, 0.43]} scale={[0.17, 0.12, 0.06]}><sphereGeometry args={[1, 24, 18]} /><meshStandardMaterial color={skin} map={skinTexture} bumpMap={skinTexture} bumpScale={0.012} roughness={0.86} /></mesh>)}
      <mesh position={[0, 0.195, 0.66]} scale={[0.092, 0.018, 0.028]}><sphereGeometry args={[1, 24, 16]} /><meshStandardMaterial color="#d8a49a" roughness={0.78} /></mesh>
      <mesh position={[0, 0.16, 0.665]} scale={[0.105, 0.018, 0.026]} castShadow><sphereGeometry args={[1, 32, 20]} /><meshStandardMaterial color="#a8796c" roughness={0.75} /></mesh>
      <mesh ref={mouth} position={[0, 0.125, 0.688]} scale={[0.085, 0.018, 0.02]}><sphereGeometry args={[1, 24, 16]} /><meshStandardMaterial color="#713d37" roughness={0.85} /></mesh>
      {tier >= 3 && <mesh position={[0, 0.01, 0.47]} scale={[0.43, 0.28, 0.18]}><sphereGeometry args={[1, 40, 24]} /><meshStandardMaterial color={hair} map={hairTexture} bumpMap={hairTexture} bumpScale={0.05} roughness={0.94} /></mesh>}
      {tier >= 2 && <mesh position={[0, 0.79, 0.34]} scale={[0.25, 0.07, 0.22]}><sphereGeometry args={[1, 32, 20]} /><meshStandardMaterial color={hair} map={hairTexture} roughness={0.92} /></mesh>}
    </group>
    <mesh position={[-0.7, 0.02, -0.1]} rotation={[0, 0, -0.28]} scale={[0.1, 0.4, 0.12]}><capsuleGeometry args={[1, 0.6, 8, 16]} /><meshStandardMaterial color={shirt} map={fabricTexture} roughness={0.9} /></mesh>
    <mesh position={[0.7, 0.02, -0.1]} rotation={[0, 0, 0.28]} scale={[0.1, 0.4, 0.12]}><capsuleGeometry args={[1, 0.6, 8, 16]} /><meshStandardMaterial color={shirt} map={fabricTexture} roughness={0.9} /></mesh>
  </group>
}

export default function ClientPortrait3D({ tier, variant = 'client', outfit = 'intern' }: { tier: number; variant?: 'client' | 'player'; outfit?: 'intern' | 'classic' | 'premium' }) {
  return <div className="client-portrait-3d" aria-label="Анимированный 3D-портрет клиента">
    <Canvas dpr={[1, 1.6]} camera={{ position: [0, 1.45, 5.0], fov: 38, near: 0.1, far: 20 }} gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }} onCreated={({ gl, camera }) => { gl.setClearColor(0x000000, 0); gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 0.98; gl.outputColorSpace = THREE.SRGBColorSpace; camera.lookAt(0, 1.12, 0) }}>
      <ambientLight intensity={1.15} />
      <hemisphereLight args={['#d9e6f1', '#4b4039', 0.72]} />
      <directionalLight position={[-2.5, 4, 3]} intensity={2.1} color="#ffe1c4" castShadow />
      <pointLight position={[2.2, 1.4, 1.2]} intensity={0.7} color="#91c5b5" />
      <PortraitHead tier={tier} variant={variant} outfit={outfit} />
    </Canvas>
  </div>
}
