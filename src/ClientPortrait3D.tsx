import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function makeSurfaceTexture(kind: 'skin' | 'hair' | 'fabric') {
  // Hand-painted, stylized material maps: broad color variation first, restrained micro-detail second.
  // This deliberately avoids photo-skin noise; the target is a grounded, readable indie-game look.
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')
  if (!ctx) return new THREE.CanvasTexture(canvas)

  const palettes = {
    skin: ['#c99a78', '#d8ad8a', '#b98063', '#e0b899'],
    hair: ['#211f20', '#302a28', '#4b3930', '#17191c'],
    fabric: ['#29383b', '#36494a', '#1f2c30', '#52615b'],
  } as const
  const palette = palettes[kind]
  ctx.fillStyle = palette[0]
  ctx.fillRect(0, 0, 512, 512)

  // Large soft painted patches provide material depth without the synthetic pore pattern.
  for (let i = 0; i < 34; i++) {
    const x = (i * 97 + 31) % 512
    const y = (i * 173 + 19) % 512
    const radius = kind === 'skin' ? 24 + (i % 5) * 11 : 35 + (i % 6) * 13
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
    gradient.addColorStop(0, palette[(i + 1) % palette.length] + (kind === 'skin' ? '38' : '65'))
    gradient.addColorStop(1, palette[(i + 1) % palette.length] + '00')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()
  }

  if (kind === 'hair') {
    for (let i = 0; i < 95; i++) {
      const x = (i * 37) % 512
      ctx.strokeStyle = i % 4 === 0 ? 'rgba(180,145,112,0.20)' : 'rgba(0,0,0,0.18)'
      ctx.lineWidth = i % 7 === 0 ? 2 : 0.8
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.bezierCurveTo(x + 26, 150, x - 18, 350, x + 8, 512)
      ctx.stroke()
    }
  } else if (kind === 'fabric') {
    ctx.strokeStyle = 'rgba(220,225,211,0.055)'
    ctx.lineWidth = 1
    for (let i = 0; i < 512; i += 8) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 512); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(512, i); ctx.stroke()
    }
    // Subtle seam-like strokes create a woven game-material finish.
    ctx.strokeStyle = 'rgba(0,0,0,0.12)'
    for (let i = 0; i < 28; i++) {
      const y = (i * 19) % 512
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y + 7); ctx.stroke()
    }
  } else {
    // Broad cheek/forehead warmth, intentionally painted rather than photographic.
    const cheek = ctx.createRadialGradient(256, 310, 8, 256, 310, 170)
    cheek.addColorStop(0, 'rgba(174,91,75,0.18)')
    cheek.addColorStop(1, 'rgba(174,91,75,0)')
    ctx.fillStyle = cheek
    ctx.fillRect(0, 0, 512, 512)
    for (let i = 0; i < 180; i++) {
      const x = (i * 73) % 512
      const y = (i * 137) % 512
      ctx.fillStyle = i % 3 === 0 ? 'rgba(116,72,55,0.045)' : 'rgba(255,228,199,0.055)'
      ctx.beginPath()
      ctx.ellipse(x, y, 1.1 + (i % 3) * 0.35, 1.5, 0, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(kind === 'fabric' ? 1.6 : 1, kind === 'fabric' ? 1.8 : 1)
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
    <mesh position={[0, 0.38, 0]} castShadow><cylinderGeometry args={[0.22, 0.28, 0.62, 32]} /><meshStandardMaterial color={skin} map={skinTexture} bumpMap={skinTexture} bumpScale={0.006} roughness={0.84} /></mesh>
    <mesh position={[0, -0.28, -0.02]} geometry={torsoGeometry} castShadow receiveShadow><meshStandardMaterial color={shirt} map={fabricTexture} bumpMap={fabricTexture} bumpScale={0.009} roughness={0.82} /></mesh>
    <mesh position={[0, -0.13, 0.435]} scale={[0.18, 0.34, 0.045]}><sphereGeometry args={[1, 32, 24]} /><meshStandardMaterial color="#d9d7cd" map={fabricTexture} bumpMap={fabricTexture} bumpScale={0.007} roughness={0.88} /></mesh>
    {variant === 'client' || outfit !== 'intern' ? <><mesh position={[0, -0.18, 0.49]} rotation={[0, 0, Math.PI]}><coneGeometry args={[0.052, 0.28, 4]} /><meshStandardMaterial color={outfit === 'premium' ? '#b99b59' : tier >= 3 ? '#7b4238' : '#263e49'} roughness={0.58} metalness={0.08} /></mesh><mesh position={[-0.19, -0.02, 0.395]} rotation={[0, 0, -0.28]}><boxGeometry args={[0.17, 0.54, 0.045]} /><meshStandardMaterial color={outfit === 'premium' ? '#343d49' : '#263d37'} map={fabricTexture} bumpMap={fabricTexture} bumpScale={0.008} roughness={0.76} /></mesh><mesh position={[0.19, -0.02, 0.395]} rotation={[0, 0, 0.28]}><boxGeometry args={[0.17, 0.54, 0.045]} /><meshStandardMaterial color={outfit === 'premium' ? '#343d49' : '#263d37'} map={fabricTexture} bumpMap={fabricTexture} bumpScale={0.008} roughness={0.76} /></mesh>{outfit === 'premium' && <mesh position={[0.28, -0.1, 0.44]}><sphereGeometry args={[0.025, 16, 12]} /><meshStandardMaterial color="#e2c078" metalness={0.65} roughness={0.25} /></mesh>}</> : null}
    <mesh position={[0, 0.01, 0.43]} scale={[0.36, 0.39, 0.1]}><sphereGeometry args={[1, 32, 24]} /><meshStandardMaterial color={shirt === '#293b49' ? '#d8d9d1' : '#c5c8bc'} map={fabricTexture} bumpMap={fabricTexture} bumpScale={0.008} roughness={0.86} /></mesh>
    <group ref={head} position={[0, 1.1, 0]}>
      <mesh position={[0, 0.52, 0]} geometry={headGeometry} castShadow receiveShadow><meshStandardMaterial color={skin} map={skinTexture} bumpMap={skinTexture} bumpScale={0.007} roughness={0.78} /></mesh>
      <mesh position={[0, 1.02, -0.015]} scale={[0.66, 0.34, 0.59]} castShadow><sphereGeometry args={[1, 48, 32]} /><meshStandardMaterial color={hair} map={hairTexture} bumpMap={hairTexture} bumpScale={0.012} roughness={0.88} /></mesh>
      <mesh position={[-0.48, 0.57, 0.06]} scale={[0.16, 0.24, 0.13]} castShadow><sphereGeometry args={[1, 24, 20]} /><meshStandardMaterial color={hair} map={hairTexture} bumpMap={hairTexture} bumpScale={0.012} roughness={0.9} /></mesh>
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
          <mesh position={[0, 0.125, 0.012]} rotation={[0, 0, Math.PI / 2 + side * -0.12]}><capsuleGeometry args={[0.026, 0.16, 8, 16]} /><meshStandardMaterial color={hair} map={hairTexture} bumpMap={hairTexture} bumpScale={0.01} roughness={0.92} /></mesh>
        </group>)}
      </group>
      <mesh position={[0, 0.3, 0.585]} scale={[0.075, 0.13, 0.09]} castShadow><sphereGeometry args={[1, 32, 24]} /><meshStandardMaterial color={skin} map={skinTexture} bumpMap={skinTexture} bumpScale={0.02} roughness={0.74} /></mesh>
      <mesh position={[0, 0.36, 0.62]} scale={[0.047, 0.12, 0.075]} castShadow><sphereGeometry args={[1, 32, 24]} /><meshStandardMaterial color={skin} map={skinTexture} bumpMap={skinTexture} bumpScale={0.006} roughness={0.76} /></mesh>
      <mesh position={[0, 0.255, 0.67]} scale={[0.068, 0.052, 0.052]} castShadow><sphereGeometry args={[1, 28, 20]} /><meshStandardMaterial color={skin} map={skinTexture} roughness={0.72} /></mesh>
      {[-1, 1].map(side => <group key={'nostril-' + side} position={[side * 0.037, 0.235, 0.703]}><mesh scale={[0.014, 0.009, 0.008]}><sphereGeometry args={[1, 16, 12]} /><meshStandardMaterial color="#78564b" roughness={0.95} /></mesh></group>)}
      {[-1, 1].map(side => <mesh key={'cheek-' + side} position={[side * 0.36, 0.27, 0.43]} scale={[0.17, 0.12, 0.06]}><sphereGeometry args={[1, 24, 18]} /><meshStandardMaterial color={skin} map={skinTexture} bumpMap={skinTexture} bumpScale={0.012} roughness={0.86} /></mesh>)}
      <mesh position={[0, 0.195, 0.66]} scale={[0.092, 0.018, 0.028]}><sphereGeometry args={[1, 24, 16]} /><meshStandardMaterial color="#d8a49a" roughness={0.78} /></mesh>
      <mesh position={[0, 0.16, 0.665]} scale={[0.105, 0.018, 0.026]} castShadow><sphereGeometry args={[1, 32, 20]} /><meshStandardMaterial color="#a8796c" roughness={0.75} /></mesh>
      <mesh ref={mouth} position={[0, 0.125, 0.688]} scale={[0.085, 0.018, 0.02]}><sphereGeometry args={[1, 24, 16]} /><meshStandardMaterial color="#713d37" roughness={0.85} /></mesh>
      {tier >= 3 && <mesh position={[0, 0.01, 0.47]} scale={[0.43, 0.28, 0.18]}><sphereGeometry args={[1, 40, 24]} /><meshStandardMaterial color={hair} map={hairTexture} bumpMap={hairTexture} bumpScale={0.012} roughness={0.94} /></mesh>}
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
