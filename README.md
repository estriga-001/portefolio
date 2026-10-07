# Portfolio — Cybersecurity & Networking

Single Page Application de portefólio construída com Vite, Three.js, GSAP,
ScrollTrigger e Lenis. A experiência combina conteúdo HTML acessível com uma
topologia de rede WebGL que reage subtilmente ao rato e transita entre estados
de câmara à medida que a página é percorrida.

## Estrutura

```text
.
├── .github/workflows/deploy.yml
├── index.html
├── package.json
├── vite.config.js
├── public/
│   ├── favicon.svg
│   └── assets/
│       ├── certifications/
│       └── projects/
└── src/
    ├── config.js
    ├── main.js
    ├── style.css
    ├── animations/
    │   └── scroll.js
    └── three/
        ├── interactions.js
        ├── network.js
        ├── particles.js
        └── scene.js
```

O PDF preexistente em `assets/cv/` foi preservado, mas não é publicado nem
apresentado na interface atual.

## Personalização

Altera os dados pessoais apenas em `src/config.js`:

```js
export const profile = {
  name: '[MY NAME]',
  initials: '[INITIALS]',
  email: '[EMAIL]',
  linkedin: '[LINKEDIN_URL]',
  github: '[GITHUB_URL]',
  location: '[LOCATION]',
};
```

Enquanto um valor permanecer no formato `[PLACEHOLDER]`, o respetivo link de
contacto fica desativado de forma segura. Durante a build, o Vite também injeta
o nome configurado no título e nos metadados Open Graph do HTML estático.

Para substituir os símbolos neutros dos certificados por logótipos oficiais,
mantém estes nomes:

- `public/assets/certifications/fortinet.svg`
- `public/assets/certifications/cisco.svg`
- `public/assets/certifications/nau.svg`

Se uma imagem não existir, as iniciais em CSS continuam a manter o card correto.

O futuro projeto está claramente identificado em `index.html` pelo comentário
`FUTURE PROJECT`. Substitui apenas esse artigo quando o projeto estiver pronto.

## Instalação e execução local

Requer Node.js 20.19+ ou 22.12+.

```bash
npm install
npm run dev
```

O Vite apresenta no terminal o endereço local, normalmente
`http://localhost:5173`.

## Build e teste da build

```bash
npm run build
npm run preview
```

O primeiro comando cria a versão estática em `dist/`. O segundo serve exatamente
essa versão para validação local. A configuração `base: './'` mantém JavaScript,
CSS e assets funcionais quando o site é publicado num subdiretório do GitHub Pages.

## Publicação manual no GitHub Pages

O método automático descrito abaixo é o recomendado. Para publicar manualmente:

1. Executa `npm run build`.
2. Cria uma branch `gh-pages` cujo conteúdo seja **o interior** de `dist/`, e não
   a pasta `dist` como subpasta.
3. Envia essa branch para o GitHub.
4. Em **Settings → Pages → Build and deployment**, escolhe **Deploy from a branch**.
5. Seleciona a branch `gh-pages` e a pasta `/(root)`.

Uma forma isolada de criar essa branch sem alterar a branch principal é copiar o
conteúdo de `dist/` para um diretório temporário, iniciar aí um repositório Git e
enviá-lo para `gh-pages`:

```bash
npm run build
cd dist
git init
git checkout -b gh-pages
git add -A
git commit -m "Deploy portfolio"
git remote add origin https://github.com/UTILIZADOR/REPOSITORIO.git
git push --force origin gh-pages
```

Depois regressa à raiz do projeto. Como `dist/` é gerada novamente em cada build,
este repositório temporário pode ser eliminado sem afetar o código-fonte.

## Publicação automática com GitHub Actions

O workflow `.github/workflows/deploy.yml` já está preparado.

1. Envia o projeto para a branch `main` do GitHub.
2. Em **Settings → Pages → Build and deployment**, escolhe **GitHub Actions**.
3. Faz push para `main` ou abre **Actions → Deploy portfolio to GitHub Pages** e
   executa **Run workflow**.
4. O workflow instala as dependências, gera `dist/` e publica o artefacto oficial
   do Pages.

Não são necessários paths absolutos, servidor, base de dados ou variáveis secretas.

## Acessibilidade e performance

- O conteúdo mantém-se legível se WebGL falhar ou estiver indisponível.
- `prefers-reduced-motion` desliga o scroll suave e as transições de câmara.
- Em ecrãs compactos são reduzidos nodes, partículas, antialiasing e pixel ratio.
- A renderização é suspensa quando o separador fica invisível.
- O canvas é decorativo, ignorado por leitores de ecrã e fora da navegação por teclado.
