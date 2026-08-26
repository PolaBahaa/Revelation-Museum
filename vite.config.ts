import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig, Plugin } from 'vite';

function artworkDiscoveryPlugin(): Plugin {
  const virtualModuleId = 'virtual:discovered-paintings';
  const resolvedVirtualModuleId = '\0' + virtualModuleId;

  const getDiscoveredFiles = () => {
    try {
      const paintingsDir = path.resolve(__dirname, 'public/paintings');
      let files: string[] = [];
      if (fs.existsSync(paintingsDir)) {
        files = fs.readdirSync(paintingsDir);
      }
      const discovered: Array<{ filename: string; number: number; url: string }> = [];
      for (const file of files) {
        const match = file.match(/^0*(\d+)\.(png|PNG|jpg|jpeg|webp)$/i);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > 0) {
            discovered.push({
              filename: file,
              number: num,
              url: `/paintings/${file}`
            });
          }
        }
      }
      discovered.sort((a, b) => a.number - b.number);
      return discovered;
    } catch {
      return [];
    }
  };

  const generateManifest = () => {
    try {
      const discovered = getDiscoveredFiles();
      const outPath = path.resolve(__dirname, 'src/museum/discoveredPaintings.json');
      fs.writeFileSync(outPath, JSON.stringify(discovered, null, 2), 'utf-8');
      console.log(`[ArtworkDiscovery] Discovered ${discovered.length} artwork files from public/paintings/`);
    } catch (err) {
      console.warn('[ArtworkDiscovery] Could not generate paintings manifest:', err);
    }
  };

  return {
    name: 'vite-plugin-artwork-discovery',
    configResolved() {
      generateManifest();
    },
    buildStart() {
      generateManifest();
    },
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        const discovered = getDiscoveredFiles();
        return `export default ${JSON.stringify(discovered)};`;
      }
    },
    configureServer(server) {
      generateManifest();
      server.middlewares.use('/api/paintings-manifest', (_req, res) => {
        const discovered = getDiscoveredFiles();
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(discovered));
      });
      const paintingsDir = path.resolve(__dirname, 'public/paintings');
      if (fs.existsSync(paintingsDir)) {
        server.watcher.add(paintingsDir);
        server.watcher.on('all', (event, filePath) => {
          if (filePath && filePath.includes('paintings')) {
            generateManifest();
          }
        });
      }
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [artworkDiscoveryPlugin(), react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
