import{T as j,A as $,S as U,V as W,D as q,a as Q,C,B as X,b as V,c as A,d as T,P as J,e as O,F as K,N as R,M as F,f as Y,R as Z,g as I,h as E}from"./globe-visualization-CLuDGC__.js";const ee=new W(-.76,.26,.59).normalize(),k={day:"/textures/earth-day-4k.webp",bump:"/textures/earth-bump-2k.webp",specular:"/textures/earth-specular-2k.webp",clouds:"/textures/earth-clouds-3k.webp",satelliteTileUrl:(t,s,r)=>`https://mt1.google.com/vt/lyrs=s&x=${t}&y=${s}&z=${r}&scale=2`};function te(t=3800,s=2200){const r=new Float32Array(t*3),c=new Float32Array(t*3),n=new Float32Array(t);let o=42197;const a=()=>(o=o*1664525+1013904223>>>0,o/4294967296);new W(.28,.88,-.38).normalize();const u=new W,p=[new C(13293823),new C(15265535),new C(16777215),new C(16774368),new C(16768954)];for(let i=0;i<t;i++){const S=i<t*.28;let v,P,M;if(S){const y=a()*Math.PI*2,L=(a()+a()+a()-1.5)*.26,N=Math.PI*.5+L;u.set(Math.sin(N)*Math.cos(y),Math.cos(N),Math.sin(N)*Math.sin(y)),u.applyAxisAngle(new W(1,0,.4).normalize(),.95),v=u.x,P=u.y,M=u.z}else{const y=a(),L=a(),N=2*Math.PI*y,z=Math.acos(2*L-1);v=Math.sin(z)*Math.cos(N),P=Math.cos(z),M=Math.sin(z)*Math.sin(N)}const m=s*(.92+a()*.16);r[i*3]=v*m,r[i*3+1]=P*m,r[i*3+2]=M*m;const h=Math.pow(a(),3.4),l=S?.22+h*.58:.26+h*.74,d=p[Math.floor(a()*p.length)];c[i*3]=d.r*l,c[i*3+1]=d.g*l,c[i*3+2]=d.b*l,n[i]=1.05+Math.pow(a(),4.2)*2.15}const x=new X;x.setAttribute("position",new V(r,3)),x.setAttribute("color",new V(c,3)),x.setAttribute("aSize",new V(n,1));const _=new A({uniforms:{uPixelRatio:{value:Math.min(window.devicePixelRatio||1,2)}},vertexShader:`
            attribute float aSize;
            varying vec3 vColor;
            uniform float uPixelRatio;
            void main() {
                vColor = color;
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_PointSize = aSize * uPixelRatio;
                gl_Position = projectionMatrix * mvPosition;
            }
        `,fragmentShader:`
            varying vec3 vColor;
            void main() {
                float d = length(gl_PointCoord - vec2(0.5));
                if (d > 0.5) discard;
                float core = smoothstep(0.5, 0.08, d);
                float alpha = pow(core, 1.45);
                gl_FragColor = vec4(vColor, alpha);
            }
        `,vertexColors:!0,transparent:!0,depthWrite:!1,blending:T}),g=new J(x,_);return g.name="oxypaceStarfield",g.frustumCulled=!1,g}function oe(t,s){const r=new O(t*1.0032,72,72),c=new A({uniforms:{uSunDir:s,uHazeStrength:{value:1}},vertexShader:`
            varying vec3 vWorldNormal;
            varying vec3 vWorldPos;
            void main() {
                vec4 worldPos = modelMatrix * vec4(position, 1.0);
                vWorldPos = worldPos.xyz;
                vWorldNormal = normalize(mat3(modelMatrix) * normal);
                gl_Position = projectionMatrix * viewMatrix * worldPos;
            }
        `,fragmentShader:`
            uniform vec3 uSunDir;
            uniform float uHazeStrength;
            varying vec3 vWorldNormal;
            varying vec3 vWorldPos;

            void main() {
                vec3 N = normalize(vWorldNormal);
                vec3 V = normalize(cameraPosition - vWorldPos);
                vec3 L = normalize(uSunDir);

                float NdotV = clamp(dot(N, V), 0.0, 1.0);
                float NdotL = dot(N, L);

                // Smooth day-night illumination mask
                float dayMask = smoothstep(-0.24, 0.36, NdotL);
                // Delicate twilight band right along the terminator
                float twilightBand = exp(-pow((NdotL + 0.04) * 5.2, 2.0)) * 0.22;

                // Fresnel limb scattering + subtle center aerial perspective veil
                float fresnel = pow(1.0 - NdotV, 2.65);
                float broadLimb = pow(1.0 - NdotV, 1.35);

                // Authentic Google Earth pale sky-blue scattering palette
                vec3 nadirHaze = vec3(0.42, 0.66, 0.98);
                vec3 limbBlue  = vec3(0.56, 0.78, 1.00);
                vec3 horizonWhiteBlue = vec3(0.76, 0.90, 1.00);
                vec3 twilightTint = vec3(0.45, 0.56, 0.82);

                vec3 col = mix(nadirHaze, limbBlue, broadLimb);
                col = mix(col, horizonWhiteBlue, pow(1.0 - NdotV, 4.5));
                col = mix(col, twilightTint, twilightBand);

                // Subtle center atmospheric lift (0.11) + rich pale-blue limb haze (0.68)
                float alpha = (0.105 + broadLimb * 0.16 + fresnel * 0.62) * dayMask * uHazeStrength;
                alpha = clamp(alpha, 0.0, 0.82);

                gl_FragColor = vec4(col, alpha);
            }
        `,transparent:!0,depthWrite:!1,blending:R,side:K}),n=new F(r,c);return n.name="innerAtmosphere",n.renderOrder=3,n}function ae(t,s){const r=new O(t*1.088,72,72),c=new A({uniforms:{uSunDir:s,uHaloStrength:{value:1}},vertexShader:`
            varying vec3 vWorldNormal;
            varying vec3 vWorldPos;
            void main() {
                vec4 worldPos = modelMatrix * vec4(position, 1.0);
                vWorldPos = worldPos.xyz;
                vWorldNormal = normalize(mat3(modelMatrix) * normal);
                gl_Position = projectionMatrix * viewMatrix * worldPos;
            }
        `,fragmentShader:`
            uniform vec3 uSunDir;
            uniform float uHaloStrength;
            varying vec3 vWorldNormal;
            varying vec3 vWorldPos;

            void main() {
                vec3 N = normalize(vWorldNormal);
                vec3 V = normalize(cameraPosition - vWorldPos);
                vec3 L = normalize(uSunDir);

                // On a BackSide sphere, dot(N, V) is negative; magnitude grows toward the silhouette edge
                // Near Earth's limb edge, -dot(N, V) is around 0.35..0.58 and drops to 0.0 at outer boundary
                float rimFactor = clamp(-dot(N, V), 0.0, 1.0);

                // Tight exponential falloff from Earth's surface outward into space
                float glow = pow(rimFactor, 4.2) * 1.65;

                // Fade glow cleanly on the night side of Earth
                float sunFacing = smoothstep(-0.26, 0.42, dot(N, L));

                // Pale sky-blue fading into icy white-blue right at the planet's horizon
                vec3 outerSpaceBlue = vec3(0.30, 0.58, 0.98);
                vec3 innerHorizonBlue = vec3(0.66, 0.84, 1.00);
                vec3 color = mix(outerSpaceBlue, innerHorizonBlue, smoothstep(0.25, 0.65, rimFactor));

                float intensity = glow * sunFacing * uHaloStrength;
                gl_FragColor = vec4(color * intensity, clamp(intensity, 0.0, 1.0));
            }
        `,transparent:!0,depthWrite:!1,blending:T,side:Y}),n=new F(r,c);return n.name="outerAtmosphere",n.renderOrder=4,n}function re(t,s,r){r.wrapS=Z,r.wrapT=I,r.anisotropy=8;const c=new O(t*1.0018,64,64),n=new A({uniforms:{uCloudMap:{value:r},uSunDir:s,uOpacity:{value:.24}},vertexShader:`
            varying vec2 vUv;
            varying vec3 vWorldNormal;
            void main() {
                vUv = uv;
                vWorldNormal = normalize(mat3(modelMatrix) * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,fragmentShader:`
            uniform sampler2D uCloudMap;
            uniform vec3 uSunDir;
            uniform float uOpacity;
            varying vec2 vUv;
            varying vec3 vWorldNormal;

            void main() {
                // Slight offset opposite the upper-left sun to project soft shadows onto land/ocean
                float c = texture2D(uCloudMap, vUv + vec2(-0.0016, 0.0012)).r;
                float dayMask = smoothstep(-0.05, 0.35, dot(normalize(vWorldNormal), normalize(uSunDir)));
                float alpha = smoothstep(0.18, 0.85, c) * uOpacity * dayMask;
                gl_FragColor = vec4(0.01, 0.02, 0.05, alpha);
            }
        `,transparent:!0,depthWrite:!1,blending:R}),o=new F(c,n);o.name="cloudShadowLayer",o.renderOrder=1;const a=new O(t*1.0068,72,72),u=new A({uniforms:{uCloudMap:{value:r},uSunDir:s,uOpacity:{value:.92}},vertexShader:`
            varying vec2 vUv;
            varying vec3 vWorldNormal;
            varying vec3 vWorldPos;
            void main() {
                vUv = uv;
                vec4 worldPos = modelMatrix * vec4(position, 1.0);
                vWorldPos = worldPos.xyz;
                vWorldNormal = normalize(mat3(modelMatrix) * normal);
                gl_Position = projectionMatrix * viewMatrix * worldPos;
            }
        `,fragmentShader:`
            uniform sampler2D uCloudMap;
            uniform vec3 uSunDir;
            uniform float uOpacity;
            varying vec2 vUv;
            varying vec3 vWorldNormal;
            varying vec3 vWorldPos;

            void main() {
                float density = texture2D(uCloudMap, vUv).r;
                if (density < 0.04) discard;

                // Subtle 3D cloud-top relief via directional finite difference
                float densitySun = texture2D(uCloudMap, vUv + vec2(0.0009, -0.0006)).r;
                float relief = clamp((density - densitySun) * 1.8, -0.12, 0.16);

                vec3 N = normalize(vWorldNormal);
                vec3 V = normalize(cameraPosition - vWorldPos);
                vec3 L = normalize(uSunDir);

                float NdotL = dot(N, L);
                float NdotV = clamp(dot(N, V), 0.0, 1.0);

                // Realistic day-to-night cloud illumination with crisp soft terminator
                float sunLight = smoothstep(-0.22, 0.45, NdotL);
                float twilight = exp(-pow((NdotL + 0.02) * 5.0, 2.0));

                // Soft, natural atmospheric cloud tones (never blinding pure white)
                vec3 dayCloudColor = vec3(0.82, 0.86, 0.92) + vec3(relief * 0.20);
                vec3 twilightCloudColor = vec3(0.66, 0.72, 0.82);
                vec3 nightCloudColor = vec3(0.025, 0.035, 0.06);

                vec3 col = mix(nightCloudColor, dayCloudColor, sunLight);
                col = mix(col, twilightCloudColor, twilight * 0.28);

                // Pale atmospheric scattering tint on clouds near Earth's limb
                float limbTint = pow(1.0 - NdotV, 2.3) * sunLight * 0.34;
                col = mix(col, vec3(0.62, 0.80, 0.98), limbTint);

                // Delicate feathery alpha so continents & coastlines breathe naturally underneath
                float alpha = smoothstep(0.09, 0.95, density) * uOpacity;
                gl_FragColor = vec4(col, alpha);
            }
        `,transparent:!0,depthWrite:!1,blending:R}),p=new F(a,u);return p.name="cloudLayer",p.renderOrder=2,{cloudMesh:p,shadowMesh:o}}function ne(t,{starCount:s=3800,enableClouds:r=!0,enableStars:c=!0,cloudDriftSpeed:n=.0022}={}){var z;if(!t)return{update:()=>{},dispose:()=>{}};const o=t.scene(),a=(z=t.renderer)==null?void 0:z.call(t),u=t.getGlobeRadius?t.getGlobeRadius():100,p=new j;a&&(a.setPixelRatio(Math.min(window.devicePixelRatio||1,2)),a.toneMapping=$,a.toneMappingExposure=1.04,"outputColorSpace"in a&&U&&(a.outputColorSpace=U));const x=p.load(k.specular);(()=>{o.traverse(e=>{e.isMesh&&e.material&&!["cloudLayer","cloudShadowLayer","innerAtmosphere","outerAtmosphere"].includes(e.name)&&(e.material.emissive&&e.material.emissive.setHex(0),e.material.emissiveIntensity!==void 0&&(e.material.emissiveIntensity=0),e.material.bumpScale!==void 0&&(e.material.bumpScale=1.6),"specularMap"in e.material&&(e.material.specularMap=x,e.material.specular=new C(3822968),e.material.shininess=18,e.material.needsUpdate=!0))})})();const g={value:new W(-.76,.26,.59).normalize()};let i=o.getObjectByName("oxypaceSun");i||(i=new q(16775664,2.55),i.name="oxypaceSun",o.add(i));let S=o.getObjectByName("oxypaceSpaceAmbient");S||(S=new Q(7244984,.16),S.name="oxypaceSpaceAmbient",o.add(S));const v=[],P=[x];let M=null;c&&!o.getObjectByName("oxypaceStarfield")&&(M=te(s,2200),o.add(M),v.push(M));let m=o.getObjectByName("innerAtmosphere");m||(m=oe(u,g),o.add(m),v.push(m));let h=o.getObjectByName("outerAtmosphere");h||(h=ae(u,g),o.add(h),v.push(h));let l=null,d=null;if(r&&!o.getObjectByName("cloudLayer")){const e=p.load(k.clouds);P.push(e);const w=re(u,g,e);l=w.cloudMesh,d=w.shadowMesh,o.add(d),o.add(l),v.push(d,l)}const y=new W;return{update:(e=.016,w=2.2)=>{var H;const B=(H=t.camera)==null?void 0:H.call(t);if(B){for(let b=0;b<B.children.length;b++){const f=B.children[b];f.isLight&&f.intensity!==0&&(f.intensity=0)}y.copy(ee).applyQuaternion(B.quaternion).normalize(),g.value.copy(y),i.position.copy(y).multiplyScalar(600)}for(let b=0;b<o.children.length;b++){const f=o.children[b];f.isLight&&f.name!=="oxypaceSun"&&f.name!=="oxypaceSpaceAmbient"&&f.intensity!==0&&(f.intensity=0)}const D=E.clamp((w-.12)/.55,0,1);l&&(l.rotation.y+=n*e,l.material.uniforms.uOpacity.value=.64*D,l.visible=D>.01),d&&(d.rotation.y=l?l.rotation.y:d.rotation.y+n*e,d.material.uniforms.uOpacity.value=.14*D,d.visible=D>.01);const G=E.clamp((w-.04)/.38,.18,1);m&&(m.material.uniforms.uHazeStrength.value=G),h&&(h.material.uniforms.uHaloStrength.value=E.clamp(w/.45,.35,1))},dispose:()=>{v.forEach(e=>{o.remove(e),e.geometry&&e.geometry.dispose(),e.material&&(Array.isArray(e.material)?e.material.forEach(w=>w.dispose()):e.material.dispose())}),P.forEach(e=>e.dispose())}}}export{k as E,ne as e};
