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

// Dune shit
var scene, camera, renderer, terrain, terrainGeometry, simplex, clock;
var terrainResolution = 100; // for geometry division

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

  updateTerrain(0);
}

function updateTerrain(time) {
  var vertices = terrainGeometry.attributes.position.array;
  var colors = terrainGeometry.attributes.color.array;

  for (let i = 0, j = 0; i < vertices.length; i += 3, j += 3) {
    var x = (j / 3) % (terrainResolution + 1);
    var z = Math.floor(j / 3 / (terrainResolution + 1));
    var y = simplex.noise(x * 0.1, z * 0.1 + time * 0.05) * 50;

    // for updating vertx height
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

  renderer.render(scene, camera);
}

init();
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
