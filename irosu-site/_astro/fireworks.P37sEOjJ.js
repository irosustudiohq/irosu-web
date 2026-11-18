import{t as e}from"./Color.xVu7ktDx.js?dpl=dpl_74aUw43o7S3n9NFJ1ZxBM24TaWuz";import{a as t,i as n,r,t as i}from"./Plane.CXPNF1Te.js?dpl=dpl_74aUw43o7S3n9NFJ1ZxBM24TaWuz";import{t as a}from"./RenderTarget.CgxThfbt.js?dpl=dpl_74aUw43o7S3n9NFJ1ZxBM24TaWuz";import{n as o,t as s}from"./Vec2.Cn17CgjE.js?dpl=dpl_74aUw43o7S3n9NFJ1ZxBM24TaWuz";import{t as c}from"./Camera.C3KXNr7C.js?dpl=dpl_74aUw43o7S3n9NFJ1ZxBM24TaWuz";import{t as l}from"./Renderer.HD3ID7m7.js?dpl=dpl_74aUw43o7S3n9NFJ1ZxBM24TaWuz";var u=`attribute vec3 position;
attribute vec2 uv;
attribute vec2 aInfo;
attribute vec3 aOffset;
attribute vec3 aColor;
attribute vec2 aTiming;
attribute float aSeed;
attribute float aScale;
attribute float aTilt;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform float uTime;

varying vec2 vUv;
varying vec3 vColor;
varying vec2 vInfo;
varying float vLife;
varying float vSeed;

void main()
{
    vUv = uv;
    vColor = aColor;
    vInfo = aInfo;
    vSeed = aSeed;

    float life = (uTime - aTiming.x) / aTiming.y;
    vLife = life;

    if (life < 0.0 || life > 1.1)
    {
        gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    }
    else
    {
        float ang = aSeed * 6.2831;
        float c = cos(ang);
        float sn = sin(ang);
        vec3 rotated = vec3(position.x * c + position.z * sn, position.y, -position.x * sn + position.z * c);
        if (aInfo.x < 0.5)
        {
            float tc = cos(aTilt);
            float ts = sin(aTilt);
            rotated.xy = vec2(rotated.x * tc - rotated.y * ts, rotated.x * ts + rotated.y * tc);
        }
        vec3 world = rotated * aScale + aOffset;
        gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(world, 1.0);
    }
}
`,d=`precision highp float;

varying vec2 vUv;
varying vec3 vColor;
varying vec2 vInfo;
varying float vLife;
varying float vSeed;

uniform float uLaunch;

float hash(vec2 p)
{
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main()
{
    if (vLife < 0.0 || vLife > 1.05) discard;

    vec3 col;

    if (vInfo.x < 0.5)
    {
        float t = vLife / uLaunch;
        if (t > 1.15) discard;
        if (vUv.y > t) discard;

        float tail = t * 1.5 - 0.5;
        if (vUv.y < tail && hash(vec2(vUv.y * 40.0 + vInfo.y * 90.0, vUv.x * 4.0)) < (tail - vUv.y) * 3.0) discard;

        col = mix(vec3(1.0), vColor, 0.35);
        col = mix(col, vec3(1.0), smoothstep(0.12, 0.0, abs(vUv.y - t)));
    }
    else
    {
        float t = (vLife - uLaunch) / (1.0 - uLaunch);
        if (t < 0.0) discard;
        if (vUv.y > t) discard;

        float tail = t * 1.9 - 0.9;
        float noise = hash(vec2(floor(vUv.y * 60.0) / 60.0 + vInfo.y * 7.0, vInfo.y * 13.0 + vUv.x));
        if (noise < (tail - vUv.y) * 2.6) discard;

        col = mix(vColor, vec3(1.0), smoothstep(0.18, 0.0, t - vUv.y) * 0.7);
    }

    float across = 1.0 - abs(vUv.x * 2.0 - 1.0);
    float alpha = pow(across, 1.6);
    alpha *= 1.0 - smoothstep(0.7, 1.0, vLife);

    gl_FragColor = vec4(col * alpha, alpha);
}
`,f=`#version 300 es

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
}
`,p=`#version 300 es

precision highp float;

uniform sampler2D uFireworks;
uniform vec2 uViewport;
uniform float uCellSize;
uniform vec3 uCellColor;
uniform vec3 uCrossColor;
uniform float uArmW;
uniform float uPad;
uniform float uCore;
uniform float uEdge;
uniform float uShape;
uniform float uGap;

in vec2 vUv;

out vec4 fragColor;

float hash(vec2 p)
{
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main()
{
    vec2 px = vUv * uViewport;
    vec2 cell = floor(px / uCellSize);
    vec2 cellUv = fract(px / uCellSize);
    float h = hash(cell);
    vec4 fw = texture(uFireworks, (cell + 0.5) * uCellSize / uViewport);

    vec2 fromCentre = abs(cellUv - 0.5);
    if (uShape > 1.5 && length(cellUv - 0.5) > 0.5 - uGap) discard;
    if (uShape > 0.5 && uShape < 1.5 && max(fromCentre.x, fromCentre.y) > 0.5 - uGap) discard;

    vec3 col;
    if (fw.a > uCore + h * 0.4)
    {
        col = fw.rgb / max(fw.a, 0.001);
    }
    else if (fw.a > uEdge + h * 0.2)
    {
        float vBar = step(fromCentre.x, uArmW) * step(fromCentre.y, 0.5 - uPad);
        float hBar = step(fromCentre.y, uArmW) * step(fromCentre.x, 0.5 - uPad);
        col = uShape < 0.5 ? mix(uCellColor, uCrossColor, clamp(vBar + hBar, 0.0, 1.0)) : uCellColor;
    }
    else
    {
        discard;
    }

    fragColor = vec4(col, 1.0);
}
`,m={droop:.35,width:.125,radiusDesktop:.32,radiusMobile:.24,volleyDesktop:9,volleyMobile:5,celebration:12,palette:[`#b8aeff`,`#fa8e66`,`#f3bd77`,`#9ec3d5`,`#d3ccff`]},h=12,g=14,_=10,v=class{clock=0;startTime=0;endTime=0;celebrationUntil=0;instanced=null;constructor(e,t,n,r,i={}){this.context=e,this.scene=t,this.sizes=n,this.time=r,this.options=i,this.params=m,this.buildGeometry(),this.setMaterial(),this.setMesh()}buildGeometry(){let e=this.options.rays??(this.sizes.isMobile?26:42),n=this.options.droop??this.params.droop,r=this.options.width??this.params.width,i=this.options.trail??1.35,a=e*15*2+22,o=(e*g+_)*6,s=new Float32Array(a*3),c=new Float32Array(a*2),l=new Float32Array(a*2),u=new Uint16Array(o),d=0,f=0,p=(e,t,n,r,i)=>{let a=d;for(let a=0;a<=n;a++){let o=a/n,u=e[a],f=e[Math.max(a-1,0)],p=e[Math.min(a+1,n)],m=p[0]-f[0],h=p[1]-f[1],g=Math.hypot(m,h),_=1,v=0;g>1e-6&&(_=-h/g,v=m/g);let y=t[a];s[d*3+0]=u[0]+_*y,s[d*3+1]=u[1]+v*y,s[d*3+2]=u[2],c[d*2+0]=0,c[d*2+1]=o,l[d*2+0]=r,l[d*2+1]=i,d++,s[d*3+0]=u[0]-_*y,s[d*3+1]=u[1]-v*y,s[d*3+2]=u[2],c[d*2+0]=1,c[d*2+1]=o,l[d*2+0]=r,l[d*2+1]=i,d++}for(let e=0;e<n;e++){let t=a+e*2;u[f++]=t,u[f++]=t+1,u[f++]=t+2,u[f++]=t+2,u[f++]=t+1,u[f++]=t+3}},m=Math.PI*(3-Math.sqrt(5));for(let t=0;t<e;t++){let i=1-t/(e-1)*2,a=Math.sqrt(Math.max(0,1-i*i)),o=m*t,s=[Math.cos(o)*a,i,Math.sin(o)*a],c=[],l=[];for(let e=0;e<=g;e++){let t=e/g,i=1-(1-t)**3;c.push([s[0]*i,s[1]*i-n*t*t,s[2]*i]),l.push(r*(.35+.65*t)*.5)}p(c,l,g,1,Math.random())}let v=[],y=[];for(let e=0;e<=_;e++){let t=e/_;v.push([Math.sin(t*Math.PI)*.06,-i+i*t,0]),y.push(r*(.4+.6*Math.sin(t*Math.PI))*.5)}if(p(v,y,_,0,Math.random()),!this.instanced){let e=new Float32Array(24),t=new Float32Array(h);for(let n=0;n<h;n++)e[n*2+0]=-1e3,e[n*2+1]=1,t[n]=1;this.instanced={aOffset:new Float32Array(36),aColor:new Float32Array(36),aTiming:e,aSeed:new Float32Array(h),aScale:t,aTilt:new Float32Array(h)}}this.geometry=new t(this.context,{position:{size:3,data:s},uv:{size:2,data:c},aInfo:{size:2,data:l},index:{data:u},aOffset:{size:3,data:this.instanced.aOffset,instanced:1},aColor:{size:3,data:this.instanced.aColor,instanced:1},aTiming:{size:2,data:this.instanced.aTiming,instanced:1},aSeed:{size:1,data:this.instanced.aSeed,instanced:1},aScale:{size:1,data:this.instanced.aScale,instanced:1},aTilt:{size:1,data:this.instanced.aTilt,instanced:1}})}setMaterial(){this.material=new n(this.context,{vertex:u,fragment:d,transparent:!0,depthTest:!1,depthWrite:!1,cullFace:!1,uniforms:{uTime:{value:0},uLaunch:{value:this.options.launch??.32}}})}setMesh(){this.mesh=new r(this.context,{geometry:this.geometry,program:this.material,frustumCulled:!1,renderOrder:1}),this.mesh.setParent(this.scene),this.mesh.visible=!1}startCelebration(e){this.celebrationUntil=this.clock+(e??this.params.celebration),this.launch()}settle(){this.celebrationUntil=Math.min(this.celebrationUntil,this.clock)}get volley(){let e=this.options.volley??(this.sizes.isMobile?this.params.volleyMobile:this.params.volleyDesktop);return Math.min(h,Math.round(e))}spawnSlot(t,n){let r=this.sizes.isMobile,i=this.options.radius??(r?this.params.radiusMobile:this.params.radiusDesktop),a=Math.min(this.sizes.width,this.sizes.height),o=this.instanced,[s,c]=this.options.place?.(this.sizes)??[(Math.random()*2-1)*this.sizes.width*.36,(Math.random()*.42-.02)*this.sizes.height];o.aOffset[t*3+0]=s,o.aOffset[t*3+1]=c,o.aOffset[t*3+2]=0;let[l,u]=this.options.origin?.()??[0,0];o.aTilt[t]=this.options.radial?Math.atan2(l-s,c-u):0;let d=this.options.palette?.length?this.options.palette:this.params.palette,f=new e(d[Math.floor(Math.random()*d.length)]);o.aColor[t*3+0]=f.r,o.aColor[t*3+1]=f.g,o.aColor[t*3+2]=f.b;let[p,m]=this.options.duration??[2,2.6],h=p+Math.random()*(m-p);o.aTiming[t*2+0]=n,o.aTiming[t*2+1]=h,o.aSeed[t]=Math.random(),o.aScale[t]=(.55+Math.random()*.45)*a*i,this.endTime=Math.max(this.endTime,n+h+.2)}markDirty(){let e=this.geometry.attributes;e.aOffset.needsUpdate=!0,e.aColor.needsUpdate=!0,e.aTiming.needsUpdate=!0,e.aSeed.needsUpdate=!0,e.aScale.needsUpdate=!0,e.aTilt.needsUpdate=!0}launch(){let e=this.clock,t=this.volley,n=this.instanced.aTiming;this.endTime=0;for(let r=0;r<h;r++)r<t?this.spawnSlot(r,e+.25+r*.22+Math.random()*.25):(n[r*2+0]=-1e3,n[r*2+1]=1);this.markDirty(),this.startTime=e}respawn(){let e=this.volley,t=this.instanced.aTiming,n=!1;for(let r=0;r<e;r++)this.clock<t[r*2+0]+t[r*2+1]||(this.spawnSlot(r,this.clock+Math.random()*.6),n=!0);n&&this.markDirty()}get playing(){return this.clock<(this.endTime||0)}update(){this.clock+=this.time.delta*.001*(this.options.speed??1),this.material.uniforms.uLaunch.value=this.options.launch??.32,this.celebrationUntil&&(this.clock<this.celebrationUntil?this.respawn():this.clock>=this.endTime&&(this.celebrationUntil=0)),this.mesh.visible=this.playing,this.mesh.visible&&(this.material.uniforms.uTime.value=this.clock)}destroy(){this.geometry.remove(),this.material.remove(),this.scene.removeChild(this.mesh)}},y=class{width=0;height=0;pixelRatio=1;aspect=1;constructor(e){this.element=e,this.isMobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent),this.update()}update(){let e=this.element.getBoundingClientRect();this.width=Math.max(1,Math.round(this.element.offsetWidth||e.width)),this.height=Math.max(1,Math.round(this.element.offsetHeight||e.height)),this.pixelRatio=Math.min(window.devicePixelRatio,this.isMobile?1.5:2),this.aspect=this.width/this.height}},b=class{start=Date.now();current=Date.now();elapsed=0;delta=16;tick(){let e=Date.now();this.delta=Math.min(e-this.current,100),this.current=e,this.elapsed=this.current-this.start}},x=class{constructor(e,t){this.sizes=t,this.fovNum=1200,this.fov=Math.atan(this.sizes.height/2/this.fovNum)*2*(180/Math.PI),this.instance=new c(e,{fov:this.fov,aspect:this.sizes.width/this.sizes.height,near:1,far:2e3}),this.instance.position.z=this.fovNum}resize(){this.fov=Math.atan(this.sizes.height/2/this.fovNum)*2*(180/Math.PI),this.instance.fov=this.fov,this.instance.perspective({aspect:this.sizes.width/this.sizes.height})}},S=class{constructor(e,t,n){this.canvas=e,this.sizes=t,this.ratio=n||Math.min(this.sizes.pixelRatio,1.5),this.instance=new l({canvas:this.canvas,width:this.sizes.width,height:this.sizes.height,dpr:this.ratio,alpha:!0,premultipliedAlpha:!0,antialias:!1,depth:!1,powerPreference:`low-power`}),this.context=this.instance.gl,this.context.clearColor(0,0,0,0)}resize(){this.instance.setSize(this.sizes.width,this.sizes.height)}update(e,t){this.instance.render({scene:e,camera:t})}},C={cross:0,square:1,dot:2};function w(t,{look:c={},...l}={},u){let d=document.createElement(`canvas`);d.style.display=`block`,t.append(d);let m=new y(t),h=new b,g=new S(d,m),_=g.context,w=new x(_,m),T=new o,E=new v(_,T,m,h,l),D=new a(_,{width:Math.max(1,Math.round(m.width*.5)),height:Math.max(1,Math.round(m.height*.5)),depth:!1}),O=new o,k=new i(_,{width:1,height:1}),A=new n(_,{vertex:f,fragment:p,transparent:!0,depthTest:!1,depthWrite:!1,cullFace:!1,uniforms:{uFireworks:{value:D.texture},uViewport:{value:new s(m.width,m.height)},uCellSize:{value:8},uCellColor:{value:new e(`#aac2aa`)},uCrossColor:{value:new e(`#ffffff`)},uArmW:{value:.07},uPad:{value:.16},uCore:{value:.35},uEdge:{value:.12},uShape:{value:0},uGap:{value:0}}}),j=new r(_,{geometry:k,program:A,frustumCulled:!1});j.scale.set(m.width,m.height,1),j.setParent(O);let M=A.uniforms;c.cellSize!==void 0&&(M.uCellSize.value=c.cellSize),c.cellColor&&(M.uCellColor.value=new e(c.cellColor)),c.crossColor&&(M.uCrossColor.value=new e(c.crossColor)),c.armW!==void 0&&(M.uArmW.value=c.armW),c.pad!==void 0&&(M.uPad.value=c.pad),c.core!==void 0&&(M.uCore.value=c.core),c.edge!==void 0&&(M.uEdge.value=c.edge),c.shape&&(M.uShape.value=C[c.shape]),c.gap!==void 0&&(M.uGap.value=c.gap);let N=new ResizeObserver(()=>{m.update(),g.resize(),w.resize(),D.setSize(Math.max(1,Math.round(m.width*.5)),Math.max(1,Math.round(m.height*.5))),M.uViewport.value.set(m.width,m.height),j.scale.set(m.width,m.height,1)});N.observe(t);let P=0,F=()=>{h.tick(),E.update(),g.instance.render({scene:T,camera:w.instance,target:D,frustumCull:!1}),g.update(O,w.instance),E.playing?P=requestAnimationFrame(F):(P=0,u?.())};return{start(e){E.startCelebration(e),P||=(h.tick(),requestAnimationFrame(F))},settle:()=>E.settle(),destroy(){N.disconnect(),cancelAnimationFrame(P),P=0,E.destroy(),k.remove(),A.remove(),_.deleteFramebuffer(D.buffer),_.deleteTexture(D.texture.texture),_.getExtension(`WEBGL_lose_context`)?.loseContext(),d.remove()}}}export{w as mountHalftoneFireworks};