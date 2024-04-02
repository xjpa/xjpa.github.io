var scene, camera, renderer;
var dnaSegments = [];
var maxSegments = 100;

init();
animate();

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 50;
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0xffffff, 0);
  document
    .getElementById('threejs-background')
    .appendChild(renderer.domElement);

  var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  var directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(0, 1, 0);
  scene.add(directionalLight);
}

function addDNASegment() {
  var geometry = new THREE.CylinderGeometry(0.5, 0.5, 5, 32);

  // i'm using HSL for controlling lightness, 75% is already light
  var color = new THREE.Color(`hsl(${Math.random() * 360}, 100%, 75%)`);

  var material = new THREE.MeshPhongMaterial({ color: color });
  var segment = new THREE.Mesh(geometry, material);

  var angle = dnaSegments.length * 0.2;
  var radius = 10;

  segment.position.x = radius * Math.cos(angle);
  //spacing
  segment.position.y = dnaSegments.length * 0.5 - 50;
  segment.position.z = radius * Math.sin(angle);
  // curve alginging
  segment.rotation.z = angle + Math.PI / 2;

  dnaSegments.push(segment);
  scene.add(segment);

  if (dnaSegments.length > maxSegments) {
    let oldSegment = dnaSegments.shift();
    scene.remove(oldSegment);
  }
}

function animate() {
  requestAnimationFrame(animate);

  //speed of adding segments
  if (Math.random() < 0.3) {
    addDNASegment();
  }

  dnaSegments.forEach((segment, index) => {
    //upward movement speed
    segment.position.y += 0.1;
    // TODO OR MAYBE?: add additional rotation or other effects
  });

  renderer.render(scene, camera);
}

window.addEventListener(
  'resize',
  () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  },
  false
);
