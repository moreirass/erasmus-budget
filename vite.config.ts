import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({plugins:[react(),VitePWA({registerType:'prompt',includeAssets:['icon.svg','icon-192.png','icon-512.png'],manifest:{name:'Ostrava Pocket — Erasmus Budget',short_name:'Pocket',description:'Your Erasmus budget in EUR and CZK',theme_color:'#164e45',background_color:'#f6f7f3',display:'standalone',start_url:'/',icons:[{src:'/icon-192.png',sizes:'192x192',type:'image/png'},{src:'/icon-512.png',sizes:'512x512',type:'image/png',purpose:'any'}]},workbox:{globPatterns:['**/*.{js,css,html,png,svg,woff2}'],navigateFallback:'index.html',navigateFallbackDenylist:[/^\/auth/],cleanupOutdatedCaches:true}})]});
