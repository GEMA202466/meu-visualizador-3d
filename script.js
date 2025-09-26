// Variáveis globais
let scene, camera, renderer, controls;
let model;

// Inicialização
init();
animate();

function init() {
    // Criar cena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    
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
    
    // Adicionar luzes
    setupLights();
    
    // Carregar modelo
    loadModel();
    
    // Configurar redimensionamento
    window.addEventListener('resize', onWindowResize, false);
}

function setupLights() {
    // Luz ambiente
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);
    
    // Luz direcional principal
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    scene.add(directionalLight);
    
    // Luz de preenchimento
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-5, 5, -5);
    scene.add(fillLight);
}

function loadModel() {
    const loader = new THREE.GLTFLoader();
    
    loader.load(
        'modelo.glb', // Arquivo do modelo
        function(gltf) {
            model = gltf.scene;
            
            // Configurar sombras
            model.traverse(function(child) {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
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
