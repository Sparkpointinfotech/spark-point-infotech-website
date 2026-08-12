import * as THREE from 'three';

// ==========================================
// 2. ROUNDED CORNER SHAPE GENERATOR
// ==========================================
function createRoundedCornerShape(width, height, radius) {
  const shape = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;

  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);

  return shape;
}

// Dynamic 2K Canvas Texture for Screen Display
function createDynamicScreenTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 2048;
  const ctx = canvas.getContext('2d');

  function renderTexture() {
    // Background
    ctx.fillStyle = '#06030d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // iOS Status Bar
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 36px Inter, sans-serif';
    ctx.fillText('9:41', 60, 65);

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.strokeRect(900, 42, 50, 26);
    ctx.fillRect(905, 47, 36, 16);
    ctx.fillRect(952, 50, 4, 10);

    // Header Gradient
    const grad = ctx.createLinearGradient(0, 100, 0, 320);
    grad.addColorStop(0, 'rgba(139, 92, 246, 0.4)');
    grad.addColorStop(1, 'rgba(10, 6, 20, 0.9)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 100, canvas.width, 220);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 52px Inter, sans-serif';
    ctx.fillText('Spark Point Infotech', 60, 185);

    ctx.fillStyle = '#A855F7';
    ctx.font = 'bold 26px monospace';
    ctx.fillText('SOFTWARE DEVELOPMENT COMPANY', 60, 235);

    ctx.fillStyle = '#9CA3AF';
    ctx.font = '26px Inter, sans-serif';
    ctx.fillText('India • Germany • Netherlands', 60, 280);

    // Hero Card
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.35)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(40, 340, 944, 380, 28);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#8B5CF6';
    ctx.font = 'bold 24px monospace';
    ctx.fillText('• WRITTEN SPECIFICATION LOCK', 80, 400);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 42px Inter, sans-serif';
    ctx.fillText('Software built to written spec', 80, 465);

    ctx.fillStyle = '#EAEAEA';
    ctx.font = '30px Inter, sans-serif';
    ctx.fillText('Every project starts with a written scope,', 80, 525);
    ctx.fillText('a fixed price and a dated schedule.', 80, 570);

    // Badges
    ctx.fillStyle = 'rgba(139, 92, 246, 0.15)';
    ctx.beginPath();
    ctx.roundRect(80, 615, 380, 65, 16);
    ctx.fill();
    ctx.fillStyle = '#A855F7';
    ctx.font = 'bold 24px monospace';
    ctx.fillText('FIXED GUARANTEE', 110, 656);

    ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
    ctx.beginPath();
    ctx.roundRect(480, 615, 460, 65, 16);
    ctx.fill();
    ctx.fillStyle = '#10B981';
    ctx.font = 'bold 24px monospace';
    ctx.fillText('• SUB-2s LOAD TIME', 510, 656);

    // Services List
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.beginPath();
    ctx.roundRect(40, 750, 944, 600, 28);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 36px Inter, sans-serif';
    ctx.fillText('Five Core Services', 80, 815);

    const services = [
      { name: 'Website development', detail: 'Sub-2s load time, SEO & CMS' },
      { name: 'Custom web applications', detail: 'Portals, dashboards & role permissions' },
      { name: 'Mobile app development', detail: 'iOS & Android single codebase' },
      { name: 'UI/UX design', detail: 'Figma component design tokens' },
      { name: 'Maintenance & support', detail: 'Security patching & monitoring' }
    ];

    services.forEach((s, idx) => {
      const y = 875 + idx * 95;
      ctx.fillStyle = idx % 2 === 0 ? '#8B5CF6' : '#A855F7';
      ctx.beginPath();
      ctx.arc(95, y + 12, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 30px Inter, sans-serif';
      ctx.fillText(s.name, 130, y + 20);

      ctx.fillStyle = '#9CA3AF';
      ctx.font = '24px Inter, sans-serif';
      ctx.fillText(s.detail, 130, y + 52);
    });

    // Console Log
    ctx.fillStyle = 'rgba(10, 6, 20, 0.85)';
    ctx.beginPath();
    ctx.roundRect(40, 1380, 944, 560, 28);
    ctx.fill();
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.2)';
    ctx.stroke();

    ctx.fillStyle = '#A855F7';
    ctx.font = '26px monospace';
    ctx.fillText('const project = await SparkPoint.start({', 80, 1440);
    ctx.fillText('  scope: "Written Specification",', 80, 1490);
    ctx.fillText('  pricing: "Fixed Guarantee",', 80, 1540);
    ctx.fillText('  schedule: "Dated Milestone Delivery"', 80, 1590);
    ctx.fillText('});', 80, 1640);

    ctx.fillStyle = '#10B981';
    ctx.font = 'bold 28px monospace';
    ctx.fillText('> BUILD STATUS: 100% VERIFIED', 80, 1770);
    ctx.fillText('> REPOSITORY TRANSFER: DAY ONE READY', 80, 1820);

    // iOS Home Bar
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(372, 2010, 280, 10, 5);
    ctx.fill();
  }

  renderTexture();
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return { texture, canvas, renderTexture };
}

// Authentic iPhone Mesh with CURVED SCREEN MESH
export function createAuthenticIPhoneMesh() {
  const phoneGroup = new THREE.Group();
  phoneGroup.style = { willChange: 'transform' };

  const width = 3.2;
  const height = 6.6;
  const depth = 0.32;
  const radius = 0.55;

  // 1. Titanium Frame Body
  const bodyShape = createRoundedCornerShape(width, height, radius);
  const extrudeSettings = {
    steps: 1,
    depth: depth,
    bevelEnabled: true,
    bevelThickness: 0.07,
    bevelSize: 0.07,
    bevelSegments: 5
  };
  const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, extrudeSettings);
  bodyGeo.center();

  const titaniumMat = new THREE.MeshStandardMaterial({
    color: 0x1f1533,
    metalness: 0.95,
    roughness: 0.18,
    envMapIntensity: 2.0
  });

  const bodyMesh = new THREE.Mesh(bodyGeo, titaniumMat);
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  phoneGroup.add(bodyMesh);

  // 2. Antenna Bands
  const bandMat = new THREE.MeshBasicMaterial({ color: 0x4a3b6e });
  const bandGeo = new THREE.BoxGeometry(width + 0.16, 0.03, depth + 0.16);

  const bandTop = new THREE.Mesh(bandGeo, bandMat);
  bandTop.position.set(0, 2.2, 0);
  phoneGroup.add(bandTop);

  const bandBottom = new THREE.Mesh(bandGeo, bandMat);
  bandBottom.position.set(0, -2.2, 0);
  phoneGroup.add(bandBottom);

  // 3. Front Display Screen & Bezel with CURVED EDGES
  const screenBezelShape = createRoundedCornerShape(width - 0.08, height - 0.08, radius - 0.04);
  const screenBezelGeo = new THREE.ShapeGeometry(screenBezelShape);
  const screenBezelMat = new THREE.MeshStandardMaterial({ color: 0x05030a, roughness: 0.1 });
  const screenBezelMesh = new THREE.Mesh(screenBezelGeo, screenBezelMat);
  screenBezelMesh.position.set(0, 0, depth / 2 + 0.072);
  phoneGroup.add(screenBezelMesh);

  // Dynamic Screen Mesh with Exact Rounded Curved Corners
  const { texture: screenTexture } = createDynamicScreenTexture();
  const screenShape = createRoundedCornerShape(width - 0.22, height - 0.22, radius - 0.11);
  const screenGeo = new THREE.ShapeGeometry(screenShape);

  const pos = screenGeo.attributes.position;
  const uvs = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const ux = (pos.getX(i) + (width - 0.22) / 2) / (width - 0.22);
    const uy = (pos.getY(i) + (height - 0.22) / 2) / (height - 0.22);
    uvs[i * 2] = ux;
    uvs[i * 2 + 1] = uy;
  }
  screenGeo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

  const screenMat = new THREE.MeshBasicMaterial({ map: screenTexture });
  const screenMesh = new THREE.Mesh(screenGeo, screenMat);
  screenMesh.position.set(0, 0, depth / 2 + 0.075);
  phoneGroup.add(screenMesh);

  // 4. Dynamic Island Notch
  const islandShape = createRoundedCornerShape(0.75, 0.22, 0.11);
  const islandGeo = new THREE.ShapeGeometry(islandShape);
  const islandMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const islandMesh = new THREE.Mesh(islandGeo, islandMat);
  islandMesh.position.set(0, 2.85, depth / 2 + 0.078);
  phoneGroup.add(islandMesh);

  const cameraDotGeo = new THREE.CircleGeometry(0.04, 16);
  const cameraDotMat = new THREE.MeshBasicMaterial({ color: 0x111122 });
  const cameraDot = new THREE.Mesh(cameraDotGeo, cameraDotMat);
  cameraDot.position.set(-0.2, 2.85, depth / 2 + 0.08);
  phoneGroup.add(cameraDot);

  // 5. Rear Camera Bump
  const bumpWidth = 1.35;
  const bumpHeight = 1.35;
  const bumpShape = createRoundedCornerShape(bumpWidth, bumpHeight, 0.3);
  const bumpExtrude = {
    steps: 1,
    depth: 0.12,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.03,
    bevelSegments: 3
  };
  const bumpGeo = new THREE.ExtrudeGeometry(bumpShape, bumpExtrude);
  const bumpMat = new THREE.MeshStandardMaterial({
    color: 0x1d1433,
    metalness: 0.8,
    roughness: 0.25
  });
  const bumpMesh = new THREE.Mesh(bumpGeo, bumpMat);
  bumpMesh.position.set(-0.75, 2.05, -depth / 2 - 0.08);
  phoneGroup.add(bumpMesh);

  function createCameraLens(x, y) {
    const lensGroup = new THREE.Group();

    const ringGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.08, 32);
    const ringMat = new THREE.MeshStandardMaterial({ color: 0x8B5CF6, metalness: 0.95, roughness: 0.1 });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    lensGroup.add(ringMesh);

    const glassGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.085, 32);
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x050510, roughness: 0.05, metalness: 0.2 });
    const glassMesh = new THREE.Mesh(glassGeo, glassMat);
    glassMesh.rotation.x = Math.PI / 2;
    lensGroup.add(glassMesh);

    const optGeo = new THREE.CircleGeometry(0.12, 16);
    const optMat = new THREE.MeshBasicMaterial({ color: 0xA855F7, transparent: true, opacity: 0.6 });
    const optMesh = new THREE.Mesh(optGeo, optMat);
    optMesh.position.set(0, 0, -0.045);
    optMesh.rotation.y = Math.PI;
    lensGroup.add(optMesh);

    lensGroup.position.set(x, y, -depth / 2 - 0.16);
    return lensGroup;
  }

  phoneGroup.add(createCameraLens(-1.05, 2.35));
  phoneGroup.add(createCameraLens(-1.05, 1.75));
  phoneGroup.add(createCameraLens(-0.45, 2.05));

  const flashGeo = new THREE.CircleGeometry(0.08, 16);
  const flashMat = new THREE.MeshBasicMaterial({ color: 0xfff0cc });
  const flashMesh = new THREE.Mesh(flashGeo, flashMat);
  flashMesh.position.set(-0.45, 2.42, -depth / 2 - 0.145);
  flashMesh.rotation.y = Math.PI;
  phoneGroup.add(flashMesh);

  const lidarGeo = new THREE.CircleGeometry(0.06, 16);
  const lidarMat = new THREE.MeshBasicMaterial({ color: 0x111118 });
  const lidarMesh = new THREE.Mesh(lidarGeo, lidarMat);
  lidarMesh.position.set(-0.45, 1.68, -depth / 2 - 0.145);
  lidarMesh.rotation.y = Math.PI;
  phoneGroup.add(lidarMesh);

  // 6. Buttons
  const buttonMat = new THREE.MeshStandardMaterial({ color: 0x4a3b6e, metalness: 0.9, roughness: 0.2 });

  const volUpGeo = new THREE.BoxGeometry(0.06, 0.45, 0.08);
  const volUp = new THREE.Mesh(volUpGeo, buttonMat);
  volUp.position.set(-width / 2 - 0.05, 1.2, 0);
  phoneGroup.add(volUp);

  const volDown = new THREE.Mesh(volUpGeo, buttonMat);
  volDown.position.set(-width / 2 - 0.05, 0.6, 0);
  phoneGroup.add(volDown);

  const actionGeo = new THREE.BoxGeometry(0.06, 0.25, 0.08);
  const actionBtn = new THREE.Mesh(actionGeo, buttonMat);
  actionBtn.position.set(-width / 2 - 0.05, 1.7, 0);
  phoneGroup.add(actionBtn);

  const powerGeo = new THREE.BoxGeometry(0.06, 0.7, 0.08);
  const powerBtn = new THREE.Mesh(powerGeo, buttonMat);
  powerBtn.position.set(width / 2 + 0.05, 1.0, 0);
  phoneGroup.add(powerBtn);

  // Outer Glow Sprite
  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = 128;
  glowCanvas.height = 128;
  const gCtx = glowCanvas.getContext('2d');
  const radGrad = gCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
  radGrad.addColorStop(0, 'rgba(168, 85, 247, 0.7)');
  radGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');
  gCtx.fillStyle = radGrad;
  gCtx.fillRect(0, 0, 128, 128);

  const glowTex = new THREE.CanvasTexture(glowCanvas);
  const spriteMat = new THREE.SpriteMaterial({
    map: glowTex,
    color: 0x8B5CF6,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(7.5, 10.5, 1);
  sprite.position.set(0, 0, -0.2);
  phoneGroup.add(sprite);

  // Reduce size of phone slightly so it fits hero comfortably
  phoneGroup.scale.set(0.72, 0.72, 0.72);

  return phoneGroup;
}
