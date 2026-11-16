/** Styles for the game, scoped under .da so the same bundle works inside the app and standalone. */
export const CSS = `
.da{--drape:#0a2a2e;--drape2:#103b40;--drape3:#18525a;--line:#2a6a72;--enamel:#f6efdc;--mute:#a5c4c0;--gingiva:#ff6f7d;--dentine:#ffc857;--xray:#8fd8ff;--ok:#7be495;--bad:#ff5a5a;
  --disp:"Press Start 2P","Courier New",monospace;--body:"Chakra Petch","Trebuchet MS",Verdana,sans-serif;
  color:var(--enamel);font:500 16px/1.45 var(--body);display:flex;flex-direction:column;gap:10px;position:relative}
.da *{box-sizing:border-box}
.da p,.da h2,.da ul,.da ol,.da dl,.da dd{margin:0}
.da button{font-family:var(--body);touch-action:manipulation;color:inherit}
.da button:focus-visible,.da .da-tooth:focus-visible{outline:3px solid var(--xray);outline-offset:2px}
.da-hud{display:none;gap:8px;align-items:center}
.da-hud.on{display:flex}
.da-pips{display:flex;gap:3px;flex:1}
.da-pips i{height:8px;flex:1;background:var(--drape3);border-radius:1px}
.da-pips i.d{background:var(--ok)}.da-pips i.c{background:var(--dentine)}
.da-score{font:400 11px var(--disp);color:var(--dentine);font-variant-numeric:tabular-nums}
.da-icon{background:var(--drape2);border:2px solid var(--line);border-radius:6px;font:600 12px var(--body);padding:6px 8px;cursor:pointer}
.da-kick{font:400 9px/1.4 var(--disp);color:var(--xray);letter-spacing:1px;text-transform:uppercase}
.da h2{font:700 21px/1.2 var(--body);text-wrap:balance}
.da-lead{color:var(--mute)}.da-small{font-size:13px;color:var(--mute)}
.da-stage{position:relative;border:2px solid var(--line);border-radius:12px;overflow:hidden;background:#061a1c}
.da-stage.front{max-width:280px;width:100%;align-self:center}
.da-stage.plain{border:0;background:none;overflow:visible;display:flex;flex-direction:column;gap:10px}
.da-svg{display:block;width:100%;height:auto;touch-action:none;user-select:none;-webkit-user-select:none}
.da-stage.armed .da-svg{cursor:crosshair}
.da-tooth{cursor:pointer}
.da-tooth.no circle:first-child{fill:var(--bad)}.da-tooth.ok circle:first-child{fill:var(--ok)}
.da-ring{fill:rgba(255,200,87,.12);stroke:var(--dentine);stroke-width:2;stroke-dasharray:4 4;animation:da-pulse 1s ease-in-out infinite;pointer-events:none}
@keyframes da-pulse{50%{opacity:.35}}
.da-bubble{position:absolute;right:8px;top:8px;max-width:70%;background:var(--enamel);color:#0a2a2e;font-weight:700;font-size:14px;padding:6px 10px;border-radius:12px 12px 2px 12px;box-shadow:3px 3px 0 rgba(0,0,0,.4);opacity:0;transform:translateY(-6px);transition:.2s;pointer-events:none}
.da-bubble.on{opacity:1;transform:none}
.da-tray{display:flex;gap:8px;flex-wrap:wrap}
.da-tray:empty{display:none}
.da-tool{flex:1 1 96px;display:flex;flex-direction:column;align-items:center;gap:2px;background:#c9d6d8;border:0;border-bottom:5px solid #7d9296;border-radius:10px;padding:8px 6px 6px;cursor:grab;touch-action:none;user-select:none;-webkit-user-select:none}
.da-tool svg{width:100%;max-width:130px;height:44px;pointer-events:none}
.da-tool span{font:700 12px/1.2 var(--body);color:#0a2a2e;text-align:center;pointer-events:none}
.da-tool.armed{background:var(--dentine);border-bottom-color:#a87a1c;transform:translateY(-3px)}
.da-tool.gone{opacity:.25;pointer-events:none}
.da-ghost{position:fixed;z-index:60;width:130px;pointer-events:none;transform:translate(-50%,-70%) rotate(-8deg);filter:drop-shadow(4px 6px 0 rgba(0,0,0,.45))}
.da-ghost svg{width:100%;height:auto}
.da-msg{font-size:14px;color:var(--dentine);min-height:20px}
.da-msg:empty{display:none}
.da-extra{display:flex;flex-direction:column;gap:8px}.da-extra:empty{display:none}
.da-actions{display:flex;flex-direction:column;gap:8px}.da-actions:empty{display:none}
.da-go{background:var(--gingiva);color:#2a0a10!important;border:0;border-radius:10px;padding:14px 16px;font:400 12px var(--disp)!important;cursor:pointer;box-shadow:0 4px 0 #a83a47}
.da-go:active{transform:translateY(3px);box-shadow:0 1px 0 #a83a47}
.da-ghostbtn{background:none;border:2px dashed var(--line);color:var(--xray)!important;border-radius:10px;padding:10px;font:600 14px var(--body);cursor:pointer}
.da-panel{background:var(--drape2);border:2px solid var(--line);border-radius:10px;padding:12px;display:flex;flex-direction:column;gap:8px}
.da-facts{display:grid;grid-template-columns:auto 1fr;gap:4px 12px;font-size:14px}.da-facts dt{color:var(--mute)}
.da-opt{display:flex;align-items:center;gap:10px;text-align:left;background:var(--drape2);border:2px solid var(--line);border-radius:10px;padding:10px 12px;font:500 15px/1.3 var(--body);cursor:pointer;width:100%}
.da-opt.sel{border-color:var(--ok);background:#12463a}
.da-opt svg{width:44px;height:44px;flex:none}
.da-opts{display:flex;flex-direction:column;gap:8px}
.da-tiles{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.da-tile{display:flex;flex-direction:column;gap:6px;align-items:center;text-align:center;background:var(--drape2);border:2px solid var(--line);border-bottom-width:5px;border-radius:12px;padding:10px 8px;font:600 13px/1.25 var(--body);cursor:pointer}
.da-tile svg{width:48px;height:48px;color:var(--dentine)}
.da-tile:active{transform:translateY(2px)}
.da-chip{display:inline-block;align-self:flex-start;font:600 11px/1 var(--body);letter-spacing:.06em;text-transform:uppercase;padding:4px 7px;border-radius:3px;border:1px solid currentColor}
.da-chip.hit{color:var(--gingiva)}.da-chip.miss{color:var(--ok)}
.da-gauge{height:26px;border:2px solid var(--enamel);border-radius:6px;position:relative;background:#061a1c;overflow:hidden}
.da-gauge .z{position:absolute;top:0;bottom:0;left:45%;width:27%;background:rgba(123,228,149,.35)}
.da-gauge .r{position:absolute;top:0;bottom:0;left:86%;right:0;background:rgba(255,90,90,.45)}
.da-gauge .f{position:absolute;top:0;bottom:0;left:0;width:0;background:var(--dentine);mix-blend-mode:screen}
.da-bar{height:12px;border-radius:3px;background:var(--drape3);overflow:hidden}.da-bar i{display:block;height:100%;width:0;background:var(--ok)}
.da-bar.hold i{background:var(--dentine)}
.da-lab{display:flex;justify-content:space-between;font:400 8px var(--disp);color:var(--mute);letter-spacing:.5px}
.da-hold{background:var(--dentine);color:#2a1c00!important;border:0;border-radius:12px;padding:20px;font:400 12px var(--disp)!important;cursor:pointer;box-shadow:0 5px 0 #a87a1c;user-select:none;-webkit-user-select:none;touch-action:none}
.da-hold.dn{transform:translateY(4px);box-shadow:0 1px 0 #a87a1c}
.da-shake{animation:da-shake .35s}
@keyframes da-shake{25%{transform:translateX(-6px)}50%{transform:translateX(6px)}75%{transform:translateX(-3px)}}
.da-locked{animation:da-lock .25s linear infinite}
@keyframes da-lock{50%{transform:translateX(1.5px)}}
.da-piece{transition:transform 1.4s cubic-bezier(.3,.1,.3,1);transform-box:fill-box;transform-origin:center}
.da-piece.go{transform:translate(var(--dx),var(--dy)) rotate(var(--rot))}
.da-sup{position:sticky;bottom:0;z-index:20;padding:8px 0 10px;background:linear-gradient(transparent,var(--drape) 22%);display:none}
.da-sup.on{display:block}
.da-say{display:flex;gap:10px;background:#061a1c;border:2px solid var(--enamel);border-radius:10px;padding:10px;box-shadow:4px 4px 0 rgba(0,0,0,.4)}
.da-face{width:54px;height:54px;flex:none;animation:da-pop .3s}
@keyframes da-pop{0%{transform:scale(.8) rotate(-6deg)}60%{transform:scale(1.1)}}
.da-say b{font:400 8px/1.5 var(--disp);color:var(--dentine);display:block;letter-spacing:.5px}
.da-say .l{font-size:15px;line-height:1.3}.da-say .f{font-size:13px;color:var(--xray);margin-top:4px;line-height:1.3}
.da-card{background:var(--enamel);color:#0a2a2e;border-radius:14px;padding:18px 16px;font:700 17px/1.3 var(--body);min-height:110px;display:flex;align-items:center;justify-content:center;text-align:center;box-shadow:5px 5px 0 rgba(0,0,0,.4);touch-action:pan-y;user-select:none;-webkit-user-select:none;cursor:grab;transition:transform .2s,opacity .2s;position:relative}
.da-card .tag{position:absolute;top:8px;right:10px;font:400 9px var(--disp)}
.da-patientrow{display:flex;gap:12px;align-items:center}
.da-patient{width:84px;height:84px;flex:none}
.da-pbubble{background:var(--drape2);border:2px solid var(--line);border-radius:12px 12px 12px 2px;padding:8px 12px;font-size:15px}
.da-two{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.da-no{background:var(--drape3);border:0;border-bottom:4px solid #0c3035;border-radius:10px;padding:14px 8px;font:700 14px var(--body);cursor:pointer}
.da-yes{background:var(--ok);color:#0a2a2e!important;border:0;border-bottom:4px solid #3e9a57;border-radius:10px;padding:14px 8px;font:700 14px var(--body);cursor:pointer}
.da-list{list-style:none;padding:0;display:flex;flex-direction:column;gap:6px;font-size:14px}
.da-list li{display:flex;gap:8px;justify-content:space-between;border:2px solid var(--line);border-radius:8px;padding:6px 10px}
.da-list em{font:400 8px var(--disp);font-style:normal;white-space:nowrap;align-self:center}
.da-list .good{border-color:var(--ok)}.da-list .good em{color:var(--ok)}
.da-list .harm{border-color:var(--bad)}.da-list .harm em{color:var(--bad)}
.da-list .missed{border-style:dashed;border-color:var(--dentine)}.da-list .missed em{color:var(--dentine)}
.da-ret{font:400 10px/1.5 var(--disp);color:var(--gingiva);animation:da-blink 1s steps(2) 3}
@keyframes da-blink{50%{opacity:.2}}
.da-dots{display:flex;gap:6px}.da-dots i{flex:1;font:400 7px/1.4 var(--disp);font-style:normal;color:var(--mute);border-top:4px solid var(--drape3);padding-top:4px}
.da-dots i.d{border-color:var(--dentine);color:var(--dentine)}
.da-grade{font:400 56px/1 var(--disp);color:var(--dentine);text-shadow:4px 4px 0 var(--gingiva)}
.da table{width:100%;border-collapse:collapse;font-size:13px}
.da td:first-child{white-space:nowrap}
.da td,.da th{padding:6px 4px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}
.da td.n,.da th.n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.da-dom{display:grid;grid-template-columns:90px 1fr 54px;gap:8px;align-items:center;font-size:13px}
.da-dom span:last-child{text-align:right;font-variant-numeric:tabular-nums}
.da textarea{width:100%;background:#061a1c;color:var(--enamel);border:2px solid var(--line);border-radius:8px;padding:8px;font:500 13px var(--body)}
.da-hero{font:400 24px/1.3 var(--disp);text-shadow:3px 3px 0 var(--gingiva),-2px -2px 0 rgba(143,216,255,.6)}
.da-modal{position:fixed;inset:0;background:rgba(3,16,18,.93);z-index:70;display:none;overflow:auto;padding:16px}
.da-modal.on{display:block}
.da-modal>div{max-width:480px;margin:0 auto;display:flex;flex-direction:column;gap:12px}
.da-check{display:flex;gap:10px;align-items:center;font-size:15px}
.da-check input{width:20px;height:20px;accent-color:var(--dentine)}
@media (prefers-reduced-motion:reduce){.da *{animation:none!important;transition:none!important}}
`;
