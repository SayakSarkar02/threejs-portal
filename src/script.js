import * as dat from 'lil-gui'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
// import { Light } from 'three'

import firefliesVertexShader from './shaders/fireflies/vertex.glsl'
import firefliesFragementShader from './shaders/fireflies/fragment.glsl'
import portalVertexShader from './shaders/portal/vertex.glsl'
import portalFragementShader from './shaders/portal/fragment.glsl'



/**
 * Base
 */
// Debug
const debugObject = {}
const gui = new dat.GUI({
    width: 400
})


// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Loaders
 */
// Texture loader
const textureLoader = new THREE.TextureLoader()

// Draco loader
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('draco/')

// GLTF loader
const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

//Tectures
//Baked Textures
const bakedTexture = textureLoader.load('baked.jpg')
bakedTexture.flipY = false
bakedTexture.encoding = THREE.sRGBEncoding

// Materials
//Baked Materials
const bakedMaterial = new THREE.MeshBasicMaterial({
    map: bakedTexture
})

//Pole Light Material
const poleLightMaterial = new THREE.MeshBasicMaterial({color: "#FFF7B3"})
const portalLightMaterial = new THREE.ShaderMaterial({
    uniforms: {
        uTime: {value: 0},
        uColorStart: {value: new THREE.Color('#FFFFFF')},
        uColorEnd: {value: new THREE.Color('#B3FFFE')}
    },
    vertexShader: portalVertexShader,
    fragmentShader: portalFragementShader
})


// Model Load
gltfLoader.load(
    'portal.glb',
    (gltf)=>{
        gltf.scene.traverse((child)=>{
            child.material = bakedMaterial
        })

        //Targeting Emission Materials
        const bakedMesh = gltf.scene.children.find((child)=>{return child.name === 'Plane001'})
        const poleLightAMesh = gltf.scene.children.find((child)=>{ return child.name === 'poleLightA'})
        const poleLightBMesh = gltf.scene.children.find((child)=>{ return child.name === 'poleLightB'})
        const portalLightMesh = gltf.scene.children.find((child)=>{ return child.name === 'portalLight'})

        bakedMesh.material = bakedMaterial
        poleLightAMesh.material = poleLightMaterial
        poleLightBMesh.material = poleLightMaterial
        portalLightMesh.material = portalLightMaterial

        scene.add(gltf.scene)
});

//Fireflies
const firefliesGeometry = new THREE.BufferGeometry()
const firefliesCount = 30
const positionArray = new Float32Array(firefliesCount * 3)
const scaleArray = new Float32Array(firefliesCount)

for(let i = 0; i < firefliesCount; i++){
    positionArray[i*3 + 0] = (Math.random() - 0.5) * 4;
    positionArray[i*3 + 1] = (Math.random()) * 1.5;
    positionArray[i*3 + 2] = (Math.random() - 0.5) * 4;

    scaleArray[i] = Math.random()
}

//Geometry
firefliesGeometry.setAttribute('position', new THREE.BufferAttribute(positionArray, 3))
firefliesGeometry.setAttribute('aScale', new THREE.BufferAttribute(scaleArray, 1))


//Material
const firefliesMaterial = new THREE.ShaderMaterial({
    uniforms:{
        uPixelRatio: {value: Math.min(window.devicePixelRatio, 2)},
        uSize: {value: 100},
        uTime: {value: 0}
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    vertexShader: firefliesVertexShader,
    fragmentShader: firefliesFragementShader
})

gui.add(firefliesMaterial.uniforms.uSize, 'value').min(0).max(250).step(1).name('firefliesSize')

//Points
const fireflies = new THREE.Points(firefliesGeometry, firefliesMaterial)
scene.add(fireflies)


/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    //Update Fireflies Material
    firefliesMaterial.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2)
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 4
camera.position.y = 2
camera.position.z = 4
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.outputEncoding = THREE.sRGBEncoding

debugObject.clearColor = '#17172b'
renderer.setClearColor(debugObject.clearColor)
gui.addColor(debugObject, 'clearColor').onChange(()=>{
    renderer.setClearColor(debugObject.clearColor)
})

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    //Update Materials
    firefliesMaterial.uniforms.uTime.value = elapsedTime
    portalLightMaterial.uniforms.uTime.value = elapsedTime

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()