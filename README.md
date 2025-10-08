# Visualizador BIM 3D Avançado para Web

Este repositório contém um visualizador de modelos BIM 3D completo e personalizável, construído com [Three.js](https://threejs.org/) e integrado com [Supabase](https://supabase.io/) para gerenciamento de dados e arquivos. A aplicação é projetada para ser hospedada no GitHub Pages e facilmente incorporada em qualquer site (como Wix, WordPress, etc.) via `iframe`.

## ✨ Visão Geral dos Recursos

O objetivo deste projeto é fornecer uma solução **open-source, robusta e gratuita** para visualização e gerenciamento de projetos BIM na web, superando as limitações de plataformas que não oferecem suporte nativo ou possuem plugins caros.

### **Principais Funcionalidades:**

- **Visualizador 3D Interativo:**
  - **Suporte a Múltiplos Formatos:** Carrega **IFC, GLB, GLTF, OBJ, FBX, STL, DAE, 3DS, PLY**.
  - **Controles Avançados:** Rotação, zoom, pan, e ponto de rotação ajustável.
  - **Personalização Visual:** Controle total sobre fundo, iluminação, cores e transparência do modelo.
  - **Ferramentas de Análise:** Grade 3D ajustável e indicador de ponto de rotação.

- **Gerenciamento de Arquivos (com Supabase Storage):**
  - **Sistema de Pastas/Subpastas:** Organize seus arquivos de projeto de forma hierárquica.
  - **Upload por Drag & Drop:** Envie múltiplos arquivos de uma vez.
  - **Ações de Arquivo:** Download, renomear e excluir arquivos diretamente na interface.
  - **Abertura Inteligente:** Abre arquivos nos visualizadores apropriados (3D, PDF, imagem).

- **Visualizador de PDF Integrado:**
  - **Visualização Lado a Lado:** Analise documentos PDF (plantas, especificações) junto com o modelo 3D.
  - **Controles Completos:** Navegação por página, zoom e interface móvel.

- **Gerenciamento de Informações do Projeto (com Supabase DB):**
  - **Persistência de Dados:** Salve informações do projeto (nome, etapa, responsável) em um banco de dados.
  - **Compartilhamento via QR Code:** Gere um QR Code que carrega o projeto e suas informações automaticamente.
  - **Integração com WhatsApp:** Compartilhe o projeto com um link direto.

- **Interface Moderna e Responsiva:**
  - **Painéis Móveis e Redimensionáveis:** Organize seu espaço de trabalho como preferir.
  - **Suporte a Touch:** Totalmente funcional em dispositivos móveis.
  - **Design Limpo e Intuitivo:** Foco na usabilidade e experiência do usuário.

## 🚀 Como Usar

Siga os passos abaixo para configurar e usar seu próprio visualizador BIM:

### 1. Clonar o Repositório

```bash
git clone https://github.com/GEMA202466/meu-visualizador-3d.git
cd meu-visualizador-3d
```

### 2. Configurar o Supabase

Este projeto requer um projeto Supabase para funcionar. É gratuito para começar.

1.  Crie um projeto em [supabase.com](https://supabase.com/).
2.  Vá para **Project Settings > API** e copie a **URL** e a **Chave anônima (anon key)**.
3.  Cole essas chaves no início do arquivo `script.js`:

    ```javascript
    const SUPABASE_URL = 'SUA_URL_SUPABASE';
    const SUPABASE_ANON_KEY = 'SUA_CHAVE_ANON';
    ```

4.  Vá para **Storage** e crie um novo **Bucket** chamado `bim-files` (ou o nome que preferir, mas atualize no `script.js`).
5.  Vá para **Database** e crie uma tabela para as informações do projeto, se desejar usar essa funcionalidade.

### 3. Publicar no GitHub Pages

1.  No seu repositório GitHub, vá para **Settings > Pages**.
2.  Selecione a branch `master` (ou `main`) e a pasta `/(root)`.
3.  Clique em **Save**. Seu visualizador estará online em `https://SEU_USUARIO.github.io/meu-visualizador-3d/`.

### 4. Incorporar em seu Site

Adicione um elemento `iframe` no seu site (Wix, WordPress, etc.):

```html
<iframe
    src="https://SEU_USUARIO.github.io/meu-visualizador-3d/"
    width="100%"
    height="800px"
    frameborder="0"
    allowfullscreen
></iframe>
```

## 🔧 Detalhes das Funcionalidades

### **Formatos de Arquivo Suportados**

O visualizador foi projetado para ser agnóstico a formatos, suportando os principais padrões da indústria:

| Formato | Extensão | Suporte | Notas |
| :--- | :--- | :--- | :--- |
| **Industry Foundation Classes** | `.ifc` | ✅ **Completo** | Usa **ThatOpen/components** para parsing via WebAssembly. |
| **GL Transmission Format** | `.glb`, `.gltf` | ✅ **Nativo** | Padrão de ouro para 3D na web. |
| **Wavefront** | `.obj` | ✅ **Nativo** | Amplamente compatível. |
| **Autodesk FBX** | `.fbx` | ✅ **Nativo** | Padrão da indústria de animação e jogos. |
| **Stereolithography** | `.stl` | ✅ **Nativo** | Comum em CAD e impressão 3D. |
| **Collada** | `.dae` | ✅ **Nativo** | Formato de intercâmbio baseado em XML. |
| **3D Studio** | `.3ds` | ✅ **Nativo** | Legado, mas ainda comum. |
| **Polygon File Format** | `.ply` | ✅ **Nativo** | Usado para dados de escaneamento 3D. |

### **Painéis da Interface**

- **Painel de Controles (⚙️):** Ajuste todas as configurações visuais da cena 3D.
- **Gerenciador de Arquivos (📁):** Navegue, faça upload e gerencie os arquivos do seu projeto no Supabase Storage.
- **Visualizador de PDF (📄):** Abra e analise documentos PDF.
- **Informações do Projeto (📋):** Edite e salve os metadados do seu projeto.

--- 

Desenvolvido por Manus AI.

