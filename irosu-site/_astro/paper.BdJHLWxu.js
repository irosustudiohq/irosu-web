import{t as e}from"./Renderer.HD3ID7m7.js?dpl=dpl_74aUw43o7S3n9NFJ1ZxBM24TaWuz";import{t}from"./Camera.C3KXNr7C.js?dpl=dpl_74aUw43o7S3n9NFJ1ZxBM24TaWuz";import{i as n,n as r,t as i,u as a}from"./Vec2.Cn17CgjE.js?dpl=dpl_74aUw43o7S3n9NFJ1ZxBM24TaWuz";import{i as o,n as s,r as c,t as l}from"./Plane.CXPNF1Te.js?dpl=dpl_74aUw43o7S3n9NFJ1ZxBM24TaWuz";import{t as u}from"./Color.xVu7ktDx.js?dpl=dpl_74aUw43o7S3n9NFJ1ZxBM24TaWuz";import{t as d}from"./gsap.C3M4CBdQ.js?dpl=dpl_74aUw43o7S3n9NFJ1ZxBM24TaWuz";import{t as f}from"./touchScroll.CMLzDej2.js?dpl=dpl_74aUw43o7S3n9NFJ1ZxBM24TaWuz";var p=`#version 300 es

in vec3 position;
in vec2 uv;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform vec2 uSize;
uniform vec2 uCorner;
uniform float uFront;
uniform float uRadius;
uniform float uFlap;
uniform float uTension;
uniform float uWave;
uniform float uWaveTime;
uniform float uArc;

out vec2 vUv;
out vec3 vNormal;
out vec3 vPos;

void main()
{
    vUv = uv;

    vec2 p = position.xy * uSize;
    vec2 d = -normalize(uCorner * uSize);
    float half_ = (abs(d.x) * uSize.x + abs(d.y) * uSize.y) * 0.5;
    float f = -half_ + uFront * 2.0 * half_;
    float s = f - dot(p, d);
    float lift = uTension * uRadius * 0.45;
    vec3 o = vec3(p, 0.0);
    vec2 n = vec2(0.0, 1.0);

    if (s <= 0.0)
    {
        if (uTension > 0.0)
        {
            float w = uRadius * 1.6;
            o.z = lift * exp(s / w);
            n = normalize(vec2(o.z / w, 1.0));
        }
    }
    else
    {
        float r = uRadius * (1.0 - 0.35 * uTension);
        float h = r - lift;
        float theta = s / r;
        float a = min(theta, uFlap);
        float run = max(theta - uFlap, 0.0) * r;
        float q = h * sin(a) + run * cos(a);
        o.xy += d * (s - q);
        o.z = r - h * cos(a) + run * sin(a);
        n = vec2(sin(a), cos(a));
    }

    vec3 normal = vec3(d * n.x, n.y);

    if (uWave > 0.0 || uArc > 0.0)
    {
        vec2 wd = vec2(0.819, 0.574);
        float k = 6.2832 / (uSize.x * 0.8);
        float phase = dot(p, wd) * k + uWaveTime;
        float wave = uWave * (sin(phase) + 0.35 * sin(phase * 2.7 + 1.3));
        float dwave = uWave * k * (cos(phase) + 0.945 * cos(phase * 2.7 + 1.3));
        float hx = uSize.x * 0.5;
        float arc = uArc * (1.0 - (p.x * p.x) / (hx * hx));
        float darc = uArc * (-2.0 * p.x) / (hx * hx);
        vec2 grad = wd * dwave + vec2(darc, 0.0);
        float side = normal.z < 0.0 ? -1.0 : 1.0;
        o.z += wave + arc;
        normal = normalize(vec3(-grad, 1.0)) * side;
    }

    vNormal = normalize(mat3(modelMatrix) * normal);

    vec4 world = modelMatrix * vec4(o, 1.0);
    vPos = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
}`,m=`#version 300 es
precision highp float;

in vec2 vUv;
in vec3 vNormal;
in vec3 vPos;

uniform sampler2D uMap;
uniform vec2 uSize;
uniform vec2 uCorner;
uniform float uCornerRadius;
uniform vec3 uBack;
uniform vec3 uLight;
uniform float uAmbient;
uniform float uWrap;
uniform float uSheen;
uniform float uGrain;
uniform float uAlpha;
uniform float uShadowFront;
uniform float uShadow;
uniform float uShadowWidth;

out vec4 fragColor;

float roundedBox(vec2 p, vec2 b, float r)
{
    vec2 q = abs(p) - b + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

float hash(vec2 p)
{
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main()
{
    vec2 px = (vUv - 0.5) * uSize;
    float sd = roundedBox(px, uSize * 0.5, uCornerRadius);
    float alpha = (1.0 - smoothstep(-0.75, 0.75, sd)) * uAlpha;
    if (alpha <= 0.002) discard;

    vec3 n = normalize(vNormal);
    if (!gl_FrontFacing) n = -n;
    vec3 base = gl_FrontFacing ? texture(uMap, vUv).rgb : uBack;

    vec3 L = normalize(uLight);
    float diff = clamp((dot(n, L) + uWrap) / (1.0 + uWrap), 0.0, 1.0);
    float shade = mix(uAmbient, 1.0, diff);
    vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
    float spec = pow(max(dot(n, H), 0.0), 16.0) * uSheen;
    vec3 col = base * shade + spec;

    if (uShadowFront >= 0.0)
    {
        vec2 d = -normalize(uCorner * uSize);
        float half_ = (abs(d.x) * uSize.x + abs(d.y) * uSize.y) * 0.5;
        float f = -half_ + uShadowFront * 2.0 * half_;
        float behind = f - dot(px, d);
        float sh = uShadow * exp(-max(behind, 0.0) / uShadowWidth) * step(0.0, behind);
        col *= 1.0 - sh;
    }

    col += (hash(floor(px)) - 0.5) * uGrain;

    fragColor = vec4(col * alpha, alpha);
}`,h=Math.PI/180,g={"top-left":[-1,1],"top-right":[1,1],"bottom-left":[-1,-1],"bottom-right":[1,-1]},_={segments:128,corner:`top-left`,peekAt:.52,flapFrom:180,radiusFrom:64,radius:110,radiusGrow:110,radiusLand:40,flap:180,tension:0,duration:1.25,gustFrom:.6,gustDuration:1.5,windX:1,windLift:.45,windLiftZ:140,windDepth:700,windSpin:28,windTilt:26,wave:7,waveSpeed:9,arc:8,cornerRadius:20,lightX:-.35,lightY:.55,lightZ:1,ambient:.7,wrap:.48,sheen:.05,grain:0,backDarken:.04,shadow:.32,shadowWidth:215},v={front:0,gust:0,shade:1},y={w:535,h:530},b=1.7;function x(e,t,n,r,i,a){e.width=t,e.height=n;let o=e.getContext(`2d`);o.fillStyle=i.color,o.fillRect(0,0,t,n),o.fillStyle=`#000`,o.textBaseline=`alphabetic`;let s=(e,t)=>{o.font=`${t} ${e*r}px ${a}`,o.letterSpacing=`${-.02*e*r}px`},c=e=>{let t=o.measureText(`Hg`);return[t.fontBoundingBoxAscent??e*r*.95,t.fontBoundingBoxDescent??e*r*.25]},l=(e,t)=>{let[n,i]=c(e);return(t*e*r-n-i)/2+n},u=(e,t)=>{let[n,i]=c(e);return(n-i-t*e*r)/2},d=40*r;if(s(28,600),o.textAlign=`left`,o.fillText(i.title,d,d+l(28,1.3)),i.note){let e=n-44*r;s(28,600),o.textAlign=`right`,o.globalAlpha=.3,o.fillText(i.note,d+362*r,e+u(28,.9)),o.globalAlpha=1;let t=n-32*r-49.2*r+10*r;s(164,500),o.textAlign=`left`,o.fillText(i.amount,d,t+u(164,.9)),s(28,600),o.textAlign=`right`,o.fillText(i.period,d+363*r,t-12*r+u(28,.9));return}let f=n-d;s(164,500),o.textAlign=`left`;let p=o.measureText(i.amount).width;o.fillText(i.amount,d,f+u(164,.9)),s(28,600),o.fillText(i.period,d+p+4*r,f-12*r+u(28,.9))}var S=class{constructor(e,t,r,i){this.app=e,this.gl=t,this.section=i,this.section&&(window.matchMedia(`(prefers-reduced-motion: reduce)`).matches||(this.sizes=this.app.sizes,this.time=this.app.time,this.inflow=f(),this.speed=this.inflow?b:1,this.canvas=this.section.querySelector(this.inflow?`[data-pricing-stage]`:`[data-pricing-canvas]`),this.target=this.section.querySelector(`[data-pricing-sheet]`),this.family=this.target?getComputedStyle(this.target).fontFamily:`sans-serif`,this.plans=Object.values(JSON.parse(this.section.dataset.pricingPlans||`{}`)),!this.canvas||!this.target||this.plans.length<2||(this.params={..._},this.state={...v,flap:_.flapFrom*h,radius:_.radiusFrom},this.top=0,this.head={t:0},this.ghosts=new Set,this.version=0,this.rendered={w:0,h:0},this.quat=new n,this.pivot=new a,this.init())))}init(){this.setRenderer(),this.context&&(this.updateRects(),this.setProgram(),this.setGeometry(),this.setSheets(),this.setLayoutObserver(),this.tl=this.buildTimeline(),this.section.classList.add(`is-gl`),this.warm(),Promise.all([document.fonts?.load(`600 48px ${this.family}`),document.fonts?.ready]).then(()=>this.renderCards(!0)))}setRenderer(){try{this.renderer=new e({canvas:this.canvas,width:this.view.w,height:this.view.h,dpr:this.inflow?Math.min(window.devicePixelRatio||1,3):Math.min(this.sizes.pixelRatio,2),alpha:!0,premultipliedAlpha:!0,antialias:!1,depth:!1,powerPreference:`low-power`})}catch(e){console.warn(`[Paper] no WebGL context:`,e.message);return}this.context=this.renderer.gl,this.context.clearColor(0,0,0,0),this.scene=new r,this.camera=new t(this.context,{fov:45,aspect:1,near:1,far:3e3}),this.camera.position.z=1200,this.stage=this.view,this.setCamera(),this.shown=!1,this.lastSignature=``,this.renderedAt=0}setCamera(){let{w:e,h:t}=this.stage;this.camera.fov=Math.atan(t/2/1200)*2*(180/Math.PI),this.camera.perspective({aspect:e/t})}get view(){return this.inflow?{w:this.section.clientWidth,h:this.section.clientHeight}:{w:this.sizes.width,h:this.sizes.height}}fitStage(){let{w:e,h:t}=this.view;(e!==this.stage.w||t!==this.stage.h)&&(this.stage={w:e,h:t},this.renderer.setSize(e,t),this.setCamera(),this.lastSignature=``)}warm(){let e=this.context;this.sheets.forEach(e=>e.mesh.visible=!0),e.enable(e.SCISSOR_TEST),e.scissor(0,0,1,1),this.renderer.render({scene:this.scene,camera:this.camera}),e.disable(e.SCISSOR_TEST),this.sheets.forEach(e=>e.mesh.visible=!1)}show(e){e!==this.shown&&(this.shown=e,e&&(this.lastSignature=``),this.canvas.classList.toggle(`is-shown`,e))}render(){let e=d.isTweening(this.head)||this.ghosts.size>0,t=this.signature(),n=performance.now();!e&&t===this.lastSignature&&n-this.renderedAt<1e3||(this.lastSignature=t,this.renderedAt=n,this.renderer.render({scene:this.scene,camera:this.camera}))}setProgram(){let e=this.params;this.material=new o(this.context,{vertex:p,fragment:m,transparent:!0,depthTest:!1,depthWrite:!1,cullFace:!1,uniforms:{uMap:{value:null},uSize:{value:new i(y.w,y.h)},uCorner:{value:new i(...g[e.corner])},uFront:{value:0},uRadius:{value:e.radiusFrom},uFlap:{value:e.flapFrom*h},uTension:{value:e.tension},uWave:{value:0},uWaveTime:{value:0},uArc:{value:0},uCornerRadius:{value:e.cornerRadius},uBack:{value:new u(`#000000`)},uLight:{value:new a(e.lightX,e.lightY,e.lightZ)},uAmbient:{value:e.ambient},uWrap:{value:e.wrap},uSheen:{value:e.sheen},uGrain:{value:e.grain},uAlpha:{value:1},uShadowFront:{value:-1},uShadow:{value:e.shadow},uShadowWidth:{value:e.shadowWidth}}})}setGeometry(){let e=this.params.segments;this.geometry?.remove(),this.geometry=new l(this.context,{width:1,height:1,widthSegments:e,heightSegments:e}),this.sortIndices(),this.sheets?.forEach(e=>e.mesh.geometry=this.geometry),this.touch()}sortIndices(){let e=this.geometry.attributes.index.data,t=this.geometry.attributes.position.data,[n,r]=g[this.params.corner],i=-n*(this.rect?.width||y.w),a=-r*(this.rect?.height||y.h),o=[];for(let n=0;n<e.length;n+=3){let r=e[n],s=e[n+1],c=e[n+2],l=t[r*3]+t[s*3]+t[c*3],u=t[r*3+1]+t[s*3+1]+t[c*3+1];o.push([l*i+u*a,r,s,c])}o.sort((e,t)=>t[0]-e[0]),o.forEach((t,n)=>{e[n*3]=t[1],e[n*3+1]=t[2],e[n*3+2]=t[3]}),this.geometry.updateAttribute(this.geometry.attributes.index)}setSheets(){this.sheets=this.plans.map((e,t)=>{let n=document.createElement(`canvas`),r=new s(this.context,{image:n,anisotropy:8}),i=new c(this.context,{geometry:this.geometry,program:this.material,frustumCulled:!1,renderOrder:t===this.top?6:5});i.visible=!1,i.setParent(this.scene);let a={plan:e,canvas:n,texture:r,mesh:i,back:new u(e.color)};return i.onBeforeRender(()=>this.bind(a)),a}),this.renderCards(!0)}bind(e){let t=this.state;this.sheets[this.top]===e?this.apply(e,t,t.front,t.gust,-1,0):this.apply(e,t,0,0,t.front>0?t.front:-1,this.params.shadow*t.shade)}apply(e,t,n,r,i,a){let o=this.material.uniforms,s=this.params,c=this.scale,l=Math.min(1,r*3)*(1-.3*r);o.uMap.value=e.texture,o.uBack.value=e.back,o.uFront.value=n,o.uFlap.value=t.flap,o.uRadius.value=t.radius*c,o.uTension.value=s.tension,o.uWave.value=s.wave*c*l,o.uWaveTime.value=this.time.elapsed/1e3*s.waveSpeed,o.uArc.value=s.arc*c*l,o.uCornerRadius.value=s.cornerRadius*c,o.uShadowWidth.value=s.shadowWidth*c,o.uShadow.value=a,o.uShadowFront.value=i}renderCards(e){if(!this.rect||!this.sheets)return;let t=this.renderer.dpr,n=Math.max(1,Math.round(this.rect.width*t)),r=Math.max(1,Math.round(this.rect.height*t));if(e||n!==this.rendered.w||r!==this.rendered.h){this.rendered={w:n,h:r};for(let e of this.sheets)x(e.canvas,n,r,this.scale*t,e.plan,this.family),e.texture.needsUpdate=!0;this.backs()}}backs(){let e=1-this.params.backDarken;for(let t of this.sheets){let[n,r,i]=new u(t.plan.color);t.back.set(n*e,r*e,i*e)}this.touch()}updateRects(){this.rect=this.target?.getBoundingClientRect()??null,this.origin=this.inflow?this.section.getBoundingClientRect():{left:0,top:0}}setScroll(){this.updateRects()}setLayoutObserver(){this.layoutObserver=new ResizeObserver(()=>{this.updateRects(),this.fitStage(),this.renderCards()}),this.layoutObserver.observe(document.body)}setPosition(){if(!this.rect)return;let e=this.rect,t=this.state,n=this.sizes.height,r=e.bottom>-n&&e.top<this.sizes.height+n,i=e.left-this.origin.left+e.width/2-this.stage.w/2,a=this.stage.h/2-(e.top-this.origin.top+e.height/2);this.show(r||t.gust>0||this.ghosts.size>0),this.sheets.forEach((n,r)=>{n.mesh.visible=this.shown,this.pose(n.mesh,r===this.top?t:v,i,a,e)});for(let t of this.ghosts)t.mesh.visible=this.shown,this.pose(t.mesh,t.state,i,a,e);this.material.uniforms.uSize.value.set(e.width,e.height)}pose(e,t,n,r,i){if(t.gust<=0){e.position.set(n,r,0),e.rotation.set(0,0,0);return}let a=this.params,[o,s]=g[a.corner],c=t.gust,l=c*c,u=1-(1-c)*(1-c);e.rotation.set(a.windTilt*.5*h*Math.sin(c*Math.PI*2.2+.8),a.windTilt*h*Math.sin(c*Math.PI*1.5),a.windSpin*h*u),this.quat.fromEuler(e.rotation),this.pivot.set(-o*i.width,-s*i.height,0).applyQuaternion(this.quat),e.position.set(n-o*i.width-this.pivot.x+l*a.windX*(this.stage.w+i.width),r-s*i.height-this.pivot.y+u*a.windLift*i.height,-this.pivot.z+a.windLiftZ*this.scale*Math.sin(Math.PI*c)-a.windDepth*c*c)}detach(){let e=this.sheets[this.top],t=this.state,n=this.params,r=new c(this.context,{geometry:this.geometry,program:this.material,frustumCulled:!1,renderOrder:7});r.setParent(this.scene);let i={mesh:r,texture:e.texture,back:e.back,state:{front:t.front,flap:t.flap,radius:t.radius,gust:t.gust,shade:0}};r.onBeforeRender(()=>this.apply(i,i.state,i.state.front,i.state.gust,-1,0)),this.ghosts.add(i);let a=Math.max(.05,n.gustDuration*(1-t.gust)/this.speed);d.to(i.state,{gust:1,duration:a,ease:`none`}),d.to(i.state,{front:1,radius:n.radiusLand,duration:Math.min(a,.5),ease:`power1.out`}),d.delayedCall(a,()=>this.release(i))}release(e){d.killTweensOf(e.state),this.scene.removeChild(e.mesh),this.ghosts.delete(e),this.touch()}get mesh(){return this.sheets?.[this.top]?.mesh}get scale(){return(this.rect?.width||y.w)/y.w}touch(){this.version++}invalidate(){this.playing||(this.rebuild(!0),this.touch())}rebuild(e){let t=e&&this.tl?this.head.t/this.tl.duration():0;d.killTweensOf(this.head),this.tl?.kill(),this.tl=this.buildTimeline(),this.head.t=t*this.tl.duration(),this.tl.time(this.head.t)}buildTimeline(){let e=this.params,t=this.state;return Object.assign(t,v,{flap:e.flapFrom*h,radius:e.radiusFrom}),d.timeline({paused:!0}).fromTo(t,{front:0},{front:1,duration:e.duration,ease:`power2.inOut`},0).fromTo(t,{flap:e.flapFrom*h,radius:e.radiusFrom},{flap:e.flap*h,radius:e.radius+e.radiusGrow,duration:e.duration*.4,ease:`power2.out`},0).to(t,{radius:e.radiusLand,duration:e.duration*.3,ease:`power2.inOut`},e.duration*.4).fromTo(t,{shade:1},{shade:0,duration:e.duration*.15,ease:`power1.inOut`},e.duration*.45).fromTo(t,{gust:0},{gust:1,duration:e.gustDuration,ease:`none`},e.duration*e.gustFrom)}drive(e,t,n,r){d.killTweensOf(this.head),d.to(this.head,{t:e,duration:t,ease:n,onUpdate:()=>{this.tl.time(this.head.t),this.touch()},onComplete:r})}peek(e){if(!this.sheets||this.playing)return;let t=this.params;this.drive(e?t.peekAt*t.duration:0,e?.7:.55,e?`power3.out`:`power2.inOut`)}flip(e){if(!this.sheets)return;if(this.playing){if(this.heading===e)return;if(this.state.gust>0){this.detach(),this.settle(this.heading),this.flip(e);return}this.heading=this.top,this.drive(0,this.head.t/this.speed,`none`,()=>this.settle(this.top));return}if(e===this.top)return;let t=this.tl.duration();this.playing=!0,this.heading=e,this.drive(t,(t-this.head.t)/this.speed,`none`,()=>this.settle(e))}settle(e){this.top=e,this.heading=null,this.playing=!1,this.rebuild(),this.sheets.forEach((t,n)=>t.mesh.renderOrder=n===e?6:5),this.touch()}scrub(e){this.sheets&&(d.killTweensOf(this.head),this.playing=!1,this.heading=null,this.head.t=e*this.tl.duration(),this.tl.time(this.head.t),this.touch())}setCorner(e){g[e]&&(this.params.corner=e,this.material.uniforms.uCorner.value.set(...g[e]),this.sortIndices(),this.invalidate())}update(){return this.sheets&&(this.setPosition(),this.shown&&this.render()),!1}signature(){if(!this.sheets)return``;let e=this.state,t=this.mesh;return[this.version,t?.visible,this.top,e.front,e.flap,e.radius,e.gust,e.shade,t?.position.x,t?.position.y].join()}resize(){this.sheets&&(this.updateRects(),this.fitStage(),this.renderCards(),this.sortIndices(),this.lastSignature=``)}destroy(){this.layoutObserver?.disconnect(),this.head&&d.killTweensOf(this.head),this.ghosts?.forEach(e=>this.release(e)),this.tl?.kill();for(let e of this.sheets??[])this.scene.removeChild(e.mesh),e.texture.texture&&this.context.deleteTexture(e.texture.texture);this.geometry?.remove(),this.material?.remove(),this.context?.getExtension(`WEBGL_lose_context`)?.loseContext(),this.sheets=null,this.canvas?.classList.remove(`is-shown`),this.section?.classList.remove(`is-gl`)}};export{S as t};