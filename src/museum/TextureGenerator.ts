import * as THREE from 'three';

export class TextureGenerator {
  private static canvasCache: Map<string, THREE.CanvasTexture> = new Map();

  /**
   * Generates a dark charcoal-brown royal stone floor texture with organic veining & subtle gold inlays.
   */
  public static createCreamMarbleFloorTexture(): THREE.CanvasTexture {
    const key = 'dark_royal_stone_floor';
    if (this.canvasCache.has(key)) return this.canvasCache.get(key)!;

    const size = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // 1. Base Dark Charcoal-Brown Warm Stone Gradient (#362c24 -> #282018)
    const bgGrad = ctx.createLinearGradient(0, 0, size, size);
    bgGrad.addColorStop(0, '#382e25');
    bgGrad.addColorStop(0.35, '#2e251d');
    bgGrad.addColorStop(0.7, '#332921');
    bgGrad.addColorStop(1, '#251e17');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, size, size);

    // 2. Soft Organic Cloudy Patches (Low-frequency warm stone variation)
    for (let i = 0; i < 24; i++) {
      const cx = Math.random() * size;
      const cy = Math.random() * size;
      const rad = 80 + Math.random() * 220;
      const cloudGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, rad);
      const isWarm = Math.random() > 0.4;
      if (isWarm) {
        cloudGrad.addColorStop(0, 'rgba(64, 50, 38, 0.45)');
        cloudGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else {
        cloudGrad.addColorStop(0, 'rgba(32, 24, 18, 0.40)');
        cloudGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      }
      ctx.fillStyle = cloudGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Multi-Layered Organic Stone Veins
    const drawVeinBranch = (startX: number, startY: number, length: number, angle: number, color: string, width: number) => {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(startX, startY);

      let currX = startX;
      let currY = startY;
      const steps = Math.floor(length / 20);

      for (let s = 0; s < steps; s++) {
        const drift = (Math.random() - 0.5) * 35;
        const nextX = currX + Math.cos(angle) * 20 + drift;
        const nextY = currY + Math.sin(angle) * 20 + (Math.random() - 0.5) * 15;

        ctx.lineTo(nextX, nextY);

        if (Math.random() < 0.22 && width > 1.0) {
          drawVeinBranch(nextX, nextY, length * 0.4, angle + (Math.random() - 0.5) * 0.9, color, width * 0.6);
        }

        currX = nextX;
        currY = nextY;
      }
      ctx.stroke();
      ctx.restore();
    };

    // Major Dark Bronze Veins
    for (let v = 0; v < 7; v++) {
      const vx = Math.random() * size;
      const vy = Math.random() * size;
      const vAngle = Math.PI * 0.25 + (Math.random() - 0.5) * 0.6;
      drawVeinBranch(vx, vy, 400 + Math.random() * 300, vAngle, 'rgba(20, 14, 10, 0.35)', 2.2);
      drawVeinBranch(vx, vy, 350 + Math.random() * 250, vAngle + Math.PI, 'rgba(28, 20, 14, 0.28)', 1.8);
    }

    // Secondary Aged Gold-Amber Veins
    for (let g = 0; g < 10; g++) {
      const gx = Math.random() * size;
      const gy = Math.random() * size;
      const gAngle = Math.PI * 0.2 + (Math.random() - 0.5) * 0.8;
      drawVeinBranch(gx, gy, 250 + Math.random() * 200, gAngle, 'rgba(168, 132, 69, 0.22)', 1.4);
    }

    // 4. Large Stone Slab Border Frame & Subtle Brass Inlays
    const numSlabs = 4;
    const slabSize = size / numSlabs;

    ctx.strokeStyle = 'rgba(168, 132, 69, 0.30)';
    ctx.lineWidth = 2;

    for (let r = 0; r <= numSlabs; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * slabSize);
      ctx.lineTo(size, r * slabSize);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(r * slabSize, 0);
      ctx.lineTo(r * slabSize, size);
      ctx.stroke();
    }

    // Aged Gold Corner Diamonds at Slab Intersections (#A88445)
    for (let r = 0; r < numSlabs; r++) {
      for (let c = 0; c < numSlabs; c++) {
        if ((r + c) % 2 === 0) {
          const cx = (c + 0.5) * slabSize;
          const cy = (r + 0.5) * slabSize;
          const dSize = 14;

          ctx.fillStyle = 'rgba(20, 12, 8, 0.65)';
          ctx.beginPath();
          ctx.moveTo(cx, cy - dSize);
          ctx.lineTo(cx + dSize, cy);
          ctx.lineTo(cx, cy + dSize);
          ctx.lineTo(cx - dSize, cy);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = '#a88445';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    this.canvasCache.set(key, texture);
    return texture;
  }

  /**
   * Generates a bump map for stone slab seams and subtle micro surface roughness.
   */
  public static createMarbleBumpTexture(): THREE.CanvasTexture {
    const key = 'marble_bump';
    if (this.canvasCache.has(key)) return this.canvasCache.get(key)!;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, size, size);

    // Recessed slab joint seams
    const numSlabs = 4;
    const slabSize = size / numSlabs;
    ctx.strokeStyle = '#404040';
    ctx.lineWidth = 2.5;

    for (let r = 0; r <= numSlabs; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * slabSize);
      ctx.lineTo(size, r * slabSize);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(r * slabSize, 0);
      ctx.lineTo(r * slabSize, size);
      ctx.stroke();
    }

    // Micro surface polish noise
    const imgData = ctx.getImageData(0, 0, size, size);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 10;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.canvasCache.set(key, texture);
    return texture;
  }

  /**
   * Generates a central Rotunda Sovereign Star Medallion Dark Stone Texture.
   */
  public static createRotundaMedallionTexture(): THREE.CanvasTexture {
    const key = 'rotunda_medallion';
    if (this.canvasCache.has(key)) return this.canvasCache.get(key)!;

    const size = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Deep warm stone background (#2b221b)
    ctx.fillStyle = '#2b221b';
    ctx.fillRect(0, 0, size, size);

    const center = size / 2;
    ctx.save();
    ctx.translate(center, center);

    // Outer dark walnut & aged gold border rings
    ctx.beginPath();
    ctx.arc(0, 0, 465, 0, Math.PI * 2);
    ctx.fillStyle = '#180e08';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, 445, 0, Math.PI * 2);
    ctx.fillStyle = '#2e241c';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, 425, 0, Math.PI * 2);
    ctx.strokeStyle = '#a88445';
    ctx.lineWidth = 10;
    ctx.stroke();

    // 16-point Classical Compass Star Medallion in Aged Gold and Dark Walnut
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const isMajor = i % 2 === 0;
      const length = isMajor ? 385 : 265;

      ctx.save();
      ctx.rotate(angle);

      // Left half of star point (Aged Antique Gold #A88445)
      ctx.fillStyle = isMajor ? '#a88445' : '#8b6a32';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -length);
      ctx.lineTo(26, -length * 0.4);
      ctx.closePath();
      ctx.fill();

      // Right half of star point (Dark Walnut / Antique Bronze #241710)
      ctx.fillStyle = isMajor ? '#241710' : '#180f0a';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -length);
      ctx.lineTo(-26, -length * 0.4);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    // Center medallion cap
    ctx.beginPath();
    ctx.arc(0, 0, 85, 0, Math.PI * 2);
    ctx.fillStyle = '#a88445';
    ctx.fill();
    ctx.strokeStyle = '#180e08';
    ctx.lineWidth = 5;
    ctx.stroke();

    ctx.restore();

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    this.canvasCache.set(key, texture);
    return texture;
  }

  /**
   * Generates rich satin dark walnut wood grain texture (#241710, #302015).
   */
  public static createWalnutWoodTexture(): THREE.CanvasTexture {
    const key = 'walnut_wood';
    if (this.canvasCache.has(key)) return this.canvasCache.get(key)!;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Dark walnut base gradient (#241710 to #302015)
    const grad = ctx.createLinearGradient(0, 0, 0, size);
    grad.addColorStop(0, '#241710');
    grad.addColorStop(0.5, '#302015');
    grad.addColorStop(1, '#1b100a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // Wood growth rings & fine fiber grain lines
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 110; i++) {
      const y = Math.random() * size;
      const isDark = Math.random() > 0.5;
      ctx.strokeStyle = isDark ? 'rgba(12, 6, 3, 0.40)' : 'rgba(75, 48, 30, 0.28)';
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(
        size * 0.35, y + (Math.random() - 0.5) * 18,
        size * 0.65, y + (Math.random() - 0.5) * 18,
        size, y
      );
      ctx.stroke();
    }

    // Subtle cathedral wood knot loops
    for (let k = 0; k < 2; k++) {
      const kx = size * (0.25 + k * 0.5);
      const ky = size * (0.3 + Math.random() * 0.4);
      ctx.strokeStyle = 'rgba(10, 5, 2, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(kx, ky, 35, 120, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    this.canvasCache.set(key, texture);
    return texture;
  }

  /**
   * Generates dark walnut parquet floor texture (#241710, #302015).
   */
  public static createParquetFloorTexture(): THREE.CanvasTexture {
    const key = 'parquet_floor';
    if (this.canvasCache.has(key)) return this.canvasCache.get(key)!;

    const size = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#1a0f0a';
    ctx.fillRect(0, 0, size, size);

    // Draw Versailles / Herringbone wooden planks grid
    const numPlanksX = 8;
    const numPlanksY = 8;
    const pw = size / numPlanksX;
    const ph = size / numPlanksY;

    for (let r = 0; r < numPlanksY; r++) {
      for (let c = 0; c < numPlanksX; c++) {
        const x = c * pw;
        const y = r * ph;

        // Individual plank shade variation
        const shade = (Math.sin(r * 3.7 + c * 2.3) * 0.5 + 0.5);
        const pGrad = ctx.createLinearGradient(x, y, x + pw, y + ph);

        if (shade > 0.6) {
          pGrad.addColorStop(0, '#302015');
          pGrad.addColorStop(1, '#241710');
        } else if (shade > 0.3) {
          pGrad.addColorStop(0, '#261811');
          pGrad.addColorStop(1, '#1d120a');
        } else {
          pGrad.addColorStop(0, '#352317');
          pGrad.addColorStop(1, '#281a11');
        }

        ctx.fillStyle = pGrad;
        ctx.fillRect(x + 1, y + 1, pw - 2, ph - 2);

        // Plank grain lines orientation
        ctx.save();
        ctx.beginPath();
        ctx.rect(x + 1, y + 1, pw - 2, ph - 2);
        ctx.clip();

        ctx.lineWidth = 1;
        const isHorizontalGrain = (r + c) % 2 === 0;

        if (isHorizontalGrain) {
          for (let gl = 0; gl < 12; gl++) {
            const gy = y + (gl / 12) * ph;
            ctx.strokeStyle = 'rgba(8, 4, 2, 0.35)';
            ctx.beginPath();
            ctx.moveTo(x, gy);
            ctx.lineTo(x + pw, gy + (Math.random() - 0.5) * 6);
            ctx.stroke();
          }
        } else {
          for (let gl = 0; gl < 12; gl++) {
            const gx = x + (gl / 12) * pw;
            ctx.strokeStyle = 'rgba(8, 4, 2, 0.35)';
            ctx.beginPath();
            ctx.moveTo(gx, y);
            ctx.lineTo(gx + (Math.random() - 0.5) * 6, y + ph);
            ctx.stroke();
          }
        }
        ctx.restore();

        // Dark bevel joint lines around plank
        ctx.strokeStyle = '#0e0804';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, pw, ph);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    this.canvasCache.set(key, texture);
    return texture;
  }

  /**
   * Generates bump map for parquet floor bevels and wood grain depth.
   */
  public static createParquetBumpTexture(): THREE.CanvasTexture {
    const key = 'parquet_bump';
    if (this.canvasCache.has(key)) return this.canvasCache.get(key)!;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, size, size);

    // Deep bevel seams between planks
    const numPlanks = 8;
    const pSize = size / numPlanks;

    ctx.strokeStyle = '#303030';
    ctx.lineWidth = 3;

    for (let i = 0; i <= numPlanks; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * pSize);
      ctx.lineTo(size, i * pSize);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(i * pSize, 0);
      ctx.lineTo(i * pSize, size);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.canvasCache.set(key, texture);
    return texture;
  }

  /**
   * Generates tactile deep warm stone / dark plaster wall texture (#40372f, #51473d).
   */
  public static createPlasterWallTexture(): THREE.CanvasTexture {
    const key = 'plaster_wall_stone';
    if (this.canvasCache.has(key)) return this.canvasCache.get(key)!;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Deep warm stone base (#40372f)
    ctx.fillStyle = '#40372f';
    ctx.fillRect(0, 0, size, size);

    // Soft plaster/stone trowel marks
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const rad = 50 + Math.random() * 90;
      const grad = ctx.createRadialGradient(x, y, 5, x, y, rad);
      grad.addColorStop(0, 'rgba(81, 71, 61, 0.22)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    // Subtle dark shade variation
    for (let i = 0; i < 25; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const rad = 60 + Math.random() * 100;
      const grad = ctx.createRadialGradient(x, y, 5, x, y, rad);
      grad.addColorStop(0, 'rgba(32, 26, 21, 0.25)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    this.canvasCache.set(key, texture);
    return texture;
  }

  /**
   * Generates bump map for plaster wall micro surface irregularity.
   */
  public static createPlasterBumpTexture(): THREE.CanvasTexture {
    const key = 'plaster_bump';
    if (this.canvasCache.has(key)) return this.canvasCache.get(key)!;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, size, size);

    const imgData = ctx.getImageData(0, 0, size, size);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 14;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.canvasCache.set(key, texture);
    return texture;
  }

  /**
   * Generates velvet fabric texture with woven thread & soft nap stipple.
   */
  public static createVelvetFabricTexture(colorHex: string): THREE.CanvasTexture {
    const key = `velvet_${colorHex}`;
    if (this.canvasCache.has(key)) return this.canvasCache.get(key)!;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = colorHex;
    ctx.fillRect(0, 0, size, size);

    // Diagonal soft velvet pile sheen gradient
    const sheenGrad = ctx.createLinearGradient(0, 0, size, size);
    sheenGrad.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
    sheenGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.04)');
    sheenGrad.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
    ctx.fillStyle = sheenGrad;
    ctx.fillRect(0, 0, size, size);

    // Woven velvet micro-stipple
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    for (let i = 0; i < 5000; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      ctx.fillRect(x, y, 1.2, 1.2);
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.07)';
    for (let i = 0; i < 5000; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      ctx.fillRect(x, y, 1.2, 1.2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    this.canvasCache.set(key, texture);
    return texture;
  }

  /**
   * Generates aged gold leaf patina & micro-roughness texture.
   */
  public static createAgedGoldPatinaTexture(): THREE.CanvasTexture {
    const key = 'aged_gold_patina';
    if (this.canvasCache.has(key)) return this.canvasCache.get(key)!;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, size, size);

    // Crevice patina darkening and leaf boundary noise
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const rad = 15 + Math.random() * 40;
      const grad = ctx.createRadialGradient(x, y, 2, x, y, rad);
      grad.addColorStop(0, 'rgba(40, 40, 40, 0.25)');
      grad.addColorStop(1, 'rgba(128, 128, 128, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.canvasCache.set(key, texture);
    return texture;
  }

  /**
   * Generates deep warm stone / carved stone texture for portals, columns & bases (#40372F, #51473D).
   */
  public static createLimestoneTexture(): THREE.CanvasTexture {
    const key = 'limestone_texture_dark';
    if (this.canvasCache.has(key)) return this.canvasCache.get(key)!;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#2d231c';
    ctx.fillRect(0, 0, size, size);

    // Mineral specks and stone flecks
    ctx.fillStyle = 'rgba(65, 52, 42, 0.25)';
    for (let i = 0; i < 3000; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      ctx.fillRect(x, y, 1.5, 1.5);
    }

    ctx.fillStyle = 'rgba(18, 14, 10, 0.35)';
    for (let i = 0; i < 2000; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      ctx.fillRect(x, y, 2, 2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    this.canvasCache.set(key, texture);
    return texture;
  }

  /**
   * Generates a woven ceremonial royal rug texture in Deep Royal Purple & Dark Burgundy with Aged Gold leaf acanthus border.
   */
  public static createRoyalCarpetTexture(): THREE.CanvasTexture {
    const key = 'royal_carpet';
    if (this.canvasCache.has(key)) return this.canvasCache.get(key)!;

    const size = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Deep Royal Purple Base Field (#1E0E28)
    ctx.fillStyle = '#1e0e28';
    ctx.fillRect(0, 0, size, size);

    // Inner Dark Burgundy Ground (#260D14)
    const margin = 80;
    const innerW = size - margin * 2;
    const innerH = size - margin * 2;

    ctx.fillStyle = '#260d14';
    ctx.fillRect(margin, margin, innerW, innerH);

    // Outer Aged Gold Leaf Acanthus Frame Border (#967438)
    ctx.strokeStyle = '#967438';
    ctx.lineWidth = 14;
    ctx.strokeRect(margin / 2, margin / 2, size - margin, size - margin);

    ctx.strokeStyle = '#180e08';
    ctx.lineWidth = 4;
    ctx.strokeRect(margin / 2 - 8, margin / 2 - 8, size - margin + 16, size - margin + 16);

    ctx.strokeStyle = '#c09a58';
    ctx.lineWidth = 3;
    ctx.strokeRect(margin + 12, margin + 12, innerW - 24, innerH - 24);

    // Center Rosette Medallion
    const cx = size / 2;
    const cy = size / 2;

    ctx.save();
    ctx.translate(cx, cy);

    ctx.beginPath();
    ctx.arc(0, 0, 180, 0, Math.PI * 2);
    ctx.fillStyle = '#a88445';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, 160, 0, Math.PI * 2);
    ctx.fillStyle = '#24152f';
    ctx.fill();

    // 8-Point Acanthus Floral Star
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      ctx.save();
      ctx.rotate(angle);

      ctx.fillStyle = '#c09a58';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(30, -80, 0, -150);
      ctx.quadraticCurveTo(-30, -80, 0, 0);
      ctx.fill();

      ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(0, 0, 45, 0, Math.PI * 2);
    ctx.fillStyle = '#35151f';
    ctx.fill();
    ctx.strokeStyle = '#a88445';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.restore();

    // Corner Ornate Spandrels
    const drawSpandrel = (x: number, y: number, angle: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      ctx.fillStyle = '#a88445';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(140, 0);
      ctx.quadraticCurveTo(70, 70, 0, 140);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    };

    drawSpandrel(margin + 12, margin + 12, 0);
    drawSpandrel(size - margin - 12, margin + 12, Math.PI / 2);
    drawSpandrel(size - margin - 12, size - margin - 12, Math.PI);
    drawSpandrel(margin + 12, size - margin - 12, -Math.PI / 2);

    // Woven Pile Carpet Thread Stipple
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    for (let i = 0; i < 8000; i++) {
      const rx = Math.random() * size;
      const ry = Math.random() * size;
      ctx.fillRect(rx, ry, 1.5, 1.5);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    this.canvasCache.set(key, texture);
    return texture;
  }

  /**
   * Generates a Deep Royal Purple Damask wall pattern texture (#24152F) with Aged Gold acanthus leaf motif (#A88445).
   */
  public static createBlueDamaskTexture(): THREE.CanvasTexture {
    const key = 'purple_damask';
    if (this.canvasCache.has(key)) return this.canvasCache.get(key)!;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Deep Royal Purple Base (#1E0E28)
    ctx.fillStyle = '#1e0e28';
    ctx.fillRect(0, 0, size, size);

    // Subtle Aged Gold Damask Motif Grid
    const tileSize = 256;
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 2; c++) {
        const mx = (c + 0.5) * tileSize;
        const my = (r + 0.5) * tileSize;

        ctx.save();
        ctx.translate(mx, my);

        // Gold Damask Fleur-de-lis / Acanthus Motif (#967438)
        ctx.fillStyle = 'rgba(150, 116, 56, 0.18)';

        ctx.beginPath();
        ctx.arc(0, 0, 40, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(0, -35, 18, 45, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(-30, 10, 15, 35, -Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(30, 10, 15, 35, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    this.canvasCache.set(key, texture);
    return texture;
  }

  /**
   * Generates a high-resolution, exquisite classical museum masterpiece canvas texture
   * for any artwork, featuring gold leaf borders, radial oil chiaroscuro, and sacred motifs.
   */
  public static createArtworkMasterpieceTexture(art: {
    number: number;
    title: string;
    subTitle?: string;
    scripture?: string;
    canvasColorPrimary?: string;
    canvasColorSecondary?: string;
    hallName?: string;
  }): THREE.CanvasTexture {
    const key = `artwork_masterpiece_${art.number}`;
    if (this.canvasCache.has(key)) return this.canvasCache.get(key)!;

    const size = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const priColor = art.canvasColorPrimary || '#1e1b4b';
    const secColor = art.canvasColorSecondary || '#fbbf24';

    // 1. Ornate Dark Mahogany and Aged Gold Outer Frame
    const frameWidth = 48;
    ctx.fillStyle = '#1c1109';
    ctx.fillRect(0, 0, size, size);

    // Beveled frame gradient
    const frameGrad = ctx.createLinearGradient(0, 0, size, size);
    frameGrad.addColorStop(0, '#2b1a0e');
    frameGrad.addColorStop(0.5, '#402715');
    frameGrad.addColorStop(1, '#1a0f08');
    ctx.fillStyle = frameGrad;
    ctx.fillRect(8, 8, size - 16, size - 16);

    // Aged Gold Leaf Inner & Outer Fillets
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 4;
    ctx.strokeRect(6, 6, size - 12, size - 12);
    ctx.strokeRect(frameWidth - 4, frameWidth - 4, size - (frameWidth - 4) * 2, size - (frameWidth - 4) * 2);

    ctx.strokeStyle = '#854d0e';
    ctx.lineWidth = 2;
    ctx.strokeRect(frameWidth - 8, frameWidth - 8, size - (frameWidth - 8) * 2, size - (frameWidth - 8) * 2);

    // 2. Painting Canvas Area
    const canvasX = frameWidth;
    const canvasY = frameWidth;
    const canvasW = size - frameWidth * 2;
    const canvasH = size - frameWidth * 2;

    ctx.save();
    ctx.beginPath();
    ctx.rect(canvasX, canvasY, canvasW, canvasH);
    ctx.clip();

    // Canvas Background Chiaroscuro Gradient
    const cx = size / 2;
    const cy = size / 2;
    const bgGrad = ctx.createRadialGradient(cx, cy * 0.85, 30, cx, cy, canvasW * 0.7);
    bgGrad.addColorStop(0, secColor);
    bgGrad.addColorStop(0.45, priColor);
    bgGrad.addColorStop(1, '#09080e');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(canvasX, canvasY, canvasW, canvasH);

    // 3. Divine Celestial Rays / Flare from top center
    const numRays = 24;
    for (let r = 0; r < numRays; r++) {
      const angle = (r / numRays) * Math.PI * 2;
      ctx.save();
      ctx.translate(cx, cy * 0.6);
      ctx.rotate(angle);
      const rayGrad = ctx.createLinearGradient(0, 0, canvasW * 0.6, 0);
      rayGrad.addColorStop(0, 'rgba(255, 235, 160, 0.25)');
      rayGrad.addColorStop(0.7, 'rgba(212, 175, 55, 0.08)');
      rayGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = rayGrad;
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(canvasW * 0.6, -18);
      ctx.lineTo(canvasW * 0.6, 18);
      ctx.lineTo(0, 6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // 4. Central Sacred Gold Emblem / Rosette
    ctx.save();
    ctx.translate(cx, cy * 0.75);

    // Outer luminous halo
    const haloGrad = ctx.createRadialGradient(0, 0, 40, 0, 0, 190);
    haloGrad.addColorStop(0, 'rgba(254, 240, 138, 0.40)');
    haloGrad.addColorStop(0.6, 'rgba(217, 119, 6, 0.18)');
    haloGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 190, 0, Math.PI * 2);
    ctx.fill();

    // 12-point Sacred Compass Star
    const starPoints = art.number % 2 === 0 ? 8 : 12;
    for (let i = 0; i < starPoints; i++) {
      const angle = (i / starPoints) * Math.PI * 2;
      ctx.save();
      ctx.rotate(angle);

      // Gold ray
      const starGrad = ctx.createLinearGradient(0, 0, 0, -140);
      starGrad.addColorStop(0, '#fde047');
      starGrad.addColorStop(1, '#92400e');
      ctx.fillStyle = starGrad;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-14, -40);
      ctx.lineTo(0, -135);
      ctx.lineTo(14, -40);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Inner medallion ring
    ctx.beginPath();
    ctx.arc(0, 0, 60, 0, Math.PI * 2);
    ctx.fillStyle = '#1c1109';
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Star core finial
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.fillStyle = '#fbbf24';
    ctx.fill();

    ctx.restore();

    // 5. Elegant Typography Presentation Banner
    const bannerY = size - frameWidth - 190;
    const bannerH = 175;

    // Dark semi-translucent parchment plaque
    const plaqueGrad = ctx.createLinearGradient(0, bannerY, 0, bannerY + bannerH);
    plaqueGrad.addColorStop(0, 'rgba(10, 8, 12, 0.88)');
    plaqueGrad.addColorStop(1, 'rgba(18, 12, 16, 0.95)');
    ctx.fillStyle = plaqueGrad;
    ctx.fillRect(canvasX + 16, bannerY, canvasW - 32, bannerH);

    ctx.strokeStyle = 'rgba(212, 175, 55, 0.6)';
    ctx.lineWidth = 2;
    ctx.strokeRect(canvasX + 16, bannerY, canvasW - 32, bannerH);

    // Exhibition No.
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 22px Georgia, serif';
    ctx.fillText(`EXHIBITION NO. ${art.number} OF 36`, cx, bannerY + 34);

    // Title
    ctx.fillStyle = '#fffbeb';
    ctx.font = 'bold 36px Georgia, serif';
    ctx.fillText(art.title, cx, bannerY + 76);

    // Subtitle
    if (art.subTitle) {
      ctx.fillStyle = '#fef08a';
      ctx.font = 'italic 20px Georgia, serif';
      ctx.fillText(art.subTitle, cx, bannerY + 108);
    }

    // Scripture Reference
    if (art.scripture) {
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 18px Georgia, serif';
      ctx.fillText(`— ${art.scripture} —`, cx, bannerY + 142);
    }

    // Fine oil canvas texture stipple
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    for (let i = 0; i < 4000; i++) {
      const rx = canvasX + Math.random() * canvasW;
      const ry = canvasY + Math.random() * canvasH;
      ctx.fillRect(rx, ry, 1.2, 1.2);
    }

    ctx.restore();

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.generateMipmaps = true;
    this.canvasCache.set(key, texture);
    return texture;
  }
}

