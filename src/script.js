import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import overlayVertexShader from './shaders/overlay/vertex.glsl';
import overlayFragmentShader from './shaders/overlay/fragment.glsl';
import { gsap } from 'gsap';
/**
 * Better intro & html loader
 * - We are going to add a simple loader so that the scene appears nicely
 * when everything is ready, have a black overlay that dissapear once  everything is ready,
 * & we will also add a loding bar; it will be made of HTML/CSS
 * - We are going to use a mix of WebGL and HTML/CSS for the loader
 * 1.OVERLAY (FADES OUT);Options
 * - Animate the canvas in CSS
 * - Animate a div above the canvas in CSS
 * - X Animate a black rectangle in front of the camera . We are going to keep things inside WebGl.
 *  We are going to create a plane will be always facing the camera. Once everything is loaded, we just
 * make that plane fade out. It always better to keep things in webGL. No add HTML.
 * - We are going to put the plane on the scene and position its vertices using a vertex shader
 * How do we make sure that plane(overlay) is facing the camera?
 * - The coordinates of the plane's vertices go from -0.5 to 0.5 because our plane has a size of 1
 * chage it to 2 => const overlayGeometry = new THREE.PlaneGeometry(2, 2, 1, 1);
 * uniforms float uAlpha = 1.0;
 * Then we want to know when everything is loaded. Even though there is only one model in the scene, we are 
 * loading too many assets : 6 images of environment Map, the model geometry, all textures used in the model
 * we have to look inside the static folder => We are going to use GLTFLoader & a CubeTextureLoader. Both can 
 * use a LoadingManager as parameter in the loaders, to be aware when the thing progress and when everything is ready
 * - GSAP Library: to animate the overlay
 * 2. LOADING: PROGRESS-BAR
 * For the shake of the lesson( Mixing WebGL with HTML), we will add the bar in the HTML, but we could have create a new plane with a shader
 *  To update the bar. We are going to update the bar in the progress callback of the LoadingManager
 * 
 */

/**
 * Loaders
 */

const loadingBar = document.querySelector('.loading-bar');

// Instantiate LoadingManager:
const loadingManager = new THREE.LoadingManager(
    //Loaded
    () => {
       gsap.delayedCall(0.5, () => {
            
                gsap.to(overlayMaterial.uniforms.uAlpha, {duration: 3, value: 0, delay: 1})
                loadingBar.classList.add('loaded');
                loadingBar.style.transform = '';
           
        })
    },
    //Progress
    (itemUrl, itemsLoaded, itemsTotal) => {
        console.log(itemUrl, itemsLoaded, itemsTotal);
        const progressRatio = itemsLoaded / itemsTotal;
        loadingBar.style.transform = `scaleX(${progressRatio})`;
      

    }
);

const gltfLoader = new GLTFLoader(loadingManager);
const cubeTextureLoader = new THREE.CubeTextureLoader(loadingManager);

/**
 * Base
 */
// Debug
const debugObject = {};

// Canvas
const canvas = document.querySelector('canvas.webgl');

// Scene
const scene = new THREE.Scene();
/**
 * Overlay
 */
const overlayGeometry = new THREE.PlaneGeometry(2, 2, 1, 1);
const overlayMaterial = new THREE.ShaderMaterial({
    transparent: true,
   // wireframe: true,
    vertexShader: overlayVertexShader,
    fragmentShader: overlayFragmentShader,
    uniforms: {
        uAlpha: new THREE.Uniform(1)
    }
});
const overlay = new THREE.Mesh(overlayGeometry, overlayMaterial);
scene.add(overlay);

/**
 * Update all materials
 */
const updateAllMaterials = () =>
{
    scene.traverse((child) =>
    {
        if(child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial)
        {
            // child.material.envMap = environmentMap
            child.material.envMapIntensity = debugObject.envMapIntensity;
            child.material.needsUpdate = true;
            child.castShadow = true;
            child.receiveShadow = true;
        }
    })
};

/**
 * Environment map
 */
const environmentMap = cubeTextureLoader.load([
    '/textures/environmentMaps/3/px.jpg',
    '/textures/environmentMaps/3/nx.jpg',
    '/textures/environmentMaps/3/py.jpg',
    '/textures/environmentMaps/3/ny.jpg',
    '/textures/environmentMaps/3/pz.jpg',
    '/textures/environmentMaps/3/nz.jpg'
]);

environmentMap.colorSpace = THREE.SRGBColorSpace;

scene.background = environmentMap;
scene.environment = environmentMap;

debugObject.envMapIntensity = 2.5;

/**
 * Models
 */
gltfLoader.load(
    '/models/FlightHelmet/glTF/FlightHelmet.gltf',
    (gltf) =>
    {
        gltf.scene.scale.set(10, 10, 10);
        gltf.scene.position.set(0, - 4, 0);
        gltf.scene.rotation.y = Math.PI * 0.5;
        scene.add(gltf.scene);

        updateAllMaterials();
    }
);

/**
 * Lights
 */
const directionalLight = new THREE.DirectionalLight('#ffffff', 3);
directionalLight.castShadow = true;
directionalLight.shadow.camera.far = 15;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.normalBias = 0.05;
directionalLight.position.set(0.25, 3, - 2.25);
scene.add(directionalLight);

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
};

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    // Update camera
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    // Update renderer
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
camera.position.set(4, 1, - 4);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
});
renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.toneMappingExposure = 3;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Animate
 */
const tick = () =>
{
    // Update controls
    controls.update();

    // Render
    renderer.render(scene, camera);

    // Call tick again on the next frame
    window.requestAnimationFrame(tick);
}

tick();