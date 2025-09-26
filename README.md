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

O visualizador agora inclui um painel de controle interativo que permite ajustar diversas propriedades em tempo real, sem a necessidade de editar o código. Para acessar o painel, clique no ícone de engrenagem (⚙️) no canto superior direito da tela.

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

*   **Grade do Chão:**
    *   **Mostrar grade:** Ative ou desative a visibilidade do plano de grade.
    *   **Cor da grade:** Altere a cor das linhas da grade.

### Controles Básicos do Visualizador:

*   **Arrastar (mouse):** Rotacionar o modelo (agora com rotação vertical completa).
*   **Scroll (mouse):** Zoom in/out.
*   **Shift + Arrastar (mouse):** Pan (mover o modelo lateralmente).
*   **Duplo clique (mouse):** Resetar a visualização para a posição inicial.

--- 

Desenvolvido por Manus AI.



