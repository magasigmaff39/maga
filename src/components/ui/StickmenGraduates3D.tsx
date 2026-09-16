import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface StickmenGraduates3DProps {
  onToss?: () => void;
  triggerToss?: boolean;
}

export const StickmenGraduates3D: React.FC<StickmenGraduates3DProps> = ({
  onToss,
  triggerToss,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isTossedRef = useRef(false);
  const tossCapsRef = useRef<() => void>(() => {});

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // --- Viewport & Scene ---
    const width = container.clientWidth || 560;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();

    // Perspective camera with clean front-and-center framing
    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 100);
    camera.position.set(0, 0.5, 6.4);
    camera.lookAt(0, 0.15, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.setClearColor(0x000000, 0); // Pure transparent, no frame
    container.appendChild(renderer.domElement);

    // --- Studio Lighting (Matching 3D Reference Image) ---
    // Soft ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.3);
    scene.add(ambientLight);

    // Main Key Light from front-high-right
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    keyLight.position.set(3.5, 6.0, 5.0);
    scene.add(keyLight);

    // Left fill light to reveal cloth drapes
    const fillLight = new THREE.DirectionalLight(0xe2e8f0, 1.2);
    fillLight.position.set(-4.0, 3.0, 3.5);
    scene.add(fillLight);

    // Soft cyan-blue rim light on the back-left
    const rimLight = new THREE.DirectionalLight(0x93c5fd, 1.6);
    rimLight.position.set(-4.0, 4.0, -4.0);
    scene.add(rimLight);

    // Ground bounce fill
    const bounceLight = new THREE.DirectionalLight(0x94a3b8, 0.5);
    bounceLight.position.set(0, -3.0, 3.0);
    scene.add(bounceLight);

    // --- Materials (Accurately Matching Uploaded Image) ---
    // 1. Mannequin Black Skin (Smooth matte black with soft specularity)
    const blackMannequinMat = new THREE.MeshStandardMaterial({
      color: 0x141517,
      roughness: 0.28,
      metalness: 0.18,
    });

    // 2. Medium Silver-Grey Gown Fabric (Matching reference photo cloth tone)
    const greyGownMat = new THREE.MeshStandardMaterial({
      color: 0x5a616e, // Distinct medium silver-grey tone from the reference
      roughness: 0.62,
      metalness: 0.06,
    });

    // Darker inside lining / seam shadow
    const gownSeamMat = new THREE.MeshStandardMaterial({
      color: 0x3a3e47,
      roughness: 0.75,
      metalness: 0.05,
    });

    // 3. Mortarboard Cap Fabric (Charcoal black, contrasting with the pure black head)
    const capFabricMat = new THREE.MeshStandardMaterial({
      color: 0x22242a,
      roughness: 0.42,
      metalness: 0.12,
    });

    // 4. Cap Tassel
    const tasselMat = new THREE.MeshStandardMaterial({
      color: 0x1e2025,
      roughness: 0.5,
      metalness: 0.1,
    });

    // 5. White Diploma Scroll Parchment
    const diplomaParchmentMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.25,
      metalness: 0.02,
    });

    // 6. Bright Crimson Red Ribbon
    const ribbonMat = new THREE.MeshStandardMaterial({
      color: 0xd92d20,
      roughness: 0.32,
      metalness: 0.15,
    });

    // --- Master Stickman Group ---
    const stickmanRoot = new THREE.Group();
    stickmanRoot.position.set(0, -1.35, 0);
    scene.add(stickmanRoot);

    // 1. Soft Contact Shadow on Floor
    const shadowGeo = new THREE.CircleGeometry(0.7, 32);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.32,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.set(0, 0.01, 0);
    stickmanRoot.add(shadowMesh);

    // 2. Legs & Rounded Shoes (Exact Reference Match)
    const legsGroup = new THREE.Group();

    const legGeo = new THREE.CylinderGeometry(0.058, 0.058, 0.78, 24);

    const leftLeg = new THREE.Mesh(legGeo, blackMannequinMat);
    leftLeg.position.set(-0.2, 0.42, 0);
    legsGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, blackMannequinMat);
    rightLeg.position.set(0.2, 0.42, 0);
    legsGroup.add(rightLeg);

    // Rounded black shoes / feet
    const shoeGeo = new THREE.SphereGeometry(0.12, 24, 16);
    shoeGeo.scale(1.0, 0.65, 1.8);

    const leftShoe = new THREE.Mesh(shoeGeo, blackMannequinMat);
    leftShoe.position.set(-0.2, 0.07, 0.06);
    legsGroup.add(leftShoe);

    const rightShoe = new THREE.Mesh(shoeGeo, blackMannequinMat);
    rightShoe.position.set(0.2, 0.07, 0.06);
    legsGroup.add(rightShoe);

    stickmanRoot.add(legsGroup);

    // 3. Medium Grey Academic Gown with Deep V-Neck and Soft Drapes
    const gownHeight = 1.48;
    const gownRadiusTop = 0.34;
    const gownRadiusBottom = 0.64;
    const gownSegmentsRad = 48;
    const gownSegmentsHeight = 32;

    const gownGeo = new THREE.CylinderGeometry(
      gownRadiusTop,
      gownRadiusBottom,
      gownHeight,
      gownSegmentsRad,
      gownSegmentsHeight,
      true
    );

    // Apply vertex displacement for vertical cloth draping and front seam
    const pos = gownGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const x = pos.getX(i);
      const z = pos.getZ(i);

      const angle = Math.atan2(z, x);
      const currentRad = Math.sqrt(x * x + z * z);

      // Deepen folds towards the hem
      const normY = (y + gownHeight / 2) / gownHeight; // 0 at bottom, 1 at top
      const foldDepth = (1 - normY * 0.7) * 0.035;
      const foldWave = Math.sin(angle * 12) * foldDepth;

      // Front center seam depression
      let seamFactor = 0;
      if (z > 0 && Math.abs(x) < 0.06) {
        seamFactor = -0.025 * (1 - Math.abs(x) / 0.06);
      }

      const newRad = currentRad + foldWave + seamFactor;
      pos.setX(i, Math.cos(angle) * newRad);
      pos.setZ(i, Math.sin(angle) * newRad);
    }
    gownGeo.computeVertexNormals();

    const gownMesh = new THREE.Mesh(gownGeo, greyGownMat);
    gownMesh.position.set(0, 1.46, 0);
    stickmanRoot.add(gownMesh);

    // Front Center Seam Line down the front
    const centerSeamGeo = new THREE.BoxGeometry(0.018, gownHeight * 0.95, 0.02);
    const centerSeam = new THREE.Mesh(centerSeamGeo, gownSeamMat);
    centerSeam.position.set(0, 1.44, 0.42);
    stickmanRoot.add(centerSeam);

    // Deep V-Neck Collar cutout accent (showing black chest inside)
    const vNeckBandGeo = new THREE.TorusGeometry(0.24, 0.035, 16, 32, Math.PI);
    const vNeckMesh = new THREE.Mesh(vNeckBandGeo, greyGownMat);
    vNeckMesh.rotation.x = Math.PI / 2.2;
    vNeckMesh.position.set(0, 2.16, 0.05);
    stickmanRoot.add(vNeckMesh);

    // 4. Mannequin Neck & Spherical Head
    const neckGeo = new THREE.CylinderGeometry(0.082, 0.082, 0.36, 24);
    const neck = new THREE.Mesh(neckGeo, blackMannequinMat);
    neck.position.set(0, 2.24, 0);
    stickmanRoot.add(neck);

    // Smooth black sphere head (exact match with image)
    const headGeo = new THREE.SphereGeometry(0.44, 64, 48);
    const head = new THREE.Mesh(headGeo, blackMannequinMat);
    head.position.set(0, 2.62, 0);
    stickmanRoot.add(head);

    // 5. Arms & Ball Hands (Black Spheres extending from Wide Bell Sleeves)
    // Left Arm Group
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-0.36, 2.06, 0);

    // Wide draped bell sleeve in medium grey
    const sleeveGeo = new THREE.CylinderGeometry(0.13, 0.28, 0.88, 24);
    const leftSleeve = new THREE.Mesh(sleeveGeo, greyGownMat);
    leftSleeve.position.set(-0.16, -0.38, 0);
    leftSleeve.rotation.z = 0.32;
    leftArmGroup.add(leftSleeve);

    // Black stick wrist extending out of sleeve
    const wristStickGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.65, 16);
    const leftWrist = new THREE.Mesh(wristStickGeo, blackMannequinMat);
    leftWrist.position.set(-0.25, -0.68, 0);
    leftWrist.rotation.z = 0.32;
    leftArmGroup.add(leftWrist);

    // Distinct black sphere ball hand (as seen in image)
    const ballHandGeo = new THREE.SphereGeometry(0.1, 24, 24);
    const leftHand = new THREE.Mesh(ballHandGeo, blackMannequinMat);
    leftHand.position.set(-0.38, -0.98, 0);
    leftArmGroup.add(leftHand);

    stickmanRoot.add(leftArmGroup);

    // Right Arm Group (holding diploma)
    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0.36, 2.06, 0);

    const rightSleeve = new THREE.Mesh(sleeveGeo, greyGownMat);
    rightSleeve.position.set(0.16, -0.38, 0);
    rightSleeve.rotation.z = -0.32;
    rightArmGroup.add(rightSleeve);

    const rightWrist = new THREE.Mesh(wristStickGeo, blackMannequinMat);
    rightWrist.position.set(0.25, -0.68, 0);
    rightWrist.rotation.z = -0.32;
    rightArmGroup.add(rightWrist);

    const rightHand = new THREE.Mesh(ballHandGeo, blackMannequinMat);
    rightHand.position.set(0.38, -0.98, 0);
    rightArmGroup.add(rightHand);

    // 6. White Diploma Scroll with Red Ribbon (Exact Reference Match)
    const diplomaGroup = new THREE.Group();
    diplomaGroup.position.set(0.38, -0.98, 0.14);
    diplomaGroup.rotation.z = -0.65;
    diplomaGroup.rotation.x = 0.45;

    // White paper cylinder roll
    const dipScrollGeo = new THREE.CylinderGeometry(0.068, 0.068, 0.76, 32);
    const dipScroll = new THREE.Mesh(dipScrollGeo, diplomaParchmentMat);
    diplomaGroup.add(dipScroll);

    // Red ribbon band wrapped around center
    const dipRibbonGeo = new THREE.CylinderGeometry(0.073, 0.073, 0.16, 32);
    const dipRibbon = new THREE.Mesh(dipRibbonGeo, ribbonMat);
    diplomaGroup.add(dipRibbon);

    // Red ribbon tails hanging down with V-cut styling
    const ribTailGeo = new THREE.BoxGeometry(0.03, 0.22, 0.09);
    const ribTail1 = new THREE.Mesh(ribTailGeo, ribbonMat);
    ribTail1.position.set(0.05, -0.12, 0.06);
    ribTail1.rotation.z = -0.35;
    diplomaGroup.add(ribTail1);

    const ribTail2 = new THREE.Mesh(ribTailGeo, ribbonMat);
    ribTail2.position.set(-0.04, -0.13, 0.06);
    ribTail2.rotation.z = 0.35;
    diplomaGroup.add(ribTail2);

    rightArmGroup.add(diplomaGroup);
    stickmanRoot.add(rightArmGroup);

    // 7. Academic Mortarboard Cap with Arched Pointed Front Headband
    const capGroup = new THREE.Group();
    capGroup.position.set(0, 2.96, 0);

    // Skullcap with pointed front headband (V-peak in center of brow, exactly as in image)
    const headbandGeo = new THREE.CylinderGeometry(0.42, 0.45, 0.24, 48, 4, true);
    const bandPos = headbandGeo.attributes.position;
    for (let i = 0; i < bandPos.count; i++) {
      const x = bandPos.getX(i);
      const y = bandPos.getY(i);
      const z = bandPos.getZ(i);

      // In front (z > 0), pull the bottom edge down into a pointed peak in the center
      if (y < 0 && z > 0) {
        const centerFactor = Math.max(0, 1 - Math.abs(x) * 2.8);
        bandPos.setY(i, y - centerFactor * 0.1);
      }
    }
    headbandGeo.computeVertexNormals();

    const headbandMesh = new THREE.Mesh(headbandGeo, capFabricMat);
    headbandMesh.position.set(0, -0.06, 0);
    capGroup.add(headbandMesh);

    // Skull cap inner dome
    const skullDomeGeo = new THREE.SphereGeometry(0.43, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const skullDome = new THREE.Mesh(skullDomeGeo, capFabricMat);
    skullDome.position.set(0, -0.02, 0);
    capGroup.add(skullDome);

    // Square Mortarboard Diamond Top Board with Fabric Rim
    const boardGeo = new THREE.BoxGeometry(1.36, 0.048, 1.36);
    const boardMesh = new THREE.Mesh(boardGeo, capFabricMat);
    boardMesh.position.set(0, 0.1, 0);
    boardMesh.rotation.y = Math.PI / 4; // Diamond rotation
    capGroup.add(boardMesh);

    // Center Button
    const buttonGeo = new THREE.SphereGeometry(0.06, 24, 16);
    buttonGeo.scale(1, 0.5, 1);
    const buttonMesh = new THREE.Mesh(buttonGeo, capFabricMat);
    buttonMesh.position.set(0, 0.13, 0);
    capGroup.add(buttonMesh);

    // Tassel Assembly (Dangling over the right edge)
    const tasselGroup = new THREE.Group();

    // Cord from center to edge
    const cordCurve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(0, 0.13, 0),
      new THREE.Vector3(0.24, 0.13, 0.16),
      new THREE.Vector3(0.44, 0.08, 0.28),
      new THREE.Vector3(0.5, 0.02, 0.34)
    );
    const cordGeo = new THREE.TubeGeometry(cordCurve, 20, 0.016, 8, false);
    const cordMesh = new THREE.Mesh(cordGeo, tasselMat);
    tasselGroup.add(cordMesh);

    // Ferrule ring
    const ferruleGeo = new THREE.CylinderGeometry(0.034, 0.034, 0.06, 16);
    const ferrule = new THREE.Mesh(ferruleGeo, tasselMat);
    ferrule.position.set(0.5, -0.04, 0.34);
    tasselGroup.add(ferrule);

    // Hanging Tassel Brush (threads)
    const brushGeo = new THREE.CylinderGeometry(0.035, 0.065, 0.3, 24);
    const brush = new THREE.Mesh(brushGeo, tasselMat);
    brush.position.set(0.5, -0.21, 0.34);
    tasselGroup.add(brush);

    capGroup.add(tasselGroup);
    stickmanRoot.add(capGroup);

    // --- Cap Physics & Toss State ---
    const initialCapPos = capGroup.position.clone();
    const initialCapRot = capGroup.rotation.clone();

    const capVel = new THREE.Vector3();
    const capRotVel = new THREE.Vector3();
    let isCapFlying = false;

    // --- Execute 3D Cap Toss ---
    const executeToss = () => {
      isTossedRef.current = true;
      isCapFlying = true;

      // High vertical launch impulse
      capVel.set(
        (Math.random() - 0.5) * 0.3,
        7.0, // High explosive toss
        0.25
      );

      // Dynamic 3D rotation (pitch, yaw, roll)
      capRotVel.set(
        Math.PI * 5.8,
        Math.PI * 7.2,
        Math.PI * 4.4
      );

      if (onToss) {
        onToss();
      }

      // Smooth reset after flight duration
      setTimeout(() => {
        isTossedRef.current = false;
      }, 2600);
    };

    tossCapsRef.current = executeToss;

    // --- Interactive Mouse Parallax (3D Orbit Response) ---
    let targetRotY = 0;
    let targetRotX = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      targetRotY = x * 0.65; // Horizontal tilt
      targetRotX = y * 0.35; // Vertical tilt
    };

    window.addEventListener('mousemove', handleMouseMove);

    // --- Render Loop ---
    let animId: number;
    let lastTime = performance.now();

    const animate = (time: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      // Smooth character rotation tracking mouse for 3D inspection
      stickmanRoot.rotation.y += (targetRotY - stickmanRoot.rotation.y) * 0.08;
      stickmanRoot.rotation.x += (targetRotX - stickmanRoot.rotation.x) * 0.08;

      const t = time * 0.0025;

      // Stickman Body Animation
      if (isTossedRef.current) {
        // Celebratory jump & arms thrust into the air \o/
        stickmanRoot.position.y += (-1.18 - stickmanRoot.position.y) * 0.14;

        // Arms thrown high in triumph
        leftArmGroup.rotation.z += (2.55 - leftArmGroup.rotation.z) * 0.2;
        leftArmGroup.rotation.x += (0.55 - leftArmGroup.rotation.x) * 0.2;

        rightArmGroup.rotation.z += (-2.55 - rightArmGroup.rotation.z) * 0.2;
        rightArmGroup.rotation.x += (0.55 - rightArmGroup.rotation.x) * 0.2;

        // Diploma pumped high above head
        diplomaGroup.rotation.z += (1.25 - diplomaGroup.rotation.z) * 0.2;
        diplomaGroup.rotation.x += (0.2 - diplomaGroup.rotation.x) * 0.2;
      } else {
        // Organic idle breathing & gentle sway
        const idleY = -1.35 + Math.sin(t) * 0.022;
        stickmanRoot.position.y += (idleY - stickmanRoot.position.y) * 0.08;

        // Relaxed proud posture
        const idleArmZ = 0.12 + Math.sin(t) * 0.035;
        leftArmGroup.rotation.z += (idleArmZ - leftArmGroup.rotation.z) * 0.08;
        leftArmGroup.rotation.x += (0 - leftArmGroup.rotation.x) * 0.08;

        rightArmGroup.rotation.z += (-idleArmZ - rightArmGroup.rotation.z) * 0.08;
        rightArmGroup.rotation.x += (0 - rightArmGroup.rotation.x) * 0.08;

        diplomaGroup.rotation.z += (-0.65 - diplomaGroup.rotation.z) * 0.08;
        diplomaGroup.rotation.x += (0.45 - diplomaGroup.rotation.x) * 0.08;
      }

      // Cap Physics (3D Upward Shoot, Arc, and Smooth Catch/Landing)
      if (isCapFlying) {
        // Gravity deceleration
        capVel.y -= 8.6 * dt;

        // Position update
        capGroup.position.x += capVel.x * dt;
        capGroup.position.y += capVel.y * dt;
        capGroup.position.z += capVel.z * dt;

        // 3D rotations
        capGroup.rotation.x += capRotVel.x * dt;
        capGroup.rotation.y += capRotVel.y * dt;
        capGroup.rotation.z += capRotVel.z * dt;

        // Tassel swing lag
        tasselGroup.rotation.z = Math.sin(time * 0.012) * 0.45;

        // Landing condition back onto head
        if (capVel.y < 0 && capGroup.position.y <= initialCapPos.y) {
          isCapFlying = false;
          capGroup.position.copy(initialCapPos);
          capGroup.rotation.copy(initialCapRot);
          tasselGroup.rotation.set(0, 0, 0);
        }
      } else {
        // Firmly resting on head
        capGroup.position.lerp(initialCapPos, 0.15);
        capGroup.rotation.x += (initialCapRot.x - capGroup.rotation.x) * 0.15;
        capGroup.rotation.y += (initialCapRot.y - capGroup.rotation.y) * 0.15;
        capGroup.rotation.z += (initialCapRot.z - capGroup.rotation.z) * 0.15;
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    // --- Resize Handler ---
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      scene.clear();
    };
  }, [onToss]);

  // Handle external trigger from "Построить маршрут"
  useEffect(() => {
    if (triggerToss) {
      tossCapsRef.current();
    }
  }, [triggerToss]);

  const handleClick = () => {
    tossCapsRef.current();
  };

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      className="w-full h-[400px] sm:h-[480px] lg:h-[530px] relative cursor-pointer select-none overflow-visible"
      style={{ touchAction: 'none' }}
      title="Нажмите, чтобы подбросить колпак в 3D"
    />
  );
};
