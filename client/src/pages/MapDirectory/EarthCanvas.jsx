import React, { useRef, useEffect, forwardRef, useImperativeHandle, useState, useCallback } from 'react';
import Globe from 'react-globe.gl';
import * as THREE from 'three';

const EarthCanvas = forwardRef(({ portals = [], onPortalClick, activePortalSearch, onGlobeClick }, ref) => {
    const globeRef = useRef();
    const containerRef = useRef();
    const targetAltitude = useRef(2.5);
    const zoomAnchor = useRef(null); // Mouse'un kilitlendiği exact lat/lng
    const mousePos = useRef({ x: 0, y: 0 }); // Mouse'un ekrandaki çivisi
    const isAnimating = useRef(false);
    const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
    const [showLabels, setShowLabels] = useState(false);
    const lastLabelState = useRef(false);

    const animateZoom = useCallback(() => {
        if (!globeRef.current || !isAnimating.current) return;
        const pov = globeRef.current.pointOfView();
        const diffAlt = targetAltitude.current - pov.altitude;

        const shouldShowLabels = pov.altitude <= 0.8;
        if (shouldShowLabels !== lastLabelState.current) {
            lastLabelState.current = shouldShowLabels;
            setShowLabels(shouldShowLabels);
        }

        // Animasyonu durdurma şartı
        if (Math.abs(diffAlt) < 0.0001) {
            isAnimating.current = false;
            zoomAnchor.current = null;
            return;
        }

        // Frame bazında pürüzsüz altitude değişimi (%10 adım)
        const nextAltitude = pov.altitude + diffAlt * 0.1;

        let nextLat = pov.lat;
        let nextLng = pov.lng;

        // ZOOM TO MOUSE (Kesin Nokta Takibi - Akıcı Animasyonlu)
        if (zoomAnchor.current && containerRef.current && typeof globeRef.current.toGlobeCoords === 'function') {
            const curUnderMouse = globeRef.current.toGlobeCoords(mousePos.current.x, mousePos.current.y);

            if (curUnderMouse) {
                // Kamera nereye gitmeli ki imlecin altındaki nokta çivili kalsın?
                // Hata buradaydı: Çapa noktasından ekran noktasını çıkarıp ekliyorduk, bu ters tepebilir.
                let diffLat = zoomAnchor.current.lat - curUnderMouse.lat;
                let diffLng = zoomAnchor.current.lng - curUnderMouse.lng;

                // Boylam farkını en kısa yoldan dönmesi için normalize et (-180 ile 180 arası)
                diffLng = ((diffLng + 180) % 360 + 360) % 360 - 180;

                const dampingFactor = 0.15;
                nextLat += diffLat * dampingFactor;
                nextLng += diffLng * dampingFactor;

            }
        }

        // Boylam dikiş noktasını ve Kutup sınırlarını kesin olarak koru
        nextLat = Math.max(-90, Math.min(90, nextLat));
        nextLng = ((nextLng + 180) % 360 + 360) % 360 - 180;

        // Sıfır saniye (anlık) frame çizimi ile kamerayı mutlak noktaya taşıyoruz
        // Yumuşama (Lerp) işlemi animasyon döngüsünün matematiginin içinde (yukarıda) olduğu için burası sıfır saniye kalmalıdır.
        globeRef.current.pointOfView({ lat: nextLat, lng: nextLng, altitude: nextAltitude }, 0);
        requestAnimationFrame(animateZoom);
    }, []);

    useImperativeHandle(ref, () => ({
        zoomIn: () => {
            targetAltitude.current = Math.max(0.002, targetAltitude.current * 0.5);
            zoomAnchor.current = null;
            if (!isAnimating.current) { isAnimating.current = true; requestAnimationFrame(animateZoom); }
        },
        zoomOut: () => {
            targetAltitude.current = Math.min(4, targetAltitude.current * 2.0);
            zoomAnchor.current = null;
            if (!isAnimating.current) { isAnimating.current = true; requestAnimationFrame(animateZoom); }
        },
        resetView: () => {
            targetAltitude.current = 2.5;
            isAnimating.current = false;
            if (globeRef.current) globeRef.current.pointOfView({ lat: 20, lng: 30, altitude: 2.5 }, 1500);
        },
        flyTo: (lat, lng, alt) => {
            const flyAlt = alt || 0.012;
            targetAltitude.current = flyAlt;
            isAnimating.current = false;
            if (globeRef.current) globeRef.current.pointOfView({ lat, lng, altitude: flyAlt }, 2500);
        }
    }));

    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                setDimensions({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight });
            }
        };
        window.addEventListener('resize', handleResize);
        setTimeout(handleResize, 50);

        if (globeRef.current) {
            const controls = globeRef.current.controls();
            controls.autoRotate = true;
            controls.autoRotateSpeed = 0.3;
            controls.rotateSpeed = 0.4;
            controls.minDistance = 100.2;
            controls.enableZoom = false;

            globeRef.current.pointOfView({ lat: 20, lng: 30, altitude: 2.5 }, 0);

            // Eski ışıklandırma iptal, ışığı onGlobeReady içinde halledeceğiz
        }
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleWheel = useCallback((e) => {
        e.preventDefault();
        if (!globeRef.current) return;

        globeRef.current.controls().autoRotate = false;

        const isZoomingIn = e.deltaY < 0;
        const zoomFactor = isZoomingIn ? 0.85 : 1.15;
        targetAltitude.current = Math.max(0.002, Math.min(4, targetAltitude.current * zoomFactor));

        // ZOOM TO MOUSE - Yakınlaşma ve Uzaklaşmada fareye kilitlen
        if (containerRef.current && typeof globeRef.current.toGlobeCoords === 'function') {
            const rect = containerRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Farenin önceki pozisyonundan ne kadar hareket ettiğini bul
            const distMoved = Math.hypot(x - mousePos.current.x, y - mousePos.current.y);

            // Eğer fare 2 pikselden fazla hareket ettiyse VEYA şu an bir animasyon/çapa yoksa çapayı güncelle
            // (Bu sayede animasyon sırasında anchor'ı kaybetmeyiz ve kaymayı önleriz)
            if (distMoved > 2 || !isAnimating.current || !zoomAnchor.current) {
                const targetCoords = globeRef.current.toGlobeCoords(x, y);
                if (targetCoords) {
                    zoomAnchor.current = targetCoords;
                    mousePos.current = { x, y };
                } else {
                    zoomAnchor.current = null; // Fare uzay boşluğundaysa iptal
                }
            }
        }

        if (!isAnimating.current) {
            isAnimating.current = true;
            requestAnimationFrame(animateZoom);
        }
    }, [animateZoom]);

    useEffect(() => {
        const container = containerRef.current;
        if (container) {
            container.addEventListener('wheel', handleWheel, { passive: false });
            return () => container.removeEventListener('wheel', handleWheel);
        }
    }, [handleWheel]);

    const tileUrl = (x, y, z) => `https://mt1.google.com/vt/lyrs=s&x=${x}&y=${y}&z=${z}&scale=2`;

    return (
        <div ref={containerRef} className="w-full h-full" onPointerDown={() => {
            if (globeRef.current) globeRef.current.controls().autoRotate = false;
            zoomAnchor.current = null; // Kullanıcı serbestçe sürüklesin diye çapayı çözeriz
        }}>
            <Globe
                ref={globeRef}
                onGlobeReady={() => {
                    if (!globeRef.current) return;

                    const scene = globeRef.current.scene();
                    // getGlobeRadius bazen tanımsız olabilir, varsayılan 100 ayarladık
                    const radius = globeRef.current.getGlobeRadius ? globeRef.current.getGlobeRadius() : 100;
                    const textureLoader = new THREE.TextureLoader();

                    // HATA VEREN KISIM ÇÖZÜLDÜ: Güvenli Material Taraması
                    scene.traverse((child) => {
                        if (child.isMesh && child.material && !['cloudLayer', 'volumetricAtmosphere'].includes(child.name)) {
                            child.material.shininess = 10;
                        }
                    });

                    // 1. Kütüphanenin kendi materyalindeki "karanlıkta parlama (emissive)" özelliğini sıfırla ki gece tam karanlık olsun
                    const baseGlobe = scene.getObjectByName('globe');
                    if (baseGlobe && baseGlobe.material) {
                        baseGlobe.material.emissiveIntensity = 0;
                        if (baseGlobe.material.emissive) baseGlobe.material.emissive.setHex(0x000000);
                        if (baseGlobe.material.shininess !== undefined) baseGlobe.material.shininess = 5;
                    }

                    // 2. SABİT GÜNEŞ: Dünyanın aydınlık ve karanlık yüzünü (Terminator) belirler
                    if (!scene.getObjectByName('realSun')) {
                        const realSun = new THREE.DirectionalLight(0xffffff, 4.5); // Çok güçlü gündüz güneşi
                        realSun.name = 'realSun';
                        scene.add(realSun);
                    }

                    // 3. Ortam Karartması: Gece tarafının zifiri karanlığı - Kullanıcı isteği: %70 karanlık
                    // %100 simsiyah yapmamak için ambient ışığını ayarlıyoruz
                    if (!scene.getObjectByName('zifiriGece')) {
                        const ambient = new THREE.AmbientLight(0xddeeff, 0.7); // Hafif aydınlık (%30 görünür civarı)
                        ambient.name = 'zifiriGece';
                        scene.add(ambient);
                    }

                    // Dinamik Kamera Işık Takibi (Gölge hep ekranda kalsın diye!)
                    const enforceLighting = () => {
                        const cam = globeRef.current?.camera();
                        if (cam) {
                            // Kütüphanenin kameraya zorla bağladığı ışıkları söndür
                            cam.children.forEach(child => {
                                if (child.isLight) child.intensity = 0;
                            });

                            const sun = scene.getObjectByName('realSun');
                            if (sun) {
                                // Ekranın SOL( -1 ), biraz ÜSTÜ( 0.1 ) ve kameraya YAKIN( 0.3 ) açısından 
                                // ışık vurmasını hesaplayan lokal vektör. X değeri -1 olduğu için sol aydınlık, sağ gölgede olacak.
                                const offset = new THREE.Vector3(-1, 0.1, 0.2).normalize();
                                // Lokal kameranın bakış açısına uyarla
                                offset.applyQuaternion(cam.quaternion);
                                // Çok uzağa gönder ki paralel uzay güneşi gibi vursun
                                offset.multiplyScalar(500);
                                // Güneşi dünyanın aydınlatılacak tarafına koy
                                sun.position.copy(cam.position).add(offset);
                            }
                        }

                        // Kütüphanenin sahneye saçtığı diğer ortam aydınlatmalarını sıfırla
                        scene.children.forEach(child => {
                            if (child.isLight && child.name !== 'realSun' && child.name !== 'zifiriGece') {
                                child.intensity = 0;
                            }
                        });
                        requestAnimationFrame(enforceLighting);
                    };
                    enforceLighting();

                    // 1. DİNAMİK BULUT KATMANI
                    if (!scene.getObjectByName('cloudLayer')) {
                        const cloudGeometry = new THREE.SphereGeometry(radius * 1.006, 64, 64);
                        const cloudTexture = textureLoader.load('/textures/earth-clouds.png');

                        // Gündüz/gece etkileşimi için LambertMaterial kullanıyoruz (Gündüz beyaz, gece görünmez)
                        const cloudMaterial = new THREE.MeshLambertMaterial({
                            map: cloudTexture,
                            transparent: true,
                            opacity: 0.8, // Daha parlak
                            blending: THREE.AdditiveBlending, // Siyah kısımları atar
                            depthWrite: false,
                            side: THREE.DoubleSide
                        });

                        const cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
                        cloudMesh.name = 'cloudLayer';
                        scene.add(cloudMesh);

                        // Bulutlara hafif bir dönüş animasyonu ve Zuma göre Görünmezlik(Fade)
                        const rotateClouds = () => {
                            if (cloudMesh && globeRef.current) {
                                cloudMesh.rotation.y += 0.0002;

                                // Zoom (altitude) değerini al
                                const alt = globeRef.current.pointOfView().altitude;

                                // Altitude 0.02 (yer) ile 1.5 (uzay) arası değişir
                                // Hedef: alt 0.1 ve altındayken opacity 0 olsun. alt > 0.8 iken opacity 0.8 olsun
                                const targetOpacity = THREE.MathUtils.clamp((alt - 0.1) * 1.5, 0.0, 0.8);
                                cloudMaterial.opacity = targetOpacity;
                            }
                            requestAnimationFrame(rotateClouds);
                        };
                        rotateClouds();
                    }

                    // 2. HACİMSEL ATMOSFER (Tüy Gibi Yumuşak Kenar - Feathered Edge Halo)
                    // Uzayla keskin birleşimi yok etmek için özel matematik kullanıyoruz
                    if (!scene.getObjectByName('volumetricAtmosphere')) {
                        // Halo'yu dünyadan bariz şekilde daha büyük yapıyoruz ki tüy efekti sığsın
                        const atmosGeometry = new THREE.SphereGeometry(radius * 1.18, 64, 64);
                        const atmosMaterial = new THREE.ShaderMaterial({
                            vertexShader: `
                                varying vec3 vNormal;
                                varying vec3 vPositionNormal;
                                void main() {
                                    vNormal = normalize(normalMatrix * normal);
                                    vPositionNormal = normalize((modelViewMatrix * vec4(position, 1.0)).xyz);
                                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                                }
                            `,
                            fragmentShader: `
                                varying vec3 vNormal;
                                varying vec3 vPositionNormal;
                                void main() {
                                    float dotNL = dot(vNormal, vec3(0, 0, 1.0));
                                    
                                    // Sadece en dış kenarda (ufuk çizgisinde) parlama yarat
                                    float intensity = pow(0.65 - dotNL, 8.0);
                                    
                                    // Tüy efekti: Dış kenarlara doğru çok daha geniş bir alanda eriyerek kaybolsun
                                    float feather = smoothstep(-0.1, 0.6, dotNL);
                                    
                                    vec3 atmosphereBaseColor = vec3(0.2, 0.5, 1.0); // Koyu Mavi
                                    vec3 atmosphereEdgeColor = vec3(0.85, 0.95, 1.0); // Parlak Beyaz/Açık Mavi
                                    
                                    // Kenara doğru (dotNL azaldıkça) rengi beyaza/açık maviye karıştır
                                    float colorMix = smoothstep(0.1, 0.5, dotNL); // 0.1'de tam beyaz, 0.5'te tam mavi
                                    vec3 finalColor = mix(atmosphereEdgeColor, atmosphereBaseColor, colorMix);
                                    
                                    // Çok daha güçlü bir parlaklık çarpanı
                                    gl_FragColor = vec4(finalColor, intensity * feather * 3.0); 
                                }
                            `,
                            transparent: true,
                            blending: THREE.AdditiveBlending,
                            side: THREE.BackSide, // BackSide kullanarak iç çeperi render ediyoruz
                            depthWrite: false
                        });

                        const atmosphereMesh = new THREE.Mesh(atmosGeometry, atmosMaterial);
                        atmosphereMesh.name = 'volumetricAtmosphere';
                        scene.add(atmosphereMesh);
                    }
                }}
                width={dimensions.width}
                height={dimensions.height}
                backgroundColor="#010206"
                showAtmosphere={false} // Kendi atmosferimizi yazdığımız için kütüphaneninkini kapattık
                onGlobeClick={onGlobeClick}
                globeImageUrl="//unpkg.com/three-globe@2.24.0/example/img/earth-blue-marble.jpg"
                bumpImageUrl="//unpkg.com/three-globe@2.24.0/example/img/earth-topology.png"
                backgroundImageUrl="//unpkg.com/three-globe@2.24.0/example/img/night-sky.png"
                globeTileEngineUrl={tileUrl}
                tileLayer={{
                    maxZoom: 22,
                    attribution: 'Google Satellite-DPI'
                }}
                htmlElementsData={portals}
                htmlElement={(d) => {
                    const el = document.createElement('div');
                    el.className = 'portal-marker-container';

                    let circleClass = 'portal-circle';

                    if (activePortalSearch && activePortalSearch.length > 0) {
                        const q = activePortalSearch.toLowerCase();
                        const isMatch = d.name.toLowerCase().includes(q) || d.location.toLowerCase().includes(q);

                        if (isMatch) {
                            circleClass = 'portal-circle portal-circle-match';
                        } else {
                            circleClass = 'portal-circle portal-circle-dimmed';
                        }
                    }

                    el.innerHTML = `
                        <div class="${circleClass}">
                            <img src="/portals/logo.png" alt="${d.name}" />
                        </div>
                        <div class="portal-hover-label">${d.name} Portal</div>
                    `;
                    el.style.position = 'relative';
                    el.style.cursor = 'pointer';
                    el.onclick = (e) => {
                        e.stopPropagation();
                        onPortalClick(d);
                    };
                    el.onpointerdown = (e) => {
                        e.stopPropagation();
                    };
                    return el;
                }}
                htmlLat={d => d.lat}
                htmlLng={d => d.lng}
                htmlAltitude={0}
            />

            <style>{`
                .portal-marker-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    pointer-events: auto !important;
                    user-select: none;
                    transform: translate(-50%, -50%);
                }

                .portal-marker-container:hover {
                    z-index: 100 !important;
                }

                .portal-circle {
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    background: rgba(16, 22, 34, 0.4);
                    backdrop-filter: blur(8px);
                    border: 2px solid rgba(255, 255, 255, 0.4);
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
                    transition: all 0.2s ease-out;
                }

                .portal-marker-container:hover .portal-circle {
                    transform: scale(1.2);
                    border-color: #135bec;
                    box-shadow: 0 0 25px rgba(19, 91, 236, 0.4);
                }

                .portal-circle img {
                    width: 90%;
                    height: 90%;
                    object-fit: contain;
                    border-radius: 50%;
                }

                @keyframes iridescentGlow {
                    0% { border-color: #ff0080; box-shadow: 0 0 25px rgba(255, 0, 128, 0.8), inset 0 0 10px rgba(255, 0, 128, 0.5); }
                    33% { border-color: #00d4ff; box-shadow: 0 0 25px rgba(0, 212, 255, 0.8), inset 0 0 10px rgba(0, 212, 255, 0.5); }
                    66% { border-color: #7928ca; box-shadow: 0 0 25px rgba(121, 40, 202, 0.8), inset 0 0 10px rgba(121, 40, 202, 0.5); }
                    100% { border-color: #ff0080; box-shadow: 0 0 25px rgba(255, 0, 128, 0.8), inset 0 0 10px rgba(255, 0, 128, 0.5); }
                }

                .portal-circle-match {
                    animation: iridescentGlow 4s linear infinite !important;
                    transform: scale(1.2) !important;
                }

                .portal-circle-dimmed {
                    opacity: 0.35;
                    filter: grayscale(80%);
                    border-color: rgba(255, 255, 255, 0.1);
                }

                .portal-hover-label {
                    position: absolute;
                    top: 55px;
                    background: rgba(16, 22, 34, 0.95);
                    backdrop-filter: blur(10px);
                    color: white;
                    padding: 4px 12px;
                    border-radius: 6px;
                    font-size: 11px;
                    font-weight: 700;
                    white-space: nowrap;
                    opacity: 0;
                    pointer-events: none;
                    transition: all 0.2s ease-out;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
                }

                .portal-marker-container:hover .portal-hover-label {
                    opacity: 1;
                    transform: translateY(5px);
                }
            `}</style>
        </div>
    );
});

export default EarthCanvas;