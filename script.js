import * as THREE from 'three';
import { FlyControls } from 'FlyControls';
import * as dat from 'dat.gui';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 7.5);
scene.add(light);
scene.add(new THREE.AmbientLight(0x404040));

const pivot = new THREE.Object3D();
scene.add(pivot);
pivot.add(camera);
camera.position.set(0, 30, 30);

const flyControls = new FlyControls(camera, renderer.domElement);
flyControls.movementSpeed = 10;
flyControls.rollSpeed = Math.PI / 24;
flyControls.autoForward = false;
flyControls.dragToLook = true;

let terrainData = [];
let wireframe;
let spacing = 1;
let rotationSpeedX = 0;
let rotationSpeedY = 0;
let rotationSpeedZ = 0;
let wireframeColor = 0xffffff;
let fadeHeightEffect = true;
let fadeColor1 = 0x24e;
let fadeColor2 = 0x9400;
let fadeColor3 = 0x0;
let fadeColor4 = 0xa0a000;
let fadeColor5 = 0xff0000;

document.getElementById('loadFranceMap').addEventListener('click', () => { loadMapFromFile('42_map_pack/fr.fdf'); });
document.getElementById('loadPyraMap').addEventListener('click', () => { loadMapFromFile('42_map_pack/pylone.fdf'); });
document.getElementById('loadMarsMap').addEventListener('click', () => { loadMapFromFile('42_map_pack/mars.fdf'); });
document.getElementById('load42Map').addEventListener('click', () => { loadMapFromFile('42_map_pack/42.fdf'); });

async function loadMapFromFile(filePath) {
    try 
    {
        const response = await fetch(filePath);
        if (!response.ok)
            throw new Error(`Failed to load file: ${response.statusText}`);
        const content = await response.text();
        terrainData = parseTerrainInput(content);
        createTerrain(terrainData);
    } 
    catch (error) 
    {
        console.error('Error loading map:', error);
    }
}

function createTerrain(data) {
    const existingTerrain = scene.children.filter(child => child.type === "LineSegments");
    existingTerrain.forEach(terrain => scene.remove(terrain));

    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const indices = [];
    const colors = [];
    const width = data[0].length;
    const height = data.length;

    const maxZ = Math.max(...data.flat());

    for (let i = 0; i < height; i++) 
    {
        for (let j = 0; j < width; j++) 
        {
            const x = j * spacing;
            const y = (height - i - 1) * spacing;
            const z = data[i][j];
            vertices.push(x, y, z);

            let color;
            if (fadeHeightEffect) 
            {
                const lerpFactor = z / maxZ;

                if (lerpFactor < 0.2)
                    color = new THREE.Color(fadeColor1).lerp(new THREE.Color(fadeColor2), lerpFactor / 0.2);
                else if (lerpFactor < 0.4)
                    color = new THREE.Color(fadeColor2).lerp(new THREE.Color(fadeColor3), (lerpFactor - 0.2) / 0.2);
                else if (lerpFactor < 0.6)
                    color = new THREE.Color(fadeColor3).lerp(new THREE.Color(fadeColor4), (lerpFactor - 0.4) / 0.2);
                else if (lerpFactor < 0.8)
                    color = new THREE.Color(fadeColor4).lerp(new THREE.Color(fadeColor5), (lerpFactor - 0.6) / 0.2);
                else
                    color = new THREE.Color(fadeColor5);
            } 
            else
                color = new THREE.Color(wireframeColor);

            colors.push(color.r, color.g, color.b);

            if (j < width - 1)
                indices.push(i * width + j, i * width + (j + 1));
            if (i < height - 1)
                indices.push(i * width + j, (i + 1) * width + j);
        }
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.LineBasicMaterial({ color: wireframeColor, vertexColors: true });
    wireframe = new THREE.LineSegments(geometry, material);
    scene.add(wireframe);

    const centerX = (width - 1) * spacing / 2;
    const centerY = (height - 1) * spacing / 2;
    const centerZ = maxZ / 2;

    const maxDimension = Math.max(width * spacing, height * spacing);
    const distance = maxDimension / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));

    camera.position.set(centerX, centerY + distance, centerZ + distance);
    camera.lookAt(new THREE.Vector3(centerX, centerY, centerZ));

    flyControls.update(0.1);
}

function parseTerrainInput(text) {
    const rows = text.trim().split('\n');
    return rows.map(row => row.trim().split(/\s+/).map(Number));
}

document.getElementById('openDialog').addEventListener('click', () => { document.getElementById('dialog').style.display = 'block'; });
document.getElementById('closeDialog').addEventListener('click', () => { document.getElementById('dialog').style.display = 'none'; });
document.getElementById('applyTerrain').addEventListener('click', () => {
    const terrainInput = document.getElementById('terrainInput').value;
    terrainData = parseTerrainInput(terrainInput);
    createTerrain(terrainData);
    document.getElementById('dialog').style.display = 'none';
});

const gui = new dat.GUI();
const params = {
    color: wireframeColor,
    spacing: spacing,
    rotationSpeedX: rotationSpeedX,
    rotationSpeedY: rotationSpeedY,
    rotationSpeedZ: rotationSpeedZ,
    fadeHeight: fadeHeightEffect,
    fadeColor1: fadeColor1,
    fadeColor2: fadeColor2,
    fadeColor3: fadeColor3,
    fadeColor4: fadeColor4,
    fadeColor5: fadeColor5,
    moveSpeed: flyControls.movementSpeed
};

gui.addColor(params, 'color').name('Color').onChange(value => {
    wireframeColor = value;
    createTerrain(terrainData);
});
gui.add(params, 'spacing', 0.5, 5).name('Sizing').onChange(value => {
    spacing = value;
    createTerrain(terrainData);
});
gui.add(params, 'rotationSpeedX', 0, 0.01).name('Rotation X').onChange(value => {
    rotationSpeedX = value;
});
gui.add(params, 'rotationSpeedY', 0, 0.01).name('Rotation Y').onChange(value => {
    rotationSpeedY = value;
});
gui.add(params, 'rotationSpeedZ', 0, 0.01).name('Rotation z').onChange(value => {
    rotationSpeedZ = value;
});
gui.add(params, 'fadeHeight').name('Fading').onChange(value => {
    fadeHeightEffect = value;
    createTerrain(terrainData);
});
gui.addColor(params, 'fadeColor1').name('Low Color').onChange(value => {
    fadeColor1 = value;
    createTerrain(terrainData);
});
gui.addColor(params, 'fadeColor2').name('Mid Low Color').onChange(value => {
    fadeColor2 = value;
    createTerrain(terrainData);
});
gui.addColor(params, 'fadeColor3').name('Mid Color').onChange(value => {
    fadeColor3 = value;
    createTerrain(terrainData);
});
gui.addColor(params, 'fadeColor4').name('Mid High Color').onChange(value => {
    fadeColor4 = value;
    createTerrain(terrainData);
});
gui.addColor(params, 'fadeColor5').name('High Color').onChange(value => {
    fadeColor5 = value;
    createTerrain(terrainData);
});
gui.add(params, 'moveSpeed', 10, 100).name('Move speed').onChange(value => {
    flyControls.movementSpeed = value;
});

function animate() {
    requestAnimationFrame(animate);
    pivot.rotation.x += rotationSpeedX;
    pivot.rotation.y += rotationSpeedY;
    pivot.rotation.z += rotationSpeedZ;
    flyControls.update(0.1);
    renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
});
