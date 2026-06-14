
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface Props {
  className?: string
  blurOverlay?: boolean
}

export default function HolographicBackground({
  className = '',
  blurOverlay = false,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let W = window.innerWidth
    let H = window.innerHeight

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(W, H)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    container.appendChild(renderer.domElement)

    const scene = new THREE.Scene()

    function makeStudioEnv() {
      const c = document.createElement('canvas')
      c.width = 1024
      c.height = 512
      const ctx = c.getContext('2d')!

      const g = ctx.createLinearGradient(0, 0, 0, 512)
      g.addColorStop(0.0, '#ffffff')
      g.addColorStop(0.28, '#efe7db')
      g.addColorStop(0.38, '#4a423a')
      g.addColorStop(0.5, '#241f1b')
      g.addColorStop(0.62, '#544a42')
      g.addColorStop(0.8, '#cdc2b1')
      g.addColorStop(1.0, '#f3ede4')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, 1024, 512)

      const band = (y: number, h: number, a: number) => {
        const hl = ctx.createLinearGradient(0, y, 0, y + h)
        hl.addColorStop(0, 'rgba(255,255,255,0)')
        hl.addColorStop(0.5, `rgba(255,255,255,${a})`)
        hl.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.fillStyle = hl
        ctx.fillRect(0, y, 1024, h)
      }
      band(30, 70, 1.0)
      band(120, 26, 0.95)
      band(300, 40, 0.7)

      const col = (x: number, w: number, a: number) => {
        const v = ctx.createLinearGradient(x, 0, x + w, 0)
        v.addColorStop(0, 'rgba(255,255,255,0)')
        v.addColorStop(0.5, `rgba(255,255,255,${a})`)
        v.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.fillStyle = v
        ctx.fillRect(x, 0, w, 512)
      }
      col(160, 120, 0.45)
      col(640, 110, 0.4)
      col(880, 70, 0.3)

      const glint = (x: number, y: number, r: number) => {
        const rg = ctx.createRadialGradient(x, y, 0, x, y, r)
        rg.addColorStop(0, 'rgba(255,255,255,1)')
        rg.addColorStop(0.4, 'rgba(255,255,255,0.6)')
        rg.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.fillStyle = rg
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fill()
      }
      glint(220, 70, 26)
      glint(540, 56, 18)
      glint(820, 96, 22)
      glint(380, 150, 14)

      const tex = new THREE.CanvasTexture(c)
      tex.mapping = THREE.EquirectangularReflectionMapping
      tex.colorSpace = THREE.SRGBColorSpace
      return tex
    }
    const rawEnv = makeStudioEnv()
    const pmrem = new THREE.PMREMGenerator(renderer)
    pmrem.compileEquirectangularShader()
    const envRT = pmrem.fromEquirectangular(rawEnv)
    const envTex = envRT.texture
    scene.environment = envTex
    rawEnv.dispose()
    pmrem.dispose()

    const camera = new THREE.PerspectiveCamera(34, W / H, 0.1, 100)
    camera.position.set(0, 0, 7)
    camera.lookAt(0, 0, 0)

    function makeOpenBand(
      radius: number,
      width: number,
      thickness: number,
      gapAngle: number,
      segments: number,
    ) {
      const rOuter = radius + thickness / 2
      const rInner = radius - thickness / 2
      const start = gapAngle / 2
      const end = Math.PI * 2 - gapAngle / 2

      const shape = new THREE.Shape()
      shape.absarc(0, 0, rOuter, start, end, false)
      shape.lineTo(Math.cos(end) * rInner, Math.sin(end) * rInner)
      shape.absarc(0, 0, rInner, end, start, true)
      shape.lineTo(Math.cos(start) * rOuter, Math.sin(start) * rOuter)

      const geo = new THREE.ExtrudeGeometry(shape, {
        depth: width,
        bevelEnabled: true,
        bevelThickness: thickness * 0.12,
        bevelSize: thickness * 0.1,
        bevelSegments: 4,
        curveSegments: segments,
      })
      geo.translate(0, 0, -width / 2)
      geo.computeVertexNormals()

      const pos = geo.attributes.position
      const uv = new Float32Array(pos.count * 2)
      const wrapsU = 6
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i)
        const y = pos.getY(i)
        const z = pos.getZ(i)
        const angle = Math.atan2(y, x)
        uv[i * 2] = (angle / (Math.PI * 2) + 0.5) * wrapsU
        uv[i * 2 + 1] = (z + width / 2) / width
      }
      geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
      return geo
    }

    function makePolishMaps() {
      const MW = 1024
      const MH = 256

      const rc = document.createElement('canvas')
      rc.width = MW
      rc.height = MH
      const rx = rc.getContext('2d')!
      rx.fillStyle = '#2e2e2e'
      rx.fillRect(0, 0, MW, MH)
      for (let i = 0; i < 280; i++) {
        const y = Math.random() * MH
        const a = 0.03 + Math.random() * 0.06
        rx.strokeStyle = `rgba(150,150,150,${a})`
        rx.lineWidth = 1
        rx.beginPath()
        const x0 = Math.random() * MW
        rx.moveTo(x0, y)
        rx.lineTo(x0 + 200 + Math.random() * 500, y)
        rx.stroke()
      }
      const roughnessMap = new THREE.CanvasTexture(rc)
      roughnessMap.colorSpace = THREE.NoColorSpace
      roughnessMap.wrapS = THREE.RepeatWrapping
      roughnessMap.wrapT = THREE.ClampToEdgeWrapping

      const nc = document.createElement('canvas')
      nc.width = MW
      nc.height = MH
      const nx = nc.getContext('2d')!
      nx.fillStyle = '#8080ff'
      nx.fillRect(0, 0, MW, MH)
      for (let i = 0; i < 220; i++) {
        const y = Math.random() * MH
        const gch = 128 + Math.round((Math.random() - 0.5) * 18)
        nx.strokeStyle = `rgba(128,${gch},255,${0.03 + Math.random() * 0.06})`
        nx.lineWidth = 1
        nx.beginPath()
        const x0 = Math.random() * MW
        nx.moveTo(x0, y)
        nx.lineTo(x0 + 200 + Math.random() * 500, y)
        nx.stroke()
      }
      const normalMap = new THREE.CanvasTexture(nc)
      normalMap.colorSpace = THREE.NoColorSpace
      normalMap.wrapS = THREE.RepeatWrapping
      normalMap.wrapT = THREE.ClampToEdgeWrapping

      return { roughnessMap, normalMap }
    }
    const { roughnessMap, normalMap } = makePolishMaps()

    function makeMetalMat(color: string) {
      return new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(color),
        metalness: 1.0,
        roughness: 0.08,
        roughnessMap,
        normalMap,
        normalScale: new THREE.Vector2(0.18, 0.18),
        clearcoat: 1,
        clearcoatRoughness: 0.03,
        reflectivity: 1,
        envMapIntensity: 3.2,
        side: THREE.DoubleSide,
      })
    }
    const GOLD = '#f0bd57'
    const SILVER = '#eef1f5'

    const group = new THREE.Group()
    scene.add(group)
    const mats: THREE.MeshPhysicalMaterial[] = []
    const geos: THREE.BufferGeometry[] = []

    const mat1 = makeMetalMat(GOLD)
    mats.push(mat1)
    const outerGeo = makeOpenBand(1.5, 0.55, 0.36, 0.55, 320)
    geos.push(outerGeo)
    const ring1 = new THREE.Mesh(outerGeo, mat1)
    ring1.rotation.set(0.5, -0.35, 0.2)
    group.add(ring1)

    const mat2 = makeMetalMat(SILVER)
    mats.push(mat2)
    const innerGeo = makeOpenBand(0.95, 0.42, 0.28, 0.5, 280)
    geos.push(innerGeo)
    const ring2 = new THREE.Mesh(innerGeo, mat2)
    ring2.rotation.set(0.7, 0.4, -0.25)
    group.add(ring2)

    const ring1Home = new THREE.Vector3(-1.0, 0.9, 0)
    const ring2Home = new THREE.Vector3(1.6, -1.2, 0.4)
    ring1.position.copy(ring1Home)
    ring2.position.copy(ring2Home)

    scene.add(new THREE.AmbientLight(0xffffff, 0.35))
    const key = new THREE.DirectionalLight(0xffffff, 2.6)
    key.position.set(2, 3, 4)
    scene.add(key)
    const fill = new THREE.DirectionalLight(0xf0e6d8, 0.7)
    fill.position.set(-3, -1, 2)
    scene.add(fill)
    const rim = new THREE.DirectionalLight(0xffffff, 1.4)
    rim.position.set(-1, 2, -4)
    scene.add(rim)

    let scrollP = 0
    let targetP = 0
    const onScroll = () => {
      const docHeight = Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight
      )
      const travel = docHeight - window.innerHeight
      targetP = travel > 0 ? Math.max(0, Math.min(1, window.scrollY / travel)) : 0
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })

    const ro = new ResizeObserver(() => {
      W = window.innerWidth
      H = window.innerHeight
      renderer.setSize(W, H)
      camera.aspect = W / H
      camera.updateProjectionMatrix()
      onScroll()
    })
    ro.observe(document.body)

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t
    const ease = (x: number) => x * x * x * (x * (x * 6 - 15) + 10)

    let rafId: number
    let last = performance.now()
    let t = 0

    const animate = (now: number) => {
      rafId = requestAnimationFrame(animate)
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      t += dt

      scrollP += (targetP - scrollP) * 0.06
      const p = ease(scrollP)

      ring1.rotation.z = 0.2 + t * 0.21 + p * Math.PI * 1.2
      ring1.rotation.x = 0.5 + Math.sin(t * 0.6) * 0.08 + p * 0.6
      ring2.rotation.z = -0.25 - t * 0.27 - p * Math.PI * 1.4
      ring2.rotation.x = 0.7 + Math.cos(t * 0.54) * 0.08 - p * 0.5

      ring1.position.set(
        ring1Home.x - p * 1.4,
        ring1Home.y + p * 0.8,
        ring1Home.z + p * 1.2,
      )
      ring2.position.set(
        ring2Home.x + p * 1.4,
        ring2Home.y - p * 0.6,
        ring2Home.z + p * 1.2,
      )

      group.rotation.y = p * Math.PI * 0.35
      group.position.y = Math.sin(t * 0.9) * 0.05 - p * 0.2
      group.scale.setScalar(1 + p * 0.18)

      camera.position.z = lerp(7, 4.6, p)
      camera.position.y = lerp(0, 0.9, p)
      camera.lookAt(0, lerp(0, 0.2, p), 0)

      const r = lerp(0.08, 0.02, p)
      mat1.roughness = r
      mat2.roughness = r
      mat1.clearcoatRoughness = lerp(0.05, 0.02, p)
      mat2.clearcoatRoughness = lerp(0.05, 0.02, p)
      const envI = lerp(3.2, 4.0, p)
      mat1.envMapIntensity = envI
      mat2.envMapIntensity = envI

      renderer.toneMappingExposure = lerp(1.05, 1.25, p)

      renderer.render(scene, camera)
    }
    rafId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('scroll', onScroll)
      ro.disconnect()
      mats.forEach((m) => m.dispose())
      geos.forEach((g) => g.dispose())
      roughnessMap.dispose()
      normalMap.dispose()
      envTex.dispose()
      renderer.dispose()
      if (container.contains(renderer.domElement))
        container.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div
      className={`fixed inset-0 w-full h-full z-[-1] pointer-events-none ${className}`}
      style={{
        background:
          'radial-gradient(120% 100% at 50% 30%, #faf8f6 0%, #f4f2f0 45%, #ece6df 80%, #e2dad0 100%)',
      }}
    >
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />
      {/* Darkening & Blur Overlay */}
      <div
        className={`absolute inset-0 w-full h-full transition-all duration-700 ease-in-out ${
          blurOverlay ? 'backdrop-blur-md bg-[#faf8f6]/60' : 'backdrop-blur-none bg-transparent'
        }`}
      />
    </div>
  )
}
