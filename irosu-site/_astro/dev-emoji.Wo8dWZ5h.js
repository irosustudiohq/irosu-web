import{i as e,n as t,r as n,t as r}from"./Plane.CXPNF1Te.js?dpl=dpl_74aUw43o7S3n9NFJ1ZxBM24TaWuz";import{t as i}from"./RenderTarget.CgxThfbt.js?dpl=dpl_74aUw43o7S3n9NFJ1ZxBM24TaWuz";import{t as a}from"./Vec2.Cn17CgjE.js?dpl=dpl_74aUw43o7S3n9NFJ1ZxBM24TaWuz";import{t as o}from"./Color.xVu7ktDx.js?dpl=dpl_74aUw43o7S3n9NFJ1ZxBM24TaWuz";import{t as s}from"./tweakpane.CejtfnN4.js?dpl=dpl_74aUw43o7S3n9NFJ1ZxBM24TaWuz";var c=`"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;function l(e){let t=document.createElement(`canvas`);return t.width=e,t.height=e,t}function u(e,t){let n=t,r=t,i=-1,a=-1;for(let o=0;o<t;o++)for(let s=0;s<t;s++)e[(o*t+s)*4+3]<=8||(s<n&&(n=s),s>i&&(i=s),o<r&&(r=o),o>a&&(a=o));return i<0?null:{x:n,y:r,w:i-n+1,h:a-r+1}}function d(e,t){let n=new Float32Array(t*t);for(let t=0;t<n.length;t++)n[t]=e[t]?1e9:0;let r=(e,r)=>e<0||r<0||e>=t||r>=t?0:n[r*t+e];for(let e=0;e<t;e++)for(let i=0;i<t;i++){let a=e*t+i;n[a]!==0&&(n[a]=Math.min(n[a],r(i-1,e-1)+4,r(i,e-1)+3,r(i+1,e-1)+4,r(i-1,e)+3))}for(let e=t-1;e>=0;e--)for(let i=t-1;i>=0;i--){let a=e*t+i;n[a]!==0&&(n[a]=Math.min(n[a],r(i+1,e+1)+4,r(i,e+1)+3,r(i-1,e+1)+4,r(i+1,e)+3))}for(let e=0;e<n.length;e++)n[e]/=3;return n}function f(e,t,n){if(t.image){let r=t.image,i=r.naturalWidth||r.width,a=r.naturalHeight||r.height,o=Math.min(n/i,n/a);e.imageSmoothingEnabled=!0,e.drawImage(r,(n-i*o)*.5,(n-a*o)*.5,i*o,a*o)}else e.font=`${Math.round(n*.8)}px ${c}`,e.textAlign=`center`,e.textBaseline=`middle`,e.fillText(t.text||``,n*.5,n*.5)}function p(e,{size:t=512,margin:n=.06,edgeWidth:r=.05,edgeDepth:i=.3,depthMode:a=`edge`,maskMode:o=`alpha`}={}){let s=l(t),c=l(t),p=l(t),m=s.getContext(`2d`,{willReadFrequently:!0}),h=c.getContext(`2d`),g=p.getContext(`2d`,{willReadFrequently:!0});f(g,e,t);let _=h.createImageData(t,t),v=_.data,y=u(g.getImageData(0,0,t,t).data,t);if(!y){for(let e=3;e<v.length;e+=4)v[e]=255;return h.putImageData(_,0,0),{color:s,depth:c,size:t}}let b=t*(1-n*2),x=Math.min(b/y.w,b/y.h),S=y.w*x,C=y.h*x;m.imageSmoothingEnabled=!0,m.drawImage(p,y.x,y.y,y.w,y.h,(t-S)*.5,(t-C)*.5,S,C);let w=m.getImageData(0,0,t,t).data,T=new Uint8Array(t*t),E=e=>.299*w[e]+.587*w[e+1]+.114*w[e+2];for(let e=0;e<T.length;e++){let t=e*4;T[e]=+(w[t+3]>127&&(o!==`notWhite`||E(t)<235))}let D=d(T,t),O=Math.max(r*t,1);for(let e=0;e<t*t;e++){let t=e*4,n=0;T[e]&&(n=a===`flat`?1:a===`luma`?i+(1-i)*(E(t)/255):i+(1-i)*Math.min(Math.max(D[e]/O,0),1));let r=Math.round(n*255);v[t]=r,v[t+1]=r,v[t+2]=r,v[t+3]=255}return h.putImageData(_,0,0),{color:s,depth:c,size:t}}var m=1024;function h(e,t){let n=e.getAttribute(t)||``;return/%/.test(n)?0:parseFloat(n)||0}function g(e){let t=new DOMParser().parseFromString(e,`image/svg+xml`).documentElement,n=(t.getAttribute(`viewBox`)||``).trim().split(/[\s,]+/).map(Number),r=h(t,`width`),i=h(t,`height`);!(r>0&&i>0)&&n.length===4&&n[2]>0&&n[3]>0&&(r=n[2],i=n[3]),r>0&&i>0||(r=i=m);let a=m/Math.max(r,i);return t.setAttribute(`width`,Math.round(r*a)),t.setAttribute(`height`,Math.round(i*a)),new Blob([new XMLSerializer().serializeToString(t)],{type:`image/svg+xml`})}async function _(e){let t=e.type===`image/svg+xml`||/\.svg$/i.test(e.name)?g(await e.text()):e,n=URL.createObjectURL(t);try{let e=new Image;return e.src=n,await e.decode(),e}finally{URL.revokeObjectURL(n)}}var v=[`main`,`lime-light`,`coral`,`apricot`,`sky`,`steel`,`sage`,`grey`,`dark-grey`,`border`,`white`,`black`],y={"footer · peach":`#ffc2aa`};function b(e){let t=String(e||``).trim().toLowerCase();return/^#[0-9a-f]{6}$/.test(t)?t:/^#[0-9a-f]{3}$/.test(t)?`#${t[1]}${t[1]}${t[2]}${t[2]}${t[3]}${t[3]}`:``}function x(){let e=getComputedStyle(document.documentElement),t={};return v.forEach(n=>{let r=b(e.getPropertyValue(`--color-${n}`));r&&(t[`brand · ${n}`]=r)}),{...t,...y}}function S(e,t){let n=b(t);return Object.keys(e).find(t=>e[t]===n)||``}var C=0,w=1,T=2;function E(e,t,n){return`#${[e,t,n].map(e=>e.toString(16).padStart(2,`0`)).join(``)}`}function D(e){return+e.toFixed(3)}function O({color:e,depth:t,jitter:n,cells:r,size:i,params:a}){let o=Array(r*r);for(let s=0;s<r;s++)for(let c=0;c<r;c++){let l=Math.floor((c+.5)/r*i),u=((i-1-Math.floor((s+.5)/r*i))*i+l)*4,d=n[s*r+c]/255,f=t[u]/255+(d-.5)*a.jitter,p=(.299*e[u]+.587*e[u+1]+.114*e[u+2])/255,m={type:C};f>a.depthHi?m=p>=a.lumaDark?{type:T,fill:a.colorMode===`emoji`?E(e[u],e[u+1],e[u+2]):a.figureColor}:a.accentMode===`luma`?{type:T,fill:a.accentColor}:{type:w}:f>a.depthLo&&(m=a.accentMode===`depth`&&f>a.accentDepth?{type:T,fill:a.accentColor}:{type:w}),o[s*r+c]=m}return o}function k({grid:e,cells:t,pad:n,cellPx:r,params:i}){let a=t+n*2,o=new Map,s=[];for(let r=0;r<t;r++)for(let i=0;i<t;i++){let a=e[r*t+i];if(a.type===C)continue;let c=n+i,l=n+(t-1-r);a.type===w?s.push(`<use href="#g" x="${c}" y="${l}" width="1" height="1"/>`):o.set(a.fill,(o.get(a.fill)||``)+`M${c} ${l}h1v1h-1z`)}let c=D(.5-i.armW),l=D(i.armW*2),u=D(i.pad),d=D(1-i.pad*2),f=`<symbol id="g" viewBox="0 0 1 1"><rect width="1" height="1" fill="${i.cellColor}"/><rect x="${c}" y="${u}" width="${l}" height="${d}" fill="${i.crossColor}"/><rect x="${u}" y="${c}" width="${d}" height="${l}" fill="${i.crossColor}"/></symbol>`,p=[];return o.forEach((e,t)=>p.push(`<path fill="${t}" d="${e}"/>`)),s.length&&p.push(`<g>${s.join(``)}</g>`),`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${a} ${a}" width="${a*r}" height="${a*r}" shape-rendering="crispEdges"><defs>${f}</defs>`+p.join(``)+`</svg>`}var A=`#version 300 es

in vec3 position;
in vec2 uv;

out vec2 vUv;

void main()
{
    vUv = uv;

    gl_Position = vec4(position, 1.0);
}`,j=`#version 300 es

precision highp float;

uniform sampler2D uColor;
uniform sampler2D uDepth;
uniform sampler2D uJitterTex;
uniform float uHasEmoji;
uniform vec2 uViewport;
uniform float uCellSize;
uniform float uCells;
uniform vec2 uOffset;
uniform vec3 uFigureColor;
uniform vec3 uAccentColor;
uniform float uAccentMode;
uniform float uAccentDepth;
uniform vec3 uCellColor;
uniform vec3 uCrossColor;
uniform float uDepthHi;
uniform float uDepthLo;
uniform float uLumaDark;
uniform float uJitter;
uniform float uArmW;
uniform float uPad;
uniform float uColorMode;

in vec2 vUv;

out vec4 fragColor;

vec3 glyphColor(vec2 cellUv)
{
    float vBar = step(abs(cellUv.x - 0.5), uArmW) * step(abs(cellUv.y - 0.5), 0.5 - uPad);
    float hBar = step(abs(cellUv.y - 0.5), uArmW) * step(abs(cellUv.x - 0.5), 0.5 - uPad);
    float crossMask = clamp(vBar + hBar, 0.0, 1.0);

    return mix(uCellColor, uCrossColor, crossMask);
}

void main()
{
    vec2 px = vUv * uViewport;
    vec2 cell = floor(px / uCellSize);
    vec2 cellUv = fract(px / uCellSize);

    vec3 col = vec3(0.0);

    float boxPx = uCells * uCellSize;
    vec2 boxOrigin = floor((uViewport * 0.5 - boxPx * 0.5 + uOffset) / uCellSize) * uCellSize;

    
    vec2 rel = cell - boxOrigin / uCellSize;
    float h = texture(uJitterTex, (rel + 0.5) / uCells).r;

    vec2 cellCenter = (cell + 0.5) * uCellSize;
    vec2 tUv = (cellCenter - boxOrigin) / boxPx;

    float figure = 0.0;

    if (uHasEmoji > 0.5 && tUv.x >= 0.0 && tUv.x <= 1.0 && tUv.y >= 0.0 && tUv.y <= 1.0)
    {
        vec4 c = texture(uColor, tUv);
        float depth = texture(uDepth, tUv).r + (h - 0.5) * uJitter;
        float luma = dot(c.rgb, vec3(0.299, 0.587, 0.114));

        if (depth > uDepthHi)
        {
            if (luma >= uLumaDark) col = uColorMode > 0.5 ? c.rgb : uFigureColor;
            else if (uAccentMode == 1.0) col = uAccentColor;
            else col = glyphColor(cellUv);

            figure = 1.0;
        }
        else if (depth > uDepthLo)
        {
            if (uAccentMode == 2.0 && depth > uAccentDepth) col = uAccentColor;
            else col = glyphColor(cellUv);

            figure = 1.0;
        }
    }

    fragColor = vec4(col * figure, figure);
}`,M={source:`emoji`,emoji:`🚀`,file:``,maskMode:`alpha`,cells:48,cellSize:8,offsetX:0,offsetY:0,depthMode:`edge`,edgeWidth:.05,edgeDepth:.3,sourceSize:512,figureColor:`#ffc2aa`,accentColor:`#fa8e66`,accentMode:`off`,accentDepth:.38,cellColor:`#aac2aa`,crossColor:`#ffffff`,depthHi:.49,depthLo:.22,lumaDark:.53,jitter:.26,seed:0,animSpeed:0,armW:.07,pad:.16,colorMode:`figure`,exportCellPx:16,exportPadCells:1},N={off:0,luma:1,depth:2};function P(e){let t=e>>>0;return()=>{t=t+1831565813>>>0;let e=t;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}}function F(e,t){let n=P(t*7919+1),r=new Uint8Array(e*e*4);for(let t=0;t<e*e;t++){let e=Math.floor(n()*256);r[t*4]=e,r[t*4+1]=e,r[t*4+2]=e,r[t*4+3]=255}return r}var I=class{constructor(e,t,n,r){this.app=e,this.gl=t,this.scene=n,this.section=r,this.section&&(this.sizes=this.app.sizes,this.time=this.app.time,this.renderer=this.gl.renderer.instance,this.context=this.renderer.gl,this.params={...M,emoji:this.section.dataset.emoji||M.emoji},this.init())}init(){this.setFallbackTexture(),this.setTextures(),this.setMaterial(),this.setMesh(),this.setUpload(),this.setGui()}setFallbackTexture(){this.blackTexture=new t(this.context,{image:new Uint8Array([0,0,0,255]),width:1,height:1,generateMipmaps:!1})}setTextures(){let e={generateMipmaps:!1,minFilter:this.context.NEAREST,magFilter:this.context.NEAREST};this.colorTexture=new t(this.context,e),this.depthTexture=new t(this.context,e),this.jitterTexture=new t(this.context,{...e,flipY:!1}),this.rebuildEmoji(),this.rebuildJitter()}rebuildJitter(e=0){let t=Math.round(this.params.cells);this.jitter=F(t,this.params.seed+e),this.jitterTexture.image=this.jitter,this.jitterTexture.width=t,this.jitterTexture.height=t,this.jitterTexture.needsUpdate=!0}rebuildEmoji(){let e=this.params,{color:t,depth:n}=p(e.source===`file`&&this.fileImage?{image:this.fileImage}:{text:e.emoji},{size:e.sourceSize,edgeWidth:e.edgeWidth,edgeDepth:e.edgeDepth,depthMode:e.depthMode,maskMode:e.maskMode});this.colorTexture.image=t,this.colorTexture.needsUpdate=!0,this.depthTexture.image=n,this.depthTexture.needsUpdate=!0,this.material&&(this.material.uniforms.uHasEmoji.value=1)}setUpload(){this.fileInput=document.createElement(`input`),this.fileInput.type=`file`,this.fileInput.accept=`image/png,image/svg+xml,image/jpeg,image/webp`,this.fileInput.hidden=!0,this.fileInput.addEventListener(`change`,()=>this.loadFile(this.fileInput.files[0])),document.body.appendChild(this.fileInput),this.onDrag=e=>e.preventDefault(),this.onDrop=e=>{e.preventDefault(),this.loadFile(e.dataTransfer?.files[0])},window.addEventListener(`dragover`,this.onDrag),window.addEventListener(`drop`,this.onDrop)}async loadFile(e){if(e){try{this.fileImage=await _(e)}catch(e){console.warn(`[emoji] could not load file`,e);return}this.params.file=e.name,this.params.source=`file`,this.pane?.refresh(),this.rebuildEmoji()}}setMaterial(){let t=this.params;this.material=new e(this.context,{vertex:A,fragment:j,transparent:!0,depthTest:!1,depthWrite:!1,cullFace:!1,uniforms:{uColor:{value:this.colorTexture},uDepth:{value:this.depthTexture},uJitterTex:{value:this.jitterTexture},uHasEmoji:{value:1},uViewport:{value:new a(this.sizes.width,this.sizes.height)},uCellSize:{value:t.cellSize},uCells:{value:t.cells},uOffset:{value:new a(t.offsetX,t.offsetY)},uFigureColor:{value:new o(t.figureColor)},uAccentColor:{value:new o(t.accentColor)},uAccentMode:{value:N[t.accentMode]},uAccentDepth:{value:t.accentDepth},uCellColor:{value:new o(t.cellColor)},uCrossColor:{value:new o(t.crossColor)},uDepthHi:{value:t.depthHi},uDepthLo:{value:t.depthLo},uLumaDark:{value:t.lumaDark},uJitter:{value:t.jitter},uArmW:{value:t.armW},uPad:{value:t.pad},uColorMode:{value:+(t.colorMode===`emoji`)}}})}setMesh(){this.geometry=new r(this.context,{width:2,height:2}),this.mesh=new n(this.context,{geometry:this.geometry,program:this.material,frustumCulled:!1,renderOrder:0}),this.mesh.setParent(this.scene)}update(){if(!this.mesh||!this.params.animSpeed)return;let e=Math.floor(this.time.elapsed*.001*this.params.animSpeed);e!==this.jitterFrame&&(this.jitterFrame=e,this.rebuildJitter(e))}resize(){this.mesh&&this.material.uniforms.uViewport.value.set(this.sizes.width,this.sizes.height)}setGui(){this.pane=new s({title:`Emoji`});let e=this.material.uniforms,t=this.params,n=(e,n,r,i)=>{let a=e.addBinding(t,n,r);return i&&a.on(`change`,e=>i(e.value,e)),a},r=(e,t)=>t.last&&this.rebuildEmoji();n(this.pane,`source`,{options:{Emoji:`emoji`,File:`file`}},r),n(this.pane,`emoji`,{},r),this.pane.addButton({title:`Upload PNG / SVG`}).on(`click`,()=>this.fileInput.click()),this.pane.addBinding(t,`file`,{readonly:!0}),n(this.pane,`cells`,{min:8,max:160,step:1},t=>{e.uCells.value=t,this.rebuildJitter()}),n(this.pane,`cellSize`,{label:`cell size`,min:4,max:32,step:1},t=>e.uCellSize.value=t),n(this.pane,`offsetX`,{label:`offset x`,min:-800,max:800,step:1},n=>e.uOffset.value.set(n,t.offsetY)),n(this.pane,`offsetY`,{label:`offset y`,min:-800,max:800,step:1},n=>e.uOffset.value.set(t.offsetX,n));let i=this.pane.addFolder({title:`🏔️ Depth`,expanded:!1});n(i,`depthMode`,{label:`mode`,options:{Edge:`edge`,Luma:`luma`,Flat:`flat`}},r),n(i,`edgeWidth`,{label:`edge width`,min:.005,max:.25,step:.005},r),n(i,`edgeDepth`,{label:`edge depth`,min:0,max:1,step:.01},r),n(i,`maskMode`,{label:`mask`,options:{Alpha:`alpha`,"Not white":`notWhite`}},r),n(i,`sourceSize`,{label:`source px`,options:{256:256,512:512,1024:1024}},r);let a=x(),o={custom:``,...Object.fromEntries(Object.keys(a).map(e=>[e,e]))},c={},l=[[`figureColor`,`figure`,e.uFigureColor],[`accentColor`,`accent`,e.uAccentColor],[`cellColor`,`glyph cell`,e.uCellColor],[`crossColor`,`glyph cross`,e.uCrossColor]],u=this.pane.addFolder({title:`🎨 Colors`,expanded:!0});l.forEach(([e,n,r])=>{c[e]=S(a,t[e]);let i=u.addBinding(c,e,{label:`${n} preset`,options:o}),s=u.addBinding(t,e,{label:n});i.on(`change`,n=>{let i=a[n.value];i&&(t[e]=i,r.value.set(i),s.refresh())}),s.on(`change`,t=>{r.value.set(t.value),c[e]=S(a,t.value),i.refresh()})});let d=this.pane.addFolder({title:`👁️ Look`,expanded:!0});n(d,`accentMode`,{label:`accent`,options:{Off:`off`,"Dark luma":`luma`,"Depth band":`depth`}},t=>e.uAccentMode.value=N[t]),n(d,`accentDepth`,{label:`accent depth`,min:0,max:1,step:.01},t=>e.uAccentDepth.value=t),n(d,`depthHi`,{label:`depth hi`,min:0,max:1,step:.01},t=>e.uDepthHi.value=t),n(d,`depthLo`,{label:`depth lo`,min:0,max:1,step:.01},t=>e.uDepthLo.value=t),n(d,`lumaDark`,{label:`luma dark`,min:0,max:1,step:.01},t=>e.uLumaDark.value=t),n(d,`jitter`,{min:0,max:.5,step:.01},t=>e.uJitter.value=t),n(d,`seed`,{min:0,max:100,step:1},()=>this.rebuildJitter()),n(d,`animSpeed`,{label:`anim speed`,min:0,max:12,step:.5}),n(d,`armW`,{label:`arm width`,min:.02,max:.3,step:.01},t=>e.uArmW.value=t),n(d,`pad`,{min:0,max:.4,step:.01},t=>e.uPad.value=t),n(d,`colorMode`,{label:`core color`,options:{Figure:`figure`,Emoji:`emoji`}},t=>e.uColorMode.value=+(t===`emoji`));let f=this.pane.addFolder({title:`📦 Export`,expanded:!0});n(f,`exportCellPx`,{label:`cell px`,min:2,max:64,step:1}),n(f,`exportPadCells`,{label:`pad cells`,min:0,max:8,step:1}),f.addButton({title:`Export PNG`}).on(`click`,()=>this.exportPng()),f.addButton({title:`Export SVG`}).on(`click`,()=>this.exportSvg())}disposeExportTarget(){this.exportTarget&&=(this.context.deleteFramebuffer(this.exportTarget.buffer),this.context.deleteTexture(this.exportTarget.texture.texture),null)}exportPng({download:e=!0}={}){let t=this.params,n=Math.round(t.cells),r=Math.round(t.exportPadCells),a=Math.round(t.exportCellPx),o=(n+r*2)*a,s=o;this.exportTarget&&(this.exportTarget.width!==o||this.exportTarget.height!==s)&&this.disposeExportTarget(),this.exportTarget||=new i(this.context,{width:o,height:s,depth:!1,minFilter:this.context.LINEAR});let c=this.material.uniforms,l=c.uViewport.value.clone(),u=c.uOffset.value.clone(),d=c.uCellSize.value;c.uViewport.value.set(o,s),c.uCellSize.value=a,c.uOffset.value.set(0,0),this.renderer.render({scene:this.mesh,target:this.exportTarget,clear:!0}),this.renderer.bindFramebuffer(this.exportTarget);let f=new Uint8Array(o*s*4);this.context.readPixels(0,0,o,s,this.context.RGBA,this.context.UNSIGNED_BYTE,f),this.renderer.bindFramebuffer(),c.uViewport.value.copy(l),c.uOffset.value.copy(u),c.uCellSize.value=d;let p=document.createElement(`canvas`);p.width=o,p.height=s;let m=p.getContext(`2d`),h=m.createImageData(o,s),g=h.data,_=o*4;for(let e=0;e<s;e++){let t=(s-1-e)*_,n=e*_;for(let e=0;e<_;e+=4){let r=f[t+e+3];g[n+e]=r===0?0:f[t+e],g[n+e+1]=r===0?0:f[t+e+1],g[n+e+2]=r===0?0:f[t+e+2],g[n+e+3]=r}}return m.putImageData(h,0,0),e&&p.toBlob(e=>e&&this.download(e,this.fileName(`png`))),p}download(e,t){let n=URL.createObjectURL(e),r=document.createElement(`a`);r.href=n,r.download=t,r.click(),URL.revokeObjectURL(n)}fileName(e){let t=this.params,n=Math.round(t.cells);return t.source===`file`&&t.file?`icon-${t.file.replace(/\.[^.]+$/,``)}-${n}c.${e}`:`emoji-${[...t.emoji].map(e=>e.codePointAt(0).toString(16)).join(`-`)}-${n}c.${e}`}exportSvg({download:e=!0}={}){let t=this.params,n=Math.round(t.cells),r=this.colorTexture.image.width,i=e=>e.getContext(`2d`).getImageData(0,0,r,r).data,a=k({grid:O({color:i(this.colorTexture.image),depth:i(this.depthTexture.image),jitter:this.jitter.filter((e,t)=>t%4==0),cells:n,size:r,params:t}),cells:n,pad:Math.round(t.exportPadCells),cellPx:Math.round(t.exportCellPx),params:t});return e&&this.download(new Blob([a],{type:`image/svg+xml`}),this.fileName(`svg`)),a}destroy(){this.pane?.dispose(),this.fileInput?.remove(),window.removeEventListener(`dragover`,this.onDrag),window.removeEventListener(`drop`,this.onDrop),this.disposeExportTarget(),this.geometry?.remove?.(),this.mesh&&this.scene.removeChild(this.mesh)}},L=class{constructor(e,t,n,r){this.gl=e,this.app=t,this.scene=n,this.sizes=t.sizes,this.emoji=new I(t,e,n,r?.querySelector(`[data-emoji-trigger]`))}onMouseMove(){}setScroll(){}update(){this.emoji?.update()}resize(){this.emoji?.resize()}destroy(){this.emoji?.destroy(),this.emoji=null}},R=class{constructor(e,t){this.main=e,this.app=t,this.triggerLoad=async()=>this.load()}async load(){this.app.gl&&(this.world=new L(this.app.gl,this.app,this.app.gl.scene,this.main),this.app.gl.world=this.world,this.app.gl.loaded=!0,window.devEmoji=this.world.emoji)}};export{R as default};