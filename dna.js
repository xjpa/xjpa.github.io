var scene, camera, renderer;
var dnaSegments = [];
var maxSegments = 200;
var segmentHeight = 2;
// one full rotation every n segments
var helixCurve = 2 * Math.PI;

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
  camera.position.y = 0;
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

function addDNASegment(yPosition) {
  var radius = 5;
  var angleIncrement = helixCurve / maxSegments;
  var basePairDistance = 2;

  // adds two segments and a base pair connection for each step
  for (let i = 0; i < 2; i++) {
    var angle = yPosition * angleIncrement + Math.PI * i;
    var segmentGeometry = new THREE.CylinderGeometry(
      0.2,
      0.2,
      segmentHeight,
      32
    );
    var segmentMaterial = new THREE.MeshPhongMaterial({
      color: `hsl(${Math.random() * 360}, 100%, 75%)`,
    });
    var segment = new THREE.Mesh(segmentGeometry, segmentMaterial);

    segment.position.x = radius * Math.cos(angle);
    segment.position.y = yPosition;
    segment.position.z = radius * Math.sin(angle);
    segment.rotation.z = angle + Math.PI / 2;

    scene.add(segment);
    dnaSegments.push(segment);
  }

  // for connecting base pairs
  var connectionGeometry = new THREE.CylinderGeometry(
    0.1,
    0.1,
    basePairDistance,
    32
  );
  var connectionMaterial = new THREE.MeshPhongMaterial({
    color: `hsl(${Math.random() * 360}, 100%, 50%)`,
  });
  var connection = new THREE.Mesh(connectionGeometry, connectionMaterial);

  connection.position.y = yPosition;
  connection.rotation.x = Math.PI / 2;
  scene.add(connection);
  dnaSegments.push(connection);
}

function animate() {
  requestAnimationFrame(animate);

  // helix growth speed
  if (dnaSegments.length < maxSegments * 3) {
    // formula note: basically 3 objects added per segment (2 strands, 1 connection)
    addDNASegment((dnaSegments.length / 3) * segmentHeight);
  }

  // movement speed of helix
  dnaSegments.forEach((segment) => {
    segment.position.y -= 0.1;
  });

  // for removing dna segments that are out of view
  while (dnaSegments.length && dnaSegments[0].position.y < -50) {
    let oldSegment = dnaSegments.shift();
    scene.remove(oldSegment);
  }

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
