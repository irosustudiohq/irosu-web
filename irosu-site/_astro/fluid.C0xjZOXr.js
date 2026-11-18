import{i as e,r as t,t as n}from"./Plane.CXPNF1Te.js?dpl=dpl_74aUw43o7S3n9NFJ1ZxBM24TaWuz";import{t as r}from"./RenderTarget.CgxThfbt.js?dpl=dpl_74aUw43o7S3n9NFJ1ZxBM24TaWuz";import{t as i,u as a}from"./Vec2.Cn17CgjE.js?dpl=dpl_74aUw43o7S3n9NFJ1ZxBM24TaWuz";var o=`attribute vec2 uv;
attribute vec3 position;

uniform vec2 texelSize;

varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;

void main()
{
    vUv = uv;
    vL = vUv - vec2(texelSize.x, 0.0);
    vR = vUv + vec2(texelSize.x, 0.0);
    vT = vUv + vec2(0.0, texelSize.y);
    vB = vUv - vec2(0.0, texelSize.y);

    gl_Position = vec4(position.xy, 0.0, 1.0);
}`,s=`precision highp float;

varying vec2 vUv;

uniform sampler2D uTexture;
uniform float value;

void main()
{
    gl_FragColor = value * texture2D(uTexture, vUv);
}`,c=`precision highp float;

varying vec2 vUv;

uniform sampler2D uTarget;
uniform float aspectRatio;
uniform vec3 color;
uniform vec2 point;
uniform float radius;

void main()
{
    vec2 p = vUv - point.xy;
    p.x *= aspectRatio;
    vec3 splat = pow(2.0, -dot(p, p) / radius) * color;
    vec3 base = texture2D(uTarget, vUv).xyz;
    gl_FragColor = vec4(base + splat, 1.0);
}`,l=`precision highp float;

varying vec2 vUv;

uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 texelSize;
uniform float dt;
uniform float dissipation;

void main()
{
    vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
    gl_FragColor = dissipation * texture2D(uSource, coord);
    gl_FragColor.a = 1.0;
}`,u=`precision highp float;

varying highp vec2 vUv;
varying highp vec2 vL;
varying highp vec2 vR;
varying highp vec2 vT;
varying highp vec2 vB;

uniform sampler2D uVelocity;

void main()
{
    float L = texture2D(uVelocity, vL).x;
    float R = texture2D(uVelocity, vR).x;
    float T = texture2D(uVelocity, vT).y;
    float B = texture2D(uVelocity, vB).y;
    vec2 C = texture2D(uVelocity, vUv).xy;
    if (vL.x < 0.0) { L = -C.x; }
    if (vR.x > 1.0) { R = -C.x; }
    if (vT.y > 1.0) { T = -C.y; }
    if (vB.y < 0.0) { B = -C.y; }
    float div = 0.6 * (R - L + T - B);
    gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
}`,d=`precision highp float;

varying highp vec2 vUv;
varying highp vec2 vL;
varying highp vec2 vR;
varying highp vec2 vT;
varying highp vec2 vB;

uniform sampler2D uVelocity;

void main()
{
    float L = texture2D(uVelocity, vL).y;
    float R = texture2D(uVelocity, vR).y;
    float T = texture2D(uVelocity, vT).x;
    float B = texture2D(uVelocity, vB).x;
    float vorticity = R - L - T + B;
    gl_FragColor = vec4(0.05 * vorticity, 0.0, 0.0, 1.0);
}`,f=`precision highp float;

varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;

uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform float curl;
uniform float dt;

void main()
{
    float L = texture2D(uCurl, vL).x;
    float R = texture2D(uCurl, vR).x;
    float T = texture2D(uCurl, vT).x;
    float B = texture2D(uCurl, vB).x;
    float C = texture2D(uCurl, vUv).x;
    vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
    force /= length(force) + 0.0001;
    force *= curl * C;
    force.y *= -1.0;
    vec2 vel = texture2D(uVelocity, vUv).xy;
    gl_FragColor = vec4(vel + force * dt, 0.0, 1.0);
}`,p=`precision highp float;

varying highp vec2 vUv;
varying highp vec2 vL;
varying highp vec2 vR;
varying highp vec2 vT;
varying highp vec2 vB;

uniform sampler2D uPressure;
uniform sampler2D uDivergence;

void main()
{
    float L = texture2D(uPressure, vL).x;
    float R = texture2D(uPressure, vR).x;
    float T = texture2D(uPressure, vT).x;
    float B = texture2D(uPressure, vB).x;
    float C = texture2D(uPressure, vUv).x;
    float divergence = texture2D(uDivergence, vUv).x;
    float pressure = (L + R + B + T - divergence) * 0.25;
    gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
}`,m=`precision highp float;

varying highp vec2 vUv;
varying highp vec2 vL;
varying highp vec2 vR;
varying highp vec2 vT;
varying highp vec2 vB;

uniform sampler2D uPressure;
uniform sampler2D uVelocity;

void main()
{
    float L = texture2D(uPressure, vL).x;
    float R = texture2D(uPressure, vR).x;
    float T = texture2D(uPressure, vT).x;
    float B = texture2D(uPressure, vB).x;
    vec2 velocity = texture2D(uVelocity, vUv).xy;
    velocity.xy -= vec2(R - L, T - B);
    gl_FragColor = vec4(velocity, 0.0, 1.0);
}`,h={simRes:128,dyeRes:256,iterations:3,densityDissipation:.95,velocityDissipation:.95,pressureDissipation:.8,curlStrength:14,radius:.35,splatForce:950},g=class{constructor(e,t){this.app=e,this.gl=t,this.ogl=this.gl.renderer.instance,this.context=this.ogl.gl,this.sizes=this.app.sizes,this.time=this.app.time,this.params={...h},this.mouse=new i,this.lastMouse=new i(-1,-1),this.splats=[],this.idleMs=2500,this.lastInput=0,this.outputColor=new a(1,1,1),this.init()}init(){this.context.getExtension(`EXT_color_buffer_float`),this.geometry=new n(this.context,{width:2,height:2}),this.createFramebuffers(),this.createPasses(),this.gl.fluidTexture=this.density.read.texture,this.setDebug()}createFramebuffers(){let{simRes:e,dyeRes:t}=this.params,n=this.context;this.texelSize=new i(1/e,1/e),this.dyeTexelSize=new i(1/t,1/t),this.density=this.createDoubleFBO(t,n.LINEAR),this.velocity=this.createDoubleFBO(e,n.LINEAR),this.pressure=this.createDoubleFBO(e,n.NEAREST),this.curl=this.createFBO(e,n.NEAREST),this.divergence=this.createFBO(e,n.NEAREST)}createFBO(e,t){let n=this.context;return new r(n,{width:e,height:e,type:n.HALF_FLOAT,format:n.RGBA,internalFormat:n.RGBA16F,minFilter:t,magFilter:t,depth:!1,stencil:!1})}createDoubleFBO(e,t){return{read:this.createFBO(e,t),write:this.createFBO(e,t),swap(){let e=this.read;this.read=this.write,this.write=e}}}createPass(n,r){let i=new e(this.context,{vertex:o,fragment:n,uniforms:r,depthTest:!1,depthWrite:!1});return new t(this.context,{geometry:this.geometry,program:i,frustumCulled:!1})}createPasses(){this.clearPass=this.createPass(s,{texelSize:{value:this.texelSize},uTexture:{value:null},value:{value:this.params.pressureDissipation}}),this.splatPass=this.createPass(c,{texelSize:{value:this.texelSize},uTarget:{value:null},aspectRatio:{value:this.sizes.width/this.sizes.height},color:{value:new a},point:{value:new i},radius:{value:this.params.radius/100}}),this.advectionPass=this.createPass(l,{texelSize:{value:this.texelSize},uVelocity:{value:null},uSource:{value:null},dt:{value:.016},dissipation:{value:1}}),this.divergencePass=this.createPass(u,{texelSize:{value:this.texelSize},uVelocity:{value:null}}),this.curlPass=this.createPass(d,{texelSize:{value:this.texelSize},uVelocity:{value:null}}),this.vorticityPass=this.createPass(f,{texelSize:{value:this.texelSize},uVelocity:{value:null},uCurl:{value:null},curl:{value:this.params.curlStrength},dt:{value:.016}}),this.pressurePass=this.createPass(p,{texelSize:{value:this.texelSize},uPressure:{value:null},uDivergence:{value:null}}),this.gradientSubtractPass=this.createPass(m,{texelSize:{value:this.texelSize},uPressure:{value:null},uVelocity:{value:null}})}renderPass(e,t){this.ogl.render({scene:e,target:t,frustumCull:!1,clear:!1})}splat({x:e,y:t,dx:n,dy:r}){let i=this.splatPass.program.uniforms;i.uTarget.value=this.velocity.read.texture,i.aspectRatio.value=this.sizes.width/this.sizes.height,i.point.value.set(e,t),i.color.value.set(n,r,1),i.radius.value=this.params.radius/100,this.renderPass(this.splatPass,this.velocity.write),this.velocity.swap(),i.uTarget.value=this.density.read.texture,i.color.value.copy(this.outputColor),this.renderPass(this.splatPass,this.density.write),this.density.swap()}simulate(){for(let e=this.splats.length-1;e>=0;e--)this.splat(this.splats.splice(e,1)[0]);this.curlPass.program.uniforms.uVelocity.value=this.velocity.read.texture,this.renderPass(this.curlPass,this.curl),this.vorticityPass.program.uniforms.uVelocity.value=this.velocity.read.texture,this.vorticityPass.program.uniforms.uCurl.value=this.curl.texture,this.renderPass(this.vorticityPass,this.velocity.write),this.velocity.swap(),this.divergencePass.program.uniforms.uVelocity.value=this.velocity.read.texture,this.renderPass(this.divergencePass,this.divergence),this.clearPass.program.uniforms.uTexture.value=this.pressure.read.texture,this.clearPass.program.uniforms.value.value=this.params.pressureDissipation,this.renderPass(this.clearPass,this.pressure.write),this.pressure.swap(),this.pressurePass.program.uniforms.uDivergence.value=this.divergence.texture;for(let e=0;e<this.params.iterations;e++)this.pressurePass.program.uniforms.uPressure.value=this.pressure.read.texture,this.renderPass(this.pressurePass,this.pressure.write),this.pressure.swap();this.gradientSubtractPass.program.uniforms.uPressure.value=this.pressure.read.texture,this.gradientSubtractPass.program.uniforms.uVelocity.value=this.velocity.read.texture,this.renderPass(this.gradientSubtractPass,this.velocity.write),this.velocity.swap(),this.advectionPass.program.uniforms.uVelocity.value=this.velocity.read.texture,this.advectionPass.program.uniforms.uSource.value=this.velocity.read.texture,this.advectionPass.program.uniforms.dissipation.value=this.params.velocityDissipation,this.renderPass(this.advectionPass,this.velocity.write),this.velocity.swap(),this.advectionPass.program.uniforms.uVelocity.value=this.velocity.read.texture,this.advectionPass.program.uniforms.uSource.value=this.density.read.texture,this.advectionPass.program.uniforms.dissipation.value=this.params.densityDissipation,this.renderPass(this.advectionPass,this.density.write),this.density.swap(),this.gl.fluidTexture=this.density.read.texture}update(){if((this.time?.elapsed??0)-this.lastInput>this.idleMs&&this.splats.length===0)return!1;let e=Math.min((this.time?.delta??16)*.001,.033);return this.advectionPass.program.uniforms.dt.value=e,this.vorticityPass.program.uniforms.dt.value=e,this.simulate(),!0}getMouse(e,t){let n=e.clientX/this.sizes.width,r=1-e.clientY/this.sizes.height;if(this.lastMouse.x<0){this.lastMouse.set(n,r);return}let i=(n-this.lastMouse.x)*this.params.splatForce,a=(r-this.lastMouse.y)*this.params.splatForce;this.lastMouse.set(n,r),(Math.abs(i)>0||Math.abs(a)>0)&&(this.splats.push({x:n,y:r,dx:i,dy:a}),this.lastInput=this.time?.elapsed??0)}resize(){this.splatPass.program.uniforms.aspectRatio.value=this.sizes.width/this.sizes.height}setDebug(){let e=this.app.debug;e&&e.getGui().then(e=>{if(!e)return;this.gui=e.addFolder(`Fluid`);let t=this.params;this.gui.add(t,`densityDissipation`,.8,1,.001).name(`dyeFade`),this.gui.add(t,`velocityDissipation`,.8,1,.001).name(`velocityFade`),this.gui.add(t,`pressureDissipation`,0,1,.01).name(`pressureFade`),this.gui.add(t,`curlStrength`,0,60,1).name(`curl`).onChange(e=>this.vorticityPass.program.uniforms.curl.value=e),this.gui.add(t,`iterations`,1,12,1).name(`iterations`),this.gui.add(t,`radius`,.02,3,.01).name(`splatRadius`),this.gui.add(t,`splatForce`,200,8e3,50).name(`splatForce`)})}destroy(){this.gui?.destroy?.(),this.gl.fluidTexture=null}};export{g as t};