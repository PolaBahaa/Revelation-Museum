import * as THREE from 'three';
import { Materials } from './Materials';
import { CollisionSystem } from './CollisionSystem';
import { WallBoundingBox } from '../types';

export interface RoomDefinition {
  id: string;
  name: string;
  center: [number, number, number];
  size: [number, number, number]; // width, height, depth
  wallColor?: 'alabaster' | 'navy' | 'burgundy';
  floorType?: 'marble' | 'parquet';
  hasSkylight?: boolean;
}

export class Architecture {
  public sceneGroup: THREE.Group = new THREE.Group();
  private collisionSystem: CollisionSystem;
  private wallBoxes: WallBoundingBox[] = [];

  constructor(collisionSystem: CollisionSystem) {
    this.collisionSystem = collisionSystem;
  }

  public buildMuseum(): void {
    Materials.init();

    // Define all historic European royal palace rooms
    const rooms: RoomDefinition[] = [
      // 1. Entrance Vestibule
      { id: 'entrance', name: 'Royal Entrance Vestibule', center: [0, 0, 50], size: [16, 6, 12], wallColor: 'alabaster', floorType: 'marble' },
      // 2. Grand Lobby
      { id: 'lobby', name: 'Grand Ceremonial Reception Lobby', center: [0, 0, 32], size: [24, 7.5, 24], wallColor: 'navy', floorType: 'marble', hasSkylight: true },
      // 3. Processional Gallery
      { id: 'corridor_south', name: 'Royal Processional Gallery', center: [0, 0, 15.5], size: [12, 6.5, 9], wallColor: 'alabaster', floorType: 'marble' },
      // 4. Central Rotunda
      { id: 'rotunda', name: 'Sovereign Central Rotunda', center: [0, 0, 0], size: [26, 8, 22], wallColor: 'alabaster', floorType: 'marble', hasSkylight: true },

      // Corridors
      { id: 'corridor_west', name: 'Royal West Gallery Corridor', center: [-16.5, 0, -2.5], size: [7, 5.5, 45], wallColor: 'alabaster', floorType: 'parquet' },
      { id: 'corridor_east', name: 'Royal East Gallery Corridor', center: [16.5, 0, -2.5], size: [7, 5.5, 45], wallColor: 'alabaster', floorType: 'parquet' },
      { id: 'corridor_north', name: 'State North Hallway', center: [0, 0, -20], size: [12, 6, 18], wallColor: 'alabaster', floorType: 'parquet' },

      // Halls 01-06 (Palace Exhibition Galleries)
      { id: 'hall_01', name: 'Hall 01: The Seven Seals Gallery', center: [-30, 0, 10], size: [20, 6, 20], wallColor: 'navy', floorType: 'parquet' },
      { id: 'hall_02', name: 'Hall 02: The Seven Trumpets Gallery', center: [-30, 0, -15], size: [20, 6, 20], wallColor: 'burgundy', floorType: 'parquet' },
      { id: 'hall_03', name: 'Hall 03: The Heavenly Vision Gallery', center: [30, 0, 10], size: [20, 6, 20], wallColor: 'navy', floorType: 'parquet' },
      { id: 'hall_04', name: 'Hall 04: The Seven Bowls Gallery', center: [30, 0, -15], size: [20, 6, 20], wallColor: 'burgundy', floorType: 'parquet' },
      { id: 'hall_05', name: 'Hall 05: The Final Victory Gallery', center: [-15, 0, -38], size: [22, 6, 18], wallColor: 'navy', floorType: 'parquet' },
      { id: 'hall_06', name: 'Hall 06: The New Jerusalem Gallery', center: [15, 0, -38], size: [22, 6, 18], wallColor: 'burgundy', floorType: 'parquet' },

      // Gallery Spine & Passage
      { id: 'passage_mid', name: 'Gallery North Spine', center: [0, 0, -38], size: [8, 6, 18], wallColor: 'alabaster', floorType: 'parquet' },
      { id: 'passage_final', name: 'Corridor of Revelation', center: [0, 0, -53], size: [12, 6, 12], wallColor: 'alabaster', floorType: 'parquet' },

      // Final Gallery & Exit
      { id: 'final_hall', name: 'Final Revelation Throne Gallery', center: [0, 0, -68], size: [24, 7, 18], wallColor: 'navy', floorType: 'marble', hasSkylight: true },
      { id: 'exit_terrace', name: 'Palace Garden Terrace & Vista', center: [0, 0, -83], size: [20, 6, 12], wallColor: 'alabaster', floorType: 'marble' }
    ];

    // Build room floors, ceilings, and coffered structures
    for (const room of rooms) {
      this.buildRoomStructure(room);
    }

    // Build specific architectural walls with layered 3D palace paneling
    this.buildMuseumWalls();

    // Add classical columns, monumental portals, console tables, mirrors, drapery, benches & pedestals
    this.buildArchitecturalDecorations();

    // Register all collision walls with collision system
    this.collisionSystem.setWalls(this.wallBoxes);

    // Freeze world transforms for all static architectural geometry to eliminate CPU overhead in updateMatrixWorld
    this.sceneGroup.traverse((obj) => {
      obj.updateMatrix();
      obj.matrixAutoUpdate = false;
      obj.frustumCulled = true;
    });
  }

  private buildRoomStructure(room: RoomDefinition): void {
    const [cx, cy, cz] = room.center;
    const [w, h, d] = room.size;

    // 1. HISTORIC PALACE FLOORING
    let floorMat = room.floorType === 'marble' ? Materials.marbleFloor : Materials.parquetFloor;
    if (room.id === 'rotunda') {
      floorMat = Materials.rotundaFloor;
    }

    const floorGeo = new THREE.PlaneGeometry(w, d);
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.set(cx, 0, cz);
    floorMesh.receiveShadow = true;
    this.sceneGroup.add(floorMesh);

    // Dark walnut / marble perimeter floor border inlay
    const borderThick = 0.4;
    const borderGeoH = new THREE.BoxGeometry(w, 0.01, borderThick);
    const borderGeoV = new THREE.BoxGeometry(borderThick, 0.01, d);

    const bm1 = new THREE.Mesh(borderGeoH, Materials.darkMahogany);
    bm1.position.set(cx, 0.005, cz - d / 2 + borderThick / 2);
    this.sceneGroup.add(bm1);

    const bm2 = new THREE.Mesh(borderGeoH, Materials.darkMahogany);
    bm2.position.set(cx, 0.005, cz + d / 2 - borderThick / 2);
    this.sceneGroup.add(bm2);

    const bm3 = new THREE.Mesh(borderGeoV, Materials.darkMahogany);
    bm3.position.set(cx - w / 2 + borderThick / 2, 0.005, cz);
    this.sceneGroup.add(bm3);

    const bm4 = new THREE.Mesh(borderGeoV, Materials.darkMahogany);
    bm4.position.set(cx + w / 2 - borderThick / 2, 0.005, cz);
    this.sceneGroup.add(bm4);

    // Antique Gold Geometric Corner Floor Inlays for Grand Lobby
    if (room.id === 'lobby') {
      const inlaySize = 1.6;
      const inlayThick = 0.007;
      const goldInlayGeo = new THREE.BoxGeometry(inlaySize, inlayThick, inlaySize);
      const corners: [number, number][] = [
        [cx - w / 2 + 1.8, cz - d / 2 + 1.8],
        [cx + w / 2 - 1.8, cz - d / 2 + 1.8],
        [cx - w / 2 + 1.8, cz + d / 2 - 1.8],
        [cx + w / 2 - 1.8, cz + d / 2 - 1.8],
      ];
      for (const [ix, iz] of corners) {
        const inlay = new THREE.Mesh(goldInlayGeo, Materials.goldLeaf);
        inlay.rotation.y = Math.PI / 4;
        inlay.position.set(ix, 0.007, iz);
        this.sceneGroup.add(inlay);
      }
    }

    // 2. WARM CEILING PLASTER
    const ceilingGeo = new THREE.PlaneGeometry(w, d);
    const ceilingMesh = new THREE.Mesh(ceilingGeo, Materials.ceilingPlaster);
    ceilingMesh.rotation.x = Math.PI / 2;
    ceilingMesh.position.set(cx, h, cz);
    this.sceneGroup.add(ceilingMesh);

    // Coffered Ceiling Grid with Warm Plaster / Dark Wood & Aged Gold Leaf Trim
    if (room.id === 'lobby' || room.id === 'rotunda' || room.id === 'final_hall' || room.id.startsWith('hall_')) {
      const beamGridSize = 4.0;
      const beamThick = 0.38;
      const beamDepth = 0.32;
      const beamMat = room.id === 'lobby' ? Materials.darkMahogany : Materials.alabasterWall;

      // X Beams
      for (let bx = -w / 2 + beamGridSize; bx < w / 2; bx += beamGridSize) {
        const xBeamGeo = new THREE.BoxGeometry(beamThick, beamDepth, d);
        const xBeamMesh = new THREE.Mesh(xBeamGeo, beamMat);
        xBeamMesh.position.set(cx + bx, h - beamDepth / 2, cz);
        this.sceneGroup.add(xBeamMesh);

        // Gold Leaf Trim along underside edge of beam
        const trimGeo = new THREE.BoxGeometry(beamThick + 0.06, 0.06, d);
        const trimMesh = new THREE.Mesh(trimGeo, Materials.goldLeaf);
        trimMesh.position.set(cx + bx, h - beamDepth - 0.03, cz);
        this.sceneGroup.add(trimMesh);
      }

      // Z Beams
      for (let bz = -d / 2 + beamGridSize; bz < d / 2; bz += beamGridSize) {
        const zBeamGeo = new THREE.BoxGeometry(w, beamDepth, beamThick);
        const zBeamMesh = new THREE.Mesh(zBeamGeo, beamMat);
        zBeamMesh.position.set(cx, h - beamDepth / 2, cz + bz);
        this.sceneGroup.add(zBeamMesh);

        // Gold Leaf Trim along underside edge of beam
        const trimGeo = new THREE.BoxGeometry(w, 0.06, beamThick + 0.06);
        const trimMesh = new THREE.Mesh(trimGeo, Materials.goldLeaf);
        trimMesh.position.set(cx, h - beamDepth - 0.03, cz + bz);
        this.sceneGroup.add(trimMesh);
      }
    }

    // Central Circular Chandelier Ceiling Rosette / Medallion in spaces with chandeliers
    if (room.id === 'lobby' || room.id === 'rotunda' || room.id === 'final_hall' || room.id.startsWith('hall_')) {
      const rosetteGroup = new THREE.Group();
      rosetteGroup.position.set(cx, h - 0.02, cz);

      // Outer plaster rosette ring
      const ring1Geo = new THREE.CylinderGeometry(1.8, 1.8, 0.08, 32);
      const ring1Mesh = new THREE.Mesh(ring1Geo, Materials.carraraMarble);
      rosetteGroup.add(ring1Mesh);

      // Aged Gold Leaf inner ring
      const ring2Geo = new THREE.CylinderGeometry(1.4, 1.4, 0.12, 32);
      const ring2Mesh = new THREE.Mesh(ring2Geo, Materials.goldLeaf);
      rosetteGroup.add(ring2Mesh);

      // Inner plaster medallion core
      const ring3Geo = new THREE.CylinderGeometry(0.9, 0.9, 0.16, 24);
      const ring3Mesh = new THREE.Mesh(ring3Geo, Materials.carraraMarble);
      rosetteGroup.add(ring3Mesh);

      // Gold center star finial block
      const centerGeo = new THREE.SphereGeometry(0.35, 16, 16);
      const centerMesh = new THREE.Mesh(centerGeo, Materials.goldLeaf);
      centerMesh.position.y = -0.1;
      rosetteGroup.add(centerMesh);

      this.sceneGroup.add(rosetteGroup);
    }

    // Skylight cut-out decoration with gold leaf frame if applicable
    if (room.hasSkylight) {
      const skylightGeo = new THREE.PlaneGeometry(w * 0.45, d * 0.45);
      const skylightMesh = new THREE.Mesh(skylightGeo, Materials.glassSkylight);
      skylightMesh.rotation.x = Math.PI / 2;
      skylightMesh.position.set(cx, h - 0.05, cz);
      this.sceneGroup.add(skylightMesh);

      // Gold frame around skylight
      const frameGeo = new THREE.BoxGeometry(w * 0.47, 0.25, d * 0.47);
      const frameMesh = new THREE.Mesh(frameGeo, Materials.goldLeaf);
      frameMesh.position.set(cx, h - 0.12, cz);
      this.sceneGroup.add(frameMesh);
    }

    // 3. MULTI-TIERED HISTORIC CROWN CORNICE & BASEBOARDS
    this.buildRoomTrim(cx, cz, w, h, d);
  }

  private buildRoomTrim(cx: number, cz: number, w: number, h: number, d: number): void {
    // Multi-tiered Classical Entablature at ceiling edge
    // Tier 1: Architrave Base Beam (Carrara Marble)
    const archThick = 0.22;
    const archHeight = 0.20;
    const archGeoH = new THREE.BoxGeometry(w, archHeight, archThick);
    const archGeoV = new THREE.BoxGeometry(archThick, archHeight, d);

    const an = new THREE.Mesh(archGeoH, Materials.carraraMarble);
    an.position.set(cx, h - archHeight / 2, cz - d / 2 + archThick / 2);
    this.sceneGroup.add(an);

    const as = new THREE.Mesh(archGeoH, Materials.carraraMarble);
    as.position.set(cx, h - archHeight / 2, cz + d / 2 - archThick / 2);
    this.sceneGroup.add(as);

    const aw = new THREE.Mesh(archGeoV, Materials.carraraMarble);
    aw.position.set(cx - w / 2 + archThick / 2, h - archHeight / 2, cz);
    this.sceneGroup.add(aw);

    const ae = new THREE.Mesh(archGeoV, Materials.carraraMarble);
    ae.position.set(cx + w / 2 - archThick / 2, h - archHeight / 2, cz);
    this.sceneGroup.add(ae);

    // Tier 2: Frieze Band with Gold Leaf & Dentil Blocks
    const friezeThick = 0.26;
    const friezeHeight = 0.18;
    const friezeGeoH = new THREE.BoxGeometry(w, friezeHeight, friezeThick);
    const friezeGeoV = new THREE.BoxGeometry(friezeThick, friezeHeight, d);

    const fn = new THREE.Mesh(friezeGeoH, Materials.goldLeaf);
    fn.position.set(cx, h - archHeight - friezeHeight / 2, cz - d / 2 + friezeThick / 2);
    this.sceneGroup.add(fn);

    const fs = new THREE.Mesh(friezeGeoH, Materials.goldLeaf);
    fs.position.set(cx, h - archHeight - friezeHeight / 2, cz + d / 2 - friezeThick / 2);
    this.sceneGroup.add(fs);

    const fw = new THREE.Mesh(friezeGeoV, Materials.goldLeaf);
    fw.position.set(cx - w / 2 + friezeThick / 2, h - archHeight - friezeHeight / 2, cz);
    this.sceneGroup.add(fw);

    const fe = new THREE.Mesh(friezeGeoV, Materials.goldLeaf);
    fe.position.set(cx + w / 2 - friezeThick / 2, h - archHeight - friezeHeight / 2, cz);
    this.sceneGroup.add(fe);

    // Tier 3: Projecting Cornice Crown Trim
    const crownThick = 0.32;
    const crownHeight = 0.15;
    const crownGeoH = new THREE.BoxGeometry(w, crownHeight, crownThick);
    const crownGeoV = new THREE.BoxGeometry(crownThick, crownHeight, d);

    const cn = new THREE.Mesh(crownGeoH, Materials.carraraMarble);
    cn.position.set(cx, h - crownHeight / 2, cz - d / 2 + crownThick / 2);
    this.sceneGroup.add(cn);

    const cs = new THREE.Mesh(crownGeoH, Materials.carraraMarble);
    cs.position.set(cx, h - crownHeight / 2, cz + d / 2 - crownThick / 2);
    this.sceneGroup.add(cs);

    const cw = new THREE.Mesh(crownGeoV, Materials.carraraMarble);
    cw.position.set(cx - w / 2 + crownThick / 2, h - crownHeight / 2, cz);
    this.sceneGroup.add(cw);

    const ce = new THREE.Mesh(crownGeoV, Materials.carraraMarble);
    ce.position.set(cx + w / 2 - crownThick / 2, h - crownHeight / 2, cz);
    this.sceneGroup.add(ce);
  }

  /**
   * Builds a multi-layered historic 3D palace wall with physical depth:
   * 1. Lower Dado / Wainscoting
   * 2. Decorative Wall Panels
   * 3. Fluted Pilasters with Capitals
   * 4. Raised Panel Moldings
   * 5. Upper Frieze with Dentils
   * 6. Crown Cornice
   */
  private addWallSegment(
    minX: number, maxX: number,
    minZ: number, maxZ: number,
    height: number = 6,
    matType: 'alabaster' | 'navy' | 'burgundy' = 'alabaster'
  ): void {
    const isXAxis = Math.abs(maxX - minX) > Math.abs(maxZ - minZ);
    const wallThick = 0.35;
    const length = isXAxis ? Math.abs(maxX - minX) : Math.abs(maxZ - minZ);
    if (length < 0.1) return;

    const cx = (minX + maxX) / 2;
    const cz = (minZ + maxZ) / 2;
    const w = isXAxis ? length : wallThick;
    const d = isXAxis ? wallThick : length;

    // 1. BASE STRUCTURAL WALL MESH
    const wallGeo = new THREE.BoxGeometry(w, height, d);
    let mainMat: THREE.Material = Materials.alabasterWall;
    if (matType === 'navy') mainMat = Materials.galleryWallNavy;
    if (matType === 'burgundy') mainMat = Materials.galleryWallBurgundy;

    const mainWallMesh = new THREE.Mesh(wallGeo, mainMat);
    mainWallMesh.position.set(cx, height / 2, cz);
    mainWallMesh.castShadow = true;
    mainWallMesh.receiveShadow = true;
    this.sceneGroup.add(mainWallMesh);

    // Group for front & back architectural wall panel detailing
    const detailGroup = new THREE.Group();
    detailGroup.position.set(cx, 0, cz);
    if (!isXAxis) {
      detailGroup.rotation.y = Math.PI / 2;
    }

    // 2. LAYER 1: BASEBOARD & DADO / WAINSCOTING (Y: 0 to 1.15m)
    const baseHeight = 0.24;
    const baseThick = wallThick + 0.08;
    const baseGeo = new THREE.BoxGeometry(length, baseHeight, baseThick);
    const baseMat = matType === 'alabaster' ? Materials.carraraMarble : Materials.darkMahogany;
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.set(0, baseHeight / 2, 0);
    detailGroup.add(baseMesh);

    // Dado Rail / Chair Rail at Y = 1.14m (Protruding Gold & Walnut Moulding)
    const dadoRailGeo = new THREE.BoxGeometry(length + 0.02, 0.08, wallThick + 0.12);
    const dadoRailMesh = new THREE.Mesh(dadoRailGeo, Materials.goldLeaf);
    dadoRailMesh.position.set(0, 1.14, 0);
    detailGroup.add(dadoRailMesh);

    const dadoWoodGeo = new THREE.BoxGeometry(length + 0.04, 0.04, wallThick + 0.10);
    const dadoWoodMesh = new THREE.Mesh(dadoWoodGeo, Materials.darkMahogany);
    dadoWoodMesh.position.set(0, 1.08, 0);
    detailGroup.add(dadoWoodMesh);

    // 3. LAYER 2: 3D RAISED PANEL MOLDINGS ON MAIN WALL (Y: 1.2m to height - 0.8m)
    const panelAreaWidth = length;
    const panelHeight = Math.max(1.5, height - 2.2);
    const panelCenterY = 1.2 + panelHeight / 2;

    // Determine number of rectangular panels based on wall length
    const numPanels = Math.max(1, Math.floor(panelAreaWidth / 2.8));
    const panelWidth = (panelAreaWidth - (numPanels + 1) * 0.4) / numPanels;

    if (panelWidth > 0.8) {
      for (let offsetSide of [-1, 1]) {
        const sideZ = (wallThick / 2 + 0.02) * offsetSide;

        for (let p = 0; p < numPanels; p++) {
          const px = -panelAreaWidth / 2 + 0.4 + panelWidth / 2 + p * (panelWidth + 0.4);

          // Outer Raised Frame Molding (Aged Gold Leaf 3D Geometry Box Frame)
          const frameThick = 0.06;
          const frameDepth = 0.04;

          // Horizontal top & bottom frame bars
          const barHGeo = new THREE.BoxGeometry(panelWidth, frameThick, frameDepth);
          const topBar = new THREE.Mesh(barHGeo, Materials.goldLeaf);
          topBar.position.set(px, panelCenterY + panelHeight / 2 - frameThick / 2, sideZ);
          detailGroup.add(topBar);

          const botBar = new THREE.Mesh(barHGeo, Materials.goldLeaf);
          botBar.position.set(px, panelCenterY - panelHeight / 2 + frameThick / 2, sideZ);
          detailGroup.add(botBar);

          // Vertical left & right frame bars
          const barVGeo = new THREE.BoxGeometry(frameThick, panelHeight, frameDepth);
          const leftBar = new THREE.Mesh(barVGeo, Materials.goldLeaf);
          leftBar.position.set(px - panelWidth / 2 + frameThick / 2, panelCenterY, sideZ);
          detailGroup.add(leftBar);

          const rightBar = new THREE.Mesh(barVGeo, Materials.goldLeaf);
          rightBar.position.set(px + panelWidth / 2 - frameThick / 2, panelCenterY, sideZ);
          detailGroup.add(rightBar);

          // Secondary inner inset molding line for aristocrat double-paneling
          if (panelWidth > 1.4) {
            const innerMargin = 0.12;
            const inW = panelWidth - innerMargin * 2;
            const inH = panelHeight - innerMargin * 2;
            const inThick = 0.03;

            const inHGeo = new THREE.BoxGeometry(inW, inThick, frameDepth * 0.7);
            const inVGeo = new THREE.BoxGeometry(inThick, inH, frameDepth * 0.7);

            const inTop = new THREE.Mesh(inHGeo, Materials.goldLeaf);
            inTop.position.set(px, panelCenterY + inH / 2, sideZ);
            detailGroup.add(inTop);

            const inBot = new THREE.Mesh(inHGeo, Materials.goldLeaf);
            inBot.position.set(px, panelCenterY - inH / 2, sideZ);
            detailGroup.add(inBot);

            const inLeft = new THREE.Mesh(inVGeo, Materials.goldLeaf);
            inLeft.position.set(px - inW / 2, panelCenterY, sideZ);
            detailGroup.add(inLeft);

            const inRight = new THREE.Mesh(inVGeo, Materials.goldLeaf);
            inRight.position.set(px + inW / 2, panelCenterY, sideZ);
            detailGroup.add(inRight);
          }
        }
      }
    }

    // 4. LAYER 3: 3D CLASSICAL FLUTED PILASTERS WITH CAPITALS BETWEEN PANELS
    const pilasterSpacing = 3.6;
    const numPilasters = Math.max(2, Math.floor(length / pilasterSpacing) + 1);

    for (let i = 0; i < numPilasters; i++) {
      const pilasterX = -length / 2 + (i / (numPilasters - 1)) * length;

      for (let offsetSide of [-1, 1]) {
        const sideZ = (wallThick / 2 + 0.04) * offsetSide;

        // Pilaster Base Pedestal
        const pBaseGeo = new THREE.BoxGeometry(0.38, 1.15, 0.08);
        const pBaseMesh = new THREE.Mesh(pBaseGeo, Materials.carraraMarble);
        pBaseMesh.position.set(pilasterX, 0.575, sideZ);
        detailGroup.add(pBaseMesh);

        // Fluted Pilaster Shaft
        const shaftH = height - 1.95;
        const shaftGeo = new THREE.BoxGeometry(0.32, shaftH, 0.06);
        const shaftMesh = new THREE.Mesh(shaftGeo, Materials.carraraMarble);
        shaftMesh.position.set(pilasterX, 1.15 + shaftH / 2, sideZ);
        detailGroup.add(shaftMesh);

        // Gold Fluting Grooves on Shaft
        for (let g of [-0.08, 0, 0.08]) {
          const grooveGeo = new THREE.BoxGeometry(0.02, shaftH - 0.2, 0.07);
          const grooveMesh = new THREE.Mesh(grooveGeo, Materials.goldLeaf);
          grooveMesh.position.set(pilasterX + g, 1.15 + shaftH / 2, sideZ);
          detailGroup.add(grooveMesh);
        }

        // Classical Ionic Capital with Gold Scroll Rosette at top
        const capGeo = new THREE.BoxGeometry(0.46, 0.25, 0.12);
        const capMesh = new THREE.Mesh(capGeo, Materials.carraraMarble);
        capMesh.position.set(pilasterX, height - 0.65, sideZ);
        detailGroup.add(capMesh);

        const rosetteGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.14, 12);
        const rosetteMesh = new THREE.Mesh(rosetteGeo, Materials.goldLeaf);
        rosetteMesh.rotation.x = Math.PI / 2;
        rosetteMesh.position.set(pilasterX, height - 0.65, sideZ + 0.02 * offsetSide);
        detailGroup.add(rosetteMesh);
      }
    }

    // 5. LAYER 4: UPPER FRIEZE WITH 3D DENTILS & CROWN CORNICE
    const friezeY = height - 0.45;

    // Frieze band
    const friezeGeo = new THREE.BoxGeometry(length + 0.02, 0.22, wallThick + 0.12);
    const friezeMesh = new THREE.Mesh(friezeGeo, Materials.goldLeaf);
    friezeMesh.position.set(0, friezeY, 0);
    detailGroup.add(friezeMesh);

    // 3D Dentil Blocks along frieze top
    const dentilCount = Math.floor(length / 0.35);
    if (dentilCount > 2) {
      const dentilW = 0.08;
      const dentilH = 0.10;
      const dentilD = wallThick + 0.16;
      const dentilGeo = new THREE.BoxGeometry(dentilW, dentilH, dentilD);

      for (let dIdx = 0; dIdx < dentilCount; dIdx++) {
        const dx = -length / 2 + 0.2 + (dIdx / (dentilCount - 1)) * (length - 0.4);
        const dentilMesh = new THREE.Mesh(dentilGeo, Materials.carraraMarble);
        dentilMesh.position.set(dx, friezeY + 0.12, 0);
        detailGroup.add(dentilMesh);
      }
    }

    this.sceneGroup.add(detailGroup);

    // Register wall box for collision system
    const padding = 0.15;
    this.wallBoxes.push({
      minX: cx - w / 2 - padding,
      maxX: cx + w / 2 + padding,
      minZ: cz - d / 2 - padding,
      maxZ: cz + d / 2 + padding
    });
  }

  /**
   * Constructs a wall segment or bulkhead between specific Y vertical bounds (minY to maxY).
   * Essential for arch lintels, spandrel panels, and vertical transition bulkheads between differing ceiling heights.
   */
  private addWallSegmentAtY(
    minX: number, maxX: number,
    minZ: number, maxZ: number,
    minY: number, maxY: number,
    matType: 'alabaster' | 'navy' | 'burgundy' = 'alabaster'
  ): void {
    const isXAxis = Math.abs(maxX - minX) >= Math.abs(maxZ - minZ);
    const wallThick = 0.35;
    const length = isXAxis ? Math.abs(maxX - minX) : Math.abs(maxZ - minZ);
    const height = Math.abs(maxY - minY);
    if (length < 0.05 || height < 0.05) return;

    const cx = (minX + maxX) / 2;
    const cz = (minZ + maxZ) / 2;
    const cy = (minY + maxY) / 2;
    const w = isXAxis ? length : wallThick;
    const d = isXAxis ? wallThick : length;

    const wallGeo = new THREE.BoxGeometry(w, height, d);
    let mainMat: THREE.Material = Materials.alabasterWall;
    if (matType === 'navy') mainMat = Materials.galleryWallNavy;
    if (matType === 'burgundy') mainMat = Materials.galleryWallBurgundy;

    const mainWallMesh = new THREE.Mesh(wallGeo, mainMat);
    mainWallMesh.position.set(cx, cy, cz);
    mainWallMesh.castShadow = true;
    mainWallMesh.receiveShadow = true;
    this.sceneGroup.add(mainWallMesh);
  }

  private buildMuseumWalls(): void {
    // -----------------------------------------------------------------
    // 1. GRAND ENTRANCE VESTIBULE (Center 0,0,50 / Size 16x12: X -8..8, Z 44..56, H 6.0)
    // -----------------------------------------------------------------
    // North Wall at Z=56
    this.addWallSegment(-8, -2.5, 56, 56, 6.0, 'alabaster');
    this.addWallSegment(2.5, 8, 56, 56, 6.0, 'alabaster');
    this.addWallSegmentAtY(-2.5, 2.5, 56, 56, 4.5, 6.0, 'alabaster'); // Arch lintel above entrance
    // Side Walls
    this.addWallSegment(-8, -8, 44, 56, 6.0, 'alabaster');
    this.addWallSegment(8, 8, 44, 56, 6.0, 'alabaster');
    // South Wall at Z=44 (Boundary with Lobby)
    this.addWallSegment(-8, -3, 44, 44, 6.0, 'alabaster');
    this.addWallSegment(3, 8, 44, 44, 6.0, 'alabaster');
    this.addWallSegmentAtY(-3, 3, 44, 44, 4.8, 6.0, 'alabaster'); // Lintel spandrel above portal
    this.addWallSegmentAtY(-8, 8, 44, 44, 6.0, 7.5, 'alabaster'); // Vertical ceiling transition bulkhead up to Lobby ceiling

    // -----------------------------------------------------------------
    // 2. GRAND CEREMONIAL RECEPTION LOBBY (Center 0,0,32 / Size 24x24: X -12..12, Z 20..44, H 7.5)
    // -----------------------------------------------------------------
    // North Wall at Z=44 (Covering full lobby width X -12..12)
    this.addWallSegment(-12, -8, 44, 44, 7.5, 'alabaster');
    this.addWallSegment(8, 12, 44, 44, 7.5, 'alabaster');
    // East & West Side Walls (Z 20..44)
    this.addWallSegment(-12, -12, 20, 44, 7.5, 'alabaster');
    this.addWallSegment(12, 12, 20, 44, 7.5, 'alabaster');
    // South Wall at Z=20 (Boundary with Processional Gallery)
    this.addWallSegment(-12, -6, 20, 20, 7.5, 'alabaster');
    this.addWallSegment(6, 12, 20, 20, 7.5, 'alabaster');
    this.addWallSegmentAtY(-6, 6, 20, 20, 5.2, 6.5, 'alabaster'); // Lintel spandrel above portal
    this.addWallSegmentAtY(-6, 6, 20, 20, 6.5, 7.5, 'alabaster'); // Vertical ceiling transition bulkhead

    // -----------------------------------------------------------------
    // 3. ROYAL PROCESSIONAL GALLERY (Center 0,0,15.5 / Size 12x9: X -6..6, Z 11..20, H 6.5)
    // -----------------------------------------------------------------
    // Side Walls at X=-6 and X=6
    this.addWallSegment(-6, -6, 11, 20, 6.5, 'alabaster');
    this.addWallSegment(6, 6, 11, 20, 6.5, 'alabaster');
    // South Wall at Z=11 (Boundary with Rotunda)
    this.addWallSegmentAtY(-6, 6, 11, 11, 5.2, 6.5, 'alabaster'); // Lintel spandrel above portal
    this.addWallSegmentAtY(-6, 6, 11, 11, 6.5, 8.0, 'alabaster'); // Vertical ceiling transition bulkhead

    // -----------------------------------------------------------------
    // 4. SOVEREIGN CENTRAL ROTUNDA (Center 0,0,0 / Size 26x22: X -13..13, Z -11..11, H 8.0)
    // -----------------------------------------------------------------
    // North Wall at Z=-11
    this.addWallSegment(-13, -6, -11, -11, 8.0, 'alabaster');
    this.addWallSegment(6, 13, -11, -11, 8.0, 'alabaster');
    this.addWallSegmentAtY(-6, 6, -11, -11, 5.2, 6.0, 'alabaster'); // Lintel spandrel
    this.addWallSegmentAtY(-6, 6, -11, -11, 6.0, 8.0, 'alabaster'); // Ceiling transition bulkhead
    // South Wall at Z=11
    this.addWallSegment(-13, -6, 11, 11, 8.0, 'alabaster');
    this.addWallSegment(6, 13, 11, 11, 8.0, 'alabaster');
    // West Wall at X=-13
    this.addWallSegment(-13, -13, 4, 11, 8.0, 'alabaster');
    this.addWallSegment(-13, -13, -11, -4, 8.0, 'alabaster');
    this.addWallSegmentAtY(-13, -13, -4, 4, 5.0, 5.5, 'alabaster'); // Lintel spandrel
    this.addWallSegmentAtY(-13, -13, -4, 4, 5.5, 8.0, 'alabaster'); // Ceiling transition bulkhead
    // East Wall at X=13
    this.addWallSegment(13, 13, 4, 11, 8.0, 'alabaster');
    this.addWallSegment(13, 13, -11, -4, 8.0, 'alabaster');
    this.addWallSegmentAtY(13, 13, -4, 4, 5.0, 5.5, 'alabaster'); // Lintel spandrel
    this.addWallSegmentAtY(13, 13, -4, 4, 5.5, 8.0, 'alabaster'); // Ceiling transition bulkhead

    // -----------------------------------------------------------------
    // 5. WEST GALLERY CORRIDOR (Center -16.5, 0, -2.5 / Size X -20..-13, Z -25..20, H 5.5)
    // -----------------------------------------------------------------
    // North Wall at Z=20
    this.addWallSegment(-20, -13, 20, 20, 5.5, 'alabaster');
    // South Wall at Z=-25
    this.addWallSegment(-20, -13, -25, -25, 5.5, 'alabaster');
    // East Wall at X=-13 (Outer segments closing corridor where not connected to Rotunda)
    this.addWallSegment(-13, -13, 11, 20, 5.5, 'alabaster');
    this.addWallSegment(-13, -13, -25, -11, 5.5, 'alabaster');
    // West Wall at X=-20 (Middle segment between Hall 01 and Hall 02)
    this.addWallSegment(-20, -20, -5, 0, 5.5, 'alabaster');

    // -----------------------------------------------------------------
    // 6. HALL 01: THE SEVEN SEALS (Center -30, 0, 10 / Size X -40..-20, Z 0..20, H 6.0)
    // -----------------------------------------------------------------
    this.addWallSegment(-40, -20, 0, 0, 6.0, 'navy');
    this.addWallSegment(-40, -20, 20, 20, 6.0, 'navy');
    this.addWallSegment(-40, -40, 0, 20, 6.0, 'navy');
    this.addWallSegment(-20, -20, 0, 6, 6.0, 'navy');
    this.addWallSegment(-20, -20, 14, 20, 6.0, 'navy');
    this.addWallSegmentAtY(-20, -20, 6, 14, 4.8, 5.5, 'navy'); // Lintel spandrel
    this.addWallSegmentAtY(-20, -20, 0, 20, 5.5, 6.0, 'navy'); // Ceiling transition bulkhead up to Hall 01 height

    // -----------------------------------------------------------------
    // 7. HALL 02: THE SEVEN TRUMPETS (Center -30, 0, -15 / Size X -40..-20, Z -25..-5, H 6.0)
    // -----------------------------------------------------------------
    this.addWallSegment(-40, -20, -25, -25, 6.0, 'burgundy');
    this.addWallSegment(-40, -20, -5, -5, 6.0, 'burgundy');
    this.addWallSegment(-40, -40, -25, -5, 6.0, 'burgundy');
    this.addWallSegment(-20, -20, -25, -19, 6.0, 'burgundy');
    this.addWallSegment(-20, -20, -11, -5, 6.0, 'burgundy');
    this.addWallSegmentAtY(-20, -20, -19, -11, 4.8, 5.5, 'burgundy'); // Lintel spandrel
    this.addWallSegmentAtY(-20, -20, -25, -5, 5.5, 6.0, 'burgundy'); // Ceiling transition bulkhead

    // -----------------------------------------------------------------
    // 8. EAST GALLERY CORRIDOR (Center 16.5, 0, -2.5 / Size X 13..20, Z -25..20, H 5.5)
    // -----------------------------------------------------------------
    // North Wall at Z=20
    this.addWallSegment(13, 20, 20, 20, 5.5, 'alabaster');
    // South Wall at Z=-25
    this.addWallSegment(13, 20, -25, -25, 5.5, 'alabaster');
    // West Wall at X=13 (Outer segments)
    this.addWallSegment(13, 13, 11, 20, 5.5, 'alabaster');
    this.addWallSegment(13, 13, -25, -11, 5.5, 'alabaster');
    // East Wall at X=20 (Middle segment between Hall 03 and Hall 04)
    this.addWallSegment(20, 20, -5, 0, 5.5, 'alabaster');

    // -----------------------------------------------------------------
    // 9. HALL 03: THE HEAVENLY VISION (Center 30, 0, 10 / Size X 20..40, Z 0..20, H 6.0)
    // -----------------------------------------------------------------
    this.addWallSegment(20, 40, 0, 0, 6.0, 'navy');
    this.addWallSegment(20, 40, 20, 20, 6.0, 'navy');
    this.addWallSegment(40, 40, 0, 20, 6.0, 'navy');
    this.addWallSegment(20, 20, 0, 6, 6.0, 'navy');
    this.addWallSegment(20, 20, 14, 20, 6.0, 'navy');
    this.addWallSegmentAtY(20, 20, 6, 14, 4.8, 5.5, 'navy'); // Lintel spandrel
    this.addWallSegmentAtY(20, 20, 0, 20, 5.5, 6.0, 'navy'); // Ceiling transition bulkhead

    // -----------------------------------------------------------------
    // 10. HALL 04: THE SEVEN BOWLS (Center 30, 0, -15 / Size X 20..40, Z -25..-5, H 6.0)
    // -----------------------------------------------------------------
    this.addWallSegment(20, 40, -25, -25, 6.0, 'burgundy');
    this.addWallSegment(20, 40, -5, -5, 6.0, 'burgundy');
    this.addWallSegment(40, 40, -25, -5, 6.0, 'burgundy');
    this.addWallSegment(20, 20, -25, -19, 6.0, 'burgundy');
    this.addWallSegment(20, 20, -11, -5, 6.0, 'burgundy');
    this.addWallSegmentAtY(20, 20, -19, -11, 4.8, 5.5, 'burgundy'); // Lintel spandrel
    this.addWallSegmentAtY(20, 20, -25, -5, 5.5, 6.0, 'burgundy'); // Ceiling transition bulkhead

    // -----------------------------------------------------------------
    // 11. STATE NORTH HALLWAY (Center 0,0,-20 / Size X -6..6, Z -29..-11, H 6.0)
    // -----------------------------------------------------------------
    this.addWallSegment(-6, -6, -29, -11, 6.0, 'alabaster');
    this.addWallSegment(6, 6, -29, -11, 6.0, 'alabaster');

    // -----------------------------------------------------------------
    // 12. HALL 05: THE FINAL VICTORY (Center -15, 0, -38 / Size X -26..-4, Z -47..-29, H 6.0)
    // -----------------------------------------------------------------
    this.addWallSegment(-26, -4, -47, -47, 6.0, 'navy');
    this.addWallSegment(-26, -4, -29, -29, 6.0, 'navy');
    this.addWallSegment(-26, -26, -47, -29, 6.0, 'navy');
    this.addWallSegment(-4, -4, -47, -42, 6.0, 'navy');
    this.addWallSegment(-4, -4, -34, -29, 6.0, 'navy');
    this.addWallSegmentAtY(-4, -4, -42, -34, 4.8, 6.0, 'navy'); // Lintel spandrel

    // -----------------------------------------------------------------
    // 13. HALL 06: THE NEW JERUSALEM (Center 15, 0, -38 / Size X 4..26, Z -47..-29, H 6.0)
    // -----------------------------------------------------------------
    this.addWallSegment(4, 26, -47, -47, 6.0, 'burgundy');
    this.addWallSegment(4, 26, -29, -29, 6.0, 'burgundy');
    this.addWallSegment(26, 26, -47, -29, 6.0, 'burgundy');
    this.addWallSegment(4, 4, -47, -42, 6.0, 'burgundy');
    this.addWallSegment(4, 4, -34, -29, 6.0, 'burgundy');
    this.addWallSegmentAtY(4, 4, -42, -34, 4.8, 6.0, 'burgundy'); // Lintel spandrel

    // -----------------------------------------------------------------
    // 14. NORTH GALLERY SPINE (Center 0, 0, -38 / Size X -4..4, Z -47..-29, H 6.0)
    // -----------------------------------------------------------------
    // South arch transition at Z=-29
    this.addWallSegment(-6, -4, -29, -29, 6.0, 'alabaster');
    this.addWallSegment(4, 6, -29, -29, 6.0, 'alabaster');
    this.addWallSegmentAtY(-4, 4, -29, -29, 5.2, 6.0, 'alabaster');
    // North arch transition at Z=-47
    this.addWallSegment(-6, -4, -47, -47, 6.0, 'alabaster');
    this.addWallSegment(4, 6, -47, -47, 6.0, 'alabaster');
    this.addWallSegmentAtY(-4, 4, -47, -47, 5.2, 6.0, 'alabaster');

    // -----------------------------------------------------------------
    // 15. CORRIDOR OF REVELATION (Center 0, 0, -53 / Size X -6..6, Z -59..-47, H 6.0)
    // -----------------------------------------------------------------
    this.addWallSegment(-6, -6, -59, -47, 6.0, 'alabaster');
    this.addWallSegment(6, 6, -59, -47, 6.0, 'alabaster');
    // Boundary with Final Hall at Z=-59
    this.addWallSegment(-12, -4, -59, -59, 7.0, 'navy');
    this.addWallSegment(4, 12, -59, -59, 7.0, 'navy');
    this.addWallSegmentAtY(-4, 4, -59, -59, 5.2, 6.0, 'navy'); // Lintel spandrel
    this.addWallSegmentAtY(-6, 6, -59, -59, 6.0, 7.0, 'navy'); // Ceiling transition bulkhead up to Final Hall ceiling

    // -----------------------------------------------------------------
    // 16. FINAL REVELATION THRONE GALLERY (Center 0, 0, -68 / Size X -12..12, Z -77..-59, H 7.0)
    // -----------------------------------------------------------------
    this.addWallSegment(-12, -12, -77, -59, 7.0, 'navy');
    this.addWallSegment(12, 12, -77, -59, 7.0, 'navy');
    // North wall at Z=-77
    this.addWallSegment(-12, -4, -77, -77, 7.0, 'navy');
    this.addWallSegment(4, 12, -77, -77, 7.0, 'navy');
    this.addWallSegmentAtY(-4, 4, -77, -77, 5.2, 6.0, 'navy'); // Lintel spandrel
    this.addWallSegmentAtY(-10, 10, -77, -77, 6.0, 7.0, 'navy'); // Ceiling transition bulkhead

    // -----------------------------------------------------------------
    // 17. PALACE GARDEN TERRACE & VISTA (Center 0, 0, -83 / Size X -10..10, Z -89..-77, H 6.0)
    // -----------------------------------------------------------------
    this.addWallSegment(-10, -10, -89, -77, 6.0, 'alabaster');
    this.addWallSegment(10, 10, -89, -77, 6.0, 'alabaster');
    this.addWallSegment(-10, 10, -89, -89, 6.0, 'alabaster');

    // -----------------------------------------------------------------
    // 18. COMPLETE EXTERIOR BUILDING ENVELOPE (Outer Masonry Backstop Shell)
    // -----------------------------------------------------------------
    this.buildOuterBuildingEnvelope();
  }

  /**
   * Constructs a complete exterior building shell around the entire museum footprint.
   * Guarantees 0% background leakage under any camera angle or transition.
   */
  private buildOuterBuildingEnvelope(): void {
    const minX = -42;
    const maxX = 42;
    const minZ = -91;
    const maxZ = 58;
    const wallH = 9.5;
    const shellMat = Materials.alabasterWall;

    // West Outer Wall
    const westGeo = new THREE.BoxGeometry(0.5, wallH, maxZ - minZ);
    const westMesh = new THREE.Mesh(westGeo, shellMat);
    westMesh.position.set(minX - 0.25, wallH / 2, (minZ + maxZ) / 2);
    this.sceneGroup.add(westMesh);

    // East Outer Wall
    const eastGeo = new THREE.BoxGeometry(0.5, wallH, maxZ - minZ);
    const eastMesh = new THREE.Mesh(eastGeo, shellMat);
    eastMesh.position.set(maxX + 0.25, wallH / 2, (minZ + maxZ) / 2);
    this.sceneGroup.add(eastMesh);

    // North Outer Wall
    const northGeo = new THREE.BoxGeometry(maxX - minX + 1.0, wallH, 0.5);
    const northMesh = new THREE.Mesh(northGeo, shellMat);
    northMesh.position.set(0, wallH / 2, minZ - 0.25);
    this.sceneGroup.add(northMesh);

    // South Outer Wall
    const southGeo = new THREE.BoxGeometry(maxX - minX + 1.0, wallH, 0.5);
    const southMesh = new THREE.Mesh(southGeo, shellMat);
    southMesh.position.set(0, wallH / 2, maxZ + 0.25);
    this.sceneGroup.add(southMesh);

    // Upper Solid Roof Deck
    const roofGeo = new THREE.BoxGeometry(maxX - minX + 2.0, 0.5, maxZ - minZ + 2.0);
    const roofMesh = new THREE.Mesh(roofGeo, Materials.ceilingPlaster);
    roofMesh.position.set(0, wallH + 0.25, (minZ + maxZ) / 2);
    this.sceneGroup.add(roofMesh);
  }

  private buildArchitecturalDecorations(): void {
    // 1. CEREMONIAL PALACE CARPETS & RUNNERS
    // Grand Lobby Ceremonial Woven Rug (12m x 16m)
    const lobbyRug = this.createCeremonialRug(12, 16);
    lobbyRug.position.set(0, 0.006, 32);
    this.sceneGroup.add(lobbyRug);

    // Entrance Vestibule Runner (6m x 8m)
    const entranceRug = this.createCeremonialRug(6, 8);
    entranceRug.position.set(0, 0.006, 50);
    this.sceneGroup.add(entranceRug);

    // Corridors Runners
    const westRug = this.createCeremonialRug(3, 6);
    westRug.position.set(-20, 0.006, 0);
    this.sceneGroup.add(westRug);

    const eastRug = this.createCeremonialRug(3, 6);
    eastRug.position.set(20, 0.006, 0);
    this.sceneGroup.add(eastRug);

    const northRug = this.createCeremonialRug(4, 10);
    northRug.position.set(0, 0.006, -20);
    this.sceneGroup.add(northRug);

    const passageRug = this.createCeremonialRug(4, 8);
    passageRug.position.set(0, 0.006, -48);
    this.sceneGroup.add(passageRug);

    const finalRug = this.createCeremonialRug(6, 12);
    finalRug.position.set(0, 0.006, -62);
    this.sceneGroup.add(finalRug);

    // 2. GRAND LOBBY SPECTACULAR CENTRAL COMPOSITION
    // Ornate Walnut & Gold Center Table with Monumental Classical Bronze & Stone Urn
    const centerComp = this.createCenterTableWithUrn();
    centerComp.position.set(0, 0, 32);
    this.sceneGroup.add(centerComp);

    // Collision box around center table (Radius 1.3m leaves >10m clear aisle on both sides)
    this.collisionSystem.addWall({
      minX: -1.3, maxX: 1.3,
      minZ: 30.7, maxZ: 33.3
    });

    // 3. CLASSICAL FLUTED MARBLE COLONNADE IN GRAND LOBBY
    const lobbyColumns = [
      [-8, 38], [8, 38],
      [-8, 32], [8, 32],
      [-8, 26], [8, 26],
    ];
    for (const [px, pz] of lobbyColumns) {
      const colGroup = this.createClassicalColumn(8.5, 0.55);
      colGroup.position.set(px, 0, pz);
      this.sceneGroup.add(colGroup);

      this.collisionSystem.addWall({
        minX: px - 0.75, maxX: px + 0.75,
        minZ: pz - 0.75, maxZ: pz + 0.75
      });
    }

    // 4. CLASSICAL FLUTED MARBLE COLONNADE IN CENTRAL ROTUNDA
    const rotundaPillars = [
      [-8, -5], [8, -5], [-8, 5], [8, 5]
    ];
    for (const [px, pz] of rotundaPillars) {
      const colGroup = this.createClassicalColumn(9.5, 0.60);
      colGroup.position.set(px, 0, pz);
      this.sceneGroup.add(colGroup);

      this.collisionSystem.addWall({
        minX: px - 0.8, maxX: px + 0.8,
        minZ: pz - 0.8, maxZ: pz + 0.8
      });
    }

    // 5. CENTRAL ROTUNDA CORNER PEDESTALS WITH ANTIQUE BRONZE BUSTS
    const rotundaBustPositions: [number, number][] = [
      [-10, 8], [10, 8], [-10, -8], [10, -8]
    ];
    for (const [px, pz] of rotundaBustPositions) {
      const pedGroup = this.createPedestalWithBust();
      pedGroup.position.set(px, 0, pz);
      this.sceneGroup.add(pedGroup);

      this.collisionSystem.addWall({
        minX: px - 0.8, maxX: px + 0.8,
        minZ: pz - 0.8, maxZ: pz + 0.8
      });
    }

    // 6. ARCHED STONE WALL NICHES WITH CLASSICAL BRONZE URNS & STATUETTES
    const nicheSpecs: { pos: [number, number, number]; rotY: number }[] = [
      // Grand Lobby Walls
      { pos: [-11.8, 2.2, 26], rotY: Math.PI / 2 },
      { pos: [-11.8, 2.2, 38], rotY: Math.PI / 2 },
      { pos: [11.8, 2.2, 26], rotY: -Math.PI / 2 },
      { pos: [11.8, 2.2, 38], rotY: -Math.PI / 2 },

      // Exhibition Halls Non-Artwork Wall Piers
      { pos: [-39.8, 2.2, 10], rotY: Math.PI / 2 },    // Hall 01
      { pos: [-39.8, 2.2, -15], rotY: Math.PI / 2 },   // Hall 02
      { pos: [39.8, 2.2, 10], rotY: -Math.PI / 2 },    // Hall 03
      { pos: [39.8, 2.2, -15], rotY: -Math.PI / 2 },   // Hall 04
      { pos: [-25.8, 2.2, -38], rotY: Math.PI / 2 },   // Hall 05
      { pos: [25.8, 2.2, -38], rotY: -Math.PI / 2 },   // Hall 06

      // State North Hallway
      { pos: [-5.8, 2.2, -16], rotY: Math.PI / 2 },
      { pos: [5.8, 2.2, -16], rotY: -Math.PI / 2 },
    ];

    for (const n of nicheSpecs) {
      const nicheGroup = this.createArchedWallNiche();
      nicheGroup.position.set(n.pos[0], n.pos[1], n.pos[2]);
      nicheGroup.rotation.y = n.rotY;
      this.sceneGroup.add(nicheGroup);
    }

    // 7. MONUMENTAL CLASSICAL PORTALS WITH PEDIMENTS & DEEP VELVET DRAPERY
    const portals: { pos: [number, number, number]; width: number; height: number; rotY: number; hasCurtains?: boolean }[] = [
      { pos: [0, 0, 44], width: 6.0, height: 4.8, rotY: 0, hasCurtains: true },         // Entrance -> Lobby
      { pos: [0, 0, 20], width: 8.0, height: 5.2, rotY: 0, hasCurtains: true },         // Lobby -> Processional Gallery
      { pos: [0, 0, 11], width: 8.0, height: 5.2, rotY: 0, hasCurtains: true },         // Processional Gallery -> Rotunda
      { pos: [-13, 0, 0], width: 8.0, height: 5.0, rotY: Math.PI / 2, hasCurtains: true },// Rotunda -> West Corridor
      { pos: [13, 0, 0], width: 8.0, height: 5.0, rotY: Math.PI / 2, hasCurtains: true }, // Rotunda -> East Corridor
      { pos: [-20, 0, 10], width: 8.0, height: 4.8, rotY: Math.PI / 2 },// West -> Hall 01
      { pos: [-20, 0, -15], width: 8.0, height: 4.8, rotY: Math.PI / 2 },// West -> Hall 02
      { pos: [20, 0, 10], width: 8.0, height: 4.8, rotY: Math.PI / 2 },// East -> Hall 03
      { pos: [20, 0, -15], width: 8.0, height: 4.8, rotY: Math.PI / 2 },// East -> Hall 04
      { pos: [0, 0, -11], width: 8.0, height: 5.2, rotY: 0 },        // Rotunda -> North Hallway
      { pos: [-4, 0, -38], width: 8.0, height: 4.8, rotY: Math.PI / 2 },// Spine -> Hall 05
      { pos: [4, 0, -38], width: 8.0, height: 4.8, rotY: Math.PI / 2 },// Spine -> Hall 06
      { pos: [0, 0, -59], width: 8.0, height: 5.2, rotY: 0, hasCurtains: true },        // Corridor -> Final Hall
      { pos: [0, 0, -77], width: 8.0, height: 5.2, rotY: 0 },        // Final Hall -> Exit Terrace
    ];

    for (const p of portals) {
      const portalGroup = this.createMonumentalPortal(p.width, p.height, p.hasCurtains);
      portalGroup.position.set(p.pos[0], p.pos[1], p.pos[2]);
      portalGroup.rotation.y = p.rotY;
      this.sceneGroup.add(portalGroup);
    }

    // 8. PALACE CARVED WALNUT CONSOLE TABLES & GOLD-FRAMED ARCHED MIRRORS
    const consoleLocations: { pos: [number, number, number]; rotY: number }[] = [
      { pos: [-11.6, 0, 32], rotY: Math.PI / 2 },    // Lobby West Wall
      { pos: [11.6, 0, 32], rotY: -Math.PI / 2 },   // Lobby East Wall
      { pos: [-7.6, 0, 50], rotY: Math.PI / 2 },     // Entrance Vestibule West Wall
      { pos: [7.6, 0, 50], rotY: -Math.PI / 2 },    // Entrance Vestibule East Wall
      { pos: [-20, 0, 3.8], rotY: Math.PI },        // West Corridor North Wall
      { pos: [-20, 0, -3.8], rotY: 0 },             // West Corridor South Wall
      { pos: [20, 0, 3.8], rotY: Math.PI },         // East Corridor North Wall
      { pos: [20, 0, -3.8], rotY: 0 },              // East Corridor South Wall
      { pos: [-5.6, 0, -20], rotY: Math.PI / 2 },   // North Hallway West Wall
      { pos: [5.6, 0, -20], rotY: -Math.PI / 2 },   // North Hallway East Wall
    ];

    for (const c of consoleLocations) {
      const consoleGroup = this.createConsoleTableAndMirror();
      consoleGroup.position.set(c.pos[0], c.pos[1], c.pos[2]);
      consoleGroup.rotation.y = c.rotY;
      this.sceneGroup.add(consoleGroup);
    }

    // 9. ROYAL VELVET UPHOLSTERED BENCHES & RESTRAINED EXHIBITION RUGS
    const benchCenters: [number, number][] = [
      [-30, 10],   // Hall 01
      [-30, -15],  // Hall 02
      [30, 10],    // Hall 03
      [30, -15],   // Hall 04
      [-15, -38],  // Hall 05
      [15, -38],   // Hall 06
    ];

    for (const [bx, bz] of benchCenters) {
      // Gallery Bench Rug
      const benchRug = this.createCeremonialRug(3.2, 1.8);
      benchRug.position.set(bx, 0.006, bz);
      this.sceneGroup.add(benchRug);

      // Bench
      const benchGroup = this.createPalaceBench();
      benchGroup.position.set(bx, 0, bz);
      this.sceneGroup.add(benchGroup);

      // Collision box for bench
      this.collisionSystem.addWall({
        minX: bx - 1.4, maxX: bx + 1.4,
        minZ: bz - 0.7, maxZ: bz + 0.7
      });
    }

    // Benches in Grand Lobby Colonnade Bays
    const lobbyBenches: [number, number, number, number][] = [
      [-8.2, 0, 28, Math.PI / 2], [8.2, 0, 28, -Math.PI / 2],
      [-8.2, 0, 36, Math.PI / 2], [8.2, 0, 36, -Math.PI / 2],
    ];
    for (const [lbx, lby, lbz, lrot] of lobbyBenches) {
      const benchGroup = this.createPalaceBench();
      benchGroup.position.set(lbx, lby, lbz);
      benchGroup.rotation.y = lrot;
      this.sceneGroup.add(benchGroup);

      this.collisionSystem.addWall({
        minX: lbx - 0.7, maxX: lbx + 0.7,
        minZ: lbz - 1.4, maxZ: lbz + 1.4
      });
    }

    // Benches in Final Revelation Throne Gallery
    const finalBenches: [number, number, number][] = [
      [-8, 0, -62], [8, 0, -62]
    ];
    for (const [fx, fy, fz] of finalBenches) {
      const benchGroup = this.createPalaceBench();
      benchGroup.position.set(fx, fy, fz);
      this.sceneGroup.add(benchGroup);

      this.collisionSystem.addWall({
        minX: fx - 1.4, maxX: fx + 1.4,
        minZ: fz - 0.7, maxZ: fz + 0.7
      });
    }

    // 10. GRAND ENTRANCE BRASS DEDICATION PLAQUE
    const plaqueGeo = new THREE.BoxGeometry(3.5, 1.4, 0.12);
    const plaqueMesh = new THREE.Mesh(plaqueGeo, Materials.brassPlaque);
    plaqueMesh.position.set(0, 2.5, 55.9);
    this.sceneGroup.add(plaqueMesh);

    // Frame around brass plaque
    const plaqueFrameGeo = new THREE.BoxGeometry(3.7, 1.6, 0.16);
    const plaqueFrameMesh = new THREE.Mesh(plaqueFrameGeo, Materials.goldLeaf);
    plaqueFrameMesh.position.set(0, 2.5, 55.85);
    this.sceneGroup.add(plaqueFrameMesh);
  }

  /**
   * Creates a woven ceremonial rug mesh positioned slightly above the floor.
   */
  private createCeremonialRug(width: number, depth: number): THREE.Mesh {
    const geo = new THREE.PlaneGeometry(width, depth);
    const mesh = new THREE.Mesh(geo, Materials.royalCarpet);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.006;
    mesh.receiveShadow = true;
    return mesh;
  }

  /**
   * Creates a classical sculpted stone & bronze urn with gold laurel handles.
   */
  private createClassicalUrn(scale: number = 1.0): THREE.Group {
    const group = new THREE.Group();

    // Plinth base
    const baseGeo = new THREE.BoxGeometry(0.5 * scale, 0.12 * scale, 0.5 * scale);
    const baseMesh = new THREE.Mesh(baseGeo, Materials.carraraMarble);
    baseMesh.position.y = 0.06 * scale;
    group.add(baseMesh);

    // Stem pedestal
    const stemGeo = new THREE.CylinderGeometry(0.12 * scale, 0.22 * scale, 0.20 * scale, 16);
    const stemMesh = new THREE.Mesh(stemGeo, Materials.goldLeaf);
    stemMesh.position.y = 0.22 * scale;
    group.add(stemMesh);

    // Fluted Bronze Bowl Body
    const bowlGeo = new THREE.CylinderGeometry(0.48 * scale, 0.22 * scale, 0.55 * scale, 24);
    const bowlMesh = new THREE.Mesh(bowlGeo, Materials.antiqueBronze);
    bowlMesh.position.y = 0.595 * scale;
    group.add(bowlMesh);

    // Gold Leaf Laurel Wreath Band around bowl
    const bandGeo = new THREE.CylinderGeometry(0.50 * scale, 0.50 * scale, 0.10 * scale, 24);
    const bandMesh = new THREE.Mesh(bandGeo, Materials.goldLeaf);
    bandMesh.position.y = 0.72 * scale;
    group.add(bandMesh);

    // Flared Neck & Molding Rim
    const rimGeo = new THREE.CylinderGeometry(0.42 * scale, 0.48 * scale, 0.18 * scale, 24);
    const rimMesh = new THREE.Mesh(rimGeo, Materials.carraraMarble);
    rimMesh.position.y = 0.86 * scale;
    group.add(rimMesh);

    // 2 Gold Leaf Volute Handles
    for (let side of [-1, 1]) {
      const handleGeo = new THREE.TorusGeometry(0.22 * scale, 0.04 * scale, 12, 24, Math.PI);
      const handleMesh = new THREE.Mesh(handleGeo, Materials.goldLeaf);
      handleMesh.rotation.z = side > 0 ? -Math.PI / 2 : Math.PI / 2;
      handleMesh.position.set(side * 0.48 * scale, 0.65 * scale, 0);
      group.add(handleMesh);
    }

    return group;
  }

  /**
   * Creates the Grand Lobby centerpiece table with monumental classical urn.
   */
  private createCenterTableWithUrn(): THREE.Group {
    const group = new THREE.Group();

    // Round Dark Walnut Table Base
    const baseGeo = new THREE.CylinderGeometry(0.6, 0.8, 0.2, 24);
    const baseMesh = new THREE.Mesh(baseGeo, Materials.darkMahogany);
    baseMesh.position.y = 0.1;
    group.add(baseMesh);

    // Central Carved Walnut Pedestal Shaft
    const shaftGeo = new THREE.CylinderGeometry(0.25, 0.35, 0.58, 16);
    const shaftMesh = new THREE.Mesh(shaftGeo, Materials.darkMahogany);
    shaftMesh.position.y = 0.49;
    group.add(shaftMesh);

    const goldRingGeo = new THREE.TorusGeometry(0.32, 0.04, 12, 24);
    const goldRingMesh = new THREE.Mesh(goldRingGeo, Materials.goldLeaf);
    goldRingMesh.rotation.x = Math.PI / 2;
    goldRingMesh.position.y = 0.49;
    group.add(goldRingMesh);

    // Polished Carrara Marble Top Slab
    const topGeo = new THREE.CylinderGeometry(1.1, 1.1, 0.10, 32);
    const topMesh = new THREE.Mesh(topGeo, Materials.carraraMarble);
    topMesh.position.y = 0.83;
    group.add(topMesh);

    // Gold Moulding Rim
    const rimGeo = new THREE.TorusGeometry(1.12, 0.03, 12, 32);
    const rimMesh = new THREE.Mesh(rimGeo, Materials.goldLeaf);
    rimMesh.rotation.x = Math.PI / 2;
    rimMesh.position.y = 0.83;
    group.add(rimMesh);

    // Classical Urn resting physically on top of table slab at y = 0.88m
    const urn = this.createClassicalUrn(1.1);
    urn.position.y = 0.88;
    group.add(urn);

    return group;
  }

  /**
   * Creates an arched stone wall niche embedded with a bronze urn or sculpture.
   */
  private createArchedWallNiche(): THREE.Group {
    const group = new THREE.Group();

    // Stone Frame
    const frameGeo = new THREE.BoxGeometry(1.2, 2.2, 0.25);
    const frameMesh = new THREE.Mesh(frameGeo, Materials.carraraMarble);
    group.add(frameMesh);

    // Recessed Inner Cavity
    const nicheGeo = new THREE.BoxGeometry(0.9, 1.8, 0.22);
    const nicheMesh = new THREE.Mesh(nicheGeo, Materials.blackMatte);
    nicheMesh.position.z = 0.02;
    group.add(nicheMesh);

    // Molded Arch Top Trim
    const archGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.28, 16, 1, false, 0, Math.PI);
    const archMesh = new THREE.Mesh(archGeo, Materials.goldLeaf);
    archMesh.position.y = 1.1;
    archMesh.rotation.x = Math.PI / 2;
    group.add(archMesh);

    // Bronze Classical Urn sitting inside niche at y = -0.7m
    const urn = this.createClassicalUrn(0.65);
    urn.position.set(0, -0.85, 0.08);
    group.add(urn);

    return group;
  }

  /**
   * Creates a classical fluted marble column with molded plinth base and Ionic capital.
   */
  private createClassicalColumn(height: number, radius: number): THREE.Group {
    const group = new THREE.Group();

    // 1. Square Plinth Base
    const plinthGeo = new THREE.BoxGeometry(radius * 2.4, 0.45, radius * 2.4);
    const plinthMesh = new THREE.Mesh(plinthGeo, Materials.carraraMarble);
    plinthMesh.position.y = 0.225;
    group.add(plinthMesh);

    // Base Torus Ring
    const torusGeo = new THREE.CylinderGeometry(radius * 1.15, radius * 1.25, 0.2, 24);
    const torusMesh = new THREE.Mesh(torusGeo, Materials.goldLeaf);
    torusMesh.position.y = 0.55;
    group.add(torusMesh);

    // 2. Fluted Column Shaft
    const shaftH = height - 1.4;
    const shaftGeo = new THREE.CylinderGeometry(radius * 0.9, radius * 1.05, shaftH, 24);
    const shaftMesh = new THREE.Mesh(shaftGeo, Materials.carraraMarble);
    shaftMesh.position.y = 0.65 + shaftH / 2;
    group.add(shaftMesh);

    // Vertical Fluting Ribs
    for (let f = 0; f < 12; f++) {
      const angle = (f / 12) * Math.PI * 2;
      const rx = Math.cos(angle) * (radius * 0.98);
      const rz = Math.sin(angle) * (radius * 0.98);

      const ribGeo = new THREE.CylinderGeometry(0.025, 0.03, shaftH - 0.2, 8);
      const ribMesh = new THREE.Mesh(ribGeo, Materials.goldLeaf);
      ribMesh.position.set(rx, 0.65 + shaftH / 2, rz);
      group.add(ribMesh);
    }

    // 3. Ionic Capital with 3D Volute Scrolls
    const capY = 0.65 + shaftH + 0.2;
    const capGeo = new THREE.BoxGeometry(radius * 2.4, 0.35, radius * 2.4);
    const capMesh = new THREE.Mesh(capGeo, Materials.carraraMarble);
    capMesh.position.y = capY;
    group.add(capMesh);

    // Gold Leaf Volute Rosette Scrolls
    for (let side of [-1, 1]) {
      const voluteGeo = new THREE.CylinderGeometry(0.18, 0.18, radius * 2.5, 16);
      const voluteMesh = new THREE.Mesh(voluteGeo, Materials.goldLeaf);
      voluteMesh.rotation.z = Math.PI / 2;
      voluteMesh.position.set(0, capY, side * (radius * 1.1));
      group.add(voluteMesh);
    }

    // Top Square Abacus supporting ceiling
    const abacusGeo = new THREE.BoxGeometry(radius * 2.6, 0.2, radius * 2.6);
    const abacusMesh = new THREE.Mesh(abacusGeo, Materials.carraraMarble);
    abacusMesh.position.y = capY + 0.275;
    group.add(abacusMesh);

    return group;
  }

  /**
   * Creates a monumental classical portal with pediment & royal drapery curtains.
   */
  private createMonumentalPortal(width: number, height: number, hasCurtains: boolean = false): THREE.Group {
    const group = new THREE.Group();

    // 1. Dark Walnut Floor Threshold Strip
    const threshGeo = new THREE.BoxGeometry(width + 0.6, 0.03, 0.8);
    const threshMesh = new THREE.Mesh(threshGeo, Materials.darkMahogany);
    threshMesh.position.set(0, 0.015, 0);
    group.add(threshMesh);

    // 2. Fluted Carrara Marble Side Pilasters
    const jambGeo = new THREE.BoxGeometry(0.5, height, 0.6);
    const leftJamb = new THREE.Mesh(jambGeo, Materials.carraraMarble);
    leftJamb.position.set(-width / 2 - 0.25, height / 2, 0);
    group.add(leftJamb);

    const rightJamb = new THREE.Mesh(jambGeo, Materials.carraraMarble);
    rightJamb.position.set(width / 2 + 0.25, height / 2, 0);
    group.add(rightJamb);

    // Gold Fluting Grooves on Jambs
    for (let side of [-1, 1]) {
      const jx = side * (width / 2 + 0.25);
      const grooveGeo = new THREE.BoxGeometry(0.04, height - 0.8, 0.65);
      const grooveMesh = new THREE.Mesh(grooveGeo, Materials.goldLeaf);
      grooveMesh.position.set(jx, height / 2, 0);
      group.add(grooveMesh);
    }

    // 3. Top Lintel Architrave & Gold Moulding
    const lintelGeo = new THREE.BoxGeometry(width + 1.2, 0.5, 0.65);
    const lintelMesh = new THREE.Mesh(lintelGeo, Materials.carraraMarble);
    lintelMesh.position.set(0, height + 0.25, 0);
    group.add(lintelMesh);

    const goldTrimGeo = new THREE.BoxGeometry(width + 1.3, 0.1, 0.7);
    const goldTrimMesh = new THREE.Mesh(goldTrimGeo, Materials.goldLeaf);
    goldTrimMesh.position.set(0, height + 0.55, 0);
    group.add(goldTrimMesh);

    // 4. Triangular Classical Pediment
    const pedimentGroup = new THREE.Group();
    pedimentGroup.position.set(0, height + 0.6, 0);

    const pedWidth = width + 1.4;
    const pedHeight = 0.8;

    // Pediment base box
    const pedBaseGeo = new THREE.BoxGeometry(pedWidth, 0.15, 0.65);
    const pedBaseMesh = new THREE.Mesh(pedBaseGeo, Materials.carraraMarble);
    pedBaseGroup: group.add(pedBaseMesh);
    pedBaseMesh.position.set(0, height + 0.675, 0);

    // Aged Gold Royal Crest / Cartouche Medallion in pediment center
    const crestGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.2, 16);
    const crestMesh = new THREE.Mesh(crestGeo, Materials.goldLeaf);
    crestMesh.rotation.x = Math.PI / 2;
    crestMesh.position.set(0, height + 1.05, 0.28);
    group.add(crestMesh);

    // 5. Royal Velvet Drapery / Curtains with Gold Tassel Tie-backs
    if (hasCurtains) {
      const curtainGroup = new THREE.Group();

      for (let side of [-1, 1]) {
        const cx = side * (width / 2 - 0.4);

        // Vertical gathered curtain body
        const curtainGeo = new THREE.CylinderGeometry(0.35, 0.45, height - 0.2, 16, 1, false, 0, Math.PI);
        const curtainMesh = new THREE.Mesh(curtainGeo, Materials.curtainVelvet);
        curtainMesh.rotation.y = side > 0 ? 0 : Math.PI;
        curtainMesh.position.set(cx, height / 2 - 0.1, 0.22);
        curtainGroup.add(curtainMesh);

        // Gold Tassel Tie-Back Ring
        const ringGeo = new THREE.TorusGeometry(0.38, 0.05, 12, 24);
        const ringMesh = new THREE.Mesh(ringGeo, Materials.goldLeaf);
        ringMesh.position.set(cx, height * 0.45, 0.22);
        curtainGroup.add(ringMesh);
      }

      // Top Valance / Swag
      const valanceGeo = new THREE.BoxGeometry(width - 0.2, 0.45, 0.25);
      const valanceMesh = new THREE.Mesh(valanceGeo, Materials.curtainVelvet);
      valanceMesh.position.set(0, height - 0.225, 0.22);
      curtainGroup.add(valanceMesh);

      const valanceGoldGeo = new THREE.BoxGeometry(width, 0.08, 0.28);
      const valanceGoldMesh = new THREE.Mesh(valanceGoldGeo, Materials.goldLeaf);
      valanceGoldMesh.position.set(0, height - 0.48, 0.22);
      curtainGroup.add(valanceGoldMesh);

      group.add(curtainGroup);
    }

    return group;
  }

  /**
   * Creates a carved dark walnut console table with cream marble top & gold-framed mirror.
   */
  private createConsoleTableAndMirror(): THREE.Group {
    const group = new THREE.Group();

    // 1. CONSOLE TABLE
    const tableGroup = new THREE.Group();

    // Polished Cream Marble Top Slab
    const topGeo = new THREE.BoxGeometry(2.2, 0.12, 0.7);
    const topMesh = new THREE.Mesh(topGeo, Materials.carraraMarble);
    topMesh.position.set(0, 0.9, 0.35);
    tableGroup.add(topMesh);

    // Gold Trim Line around table top
    const trimGeo = new THREE.BoxGeometry(2.26, 0.04, 0.74);
    const trimMesh = new THREE.Mesh(trimGeo, Materials.goldLeaf);
    trimMesh.position.set(0, 0.82, 0.35);
    tableGroup.add(trimMesh);

    // Carved Dark Walnut Table Apron
    const apronGeo = new THREE.BoxGeometry(2.1, 0.2, 0.6);
    const apronMesh = new THREE.Mesh(apronGeo, Materials.darkMahogany);
    apronMesh.position.set(0, 0.7, 0.35);
    tableGroup.add(apronMesh);

    // 4 Carved Walnut & Gold Legs
    const legCoords = [
      [-0.95, 0.12], [0.95, 0.12],
      [-0.95, 0.58], [0.95, 0.58]
    ];
    for (const [lx, lz] of legCoords) {
      const legGeo = new THREE.CylinderGeometry(0.06, 0.035, 0.7, 12);
      const legMesh = new THREE.Mesh(legGeo, Materials.darkMahogany);
      legMesh.position.set(lx, 0.35, lz);
      tableGroup.add(legMesh);

      // Gold leg cap & foot
      const footGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.08, 12);
      const footMesh = new THREE.Mesh(footGeo, Materials.goldLeaf);
      footMesh.position.set(lx, 0.04, lz);
      tableGroup.add(footMesh);
    }

    group.add(tableGroup);

    // 2. PALACE GOLD-FRAMED ARCHED MIRROR
    const mirrorGroup = new THREE.Group();
    mirrorGroup.position.set(0, 2.2, 0.06);

    // Reflective Mirror Plane
    const mirrorGeo = new THREE.PlaneGeometry(1.4, 1.8);
    const mirrorMesh = new THREE.Mesh(mirrorGeo, Materials.mirrorSurface);
    mirrorGroup.add(mirrorMesh);

    // Molded Gold Leaf Frame
    const frameGeo = new THREE.BoxGeometry(1.6, 2.0, 0.08);
    const frameMesh = new THREE.Mesh(frameGeo, Materials.goldLeaf);
    frameMesh.position.z = -0.04;
    mirrorGroup.add(frameMesh);

    // Crest Finial on top of mirror
    const crestGeo = new THREE.ConeGeometry(0.25, 0.35, 12);
    const crestMesh = new THREE.Mesh(crestGeo, Materials.goldLeaf);
    crestMesh.position.set(0, 1.1, -0.02);
    mirrorGroup.add(crestMesh);

    group.add(mirrorGroup);

    return group;
  }

  /**
   * Creates a royal palace bench with dark walnut carved legs and velvet seat.
   */
  private createPalaceBench(): THREE.Group {
    const group = new THREE.Group();

    // Carved Dark Walnut Base Frame
    const baseGeo = new THREE.BoxGeometry(2.5, 0.35, 1.1);
    const baseMesh = new THREE.Mesh(baseGeo, Materials.darkMahogany);
    baseMesh.position.y = 0.25;
    group.add(baseMesh);

    // Aged Gold Moulding Trim around seat
    const trimGeo = new THREE.BoxGeometry(2.58, 0.06, 1.18);
    const trimMesh = new THREE.Mesh(trimGeo, Materials.goldLeaf);
    trimMesh.position.y = 0.44;
    group.add(trimMesh);

    // Royal Velvet Upholstered Cushion Top
    const cushionGeo = new THREE.BoxGeometry(2.6, 0.16, 1.2);
    const cushionMesh = new THREE.Mesh(cushionGeo, Materials.curtainVelvet);
    cushionMesh.position.y = 0.54;
    group.add(cushionMesh);

    // 4 Gold & Walnut Feet
    const feetCoords = [
      [-1.1, -0.45], [1.1, -0.45],
      [-1.1, 0.45], [1.1, 0.45]
    ];
    for (const [fx, fz] of feetCoords) {
      const footGeo = new THREE.CylinderGeometry(0.06, 0.04, 0.18, 12);
      const footMesh = new THREE.Mesh(footGeo, Materials.goldLeaf);
      footMesh.position.set(fx, 0.09, fz);
      group.add(footMesh);
    }

    return group;
  }

  /**
   * Creates a Carrara marble pedestal holding an antique bronze classical bust sculpture.
   */
  private createPedestalWithBust(): THREE.Group {
    const group = new THREE.Group();

    // 1. Molded Marble Pedestal Base
    const baseGeo = new THREE.BoxGeometry(1.2, 0.3, 1.2);
    const baseMesh = new THREE.Mesh(baseGeo, Materials.carraraMarble);
    baseMesh.position.y = 0.15;
    group.add(baseMesh);

    // Pedestal Column Shaft
    const shaftGeo = new THREE.CylinderGeometry(0.42, 0.48, 1.1, 16);
    const shaftMesh = new THREE.Mesh(shaftGeo, Materials.carraraMarble);
    shaftMesh.position.y = 0.85;
    group.add(shaftMesh);

    // Aged Gold Ring Accents
    const ringGeo = new THREE.CylinderGeometry(0.50, 0.50, 0.08, 16);
    const ringMeshTop = new THREE.Mesh(ringGeo, Materials.goldLeaf);
    ringMeshTop.position.y = 1.36;
    group.add(ringMeshTop);

    const ringMeshBot = new THREE.Mesh(ringGeo, Materials.goldLeaf);
    ringMeshBot.position.y = 0.34;
    group.add(ringMeshBot);

    // Pedestal Top Cap
    const capGeo = new THREE.BoxGeometry(1.1, 0.15, 1.1);
    const capMesh = new THREE.Mesh(capGeo, Materials.carraraMarble);
    capMesh.position.y = 1.475;
    group.add(capMesh);

    // 2. Antique Bronze Classical Bust Sculpture
    const bustGroup = new THREE.Group();
    bustGroup.position.y = 1.55;

    // Bust Sock / Base
    const sockGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.18, 12);
    const sockMesh = new THREE.Mesh(sockGeo, Materials.antiqueBronze);
    sockMesh.position.y = 0.09;
    bustGroup.add(sockMesh);

    // Torso / Shoulders
    const torsoGeo = new THREE.BoxGeometry(0.65, 0.45, 0.32);
    const torsoMesh = new THREE.Mesh(torsoGeo, Materials.antiqueBronze);
    torsoMesh.position.y = 0.4;
    bustGroup.add(torsoMesh);

    // Head
    const headGeo = new THREE.SphereGeometry(0.22, 16, 16);
    const headMesh = new THREE.Mesh(headGeo, Materials.antiqueBronze);
    headMesh.position.y = 0.78;
    bustGroup.add(headMesh);

    group.add(bustGroup);

    return group;
  }
}
