# Painel dos Devs

Painel privado para desenvolvedores, com autenticação por senha, compartilhamento de arquivos e informações entre os membros da equipe.

## Funcionalidades

- Acesso protegido por senha validada no servidor.
- Compartilhamento de arquivos e informações.
- Atualização periódica dos dados do painel.
- Armazenamento de dados com Netlify Blobs, conforme a configuração do projeto.

## Tecnologias

- HTML, CSS e JavaScript.
- Netlify Functions.
- Netlify Blobs.
- GitHub para versionamento do código.
- Netlify para hospedagem e execução das funções.

## Estrutura do projeto

```text
onlinepainelgame/
├── public/
│   └── index.html
├── netlify/
│   └── functions/
│       └── api.mjs
├── netlify.toml
├── package.json
└── README.md
```

## Publicação no Netlify

1. Envie os arquivos do projeto para este repositório do GitHub.
2. No Netlify, conecte o site ao repositório.
3. Confira as configurações de publicação e funções no arquivo `netlify.toml`.
4. Configure a variável de ambiente `PANEL_PASSWORD` no Netlify.
5. Faça uma nova implantação e confira os logs para verificar se ocorreu algum erro.

## Segurança

- Configure uma senha forte por meio da variável `PANEL_PASSWORD`.
- Não armazene senhas reais diretamente no código-fonte.
- Restrinja o acesso ao repositório se o projeto contiver informações privadas.
- Proteja os endpoints da API e valide as permissões no servidor.

## Manutenção

Faça alterações no código com cuidado e teste o funcionamento do painel após cada implantação.

---

Projeto pessoal para uso e colaboração entre desenvolvedores.
