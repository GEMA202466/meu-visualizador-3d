// Variáveis globais
let scene, camera, renderer, controls;
let model;
let ambientLight, directionalLight, fillLight;
let autoRotate = false;

// Configurações padrão
const settings = {
    backgroundColor: '#f0f0f0',
    backgroundType: 'solid', // 'solid' ou 'gradient'
    gradientTop: '#667eea',
    gradientBottom: '#764ba2',
    ambientIntensity: 0.6,
    directionalIntensity: 0.8,
    fillIntensity: 0.3,
    lightColor: '#ffffff',
    modelOpacity: 1.0,
    autoRotate: false,
    rotationSpeed: 0.01
};

// Inicialização
init();
animate();

function init() {
    // Criar cena
    scene = new THREE.Scene();
    updateBackground();
    
    // Configurar câmera
    camera = new THREE.PerspectiveCamera(
        75, 
        window.innerWidth / window.innerHeight, 
        0.1, 
        1000
    );
    camera.position.set(5, 5, 5);
    
    // Criar renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    
    document.getElementById('container').appendChild(renderer.domElement);
    
    // Configurar controles de órbita
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 1;
    controls.maxDistance = 50;
    controls.maxPolarAngle = Math.PI / 2;
    controls.autoRotate = settings.autoRotate;
    controls.autoRotateSpeed = 2.0;
    
    // Adicionar luzes
    setupLights();
    
    // Carregar modelo
    loadModel();
    
    // Configurar controles da UI
    setupUIControls();
    
    // Configurar redimensionamento
    window.addEventListener('resize', onWindowResize, false);
}

function updateBackground() {
    if (settings.backgroundType === 'solid') {
        scene.background = new THREE.Color(settings.backgroundColor);
    } else {
        // Criar gradiente usando canvas
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        const gradient = ctx.createLinearGradient(0, 0, 0, 256);
        gradient.addColorStop(0, settings.gradientTop);
        gradient.addColorStop(1, settings.gradientBottom);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 256, 256);
        
        const texture = new THREE.CanvasTexture(canvas);
        scene.background = texture;
    }
}

function setupLights() {
    // Luz ambiente
    ambientLight = new THREE.AmbientLight(settings.lightColor, settings.ambientIntensity);
    scene.add(ambientLight);
    
    // Luz direcional principal
    directionalLight = new THREE.DirectionalLight(settings.lightColor, settings.directionalIntensity);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    scene.add(directionalLight);
    
    // Luz de preenchimento
    fillLight = new THREE.DirectionalLight(settings.lightColor, settings.fillIntensity);
    fillLight.position.set(-5, 5, -5);
    scene.add(fillLight);
}

function updateLights() {
    const lightColor = new THREE.Color(settings.lightColor);
    
    ambientLight.color = lightColor;
    ambientLight.intensity = settings.ambientIntensity;
    
    directionalLight.color = lightColor;
    directionalLight.intensity = settings.directionalIntensity;
    
    fillLight.color = lightColor;
    fillLight.intensity = settings.fillIntensity;
}

function loadModel() {
    const loader = new THREE.GLTFLoader();
    
    loader.load(
        'modelo.glb', // Arquivo do modelo
        function(gltf) {
            model = gltf.scene;
            
            // Configurar sombras e transparência
            model.traverse(function(child) {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    
                    // Configurar material para transparência
                    if (child.material) {
                        child.material.transparent = true;
                        child.material.opacity = settings.modelOpacity;
                    }
                }
            });
            
            // Centralizar e escalar o modelo
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            
            // Mover modelo para o centro
            model.position.sub(center);
            
            // Escalar para caber na tela
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 3 / maxDim;
            model.scale.setScalar(scale);
            
            scene.add(model);
            
            // Ajustar câmera
            const distance = maxDim * scale * 2;
            camera.position.set(distance, distance, distance);
            controls.target.set(0, 0, 0);
            controls.update();
            
            // Esconder loading
            document.getElementById('loading').style.display = 'none';
            
            console.log('Modelo carregado com sucesso!');
        },
        function(progress) {
            const percent = (progress.loaded / progress.total * 100).toFixed(0);
            console.log('Carregando: ' + percent + '%');
        },
        function(error) {
            console.error('Erro ao carregar modelo:', error);
            document.getElementById('loading').innerHTML = 
                '<div style="color: #ff6b6b;">❌ Erro ao carregar modelo</div>' +
                '<div style="font-size: 12px; margin-top: 10px;">Verifique se o arquivo modelo.glb existe</div>';
        }
    );
}

function updateModelOpacity() {
    if (model) {
        model.traverse(function(child) {
            if (child.isMesh && child.material) {
                child.material.opacity = settings.modelOpacity;
            }
        });
    }
}

function setupUIControls() {
    // Cor de fundo
    const bgColorInput = document.getElementById('bgColor');
    if (bgColorInput) {
        bgColorInput.value = settings.backgroundColor;
        bgColorInput.addEventListener('input', function(e) {
            settings.backgroundColor = e.target.value;
            if (settings.backgroundType === 'solid') {
                updateBackground();
            }
        });
    }
    
    // Tipo de fundo
    const bgTypeSelect = document.getElementById('bgType');
    if (bgTypeSelect) {
        bgTypeSelect.value = settings.backgroundType;
        bgTypeSelect.addEventListener('change', function(e) {
            settings.backgroundType = e.target.value;
            updateBackground();
        });
    }
    
    // Gradiente superior
    const gradientTopInput = document.getElementById('gradientTop');
    if (gradientTopInput) {
        gradientTopInput.value = settings.gradientTop;
        gradientTopInput.addEventListener('input', function(e) {
            settings.gradientTop = e.target.value;
            if (settings.backgroundType === 'gradient') {
                updateBackground();
            }
        });
    }
    
    // Gradiente inferior
    const gradientBottomInput = document.getElementById('gradientBottom');
    if (gradientBottomInput) {
        gradientBottomInput.value = settings.gradientBottom;
        gradientBottomInput.addEventListener('input', function(e) {
            settings.gradientBottom = e.target.value;
            if (settings.backgroundType === 'gradient') {
                updateBackground();
            }
        });
    }
    
    // Intensidade da luz ambiente
    const ambientSlider = document.getElementById('ambientIntensity');
    if (ambientSlider) {
        ambientSlider.value = settings.ambientIntensity;
        ambientSlider.addEventListener('input', function(e) {
            settings.ambientIntensity = parseFloat(e.target.value);
            updateLights();
        });
    }
    
    // Intensidade da luz direcional
    const directionalSlider = document.getElementById('directionalIntensity');
    if (directionalSlider) {
        directionalSlider.value = settings.directionalIntensity;
        directionalSlider.addEventListener('input', function(e) {
            settings.directionalIntensity = parseFloat(e.target.value);
            updateLights();
        });
    }
    
    // Intensidade da luz de preenchimento
    const fillSlider = document.getElementById('fillIntensity');
    if (fillSlider) {
        fillSlider.value = settings.fillIntensity;
        fillSlider.addEventListener('input', function(e) {
            settings.fillIntensity = parseFloat(e.target.value);
            updateLights();
        });
    }
    
    // Cor da luz
    const lightColorInput = document.getElementById('lightColor');
    if (lightColorInput) {
        lightColorInput.value = settings.lightColor;
        lightColorInput.addEventListener('input', function(e) {
            settings.lightColor = e.target.value;
            updateLights();
        });
    }
    
    // Transparência do modelo
    const opacitySlider = document.getElementById('modelOpacity');
    if (opacitySlider) {
        opacitySlider.value = settings.modelOpacity;
        opacitySlider.addEventListener('input', function(e) {
            settings.modelOpacity = parseFloat(e.target.value);
            updateModelOpacity();
        });
    }
    
    // Rotação automática
    const autoRotateCheckbox = document.getElementById('autoRotate');
    if (autoRotateCheckbox) {
        autoRotateCheckbox.checked = settings.autoRotate;
        autoRotateCheckbox.addEventListener('change', function(e) {
            settings.autoRotate = e.target.checked;
            controls.autoRotate = settings.autoRotate;
        });
    }
    
    // Toggle do painel de controles
    const toggleButton = document.getElementById('toggleControls');
    const controlsPanel = document.getElementById('controlsPanel');
    if (toggleButton && controlsPanel) {
        toggleButton.addEventListener('click', function() {
            controlsPanel.classList.toggle('hidden');
            toggleButton.textContent = controlsPanel.classList.contains('hidden') ? '⚙️' : '✕';
        });
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    
    // Atualizar controles
    controls.update();
    
    // Renderizar cena
    renderer.render(scene, camera);
}

// Função para resetar a visualização
function resetView() {
    if (model) {
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const distance = maxDim * 2;
        
        camera.position.set(distance, distance, distance);
        controls.target.set(0, 0, 0);
        controls.update();
    }
}

// Adicionar evento de duplo clique para resetar visualização
window.addEventListener('dblclick', resetView);
