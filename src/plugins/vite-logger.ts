import type { Plugin } from 'vite';
import colors from 'picocolors';

export function customLogger(): Plugin {
  return {
    name: 'vite-custom-logger',
    configureServer(server) {
      const originalPrint = server.printUrls;
      
      server.printUrls = () => {
        const interfaces = server.httpServer?.address();
        if (!interfaces) return;

        console.log(`\n${colors.cyan('🚀 Development server started!')}`);
        console.log(`\n${colors.green('➜')} ${colors.bold('Local:')}   ${colors.blue(`http://localhost:${server.config.server?.port}`)}`);
        
        if (server.config.server?.host === true) {
          console.log(`${colors.green('➜')} ${colors.bold('Network:')} ${colors.blue(`http://${server.resolvedUrls?.network[0]}`)}\n`);
        }
      };
    },
    buildStart() {
      console.log(`\n${colors.magenta('📦 Build process starting...')}`);
    },
    buildEnd() {
      console.log(`\n${colors.green('✨ Build completed successfully!')}\n`);
    },
    handleHotUpdate({ file }) {
      console.log(`\n${colors.yellow('🔄 Hot Update:')} ${colors.dim(file)}`);
      return;
    }
  };
}