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

    // --- Viewport Setup ---
    const width = container.clientWidth || 560;
    const height = container.clientHeight || 480;

    const scene = new THREE.Scene();

    // Cinematic perspective camera, low-angle hero framing
    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 100);
    camera.position.set(0, 0.7, 6.2);
    camera.lookAt(0, 0.25, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.setClearColor(0x000000, 0); // Pure transparent, no frame
    container.appendChild(renderer.domElement);

    // --- Studio Lighting Rig (High Contrast, Rich Silhouettes) ---
    // Soft ambient
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.15);
    scene.add(ambientLight);

    // Key Light: Crisp front-right key light
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.6);
    keyLight.position.set(4, 6, 5);
    scene.add(keyLight);

    // Rim Light: Vibrant electric cyan-blue backlight highlighting edges
    const rimLight = new THREE.DirectionalLight(0x60a5fa, 2.8);
    rimLight.position.set(-4.5, 4, -4);
    scene.add(rimLight);

    // Fill Light: Soft slate fill on left
    const fillLight = new THREE.DirectionalLight(0xe2e8f0, 0.9);
    fillLight.position.set(-3.5, 1.5, 3.5);
    scene.add(fillLight);

    // Subtle upward ground bounce light
    const bounceLight = new THREE.DirectionalLight(0x94a3b8, 0.4);
    bounceLight.position.set(0, -3, 2);
    scene.add(bounceLight);

    // --- Premium PBR Materials ---
    // Smooth velvet black mannequin stickman skin (soft specular highlights)
    const blackSkinMat = new THREE.MeshStandardMaterial({
      color: 0x141518,
      roughness: 0.28,
      metalness: 0.25,
    });

    // Dark charcoal pleated graduation gown cloth
    const gownMat = new THREE.MeshStandardMaterial({
      color: 0x2b2e35,
      roughness: 0.78,
      metalness: 0.06,
    });

    // Darker gown trim / front placket
    const gownTrimMat = new THREE.MeshStandardMaterial({
      color: 0x1c1e23,
      roughness: 0.6,
      metalness: 0.12,
    });

    // Mortarboard cap fabric
    const capMat = new THREE.MeshStandardMaterial({
      color: 0x16181d,
      roughness: 0.4,
      metalness: 0.15,
    });

    // Cap tassel silk / gold accent
    const tasselMat = new THREE.MeshStandardMaterial({
      color: 0x24262c,
      roughness: 0.5,
      metalness: 0.1,
    });

    const tasselGoldBand = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.3,
      metalness: 0.6,
    });

    // Crisp parchment diploma roll
    const diplomaMat = new THREE.MeshStandardMaterial({
      color: 0xfbfbfe,
      roughness: 0.28,
      metalness: 0.04,
    });

    // Crimson red satin ribbon
    const ribbonMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      roughness: 0.3,
      metalness: 0.18,
    });

    // --- Master Stickman Group ---
    const stickmanRoot = new THREE.Group();
    stickmanRoot.position.set(0, -1.3, 0);
    scene.add(stickmanRoot);

    // 1. Multi-tier Ground Contact Shadow (Soft AO)
    const shadowGroup = new THREE.Group();
    shadowGroup.position.set(0, 0.005, 0);

    const innerShadowGeo = new THREE.CircleGeometry(0.42, 32);
    const innerShadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.45,
    });
    const innerShadow = new THREE.Mesh(innerShadowGeo, innerShadowMat);
    innerShadow.rotation.x = -Math.PI / 2;
    shadowGroup.add(innerShadow);

    const outerShadowGeo = new THREE.CircleGeometry(0.85, 32);
    const outerShadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.22,
    });
    const outerShadow = new THREE.Mesh(outerShadowGeo, outerShadowMat);
    outerShadow.rotation.x = -Math.PI / 2;
    shadowGroup.add(outerShadow);

    stickmanRoot.add(shadowGroup);

    // 2. Sculpted Shoes & Legs
    const legsGroup = new THREE.Group();

    const createShoe = (x: number): THREE.Group => {
      const shoeG = new THREE.Group();
      shoeG.position.set(x, 0, 0);

      // Sole
      const soleGeo = new THREE.BoxGeometry(0.18, 0.04, 0.38);
      const sole = new THREE.Mesh(soleGeo, blackSkinMat);
      sole.position.set(0, 0.02, 0.05);
      shoeG.add(sole);

      // Upper shoe body
      const upperGeo = new THREE.SphereGeometry(0.12, 24, 16);
      upperGeo.scale(1.0, 0.65, 1.7);
      const upper = new THREE.Mesh(upperGeo, blackSkinMat);
      upper.position.set(0, 0.07, 0.06);
      shoeG.add(upper);

      return shoeG;
    };

    const leftShoe = createShoe(-0.22);
    const rightShoe = createShoe(0.22);
    legsGroup.add(leftShoe);
    legsGroup.add(rightShoe);

    // Legs: smooth stick cylinders with ankle & knee joints
    const legStickGeo = new THREE.CylinderGeometry(0.052, 0.052, 0.92, 24);

    const leftLeg = new THREE.Mesh(legStickGeo, blackSkinMat);
    leftLeg.position.set(-0.22, 0.48, 0);
    legsGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(legStickGeo, blackSkinMat);
    rightLeg.position.set(0.22, 0.48, 0);
    legsGroup.add(rightLeg);

    stickmanRoot.add(legsGroup);

    // 3. Pleated Academic Gown / Robe (Realistic Cloth Folds & Flare)
    // Custom parametric fluted geometry for authentic fabric drape
    const gownHeight = 1.45;
    const gownRadiusTop = 0.28;
    const gownRadiusBottom = 0.62;
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

    // Displace vertices to create rich vertical pleats/flutes running down the gown
    const posAttr = gownGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const y = posAttr.getY(i);
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);

      const angle = Math.atan2(z, x);
      const currentRadius = Math.sqrt(x * x + z * z);

      // Deepen folds towards the bottom hem
      const normalizedHeight = (y + gownHeight / 2) / gownHeight; // 0 at bottom, 1 at top
      const pleatFactor = (1 - normalizedHeight * 0.75);
      // 14 vertical flutes around the gown
      const foldWave = Math.sin(angle * 14) * 0.038 * pleatFactor;

      const newRadius = currentRadius + foldWave;
      posAttr.setX(i, Math.cos(angle) * newRadius);
      posAttr.setZ(i, Math.sin(angle) * newRadius);
    }
    gownGeo.computeVertexNormals();

    const gownMesh = new THREE.Mesh(gownGeo, gownMat);
    gownMesh.position.set(0, 1.46, 0);
    stickmanRoot.add(gownMesh);

    // Front Vertical Placket / Zipper Band
    const placketGeo = new THREE.BoxGeometry(0.07, gownHeight * 0.98, 0.03);
    const placketMesh = new THREE.Mesh(placketGeo, gownTrimMat);
    placketMesh.position.set(0, 1.46, 0.38);
    stickmanRoot.add(placketMesh);

    // Gown Collar V-band
    const collarGeo = new THREE.TorusGeometry(0.25, 0.04, 16, 32, Math.PI);
    const collarMesh = new THREE.Mesh(collarGeo, gownTrimMat);
    collarMesh.rotation.x = Math.PI / 2.3;
    collarMesh.position.set(0, 2.14, 0.04);
    stickmanRoot.add(collarMesh);

    // 4. Mannequin Torso, Neck & Spherical Head
    const neckGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.28, 24);
    const neck = new THREE.Mesh(neckGeo, blackSkinMat);
    neck.position.set(0, 2.22, 0);
    stickmanRoot.add(neck);

    // Perfect obsidian black sphere head
    const headGeo = new THREE.SphereGeometry(0.42, 64, 48);
    const head = new THREE.Mesh(headGeo, blackSkinMat);
    head.position.set(0, 2.58, 0);
    stickmanRoot.add(head);

    // 5. Flowing Bell Sleeves & Articulated Arms
    // Left Arm Group (relaxed confident pose)
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-0.36, 2.05, 0);

    // Flared Draped Bell Sleeve
    const sleeveGeo = new THREE.CylinderGeometry(0.12, 0.28, 0.85, 24);
    const leftSleeve = new THREE.Mesh(sleeveGeo, gownMat);
    leftSleeve.position.set(-0.16, -0.38, 0);
    leftSleeve.rotation.z = 0.35;
    leftArmGroup.add(leftSleeve);

    // Stick Arm with elbow & hand joint
    const armGeo = new THREE.CylinderGeometry(0.046, 0.046, 0.68, 16);
    const leftArmStick = new THREE.Mesh(armGeo, blackSkinMat);
    leftArmStick.position.set(-0.25, -0.7, 0);
    leftArmStick.rotation.z = 0.35;
    leftArmGroup.add(leftArmStick);

    const handGeo = new THREE.SphereGeometry(0.085, 24, 24);
    const leftHand = new THREE.Mesh(handGeo, blackSkinMat);
    leftHand.position.set(-0.36, -1.02, 0);
    leftArmGroup.add(leftHand);

    stickmanRoot.add(leftArmGroup);

    // Right Arm Group (holding the diploma proudly up)
    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0.36, 2.05, 0);

    const rightSleeve = new THREE.Mesh(sleeveGeo, gownMat);
    rightSleeve.position.set(0.16, -0.38, 0);
    rightSleeve.rotation.z = -0.35;
    rightArmGroup.add(rightSleeve);

    const rightArmStick = new THREE.Mesh(armGeo, blackSkinMat);
    rightArmStick.position.set(0.25, -0.7, 0);
    rightArmStick.rotation.z = -0.35;
    rightArmGroup.add(rightArmStick);

    const rightHand = new THREE.Mesh(handGeo, blackSkinMat);
    rightHand.position.set(0.36, -1.02, 0);
    rightArmGroup.add(rightHand);

    // Realistic Diploma Scroll in Right Hand
    const diplomaGroup = new THREE.Group();
    diplomaGroup.position.set(0.36, -1.02, 0.12);
    diplomaGroup.rotation.z = -0.65;
    diplomaGroup.rotation.x = 0.45;

    // Rolled parchment cylinder with curled edge
    const dipParchmentGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.72, 32);
    const dipParchment = new THREE.Mesh(dipParchmentGeo, diplomaMat);
    diplomaGroup.add(dipParchment);

    // Rolled inner hollow spirals at ends
    const endGeo = new THREE.RingGeometry(0.015, 0.064, 24);
    const topEnd = new THREE.Mesh(endGeo, gownTrimMat);
    topEnd.rotation.x = -Math.PI / 2;
    topEnd.position.set(0, 0.361, 0);
    diplomaGroup.add(topEnd);

    const bottomEnd = new THREE.Mesh(endGeo, gownTrimMat);
    bottomEnd.rotation.x = Math.PI / 2;
    bottomEnd.position.set(0, -0.361, 0);
    diplomaGroup.add(bottomEnd);

    // Crimson red ribbon wrapped around middle
    const ribBandGeo = new THREE.CylinderGeometry(0.071, 0.071, 0.16, 32);
    const ribBand = new THREE.Mesh(ribBandGeo, ribbonMat);
    diplomaGroup.add(ribBand);

    // Ribbon bow loops
    const bowLoopGeo = new THREE.TorusGeometry(0.05, 0.018, 16, 24);
    const bowLoop1 = new THREE.Mesh(bowLoopGeo, ribbonMat);
    bowLoop1.position.set(0.07, 0.02, 0.04);
    bowLoop1.rotation.y = 0.8;
    diplomaGroup.add(bowLoop1);

    const bowLoop2 = new THREE.Mesh(bowLoopGeo, ribbonMat);
    bowLoop2.position.set(-0.06, 0.02, 0.04);
    bowLoop2.rotation.y = -0.8;
    diplomaGroup.add(bowLoop2);

    // Ribbon tails
    const ribbonTailGeo = new THREE.BoxGeometry(0.028, 0.18, 0.08);
    const ribTail1 = new THREE.Mesh(ribbonTailGeo, ribbonMat);
    ribTail1.position.set(0.05, -0.1, 0.06);
    ribTail1.rotation.z = -0.35;
    diplomaGroup.add(ribTail1);

    const ribTail2 = new THREE.Mesh(ribbonTailGeo, ribbonMat);
    ribTail2.position.set(-0.04, -0.11, 0.06);
    ribTail2.rotation.z = 0.35;
    diplomaGroup.add(ribTail2);

    rightArmGroup.add(diplomaGroup);
    stickmanRoot.add(rightArmGroup);

    // 6. High-Detail Mortarboard Cap (Detachable for 3D Toss Physics)
    const capGroup = new THREE.Group();
    // Centered atop the head
    capGroup.position.set(0, 2.9, 0);

    // Skullcap crown (fits smoothly over head)
    const capSkullGeo = new THREE.CylinderGeometry(0.3, 0.35, 0.22, 32);
    const capSkull = new THREE.Mesh(capSkullGeo, capMat);
    capSkull.position.set(0, -0.06, 0);
    capGroup.add(capSkull);

    // Main Square Board with beveled edge and fabric thickness
    const boardGeo = new THREE.BoxGeometry(1.28, 0.048, 1.28);
    const board = new THREE.Mesh(boardGeo, capMat);
    board.position.set(0, 0.08, 0);
    board.rotation.y = Math.PI / 4; // Diamond graduation cap rotation
    capGroup.add(board);

    // Center Dome Button
    const capBtnGeo = new THREE.SphereGeometry(0.055, 24, 16);
    capBtnGeo.scale(1, 0.5, 1);
    const capButton = new THREE.Mesh(capBtnGeo, capMat);
    capButton.position.set(0, 0.11, 0);
    capGroup.add(capButton);

    // Tassel assembly
    const tasselGroup = new THREE.Group();

    // Cord running from button to the right edge
    const cordCurve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(0, 0.11, 0),
      new THREE.Vector3(0.22, 0.12, 0.15),
      new THREE.Vector3(0.42, 0.08, 0.28),
      new THREE.Vector3(0.48, 0.02, 0.32)
    );
    const cordGeo = new THREE.TubeGeometry(cordCurve, 20, 0.015, 8, false);
    const cordMesh = new THREE.Mesh(cordGeo, tasselMat);
    tasselGroup.add(cordMesh);

    // Gold ferrule band
    const ferruleGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.05, 16);
    const ferruleMesh = new THREE.Mesh(ferruleGeo, tasselGoldBand);
    ferruleMesh.position.set(0.48, -0.04, 0.32);
    tasselGroup.add(ferruleMesh);

    // Hanging tassel brush (threads)
    const brushGeo = new THREE.CylinderGeometry(0.032, 0.06, 0.26, 24);
    const brushMesh = new THREE.Mesh(brushGeo, tasselMat);
    brushMesh.position.set(0.48, -0.18, 0.32);
    tasselGroup.add(brushMesh);

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

      // Launch velocity: High vertical shoot with slight forward-spin
      capVel.set(
        (Math.random() - 0.5) * 0.4,
        6.8, // High explosive toss
        0.3
      );

      // Rapid 3D tumble (pitch, yaw, roll)
      capRotVel.set(
        Math.PI * 5.5,
        Math.PI * 7.0,
        Math.PI * 4.2
      );

      if (onToss) {
        onToss();
      }

      // After flight loop, smoothly settle and reset pose
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
      targetRotY = x * 0.7; // Smooth 3D spin on Y
      targetRotX = y * 0.35; // Slight tilt
    };

    window.addEventListener('mousemove', handleMouseMove);

    // --- Render Loop ---
    let animId: number;
    let lastTime = performance.now();

    const animate = (time: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      // Smooth Stickman rotation tracking mouse for 3D inspection
      stickmanRoot.rotation.y += (targetRotY - stickmanRoot.rotation.y) * 0.08;
      stickmanRoot.rotation.x += (targetRotX - stickmanRoot.rotation.x) * 0.08;

      const t = time * 0.0025;

      // Stickman Body Animation
      if (isTossedRef.current) {
        // Celebratory jump & arms thrust into the air \o/
        stickmanRoot.position.y += (-1.15 - stickmanRoot.position.y) * 0.14; // slight jump up

        // Arms thrown high in triumph
        leftArmGroup.rotation.z += (2.55 - leftArmGroup.rotation.z) * 0.2;
        leftArmGroup.rotation.x += (0.55 - leftArmGroup.rotation.x) * 0.2;

        rightArmGroup.rotation.z += (-2.55 - rightArmGroup.rotation.z) * 0.2;
        rightArmGroup.rotation.x += (0.55 - rightArmGroup.rotation.x) * 0.2;

        // Diploma pumped high above head!
        diplomaGroup.rotation.z += (1.25 - diplomaGroup.rotation.z) * 0.2;
        diplomaGroup.rotation.x += (0.2 - diplomaGroup.rotation.x) * 0.2;
      } else {
        // Organic idle breathing & gentle sway
        const idleY = -1.3 + Math.sin(t) * 0.025;
        stickmanRoot.position.y += (idleY - stickmanRoot.position.y) * 0.08;

        // Relaxed proud posture
        const idleArmZ = 0.12 + Math.sin(t) * 0.04;
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
        capVel.y -= 8.4 * dt;

        // Position update
        capGroup.position.x += capVel.x * dt;
        capGroup.position.y += capVel.y * dt;
        capGroup.position.z += capVel.z * dt;

        // 3D rotations
        capGroup.rotation.x += capRotVel.x * dt;
        capGroup.rotation.y += capRotVel.y * dt;
        capGroup.rotation.z += capRotVel.z * dt;

        // Tassel swing lag
        tasselGroup.rotation.z = Math.sin(time * 0.01) * 0.4;

        // Landing condition
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
      className="w-full h-[400px] sm:h-[480px] lg:h-[520px] relative cursor-pointer select-none overflow-visible"
      style={{ touchAction: 'none' }}
      title="Нажмите, чтобы подбросить колпак в 3D"
    />
  );
};
