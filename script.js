var music = null;
var isPlaying = false; // for pausing, to keep track of playback state

function playMusic() {
  if (music === null || music.paused) {
    if (music === null) {
      music = new Audio('atreides.mp3');
      music.addEventListener('ended', function () {
        isPlaying = false;
      });
    }
    music.play();
    isPlaying = true;
  } else {
    music.pause();
    isPlaying = false;
  }
}

function stopMusic() {
  if (music !== null) {
    music.pause();
    music.currentTime = 0;
    isPlaying = false;
  }
}

// dune shit
var scene, camera, renderer, terrain, terrainGeometry, simplex, clock;
var terrainResolution = 100; // for geometry division

// camera
var isMouseDown = false;
var mouseX = 0;
var targetRotationX = 0;
var targetRotationOnMouseDownX = 0;
var mouseXOnMouseDown = 0;

// atmosphere, where i put some sand particles here
var skybox;
var sandParticles;

function init() {
  simplex = new SimplexNoise();
  clock = new THREE.Clock();

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    1,
    2000
  );
  camera.position.set(0, 100, 300);
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document
    .getElementById('threejs-background')
    .appendChild(renderer.domElement);

  var ambientLight = new THREE.AmbientLight(0x404040);
  scene.add(ambientLight);

  var directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
  directionalLight.position.set(0, 1, 0);
  scene.add(directionalLight);

  terrainGeometry = new THREE.PlaneGeometry(
    1000,
    1000,
    terrainResolution,
    terrainResolution
  );
  terrainGeometry.rotateX(-Math.PI / 2);

  // vertex colors
  var colors = [];
  for (let i = 0; i < terrainGeometry.attributes.position.count; i++) {
    colors.push(1, 1, 1); // white
  }
  terrainGeometry.setAttribute(
    'color',
    new THREE.Float32BufferAttribute(colors, 3)
  );

  var material = new THREE.MeshLambertMaterial({
    vertexColors: THREE.VertexColors,
  });
  terrain = new THREE.Mesh(terrainGeometry, material);
  scene.add(terrain);

  // fog-like
  scene.fog = new THREE.FogExp2(0xedce7e, 0.0007);

  // skybox
  var skyboxGeometry = new THREE.BoxGeometry(10000, 10000, 10000);
  var skyboxMaterials = [
    new THREE.MeshBasicMaterial({
      map: new THREE.TextureLoader().load('right.jpg'),
      side: THREE.BackSide,
    }),
    new THREE.MeshBasicMaterial({
      map: new THREE.TextureLoader().load('left.jpg'),
      side: THREE.BackSide,
    }),
    new THREE.MeshBasicMaterial({
      map: new THREE.TextureLoader().load('top.jpg'),
      side: THREE.BackSide,
    }),
    new THREE.MeshBasicMaterial({
      map: new THREE.TextureLoader().load('bottom.jpg'),
      side: THREE.BackSide,
    }),
    new THREE.MeshBasicMaterial({
      map: new THREE.TextureLoader().load('front.jpg'),
      side: THREE.BackSide,
    }),
    new THREE.MeshBasicMaterial({
      map: new THREE.TextureLoader().load('back.jpg'),
      side: THREE.BackSide,
    }),
  ];
  skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterials);
  scene.add(skybox);

  // particle system for wind-blown sand, or at least i think it looks like it
  sandParticles = createSandParticles();
  scene.add(sandParticles);

  updateTerrain(0);

  // mouse
  document.addEventListener('mousedown', onDocumentMouseDown, false);
  document.addEventListener('mousemove', onDocumentMouseMove, false);
  document.addEventListener('mouseup', onDocumentMouseUp, false);

  // touch
  document.addEventListener('touchstart', onDocumentTouchStart, false);
  document.addEventListener('touchmove', onDocumentTouchMove, false);
  document.addEventListener('touchend', onDocumentTouchEnd, false);
}

function createSandParticles() {
  var particleGeometry = new THREE.BufferGeometry();
  var particleCount = 10000;
  var particlePositions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount * 3; i += 3) {
    particlePositions[i] = Math.random() * 1000 - 500; // x
    particlePositions[i + 1] = Math.random() * 100; // y (keep it low to the ground)
    particlePositions[i + 2] = Math.random() * 1000 - 500; // z
  }

  particleGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(particlePositions, 3)
  );

  var particleMaterial = new THREE.PointsMaterial({
    color: 0xd4a76a,
    size: 1,
    blending: THREE.AdditiveBlending,
    transparent: true,
    opacity: 0.5,
  });

  return new THREE.Points(particleGeometry, particleMaterial);
}

function updateTerrain(time) {
  var vertices = terrainGeometry.attributes.position.array;
  var colors = terrainGeometry.attributes.color.array;

  for (let i = 0, j = 0; i < vertices.length; i += 3, j += 3) {
    var x = (j / 3) % (terrainResolution + 1);
    var z = Math.floor(j / 3 / (terrainResolution + 1));
    var y = simplex.noise(x * 0.1, z * 0.1 + time * 0.05) * 50;

    // for updating vertex height
    vertices[i + 1] = y;

    // for determining color based on the height (y)
    var color = new THREE.Color();

    // dune colors babbyy
    if (y < 20) {
      color.setRGB(0.8, 0.7, 0.5); // dark
    } else if (y < 40) {
      color.setRGB(0.9, 0.8, 0.6); // light
    } else {
      color.setRGB(1, 1, 0.8); // bright yellow
    }

    // for assigning colors to current vertex
    colors[j] = color.r;
    colors[j + 1] = color.g;
    colors[j + 2] = color.b;
  }

  terrainGeometry.attributes.position.needsUpdate = true;
  terrainGeometry.attributes.color.needsUpdate = true;
  terrainGeometry.computeVertexNormals();
}

function animate() {
  requestAnimationFrame(animate);

  var elapsedTime = clock.getElapsedTime();

  updateTerrain(elapsedTime);

  // update camera rotation (only horizontal for now)
  camera.position.x = 300 * Math.sin(targetRotationX);
  camera.position.z = 300 * Math.cos(targetRotationX);
  camera.lookAt(scene.position);

  // animate wind-blown sand particles
  var positions = sandParticles.geometry.attributes.position.array;
  for (let i = 0; i < positions.length; i += 3) {
    // move sand particles from left to right
    positions[i] += 0.5 + Math.random() * 0.5;

    // for if particle moves out of view, reset to left
    if (positions[i] > 500) {
      positions[i] = -500;
      positions[i + 1] = Math.random() * 100; // randomize height
      positions[i + 2] = Math.random() * 1000 - 500; // randomize depth
    }
  }
  sandParticles.geometry.attributes.position.needsUpdate = true;

  // slowly rotate skybox for some illusion :)
  skybox.rotation.y += 0.0001;

  renderer.render(scene, camera);
}

function onDocumentMouseDown(event) {
  event.preventDefault();
  isMouseDown = true;
  mouseXOnMouseDown = event.clientX - window.innerWidth / 2;
  targetRotationOnMouseDownX = targetRotationX;
}

function onDocumentMouseMove(event) {
  if (isMouseDown) {
    mouseX = event.clientX - window.innerWidth / 2;
    targetRotationX =
      targetRotationOnMouseDownX + (mouseX - mouseXOnMouseDown) * 0.02;
  }
}

function onDocumentMouseUp(event) {
  isMouseDown = false;
}

function onDocumentTouchStart(event) {
  if (event.touches.length == 1) {
    event.preventDefault();
    mouseXOnMouseDown = event.touches[0].pageX - window.innerWidth / 2;
    targetRotationOnMouseDownX = targetRotationX;
  }
}

function onDocumentTouchMove(event) {
  if (event.touches.length == 1) {
    event.preventDefault();
    mouseX = event.touches[0].pageX - window.innerWidth / 2;
    targetRotationX =
      targetRotationOnMouseDownX + (mouseX - mouseXOnMouseDown) * 0.02;
  }
}

function onDocumentTouchEnd(event) {
  isMouseDown = false;
}

init();
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
