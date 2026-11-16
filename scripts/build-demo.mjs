/** Bundles the game into one self-contained HTML file. Run: npm run demo:build */
import { build } from "esbuild";
import { writeFileSync } from "node:fs";

const out = await build({ entryPoints: ["src/game/standalone.ts"], bundle: true, minify: true, format: "iife", target: "es2020", write: false });
const js = out.outputFiles[0].text.replace(/<\/script/g, "<\\/script");
const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Dental Arcade Extraction Demo</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Chakra+Petch:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
:root{color-scheme:dark}
html,body{height:100%}
body{margin:0;background:#0a2a2e radial-gradient(120% 60% at 50% 0,#14494f 0,#0a2a2e 60%) no-repeat;color:#f6efdc;font-family:"Chakra Petch","Trebuchet MS",Verdana,sans-serif}
body::after{content:"";position:fixed;inset:0;pointer-events:none;z-index:50;background:repeating-linear-gradient(0deg,rgba(0,0,0,.13) 0 1px,transparent 1px 3px)}
#cab{max-width:480px;margin:0 auto;padding:14px 16px 0;display:flex;flex-direction:column;gap:8px}
.marquee{font:400 15px/1.2 "Press Start 2P","Courier New",monospace;letter-spacing:1px;margin:0;text-shadow:2px 2px 0 #ff6f7d,-2px -1px 0 rgba(143,216,255,.7)}
.demo{font-weight:600;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#0a2a2e;background:#ffc857;padding:3px 8px;border-radius:3px;align-self:flex-start}
</style>
</head>
<body>
<div id="cab">
<p class="marquee">DENTAL ARCADE</p>
<span class="demo">Demo · not clinically approved · synthetic patient</span>
<div id="app"></div>
</div>
<script>${js}</script>
</body>
</html>
`;
writeFileSync("public/demo/simple-extraction.html", html);
console.log(`Wrote public/demo/simple-extraction.html (${Math.round(html.length / 1024)} KB)`);
