import * as THREE from 'three';

/**
 * Shared Google-Earth-grade 3D Earth graphics pipeline for Three.js / react-globe.gl.
 *
 * Includes:
 *  - Procedural 3D pinpoint starfield (multi-magnitude, realistic stellar color temps, Milky Way band)
 *  - Dual-shell Rayleigh atmospheric scattering (inner aerial perspective haze + outer sunlit horizon halo)
 *  - Crisp 3K sun-lit cloud layer + subtle ground shadow deck with smooth altitude fade
 *  - Sun-tracking balanced lighting + ACES Filmic tone mapping
 */

// Camera-space sun direction matching Google Earth's signature upper-left illumination & right-side terminator
const CAMERA_SUN_DIR = new THREE.Vector3(-0.76, 0.26, 0.59).normalize();

export const EARTH_TEXTURES = {
    day: '/textures/earth-day-4k.webp',
    bump: '/textures/earth-bump-2k.webp',
    specular: '/textures/earth-specular-2k.webp',
    clouds: '/textures/earth-clouds-3k.webp',
    satelliteTileUrl: (x, y, z) =>
        `https://mt1.google.com/vt/lyrs=s&x=${x}&y=${y}&z=${z}&scale=2`,
};

/**
 * Creates a razor-sharp 3D spherical starfield with physically varied magnitudes,
 * subtle stellar color temperatures, and a faint Milky Way density band.
 */
export function createStarfield(starCount = 3800, radius = 2200) {
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);

    // Deterministic LCG PRNG so the sky is consistent and artifact-free
    let seed = 42197;
    const rand = () => {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return seed / 4294967296;
    };

    // Tilted galactic plane normal for subtle Milky Way concentration
    const galacticNormal = new THREE.Vector3(0.28, 0.88, -0.38).normalize();
    const tmpVec = new THREE.Vector3();

    const palette = [
        new THREE.Color(0xcad8ff), // Blue-white (B/A)
        new THREE.Color(0xe8eeff), // Crisp white (A/F)
        new THREE.Color(0xffffff), // Pure white (F)
        new THREE.Color(0xfff4e0), // Soft warm white (G)
        new THREE.Color(0xffdfba), // Subtle amber star (K)
    ];

    for (let i = 0; i < starCount; i++) {
        // 28% of stars bias slightly toward the galactic plane for authentic sky depth
        const isBandStar = i < starCount * 0.28;
        let x, y, z;

        if (isBandStar) {
            const theta = rand() * Math.PI * 2;
            const spread = (rand() + rand() + rand() - 1.5) * 0.26;
            const phi = Math.PI * 0.5 + spread;
            tmpVec.set(
                Math.sin(phi) * Math.cos(theta),
                Math.cos(phi),
                Math.sin(phi) * Math.sin(theta)
            );
            // Tilt galactic plane
            tmpVec.applyAxisAngle(new THREE.Vector3(1, 0, 0.4).normalize(), 0.95);
            x = tmpVec.x;
            y = tmpVec.y;
            z = tmpVec.z;
        } else {
            const u = rand();
            const v = rand();
            const theta = 2 * Math.PI * u;
            const phi = Math.acos(2 * v - 1);
            x = Math.sin(phi) * Math.cos(theta);
            y = Math.cos(phi);
            z = Math.sin(phi) * Math.sin(theta);
        }

        const r = radius * (0.92 + rand() * 0.16);
        positions[i * 3] = x * r;
        positions[i * 3 + 1] = y * r;
        positions[i * 3 + 2] = z * r;

        // Power-law brightness distribution: many faint delicate stars, few bright crisp ones
        const mag = Math.pow(rand(), 3.4);
        const brightness = isBandStar
            ? 0.22 + mag * 0.58
            : 0.26 + mag * 0.74;

        const baseColor = palette[Math.floor(rand() * palette.length)];
        colors[i * 3] = baseColor.r * brightness;
        colors[i * 3 + 1] = baseColor.g * brightness;
        colors[i * 3 + 2] = baseColor.b * brightness;

        // Pinpoint sizes: 1.0px to 3.1px (never giant blurry smudges)
        sizes[i] = 1.05 + Math.pow(rand(), 4.2) * 2.15;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.ShaderMaterial({
        uniforms: {
            uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
        },
        vertexShader: `
            attribute float aSize;
            varying vec3 vColor;
            uniform float uPixelRatio;
            void main() {
                vColor = color;
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_PointSize = aSize * uPixelRatio;
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            varying vec3 vColor;
            void main() {
                float d = length(gl_PointCoord - vec2(0.5));
                if (d > 0.5) discard;
                float core = smoothstep(0.5, 0.08, d);
                float alpha = pow(core, 1.45);
                gl_FragColor = vec4(vColor, alpha);
            }
        `,
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geometry, material);
    points.name = 'oxypaceStarfield';
    points.frustumCulled = false;
    return points;
}

/**
 * Inner Rayleigh Surface Haze (FrontSide shell right above Earth's surface).
 * Gives Earth the authentic pale-blue aerial perspective haze across oceans/continents
 * and luminous pale-blue limb scattering, naturally shadowed at the night terminator.
 */
export function createInnerAtmosphere(radius, sunDirUniform) {
    const geometry = new THREE.SphereGeometry(radius * 1.0032, 72, 72);
    const material = new THREE.ShaderMaterial({
        uniforms: {
            uSunDir: sunDirUniform,
            uHazeStrength: { value: 1.0 },
        },
        vertexShader: `
            varying vec3 vWorldNormal;
            varying vec3 vWorldPos;
            void main() {
                vec4 worldPos = modelMatrix * vec4(position, 1.0);
                vWorldPos = worldPos.xyz;
                vWorldNormal = normalize(mat3(modelMatrix) * normal);
                gl_Position = projectionMatrix * viewMatrix * worldPos;
            }
        `,
        fragmentShader: `
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
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.NormalBlending,
        side: THREE.FrontSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'innerAtmosphere';
    mesh.renderOrder = 3;
    return mesh;
}

/**
 * Outer Atmospheric Rim Halo (BackSide shell extending slightly beyond Earth's radius).
 * Produces a tight, crisp pale-blue/white atmospheric glow around the sunlit horizon
 * that cleanly vanishes into deep space on the night side.
 */
export function createOuterAtmosphere(radius, sunDirUniform) {
    const geometry = new THREE.SphereGeometry(radius * 1.088, 72, 72);
    const material = new THREE.ShaderMaterial({
        uniforms: {
            uSunDir: sunDirUniform,
            uHaloStrength: { value: 1.0 },
        },
        vertexShader: `
            varying vec3 vWorldNormal;
            varying vec3 vWorldPos;
            void main() {
                vec4 worldPos = modelMatrix * vec4(position, 1.0);
                vWorldPos = worldPos.xyz;
                vWorldNormal = normalize(mat3(modelMatrix) * normal);
                gl_Position = projectionMatrix * viewMatrix * worldPos;
            }
        `,
        fragmentShader: `
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
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'outerAtmosphere';
    mesh.renderOrder = 4;
    return mesh;
}

/**
 * Crisp 3K Sun-Lit Cloud Deck + Subtle Ground Shadow Deck.
 * Uses NormalBlending with sun-terminator lighting so clouds look crisp, natural,
 * and volumetric instead of blown-out additive white smudges.
 */
export function createCloudLayers(radius, sunDirUniform, cloudTexture) {
    cloudTexture.wrapS = THREE.RepeatWrapping;
    cloudTexture.wrapT = THREE.ClampToEdgeWrapping;
    cloudTexture.anisotropy = 8;

    // 1. Subtle ground cloud shadow (offset slightly below clouds)
    const shadowGeo = new THREE.SphereGeometry(radius * 1.0018, 64, 64);
    const shadowMat = new THREE.ShaderMaterial({
        uniforms: {
            uCloudMap: { value: cloudTexture },
            uSunDir: sunDirUniform,
            uOpacity: { value: 0.24 },
        },
        vertexShader: `
            varying vec2 vUv;
            varying vec3 vWorldNormal;
            void main() {
                vUv = uv;
                vWorldNormal = normalize(mat3(modelMatrix) * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
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
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.NormalBlending,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.name = 'cloudShadowLayer';
    shadowMesh.renderOrder = 1;

    // 2. Main crisp 3K cloud deck
    const cloudGeo = new THREE.SphereGeometry(radius * 1.0068, 72, 72);
    const cloudMat = new THREE.ShaderMaterial({
        uniforms: {
            uCloudMap: { value: cloudTexture },
            uSunDir: sunDirUniform,
            uOpacity: { value: 0.92 },
        },
        vertexShader: `
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
        `,
        fragmentShader: `
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

                vec3 dayCloudColor = vec3(0.95, 0.97, 1.00) + vec3(relief * 0.45);
                vec3 twilightCloudColor = vec3(0.76, 0.80, 0.90);
                vec3 nightCloudColor = vec3(0.03, 0.04, 0.07);

                vec3 col = mix(nightCloudColor, dayCloudColor, sunLight);
                col = mix(col, twilightCloudColor, twilight * 0.25);

                // Pale atmospheric scattering tint on clouds near Earth's limb
                float limbTint = pow(1.0 - NdotV, 2.4) * sunLight * 0.28;
                col = mix(col, vec3(0.68, 0.84, 1.0), limbTint);

                // Sharpen wisps while keeping delicate feathering
                float alpha = smoothstep(0.06, 0.88, density) * uOpacity;
                gl_FragColor = vec4(col, alpha);
            }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.NormalBlending,
    });
    const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
    cloudMesh.name = 'cloudLayer';
    cloudMesh.renderOrder = 2;

    return { cloudMesh, shadowMesh };
}

/**
 * Installs the complete Google-Earth-grade scene enhancements onto a react-globe.gl instance.
 * Returns an `update(dtSeconds, altitude)` tick function and a `dispose()` cleanup function.
 */
export function enhanceEarthScene(globeInstance, {
    starCount = 3800,
    enableClouds = true,
    enableStars = true,
    cloudDriftSpeed = 0.0022,
} = {}) {
    if (!globeInstance) return { update: () => {}, dispose: () => {} };

    const scene = globeInstance.scene();
    const renderer = globeInstance.renderer?.();
    const radius = globeInstance.getGlobeRadius ? globeInstance.getGlobeRadius() : 100;
    const textureLoader = new THREE.TextureLoader();

    // 1. Renderer color grading & crisp HiDPI cap (<= 2x for high FPS on 4K/mobile screens)
    if (renderer) {
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.04;
        if ('outputColorSpace' in renderer && THREE.SRGBColorSpace) {
            renderer.outputColorSpace = THREE.SRGBColorSpace;
        }
    }

    // 2. Tune base globe material with ocean-only specular sheen + matte continents
    const specularTex = textureLoader.load(EARTH_TEXTURES.specular);
    const applySurfaceMaterial = () => {
        scene.traverse((child) => {
            if (
                child.isMesh &&
                child.material &&
                !['cloudLayer', 'cloudShadowLayer', 'innerAtmosphere', 'outerAtmosphere'].includes(child.name)
            ) {
                if (child.material.emissive) child.material.emissive.setHex(0x000000);
                if (child.material.emissiveIntensity !== undefined) child.material.emissiveIntensity = 0;
                if (child.material.bumpScale !== undefined) child.material.bumpScale = 1.6;
                if ('specularMap' in child.material) {
                    child.material.specularMap = specularTex;
                    child.material.specular = new THREE.Color(0x3a5578);
                    child.material.shininess = 18;
                    child.material.needsUpdate = true;
                }
            }
        });
    };
    applySurfaceMaterial();

    // 3. Balanced Sunlight + Deep Space Terminator Shadow
    const sunDirUniform = { value: new THREE.Vector3(-0.76, 0.26, 0.59).normalize() };

    let realSun = scene.getObjectByName('oxypaceSun');
    if (!realSun) {
        realSun = new THREE.DirectionalLight(0xfff9f0, 2.55);
        realSun.name = 'oxypaceSun';
        scene.add(realSun);
    }

    let spaceAmbient = scene.getObjectByName('oxypaceSpaceAmbient');
    if (!spaceAmbient) {
        spaceAmbient = new THREE.AmbientLight(0x6e8cb8, 0.16);
        spaceAmbient.name = 'oxypaceSpaceAmbient';
        scene.add(spaceAmbient);
    }

    const createdObjects = [];
    const createdTextures = [specularTex];

    // 4. Procedural 3D Pinpoint Starfield
    let starfield = null;
    if (enableStars && !scene.getObjectByName('oxypaceStarfield')) {
        starfield = createStarfield(starCount, 2200);
        scene.add(starfield);
        createdObjects.push(starfield);
    }

    // 5. Dual-Shell Rayleigh Atmosphere
    let innerAtmos = scene.getObjectByName('innerAtmosphere');
    if (!innerAtmos) {
        innerAtmos = createInnerAtmosphere(radius, sunDirUniform);
        scene.add(innerAtmos);
        createdObjects.push(innerAtmos);
    }

    let outerAtmos = scene.getObjectByName('outerAtmosphere');
    if (!outerAtmos) {
        outerAtmos = createOuterAtmosphere(radius, sunDirUniform);
        scene.add(outerAtmos);
        createdObjects.push(outerAtmos);
    }

    // 6. Crisp 3K Sun-Lit Cloud Deck + Soft Ground Shadow
    let cloudMesh = null;
    let shadowMesh = null;
    if (enableClouds && !scene.getObjectByName('cloudLayer')) {
        const cloudTex = textureLoader.load(EARTH_TEXTURES.clouds);
        createdTextures.push(cloudTex);
        const layers = createCloudLayers(radius, sunDirUniform, cloudTex);
        cloudMesh = layers.cloudMesh;
        shadowMesh = layers.shadowMesh;
        scene.add(shadowMesh);
        scene.add(cloudMesh);
        createdObjects.push(shadowMesh, cloudMesh);
    }

    const sunVec = new THREE.Vector3();

    const update = (dtSeconds = 0.016, altitude = 2.2) => {
        const cam = globeInstance.camera?.();
        if (cam) {
            // Mute default library camera-attached headlights so only our real sun illuminates Earth
            for (let i = 0; i < cam.children.length; i++) {
                const ch = cam.children[i];
                if (ch.isLight && ch.intensity !== 0) ch.intensity = 0;
            }

            // Keep sunlight anchored to camera's upper-left (classic Google Earth studio framing)
            sunVec.copy(CAMERA_SUN_DIR).applyQuaternion(cam.quaternion).normalize();
            sunDirUniform.value.copy(sunVec);
            realSun.position.copy(sunVec).multiplyScalar(600);
        }

        // Mute any extra default lights injected by three-globe
        for (let i = 0; i < scene.children.length; i++) {
            const ch = scene.children[i];
            if (ch.isLight && ch.name !== 'oxypaceSun' && ch.name !== 'oxypaceSpaceAmbient' && ch.intensity !== 0) {
                ch.intensity = 0;
            }
        }

        // Smooth altitude-based cloud & aerial haze fade (crystal clear satellite zoom when close to ground)
        const cloudFade = THREE.MathUtils.clamp((altitude - 0.12) / 0.55, 0.0, 1.0);
        if (cloudMesh) {
            cloudMesh.rotation.y += cloudDriftSpeed * dtSeconds;
            cloudMesh.material.uniforms.uOpacity.value = 0.90 * cloudFade;
            cloudMesh.visible = cloudFade > 0.01;
        }
        if (shadowMesh) {
            shadowMesh.rotation.y = cloudMesh ? cloudMesh.rotation.y : shadowMesh.rotation.y + cloudDriftSpeed * dtSeconds;
            shadowMesh.material.uniforms.uOpacity.value = 0.22 * cloudFade;
            shadowMesh.visible = cloudFade > 0.01;
        }

        const hazeFade = THREE.MathUtils.clamp((altitude - 0.04) / 0.38, 0.18, 1.0);
        if (innerAtmos) {
            innerAtmos.material.uniforms.uHazeStrength.value = hazeFade;
        }
        if (outerAtmos) {
            outerAtmos.material.uniforms.uHaloStrength.value = THREE.MathUtils.clamp(altitude / 0.45, 0.35, 1.0);
        }
    };

    const dispose = () => {
        createdObjects.forEach((obj) => {
            scene.remove(obj);
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
                else obj.material.dispose();
            }
        });
        createdTextures.forEach((tex) => tex.dispose());
    };

    return { update, dispose };
}
