import * as THREE from 'three';
import { Materials } from './Materials';
import { StaticGeometryBatcher } from './StaticGeometryBatcher';

export class Lighting {
  public lightingGroup: THREE.Group = new THREE.Group();
  public dirLight!: THREE.DirectionalLight;
  public hemiLight!: THREE.HemisphereLight;
  public ambientLight!: THREE.AmbientLight;
  public playerLantern!: THREE.PointLight;
  public focusSpotlight!: THREE.SpotLight;
  public roomLights: Map<string, THREE.PointLight> = new Map();
  public dynamicPointLights: { light: THREE.PointLight; pos: THREE.Vector3 }[] = [];

  public initLighting(batcher?: StaticGeometryBatcher): void {
    // -----------------------------------------------------------------
    // LAYER 1: GLOBAL AMBIENT & HEMISPHERE ILLUMINATION
    // Strong warm royal fill ensuring dark purple, dark walnut, and dark stone remain fully readable
    // -----------------------------------------------------------------
    this.ambientLight = new THREE.AmbientLight(0xaa8c72, 2.50);
    this.lightingGroup.add(this.ambientLight);

    // Hemisphere light simulating warm candle/ceiling bounce & rich floor bounce
    this.hemiLight = new THREE.HemisphereLight(0xbc987a, 0x6a5240, 1.80);
    this.hemiLight.position.set(0, 20, 0);
    this.lightingGroup.add(this.hemiLight);

    // Handheld warm lantern light following player
    this.playerLantern = new THREE.PointLight(0xeb9638, 3.2, 22.0, 1.8);
    this.lightingGroup.add(this.playerLantern);

    // Dynamic Artwork Focus Spotlight (Follows focused/nearest artwork)
    this.focusSpotlight = new THREE.SpotLight(0xfff0d0, 4.0, 20.0, Math.PI / 4, 0.5, 1.5);
    this.focusSpotlight.castShadow = false;
    this.focusSpotlight.visible = false;
    this.lightingGroup.add(this.focusSpotlight);
    this.lightingGroup.add(this.focusSpotlight.target);

    // -----------------------------------------------------------------
    // LAYER 2: FAINT NIGHT TIME SKYLIGHT BEAM (FIXED GLOBAL ARCHITECTURAL SHADOW SOURCE)
    // -----------------------------------------------------------------
    this.dirLight = new THREE.DirectionalLight(0xbda080, 1.20);
    this.dirLight.position.set(22, 45, 10);
    this.dirLight.target.position.set(0, 0, -10);
    this.dirLight.castShadow = true;

    // High-quality static global shadow map configuration (1024x1024 default)
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.camera.near = 1.0;
    this.dirLight.shadow.camera.far = 130.0;
    this.dirLight.shadow.camera.left = -65.0;
    this.dirLight.shadow.camera.right = 65.0;
    this.dirLight.shadow.camera.top = 75.0;
    this.dirLight.shadow.camera.bottom = -75.0;
    this.dirLight.shadow.bias = -0.0003;
    this.dirLight.shadow.radius = 1.5;

    this.lightingGroup.add(this.dirLight);
    this.lightingGroup.add(this.dirLight.target);

    // -----------------------------------------------------------------
    // LAYER 3: MONUMENTAL ROYAL CHANDELIERS & ROOM ZONE ILLUMINATION
    // -----------------------------------------------------------------

    // 1. GRAND LOBBY MONUMENTAL CHANDELIER (Center 0, 5.8, 32)
    const lobbyChandelier = this.createChandelier(0, 5.8, 32, 1.6, false, 12, batcher, 'lobby');
    if (!batcher) this.lightingGroup.add(lobbyChandelier);
    this.addRoomLight('lobby', 0, 4.5, 32, 0xd48838, 5.2, 30.0);

    // 2. CENTRAL ROTUNDA SOARING CHANDELIER (Center 0, 6.6, 0)
    const rotundaChandelier = this.createChandelier(0, 6.6, 0, 1.5, false, 12, batcher, 'rotunda');
    if (!batcher) this.lightingGroup.add(rotundaChandelier);
    this.addRoomLight('rotunda', 0, 5.0, 0, 0xd48838, 5.2, 30.0);

    // 3. ENTRANCE VESTIBULE & CORRIDORS
    this.addRoomLight('entrance', 0, 4.0, 50, 0xd48838, 4.5, 26.0);
    this.addRoomLight('corridor_south', 0, 4.0, 15.5, 0xd48838, 4.5, 24.0);
    this.addRoomLight('corridor_west', -16.5, 3.8, -2.5, 0xd48838, 4.5, 32.0);
    this.addRoomLight('corridor_east', 16.5, 3.8, -2.5, 0xd48838, 4.5, 32.0);
    this.addRoomLight('corridor_north', 0, 4.0, -20, 0xd48838, 4.5, 26.0);

    // 4. FINAL REVELATION GALLERY CEREMONIAL CHANDELIER (Center 0, 5.6, -62)
    const finalChandelier = this.createChandelier(0, 5.6, -62, 1.4, false, 8, batcher, 'final_hall');
    if (!batcher) this.lightingGroup.add(finalChandelier);
    this.addRoomLight('final_hall', 0, 4.8, -68, 0xd48838, 5.2, 30.0);

    // 5. EXHIBITION HALLS CHANDELIERS & ROOM LIGHTS (Halls 01 - 06)
    const hallSpecs: { id: string; pos: [number, number, number] }[] = [
      { id: 'hall_01', pos: [-30, 4.8, 10] },
      { id: 'hall_02', pos: [-30, 4.8, -15] },
      { id: 'hall_03', pos: [30, 4.8, 10] },
      { id: 'hall_04', pos: [30, 4.8, -15] },
      { id: 'hall_05', pos: [-15, 4.8, -38] },
      { id: 'hall_06', pos: [15, 4.8, -38] }
    ];

    for (const h of hallSpecs) {
      const hallChandelier = this.createChandelier(h.pos[0], h.pos[1], h.pos[2], 1.05, false, 8, batcher, h.id);
      if (!batcher) this.lightingGroup.add(hallChandelier);
      this.addRoomLight(h.id, h.pos[0], h.pos[1] - 0.6, h.pos[2], 0xd88a38, 4.8, 28.0);
    }

    // -----------------------------------------------------------------
    // LAYER 4: HISTORIC WALL SCONCES
    // -----------------------------------------------------------------
    const sconceSpecs: { pos: [number, number, number]; rotY: number; isDual?: boolean; zoneId: string }[] = [
      // Grand Lobby Walls
      { pos: [-11.8, 3.4, 26], rotY: Math.PI / 2, isDual: true, zoneId: 'lobby' },
      { pos: [-11.8, 3.4, 38], rotY: Math.PI / 2, isDual: true, zoneId: 'lobby' },
      { pos: [11.8, 3.4, 26], rotY: -Math.PI / 2, isDual: true, zoneId: 'lobby' },
      { pos: [11.8, 3.4, 38], rotY: -Math.PI / 2, isDual: true, zoneId: 'lobby' },

      // Entrance Vestibule
      { pos: [-7.8, 3.2, 50], rotY: Math.PI / 2, zoneId: 'entrance' },
      { pos: [7.8, 3.2, 50], rotY: -Math.PI / 2, zoneId: 'entrance' },

      // West Corridor
      { pos: [-20, 3.2, -3.8], rotY: 0, zoneId: 'corridor_west' },
      { pos: [-20, 3.2, 3.8], rotY: Math.PI, zoneId: 'corridor_west' },

      // East Corridor
      { pos: [20, 3.2, -3.8], rotY: 0, zoneId: 'corridor_east' },
      { pos: [20, 3.2, 3.8], rotY: Math.PI, zoneId: 'corridor_east' },

      // State North Hallway
      { pos: [-5.8, 3.2, -20], rotY: Math.PI / 2, zoneId: 'corridor_north' },
      { pos: [5.8, 3.2, -20], rotY: -Math.PI / 2, zoneId: 'corridor_north' },

      // Passage to Final Gallery
      { pos: [-5.8, 3.2, -48], rotY: Math.PI / 2, zoneId: 'passage_final' },
      { pos: [5.8, 3.2, -48], rotY: -Math.PI / 2, zoneId: 'passage_final' },

      // Final Gallery Side Piers
      { pos: [-11.8, 3.6, -58], rotY: Math.PI / 2, isDual: true, zoneId: 'final_hall' },
      { pos: [-11.8, 3.6, -66], rotY: Math.PI / 2, isDual: true, zoneId: 'final_hall' },
      { pos: [11.8, 3.6, -58], rotY: -Math.PI / 2, isDual: true, zoneId: 'final_hall' },
      { pos: [11.8, 3.6, -66], rotY: -Math.PI / 2, isDual: true, zoneId: 'final_hall' },

      // Exhibition Hall Sconces (Halls 01 - 06)
      { pos: [-39.8, 3.2, 10], rotY: Math.PI / 2, zoneId: 'hall_01' },
      { pos: [-30, 3.2, 19.8], rotY: Math.PI, zoneId: 'hall_01' },
      { pos: [-39.8, 3.2, -15], rotY: Math.PI / 2, zoneId: 'hall_02' },
      { pos: [-30, 3.2, -24.8], rotY: Math.PI, zoneId: 'hall_02' },
      { pos: [39.8, 3.2, 10], rotY: -Math.PI / 2, zoneId: 'hall_03' },
      { pos: [30, 3.2, 19.8], rotY: Math.PI, zoneId: 'hall_03' },
      { pos: [39.8, 3.2, -15], rotY: -Math.PI / 2, zoneId: 'hall_04' },
      { pos: [30, 3.2, -24.8], rotY: Math.PI, zoneId: 'hall_04' },
      { pos: [-25.8, 3.2, -38], rotY: Math.PI / 2, zoneId: 'hall_05' },
      { pos: [-15, 3.2, -47.8], rotY: Math.PI, zoneId: 'hall_05' },
      { pos: [25.8, 3.2, -38], rotY: -Math.PI / 2, zoneId: 'hall_06' },
      { pos: [15, 3.2, -47.8], rotY: Math.PI, zoneId: 'hall_06' },
    ];

    for (const s of sconceSpecs) {
      const sconce = this.createWallSconce(s.pos[0], s.pos[1], s.pos[2], s.rotY, s.isDual, batcher, s.zoneId);
      if (!batcher) this.lightingGroup.add(sconce);
    }
  }

  private addRoomLight(roomId: string, x: number, y: number, z: number, color: number, intensity: number, distance: number): void {
    const light = new THREE.PointLight(color, intensity, distance, 1.8);
    light.position.set(x, y, z);
    light.castShadow = false;
    this.lightingGroup.add(light);
    this.roomLights.set(roomId, light);
    this.dynamicPointLights.push({ light, pos: new THREE.Vector3(x, y, z) });
  }

  /**
   * Creates an ornate royal chandelier in aged gold & antique bronze.
   */
  public createChandelier(
    cx: number, cy: number, cz: number,
    scale: number = 1.0,
    castShadow: boolean = false,
    numArms: number = 8,
    batcher?: StaticGeometryBatcher,
    zoneId?: string
  ): THREE.Group {
    const group = new THREE.Group();
    group.position.set(cx, cy, cz);

    // 1. Hanging Chain & Top Finial Canopy
    const rodGeo = new THREE.CylinderGeometry(0.04 * scale, 0.04 * scale, 1.2 * scale, 8);
    const rodMesh = new THREE.Mesh(rodGeo, Materials.antiqueBronze);
    rodMesh.position.y = 0.6 * scale;
    group.add(rodMesh);

    const canopyGeo = new THREE.CylinderGeometry(0.35 * scale, 0.12 * scale, 0.28 * scale, 16);
    const canopyMesh = new THREE.Mesh(canopyGeo, Materials.goldLeaf);
    canopyMesh.position.y = 1.2 * scale;
    group.add(canopyMesh);

    // 2. Central Multi-Tier Brass Crown Hub
    const hubGeo = new THREE.CylinderGeometry(0.40 * scale, 0.50 * scale, 0.55 * scale, 16);
    const hubMesh = new THREE.Mesh(hubGeo, Materials.goldLeaf);
    hubMesh.castShadow = castShadow;
    hubMesh.receiveShadow = true;
    group.add(hubMesh);

    // Upper Decorative Scrollwork Ring
    const upperRingGeo = new THREE.TorusGeometry(0.45 * scale, 0.05 * scale, 8, 24);
    const upperRingMesh = new THREE.Mesh(upperRingGeo, Materials.goldLeaf);
    upperRingMesh.rotation.x = Math.PI / 2;
    upperRingMesh.position.y = 0.25 * scale;
    upperRingMesh.receiveShadow = true;
    group.add(upperRingMesh);

    const lowerFinialGeo = new THREE.ConeGeometry(0.28 * scale, 0.45 * scale, 12);
    const lowerFinialMesh = new THREE.Mesh(lowerFinialGeo, Materials.antiqueBronze);
    lowerFinialMesh.position.y = -0.50 * scale;
    lowerFinialMesh.rotation.x = Math.PI;
    lowerFinialMesh.castShadow = castShadow;
    lowerFinialMesh.receiveShadow = true;
    group.add(lowerFinialMesh);

    // 3. Curved Arms, Candle Sleeves & Flame Bulbs
    const radius = 1.25 * scale;

    for (let i = 0; i < numArms; i++) {
      const angle = (i / numArms) * Math.PI * 2;
      const ax = Math.cos(angle) * radius;
      const az = Math.sin(angle) * radius;

      // Curved Arm segment
      const armGeo = new THREE.CylinderGeometry(0.025 * scale, 0.025 * scale, radius, 8);
      const armMesh = new THREE.Mesh(armGeo, Materials.goldLeaf);
      armMesh.position.set(ax * 0.5, -0.05 * scale, az * 0.5);
      armMesh.rotation.z = Math.PI / 2.2;
      armMesh.rotation.y = -angle;
      group.add(armMesh);

      // Ornate Candle Cup
      const cupGeo = new THREE.CylinderGeometry(0.12 * scale, 0.06 * scale, 0.16 * scale, 12);
      const cupMesh = new THREE.Mesh(cupGeo, Materials.goldLeaf);
      cupMesh.position.set(ax, 0.06 * scale, az);
      group.add(cupMesh);

      // Cream Candle Sleeve
      const candleGeo = new THREE.CylinderGeometry(0.035 * scale, 0.035 * scale, 0.28 * scale, 8);
      const candleMesh = new THREE.Mesh(candleGeo, Materials.ceilingPlaster);
      candleMesh.position.set(ax, 0.22 * scale, az);
      group.add(candleMesh);

      // Warm Glowing Flame Bulb Tip
      const flameGeo = new THREE.SphereGeometry(0.045 * scale, 8, 8);
      const flameMesh = new THREE.Mesh(flameGeo, Materials.warmBulbGlow);
      flameMesh.position.set(ax, 0.38 * scale, az);
      group.add(flameMesh);

      // Faceted Glass Crystal Drop Pendant dangling below cup
      const crystalGeo = new THREE.OctahedronGeometry(0.07 * scale);
      const crystalMesh = new THREE.Mesh(crystalGeo, Materials.glassSkylight);
      crystalMesh.position.set(ax, -0.14 * scale, az);
      group.add(crystalMesh);
    }

    // Upper Tier for Grand Monumental Chandeliers (scale >= 1.5)
    if (scale >= 1.5) {
      const upperArms = 8;
      const upperRadius = 0.75 * scale;
      const upperY = 0.45 * scale;

      for (let j = 0; j < upperArms; j++) {
        const uAngle = (j / upperArms) * Math.PI * 2 + Math.PI / upperArms;
        const uax = Math.cos(uAngle) * upperRadius;
        const uaz = Math.sin(uAngle) * upperRadius;

        const uArmGeo = new THREE.CylinderGeometry(0.02 * scale, 0.02 * scale, upperRadius, 8);
        const uArmMesh = new THREE.Mesh(uArmGeo, Materials.goldLeaf);
        uArmMesh.position.set(uax * 0.5, upperY - 0.05 * scale, uaz * 0.5);
        uArmMesh.rotation.z = Math.PI / 2.3;
        uArmMesh.rotation.y = -uAngle;
        group.add(uArmMesh);

        const uCupMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.10 * scale, 0.05 * scale, 0.14 * scale, 12), Materials.goldLeaf);
        uCupMesh.position.set(uax, upperY + 0.05 * scale, uaz);
        group.add(uCupMesh);

        const uCandleMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.03 * scale, 0.03 * scale, 0.24 * scale, 8), Materials.ceilingPlaster);
        uCandleMesh.position.set(uax, upperY + 0.19 * scale, uaz);
        group.add(uCandleMesh);

        const uFlameMesh = new THREE.Mesh(new THREE.SphereGeometry(0.04 * scale, 8, 8), Materials.warmBulbGlow);
        uFlameMesh.position.set(uax, upperY + 0.33 * scale, uaz);
        group.add(uFlameMesh);

        const uCrystalMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.06 * scale), Materials.glassSkylight);
        uCrystalMesh.position.set(uax, upperY - 0.12 * scale, uaz);
        group.add(uCrystalMesh);
      }
    }

    // 4. Primary Downward Warm Point Light for Chandeliers
    const pLight = new THREE.PointLight(0xe89838, 5.2 * scale, 24.0 * scale, 1.8);
    pLight.position.set(cx, cy, cz);
    pLight.castShadow = false;
    this.lightingGroup.add(pLight);

    // 5. Ceiling Uplight to illuminate coffered ceiling & moldings overhead
    const topUplight = new THREE.PointLight(0xdf8830, 3.2 * scale, 18.0 * scale, 1.8);
    topUplight.position.set(cx, cy + 0.8 * scale, cz);
    topUplight.castShadow = false;
    this.lightingGroup.add(topUplight);

    this.dynamicPointLights.push({ light: pLight, pos: new THREE.Vector3(cx, cy, cz) });
    this.dynamicPointLights.push({ light: topUplight, pos: new THREE.Vector3(cx, cy + 0.8 * scale, cz) });

    if (batcher) {
      batcher.add(group, zoneId);
    }

    return group;
  }

  /**
   * Creates a classic 3D wall sconce in antique bronze with warm glowing bulb tip.
   */
  public createWallSconce(
    x: number, y: number, z: number,
    rotationY: number,
    isDual: boolean = false,
    batcher?: StaticGeometryBatcher,
    zoneId?: string
  ): THREE.Group {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.rotation.y = rotationY;

    // 1. Backplate on wall
    const plateGeo = new THREE.BoxGeometry(0.22, 0.40, 0.03);
    const plateMesh = new THREE.Mesh(plateGeo, Materials.antiqueBronze);
    group.add(plateMesh);

    // Gold accent trim on backplate
    const trimGeo = new THREE.BoxGeometry(0.24, 0.04, 0.04);
    const trimMeshTop = new THREE.Mesh(trimGeo, Materials.goldLeaf);
    trimMeshTop.position.set(0, 0.18, 0.01);
    group.add(trimMeshTop);

    const trimMeshBot = new THREE.Mesh(trimGeo, Materials.goldLeaf);
    trimMeshBot.position.set(0, -0.18, 0.01);
    group.add(trimMeshBot);

    // 2. Arms & Candle Cups
    const armOffsets = isDual ? [-0.12, 0.12] : [0];

    for (const offset of armOffsets) {
      // Curved Arm
      const armGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.22, 8);
      const armMesh = new THREE.Mesh(armGeo, Materials.antiqueBronze);
      armMesh.position.set(offset, -0.05, 0.12);
      armMesh.rotation.x = Math.PI / 3;
      group.add(armMesh);

      // Gold Cup
      const cupGeo = new THREE.CylinderGeometry(0.08, 0.04, 0.12, 12);
      const cupMesh = new THREE.Mesh(cupGeo, Materials.goldLeaf);
      cupMesh.position.set(offset, 0.08, 0.22);
      group.add(cupMesh);

      // Cream Candle Sleeve
      const candleGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.16, 8);
      const candleMesh = new THREE.Mesh(candleGeo, Materials.ceilingPlaster);
      candleMesh.position.set(offset, 0.18, 0.22);
      group.add(candleMesh);

      // Warm Flame Bulb (Self-illuminated emissive material)
      const bulbGeo = new THREE.SphereGeometry(0.04, 10, 10);
      const bulbMesh = new THREE.Mesh(bulbGeo, Materials.warmBulbGlow);
      bulbMesh.position.set(offset, 0.28, 0.22);
      group.add(bulbMesh);
    }

    if (batcher) {
      batcher.add(group, zoneId);
    }

    return group;
  }

  /**
   * Creates a 3D gallery spotlight fixture above a painting.
   */
  public createArtworkSpotlight(
    px: number, py: number, pz: number,
    targetX: number, targetY: number, targetZ: number
  ): THREE.Group {
    const group = new THREE.Group();

    // 1. Ceiling/Wall Mounting Plate
    const mountGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.04, 12);
    const mountMesh = new THREE.Mesh(mountGeo, Materials.antiqueBronze);
    mountMesh.position.set(px, py, pz);
    group.add(mountMesh);

    // 2. Curved Mounting Arm
    const armGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.38, 8);
    const armMesh = new THREE.Mesh(armGeo, Materials.antiqueBronze);
    armMesh.position.set(px, py - 0.19, pz);
    group.add(armMesh);

    // 3. Brass Lamp Housing
    const headGeo = new THREE.ConeGeometry(0.12, 0.22, 16);
    const headMesh = new THREE.Mesh(headGeo, Materials.goldLeaf);
    headMesh.position.set(px, py - 0.36, pz);
    headMesh.lookAt(targetX, targetY, targetZ);
    headMesh.rotateX(Math.PI / 2);
    group.add(headMesh);

    return group;
  }

  /**
   * Updates visibility of secondary dynamic point lights according to active light budget.
   * Keeps the lights closest to the player active, while preserving all main architectural/ambient illumination.
   */
  public updateSecondaryPointLights(playerPos: THREE.Vector3, maxBudget = 30): void {
    if (this.dynamicPointLights.length <= maxBudget) {
      for (let i = 0; i < this.dynamicPointLights.length; i++) {
        this.dynamicPointLights[i].light.visible = true;
      }
      return;
    }

    // Sort by squared distance to player position (allocate budget to closest lights)
    const withDist = this.dynamicPointLights.map(item => ({
      item,
      distSq: item.pos.distanceToSquared(playerPos)
    }));
    withDist.sort((a, b) => a.distSq - b.distSq);

    for (let i = 0; i < withDist.length; i++) {
      withDist[i].item.light.visible = i < maxBudget;
    }
  }

  /**
   * Returns current active light count in O(N) where N~30 without any scene graph traversal
   */
  public getActiveLightCount(): number {
    let count = 0;
    if (this.ambientLight && this.ambientLight.visible) count++;
    if (this.hemiLight && this.hemiLight.visible) count++;
    if (this.playerLantern && this.playerLantern.visible) count++;
    if (this.dirLight && this.dirLight.visible) count++;
    if (this.focusSpotlight && this.focusSpotlight.visible) count++;
    for (let i = 0; i < this.dynamicPointLights.length; i++) {
      if (this.dynamicPointLights[i].light.visible) count++;
    }
    return count;
  }
}
