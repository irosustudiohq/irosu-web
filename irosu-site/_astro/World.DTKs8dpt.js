import{r as e}from"./grid.l1kqvQ-y.js?dpl=dpl_74aUw43o7S3n9NFJ1ZxBM24TaWuz";import{i as t,r as n,t as r}from"./Plane.CXPNF1Te.js?dpl=dpl_74aUw43o7S3n9NFJ1ZxBM24TaWuz";import{t as i}from"./Vec2.Cn17CgjE.js?dpl=dpl_74aUw43o7S3n9NFJ1ZxBM24TaWuz";import{t as a}from"./Color.xVu7ktDx.js?dpl=dpl_74aUw43o7S3n9NFJ1ZxBM24TaWuz";import{t as o}from"./footer.MW6JWMPH.js?dpl=dpl_74aUw43o7S3n9NFJ1ZxBM24TaWuz";import{t as s}from"./paper.BdJHLWxu.js?dpl=dpl_74aUw43o7S3n9NFJ1ZxBM24TaWuz";import{t as c}from"./fluid.C0xjZOXr.js?dpl=dpl_74aUw43o7S3n9NFJ1ZxBM24TaWuz";var l=`#version 300 es

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
}`,u=`#version 300 es

precision highp float;

uniform vec2 uResolution;
uniform float uCellSize;
uniform float uProgress;
uniform float uEdge;
uniform float uJitter;
uniform vec2 uDirection;
uniform vec3 uColor;
uniform float uAlpha;

in vec2 vUv;
out vec4 fragColor;

float hash(vec2 p)
{
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

void main()
{
    vec2 px = vUv * uResolution;
    vec2 cell = floor(px / uCellSize);
    vec2 cellCount = max(ceil(uResolution / uCellSize), vec2(1.0));
    vec2 cellPos = (cell + 0.5) / cellCount;

    vec2 dir = normalize(uDirection);
    float lo = min(dir.x, 0.0) + min(dir.y, 0.0);
    float hi = max(dir.x, 0.0) + max(dir.y, 0.0);
    float grad = (dot(cellPos, dir) - lo) / max(hi - lo, 0.0001);

    float rnd = hash(cell);
    float threshold = mix(grad, rnd, uJitter);

    float edge = max(uEdge, 0.0001);
    float p = uProgress * (1.0 + 2.0 * edge) - edge;
    float visible = 1.0 - smoothstep(threshold - edge, threshold + edge, p);

    float a = visible * uAlpha;
    fragColor = vec4(uColor * a, a);
}`,d={cellSize:160,progress:0,edge:.5,jitter:.4,color:`#b8aeff`,alpha:1,directionX:-1,directionY:1},f=class{constructor(e,t,n){this.app=e,this.gl=t,this.scene=n,this.sizes=this.app.sizes,this.renderer=this.gl.renderer.instance,this.context=this.renderer.gl,this.params={...d},this.init()}init(){this.setMaterial(),this.setMesh(),this.setDebug()}setMaterial(){this.material=new t(this.context,{vertex:l,fragment:u,transparent:!0,depthTest:!1,depthWrite:!1,cullFace:!1,uniforms:{uResolution:{value:new i(this.sizes.width,this.sizes.height)},uCellSize:{value:this.params.cellSize},uProgress:{value:this.params.progress},uEdge:{value:this.params.edge},uJitter:{value:this.params.jitter},uDirection:{value:new i(this.params.directionX,this.params.directionY)},uColor:{value:new a(this.params.color)},uAlpha:{value:this.params.alpha}}})}setMesh(){this.geometry=new r(this.context,{width:1,height:1}),this.mesh=new n(this.context,{geometry:this.geometry,program:this.material,frustumCulled:!1,renderOrder:10}),this.mesh.scale.set(this.sizes.width,this.sizes.height,1),this.mesh.position.set(0,0,0),this.mesh.setParent(this.scene),this.mesh.visible=!1}setProgress(e){this.params.progress=e,this.material.uniforms.uProgress.value=e}update(){}resize(){this.mesh.scale.set(this.sizes.width,this.sizes.height,1),this.material.uniforms.uResolution.value.set(this.sizes.width,this.sizes.height)}setDebug(){let e=this.app.debug;e&&e.getGui().then(e=>{if(!e)return;this.gui=e.addFolder(`Reveal`);let t=this.material.uniforms,n=this.params;this.gui.add(n,`progress`,0,1,.001).listen().onChange(e=>t.uProgress.value=e),this.gui.add(n,`cellSize`,20,400,1).onChange(e=>t.uCellSize.value=e),this.gui.add(n,`edge`,0,1,.01).onChange(e=>t.uEdge.value=e),this.gui.add(n,`jitter`,0,1,.01).onChange(e=>t.uJitter.value=e),this.gui.add(n,`alpha`,0,1,.01).onChange(e=>t.uAlpha.value=e),this.gui.add(n,`directionX`,-1,1,.01).onChange(e=>t.uDirection.value.x=e),this.gui.add(n,`directionY`,-1,1,.01).onChange(e=>t.uDirection.value.y=e),this.gui.addColor(n,`color`).onChange(e=>t.uColor.value.set(e))})}destroy(){this.gui?.destroy(),this.geometry?.remove?.(),this.mesh&&this.scene.removeChild(this.mesh)}},p=class{constructor(e,t,n,r){this.gl=e,this.app=t,this.scene=n,this.main=r,this.sizes=this.app.sizes,this.renderer=this.gl.renderer.instance,this.camera=this.gl.camera.instance,this.ready=new Promise(e=>{this.readyResolve=e}),this.load()}load(){this.init()}init(){this.sizes.isMobile||(this.fluid=new c(this.app,this.gl)),this.grid=new e(this.app,this.gl,this.scene),this.reveal=new f(this.app,this.gl,this.scene),this.footer=new o(this.app,this.gl,this.scene,this.main?.querySelector(`[data-footer-trigger]`)),this.paper=new s(this.app,this.gl,this.scene,this.main?.querySelector(`[data-pricing]`)),this.warm(),this.readyResolve()}warm(){let e=[this.grid,this.reveal,this.footer].map(e=>e?.mesh).filter(e=>e&&!e.visible);e.forEach(e=>e.visible=!0);let t=this.renderer.gl;t.enable(t.SCISSOR_TEST),t.scissor(0,0,1,1),this.renderer.render({scene:this.scene,camera:this.camera}),t.disable(t.SCISSOR_TEST),e.forEach(e=>e.visible=!1),this.fluid&&(this.fluid.lastInput=this.app.time?.elapsed??0,this.fluid.update()),t.flush()}setScroll(e){this.grid?.setScroll(e),this.footer?.setScroll(e),this.paper?.setScroll(e)}update(){let e=this.readsFluid()&&this.fluid?.update();this.grid?.update(),this.reveal?.update();let t=this.footer?.update();return this.paper?.update(),!!(e||t)}readsFluid(){return!!(this.grid?.mesh?.visible||this.footer?.mesh?.visible)}signature(){let e=this.grid?.material.uniforms,t=this.reveal?.material.uniforms,n=this.footer?.material?.uniforms;return[this.sizes.width,this.sizes.height,this.grid?.mesh?.visible,e?.uScroll.value,e?.uClipLeft.value,e?.uClipRight.value,e?.uClipTop.value,e?.uClipBottom.value,e?.uRevealOn.value,e?.uRevealT.value,this.reveal?.mesh?.visible,t?.uProgress.value,this.footer?.mesh?.visible,n?.uReveal.value,n?.uVideoHide.value,n?.uHasVideo.value].join()}scissor(){if(!this.grid?.mesh?.visible||this.reveal?.mesh?.visible||this.footer?.mesh?.visible)return null;let e=this.grid.material.uniforms;return{left:e.uClipLeft.value,bottom:e.uClipBottom.value,right:this.sizes.width-e.uClipRight.value,top:this.sizes.height-e.uClipTop.value}}onMouseMove(e,t){this.readsFluid()?this.fluid?.getMouse(e,t):this.fluid?.lastMouse.set(-1,-1)}resize(){this.fluid?.resize(),this.grid?.resize(),this.reveal?.resize(),this.footer?.resize(),this.paper?.resize()}destroy(){this.fluid?.destroy(),this.fluid=null,this.grid?.destroy(),this.grid=null,this.reveal?.destroy(),this.reveal=null,this.footer?.destroy(),this.footer=null,this.paper?.destroy(),this.paper=null}};export{p as default};