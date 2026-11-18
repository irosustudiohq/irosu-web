import{n as e,r as t,t as n}from"./spawn.DJsSsSXe.js?dpl=dpl_74aUw43o7S3n9NFJ1ZxBM24TaWuz";var r=`struct Uniforms
{
    size: f32,
    dpr: f32,
    dt: f32,
    frame: f32,
    gravity: f32,
    wind: f32,
    sweep: f32,
    sweepAll: f32,
    relax: f32,
    contactDamping: f32,
    contactFriction: f32,
    spin: f32,
    spinDrag: f32,
    drawScale: f32,
    jitter: f32,
    drag: f32,
    restitution: f32,
    friction: f32,
    maxSpeed: f32,
    rim: f32,
    handWidth: f32,
    handBand: f32,
    pointerRadius: f32,
    pointerPush: f32,
    pointerSweep: f32,
    pointerActive: f32,
    count: f32,
    spinContactDrag: f32,
    maxSpin: f32,
    sleep: f32,
    fluidForce: f32,
    fluidActive: f32,
    hour: vec4<f32>,
    minute: vec4<f32>,
    second: vec4<f32>,
    pointer: vec4<f32>,
    tune: vec4<f32>,
}

struct Body
{
    p: vec2<f32>,
    v: vec2<f32>,
    angle: f32,
    angVel: f32,
}

const PI: f32 = 3.14159265359;
const TAU: f32 = 6.28318530718;

@group(0) @binding(0) var<uniform> uni: Uniforms;
@group(0) @binding(1) var<storage, read> stateIn: array<vec4<f32>>;
@group(0) @binding(2) var<storage, read> spinIn: array<vec4<f32>>;
@group(0) @binding(3) var<storage, read> metaBuf: array<vec4<f32>>;
@group(0) @binding(4) var<storage, read_write> stateOut: array<vec4<f32>>;
@group(0) @binding(5) var<storage, read_write> spinOut: array<vec4<f32>>;
@group(1) @binding(0) var fluidTex: texture_2d<f32>;
@group(1) @binding(1) var fluidSamp: sampler;

fn hash1(seed: u32) -> f32
{
    var x: u32 = seed;
    x = x ^ (x >> 17u);
    x = x * 0xed5ad4bbu;
    x = x ^ (x >> 11u);
    x = x * 0xac4c1b51u;
    x = x ^ (x >> 15u);
    x = x * 0x31848babu;
    x = x ^ (x >> 14u);
    return f32(x) / 4294967296.0;
}

fn hash2(i: u32, frame: u32) -> vec2<f32>
{
    let seed: u32 = i * 1973u + frame * 9277u + 26699u;
    return vec2<f32>(hash1(seed), hash1(seed ^ 0x9e3779b9u));
}

fn wrapPi(a: f32) -> f32
{
    return a - TAU * floor((a + PI) / TAU);
}

fn handSweep(hand: vec4<f32>, body: Body, c: vec2<f32>, radius: f32) -> Body
{
    var o: Body = body;
    if (hand.w < 0.5)
    {
        return o;
    }

    let ang: f32 = hand.x;
    let omega: f32 = hand.y;
    let len: f32 = hand.z;
    let dh: vec2<f32> = vec2<f32>(sin(ang), -cos(ang));
    let th: vec2<f32> = vec2<f32>(cos(ang), sin(ang));

    let rVec: vec2<f32> = o.p - c;
    let s: f32 = dot(rVec, dh);
    if (s <= 0.0 || s >= len)
    {
        return o;
    }

    let q: vec2<f32> = rVec - s * dh;
    let dist: f32 = length(q);
    let w: f32 = uni.handWidth + radius;
    let band: f32 = max(uni.handBand, 1e-3);
    if (dist >= w + band)
    {
        return o;
    }

    let side: f32 = select(-1.0, 1.0, dot(q, th) >= 0.0);
    let goal: f32 = omega * s;
    let k: f32 = uni.sweep * clamp(1.0 - (dist - w) / band, 0.0, 1.0);

    if (side > 0.0)
    {
        let vt: f32 = dot(o.v, th);
        if (vt < goal)
        {
            o.v += th * (goal - vt) * k;
            o.angVel += (goal - vt) * k * 0.5 / radius;
        }
    }
    o.v += th * side * 7200.0 * uni.dt * k;
    return o;
}

fn handClear(hand: vec4<f32>, p: vec2<f32>, c: vec2<f32>, radius: f32) -> vec2<f32>
{
    if (hand.w < 0.5)
    {
        return p;
    }

    let dh: vec2<f32> = vec2<f32>(sin(hand.x), -cos(hand.x));
    let th: vec2<f32> = vec2<f32>(cos(hand.x), sin(hand.x));
    let rVec: vec2<f32> = p - c;
    let s: f32 = dot(rVec, dh);
    if (s <= 0.0 || s >= hand.z)
    {
        return p;
    }

    let q: vec2<f32> = rVec - s * dh;
    let w: f32 = uni.handWidth + radius;
    if (length(q) >= w)
    {
        return p;
    }

    let side: f32 = select(-1.0, 1.0, dot(q, th) >= 0.0);
    return c + dh * s + th * side * w;
}

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) gid: vec3<u32>)
{
    let i: u32 = gid.x;
    let total: u32 = u32(uni.count);
    if (i >= total)
    {
        return;
    }

    let s: f32 = uni.size;
    let dt: f32 = uni.dt;
    let fr: u32 = u32(uni.frame);
    let c: vec2<f32> = vec2<f32>(s * 0.5, s * 0.5);
    let rim: f32 = s * uni.rim;
    let radius: f32 = max(metaBuf[i].y, 1e-3);

    var body: Body;
    body.p = stateIn[i].xy;
    body.v = stateIn[i].zw;
    body.angle = spinIn[i].x;
    body.angVel = spinIn[i].y;

    let rVec: vec2<f32> = body.p - c;
    let r: f32 = max(length(rVec), 1e-3);
    let phi: f32 = atan2(rVec.x, -rVec.y);
    let tCw: vec2<f32> = vec2<f32>(cos(phi), sin(phi));

    var a: vec2<f32> = vec2<f32>(0.0, uni.gravity);
    var angAcc: f32 = 0.0;
    var contacts: f32 = 0.0;

    let dAng: f32 = wrapPi(phi - uni.second.x);
    let angular: f32 = 0.12 + 0.88 * pow(1.0 - abs(dAng) / PI, 3.0);
    let radial: f32 = clamp(r / rim, 0.2, 1.0);
    a += tCw * 600.0 * uni.wind * angular * radial;

    a += uni.jitter * (hash2(i, fr) * 2.0 - 1.0);

    if (uni.pointerActive > 0.5)
    {
        let dv: vec2<f32> = body.p - uni.pointer.xy;
        let d: f32 = length(dv);
        let rp: f32 = s * uni.pointerRadius;
        if (d < rp)
        {
            let f: f32 = pow(1.0 - d / rp, 2.0);
            var dir: vec2<f32> = vec2<f32>(0.0, 0.0);
            if (d < 1.0)
            {
                let ang: f32 = hash2(i, fr + 7919u).x * TAU;
                dir = vec2<f32>(cos(ang), sin(ang));
            }
            else
            {
                dir = dv / d;
            }
            a += dir * uni.pointerPush * f;

            let pv: vec2<f32> = uni.pointer.zw;
            let ps: f32 = length(pv);
            if (ps > 1e-4)
            {
                a += (pv / ps) * uni.pointerSweep * min(ps, 3.0) * f;
            }
        }
    }

    
    if (uni.fluidActive > 0.5)
    {
        let fv: vec2<f32> = textureSampleLevel(fluidTex, fluidSamp, vec2<f32>(body.p.x / s, 1.0 - body.p.y / s), 0.0).xy;
        a += vec2<f32>(fv.x, -fv.y) * (s / f32(textureDimensions(fluidTex).x)) * uni.fluidForce;
    }

    body.v *= exp(-uni.drag * dt);
    body.v += a * dt;
    body.angVel *= exp(-uni.spinDrag * dt);

    body = handSweep(uni.second, body, c, radius);
    body = handSweep(uni.minute, body, c, radius);
    body = handSweep(uni.hour, body, c, radius);

    let pOld: vec2<f32> = stateIn[i].xy;
    let pPred: vec2<f32> = body.p + body.v * dt;
    var corr: vec2<f32> = vec2<f32>(0.0, 0.0);
    for (var j: u32 = 0u; j < total; j++)
    {
        if (j == i)
        {
            continue;
        }

        let other: vec4<f32> = stateIn[j];
        let dv: vec2<f32> = pPred - other.xy;
        let d: f32 = length(dv);
        let rr: f32 = radius + metaBuf[j].y;
        if (d < rr && d > 1e-4)
        {
            let n: vec2<f32> = dv / d;
            corr += n * (rr - d) * 0.5;

            let vrel: vec2<f32> = body.v - other.zw;
            let vt: vec2<f32> = vrel - n * dot(vrel, n);
            corr -= vt * dt * uni.contactFriction * 0.5;

            let slip: f32 = n.x * vt.y - n.y * vt.x;
            angAcc += -slip / radius * uni.spin;
            contacts += 1.0;
        }
    }

    
    let push: vec2<f32> = corr * uni.relax / max(dt, 1e-4);
    let pushSpeed: f32 = length(push);
    body.p = pPred + corr * uni.relax;
    body.v = (pPred - pOld) / max(dt, 1e-4) + select(push, push * (uni.tune.x / pushSpeed), pushSpeed > uni.tune.x);
    body.angVel += angAcc * dt;
    if (contacts > 0.0)
    {
        body.v *= exp(-uni.contactDamping * dt);
        body.angVel *= exp(-uni.spinContactDrag * dt);
        if (length(body.v) < uni.sleep)
        {
            body.v = vec2<f32>(0.0, 0.0);
            body.angVel = 0.0;
        }
    }
    body.angle += body.angVel * dt;

    body.p = handClear(uni.second, body.p, c, radius);
    body.p = handClear(uni.minute, body.p, c, radius);
    body.p = handClear(uni.hour, body.p, c, radius);

    let lim: f32 = rim - radius;
    let off: vec2<f32> = body.p - c;
    let r2: f32 = length(off);
    if (r2 > lim)
    {
        let rh: vec2<f32> = off / max(r2, 1e-6);
        body.p = c + rh * lim;
        let vr: f32 = dot(body.v, rh);
        if (vr > 0.0)
        {
            body.v -= (1.0 + uni.restitution) * vr * rh;
        }
        let vRad: vec2<f32> = rh * dot(body.v, rh);
        body.v = vRad + (body.v - vRad) * (1.0 - 0.5 * uni.friction);
        body.angVel = dot(body.v, vec2<f32>(-rh.y, rh.x)) / radius;
    }

    body.angVel = clamp(body.angVel, -uni.maxSpin, uni.maxSpin);

    let speed: f32 = length(body.v);
    if (speed > uni.maxSpeed)
    {
        body.v = body.v / speed * uni.maxSpeed;
    }

    
    let finite: bool = dot(body.p, body.p) < 1e20 && dot(body.v, body.v) < 1e20 && abs(body.angle) < 1e20 && abs(body.angVel) < 1e20;
    if (!finite)
    {
        let rnd: vec2<f32> = hash2(i, fr + 104729u);
        body.p = vec2<f32>(c.x + (rnd.x - 0.5) * s * 0.5, s * 0.15 + rnd.y * s * 0.3);
        body.v = vec2<f32>(0.0, 0.0);
        body.angle = rnd.x * TAU;
        body.angVel = 0.0;
    }

    stateOut[i] = vec4<f32>(body.p, body.v);
    spinOut[i] = vec4<f32>(body.angle, body.angVel, 0.0, 0.0);
}`,i=`struct Fluid
{
    texel: vec2<f32>,
    dt: f32,
    curl: f32,
    point: vec2<f32>,
    radius: f32,
    dissipation: f32,
    force: vec2<f32>,
    pressure: f32,
    pad: f32,
}

@group(0) @binding(0) var<uniform> uni: Fluid;
@group(0) @binding(1) var srcA: texture_2d<f32>;
@group(0) @binding(2) var srcB: texture_2d<f32>;
@group(0) @binding(3) var samp: sampler;
@group(0) @binding(4) var dst: texture_storage_2d<rgba16float, write>;

const X: vec2<i32> = vec2<i32>(1, 0);
const Y: vec2<i32> = vec2<i32>(0, 1);

fn at(t: texture_2d<f32>, c: vec2<i32>) -> vec4<f32>
{
    let n: vec2<i32> = vec2<i32>(textureDimensions(t));
    return textureLoad(t, clamp(c, vec2<i32>(0, 0), n - 1), 0);
}

fn cell(id: vec3<u32>) -> vec2<i32>
{
    let c: vec2<i32> = vec2<i32>(id.xy);
    let n: vec2<i32> = vec2<i32>(textureDimensions(dst));
    if (c.x >= n.x || c.y >= n.y)
    {
        return vec2<i32>(-1, -1);
    }
    return c;
}

fn uv(c: vec2<i32>) -> vec2<f32>
{
    return (vec2<f32>(c) + 0.5) * uni.texel;
}

@compute @workgroup_size(8, 8)
fn splat(@builtin(global_invocation_id) id: vec3<u32>)
{
    let c: vec2<i32> = cell(id);
    if (c.x < 0)
    {
        return;
    }

    let p: vec2<f32> = uv(c) - uni.point;
    let s: vec2<f32> = exp2(-dot(p, p) / uni.radius) * uni.force;
    textureStore(dst, c, vec4<f32>(at(srcA, c).xy + s, 0.0, 1.0));
}

@compute @workgroup_size(8, 8)
fn curl(@builtin(global_invocation_id) id: vec3<u32>)
{
    let c: vec2<i32> = cell(id);
    if (c.x < 0)
    {
        return;
    }

    let l: f32 = at(srcA, c - X).y;
    let r: f32 = at(srcA, c + X).y;
    let t: f32 = at(srcA, c + Y).x;
    let b: f32 = at(srcA, c - Y).x;
    textureStore(dst, c, vec4<f32>(0.05 * (r - l - t + b), 0.0, 0.0, 1.0));
}

@compute @workgroup_size(8, 8)
fn vorticity(@builtin(global_invocation_id) id: vec3<u32>)
{
    let c: vec2<i32> = cell(id);
    if (c.x < 0)
    {
        return;
    }

    let l: f32 = at(srcB, c - X).x;
    let r: f32 = at(srcB, c + X).x;
    let t: f32 = at(srcB, c + Y).x;
    let b: f32 = at(srcB, c - Y).x;
    let w: f32 = at(srcB, c).x;

    var force: vec2<f32> = 0.5 * vec2<f32>(abs(t) - abs(b), abs(r) - abs(l));
    force = force / (length(force) + 0.0001) * uni.curl * w;
    force.y = -force.y;
    textureStore(dst, c, vec4<f32>(at(srcA, c).xy + force * uni.dt, 0.0, 1.0));
}

@compute @workgroup_size(8, 8)
fn divergence(@builtin(global_invocation_id) id: vec3<u32>)
{
    let c: vec2<i32> = cell(id);
    if (c.x < 0)
    {
        return;
    }

    let n: vec2<i32> = vec2<i32>(textureDimensions(srcA));
    let v: vec2<f32> = at(srcA, c).xy;
    var l: f32 = at(srcA, c - X).x;
    var r: f32 = at(srcA, c + X).x;
    var t: f32 = at(srcA, c + Y).y;
    var b: f32 = at(srcA, c - Y).y;
    if (c.x == 0)
    {
        l = -v.x;
    }
    if (c.x == n.x - 1)
    {
        r = -v.x;
    }
    if (c.y == n.y - 1)
    {
        t = -v.y;
    }
    if (c.y == 0)
    {
        b = -v.y;
    }
    textureStore(dst, c, vec4<f32>(0.6 * (r - l + t - b), 0.0, 0.0, 1.0));
}

@compute @workgroup_size(8, 8)
fn clear(@builtin(global_invocation_id) id: vec3<u32>)
{
    let c: vec2<i32> = cell(id);
    if (c.x < 0)
    {
        return;
    }

    textureStore(dst, c, uni.pressure * at(srcA, c));
}

@compute @workgroup_size(8, 8)
fn pressure(@builtin(global_invocation_id) id: vec3<u32>)
{
    let c: vec2<i32> = cell(id);
    if (c.x < 0)
    {
        return;
    }

    let sum: f32 = at(srcA, c - X).x + at(srcA, c + X).x + at(srcA, c + Y).x + at(srcA, c - Y).x;
    textureStore(dst, c, vec4<f32>((sum - at(srcB, c).x) * 0.25, 0.0, 0.0, 1.0));
}

@compute @workgroup_size(8, 8)
fn gradient(@builtin(global_invocation_id) id: vec3<u32>)
{
    let c: vec2<i32> = cell(id);
    if (c.x < 0)
    {
        return;
    }

    let grad: vec2<f32> = vec2<f32>(at(srcA, c + X).x - at(srcA, c - X).x, at(srcA, c + Y).x - at(srcA, c - Y).x);
    textureStore(dst, c, vec4<f32>(at(srcB, c).xy - grad, 0.0, 1.0));
}

@compute @workgroup_size(8, 8)
fn advect(@builtin(global_invocation_id) id: vec3<u32>)
{
    let c: vec2<i32> = cell(id);
    if (c.x < 0)
    {
        return;
    }

    let coord: vec2<f32> = uv(c) - uni.dt * at(srcA, c).xy * uni.texel;
    let v: vec2<f32> = textureSampleLevel(srcA, samp, coord, 0.0).xy;
    textureStore(dst, c, vec4<f32>(uni.dissipation * v, 0.0, 1.0));
}`,a=128,o=3,s=.8,c=[`splat`,`curl`,`vorticity`,`divergence`,`clear`,`pressure`,`gradient`,`advect`],l=class{constructor(e){this.device=e,this.res=a,this.data=new Float32Array(12),this.groups=new Map,this.v=0,this.p=0;let t=GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.STORAGE_BINDING,n=n=>e.createTexture({label:n,size:[a,a],format:`rgba16float`,usage:t});this.velocity=[n(`v0`),n(`v1`)],this.pressure=[n(`p0`),n(`p1`)],this.curl=n(`curl`),this.divergence=n(`divergence`),this.dummy=e.createTexture({label:`dummy`,size:[1,1],format:`rgba16float`,usage:GPUTextureUsage.TEXTURE_BINDING}),this.views=new Map([this.dummy,this.curl,this.divergence,...this.velocity,...this.pressure].map(e=>[e,e.createView()])),this.sampler=e.createSampler({magFilter:`linear`,minFilter:`linear`,addressModeU:`clamp-to-edge`,addressModeV:`clamp-to-edge`}),this.uniform=e.createBuffer({size:this.data.byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});let r=GPUShaderStage.COMPUTE;this.layout=e.createBindGroupLayout({entries:[{binding:0,visibility:r,buffer:{type:`uniform`}},{binding:1,visibility:r,texture:{sampleType:`float`}},{binding:2,visibility:r,texture:{sampleType:`float`}},{binding:3,visibility:r,sampler:{type:`filtering`}},{binding:4,visibility:r,storageTexture:{access:`write-only`,format:`rgba16float`}}]});let o=e.createShaderModule({code:i}),s=e.createPipelineLayout({bindGroupLayouts:[this.layout]});this.pipelines={};for(let t of c)this.pipelines[t]=e.createComputePipeline({layout:s,compute:{module:o,entryPoint:t}})}get current(){return this.views.get(this.velocity[this.v])}group(e,t,n){let r=`${e.label}|${t.label}|${n.label}`,i=this.groups.get(r);return i||(i=this.device.createBindGroup({layout:this.layout,entries:[{binding:0,resource:{buffer:this.uniform}},{binding:1,resource:this.views.get(e)},{binding:2,resource:this.views.get(t)},{binding:3,resource:this.sampler},{binding:4,resource:this.views.get(n)}]}),this.groups.set(r,i)),i}run(e,t,n,r,i){e.setPipeline(this.pipelines[t]),e.setBindGroup(0,this.group(n,r??this.dummy,i)),e.dispatchWorkgroups(a/8,a/8)}encode(e,t,n,r){let i=this.data;i[0]=i[1]=1/a,i[2]=t,i[3]=r.fluidCurl,i[4]=n?.x??0,i[5]=n?.y??0,i[6]=r.fluidRadius/100,i[7]=r.fluidFade,i[8]=n?.dx??0,i[9]=n?.dy??0,i[10]=s,this.device.queue.writeBuffer(this.uniform,0,i);let c=this.velocity,l=this.pressure;n&&this.flipV(e,`splat`,null),this.run(e,`curl`,c[this.v],null,this.curl),this.flipV(e,`vorticity`,this.curl),this.run(e,`divergence`,c[this.v],null,this.divergence),this.flipP(e,`clear`,null);for(let t=0;t<o;t++)this.flipP(e,`pressure`,this.divergence);this.run(e,`gradient`,l[this.p],c[this.v],c[1-this.v]),this.v=1-this.v,this.flipV(e,`advect`,null)}flipV(e,t,n){this.run(e,t,this.velocity[this.v],n,this.velocity[1-this.v]),this.v=1-this.v}flipP(e,t,n){this.run(e,t,this.pressure[this.p],n,this.pressure[1-this.p]),this.p=1-this.p}destroy(){for(let e of this.views.keys())e.destroy();this.uniform.destroy(),this.views.clear(),this.groups.clear()}},u=`struct Uniforms
{
    size: f32,
    dpr: f32,
    dt: f32,
    frame: f32,
    gravity: f32,
    wind: f32,
    sweep: f32,
    sweepAll: f32,
    relax: f32,
    contactDamping: f32,
    contactFriction: f32,
    spin: f32,
    spinDrag: f32,
    drawScale: f32,
    jitter: f32,
    drag: f32,
    restitution: f32,
    friction: f32,
    maxSpeed: f32,
    rim: f32,
    handWidth: f32,
    handBand: f32,
    pointerRadius: f32,
    pointerPush: f32,
    pointerSweep: f32,
    pointerActive: f32,
    count: f32,
    spinContactDrag: f32,
    maxSpin: f32,
    sleep: f32,
    pad1: f32,
    pad2: f32,
    hour: vec4<f32>,
    minute: vec4<f32>,
    second: vec4<f32>,
    pointer: vec4<f32>,
}

struct VertexOut
{
    @builtin(position) clip: vec4<f32>,
    @location(0) atlasUv: vec2<f32>,
    @location(1) tint: vec3<f32>,
}

const ATLAS_COLS: f32 = __COLS__;
const ATLAS_ROWS: f32 = __ROWS__;

@group(0) @binding(0) var<uniform> uni: Uniforms;
@group(0) @binding(1) var<storage, read> state: array<vec4<f32>>;
@group(0) @binding(2) var<storage, read> spin: array<vec4<f32>>;
@group(0) @binding(3) var<storage, read> metaBuf: array<vec4<f32>>;
@group(0) @binding(4) var atlasTex: texture_2d<f32>;
@group(0) @binding(5) var atlasSamp: sampler;

var<private> PALETTE: array<vec3<f32>, 6> = array<vec3<f32>, 6>(__PALETTE__);

var<private> QUAD: array<vec2<f32>, 6> = array<vec2<f32>, 6>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>(1.0, -1.0),
    vec2<f32>(-1.0, 1.0),
    vec2<f32>(-1.0, 1.0),
    vec2<f32>(1.0, -1.0),
    vec2<f32>(1.0, 1.0),
);

@vertex
fn vs(@builtin(vertex_index) vi: u32, @builtin(instance_index) ii: u32) -> VertexOut
{
    let s: f32 = max(uni.size, 1.0);
    let corner: vec2<f32> = QUAD[vi];
    let info: vec4<f32> = metaBuf[ii];
    let halfPx: f32 = info.y * uni.drawScale;

    let ang: f32 = spin[ii].x;
    let ca: f32 = cos(ang);
    let sa: f32 = sin(ang);
    let offset: vec2<f32> = vec2<f32>(corner.x * ca - corner.y * sa, corner.x * sa + corner.y * ca) * halfPx;
    let pos: vec2<f32> = state[ii].xy + offset;

    let shape: f32 = floor(info.x + 0.5);
    let col: f32 = shape % ATLAS_COLS;
    let row: f32 = floor(shape / ATLAS_COLS);
    let cellUv: vec2<f32> = (corner + vec2<f32>(1.0, 1.0)) * 0.5;

    var o: VertexOut;
    o.clip = vec4<f32>(2.0 * pos.x / s - 1.0, 1.0 - 2.0 * pos.y / s, 0.0, 1.0);
    o.atlasUv = (vec2<f32>(col, row) + cellUv) / vec2<f32>(ATLAS_COLS, ATLAS_ROWS);
    o.tint = PALETTE[u32(info.z) % 6u];
    return o;
}

@fragment
fn fs(frag: VertexOut) -> @location(0) vec4<f32>
{
    let alpha: f32 = textureSample(atlasTex, atlasSamp, frag.atlasUv).a;
    if (alpha < 0.01)
    {
        discard;
    }
    return vec4<f32>(frag.tint * alpha, alpha);
}`,d=64,f=52,p=e=>{let t=parseInt(String(e).replace(`#`,``),16)||0;return[(t>>16&255)/255,(t>>8&255)/255,(t&255)/255]},m=e=>{let t=[];for(let n=0;n<6;n++){let[r,i,a]=p(e?.[n%(e?.length||1)]??`#ffffff`);t.push(`vec3<f32>(${r.toFixed(5)}, ${i.toFixed(5)}, ${a.toFixed(5)})`)}return t.join(`, `)},h=class{constructor(e,{size:t,dpr:n,count:r,palette:i,atlas:a,params:o}){this.canvas=e,this.size=t,this.dpr=n,this.count=Math.max(1,Math.round(r)),this.palette=i,this.atlas=a,this.params=o,this.device=null,this.context=null,this.format=null,this.ready=!1,this.dead=!1,this.frame=0,this.ping=0,this.stateBuffers=[],this.spinBuffers=[],this.simGroups=[],this.renderGroups=[],this.uniformData=new Float32Array(f)}async init(){if(!navigator.gpu||!this.atlas?.canvas)return!1;try{let e=await navigator.gpu.requestAdapter();if(!e)return!1;let t=await e.requestDevice();if(!t||(this.device=t,t.lost.then(()=>{this.dead=!0,this.ready=!1}),this.context=this.canvas.getContext(`webgpu`),!this.context))return!1;this.format=navigator.gpu.getPreferredCanvasFormat(),this.canvas.width=this.canvas.height=Math.max(1,Math.round(this.size*this.dpr)),this.context.configure({device:t,format:this.format,alphaMode:`premultiplied`}),this.createAtlasTexture(),this.createBuffers(),this.respawn(),t.pushErrorScope(`validation`),this.fluid=new l(t),this.createPipelines();let n=await t.popErrorScope();return n?(console.warn(`[Clock] webgpu validation error`,n.message),!1):!this.dead&&(this.createBindGroups(),this.ready=!0,!0)}catch(e){return console.warn(`[Clock] webgpu init failed`,e),!1}}createAtlasTexture(){let e=this.device,t=this.atlas.canvas;this.atlasTexture=e.createTexture({size:[t.width,t.height],format:`rgba8unorm`,usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT}),e.queue.copyExternalImageToTexture({source:t},{texture:this.atlasTexture,premultipliedAlpha:!0},[t.width,t.height]),this.atlasSampler=e.createSampler({magFilter:`linear`,minFilter:`linear`,addressModeU:`clamp-to-edge`,addressModeV:`clamp-to-edge`})}createBuffers(){let e=this.device,t=this.count*16,n=GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST;this.uniformBuffer=this.uniformBuffer??e.createBuffer({size:208,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.releaseParticleBuffers(),this.stateBuffers=[e.createBuffer({size:t,usage:n}),e.createBuffer({size:t,usage:n})],this.spinBuffers=[e.createBuffer({size:t,usage:n}),e.createBuffer({size:t,usage:n})],this.metaBuffer=e.createBuffer({size:t,usage:n})}releaseParticleBuffers(){for(let e of this.stateBuffers)e.destroy();for(let e of this.spinBuffers)e.destroy();this.metaBuffer?.destroy(),this.stateBuffers=[],this.spinBuffers=[],this.metaBuffer=null}respawn(){if(this.dead||!this.device||!this.metaBuffer)return;let r=n(this.count,this.size,this.params,this.palette.length),i=t(this.count,this.size,r,this.params),a=e(this.count),o=this.device.queue;o.writeBuffer(this.metaBuffer,0,r);for(let e of this.stateBuffers)o.writeBuffer(e,0,i);for(let e of this.spinBuffers)o.writeBuffer(e,0,a);this.frame=0,this.ping=0,this.drawn=1}createPipelines(){let e=this.device,t=GPUShaderStage.COMPUTE,n=GPUShaderStage.VERTEX,i=GPUShaderStage.FRAGMENT;this.simLayout=e.createBindGroupLayout({entries:[{binding:0,visibility:t,buffer:{type:`uniform`}},{binding:1,visibility:t,buffer:{type:`read-only-storage`}},{binding:2,visibility:t,buffer:{type:`read-only-storage`}},{binding:3,visibility:t,buffer:{type:`read-only-storage`}},{binding:4,visibility:t,buffer:{type:`storage`}},{binding:5,visibility:t,buffer:{type:`storage`}}]}),this.fluidLayout=e.createBindGroupLayout({entries:[{binding:0,visibility:t,texture:{sampleType:`float`}},{binding:1,visibility:t,sampler:{type:`filtering`}}]}),this.renderLayout=e.createBindGroupLayout({entries:[{binding:0,visibility:n,buffer:{type:`uniform`}},{binding:1,visibility:n,buffer:{type:`read-only-storage`}},{binding:2,visibility:n,buffer:{type:`read-only-storage`}},{binding:3,visibility:n,buffer:{type:`read-only-storage`}},{binding:4,visibility:i,texture:{sampleType:`float`,viewDimension:`2d`}},{binding:5,visibility:i,sampler:{type:`filtering`}}]});let a=e.createShaderModule({code:r}),o=e.createShaderModule({code:u.replace(`__PALETTE__`,m(this.palette)).replace(`__COLS__`,this.atlas.cols.toFixed(1)).replace(`__ROWS__`,this.atlas.rows.toFixed(1))});this.simPipeline=e.createComputePipeline({layout:e.createPipelineLayout({bindGroupLayouts:[this.simLayout,this.fluidLayout]}),compute:{module:a,entryPoint:`main`}});let s={srcFactor:`one`,dstFactor:`one-minus-src-alpha`,operation:`add`};this.renderPipeline=e.createRenderPipeline({layout:e.createPipelineLayout({bindGroupLayouts:[this.renderLayout]}),vertex:{module:o,entryPoint:`vs`},fragment:{module:o,entryPoint:`fs`,targets:[{format:this.format,blend:{color:s,alpha:s}}]},primitive:{topology:`triangle-list`}})}createBindGroups(){let e=this.device;this.simGroups=[],this.renderGroups=[],this.fluidGroups=this.fluid.velocity.map(t=>e.createBindGroup({layout:this.fluidLayout,entries:[{binding:0,resource:this.fluid.views.get(t)},{binding:1,resource:this.fluid.sampler}]}));for(let t=0;t<2;t++){let n=t,r=1-t;this.simGroups.push(e.createBindGroup({layout:this.simLayout,entries:[{binding:0,resource:{buffer:this.uniformBuffer}},{binding:1,resource:{buffer:this.stateBuffers[n]}},{binding:2,resource:{buffer:this.spinBuffers[n]}},{binding:3,resource:{buffer:this.metaBuffer}},{binding:4,resource:{buffer:this.stateBuffers[r]}},{binding:5,resource:{buffer:this.spinBuffers[r]}}]})),this.renderGroups.push(e.createBindGroup({layout:this.renderLayout,entries:[{binding:0,resource:{buffer:this.uniformBuffer}},{binding:1,resource:{buffer:this.stateBuffers[r]}},{binding:2,resource:{buffer:this.spinBuffers[r]}},{binding:3,resource:{buffer:this.metaBuffer}},{binding:4,resource:this.atlasTexture.createView()},{binding:5,resource:this.atlasSampler}]}))}}step(e,{hands:t,pointer:n,params:r,fluid:i,steps:a=1}){if(this.dead||!this.ready)return;this.steps=a,this.fluidStep={dt:i?.dt??e,splat:i?.splat??null,active:!!i?.active};let o=this.uniformData;this.frame=(this.frame+1)%16777216,o[0]=this.size,o[1]=this.dpr,o[2]=e,o[3]=this.frame,o[4]=r.gravity,o[5]=r.wind,o[6]=r.sweep,o[7]=+!!r.sweepAll,o[8]=r.relax,o[9]=r.contactDamping,o[10]=r.contactFriction,o[11]=r.spin,o[12]=r.spinDrag,o[13]=r.drawScale,o[14]=r.jitter,o[15]=r.drag,o[16]=r.restitution,o[17]=r.friction,o[18]=r.maxSpeed,o[19]=r.rim,o[20]=r.handWidth,o[21]=r.handBand,o[22]=r.pointerRadius,o[23]=r.pointerPush,o[24]=r.pointerSweep,o[25]=+!!n.active,o[26]=this.count,o[27]=r.spinContactDrag,o[28]=r.maxSpin,o[29]=r.sleep,o[30]=r.fluidForce,o[31]=+!!this.fluidStep.active;let s=this.size*.5,c=+!!r.sweepAll;this.writeHand(32,t.hour,c,s),this.writeHand(36,t.minute,c,s),this.writeHand(40,t.second,1,s),o[44]=n.x,o[45]=n.y,o[46]=n.vx,o[47]=n.vy,o[48]=r.pushLimit,this.device.queue.writeBuffer(this.uniformBuffer,0,o)}writeHand(e,t,n,r){let i=this.uniformData;i[e]=t?.angle??0,i[e+1]=t?.omega??0,i[e+2]=(t?.length??0)*r,i[e+3]=n}render(){if(this.dead||!this.ready||!this.canvas.width)return;let e=this.device,t=e.createCommandEncoder(),n=t.beginComputePass(),r=this.fluidStep;r?.active&&this.fluid.encode(n,r.dt,r.splat,this.params);for(let e=0;e<(this.steps??1);e++)n.setPipeline(this.simPipeline),n.setBindGroup(0,this.simGroups[this.ping]),n.setBindGroup(1,this.fluidGroups[this.fluid.v]),n.dispatchWorkgroups(Math.ceil(this.count/d)),this.drawn=this.ping,this.ping=1-this.ping;n.end();let i=t.beginRenderPass({colorAttachments:[{view:this.context.getCurrentTexture().createView(),loadOp:`clear`,storeOp:`store`,clearValue:{r:0,g:0,b:0,a:0}}]});i.setPipeline(this.renderPipeline),i.setBindGroup(0,this.renderGroups[this.drawn??0]),i.draw(6,this.count),i.end(),e.queue.submit([t.finish()]),this.steps=0}setCount(e){!this.dead&&this.device&&(this.count=Math.max(1,Math.round(e)),this.createBuffers(),this.respawn(),this.simLayout&&this.createBindGroups())}resize(e,t){this.size=e,this.dpr=t,!this.dead&&this.ready&&(this.canvas.width=this.canvas.height=Math.max(1,Math.round(e*t)),this.context.configure({device:this.device,format:this.format,alphaMode:`premultiplied`}),this.respawn())}destroy(){this.ready=!1,this.dead=!0,this.releaseParticleBuffers(),this.uniformBuffer?.destroy(),this.uniformBuffer=null,this.atlasTexture?.destroy(),this.atlasTexture=null,this.fluid?.destroy(),this.fluid=null,this.context?.unconfigure(),this.device?.destroy(),this.device=null}};export{h as default};