
# Votaí

**Simulador de urna eletrônica desenvolvido com HTML, CSS e JavaScript.**

O Votaí é um projeto de simulação eleitoral que reproduz a experiência básica de uma urna eletrônica brasileira. Permite cadastrar candidatos, registrar votos e acompanhar os resultados de uma eleição fictícia.

## Funcionalidades

- Interface inspirada na urna eletrônica brasileira.
- Cadastro de candidatos com nome, partido, número e foto.
- Upload de imagens por arquivo, arrastar e soltar ou URL.
- Registro de votos por meio do teclado virtual.
- Opções de voto em branco e correção.
- Efeitos sonoros durante a votação.
- Pesquisa de candidatos cadastrados.
- Ranking de candidatos com mais votos.
- Armazenamento de dados no navegador utilizando `localStorage`.

## Tecnologias utilizadas

- HTML5
- CSS3
- JavaScript
- LocalStorage API

## Como executar

1. Clone este repositório ou baixe os arquivos do projeto.
2. Abra a pasta do projeto.
3. Execute o arquivo `index.html` em seu navegador.

Não é necessário instalar dependências ou configurar um servidor.

## Estrutura do projeto

```text
votai/
├── assets/
│   └── audio/
<<<<<<< HEAD
│       ├── beep.mp3
│       └── confirm.mp3
=======
│       ├── tecla.mp3
│       └── confirmar.mp3
>>>>>>> c9de8a2e515678768920752bf4a5227bab3d0676
├── index.html
├── style.css
└── script.js
```

## Armazenamento

Os candidatos cadastrados e os votos são armazenados localmente no navegador por meio do `localStorage`.

Isso significa que os dados permanecem disponíveis no mesmo navegador e dispositivo, mas não são compartilhados automaticamente entre diferentes usuários ou dispositivos.

## Observação

O Votaí é um site desenvolvido totalmente para diversão e entretenimento, permitindo que as pessoas criem eleições fictícias, cadastrem candidatos e se divirtam simulando votações.
