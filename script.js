// Variáveis globais
let scene, camera, renderer, controls;
let model;
let ambientLight, directionalLight, fillLight;
let gridHelper;
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
    rotationSpeed: 0.01,
    showGrid: true,
    gridSize: 20,
    gridDivisions: 20,
    gridColor: '#888888',
    gridPositionX: 0,
    gridPositionY: 0,
    gridPositionZ: 0,
    gridRotationX: 0,
    gridRotationY: 0,
    gridRotationZ: 0,
    
    // Ponto de rotação
    rotationPointX: 0,
    rotationPointY: 0,
    rotationPointZ: 0,
    
    // Cores do modelo
    useOriginalColors: true,
    modelColor: '#ffffff',
    
    // Modelo externo
    externalModelUrl: '',
    
    // Informações do projeto
    projectName: '',
    projectStage: '',
    projectDescription: '',
    projectResponsible: '',
    whatsappNumber: '',
    email: ''
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
    controls.maxDistance = 200; // Aumentado para acomodar modelos maiores
    // Remover restrição de rotação vertical para permitir visualizar a parte inferior
    // controls.maxPolarAngle = Math.PI / 2; // Comentado para permitir rotação completa
    controls.autoRotate = settings.autoRotate;
    controls.autoRotateSpeed = 2.0;
    
    // Configurar ponto de rotação inicial
    updateRotationPoint();
    
    // Adicionar luzes
    setupLights();
    
    // Adicionar plano de grade
    setupGrid();
    
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

function setupGrid() {
    // Criar plano de grade
    gridHelper = new THREE.GridHelper(
        settings.gridSize, 
        settings.gridDivisions, 
        settings.gridColor, 
        settings.gridColor
    );
    
    // Aplicar posição e rotação da grade
    updateGridTransform();
    
    // Adicionar à cena
    scene.add(gridHelper);
    
    // Controlar visibilidade inicial
    gridHelper.visible = settings.showGrid;
}

function updateGridTransform() {
    if (gridHelper) {
        // Atualizar posição
        gridHelper.position.set(
            settings.gridPositionX,
            settings.gridPositionY,
            settings.gridPositionZ
        );
        
        // Atualizar rotação (converter graus para radianos)
        gridHelper.rotation.set(
            THREE.MathUtils.degToRad(settings.gridRotationX),
            THREE.MathUtils.degToRad(settings.gridRotationY),
            THREE.MathUtils.degToRad(settings.gridRotationZ)
        );
    }
}

function updateRotationPoint() {
    if (controls) {
        // Atualizar o ponto alvo dos controles de órbita
        controls.target.set(
            settings.rotationPointX,
            settings.rotationPointY,
            settings.rotationPointZ
        );
        controls.update();
    }
}

function updateModelColors() {
    if (model) {
        model.traverse(function(child) {
            if (child.isMesh && child.material) {
                if (settings.useOriginalColors) {
                    // Restaurar material original
                    if (child.userData.originalMaterial) {
                        child.material = child.userData.originalMaterial.clone();
                        child.material.transparent = true;
                        child.material.opacity = settings.modelOpacity;
                    }
                } else {
                    // Aplicar cor sólida
                    const solidColor = new THREE.Color(settings.modelColor);
                    child.material = new THREE.MeshLambertMaterial({
                        color: solidColor,
                        transparent: true,
                        opacity: settings.modelOpacity
                    });
                }
            }
        });
    }
}

function loadExternalModel() {
    const url = settings.externalModelUrl.trim();
    if (url) {
        // Remover modelo atual se existir
        if (model) {
            scene.remove(model);
            model = null;
            window.model = null;
        }
        
        // Carregar novo modelo
        loadModel(url);
    } else {
        alert('Por favor, insira uma URL válida para o modelo GLB.');
    }
}

function generateQRCode() {
    // Verificar se os campos obrigatórios estão preenchidos
    if (!settings.projectName || !settings.projectStage || !settings.projectDescription || !settings.projectResponsible) {
        alert('Por favor, preencha todos os campos do projeto antes de gerar o QR Code.');
        return;
    }
    
    // Criar URL do visualizador com parâmetros
    const baseUrl = window.location.href.split('?')[0];
    const params = new URLSearchParams();
    
    if (settings.externalModelUrl) {
        params.append('model', settings.externalModelUrl);
    }
    
    const viewerUrl = baseUrl + (params.toString() ? '?' + params.toString() : '');
    
    // Criar dados do projeto para o QR Code
    const projectData = {
        projeto: settings.projectName,
        etapa: settings.projectStage,
        descricao: settings.projectDescription,
        responsavel: settings.projectResponsible,
        whatsapp: settings.whatsappNumber,
        email: settings.email,
        visualizador: viewerUrl,
        data_geracao: new Date().toLocaleString('pt-BR')
    };
    
    // Gerar CSV
    generateCSV(projectData);
    
    // Gerar QR Code usando uma API pública
    const qrData = JSON.stringify(projectData);
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;
    
    // Mostrar QR Code em uma nova janela
    const qrWindow = window.open('', '_blank', 'width=400,height=500');
    qrWindow.document.write(`
        <html>
            <head>
                <title>QR Code - ${settings.projectName}</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
                    .project-info { background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 8px; text-align: left; }
                    .project-info h3 { margin-top: 0; color: #333; }
                    .project-info p { margin: 5px 0; }
                    img { border: 2px solid #ddd; border-radius: 8px; }
                </style>
            </head>
            <body>
                <h2>QR Code do Projeto</h2>
                <div class="project-info">
                    <h3>Informações do Projeto</h3>
                    <p><strong>Projeto:</strong> ${settings.projectName}</p>
                    <p><strong>Etapa:</strong> ${settings.projectStage}</p>
                    <p><strong>Descrição:</strong> ${settings.projectDescription}</p>
                    <p><strong>Responsável:</strong> ${settings.projectResponsible}</p>
                    ${settings.whatsappNumber ? `<p><strong>WhatsApp:</strong> ${settings.whatsappNumber}</p>` : ''}
                    ${settings.email ? `<p><strong>E-mail:</strong> ${settings.email}</p>` : ''}
                    <p><strong>Data de Geração:</strong> ${new Date().toLocaleString('pt-BR')}</p>
                </div>
                <img src="${qrCodeUrl}" alt="QR Code do Projeto" />
                <p>Escaneie o QR Code para acessar o visualizador 3D</p>
                <button onclick="window.print()" style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer; margin-top: 20px;">Imprimir</button>
            </body>
        </html>
    `);
}

function generateCSV(projectData) {
    // Criar cabeçalho CSV
    const headers = ['Projeto', 'Etapa', 'Descrição', 'Responsável', 'WhatsApp', 'E-mail', 'URL_Visualizador', 'Data_Geração'];
    
    // Criar linha de dados
    const row = [
        projectData.projeto,
        projectData.etapa,
        projectData.descricao,
        projectData.responsavel,
        projectData.whatsapp,
        projectData.email,
        projectData.visualizador,
        projectData.data_geracao
    ];
    
    // Escapar aspas e vírgulas nos dados
    const escapedRow = row.map(field => {
        if (typeof field === 'string' && (field.includes(',') || field.includes('"') || field.includes('\n'))) {
            return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
    });
    
    // Criar conteúdo CSV
    const csvContent = [headers.join(','), escapedRow.join(',')].join('\n');
    
    // Criar e baixar arquivo CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `projeto_${settings.projectName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function sendWhatsAppMessage() {
    if (!settings.whatsappNumber) {
        alert('Por favor, insira um número de WhatsApp válido.');
        return;
    }
    
    const message = `🏗️ *Projeto BIM: ${settings.projectName}*\n\n` +
                   `📋 *Etapa:* ${settings.projectStage}\n` +
                   `📝 *Descrição:* ${settings.projectDescription}\n` +
                   `👤 *Responsável:* ${settings.projectResponsible}\n\n` +
                   `🔗 *Visualizador 3D:* ${window.location.href}\n\n` +
                   `📅 *Gerado em:* ${new Date().toLocaleString('pt-BR')}`;
    
    const whatsappUrl = `https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

function loadModelFromFile(file) {
    if (!file) {
        alert('Por favor, selecione um arquivo GLB válido.');
        return;
    }
    
    // Verificar se é um arquivo GLB ou GLTF
    const validTypes = ['model/gltf-binary', 'model/gltf+json', 'application/octet-stream'];
    const validExtensions = ['.glb', '.gltf'];
    const fileName = file.name.toLowerCase();
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
    
    if (!validTypes.includes(file.type) && !hasValidExtension) {
        alert('Por favor, selecione um arquivo GLB ou GLTF válido.');
        return;
    }
    
    // Mostrar loading
    document.getElementById('loading').style.display = 'block';
    document.getElementById('loading').textContent = 'Carregando arquivo...';
    
    // Criar FileReader para ler o arquivo
    const reader = new FileReader();
    
    reader.onload = function(event) {
        const arrayBuffer = event.target.result;
        
        // Remover modelo atual se existir
        if (model) {
            scene.remove(model);
            model = null;
            window.model = null;
        }
        
        // Carregar modelo usando GLTFLoader
        const loader = new THREE.GLTFLoader();
        
        loader.parse(arrayBuffer, '', function(gltf) {
            model = gltf.scene;
            window.model = model; // Tornar o modelo acessível globalmente para depuração
            console.log("Arquivo GLB carregado com sucesso:", gltf);
            console.log("Cena do modelo:", model);
            
            // Configurar sombras, transparência e cores
            model.traverse(function(child) {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    
                    // Armazenar material original para poder restaurar
                    if (child.material && !child.userData.originalMaterial) {
                        child.userData.originalMaterial = child.material.clone();
                    }
                    
                    // Configurar material para transparência
                    if (child.material) {
                        child.material.transparent = true;
                        child.material.opacity = settings.modelOpacity;
                    }
                }
            });
            
            // Aplicar configuração de cores inicial
            updateModelColors();
            
            // Centralizar e escalar o modelo
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            
            // Mover modelo para o centro
            model.position.sub(center);
            
            // Escalar modelo se necessário (opcional)
            const maxDim = Math.max(size.x, size.y, size.z);
            if (maxDim > 20) {
                const scale = 20 / maxDim;
                model.scale.setScalar(scale);
            }
            
            // Adicionar modelo à cena
            scene.add(model);
            
            // Ajustar câmera para visualizar o modelo
            const distance = Math.max(size.x, size.y, size.z) * 2;
            camera.position.set(distance, distance, distance);
            controls.target.set(0, 0, 0);
            controls.update();
            
            // Esconder loading
            document.getElementById('loading').style.display = 'none';
            
            console.log('Arquivo carregado com sucesso!');
        }, function(error) {
            console.error('Erro ao processar arquivo:', error);
            document.getElementById('loading').innerHTML = 
                '<div style="color: #ff6b6b;">❌ Erro ao processar arquivo</div>' +
                '<div style="font-size: 12px; margin-top: 10px;">Verifique se o arquivo é um GLB válido</div>';
        });
    };
    
    reader.onerror = function() {
        console.error('Erro ao ler arquivo');
        document.getElementById('loading').innerHTML = 
            '<div style="color: #ff6b6b;">❌ Erro ao ler arquivo</div>' +
            '<div style="font-size: 12px; margin-top: 10px;">Tente novamente com outro arquivo</div>';
    };
    
    // Ler arquivo como ArrayBuffer
    reader.readAsArrayBuffer(file);
}

function toggleGrid() {
    if (gridHelper) {
        gridHelper.visible = settings.showGrid;
    }
}

function updateGridColor() {
    if (gridHelper) {
        const color = new THREE.Color(settings.gridColor);
        gridHelper.material.color = color;
    }
}

function loadModel(modelUrl = null) {
    const loader = new THREE.GLTFLoader();
    
    // Usar URL externa se fornecida, senão usar modelo padrão
    const url = modelUrl || settings.externalModelUrl || 'modelo.glb';
    
    // Mostrar loading
    document.getElementById('loading').style.display = 'block';
    document.getElementById('loading').textContent = 'Carregando modelo...';
    
    loader.load(
        url, // Arquivo do modelo
        function(gltf) {
            model = gltf.scene;
            window.model = model; // Tornar o modelo acessível globalmente para depuração
            console.log("GLTF carregado com sucesso:", gltf);
            console.log("Cena do modelo:", model);
            
            // Configurar sombras, transparência e cores
            model.traverse(function(child) {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    
                    // Armazenar material original para poder restaurar
                    if (child.material && !child.userData.originalMaterial) {
                        child.userData.originalMaterial = child.material.clone();
                    }
                    
                    // Configurar material para transparência
                    if (child.material) {
                        child.material.transparent = true;
                        child.material.opacity = settings.modelOpacity;
                    }
                }
            });
            
            // Aplicar configuração de cores inicial
            updateModelColors();
            
            // Centralizar e escalar o modelo
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            
            // Mover modelo para o centro
            model.position.sub(center);
            
            // Escalar para caber na tela
            const maxDim = Math.max(size.x, size.y, size.z);
            // Ajustar a escala para um valor mais adequado para modelos BIM, que podem ser grandes
            const scale = 10 / maxDim; // Aumentado de 3 para 10 para melhor visibilidade
            model.scale.setScalar(scale);
            
            scene.add(model);
            
            // Ajustar câmera
            const distance = maxDim * scale * 2; // Distância base
            // Ajustar a posição da câmera para garantir que o modelo esteja visível
            camera.position.set(distance * 1.5, distance * 1.5, distance * 1.5); // Aumentar a distância inicial
            controls.target.set(0, 0, 0);
            controls.update();
            
            // Esconder loading
            document.getElementById('loading').style.display = 'none';
            
            console.log('Modelo carregado com sucesso!');
        },
        function(progress) {
            console.log('Progresso:', (progress.loaded / progress.total * 100) + '%');
        },
        function(error) {
            console.error('Erro ao carregar modelo:', error);
            document.getElementById('loading').innerHTML = 
                '<div style="color: #ff6b6b;">❌ Erro ao carregar modelo</div>' +
                '<div style="font-size: 12px; margin-top: 10px;">Verifique se a URL está correta e acessível</div>';
            
            // Se falhou ao carregar modelo externo, tentar carregar o padrão
            if (modelUrl && modelUrl !== 'modelo.glb') {
                console.log('Tentando carregar modelo padrão...');
                setTimeout(() => loadModel('modelo.glb'), 2000);
            }
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
    
    // Mostrar grade
    const showGridCheckbox = document.getElementById('showGrid');
    if (showGridCheckbox) {
        showGridCheckbox.checked = settings.showGrid;
        showGridCheckbox.addEventListener('change', function(e) {
            settings.showGrid = e.target.checked;
            toggleGrid();
        });
    }
    
    // Cor da grade
    const gridColorInput = document.getElementById('gridColor');
    if (gridColorInput) {
        gridColorInput.value = settings.gridColor;
        gridColorInput.addEventListener('input', function(e) {
            settings.gridColor = e.target.value;
            updateGridColor();
        });
    }
    
    // Cores originais do modelo
    const useOriginalColorsCheckbox = document.getElementById('useOriginalColors');
    if (useOriginalColorsCheckbox) {
        useOriginalColorsCheckbox.checked = settings.useOriginalColors;
        useOriginalColorsCheckbox.addEventListener('change', function(e) {
            settings.useOriginalColors = e.target.checked;
            updateModelColors();
        });
    }
    
    // Cor sólida do modelo
    const modelColorInput = document.getElementById('modelColor');
    if (modelColorInput) {
        modelColorInput.value = settings.modelColor;
        modelColorInput.addEventListener('input', function(e) {
            settings.modelColor = e.target.value;
            if (!settings.useOriginalColors) {
                updateModelColors();
            }
        });
    }
    
    // Ponto de rotação X
    const rotationPointXSlider = document.getElementById('rotationPointX');
    if (rotationPointXSlider) {
        rotationPointXSlider.value = settings.rotationPointX;
        rotationPointXSlider.addEventListener('input', function(e) {
            settings.rotationPointX = parseFloat(e.target.value);
            updateRotationPoint();
        });
    }
    
    // Ponto de rotação Y
    const rotationPointYSlider = document.getElementById('rotationPointY');
    if (rotationPointYSlider) {
        rotationPointYSlider.value = settings.rotationPointY;
        rotationPointYSlider.addEventListener('input', function(e) {
            settings.rotationPointY = parseFloat(e.target.value);
            updateRotationPoint();
        });
    }
    
    // Ponto de rotação Z
    const rotationPointZSlider = document.getElementById('rotationPointZ');
    if (rotationPointZSlider) {
        rotationPointZSlider.value = settings.rotationPointZ;
        rotationPointZSlider.addEventListener('input', function(e) {
            settings.rotationPointZ = parseFloat(e.target.value);
            updateRotationPoint();
        });
    }
    
    // Posição da grade X
    const gridPositionXSlider = document.getElementById('gridPositionX');
    if (gridPositionXSlider) {
        gridPositionXSlider.value = settings.gridPositionX;
        gridPositionXSlider.addEventListener('input', function(e) {
            settings.gridPositionX = parseFloat(e.target.value);
            updateGridTransform();
        });
    }
    
    // Posição da grade Y
    const gridPositionYSlider = document.getElementById('gridPositionY');
    if (gridPositionYSlider) {
        gridPositionYSlider.value = settings.gridPositionY;
        gridPositionYSlider.addEventListener('input', function(e) {
            settings.gridPositionY = parseFloat(e.target.value);
            updateGridTransform();
        });
    }
    
    // Posição da grade Z
    const gridPositionZSlider = document.getElementById('gridPositionZ');
    if (gridPositionZSlider) {
        gridPositionZSlider.value = settings.gridPositionZ;
        gridPositionZSlider.addEventListener('input', function(e) {
            settings.gridPositionZ = parseFloat(e.target.value);
            updateGridTransform();
        });
    }
    
    // Rotação da grade X
    const gridRotationXSlider = document.getElementById('gridRotationX');
    if (gridRotationXSlider) {
        gridRotationXSlider.value = settings.gridRotationX;
        gridRotationXSlider.addEventListener('input', function(e) {
            settings.gridRotationX = parseFloat(e.target.value);
            updateGridTransform();
        });
    }
    
    // Rotação da grade Y
    const gridRotationYSlider = document.getElementById('gridRotationY');
    if (gridRotationYSlider) {
        gridRotationYSlider.value = settings.gridRotationY;
        gridRotationYSlider.addEventListener('input', function(e) {
            settings.gridRotationY = parseFloat(e.target.value);
            updateGridTransform();
        });
    }
    
    // Rotação da grade Z
    const gridRotationZSlider = document.getElementById('gridRotationZ');
    if (gridRotationZSlider) {
        gridRotationZSlider.value = settings.gridRotationZ;
        gridRotationZSlider.addEventListener('input', function(e) {
            settings.gridRotationZ = parseFloat(e.target.value);
            updateGridTransform();
        });
    }
    
    // URL do modelo externo
    const externalModelUrlInput = document.getElementById('externalModelUrl');
    if (externalModelUrlInput) {
        externalModelUrlInput.value = settings.externalModelUrl;
        externalModelUrlInput.addEventListener('input', function(e) {
            settings.externalModelUrl = e.target.value;
        });
    }
    
    // Campo de upload de arquivo
    const fileUploadInput = document.getElementById('fileUpload');
    if (fileUploadInput) {
        fileUploadInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                loadModelFromFile(file);
            }
        });
    }
    
    // Botão para carregar modelo externo
    const loadExternalModelButton = document.getElementById('loadExternalModel');
    if (loadExternalModelButton) {
        loadExternalModelButton.addEventListener('click', loadExternalModel);
    }
    
    // Campos de informações do projeto
    const projectNameInput = document.getElementById('projectName');
    if (projectNameInput) {
        projectNameInput.value = settings.projectName;
        projectNameInput.addEventListener('input', function(e) {
            settings.projectName = e.target.value;
        });
    }
    
    const projectStageInput = document.getElementById('projectStage');
    if (projectStageInput) {
        projectStageInput.value = settings.projectStage;
        projectStageInput.addEventListener('input', function(e) {
            settings.projectStage = e.target.value;
        });
    }
    
    const projectDescriptionInput = document.getElementById('projectDescription');
    if (projectDescriptionInput) {
        projectDescriptionInput.value = settings.projectDescription;
        projectDescriptionInput.addEventListener('input', function(e) {
            settings.projectDescription = e.target.value;
        });
    }
    
    const projectResponsibleInput = document.getElementById('projectResponsible');
    if (projectResponsibleInput) {
        projectResponsibleInput.value = settings.projectResponsible;
        projectResponsibleInput.addEventListener('input', function(e) {
            settings.projectResponsible = e.target.value;
        });
    }
    
    const whatsappNumberInput = document.getElementById('whatsappNumber');
    if (whatsappNumberInput) {
        whatsappNumberInput.value = settings.whatsappNumber;
        whatsappNumberInput.addEventListener('input', function(e) {
            settings.whatsappNumber = e.target.value;
        });
    }
    
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.value = settings.email;
        emailInput.addEventListener('input', function(e) {
            settings.email = e.target.value;
        });
    }
    
    // Botões de compartilhamento
    const generateQRCodeButton = document.getElementById('generateQRCode');
    if (generateQRCodeButton) {
        generateQRCodeButton.addEventListener('click', generateQRCode);
    }
    
    const sendWhatsAppButton = document.getElementById('sendWhatsApp');
    if (sendWhatsAppButton) {
        sendWhatsAppButton.addEventListener('click', sendWhatsAppMessage);
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
