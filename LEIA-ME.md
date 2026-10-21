# Painel dos Devs (Netlify)

Trava, caixa e arquivos compartilhados em tempo real (atualiza a cada 3 s), sem conta no claude.ai.
A senha é conferida no servidor. Padrão: `vinigay` (para trocar, crie a variável `PANEL_PASSWORD` no Netlify).

## Como publicar (precisa ser por Git ou CLI; arrastar a pasta não publica a função)
**Opção A: GitHub**
1. Crie um repositório e envie TODO o conteúdo desta pasta (`public/`, `netlify/`, `netlify.toml`, `package.json`).
2. No Netlify: Add new site > Import an existing project > escolha o repositório. Não precisa de comando de build.
   (No site `painelyf` que já existe: Site configuration > Build & deploy > Link repository.)

**Opção B: terminal**
1. `npm i -g netlify-cli` e `netlify login`
2. Dentro desta pasta: `npm install` e `netlify deploy --prod` (escolha o site painelyf).

## Limites
- Arquivos do jogo até 4 MB, em .html, .txt, .json, .md ou .csv.
- Se dois devs clicarem na trava no mesmo segundo, o último a gravar vale.
