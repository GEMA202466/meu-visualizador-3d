# Visualizador 3D para Wix com Three.js

Este repositório contém um template básico para criar um visualizador de modelos 3D (GLB) utilizando a biblioteca [Three.js](https://threejs.org/) e publicá-lo no GitHub Pages, tornando-o facilmente incorporável em sites como o Wix via `iframe`.

## Visão Geral

O objetivo deste projeto é fornecer uma solução leve e personalizável para exibir modelos 3D interativos em plataformas que não oferecem suporte nativo ou possuem plugins caros para visualização BIM/3D. Ao hospedar o visualizador no GitHub Pages, você garante alta disponibilidade e desempenho, além de total controle sobre a experiência do usuário.

## Estrutura do Projeto

O repositório é composto pelos seguintes arquivos:

*   `index.html`: O arquivo HTML principal que carrega o visualizador 3D. Ele inclui os scripts do Three.js e define a estrutura básica da página.
*   `script.js`: O código JavaScript responsável por inicializar a cena 3D, configurar a câmera, luzes, controles de órbita e carregar o modelo `.glb`. Também gerencia o redimensionamento da janela e a animação da cena.
*   `modelo.glb`: Um modelo 3D de exemplo no formato GLB. Este arquivo deve ser substituído pelo seu próprio modelo 3D.

## Como Usar

Siga os passos abaixo para configurar e usar seu visualizador 3D:

### 1. Clonar o Repositório

Primeiro, clone este repositório para sua máquina local:

```bash
git clone https://github.com/GEMA202466/meu-visualizador-3d.git
cd meu-visualizador-3d
```

### 2. Substituir o Modelo 3D

Substitua o arquivo `modelo.glb` pelo seu próprio modelo 3D. Certifique-se de que seu modelo esteja no formato `.glb` e mantenha o nome do arquivo como `modelo.glb` para que o `script.js` possa carregá-lo corretamente.

Se o seu modelo estiver em outro formato (como `.ifc` ou `.obj`), você precisará convertê-lo para `.glb`. Ferramentas como o [Blender](https://www.blender.org/) são excelentes para isso. Você pode importar seu modelo e exportá-lo como `.glb`.

### 3. Publicar no GitHub Pages

Se você ainda não publicou seu repositório no GitHub Pages, siga estas instruções:

1.  No seu repositório GitHub, vá para **Settings** (Configurações).
2.  No menu lateral esquerdo, clique em **Pages**.
3.  Em "Source", selecione a branch `master` (ou `main`, dependendo da configuração do seu repositório) e a pasta `/(root)`.
4.  Clique em **Save**.

Após alguns minutos, seu visualizador estará disponível em um URL como `https://SEU_USUARIO.github.io/meu-visualizador-3d/`.

### 4. Incorporar no Wix (ou outra plataforma)

Para incorporar o visualizador no seu site Wix:

1.  No editor do Wix, adicione um elemento **"Embed Code"** ou **"HTML iframe"**.
2.  Na caixa de código, insira o seguinte `iframe`, substituindo `SEU_USUARIO` pelo seu nome de usuário do GitHub:

    ```html
    <iframe
        src="https://SEU_USUARIO.github.io/meu-visualizador-3d/"
        width="100%"
        height="600px"
        frameborder="0"
        allowfullscreen
        allow="autoplay; fullscreen; xr-spatial-tracking; vr;"
    ></iframe>
    ```

3.  Ajuste a `width` e `height` conforme necessário para o layout do seu site.

## Personalização e Controles Interativos

O visualizador agora inclui um painel de controle interativo que permite ajustar diversas propriedades em tempo real, sem a necessidade de editar o código. O visualizador agora possui duas interfaces distintas para facilitar o uso:

*   **Painel de Controle 3D (⚙️):** Acessível pelo ícone de engrenagem, este painel contém todas as opções de personalização da visualização 3D (fundo, iluminação, modelo, ponto de rotação, grade e carregamento de modelos).
*   **Modal de Informações do Projeto (📋):** Acessível pelo ícone de prancheta, este modal contém todos os campos para preenchimento de informações do projeto e os botões para geração de QR Code e compartilhamento via WhatsApp.

### **Integração com Supabase**

Este visualizador agora está integrado com o Supabase para persistência de dados. As informações do projeto preenchidas no modal são salvas em um banco de dados Supabase. Ao gerar um QR Code, ele incluirá um `project_id` que permite ao visualizador carregar automaticamente as informações do projeto e, se configurado, o modelo 3D associado diretamente do Supabase.

**Como funciona:**
1.  Preencha os campos no **Modal de Informações do Projeto (📋)**.
2.  Ao clicar em "📱 Gerar QR Code + CSV", os dados são salvos no Supabase e um `project_id` único é gerado.
3.  O QR Code e o CSV gerados conterão um link para o visualizador com este `project_id` na URL (ex: `https://seusite.com/?project_id=SEU_ID_DO_PROJETO`).
4.  Quando alguém acessa o visualizador com este `project_id` na URL, as informações do projeto são automaticamente carregadas do Supabase e exibidas no modal.
5.  Se o projeto salvo no Supabase tiver uma `external_model_url` associada, o modelo será carregado automaticamente ao abrir o visualizador com o `project_id`.

### Controles do Painel:

*   **Fundo:**
    *   **Tipo de fundo:** Escolha entre `Cor sólida` ou `Gradiente`.
    *   **Cor (sólida):** Selecione a cor de fundo desejada.
    *   **Gradiente (Superior/Inferior):** Defina as cores para o gradiente de fundo.

*   **Iluminação:**
    *   **Cor da luz:** Altere a cor geral das luzes na cena.
    *   **Ambiente:** Ajuste a intensidade da luz ambiente (iluminação geral).
    *   **Principal:** Controle a intensidade da luz direcional principal (com sombras).
    *   **Preenchimento:** Ajuste a intensidade da luz de preenchimento (para suavizar sombras).

*   **Modelo:**
    *   **Transparência:** Altere a opacidade do modelo 3D (de 0.1 a 1.0).
    *   **Rotação automática:** Ative ou desative a rotação automática do modelo.
    *   **Cores originais:** Mantenha as cores originais do modelo ou use uma cor sólida.
    *   **Cor sólida:** Defina uma cor sólida para o modelo (ativa quando "Cores originais" está desativado).

*   **Ponto de Rotação:**
    *   **X, Y, Z:** Ajuste as coordenadas do ponto em torno do qual o modelo irá rotacionar. Útil para inspecionar partes específicas do modelo.

*   **Grade do Chão:**
    *   **Mostrar grade:** Ative ou desative a visibilidade do plano de grade.
    *   **Cor da grade:** Altere a cor das linhas da grade.
    *   **Posição X, Y, Z:** Ajuste a posição da grade no espaço 3D.
    *   **Rotação X, Y, Z (°):** Gire a grade nos eixos X, Y e Z (em graus).

*   **Modelo Externo:**
    *   **Upload de arquivo GLB:** Permite carregar um modelo GLB ou GLTF diretamente do seu computador.
    *   **URL do modelo GLB:** Insira uma URL de um modelo GLB hospedado externamente (ex: Google Drive, Dropbox, GitHub Raw). O visualizador tentará carregar este modelo.
    *   **Carregar da URL:** Botão para carregar o modelo da URL fornecida.

*   **Informações do Projeto:**
    *   **Nome do Projeto, Etapa, Descrição, Responsável:** Campos para preencher detalhes sobre o projeto BIM.
    *   **WhatsApp, E-mail:** Campos para informações de contato.

*   **Compartilhamento:**
    *   **📱 Gerar QR Code + CSV:** Gera um QR Code com todas as informações do projeto preenchidas e um link para o visualizador atual. Também baixa um arquivo CSV com esses dados.
    *   **💬 Enviar WhatsApp:** Abre uma conversa no WhatsApp com uma mensagem pré-preenchida contendo as informações do projeto e o link do visualizador.

### Controles Básicos do Visualizador:

*   **Arrastar (mouse):** Rotacionar o modelo (agora com rotação vertical completa).
*   **Scroll (mouse):** Zoom in/out.
*   **Shift + Arrastar (mouse):** Pan (mover o modelo lateralmente).
*   **Duplo clique (mouse):** Resetar a visualização para a posição inicial.

--- 

Desenvolvido por Manus AI.



