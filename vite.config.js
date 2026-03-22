import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        port: 3010,
        host: "127.0.0.1",
        proxy: {
            '/api': 'http://127.0.0.1:3011'
        }
    },
    build: {
        outDir: 'dist'
    }
});
