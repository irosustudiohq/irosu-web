import{t as e}from"./Renderer.HD3ID7m7.js?dpl=dpl_74aUw43o7S3n9NFJ1ZxBM24TaWuz";import{a as t,i as n,n as r,r as i}from"./Plane.CXPNF1Te.js?dpl=dpl_74aUw43o7S3n9NFJ1ZxBM24TaWuz";import{t as a}from"./Triangle.CJObBFvm.js?dpl=dpl_74aUw43o7S3n9NFJ1ZxBM24TaWuz";import{t as o}from"./RenderTarget.CgxThfbt.js?dpl=dpl_74aUw43o7S3n9NFJ1ZxBM24TaWuz";import{a as s,c,l,o as u,s as d,t as f}from"./Vec2.Cn17CgjE.js?dpl=dpl_74aUw43o7S3n9NFJ1ZxBM24TaWuz";import{t as p}from"./fluid.C0xjZOXr.js?dpl=dpl_74aUw43o7S3n9NFJ1ZxBM24TaWuz";import{n as m,r as h,t as g}from"./spawn.DJsSsSXe.js?dpl=dpl_74aUw43o7S3n9NFJ1ZxBM24TaWuz";var _=class extends Array{constructor(e=0,t=e,n=e,r=e){return super(e,t,n,r),this}get x(){return this[0]}get y(){return this[1]}get z(){return this[2]}get w(){return this[3]}set x(e){this[0]=e}set y(e){this[1]=e}set z(e){this[2]=e}set w(e){this[3]=e}set(e,t=e,n=e,r=e){return e.length?this.copy(e):(l(this,e,t,n,r),this)}copy(e){return s(this,e),this}normalize(){return d(this,this),this}multiply(e){return c(this,this,e),this}dot(e){return u(this,e)}fromArray(e,t=0){return this[0]=e[t],this[1]=e[t+1],this[2]=e[t+2],this[3]=e[t+3],this}toArray(e=[],t=0){return e[t]=this[0],e[t+1]=this[1],e[t+2]=this[2],e[t+3]=this[3],e}},v=`#version 300 es
precision highp float;

in vec2 position;
in vec2 uv;

out vec2 vUv;

void main()
{
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
}`,y=`#version 300 es
precision highp float;
precision highp sampler2D;

uniform sampler2D uState;
uniform sampler2D uRot;
uniform sampler2D uMeta;
uniform int uCount;
uniform float uT;
uniform float uSize;
uniform float uDt;
uniform float uFrame;
uniform float uGravity;
uniform float uWind;
uniform float uSweep;
uniform float uRelax;
uniform float uContactDamping;
uniform float uContactFriction;
uniform float uSpin;
uniform float uSpinDrag;
uniform float uSpinContactDrag;
uniform float uMaxSpin;
uniform float uSleep;
uniform float uJitter;
uniform float uDrag;
uniform float uRestitution;
uniform float uFriction;
uniform float uMaxSpeed;
uniform float uRim;
uniform float uHandWidth;
uniform float uHandBand;
uniform vec4 uSecond;
uniform vec4 uMinute;
uniform vec4 uHour;
uniform vec4 uPointer;
uniform vec4 uPointerFx;
uniform sampler2D uFluid;
uniform vec4 uFluidFx;
uniform float uPushLimit;

layout(location = 0) out vec4 outState;
layout(location = 1) out vec4 outSpin;

const float PI = 3.141592653589793;
const int MAX_PAIRS = 2048;

uint hashU(uint x)
{
    x ^= x >> 16u;
    x *= 0x7feb352du;
    x ^= x >> 15u;
    x *= 0x846ca68bu;
    x ^= x >> 16u;
    return x;
}

vec2 hash2(uint i, uint seed)
{
    uint h = hashU(i * 747796405u + seed * 2891336453u);
    uint k = hashU(h ^ 0x9e3779b9u);
    return vec2(float(h & 0x00ffffffu), float(k & 0x00ffffffu)) / 16777216.0;
}

void hand(vec4 h, vec2 c, float sweep, float w, float band, float r, inout vec2 p, inout vec2 v, inout float av)
{
    if (h.w < 0.5) return;

    vec2 dh = vec2(sin(h.x), -cos(h.x));
    vec2 th = vec2(cos(h.x), sin(h.x));
    vec2 rv = p - c;
    float s = dot(rv, dh);
    if (s <= 0.0 || s >= h.z) return;

    vec2 q = rv - s * dh;
    float n = length(q);
    if (n >= w + band) return;

    float side = dot(q, th) >= 0.0 ? 1.0 : -1.0;
    float u = h.y * s;
    float k = sweep * clamp(1.0 - (n - w) / max(band, 1e-3), 0.0, 1.0);

    if (side > 0.0)
    {
        float vt = dot(v, th);
        if (vt < u)
        {
            v += th * (u - vt) * k;
            av += (u - vt) * k * 0.5 / r;
        }
    }

    v += th * side * 7200.0 * uDt * k;
}

void clear(vec4 h, vec2 c, float w, inout vec2 p)
{
    if (h.w < 0.5) return;

    vec2 dh = vec2(sin(h.x), -cos(h.x));
    vec2 th = vec2(cos(h.x), sin(h.x));
    vec2 rv = p - c;
    float s = dot(rv, dh);
    if (s <= 0.0 || s >= h.z) return;

    vec2 q = rv - s * dh;
    if (length(q) >= w) return;

    float side = dot(q, th) >= 0.0 ? 1.0 : -1.0;
    p = c + dh * s + th * side * w;
}

void main()
{
    ivec2 coord = ivec2(gl_FragCoord.xy);
    int T = int(uT + 0.5);
    int i = coord.y * T + coord.x;
    uint id = uint(i);
    uint frame = uint(uFrame);

    vec4 s = texelFetch(uState, coord, 0);
    vec2 rot = texelFetch(uRot, coord, 0).xy;
    float ri = max(texelFetch(uMeta, coord, 0).y, 1e-3);

    if (i >= uCount)
    {
        outState = s;
        outSpin = vec4(rot, 0.0, 0.0);
        return;
    }

    vec2 p = s.xy;
    vec2 v = s.zw;
    float ang = rot.x;
    float av = rot.y;

    float dt = uDt;
    vec2 c = vec2(uSize * 0.5);
    float R = uSize * uRim;

    vec2 rv = p - c;
    float r = max(length(rv), 1e-3);
    float phi = atan(rv.x, -rv.y);
    vec2 tcw = vec2(cos(phi), sin(phi));

    vec2 a = vec2(0.0, uGravity);

    float wd = mod(phi - uSecond.x + PI, 2.0 * PI) - PI;
    float angular = 0.12 + 0.88 * pow(1.0 - abs(wd) / PI, 3.0);
    a += tcw * 600.0 * uWind * angular * clamp(r / R, 0.2, 1.0);

    float angAcc = 0.0;
    float contacts = 0.0;
    a += uJitter * (hash2(id, frame) * 2.0 - 1.0);

    if (uPointerFx.w > 0.5)
    {
        vec2 dv = p - uPointer.xy;
        float pd = length(dv);
        float Rp = uSize * uPointerFx.x;
        if (pd < Rp)
        {
            float f = pow(1.0 - pd / Rp, 2.0);
            vec2 dir = dv / max(pd, 1e-5);
            if (pd < 1.0)
            {
                float rnd = hash2(id, frame + 5501u).x * 2.0 * PI;
                dir = vec2(cos(rnd), sin(rnd));
            }
            a += dir * uPointerFx.y * f;

            float ps = length(uPointer.zw);
            if (ps > 1e-4) a += (uPointer.zw / ps) * uPointerFx.z * min(ps, 3.0) * f;
        }
    }

    if (uFluidFx.y > 0.5)
    {
        vec2 fv = texture(uFluid, vec2(p.x / uSize, 1.0 - p.y / uSize)).xy;
        a += vec2(fv.x, -fv.y) * (uSize / uFluidFx.z) * uFluidFx.x;
    }

    v *= exp(-uDrag * dt);
    v += a * dt;
    av *= exp(-uSpinDrag * dt);

    hand(uSecond, c, uSweep, uHandWidth + ri, uHandBand, ri, p, v, av);
    hand(uMinute, c, uSweep, uHandWidth + ri, uHandBand, ri, p, v, av);
    hand(uHour, c, uSweep, uHandWidth + ri, uHandBand, ri, p, v, av);

    vec2 pOld = s.xy;
    vec2 pPred = p + v * dt;
    vec2 corr = vec2(0.0);
    for (int j = 0; j < MAX_PAIRS; j++)
    {
        if (j >= uCount) break;
        if (j == i) continue;

        ivec2 jc = ivec2(j % T, j / T);
        vec4 sj = texelFetch(uState, jc, 0);
        float rj = texelFetch(uMeta, jc, 0).y;

        vec2 dv = pPred - sj.xy;
        float d = length(dv);
        float rr = ri + rj;
        if (d >= rr || d <= 1e-4) continue;

        vec2 n = dv / d;
        corr += n * (rr - d) * 0.5;

        vec2 vrel = v - sj.zw;
        vec2 vt = vrel - n * dot(vrel, n);
        corr -= vt * dt * uContactFriction * 0.5;

        float slip = n.x * vt.y - n.y * vt.x;
        angAcc += -slip / ri * uSpin;
        contacts += 1.0;
    }

    
    vec2 push = corr * uRelax / max(dt, 1e-4);
    float pushSpeed = length(push);
    p = pPred + corr * uRelax;
    v = (pPred - pOld) / max(dt, 1e-4) + (pushSpeed > uPushLimit ? push * (uPushLimit / pushSpeed) : push);
    av += angAcc * dt;
    if (contacts > 0.0)
    {
        v *= exp(-uContactDamping * dt);
        av *= exp(-uSpinContactDrag * dt);
        if (length(v) < uSleep)
        {
            v = vec2(0.0);
            av = 0.0;
        }
    }
    ang += av * dt;

    clear(uSecond, c, uHandWidth + ri, p);
    clear(uMinute, c, uHandWidth + ri, p);
    clear(uHour, c, uHandWidth + ri, p);

    float lim = R - ri;
    vec2 rv2 = p - c;
    float r2 = length(rv2);
    if (r2 > lim)
    {
        vec2 rh = rv2 / max(r2, 1e-5);
        p = c + rh * lim;
        float vr = dot(v, rh);
        if (vr > 0.0) v -= (1.0 + uRestitution) * vr * rh;
        vec2 vrad = rh * dot(v, rh);
        v = vrad + (v - vrad) * (1.0 - 0.5 * uFriction);
        av = dot(v, vec2(-rh.y, rh.x)) / ri;
    }

    av = clamp(av, -uMaxSpin, uMaxSpin);

    float sp = length(v);
    if (sp > uMaxSpeed) v = v / sp * uMaxSpeed;

    if (!(dot(p, p) < 1e12) || !(dot(v, v) < 1e12) || !(abs(ang) < 1e12) || !(abs(av) < 1e12))
    {
        vec2 rs = hash2(id, frame + 9871u);
        p = vec2(c.x + (rs.x - 0.5) * uSize * 0.5, uSize * 0.15 + rs.y * uSize * 0.3);
        v = vec2(0.0);
        av = 0.0;
        ang = 0.0;
    }

    outState = vec4(p, v);
    outSpin = vec4(ang, av, 0.0, 0.0);
}`,b=`#version 300 es
precision highp float;
precision highp sampler2D;

in vec2 position;
in vec2 uv;
in float aIndex;

uniform sampler2D uState;
uniform sampler2D uRot;
uniform sampler2D uMeta;
uniform float uT;
uniform float uSize;
uniform float uDrawScale;
uniform vec2 uAtlasGrid;
uniform vec3 uPalette[6];

out vec2 vUv;
out vec3 vColor;

void main()
{
    int T = int(uT + 0.5);
    int i = int(aIndex);
    ivec2 coord = ivec2(i % T, i / T);

    vec2 p = texelFetch(uState, coord, 0).xy;
    float ang = texelFetch(uRot, coord, 0).x;
    vec4 meta = texelFetch(uMeta, coord, 0);

    float hs = meta.y * uDrawScale;
    float sa = sin(ang);
    float ca = cos(ang);
    vec2 corner = vec2(position.x * ca - position.y * sa, position.x * sa + position.y * ca) * hs;
    vec2 world = p + corner;

    gl_Position = vec4(2.0 * world.x / uSize - 1.0, 1.0 - 2.0 * world.y / uSize, 0.0, 1.0);

    float sh = floor(meta.x + 0.5);
    float col = mod(sh, uAtlasGrid.x);
    float row = floor(sh / uAtlasGrid.x);
    vUv = vec2((col + uv.x) / uAtlasGrid.x, 1.0 - (row + uv.y) / uAtlasGrid.y);
    vColor = uPalette[int(meta.z + 0.5) % 6];
}`,x=`#version 300 es
precision highp float;
precision highp sampler2D;

in vec2 vUv;
in vec3 vColor;

uniform sampler2D uAtlas;

out vec4 fragColor;

void main()
{
    float alpha = texture(uAtlas, vUv).a;
    if (alpha < 0.01) discard;

    fragColor = vec4(vColor * alpha, alpha);
}`,S=new Float32Array([-1,-1,1,-1,1,1,-1,1]),C=new Float32Array([0,0,1,0,1,1,0,1]),w=new Uint16Array([0,1,2,0,2,3]);function T(e){let t=1;for(;t*t<e;)t*=2;return t}function E(e){let t=parseInt(e.replace(`#`,``),16);return[(t>>16&255)/255,(t>>8&255)/255,(t&255)/255]}var D=class{constructor(e,{size:t,dpr:n,count:r,palette:i,atlas:a,params:o}){this.canvas=e,this.size=t,this.dpr=n,this.count=Math.max(1,Math.floor(r)),this.atlas=a,this.params=o,this.paletteCount=i.length,this.palette=[];for(let e=0;e<6;e++)this.palette.push(...E(i[e%i.length]));this.frame=0,this.ready=!1,this.destroyed=!1}async init(){try{let t=Math.round(this.size*this.dpr);return this.renderer=new e({canvas:this.canvas,webgl:2,alpha:!0,premultipliedAlpha:!0,antialias:!1,depth:!1,stencil:!1,dpr:1,width:t,height:t}),this.gl=this.renderer.gl,this.canvas.style.removeProperty(`width`),this.canvas.style.removeProperty(`height`),!this.renderer.isWebgl2||!this.renderer.getExtension(`EXT_color_buffer_float`)||(this.gl.clearColor(0,0,0,0),this.T=T(this.count),this.read=this.createTarget(),this.write=this.createTarget(),!this.isComplete(this.read)||!this.isComplete(this.write))?!1:(this.metaTexture=this.createDataTexture(),this.atlasTexture=new r(this.gl,{image:this.atlas.canvas,generateMipmaps:!0,minFilter:this.gl.LINEAR_MIPMAP_LINEAR,magFilter:this.gl.LINEAR,premultiplyAlpha:!0}),this.fluid=new p({sizes:{width:1,height:1}},{renderer:{instance:this.renderer}}),this.createUniforms(),this.createPasses(),this.respawn(),this.ready=!0,!0)}catch(e){return console.warn(`[Clock] webgl backend init failed`,e),!1}}createTarget(){return new o(this.gl,{width:this.T,height:this.T,color:2,type:this.gl.FLOAT,format:this.gl.RGBA,internalFormat:this.gl.RGBA32F,minFilter:this.gl.NEAREST,magFilter:this.gl.NEAREST,depth:!1,stencil:!1})}createDataTexture(){return new r(this.gl,{image:new Float32Array(this.T*this.T*4),width:this.T,height:this.T,type:this.gl.FLOAT,format:this.gl.RGBA,internalFormat:this.gl.RGBA32F,minFilter:this.gl.NEAREST,magFilter:this.gl.NEAREST,generateMipmaps:!1,flipY:!1})}isComplete(e){this.renderer.bindFramebuffer(e);let t=this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER);return this.renderer.bindFramebuffer(),t===this.gl.FRAMEBUFFER_COMPLETE}createUniforms(){this.u={uState:{value:this.read.textures[0]},uRot:{value:this.read.textures[1]},uMeta:{value:this.metaTexture},uAtlas:{value:this.atlasTexture},uAtlasGrid:{value:new f(this.atlas.cols,this.atlas.rows)},uPalette:{value:this.palette},uCount:{value:this.count},uT:{value:this.T},uSize:{value:this.size},uDrawScale:{value:1},uDt:{value:0},uFrame:{value:0},uGravity:{value:0},uWind:{value:0},uSweep:{value:0},uRelax:{value:.6},uContactDamping:{value:0},uContactFriction:{value:0},uSpin:{value:0},uSpinDrag:{value:0},uSpinContactDrag:{value:0},uMaxSpin:{value:15},uSleep:{value:10},uJitter:{value:0},uDrag:{value:0},uRestitution:{value:0},uFriction:{value:0},uMaxSpeed:{value:0},uRim:{value:.485},uHandWidth:{value:4},uHandBand:{value:14},uSecond:{value:new _},uMinute:{value:new _},uHour:{value:new _},uPointer:{value:new _},uPointerFx:{value:new _},uFluid:{value:this.fluid.velocity.read.texture},uFluidFx:{value:new _},uPushLimit:{value:this.params.pushLimit}}}createPasses(){let e=this.gl,t=this.u;this.simProgram=new n(e,{vertex:v,fragment:y,uniforms:{uState:t.uState,uRot:t.uRot,uMeta:t.uMeta,uCount:t.uCount,uT:t.uT,uSize:t.uSize,uDt:t.uDt,uFrame:t.uFrame,uGravity:t.uGravity,uWind:t.uWind,uSweep:t.uSweep,uRelax:t.uRelax,uContactDamping:t.uContactDamping,uContactFriction:t.uContactFriction,uSpin:t.uSpin,uSpinDrag:t.uSpinDrag,uSpinContactDrag:t.uSpinContactDrag,uMaxSpin:t.uMaxSpin,uSleep:t.uSleep,uJitter:t.uJitter,uDrag:t.uDrag,uRestitution:t.uRestitution,uFriction:t.uFriction,uMaxSpeed:t.uMaxSpeed,uRim:t.uRim,uHandWidth:t.uHandWidth,uHandBand:t.uHandBand,uSecond:t.uSecond,uMinute:t.uMinute,uHour:t.uHour,uPointer:t.uPointer,uPointerFx:t.uPointerFx,uFluid:t.uFluid,uFluidFx:t.uFluidFx,uPushLimit:t.uPushLimit},depthTest:!1,depthWrite:!1}),this.simMesh=new i(e,{geometry:new a(e),program:this.simProgram,frustumCulled:!1}),this.shapeProgram=new n(e,{vertex:b,fragment:x,uniforms:{uState:t.uState,uRot:t.uRot,uMeta:t.uMeta,uAtlas:t.uAtlas,uAtlasGrid:t.uAtlasGrid,uPalette:t.uPalette,uT:t.uT,uSize:t.uSize,uDrawScale:t.uDrawScale},depthTest:!1,depthWrite:!1,cullFace:null}),this.shapeProgram.setBlendFunc(e.ONE,e.ONE_MINUS_SRC_ALPHA),this.shapeProgram.transparent=!0,this.quad=this.createQuad(),this.shapeMesh=new i(e,{geometry:this.quad,program:this.shapeProgram,frustumCulled:!1})}createQuad(){let e=new Float32Array(this.count);for(let t=0;t<this.count;t++)e[t]=t;return new t(this.gl,{position:{size:2,data:S},uv:{size:2,data:C},index:{size:1,data:w},aIndex:{size:1,data:e,instanced:1}})}respawn(){if(this.destroyed||!this.u)return;let e=g(this.count,this.size,this.params,this.paletteCount),t=[e,h(this.count,this.size,e,this.params),m(this.count)].map(e=>{let t=new Float32Array(this.T*this.T*4);return t.set(e.subarray(0,Math.min(e.length,t.length))),t});this.upload(this.metaTexture,t[0]);for(let e of[this.read,this.write])this.upload(e.textures[0],t[1]),this.upload(e.textures[1],t[2]);this.frame=0,this.u.uState.value=this.read.textures[0],this.u.uRot.value=this.read.textures[1]}upload(e,t){e.image=t,e.needsUpdate=!0,e.update()}step(e,{hands:t,pointer:n,params:r,fluid:i,steps:a=1}){if(!this.ready||this.destroyed)return;this.stepFluid(i?.dt??e,i,r);let o=this.u;this.frame=(this.frame+1)%65536,o.uDt.value=e,o.uFrame.value=this.frame,o.uSize.value=this.size,o.uT.value=this.T,o.uCount.value=this.count,o.uGravity.value=r.gravity,o.uWind.value=r.wind,o.uSweep.value=r.sweep,o.uRelax.value=r.relax,o.uContactDamping.value=r.contactDamping,o.uContactFriction.value=r.contactFriction,o.uSpin.value=r.spin,o.uSpinDrag.value=r.spinDrag,o.uSpinContactDrag.value=r.spinContactDrag,o.uMaxSpin.value=r.maxSpin,o.uSleep.value=r.sleep,o.uJitter.value=r.jitter,o.uDrag.value=r.drag,o.uRestitution.value=r.restitution,o.uFriction.value=r.friction,o.uMaxSpeed.value=r.maxSpeed,o.uRim.value=r.rim,o.uHandWidth.value=r.handWidth,o.uHandBand.value=r.handBand,o.uPushLimit.value=r.pushLimit;let s=this.size*.5,c=+!!r.sweepAll;o.uSecond.value.set(t.second.angle,t.second.omega,t.second.length*s,1),o.uMinute.value.set(t.minute.angle,t.minute.omega,t.minute.length*s,c),o.uHour.value.set(t.hour.angle,t.hour.omega,t.hour.length*s,c),o.uPointer.value.set(n.x,n.y,n.vx,n.vy),o.uPointerFx.value.set(r.pointerRadius,r.pointerPush,r.pointerSweep,+!!n.active),o.uFluid.value=this.fluid.velocity.read.texture,o.uFluidFx.value.set(r.fluidForce,+!!i?.active,this.fluid.params.simRes,0);for(let e=0;e<a;e++){o.uState.value=this.read.textures[0],o.uRot.value=this.read.textures[1],this.renderer.render({scene:this.simMesh,target:this.write,clear:!1});let e=this.read;this.read=this.write,this.write=e}}stepFluid(e,t,n){let r=this.fluid;t?.splat&&r.splats.push(t.splat),t?.active&&(r.params.radius=n.fluidRadius,r.params.velocityDissipation=n.fluidFade,r.vorticityPass.program.uniforms.curl.value=n.fluidCurl,r.vorticityPass.program.uniforms.dt.value=e,r.advectionPass.program.uniforms.dt.value=e,r.simulate())}render(){this.ready&&!this.destroyed&&(this.u.uState.value=this.read.textures[0],this.u.uRot.value=this.read.textures[1],this.u.uSize.value=this.size,this.u.uDrawScale.value=this.params.drawScale,this.renderer.render({scene:this.shapeMesh,clear:!0}))}setCount(e){if(!this.ready||this.destroyed)return;this.count=Math.max(1,Math.floor(e)),this.u.uCount.value=this.count;let t=T(this.count);t!==this.T&&(this.T=t,this.u.uT.value=t,this.disposeTarget(this.read),this.disposeTarget(this.write),this.gl.deleteTexture(this.metaTexture.texture),this.read=this.createTarget(),this.write=this.createTarget(),this.metaTexture=this.createDataTexture(),this.u.uMeta.value=this.metaTexture,!this.isComplete(this.read)||!this.isComplete(this.write))?this.ready=!1:(this.quad.remove(),this.quad=this.createQuad(),this.shapeMesh.geometry=this.quad,this.respawn())}resize(e,t){if(!this.ready||this.destroyed)return;this.size=e,this.dpr=t;let n=Math.round(e*t);this.canvas.width=n,this.canvas.height=n,this.renderer.width=n,this.renderer.height=n,this.renderer.dpr=1,this.u.uSize.value=e}disposeTarget(e){if(e){this.gl.deleteFramebuffer(e.buffer);for(let t of e.textures)this.gl.deleteTexture(t.texture)}}destroy(){this.destroyed||(this.destroyed=!0,this.ready=!1,this.gl&&(this.simMesh?.geometry.remove(),this.quad?.remove(),this.simProgram?.remove(),this.shapeProgram?.remove(),this.disposeTarget(this.read),this.disposeTarget(this.write),this.metaTexture&&this.gl.deleteTexture(this.metaTexture.texture),this.atlasTexture&&this.gl.deleteTexture(this.atlasTexture.texture),this.fluid?.destroy(),this.renderer.getExtension(`WEBGL_lose_context`)?.loseContext()))}};export{D as default};