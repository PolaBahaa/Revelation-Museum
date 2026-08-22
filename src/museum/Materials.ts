import * as THREE from 'three';
import { TextureGenerator } from './TextureGenerator';

export class Materials {
  public static marbleFloor: THREE.MeshStandardMaterial;
  public static parquetFloor: THREE.MeshStandardMaterial;
  public static rotundaFloor: THREE.MeshStandardMaterial;
  public static alabasterWall: THREE.MeshStandardMaterial; // Dark Stone & Aged Plaster Wall
  public static galleryWallNavy: THREE.MeshStandardMaterial; // Deep Royal Purple Velvet
  public static galleryWallBurgundy: THREE.MeshStandardMaterial; // Historical Dark Burgundy Velvet
  public static royalPurplePlaster: THREE.MeshStandardMaterial; // Deep Muted Royal Purple Plaster
  public static goldLeaf: THREE.MeshStandardMaterial; // Aged Handcrafted Royal Gold with Patina
  public static darkMahogany: THREE.MeshStandardMaterial; // Deep Dark Walnut Wood
  public static antiqueBronze: THREE.MeshStandardMaterial; // Dark Aged Antique Bronze
  public static carraraMarble: THREE.MeshStandardMaterial; // Dark Warm Carved Stone / Limestone
  public static ceilingPlaster: THREE.MeshStandardMaterial; // Dark Coffered Ceiling Plaster
  public static brassPlaque: THREE.MeshStandardMaterial; // Aged Engraved Brass
  public static glassSkylight: THREE.MeshStandardMaterial; // Amber Tinted Cathedral Glass
  public static blackMatte: THREE.MeshStandardMaterial; // Deep Shadow Black
  public static warmBulbGlow: THREE.MeshBasicMaterial; // Candle Flame Glow
  public static curtainVelvet: THREE.MeshStandardMaterial; // Deep Burgundy Velvet Drapery
  public static mirrorSurface: THREE.MeshStandardMaterial; // Aged Palace Mirror
  public static royalCarpet: THREE.MeshStandardMaterial; // Woven Royal Ceremonial Rug
  public static blueDamask: THREE.MeshStandardMaterial; // Royal Purple Damask Wall Accent

  private static isInitialized = false;

  public static init(): void {
    if (this.isInitialized) return;

    const darkStoneTex = TextureGenerator.createCreamMarbleFloorTexture();
    const rotundaMedallionTex = TextureGenerator.createRotundaMedallionTexture();
    const walnutWoodTex = TextureGenerator.createWalnutWoodTexture();
    const parquetWoodTex = TextureGenerator.createParquetFloorTexture();
    const marbleBumpTex = TextureGenerator.createMarbleBumpTexture();
    const parquetBumpTex = TextureGenerator.createParquetBumpTexture();
    const plasterWallTex = TextureGenerator.createPlasterWallTexture();
    const plasterBumpTex = TextureGenerator.createPlasterBumpTexture();
    const agedGoldPatinaTex = TextureGenerator.createAgedGoldPatinaTexture();
    const limestoneTex = TextureGenerator.createLimestoneTexture();
    const royalCarpetTex = TextureGenerator.createRoyalCarpetTexture();
    const blueDamaskTex = TextureGenerator.createBlueDamaskTexture();

    const velvetPurpleTex = TextureGenerator.createVelvetFabricTexture('#2e183e');
    const velvetBurgundyTex = TextureGenerator.createVelvetFabricTexture('#3a1420');
    const velvetDarkCrimsonTex = TextureGenerator.createVelvetFabricTexture('#4a1a28');

    // 1. Dark Charcoal-Brown Warm Royal Stone Floor
    const floorTexCopy = darkStoneTex.clone();
    floorTexCopy.repeat.set(4, 8);

    const marbleBumpCopy = marbleBumpTex.clone();
    marbleBumpCopy.repeat.set(4, 8);

    this.marbleFloor = new THREE.MeshStandardMaterial({
      map: floorTexCopy,
      bumpMap: marbleBumpCopy,
      bumpScale: 0.003,
      color: 0x32251c,
      roughness: 0.28,
      metalness: 0.03,
    });

    // 2. Parquet / Dark Walnut Hall Floor (#28180e, #362215)
    const parquetTexCopy = parquetWoodTex.clone();
    parquetTexCopy.repeat.set(3, 5);

    const parquetBumpCopy = parquetBumpTex.clone();
    parquetBumpCopy.repeat.set(3, 5);

    this.parquetFloor = new THREE.MeshStandardMaterial({
      map: parquetTexCopy,
      bumpMap: parquetBumpCopy,
      bumpScale: 0.004,
      color: 0x28180e,
      roughness: 0.38,
      metalness: 0.02,
    });

    // 3. Sovereign Dark Stone Rotunda Medallion Floor
    this.rotundaFloor = new THREE.MeshStandardMaterial({
      map: rotundaMedallionTex,
      bumpMap: marbleBumpTex,
      bumpScale: 0.003,
      color: 0x2e2018,
      roughness: 0.26,
      metalness: 0.04,
    });

    // 4. Dark Warm Charcoal-Brown Stone & Plaster Wall (#3d3027)
    const plasterWallCopy = plasterWallTex.clone();
    plasterWallCopy.repeat.set(4, 4);

    const plasterBumpCopy = plasterBumpTex.clone();
    plasterBumpCopy.repeat.set(4, 4);

    this.alabasterWall = new THREE.MeshStandardMaterial({
      map: plasterWallCopy,
      bumpMap: plasterBumpCopy,
      bumpScale: 0.003,
      color: 0x3d3027,
      roughness: 0.72,
      metalness: 0.02,
    });

    // 5. Deep Royal Purple Velvet Wall Panel (#2e183e)
    const purpleTexCopy = velvetPurpleTex.clone();
    purpleTexCopy.repeat.set(2, 2);

    this.galleryWallNavy = new THREE.MeshStandardMaterial({
      map: purpleTexCopy,
      color: 0x2e183e,
      roughness: 0.80,
      metalness: 0.01,
    });

    // 6. Historical Dark Burgundy Velvet Wall Panel (#3a1420)
    const burgundyTexCopy = velvetBurgundyTex.clone();
    burgundyTexCopy.repeat.set(2, 2);

    this.galleryWallBurgundy = new THREE.MeshStandardMaterial({
      map: burgundyTexCopy,
      color: 0x3a1420,
      roughness: 0.80,
      metalness: 0.01,
    });

    // 7. Muted Deep Royal Purple Plaster (#2a1538)
    this.royalPurplePlaster = new THREE.MeshStandardMaterial({
      map: plasterWallCopy,
      bumpMap: plasterBumpCopy,
      bumpScale: 0.003,
      color: 0x2a1538,
      roughness: 0.70,
      metalness: 0.02,
    });

    // 8. Aged Royal Handcrafted Gold Leaf with Subtle Patina (#a88445)
    this.goldLeaf = new THREE.MeshStandardMaterial({
      roughnessMap: agedGoldPatinaTex,
      color: 0xa88445,
      metalness: 0.85,
      roughness: 0.35,
    });

    // 9. Deep Dark Walnut Trim, Paneling & Doors (#2c1a10)
    const walnutTexCopy = walnutWoodTex.clone();
    walnutTexCopy.repeat.set(1, 4);

    this.darkMahogany = new THREE.MeshStandardMaterial({
      map: walnutTexCopy,
      color: 0x2c1a10,
      roughness: 0.42,
      metalness: 0.02,
    });

    // 10. Dark Aged Antique Bronze Metal (#5c462a)
    this.antiqueBronze = new THREE.MeshStandardMaterial({
      color: 0x5c462a,
      metalness: 0.82,
      roughness: 0.42,
    });

    // 11. Deep Warm Carved Stone / Limestone (#3d3027)
    this.carraraMarble = new THREE.MeshStandardMaterial({
      map: limestoneTex,
      color: 0x3d3027,
      roughness: 0.40,
      metalness: 0.02,
    });

    // 12. Dark Coffered Ceiling Plaster (#281c14)
    this.ceilingPlaster = new THREE.MeshStandardMaterial({
      map: plasterWallCopy,
      bumpMap: plasterBumpCopy,
      bumpScale: 0.002,
      color: 0x281c14,
      roughness: 0.82,
      metalness: 0.0,
    });

    // 13. Aged Engraved Brass Plaque (#a88445)
    this.brassPlaque = new THREE.MeshStandardMaterial({
      color: 0xa88445,
      metalness: 0.85,
      roughness: 0.34,
    });

    // 14. Amber Tinted Cathedral Glass Skylight
    this.glassSkylight = new THREE.MeshStandardMaterial({
      color: 0xeb9638,
      opacity: 0.85,
      transparent: true,
      roughness: 0.22,
    });

    // 15. Deep Shadow Black Accent (#100b08)
    this.blackMatte = new THREE.MeshStandardMaterial({
      color: 0x100b08,
      roughness: 0.88,
      metalness: 0.05,
    });

    // 16. Candle Flame Glow
    this.warmBulbGlow = new THREE.MeshBasicMaterial({
      color: 0xffa040,
    });

    // 17. Deep Burgundy Velvet Curtain Drapery (#260d14)
    const crimsonTexCopy = velvetDarkCrimsonTex.clone();
    crimsonTexCopy.repeat.set(2, 4);

    this.curtainVelvet = new THREE.MeshStandardMaterial({
      map: crimsonTexCopy,
      color: 0x260d14,
      roughness: 0.82,
      metalness: 0.02,
      side: THREE.DoubleSide
    });

    // 18. Aged Palace Reflective Mirror Surface
    this.mirrorSurface = new THREE.MeshStandardMaterial({
      color: 0x888c95,
      metalness: 0.92,
      roughness: 0.12,
    });

    // 19. Woven Ceremonial Royal Carpet
    this.royalCarpet = new THREE.MeshStandardMaterial({
      map: royalCarpetTex,
      roughness: 0.85,
      metalness: 0.02,
    });

    // 20. Deep Royal Purple Damask Wall Accent
    const damaskCopy = blueDamaskTex.clone();
    damaskCopy.repeat.set(2, 2);

    this.blueDamask = new THREE.MeshStandardMaterial({
      map: damaskCopy,
      color: 0x1e0e28,
      roughness: 0.75,
      metalness: 0.02,
    });

    this.isInitialized = true;
  }
}
