import{i as e,n as t,r as n,t as r}from"./Plane.CXPNF1Te.js?dpl=dpl_74aUw43o7S3n9NFJ1ZxBM24TaWuz";import{t as i}from"./Vec2.Cn17CgjE.js?dpl=dpl_74aUw43o7S3n9NFJ1ZxBM24TaWuz";import{t as a}from"./Color.xVu7ktDx.js?dpl=dpl_74aUw43o7S3n9NFJ1ZxBM24TaWuz";var o=`#version 300 es

in vec3 position;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

out vec2 vUv;

void main()
{
    vUv = position.xy + 0.5;

    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    gl_Position = projectionMatrix * viewMatrix * modelPosition;
}`,s=`#version 300 es

precision highp float;

uniform sampler2D uTexture;
uniform float uHasVideo;
uniform vec2 uVideoRes;
uniform float uCellSize;
uniform vec3 uBgColor;
uniform vec3 uBgDot1;
uniform vec3 uBgDot2;
uniform vec3 uFigureColor;
uniform vec3 uCellColor;
uniform vec3 uCrossColor;
uniform float uDepthHi;
uniform float uDepthLo;
uniform float uLumaDark;
uniform float uPackScale;
uniform float uSideOff;
uniform float uJitter;
uniform float uScale;
uniform float uOffsetY;
uniform float uDotSize;
uniform float uArmW;
uniform float uPad;
uniform vec2 uSideCenter;
uniform float uSideWidth;
uniform float uSingle;
uniform float uTime;
uniform float uAnimSpeed;
uniform sampler2D uFluid;
uniform vec2 uViewport;
uniform float uFluidStrength;
uniform float uFluidSwell;
uniform float uPulse;
uniform float uPulseScramble;
uniform float uReveal;
uniform float uRevealJitter;
uniform sampler2D uFireworks;
uniform float uFireworksActive;
uniform float uVideoHide;

in vec2 vUv;

out vec4 fragColor;

float hash(vec2 p)
{
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

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

    vec2 sub = floor(cellUv * 2.0);
    vec2 subUv = fract(cellUv * 2.0);
    float checker = mod(cell.x + cell.y + sub.x + sub.y, 2.0);
    vec3 dotCol = mix(uBgDot1, uBgDot2, checker);
    float mask = step(max(abs(subUv.x - 0.5), abs(subUv.y - 0.5)), uDotSize);
    vec3 col = mix(uBgColor, dotCol, mask);

    vec2 cellCenter = (cell + 0.5) * uCellSize;
    float h = hash(cell + floor(uTime * uAnimSpeed) + floor(uPulse * uPulseScramble));

    vec2 fluidUv = cellCenter / uViewport;
    float energy = texture(uFluid, fluidUv).r;

    if (energy * uFluidStrength > 0.3 + h * 0.6) col = glyphColor(cellUv);

    if (uHasVideo > 0.5 && hash(cell * 2.17 + 5.3) >= uVideoHide)
    {
        float halfW = uViewport.x * 0.5;
        float sideIdx = uSingle > 0.5 || cellCenter.x < halfW ? 0.0 : 1.0;

        float s = min(uSideWidth / uVideoRes.x, uViewport.y / uVideoRes.y) * uScale;
        vec2 vidSize = uVideoRes * s;
        float centerX = mix(uSideCenter.x, uSideCenter.y, sideIdx);
        vec2 offset = vec2(centerX - vidSize.x * 0.5, (uViewport.y - vidSize.y) * uOffsetY);

        vec2 vidUv = (cellCenter - offset) / vidSize;

        if (vidUv.x >= 0.0 && vidUv.x <= 1.0 && vidUv.y >= 0.0 && vidUv.y <= 1.0)
        {
            vidUv.x = clamp(vidUv.x, 0.006, 0.994);

            float paneX = sideIdx * uSideOff + vidUv.x * uPackScale;
            vec3 vidCol = texture(uTexture, vec2(paneX, vidUv.y)).rgb;
            float depth = texture(uTexture, vec2(paneX + uPackScale, vidUv.y)).r;

            depth += (h - 0.5) * uJitter + energy * uFluidSwell;

            float luma = dot(vidCol, vec3(0.299, 0.587, 0.114));

            if (depth > uDepthHi)
            {
                if (luma < uLumaDark) col = glyphColor(cellUv);
                else col = uFigureColor;
            }
            else if (depth > uDepthLo)
            {
                col = glyphColor(cellUv);
            }
        }
    }

    float fwCell = 0.0;
    if (uFireworksActive > 0.5)
    {
        vec4 fw = texture(uFireworks, fluidUv);
        if (fw.a > 0.35 + h * 0.4)
        {
            col = fw.rgb / max(fw.a, 0.001);
            fwCell = 1.0;
        }
        else if (fw.a > 0.12 + h * 0.2)
        {
            col = glyphColor(cellUv);
            fwCell = 1.0;
        }
    }

    float grad = cellCenter.y / uViewport.y;
    float rh = hash(cell * 1.37 + 13.7);
    float revealT = mix(grad, rh, uRevealJitter);
    float alpha = max(step(revealT, uReveal), fwCell);

    
    fragColor = vec4(col * alpha, alpha);
}`,c={cellSize:8,bgColor:`#b1d3fe`,bgDot1:`#9fc0f2`,bgDot2:`#c9dcff`,figureColor:`#ffc2aa`,cellColor:`#aac2aa`,crossColor:`#ffffff`,depthHi:.49,depthLo:.22,lumaDark:.53,jitter:.26,scale:1,offsetY:.5,dotSize:.35,armW:.07,pad:.16,animSpeed:0,fluidStrength:.6,fluidSwell:.12,pulseStrength:1,pulseDecay:.92,pulseScramble:14,typeSplats:6,typeRadius:58,typeForce:500,revealJitter:.61,revealSpan:1},l=class{constructor(e,t,n,r){this.app=e,this.gl=t,this.scene=n,this.section=r,this.section&&(this.sizes=this.app.sizes,this.time=this.app.time,this.renderer=this.gl.renderer.instance,this.context=this.renderer.gl,this.params={...c},this.init())}init(){this.updateRects(),this.setFallbackTexture(),this.setMaterial(),this.setSideCenters(),this.setMesh(),this.setVideo(),this.setTyping(),this.setLayoutObserver(),this.setDebug()}setFallbackTexture(){this.blackTexture=new t(this.context,{image:new Uint8Array([0,0,0,255]),width:1,height:1,generateMipmaps:!1})}setMaterial(){this.material=new e(this.context,{vertex:o,fragment:s,transparent:!0,depthTest:!1,depthWrite:!1,cullFace:!1,uniforms:{uTexture:{value:this.blackTexture},uHasVideo:{value:0},uVideoRes:{value:new i(960,534)},uCellSize:{value:this.params.cellSize},uBgColor:{value:new a(this.params.bgColor)},uBgDot1:{value:new a(this.params.bgDot1)},uBgDot2:{value:new a(this.params.bgDot2)},uFigureColor:{value:new a(this.params.figureColor)},uCellColor:{value:new a(this.params.cellColor)},uCrossColor:{value:new a(this.params.crossColor)},uDepthHi:{value:this.params.depthHi},uDepthLo:{value:this.params.depthLo},uLumaDark:{value:this.params.lumaDark},uPackScale:{value:.5},uSideOff:{value:0},uJitter:{value:this.params.jitter},uScale:{value:this.params.scale},uOffsetY:{value:this.params.offsetY},uDotSize:{value:this.params.dotSize},uArmW:{value:this.params.armW},uPad:{value:this.params.pad},uSideCenter:{value:new i(this.sizes.width*.25,this.sizes.width*.75)},uSideWidth:{value:this.sizes.width*.5},uSingle:{value:0},uTime:{value:0},uAnimSpeed:{value:this.params.animSpeed},uFluid:{value:this.blackTexture},uViewport:{value:new i(this.sizes.width,this.sizes.height)},uFluidStrength:{value:this.params.fluidStrength},uFluidSwell:{value:this.params.fluidSwell},uPulse:{value:0},uPulseScramble:{value:this.params.pulseScramble},uReveal:{value:0},uRevealJitter:{value:this.params.revealJitter},uFireworks:{value:this.blackTexture},uFireworksActive:{value:0},uVideoHide:{value:0}}})}setMesh(){this.geometry=new r(this.context,{width:1,height:1}),this.mesh=new n(this.context,{geometry:this.geometry,program:this.material,frustumCulled:!1,renderOrder:0}),this.mesh.scale.set(this.sizes.width,this.sizes.height,1),this.mesh.setParent(this.scene),this.setPosition()}updateRects(){this.section&&(this.rects=this.section.getBoundingClientRect())}setScroll(){this.updateRects()}setLayoutObserver(){this.layoutObserver=new ResizeObserver(()=>{this.updateRects(),this.setSideCenters()}),this.layoutObserver.observe(document.body)}setSideCenters(){let e=this.sizes.width,t=this.material.uniforms,n=window.matchMedia(`(max-width: 1023px)`).matches;if(t.uSingle.value=+!!n,n){t.uSideCenter.value.set(e*.5,e*.5),t.uSideWidth.value=e;return}let r=document.querySelector(`.nav_legal`),i=r?Math.max((e-r.offsetWidth)*.5,0):e*.5;t.uSideCenter.value.set(i*.5,e-i*.5),t.uSideWidth.value=i}setPosition(){if(!this.mesh)return;let e=this.rects.bottom>0&&this.rects.top<this.sizes.height;this.mesh.visible=e;let t=(this.sizes.height-this.rects.top)/(this.sizes.height*this.params.revealSpan),n=Math.min(Math.max(t,0),1);this.material.uniforms.uReveal.value=n*1.02}setVideo(){if(this.video=document.createElement(`video`),this.video.muted=!0,this.video.loop=!0,this.video.playsInline=!0,this.video.autoplay=!1,this.video.preload=`metadata`,this.video.crossOrigin=`anonymous`,this.texture=new t(this.context,{generateMipmaps:!1,minFilter:this.context.LINEAR,magFilter:this.context.LINEAR}),this.material.uniforms.uTexture.value=this.texture,this.textureBound=!1,this.videoFrameReady=!1,this.lastVideoTime=-1,this.hasRVFC=`requestVideoFrameCallback`in this.video,this.hasRVFC){let e=()=>{this.videoFrameReady=!0,this.rvfcId=this.video.requestVideoFrameCallback(e)};this.rvfcId=this.video.requestVideoFrameCallback(e)}this.observer=new IntersectionObserver(e=>{e.forEach(e=>{this.sectionInView=e.isIntersecting,e.isIntersecting?this.video.play().catch(()=>{}):this.video.pause()})}),this.observer.observe(this.section),this.nearObserver=new IntersectionObserver(([e])=>{e.isIntersecting&&(this.nearObserver.disconnect(),this.video.preload=`auto`,this.video.src=this.section.dataset.footerVideo||`/video/footer.mp4`,this.sectionInView&&this.video.play().catch(()=>{}))},{rootMargin:`300% 0px`}),this.nearObserver.observe(this.section)}setTyping(){this.pulse=0,this.onType=e=>{if(!e.target.matches(`input`))return;let t=e.target.getBoundingClientRect(),n=t.left+t.width/2,r=t.top+t.height/2;this.pulse=1;let i=this.gl.world?.fluid;if(!i)return;let a=Math.round(this.params.typeSplats);for(let e=0;e<a;e++){let t=e/a*Math.PI*2+Math.random()*.6;i.splats.push({x:(n+Math.cos(t)*this.params.typeRadius)/this.sizes.width,y:1-(r+Math.sin(t)*this.params.typeRadius)/this.sizes.height,dx:Math.cos(t)*this.params.typeForce,dy:-Math.sin(t)*this.params.typeForce})}i.lastInput=this.time?.elapsed??0},document.addEventListener(`input`,this.onType)}update(){if(!this.mesh||(this.setPosition(),!this.mesh.visible))return;let e=this.material.uniforms;e.uTime.value=this.time.elapsed*.001,e.uFluid.value=this.gl.fluidTexture||this.blackTexture,this.pulse*=this.params.pulseDecay,e.uPulse.value=this.pulse*this.params.pulseStrength;let t=this.pulse>.001||e.uFireworksActive.value>.5;if(!this.video||this.video.readyState<2)return t;this.textureBound||=(this.texture.image=this.video,!0);let n=!1;if(this.hasRVFC?this.videoFrameReady&&(this.texture.needsUpdate=!0,this.videoFrameReady=!1,n=!0):this.video.currentTime!==this.lastVideoTime&&(this.lastVideoTime=this.video.currentTime,this.texture.needsUpdate=!0,n=!0),this.video.videoWidth&&e.uHasVideo.value<.5){let t=this.video.videoWidth/this.video.videoHeight>2;e.uPackScale.value=t?.25:.5,e.uSideOff.value=t?.5:0,e.uVideoRes.value.set(this.video.videoWidth*(t?.25:.5),this.video.videoHeight),e.uHasVideo.value=1}return t||n}resize(){this.mesh&&(this.mesh.scale.set(this.sizes.width,this.sizes.height,1),this.material.uniforms.uViewport.value.set(this.sizes.width,this.sizes.height),this.updateRects(),this.setSideCenters())}setDebug(){let e=this.app.debug;e&&e.getGui().then(e=>{if(!e)return;this.gui=e.addFolder(`Footer`);let t=this.material.uniforms,n=this.params;this.gui.add(n,`cellSize`,6,28,1).onChange(e=>t.uCellSize.value=e),this.gui.addColor(n,`bgColor`).onChange(e=>t.uBgColor.value.set(e)),this.gui.addColor(n,`bgDot1`).onChange(e=>t.uBgDot1.value.set(e)),this.gui.addColor(n,`bgDot2`).onChange(e=>t.uBgDot2.value.set(e)),this.gui.addColor(n,`figureColor`).onChange(e=>t.uFigureColor.value.set(e)),this.gui.addColor(n,`cellColor`).onChange(e=>t.uCellColor.value.set(e)),this.gui.addColor(n,`crossColor`).onChange(e=>t.uCrossColor.value.set(e)),this.gui.add(n,`depthHi`,0,1,.01).onChange(e=>t.uDepthHi.value=e),this.gui.add(n,`depthLo`,0,1,.01).onChange(e=>t.uDepthLo.value=e),this.gui.add(n,`lumaDark`,0,1,.01).onChange(e=>t.uLumaDark.value=e),this.gui.add(n,`jitter`,0,.5,.01).onChange(e=>t.uJitter.value=e),this.gui.add(n,`scale`,.2,1,.01).onChange(e=>t.uScale.value=e),this.gui.add(n,`offsetY`,0,1,.01).onChange(e=>t.uOffsetY.value=e),this.gui.add(n,`dotSize`,.05,.5,.01).onChange(e=>t.uDotSize.value=e),this.gui.add(n,`armW`,.02,.3,.01).onChange(e=>t.uArmW.value=e),this.gui.add(n,`pad`,0,.4,.01).onChange(e=>t.uPad.value=e),this.gui.add(n,`animSpeed`,0,12,.5).onChange(e=>t.uAnimSpeed.value=e),this.gui.add(n,`fluidStrength`,0,1.5,.01).onChange(e=>t.uFluidStrength.value=e),this.gui.add(n,`fluidSwell`,0,.5,.01).onChange(e=>t.uFluidSwell.value=e),this.gui.add(n,`pulseStrength`,0,1,.01),this.gui.add(n,`pulseDecay`,.8,.99,.005),this.gui.add(n,`pulseScramble`,0,24,1).onChange(e=>t.uPulseScramble.value=e),this.gui.add(n,`typeSplats`,1,16,1),this.gui.add(n,`typeRadius`,0,200,1),this.gui.add(n,`typeForce`,0,2e3,10),this.gui.add(n,`revealJitter`,0,1,.01).onChange(e=>t.uRevealJitter.value=e),this.gui.add(n,`revealSpan`,.3,1.5,.01)})}destroy(){this.gui?.destroy(),this.observer?.disconnect(),this.nearObserver?.disconnect(),this.layoutObserver?.disconnect(),this.onType&&document.removeEventListener(`input`,this.onType),this.video&&(this.hasRVFC&&this.rvfcId&&this.video.cancelVideoFrameCallback(this.rvfcId),this.video.pause(),this.video.src=``,this.video.load()),this.geometry?.remove?.(),this.mesh&&this.scene.removeChild(this.mesh)}};export{l as t};