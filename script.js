// Inicializar Supabase
const SUPABASE_URL = 'https://mthxubiltbeqedaaxxnb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10aHh1YmlsdGJlcWVkYWF4eG5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MDg0OTgsImV4cCI6MjA3NDk4NDQ5OH0.fACFA14PSfLcDjOiRExSjpIq-gXcSR_UYH8jD1H5D-4';
const supabase = Supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Variáveis globais
let scene, camera, renderer, controls;
let model;
let ambientLight, directionalLight, fillLight;
let gridHelper;
let rotationPointIndicator;
let autoRotate = false;

// Variáveis globais para ThatOpen Components IFC
let ifcComponents = null;
let ifcWorld = null;
let ifcLoader = null;

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
    showRotationPoint: true,
    rotationPointSize: 0.2,
    
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

async function init() {
    // Tentar carregar dados do projeto do Supabase se houver um project_id na URL
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('project_id');

    if (projectId) {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .single();

        if (error) {
            console.error('Erro ao carregar projeto do Supabase:', error);
            alert('Erro ao carregar projeto. Verifique o ID.');
        } else if (data) {
            settings.projectName = data.project_name;
            settings.projectStage = data.project_stage;
            settings.projectDescription = data.project_description;
            settings.projectResponsible = data.project_responsible;
            settings.whatsappNumber = data.whatsapp_number;
            settings.email = data.email;
            // Se houver um modelo externo associado ao projeto, carregá-lo
            if (data.external_model_url) {
                settings.externalModelUrl = data.external_model_url;
                loadModel(data.external_model_url);
            } else {
                loadModel(); // Carregar modelo padrão se não houver URL externa
            }
        }
    } else {
        loadModel(); // Carregar modelo padrão se não houver project_id
    }

    // Criar cena
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
    
    // Adicionar indicador do ponto de rotação
    setupRotationPointIndicator();
    
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

function setupRotationPointIndicator() {
    // Criar grupo para o indicador do ponto de rotação
    rotationPointIndicator = new THREE.Group();
    
    // Esfera central
    const sphereGeometry = new THREE.SphereGeometry(settings.rotationPointSize, 16, 16);
    const sphereMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff4444, 
        transparent: true, 
        opacity: 0.8
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    rotationPointIndicator.add(sphere);
    
    // Anel externo animado
    const ringGeometry = new THREE.RingGeometry(settings.rotationPointSize * 1.5, settings.rotationPointSize * 2, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff6666, 
        transparent: true, 
        opacity: 0.4,
        side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2; // Rotacionar para ficar horizontal
    rotationPointIndicator.add(ring);
    
    // Eixos de coordenadas
    const axisLength = settings.rotationPointSize * 3;
    
    // Eixo X (vermelho)
    const xAxisGeometry = new THREE.CylinderGeometry(0.02, 0.02, axisLength, 8);
    const xAxisMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.7 });
    const xAxis = new THREE.Mesh(xAxisGeometry, xAxisMaterial);
    xAxis.rotation.z = Math.PI / 2;
    rotationPointIndicator.add(xAxis);
    
    // Eixo Y (verde)
    const yAxisGeometry = new THREE.CylinderGeometry(0.02, 0.02, axisLength, 8);
    const yAxisMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.7 });
    const yAxis = new THREE.Mesh(yAxisGeometry, yAxisMaterial);
    rotationPointIndicator.add(yAxis);
    
    // Eixo Z (azul)
    const zAxisGeometry = new THREE.CylinderGeometry(0.02, 0.02, axisLength, 8);
    const zAxisMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff, transparent: true, opacity: 0.7 });
    const zAxis = new THREE.Mesh(zAxisGeometry, zAxisMaterial);
    zAxis.rotation.x = Math.PI / 2;
    rotationPointIndicator.add(zAxis);
    
    // Posicionar o grupo
    rotationPointIndicator.position.set(
        settings.rotationPointX,
        settings.rotationPointY,
        settings.rotationPointZ
    );
    
    // Adicionar à cena
    scene.add(rotationPointIndicator);
    
    // Controlar visibilidade inicial
    rotationPointIndicator.visible = settings.showRotationPoint;
    
    // Armazenar referências para animação
    rotationPointIndicator.userData = {
        sphere: sphere,
        ring: ring,
        xAxis: xAxis,
        yAxis: yAxis,
        zAxis: zAxis
    };
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
    
    // Atualizar a posição do indicador visual
    if (rotationPointIndicator) {
        rotationPointIndicator.position.set(
            settings.rotationPointX,
            settings.rotationPointY,
            settings.rotationPointZ
        );
        rotationPointIndicator.visible = settings.showRotationPoint;
        
        // Atualizar o tamanho do indicador
        const scale = settings.rotationPointSize / 0.2;
        rotationPointIndicator.scale.setScalar(scale);
        
        // Atualizar componentes individuais se existirem
        if (rotationPointIndicator.userData) {
            const { sphere, ring, xAxis, yAxis, zAxis } = rotationPointIndicator.userData;
            
            // Atualizar tamanhos dos eixos baseado no tamanho do ponto
            const axisLength = settings.rotationPointSize * 3;
            if (xAxis) {
                xAxis.scale.y = axisLength / (settings.rotationPointSize * 3);
            }
            if (yAxis) {
                yAxis.scale.y = axisLength / (settings.rotationPointSize * 3);
            }
            if (zAxis) {
                zAxis.scale.y = axisLength / (settings.rotationPointSize * 3);
            }
        }
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

async function generateQRCode() {
    // Verificar se os campos obrigatórios estão preenchidos
    if (!settings.projectName || !settings.projectStage || !settings.projectDescription || !settings.projectResponsible) {
        alert("Por favor, preencha todos os campos do projeto antes de gerar o QR Code.");
        return;
    }

    // Salvar informações no Supabase
    const { data, error } = await supabase
        .from("projects")
        .insert([
            {
                project_name: settings.projectName,
                project_stage: settings.projectStage,
                project_description: settings.projectDescription,
                project_responsible: settings.projectResponsible,
                whatsapp_number: settings.whatsappNumber,
                email: settings.email,
                viewer_url: window.location.href.split("?")[0], // URL base do visualizador
                external_model_url: settings.externalModelUrl // Salvar a URL do modelo externo
            },
        ])
        .select();

    if (error) {
        console.error("Erro ao salvar projeto no Supabase:", error);
        alert("Erro ao salvar projeto. Por favor, tente novamente.");
        return;
    }

    const projectId = data[0].id;
    const baseUrl = window.location.href.split("?")[0];
    const viewerUrlWithId = `${baseUrl}?project_id=${projectId}`;

    // Criar dados do projeto para o QR Code
    const projectData = {
        projeto: settings.projectName,
        etapa: settings.projectStage,
        descricao: settings.projectDescription,
        responsavel: settings.projectResponsible,
        whatsapp: settings.whatsappNumber,
        email: settings.email,
        visualizador: viewerUrlWithId,
        data_geracao: new Date().toLocaleString("pt-BR")
    };

    // Gerar CSV
    generateCSV(projectData);

    // Gerar QR Code usando uma API pública
    const qrData = JSON.stringify(projectData);
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;

    // Mostrar QR Code em uma nova janela
    const qrWindow = window.open("", "_blank", "width=400,height=500");
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
                    ${settings.whatsappNumber ? `<p><strong>WhatsApp:</strong> ${settings.whatsappNumber}</p>` : ""}
                    ${settings.email ? `<p><strong>E-mail:</strong> ${settings.email}</p>` : ""}
                    <p><strong>Data de Geração:</strong> ${new Date().toLocaleString("pt-BR")}</p>
                </div>
                <img src="${qrCodeUrl}" alt="QR Code do Projeto" />
                <p>Escaneie o QR Code para acessar o visualizador 3D</p>
                <button onclick="window.print()" style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer; margin-top: 20px;">Imprimir</button>
            </body>
        </html>
    `);
    document.getElementById("qrcodeContainer").innerHTML = `<img src="${qrCodeUrl}" alt="QR Code do Projeto" style="max-width: 100%; height: auto; margin-top: 20px;">`;
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
        alert('Por favor, selecione um arquivo 3D válido.');
        return;
    }
    
    // Verificar se é um formato suportado
    const fileName = file.name.toLowerCase();
    const extension = fileName.split('.').pop();
    const supportedFormats = ['glb', 'gltf', 'obj', 'fbx', 'stl', 'dae', '3ds', 'ply', 'ifc'];
    
    if (!supportedFormats.includes(extension)) {
        alert(`Formato não suportado. Formatos aceitos: ${supportedFormats.join(', ').toUpperCase()}`);
        return;
    }
    
    // Se for IFC, usar função específica
    if (extension === 'ifc') {
        loadIFCFromFile(file);
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
    // Usar URL externa se fornecida, senão usar modelo padrão
    const url = modelUrl || settings.externalModelUrl || 'modelo.glb';
    
    // Determinar tipo de arquivo pela extensão
    const extension = url.split('.').pop().toLowerCase();
    let loader;
    
    // Mostrar loading
    document.getElementById('loading').style.display = 'block';
    document.getElementById('loading').textContent = `Carregando modelo ${extension.toUpperCase()}...`;
    
    // Selecionar loader apropriado
    switch(extension) {
        case 'glb':
        case 'gltf':
            loader = new THREE.GLTFLoader();
            break;
        case 'obj':
            loader = new THREE.OBJLoader();
            break;
        case 'fbx':
            loader = new THREE.FBXLoader();
            break;
        case 'stl':
            loader = new THREE.STLLoader();
            break;
        case 'dae':
            loader = new THREE.ColladaLoader();
            break;
        case '3ds':
            loader = new THREE.TDSLoader();
            break;
        case 'ply':
            loader = new THREE.PLYLoader();
            break;
        case 'ifc':
            // IFC será tratado separadamente usando ThatOpen Components
            loadIFCModel(url);
            return;
        default:
            console.error('Formato de arquivo não suportado:', extension);
            document.getElementById('loading').innerHTML = 
                '<div style="color: #ff6b6b;">❌ Formato não suportado</div>' +
                `<div style="font-size: 12px; margin-top: 10px;">Formato ${extension.toUpperCase()} não é suportado</div>`;
            return;
    }
    
    loader.load(
        url,
        function(loadedData) {
            // Remover modelo anterior se existir
            if (model) {
                scene.remove(model);
            }
            
            // Processar dados carregados baseado no tipo
            if (extension === 'glb' || extension === 'gltf') {
                model = loadedData.scene;
            } else if (extension === 'dae') {
                model = loadedData.scene;
            } else if (extension === 'stl' || extension === 'ply') {
                // Para STL e PLY, criar mesh com geometria carregada
                const geometry = loadedData;
                geometry.computeVertexNormals(); // Calcular normais se necessário
                const material = new THREE.MeshLambertMaterial({ 
                    color: 0xffffff,
                    transparent: true,
                    opacity: settings.modelOpacity
                });
                model = new THREE.Mesh(geometry, material);
            } else {
                // Para OBJ, FBX, 3DS
                model = loadedData;
            }
            
            // Garantir que model é um Object3D
            if (!model.isObject3D) {
                const group = new THREE.Group();
                group.add(model);
                model = group;
            }
            
            window.model = model; // Tornar o modelo acessível globalmente para depuração
            console.log(`${extension.toUpperCase()} carregado com sucesso:`, model);
            
            // Configurar sombras, transparência e cores
            model.traverse(function(child) {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    
                    // Armazenar material original para poder restaurar
                    if (child.material && !child.userData.originalMaterial) {
                        if (Array.isArray(child.material)) {
                            child.userData.originalMaterial = child.material.map(mat => mat.clone());
                        } else {
                            child.userData.originalMaterial = child.material.clone();
                        }
                    }
                    
                    // Configurar material para transparência
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(mat => {
                                mat.transparent = true;
                                mat.opacity = settings.modelOpacity;
                            });
                        } else {
                            child.material.transparent = true;
                            child.material.opacity = settings.modelOpacity;
                        }
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
            if (maxDim > 0) {
                const scale = 10 / maxDim; // Ajustar escala para modelos BIM
                model.scale.setScalar(scale);
            }
            
            scene.add(model);
            
            // Ajustar câmera
            const distance = maxDim > 0 ? maxDim * 2 : 10;
            camera.position.set(distance * 1.5, distance * 1.5, distance * 1.5);
            controls.target.set(0, 0, 0);
            controls.update();
            
            // Esconder loading
            document.getElementById('loading').style.display = 'none';
            
            console.log(`Modelo ${extension.toUpperCase()} carregado com sucesso!`);
        },
        function(progress) {
            if (progress.total > 0) {
                const percent = (progress.loaded / progress.total * 100).toFixed(1);
                console.log(`Progresso ${extension.toUpperCase()}:`, percent + '%');
            }
        },
        function(error) {
            console.error(`Erro ao carregar modelo ${extension.toUpperCase()}:`, error);
            document.getElementById('loading').innerHTML = 
                `<div style="color: #ff6b6b;">❌ Erro ao carregar ${extension.toUpperCase()}</div>` +
                '<div style="font-size: 12px; margin-top: 10px;">Verifique se o arquivo está correto e acessível</div>';
            
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

// Função para inicializar ThatOpen Components para IFC
async function initIFCComponents() {
    if (ifcComponents) return true; // Já inicializado
    
    try {
        // Aguardar carregamento das bibliotecas
        let attempts = 0;
        while (!window.OBC && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!window.OBC) {
            throw new Error('ThatOpen Components não foi carregado');
        }
        
        const OBC = window.OBC;
        
        // Criar componentes
        ifcComponents = new OBC.Components();
        
        // Criar mundo
        const worlds = ifcComponents.get(OBC.Worlds);
        ifcWorld = worlds.create();
        
        // Configurar cena simples
        ifcWorld.scene = new OBC.SimpleScene(ifcComponents);
        ifcWorld.renderer = new OBC.SimpleRenderer(ifcComponents, renderer.domElement.parentElement);
        ifcWorld.camera = new OBC.SimpleCamera(ifcComponents);
        
        // Configurar IfcLoader
        ifcLoader = ifcComponents.get(OBC.IfcLoader);
        await ifcLoader.setup({
            autoSetWasm: false,
            wasm: {
                path: "https://unpkg.com/web-ifc@0.0.69/",
                absolute: true,
            },
        });
        
        // Inicializar componentes
        ifcComponents.init();
        
        console.log('ThatOpen Components IFC inicializado com sucesso');
        return true;
    } catch (error) {
        console.error('Erro ao inicializar ThatOpen Components:', error);
        return false;
    }
}

// Função para carregar modelos IFC de URL
async function loadIFCModel(url) {
    try {
        // Mostrar loading
        document.getElementById('loading').style.display = 'block';
        document.getElementById('loading').textContent = 'Carregando modelo IFC...';
        
        // Inicializar componentes IFC se necessário
        const initialized = await initIFCComponents();
        if (!initialized) {
            throw new Error('Falha ao inicializar componentes IFC');
        }
        
        // Remover modelo anterior se existir
        if (model) {
            scene.remove(model);
            model = null;
        }
        
        // Carregar arquivo IFC
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);
        
        // Carregar IFC usando ThatOpen Components
        const fragments = await ifcLoader.load(buffer, false, "ifc-model", {
            processData: {
                progressCallback: (progress) => {
                    console.log('Progresso IFC:', progress);
                    document.getElementById('loading').textContent = 
                        `Carregando IFC... ${Math.round(progress * 100)}%`;
                },
            },
        });
        
        // Processar fragments e adicionar à cena principal
        await processIFCFragments(fragments);
        
        console.log('Modelo IFC carregado com sucesso!');
        
    } catch (error) {
        console.error('Erro ao carregar modelo IFC:', error);
        document.getElementById('loading').innerHTML = 
            '<div style="color: #ff6b6b;">❌ Erro ao carregar IFC</div>' +
            `<div style="font-size: 12px; margin-top: 10px;">${error.message}</div>`;
    }
}

// Função para carregar IFC de arquivo local
async function loadIFCFromFile(file) {
    try {
        // Mostrar loading
        document.getElementById('loading').style.display = 'block';
        document.getElementById('loading').textContent = 'Processando arquivo IFC...';
        
        // Inicializar componentes IFC se necessário
        const initialized = await initIFCComponents();
        if (!initialized) {
            throw new Error('Falha ao inicializar componentes IFC');
        }
        
        // Remover modelo anterior se existir
        if (model) {
            scene.remove(model);
            model = null;
        }
        
        // Ler arquivo como ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);
        
        // Carregar IFC usando ThatOpen Components
        const fragments = await ifcLoader.load(buffer, false, file.name, {
            processData: {
                progressCallback: (progress) => {
                    console.log('Progresso IFC:', progress);
                    document.getElementById('loading').textContent = 
                        `Processando IFC... ${Math.round(progress * 100)}%`;
                },
            },
        });
        
        // Processar fragments e adicionar à cena principal
        await processIFCFragments(fragments);
        
        console.log('Arquivo IFC carregado com sucesso!');
        
    } catch (error) {
        console.error('Erro ao processar arquivo IFC:', error);
        document.getElementById('loading').innerHTML = 
            '<div style="color: #ff6b6b;">❌ Erro ao processar IFC</div>' +
            `<div style="font-size: 12px; margin-top: 10px;">${error.message}</div>`;
    }
}

// Função para processar fragments IFC e adicionar à cena
async function processIFCFragments(fragments) {
    try {
        if (!fragments || Object.keys(fragments).length === 0) {
            throw new Error('Nenhum fragmento foi gerado do arquivo IFC');
        }
        
        const group = new THREE.Group();
        
        // Iterar sobre os fragments
        for (const fragmentID in fragments) {
            const fragment = fragments[fragmentID];
            
            if (fragment && fragment.mesh) {
                // Clonar a geometria e material para nossa cena
                const geometry = fragment.mesh.geometry.clone();
                const material = fragment.mesh.material.clone();
                
                // Criar mesh para nossa cena
                const mesh = new THREE.Mesh(geometry, material);
                mesh.position.copy(fragment.mesh.position);
                mesh.rotation.copy(fragment.mesh.rotation);
                mesh.scale.copy(fragment.mesh.scale);
                
                // Configurar sombras
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                
                group.add(mesh);
            }
        }
        
        if (group.children.length === 0) {
            throw new Error('Nenhuma geometria válida encontrada no arquivo IFC');
        }
        
        model = group;
        
        // Centralizar e escalar o modelo
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        // Mover modelo para o centro
        model.position.sub(center);
        
        // Escalar para caber na tela
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0) {
            const scale = 10 / maxDim;
            model.scale.setScalar(scale);
        }
        
        scene.add(model);
        
        // Ajustar câmera
        const distance = maxDim > 0 ? maxDim * 2 : 10;
        camera.position.set(distance * 1.5, distance * 1.5, distance * 1.5);
        controls.target.set(0, 0, 0);
        controls.update();
        
        // Aplicar configurações atuais
        updateModelColors();
        
        // Disponibilizar globalmente para debug
        window.model = model;
        window.ifcFragments = fragments;
        
        // Esconder loading
        document.getElementById('loading').style.display = 'none';
        
    } catch (error) {
        throw error;
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
    
    // Controles do ponto de rotação
    const showRotationPointCheckbox = document.getElementById('showRotationPoint');
    const rotationPointSizeSlider = document.getElementById('rotationPointSize');
    const rotationPointXSlider = document.getElementById('rotationPointX');
    const rotationPointYSlider = document.getElementById('rotationPointY');
    const rotationPointZSlider = document.getElementById('rotationPointZ');

    if (showRotationPointCheckbox) {
        showRotationPointCheckbox.checked = settings.showRotationPoint;
        showRotationPointCheckbox.addEventListener('change', function(e) {
            settings.showRotationPoint = e.target.checked;
            updateRotationPoint();
        });
    }

    if (rotationPointSizeSlider) {
        rotationPointSizeSlider.value = settings.rotationPointSize;
        rotationPointSizeSlider.addEventListener('input', function(e) {
            settings.rotationPointSize = parseFloat(e.target.value);
            updateRotationPoint();
        });
    }

    if (rotationPointXSlider) {
        rotationPointXSlider.value = settings.rotationPointX;
        rotationPointXSlider.addEventListener('input', function(e) {
            settings.rotationPointX = parseFloat(e.target.value);
            updateRotationPoint();
        });
    }

    if (rotationPointYSlider) {
        rotationPointYSlider.value = settings.rotationPointY;
        rotationPointYSlider.addEventListener('input', function(e) {
            settings.rotationPointY = parseFloat(e.target.value);
            updateRotationPoint();
        });
    }

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
    
    // Função para tornar um elemento arrastável
    function makeDraggable(element, handle = element) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

        if (handle) {
            handle.onmousedown = dragMouseDown;
        } else {
            element.onmousedown = dragMouseDown;
        }

        function dragMouseDown(e) {
            e = e || window.event;
            e.preventDefault();
            // get the mouse cursor position at startup:
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            // call a function whenever the cursor moves:
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            // calculate the new cursor position:
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            // set the element's new position:
            element.style.top = (element.offsetTop - pos2) + "px";
            element.style.left = (element.offsetLeft - pos1) + "px";
        }

        function closeDragElement() {
            // stop moving when mouse button is released:
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

    // Toggle do painel de controles
    const toggleButton = document.getElementById("toggleControls");
    const controlsPanel = document.getElementById("controlsPanel");
    if (toggleButton && controlsPanel) {
        toggleButton.addEventListener("click", function() {
            controlsPanel.classList.toggle("hidden");
        });
        makeDraggable(controlsPanel); // Tornar o painel arrastável
    }

    // Toggle do modal de informações do projeto
    const toggleProjectInfoButton = document.getElementById("toggleProjectInfo");
    const projectInfoModal = document.getElementById("projectInfoModal");
    const closeProjectInfoModalButton = document.getElementById("closeProjectInfoModal");
    const projectInfoModalContent = document.getElementById("projectInfoModalContent");

    if (toggleProjectInfoButton && projectInfoModal && closeProjectInfoModalButton && projectInfoModalContent) {
        toggleProjectInfoButton.addEventListener("click", function() {
            projectInfoModal.style.display = "flex";
        });

        closeProjectInfoModalButton.addEventListener("click", function() {
            projectInfoModal.style.display = "none";
        });

        window.addEventListener("click", function(event) {
            if (event.target == projectInfoModal) {
                projectInfoModal.style.display = "none";
            }
        });
        makeDraggable(projectInfoModalContent); // Tornar o conteúdo do modal arrastável
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
    
    // Animar ponto de rotação
    if (rotationPointIndicator && rotationPointIndicator.visible && rotationPointIndicator.userData) {
        const time = Date.now() * 0.001;
        const { ring } = rotationPointIndicator.userData;
        
        if (ring) {
            // Rotação suave do anel
            ring.rotation.z = time * 0.5;
            
            // Pulsação suave da opacidade
            ring.material.opacity = 0.3 + Math.sin(time * 2) * 0.1;
        }
    }
    
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


// Funcionalidade de painel móvel e redimensionável
function initDraggablePanel() {
    const panel = document.getElementById('controlsPanel');
    const header = panel.querySelector('.panel-header');
    const minimizeBtn = document.getElementById('minimizePanel');
    const resetBtn = document.getElementById('resetPanelPosition');
    
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;
    
    // Estado minimizado
    let isMinimized = false;
    let originalHeight;
    
    // Função para iniciar o arraste
    function dragStart(e) {
        if (e.target.closest('.panel-control-btn')) return; // Não arrastar se clicar nos botões
        
        if (e.type === "touchstart") {
            initialX = e.touches[0].clientX - xOffset;
            initialY = e.touches[0].clientY - yOffset;
        } else {
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
        }

        if (e.target === header || header.contains(e.target)) {
            isDragging = true;
            panel.classList.add('dragging');
        }
    }

    // Função para arrastar
    function dragEnd(e) {
        initialX = currentX;
        initialY = currentY;

        isDragging = false;
        panel.classList.remove('dragging');
    }

    // Função para mover
    function drag(e) {
        if (isDragging) {
            e.preventDefault();
            
            if (e.type === "touchmove") {
                currentX = e.touches[0].clientX - initialX;
                currentY = e.touches[0].clientY - initialY;
            } else {
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
            }

            xOffset = currentX;
            yOffset = currentY;

            // Limitar movimento dentro da viewport
            const rect = panel.getBoundingClientRect();
            const maxX = window.innerWidth - rect.width;
            const maxY = window.innerHeight - rect.height;
            
            currentX = Math.max(0, Math.min(currentX, maxX));
            currentY = Math.max(0, Math.min(currentY, maxY));
            
            panel.style.transform = `translate(${currentX}px, ${currentY}px)`;
            panel.style.position = 'fixed';
            panel.style.top = '0';
            panel.style.right = 'auto';
            panel.style.left = '0';
        }
    }

    // Função para minimizar/maximizar
    function toggleMinimize() {
        if (!isMinimized) {
            originalHeight = panel.style.height || panel.offsetHeight + 'px';
            panel.style.height = '60px';
            panel.style.overflow = 'hidden';
            minimizeBtn.textContent = '+';
            minimizeBtn.title = 'Maximizar';
            isMinimized = true;
        } else {
            panel.style.height = originalHeight;
            panel.style.overflow = 'auto';
            minimizeBtn.textContent = '−';
            minimizeBtn.title = 'Minimizar';
            isMinimized = false;
        }
    }

    // Função para resetar posição
    function resetPosition() {
        panel.style.transform = '';
        panel.style.position = 'fixed';
        panel.style.top = '20px';
        panel.style.right = '80px';
        panel.style.left = 'auto';
        xOffset = 0;
        yOffset = 0;
        currentX = 0;
        currentY = 0;
        
        // Resetar tamanho também
        panel.style.width = '';
        panel.style.height = '';
        if (isMinimized) {
            toggleMinimize();
        }
    }

    // Event listeners
    header.addEventListener("mousedown", dragStart, false);
    document.addEventListener("mouseup", dragEnd, false);
    document.addEventListener("mousemove", drag, false);

    // Touch events para dispositivos móveis
    header.addEventListener("touchstart", dragStart, false);
    document.addEventListener("touchend", dragEnd, false);
    document.addEventListener("touchmove", drag, false);

    // Botões de controle
    minimizeBtn.addEventListener('click', toggleMinimize);
    resetBtn.addEventListener('click', resetPosition);
    
    // Salvar posição no localStorage
    function savePosition() {
        const rect = panel.getBoundingClientRect();
        localStorage.setItem('panelPosition', JSON.stringify({
            x: currentX,
            y: currentY,
            width: panel.style.width,
            height: panel.style.height,
            isMinimized: isMinimized
        }));
    }
    
    // Carregar posição do localStorage
    function loadPosition() {
        const saved = localStorage.getItem('panelPosition');
        if (saved) {
            const pos = JSON.parse(saved);
            if (pos.x !== undefined && pos.y !== undefined) {
                currentX = pos.x;
                currentY = pos.y;
                xOffset = pos.x;
                yOffset = pos.y;
                panel.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
                panel.style.position = 'fixed';
                panel.style.top = '0';
                panel.style.right = 'auto';
                panel.style.left = '0';
            }
            if (pos.width) panel.style.width = pos.width;
            if (pos.height) panel.style.height = pos.height;
            if (pos.isMinimized) {
                isMinimized = false; // Reset para poder alternar
                toggleMinimize();
            }
        }
    }
    
    // Salvar posição quando o painel for movido ou redimensionado
    document.addEventListener('mouseup', savePosition);
    window.addEventListener('beforeunload', savePosition);
    
    // Carregar posição salva
    loadPosition();
}

// Inicializar painel arrastável quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    initDraggablePanel();
});

// Funcionalidade do visualizador PDF
class PDFViewer {
    constructor() {
        this.pdfDoc = null;
        this.currentPage = 1;
        this.totalPages = 0;
        this.scale = 1.0;
        this.canvas = null;
        this.ctx = null;
        this.isLoading = false;
        
        this.initElements();
        this.initEventListeners();
        this.initDragAndDrop();
        this.initDraggable();
        
        // Configurar PDF.js worker
        if (typeof pdfjsLib !== 'undefined') {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
    }
    
    initElements() {
        this.viewer = document.getElementById('pdfViewer');
        this.content = document.getElementById('pdfContent');
        this.uploadArea = document.getElementById('pdfUploadArea');
        this.fileInput = document.getElementById('pdfFileInput');
        this.pageInfo = document.getElementById('pdfPageInfo');
        this.title = this.viewer.querySelector('.pdf-title');
        
        // Botões de controle
        this.prevBtn = document.getElementById('pdfPrevPage');
        this.nextBtn = document.getElementById('pdfNextPage');
        this.zoomInBtn = document.getElementById('pdfZoomIn');
        this.zoomOutBtn = document.getElementById('pdfZoomOut');
        this.closeBtn = document.getElementById('closePdfViewer');
        this.toggleBtn = document.getElementById('togglePdfViewer');
    }
    
    initEventListeners() {
        // Toggle do visualizador
        this.toggleBtn.addEventListener('click', () => this.toggle());
        this.closeBtn.addEventListener('click', () => this.hide());
        
        // Controles de navegação
        this.prevBtn.addEventListener('click', () => this.prevPage());
        this.nextBtn.addEventListener('click', () => this.nextPage());
        
        // Controles de zoom
        this.zoomInBtn.addEventListener('click', () => this.zoomIn());
        this.zoomOutBtn.addEventListener('click', () => this.zoomOut());
        
        // Upload de arquivo
        this.uploadArea.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Teclas de atalho
        document.addEventListener('keydown', (e) => {
            if (this.viewer.style.display === 'flex') {
                switch(e.key) {
                    case 'ArrowLeft':
                        e.preventDefault();
                        this.prevPage();
                        break;
                    case 'ArrowRight':
                        e.preventDefault();
                        this.nextPage();
                        break;
                    case '+':
                    case '=':
                        e.preventDefault();
                        this.zoomIn();
                        break;
                    case '-':
                        e.preventDefault();
                        this.zoomOut();
                        break;
                    case 'Escape':
                        e.preventDefault();
                        this.hide();
                        break;
                }
            }
        });
    }
    
    initDragAndDrop() {
        // Drag and drop
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.classList.add('dragover');
        });
        
        this.uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('dragover');
        });
        
        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].type === 'application/pdf') {
                this.loadPDF(files[0]);
            } else {
                this.showError('Por favor, selecione um arquivo PDF válido.');
            }
        });
    }
    
    initDraggable() {
        const header = this.viewer.querySelector('.pdf-header');
        let isDragging = false;
        let currentX, currentY, initialX, initialY;
        let xOffset = 0, yOffset = 0;
        
        header.addEventListener('mousedown', (e) => {
            if (e.target.closest('.pdf-control-btn')) return;
            
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
            isDragging = true;
            this.viewer.style.transition = 'none';
        });
        
        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
                xOffset = currentX;
                yOffset = currentY;
                
                // Limitar movimento dentro da viewport
                const rect = this.viewer.getBoundingClientRect();
                const maxX = window.innerWidth - rect.width;
                const maxY = window.innerHeight - rect.height;
                
                currentX = Math.max(0, Math.min(currentX, maxX));
                currentY = Math.max(0, Math.min(currentY, maxY));
                
                this.viewer.style.transform = `translate(${currentX}px, ${currentY}px)`;
            }
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
            this.viewer.style.transition = 'all 0.3s ease';
        });
    }
    
    toggle() {
        if (this.viewer.style.display === 'flex') {
            this.hide();
        } else {
            this.show();
        }
    }
    
    show() {
        this.viewer.style.display = 'flex';
    }
    
    hide() {
        this.viewer.style.display = 'none';
    }
    
    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file && file.type === 'application/pdf') {
            this.loadPDF(file);
        } else {
            this.showError('Por favor, selecione um arquivo PDF válido.');
        }
    }
    
    async loadPDF(file) {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoading();
        
        try {
            const arrayBuffer = await file.arrayBuffer();
            this.pdfDoc = await pdfjsLib.getDocument(arrayBuffer).promise;
            this.totalPages = this.pdfDoc.numPages;
            this.currentPage = 1;
            
            this.title.textContent = `📄 ${file.name}`;
            this.createCanvas();
            await this.renderPage();
            this.updateControls();
            
        } catch (error) {
            console.error('Erro ao carregar PDF:', error);
            this.showError('Erro ao carregar o arquivo PDF. Verifique se o arquivo não está corrompido.');
        } finally {
            this.isLoading = false;
        }
    }
    
    createCanvas() {
        // Remover canvas anterior se existir
        const existingCanvas = this.content.querySelector('.pdf-canvas');
        if (existingCanvas) {
            existingCanvas.remove();
        }
        
        // Criar novo canvas
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'pdf-canvas';
        this.ctx = this.canvas.getContext('2d');
        
        // Limpar área de upload e adicionar canvas
        this.content.innerHTML = '';
        this.content.appendChild(this.canvas);
    }
    
    async renderPage() {
        if (!this.pdfDoc || this.isLoading) return;
        
        try {
            const page = await this.pdfDoc.getPage(this.currentPage);
            const viewport = page.getViewport({ scale: this.scale });
            
            this.canvas.height = viewport.height;
            this.canvas.width = viewport.width;
            
            const renderContext = {
                canvasContext: this.ctx,
                viewport: viewport
            };
            
            await page.render(renderContext).promise;
            this.updatePageInfo();
            
        } catch (error) {
            console.error('Erro ao renderizar página:', error);
            this.showError('Erro ao renderizar a página do PDF.');
        }
    }
    
    prevPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.renderPage();
        }
    }
    
    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.renderPage();
        }
    }
    
    zoomIn() {
        this.scale = Math.min(this.scale * 1.2, 3.0);
        this.renderPage();
    }
    
    zoomOut() {
        this.scale = Math.max(this.scale / 1.2, 0.5);
        this.renderPage();
    }
    
    updateControls() {
        this.prevBtn.disabled = this.currentPage <= 1;
        this.nextBtn.disabled = this.currentPage >= this.totalPages;
        this.updatePageInfo();
    }
    
    updatePageInfo() {
        this.pageInfo.textContent = `${this.currentPage}/${this.totalPages}`;
        this.updateControls();
    }
    
    showLoading() {
        this.content.innerHTML = '<div class="pdf-loading">Carregando PDF...</div>';
    }
    
    showError(message) {
        this.content.innerHTML = `<div class="pdf-error">${message}</div>`;
    }
}

// Inicializar visualizador PDF quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    if (typeof pdfjsLib !== 'undefined') {
        window.pdfViewer = new PDFViewer();
    } else {
        console.error('PDF.js não foi carregado corretamente');
    }
});

// Gerenciador de Arquivos com Supabase Storage
class FileManager {
    constructor() {
        this.currentPath = '';
        this.selectedFiles = new Set();
        this.isLoading = false;
        this.bucketName = 'project-files';
        
        this.initElements();
        this.initEventListeners();
        this.initDragAndDrop();
        this.initDraggable();
        this.initContextMenu();
        
        // Criar bucket se não existir
        this.ensureBucket();
    }
    
    initElements() {
        this.manager = document.getElementById('fileManager');
        this.content = document.querySelector('.file-manager-content');
        this.fileList = document.getElementById('fileList');
        this.breadcrumb = document.getElementById('breadcrumb');
        this.uploadArea = document.getElementById('fileUploadArea');
        this.fileInput = document.getElementById('fileManagerInput');
        this.contextMenu = document.getElementById('contextMenu');
        
        // Botões
        this.toggleBtn = document.getElementById('toggleFileManager');
        this.closeBtn = document.getElementById('closeFileManager');
        this.refreshBtn = document.getElementById('refreshFiles');
        this.createFolderBtn = document.getElementById('createFolder');
        this.uploadBtn = document.getElementById('uploadFile');
    }
    
    initEventListeners() {
        // Toggle do gerenciador
        this.toggleBtn.addEventListener('click', () => this.toggle());
        this.closeBtn.addEventListener('click', () => this.hide());
        this.refreshBtn.addEventListener('click', () => this.loadFiles());
        
        // Ações de pasta
        this.createFolderBtn.addEventListener('click', () => this.createFolder());
        this.uploadBtn.addEventListener('click', () => this.fileInput.click());
        
        // Upload de arquivos
        this.uploadArea.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Navegação breadcrumb
        this.breadcrumb.addEventListener('click', (e) => {
            if (e.target.classList.contains('breadcrumb-item')) {
                const path = e.target.dataset.path;
                this.navigateToPath(path);
            }
        });
        
        // Context menu
        this.contextMenu.addEventListener('click', (e) => {
            if (e.target.classList.contains('context-menu-item')) {
                const action = e.target.dataset.action;
                this.handleContextAction(action);
                this.hideContextMenu();
            }
        });
        
        // Fechar context menu ao clicar fora
        document.addEventListener('click', () => this.hideContextMenu());
    }
    
    initDragAndDrop() {
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.classList.add('dragover');
        });
        
        this.uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('dragover');
        });
        
        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('dragover');
            
            const files = Array.from(e.dataTransfer.files);
            this.uploadFiles(files);
        });
    }
    
    initDraggable() {
        const header = this.manager.querySelector('.file-manager-header');
        let isDragging = false;
        let currentX, currentY, initialX, initialY;
        let xOffset = 0, yOffset = 0;
        
        header.addEventListener('mousedown', (e) => {
            if (e.target.closest('.file-manager-btn')) return;
            
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
            isDragging = true;
            this.manager.style.transition = 'none';
        });
        
        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
                xOffset = currentX;
                yOffset = currentY;
                
                const rect = this.manager.getBoundingClientRect();
                const maxX = window.innerWidth - rect.width;
                const maxY = window.innerHeight - rect.height;
                
                currentX = Math.max(0, Math.min(currentX, maxX));
                currentY = Math.max(0, Math.min(currentY, maxY));
                
                this.manager.style.transform = `translate(${currentX}px, ${currentY}px)`;
            }
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
            this.manager.style.transition = 'all 0.3s ease';
        });
    }
    
    initContextMenu() {
        this.fileList.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            
            const fileItem = e.target.closest('.file-item');
            if (fileItem) {
                this.selectedFiles.clear();
                this.selectedFiles.add(fileItem.dataset.path);
                this.updateFileSelection();
                this.showContextMenu(e.clientX, e.clientY);
            }
        });
    }
    
    async ensureBucket() {
        try {
            const { data, error } = await supabase.storage.getBucket(this.bucketName);
            if (error && error.statusCode === 404) {
                // Bucket não existe, criar
                const { error: createError } = await supabase.storage.createBucket(this.bucketName, {
                    public: true,
                    allowedMimeTypes: ['application/pdf', 'model/gltf-binary', 'model/gltf+json', 'image/*', 'application/octet-stream']
                });
                if (createError) {
                    console.error('Erro ao criar bucket:', createError);
                }
            }
        } catch (error) {
            console.error('Erro ao verificar bucket:', error);
        }
    }
    
    toggle() {
        if (this.manager.style.display === 'flex') {
            this.hide();
        } else {
            this.show();
        }
    }
    
    show() {
        this.manager.style.display = 'flex';
        this.loadFiles();
    }
    
    hide() {
        this.manager.style.display = 'none';
    }
    
    async loadFiles() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoading();
        
        try {
            const { data, error } = await supabase.storage
                .from(this.bucketName)
                .list(this.currentPath, {
                    limit: 100,
                    offset: 0
                });
            
            if (error) {
                console.error('Erro ao carregar arquivos:', error);
                this.showError('Erro ao carregar arquivos');
                return;
            }
            
            this.renderFiles(data || []);
            this.updateBreadcrumb();
            
        } catch (error) {
            console.error('Erro ao carregar arquivos:', error);
            this.showError('Erro ao carregar arquivos');
        } finally {
            this.isLoading = false;
        }
    }
    
    renderFiles(files) {
        this.fileList.innerHTML = '';
        
        // Adicionar botão "voltar" se não estiver na raiz
        if (this.currentPath) {
            const backItem = this.createFileItem({
                name: '..',
                id: 'back',
                metadata: { isFolder: true }
            });
            this.fileList.appendChild(backItem);
        }
        
        // Separar pastas e arquivos
        const folders = files.filter(f => !f.metadata?.size);
        const regularFiles = files.filter(f => f.metadata?.size);
        
        // Renderizar pastas primeiro
        folders.forEach(folder => {
            const item = this.createFileItem(folder);
            this.fileList.appendChild(item);
        });
        
        // Renderizar arquivos
        regularFiles.forEach(file => {
            const item = this.createFileItem(file);
            this.fileList.appendChild(item);
        });
    }
    
    createFileItem(file) {
        const li = document.createElement('li');
        li.className = 'file-item';
        li.dataset.path = file.name;
        li.dataset.isFolder = !file.metadata?.size ? 'true' : 'false';
        
        const icon = this.getFileIcon(file);
        const size = file.metadata?.size ? this.formatFileSize(file.metadata.size) : '';
        
        li.innerHTML = `
            <span class="file-icon">${icon}</span>
            <span class="file-name">${file.name}</span>
            <span class="file-size">${size}</span>
            <div class="file-actions">
                ${file.name !== '..' ? `
                    <button class="file-action-btn" data-action="download" title="Download">⬇</button>
                    <button class="file-action-btn" data-action="rename" title="Renomear">✏</button>
                    <button class="file-action-btn delete" data-action="delete" title="Excluir">🗑</button>
                ` : ''}
            </div>
        `;
        
        // Event listeners
        li.addEventListener('click', (e) => {
            if (e.target.classList.contains('file-action-btn')) {
                e.stopPropagation();
                const action = e.target.dataset.action;
                this.handleFileAction(action, file);
            } else {
                this.handleFileClick(file);
            }
        });
        
        return li;
    }
    
    getFileIcon(file) {
        if (file.name === '..') return '⬆️';
        if (!file.metadata?.size) return '📁';
        
        const ext = file.name.split('.').pop().toLowerCase();
        const iconMap = {
            'pdf': '📄',
            'glb': '🎯',
            'gltf': '🎯',
            'jpg': '🖼️',
            'jpeg': '🖼️',
            'png': '🖼️',
            'dwg': '📐',
            'ifc': '🏗️',
            'rvt': '🏠'
        };
        
        return iconMap[ext] || '📄';
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
    
    handleFileClick(file) {
        if (file.name === '..') {
            // Voltar para pasta pai
            const pathParts = this.currentPath.split('/').filter(p => p);
            pathParts.pop();
            this.currentPath = pathParts.join('/');
            this.loadFiles();
        } else if (!file.metadata?.size) {
            // É uma pasta, navegar para ela
            this.currentPath = this.currentPath ? `${this.currentPath}/${file.name}` : file.name;
            this.loadFiles();
        } else {
            // É um arquivo, abrir
            this.openFile(file);
        }
    }
    
    async openFile(file) {
        const ext = file.name.split('.').pop().toLowerCase();
        const filePath = this.currentPath ? `${this.currentPath}/${file.name}` : file.name;
        
        try {
            const { data } = supabase.storage
                .from(this.bucketName)
                .getPublicUrl(filePath);
            
            if (ext === 'pdf') {
                // Abrir no visualizador PDF
                if (window.pdfViewer) {
                    window.pdfViewer.show();
                    // Carregar PDF da URL
                    fetch(data.publicUrl)
                        .then(response => response.blob())
                        .then(blob => {
                            const file = new File([blob], file.name, { type: 'application/pdf' });
                            window.pdfViewer.loadPDF(file);
                        });
                }
            } else if (ext === 'glb' || ext === 'gltf' || ext === 'obj' || ext === 'fbx' || ext === 'stl' || ext === 'dae' || ext === '3ds' || ext === 'ply' || ext === 'ifc') {
                // Carregar no visualizador 3D
                settings.externalModelUrl = data.publicUrl;
                loadExternalModel();
            } else {
                // Abrir em nova aba
                window.open(data.publicUrl, '_blank');
            }
        } catch (error) {
            console.error('Erro ao abrir arquivo:', error);
            alert('Erro ao abrir arquivo');
        }
    }
    
    async handleFileAction(action, file) {
        const filePath = this.currentPath ? `${this.currentPath}/${file.name}` : file.name;
        
        switch (action) {
            case 'download':
                await this.downloadFile(filePath);
                break;
            case 'rename':
                await this.renameFile(file);
                break;
            case 'delete':
                await this.deleteFile(filePath);
                break;
        }
    }
    
    async downloadFile(filePath) {
        try {
            const { data } = supabase.storage
                .from(this.bucketName)
                .getPublicUrl(filePath);
            
            const link = document.createElement('a');
            link.href = data.publicUrl;
            link.download = filePath.split('/').pop();
            link.click();
        } catch (error) {
            console.error('Erro ao fazer download:', error);
            alert('Erro ao fazer download do arquivo');
        }
    }
    
    async renameFile(file) {
        const newName = prompt('Novo nome:', file.name);
        if (!newName || newName === file.name) return;
        
        const oldPath = this.currentPath ? `${this.currentPath}/${file.name}` : file.name;
        const newPath = this.currentPath ? `${this.currentPath}/${newName}` : newName;
        
        try {
            const { error } = await supabase.storage
                .from(this.bucketName)
                .move(oldPath, newPath);
            
            if (error) {
                console.error('Erro ao renomear:', error);
                alert('Erro ao renomear arquivo');
            } else {
                this.loadFiles();
            }
        } catch (error) {
            console.error('Erro ao renomear:', error);
            alert('Erro ao renomear arquivo');
        }
    }
    
    async deleteFile(filePath) {
        if (!confirm('Tem certeza que deseja excluir este arquivo?')) return;
        
        try {
            const { error } = await supabase.storage
                .from(this.bucketName)
                .remove([filePath]);
            
            if (error) {
                console.error('Erro ao excluir:', error);
                alert('Erro ao excluir arquivo');
            } else {
                this.loadFiles();
            }
        } catch (error) {
            console.error('Erro ao excluir:', error);
            alert('Erro ao excluir arquivo');
        }
    }
    
    async createFolder() {
        const folderName = prompt('Nome da pasta:');
        if (!folderName) return;
        
        const folderPath = this.currentPath ? `${this.currentPath}/${folderName}/.keep` : `${folderName}/.keep`;
        
        try {
            const { error } = await supabase.storage
                .from(this.bucketName)
                .upload(folderPath, new Blob([''], { type: 'text/plain' }));
            
            if (error) {
                console.error('Erro ao criar pasta:', error);
                alert('Erro ao criar pasta');
            } else {
                this.loadFiles();
            }
        } catch (error) {
            console.error('Erro ao criar pasta:', error);
            alert('Erro ao criar pasta');
        }
    }
    
    async handleFileSelect(event) {
        const files = Array.from(event.target.files);
        await this.uploadFiles(files);
        event.target.value = ''; // Reset input
    }
    
    async uploadFiles(files) {
        if (files.length === 0) return;
        
        this.showLoading();
        
        for (const file of files) {
            try {
                const filePath = this.currentPath ? `${this.currentPath}/${file.name}` : file.name;
                
                const { error } = await supabase.storage
                    .from(this.bucketName)
                    .upload(filePath, file, {
                        cacheControl: '3600',
                        upsert: true
                    });
                
                if (error) {
                    console.error(`Erro ao fazer upload de ${file.name}:`, error);
                    alert(`Erro ao fazer upload de ${file.name}`);
                }
            } catch (error) {
                console.error(`Erro ao fazer upload de ${file.name}:`, error);
                alert(`Erro ao fazer upload de ${file.name}`);
            }
        }
        
        this.loadFiles();
    }
    
    navigateToPath(path) {
        this.currentPath = path;
        this.loadFiles();
    }
    
    updateBreadcrumb() {
        const parts = this.currentPath ? this.currentPath.split('/') : [];
        let html = '<span class="breadcrumb-item" data-path="">📁 Raiz</span>';
        
        let currentPath = '';
        parts.forEach((part, index) => {
            currentPath += (index > 0 ? '/' : '') + part;
            html += `<span class="breadcrumb-separator">/</span>`;
            html += `<span class="breadcrumb-item" data-path="${currentPath}">📁 ${part}</span>`;
        });
        
        this.breadcrumb.innerHTML = html;
    }
    
    updateFileSelection() {
        this.fileList.querySelectorAll('.file-item').forEach(item => {
            if (this.selectedFiles.has(item.dataset.path)) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
    }
    
    showContextMenu(x, y) {
        this.contextMenu.style.left = x + 'px';
        this.contextMenu.style.top = y + 'px';
        this.contextMenu.style.display = 'block';
    }
    
    hideContextMenu() {
        this.contextMenu.style.display = 'none';
    }
    
    handleContextAction(action) {
        const selectedPath = Array.from(this.selectedFiles)[0];
        if (!selectedPath) return;
        
        // Implementar ações do context menu
        console.log(`Ação ${action} para ${selectedPath}`);
    }
    
    showLoading() {
        this.fileList.innerHTML = '<li class="loading-spinner"><div class="spinner-small"></div>Carregando...</li>';
    }
    
    showError(message) {
        this.fileList.innerHTML = `<li style="color: #ff6b6b; text-align: center; padding: 20px;">${message}</li>`;
    }
}

// Inicializar gerenciador de arquivos quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    window.fileManager = new FileManager();
});
