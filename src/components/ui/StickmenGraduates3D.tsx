import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface StickmenGraduates3DProps {
  onToss?: () => void;
  triggerToss?: boolean;
}

interface CapPhysics {
  group: THREE.Group;
  initialPos: THREE.Vector3;
  initialRot: THREE.Euler;
  vel: THREE.Vector3;
  rotVel: THREE.Vector3;
  isFlying: boolean;
  tossTime: number;
}

interface StickmanRig {
  root: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  diploma?: THREE.Group;
  capPhysics: CapPhysics;
  baseY: number;
  bobPhase: number;
  isCenter: boolean;
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

    // --- Scene, Camera, Renderer ---
    const width = container.clientWidth || 560;
    const height = container.clientHeight || 440;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    camera.position.set(0, 0.9, 8.6);
    camera.lookAt(0, 0.45, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.setClearColor(0x000000, 0); // Clean transparent, no card/frame
    container.appendChild(renderer.domElement);

    // --- Studio Lighting ---
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.25);
    scene.add(ambientLight);

    // Main Key Light from top-front-right
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    keyLight.position.set(4.5, 7.5, 5.5);
    scene.add(keyLight);

    // Soft Rim Light from back-left for sleek edge illumination on black silhouettes
    const rimLight = new THREE.DirectionalLight(0x93c5fd, 1.9);
    rimLight.position.set(-5, 5, -4);
    scene.add(rimLight);

    // Warm fill light
    const fillLight = new THREE.DirectionalLight(0xf1f5f9, 0.9);
    fillLight.position.set(-3.5, 2.5, 4.5);
    scene.add(fillLight);

    // --- PBR Materials (Matching Reference 3D Photos) ---
    // Matte smooth black stickman mannequin body
    const blackBodyMat = new THREE.MeshStandardMaterial({
      color: 0x111215,
      roughness: 0.35,
      metalness: 0.15,
    });

    // Dark charcoal draped academic gown / robe
    const robeMat = new THREE.MeshStandardMaterial({
      color: 0x363940,
      roughness: 0.72,
      metalness: 0.08,
    });

    // Mortarboard cap fabric
    const capMat = new THREE.MeshStandardMaterial({
      color: 0x18191d,
      roughness: 0.45,
      metalness: 0.12,
    });

    // Cap tassel cord & brush
    const tasselMat = new THREE.MeshStandardMaterial({
      color: 0x24262c,
      roughness: 0.6,
      metalness: 0.05,
    });

    // White diploma parchment roll
    const diplomaMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.32,
      metalness: 0.04,
    });

    // Red diploma ribbon
    const ribbonMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      roughness: 0.35,
      metalness: 0.15,
    });

    // Soft contact ground shadow
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.28,
    });

    // --- Stickman Generator ---
    const stickmen: StickmanRig[] = [];

    const createStickman = (
      x: number,
      z: number,
      scale: number,
      angleY: number,
      hasDiploma: boolean,
      isCenter: boolean,
      bobPhase: number
    ): StickmanRig => {
      const root = new THREE.Group();
      root.position.set(x, -1.35, z);
      root.rotation.y = angleY;
      root.scale.set(scale, scale, scale);

      // Contact shadow under feet
      const shadowGeo = new THREE.CircleGeometry(0.48, 24);
      const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
      shadowMesh.rotation.x = -Math.PI / 2;
      shadowMesh.position.set(0, 0.01, 0);
      root.add(shadowMesh);

      // 1. Legs
      const legGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.85, 16);
      const leftLeg = new THREE.Mesh(legGeo, blackBodyMat);
      leftLeg.position.set(-0.16, 0.42, 0);
      root.add(leftLeg);

      const rightLeg = new THREE.Mesh(legGeo, blackBodyMat);
      rightLeg.position.set(0.16, 0.42, 0);
      root.add(rightLeg);

      // Shoes (stretched black spheres)
      const shoeGeo = new THREE.SphereGeometry(0.09, 16, 16);
      shoeGeo.scale(1.1, 0.6, 1.8);
      const leftShoe = new THREE.Mesh(shoeGeo, blackBodyMat);
      leftShoe.position.set(-0.16, 0.05, 0.05);
      root.add(leftShoe);

      const rightShoe = new THREE.Mesh(shoeGeo, blackBodyMat);
      rightShoe.position.set(0.16, 0.05, 0.05);
      root.add(rightShoe);

      // 2. Robe / Gown Body (Tapered draped cylinder)
      const robeGeo = new THREE.CylinderGeometry(0.25, 0.46, 1.3, 24);
      const robe = new THREE.Mesh(robeGeo, robeMat);
      robe.position.set(0, 1.28, 0);
      root.add(robe);

      // 3. Head & Neck
      const neckGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.22, 16);
      const neck = new THREE.Mesh(neckGeo, blackBodyMat);
      neck.position.set(0, 1.95, 0);
      root.add(neck);

      const headGeo = new THREE.SphereGeometry(0.33, 32, 32);
      const head = new THREE.Mesh(headGeo, blackBodyMat);
      head.position.set(0, 2.22, 0);
      root.add(head);

      // 4. Arms & Sleeves
      // Left Arm
      const leftArm = new THREE.Group();
      leftArm.position.set(-0.3, 1.76, 0);

      const sleeveGeo = new THREE.CylinderGeometry(0.11, 0.22, 0.68, 16);
      const leftSleeve = new THREE.Mesh(sleeveGeo, robeMat);
      leftSleeve.position.set(-0.1, -0.3, 0);
      leftSleeve.rotation.z = 0.25;
      leftArm.add(leftSleeve);

      const armStickGeo = new THREE.CylinderGeometry(0.038, 0.038, 0.55, 12);
      const leftStick = new THREE.Mesh(armStickGeo, blackBodyMat);
      leftStick.position.set(-0.16, -0.55, 0);
      leftStick.rotation.z = 0.25;
      leftArm.add(leftStick);

      const handGeo = new THREE.SphereGeometry(0.065, 16, 16);
      const leftHand = new THREE.Mesh(handGeo, blackBodyMat);
      leftHand.position.set(-0.24, -0.82, 0);
      leftArm.add(leftHand);

      root.add(leftArm);

      // Right Arm
      const rightArm = new THREE.Group();
      rightArm.position.set(0.3, 1.76, 0);

      const rightSleeve = new THREE.Mesh(sleeveGeo, robeMat);
      rightSleeve.position.set(0.1, -0.3, 0);
      rightSleeve.rotation.z = -0.25;
      rightArm.add(rightSleeve);

      const rightStick = new THREE.Mesh(armStickGeo, blackBodyMat);
      rightStick.position.set(0.16, -0.55, 0);
      rightStick.rotation.z = -0.25;
      rightArm.add(rightStick);

      const rightHand = new THREE.Mesh(handGeo, blackBodyMat);
      rightHand.position.set(0.24, -0.82, 0);
      rightArm.add(rightHand);

      // Diploma scroll
      let diplomaGroup: THREE.Group | undefined;
      if (hasDiploma) {
        diplomaGroup = new THREE.Group();
        diplomaGroup.position.set(0.24, -0.82, 0.08);
        diplomaGroup.rotation.z = isCenter ? -0.85 : -0.45;
        diplomaGroup.rotation.x = 0.3;

        // White rolled parchment
        const dipGeo = new THREE.CylinderGeometry(0.052, 0.052, 0.54, 16);
        const dipMesh = new THREE.Mesh(dipGeo, diplomaMat);
        diplomaGroup.add(dipMesh);

        // Red ribbon band in center
        const ribGeo = new THREE.CylinderGeometry(0.056, 0.056, 0.12, 16);
        const ribMesh = new THREE.Mesh(ribGeo, ribbonMat);
        diplomaGroup.add(ribMesh);

        // Ribbon bow / knot
        const bowEndGeo = new THREE.BoxGeometry(0.02, 0.14, 0.06);
        const bowEnd1 = new THREE.Mesh(bowEndGeo, ribbonMat);
        bowEnd1.position.set(0.05, -0.06, 0.03);
        bowEnd1.rotation.z = -0.35;
        diplomaGroup.add(bowEnd1);

        const bowEnd2 = new THREE.Mesh(bowEndGeo, ribbonMat);
        bowEnd2.position.set(-0.04, -0.07, 0.03);
        bowEnd2.rotation.z = 0.35;
        diplomaGroup.add(bowEnd2);

        rightArm.add(diplomaGroup);
      }

      root.add(rightArm);

      // 5. Mortarboard Graduation Cap (Detachable with 3D flight physics)
      const capGroup = new THREE.Group();
      capGroup.position.set(0, 2.45, 0);

      // Skullcap Base
      const skullGeo = new THREE.CylinderGeometry(0.23, 0.27, 0.16, 24);
      const skullMesh = new THREE.Mesh(skullGeo, capMat);
      capGroup.add(skullMesh);

      // Flat Square Diamond Board
      const boardGeo = new THREE.BoxGeometry(0.92, 0.034, 0.92);
      const boardMesh = new THREE.Mesh(boardGeo, capMat);
      boardMesh.position.set(0, 0.09, 0);
      boardMesh.rotation.y = Math.PI / 4; // Diamond top
      capGroup.add(boardMesh);

      // Center button
      const buttonGeo = new THREE.CylinderGeometry(0.042, 0.042, 0.038, 12);
      const buttonMesh = new THREE.Mesh(buttonGeo, tasselMat);
      buttonMesh.position.set(0, 0.115, 0);
      capGroup.add(buttonMesh);

      // Tassel cord & hanging brush (hanging to right side)
      const cordGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.33, 8);
      const cordMesh = new THREE.Mesh(cordGeo, tasselMat);
      cordMesh.position.set(0.18, 0.08, 0.14);
      cordMesh.rotation.z = -1.1;
      cordMesh.rotation.y = 0.4;
      capGroup.add(cordMesh);

      const brushGeo = new THREE.CylinderGeometry(0.024, 0.042, 0.19, 12);
      const brushMesh = new THREE.Mesh(brushGeo, tasselMat);
      brushMesh.position.set(0.35, -0.06, 0.2);
      capGroup.add(brushMesh);

      root.add(capGroup);

      scene.add(root);

      const capPhysics: CapPhysics = {
        group: capGroup,
        initialPos: capGroup.position.clone(),
        initialRot: capGroup.rotation.clone(),
        vel: new THREE.Vector3(),
        rotVel: new THREE.Vector3(),
        isFlying: false,
        tossTime: 0,
      };

      return {
        root,
        leftArm,
        rightArm,
        diploma: diplomaGroup,
        capPhysics,
        baseY: root.position.y,
        bobPhase,
        isCenter,
      };
    };

    // Instantiate 5 Stickmen Cohort (Matching 3D Reference Images)
    // Symmetrical proud stage presence with depth arc
    stickmen.push(
      // Center Graduate (Proud leader with diploma raised)
      createStickman(0, 0.12, 1.06, 0, true, true, 0),
      // Inner Left
      createStickman(-1.46, 0.26, 0.99, 0.14, true, false, 1.2),
      // Inner Right
      createStickman(1.46, 0.26, 0.99, -0.14, true, false, 2.4),
      // Outer Left
      createStickman(-2.85, 0.68, 0.93, 0.3, false, false, 3.6),
      // Outer Right
      createStickman(2.85, 0.68, 0.93, -0.3, false, false, 4.8)
    );

    // --- 3D Cap Toss Action ---
    const executeToss = () => {
      isTossedRef.current = true;

      stickmen.forEach((sm, index) => {
        const cp = sm.capPhysics;
        cp.isFlying = true;
        cp.tossTime = 0;

        // Upward impulse
        const upwardSpeed = 5.2 + Math.random() * 1.8 + (sm.isCenter ? 0.7 : 0);
        // Outward fan spread
        const spreadX = sm.root.position.x * 0.38 + (Math.random() - 0.5) * 0.3;
        const spreadZ = (Math.random() - 0.4) * 0.5;

        cp.vel.set(spreadX, upwardSpeed, spreadZ);

        // 3D rotations (Pitch, Yaw, Roll)
        cp.rotVel.set(
          (Math.random() - 0.5) * 12,
          (Math.random() - 0.5) * 16 + (index % 2 === 0 ? 8 : -8),
          (Math.random() - 0.5) * 10
        );
      });

      if (onToss) {
        onToss();
      }

      // Allow caps to settle and reset celebration pose after flight duration
      setTimeout(() => {
        isTossedRef.current = false;
      }, 2400);
    };

    tossCapsRef.current = executeToss;

    // --- Mouse Parallax ---
    let targetCamX = 0;
    let targetCamY = 0.9;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      targetCamX = x * 1.5;
      targetCamY = 0.9 - y * 0.8;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // --- Render Loop ---
    let animId: number;
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((currentTime - lastTime) / 1000, 0.05);
      lastTime = currentTime;

      // Smooth camera parallax
      camera.position.x += (targetCamX - camera.position.x) * 0.06;
      camera.position.y += (targetCamY - camera.position.y) * 0.06;
      camera.lookAt(0, 0.4, 0);

      // Animate Stickmen
      stickmen.forEach((sm) => {
        const t = currentTime * 0.002 + sm.bobPhase;

        // Breathing bob when grounded
        if (!isTossedRef.current) {
          sm.root.position.y = sm.baseY + Math.sin(t) * 0.022;
        }

        // Arm posture transition
        if (isTossedRef.current) {
          // Celebratory raised arms \o/
          const victoryLeftZ = 2.45;
          const victoryRightZ = -2.45;
          const victoryX = 0.45;

          sm.leftArm.rotation.z += (victoryLeftZ - sm.leftArm.rotation.z) * 0.18;
          sm.leftArm.rotation.x += (victoryX - sm.leftArm.rotation.x) * 0.18;

          sm.rightArm.rotation.z += (victoryRightZ - sm.rightArm.rotation.z) * 0.18;
          sm.rightArm.rotation.x += (victoryX - sm.rightArm.rotation.x) * 0.18;

          // Diploma pump
          if (sm.diploma) {
            sm.diploma.rotation.z += (1.1 - sm.diploma.rotation.z) * 0.18;
          }
        } else {
          // Standing pose
          const idleLeftZ = 0.14 + Math.sin(t) * 0.035;
          const idleRightZ = -0.14 - Math.sin(t) * 0.035;

          sm.leftArm.rotation.z += (idleLeftZ - sm.leftArm.rotation.z) * 0.08;
          sm.leftArm.rotation.x += (0 - sm.leftArm.rotation.x) * 0.08;

          sm.rightArm.rotation.z += (idleRightZ - sm.rightArm.rotation.z) * 0.08;
          sm.rightArm.rotation.x += (0 - sm.rightArm.rotation.x) * 0.08;

          if (sm.diploma) {
            const baseDipZ = sm.isCenter ? -0.85 : -0.45;
            sm.diploma.rotation.z += (baseDipZ - sm.diploma.rotation.z) * 0.08;
          }
        }

        // Cap Physics update
        const cp = sm.capPhysics;
        if (cp.isFlying) {
          cp.tossTime += dt;

          // Apply Gravity
          cp.vel.y -= 7.8 * dt;

          // Position step
          cp.group.position.x += cp.vel.x * dt;
          cp.group.position.y += cp.vel.y * dt;
          cp.group.position.z += cp.vel.z * dt;

          // 3D rotation step
          cp.group.rotation.x += cp.rotVel.x * dt;
          cp.group.rotation.y += cp.rotVel.y * dt;
          cp.group.rotation.z += cp.rotVel.z * dt;

          // Gentle landing back on head
          if (cp.vel.y < 0 && cp.group.position.y <= cp.initialPos.y) {
            cp.isFlying = false;
            cp.group.position.copy(cp.initialPos);
            cp.group.rotation.copy(cp.initialRot);
          }
        } else {
          // Snug return to head
          cp.group.position.lerp(cp.initialPos, 0.14);
          cp.group.rotation.x += (cp.initialRot.x - cp.group.rotation.x) * 0.14;
          cp.group.rotation.y += (cp.initialRot.y - cp.group.rotation.y) * 0.14;
          cp.group.rotation.z += (cp.initialRot.z - cp.group.rotation.z) * 0.14;
        }
      });

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

  // React to triggerToss prop
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
      className="w-full h-[380px] sm:h-[440px] lg:h-[480px] relative cursor-pointer select-none overflow-visible"
      style={{ touchAction: 'none' }}
    />
  );
};
