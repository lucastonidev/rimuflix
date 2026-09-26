<div align="center">

  <img src="public/img/android-chrome-512x512.png" alt="Rimuflix Logo" width="120" height="120" />

  # 🎬 Rimuflix

  **Seu aplicativo de streaming de filmes, séries e animes sem complicações.**

  [![Node.js](https://img.shields.io/badge/Node.js-v18+-68a063?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
  [![Express](https://img.shields.io/badge/Express-5.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
  [![Electron](https://img.shields.io/badge/Electron-43.x-47848F?style=for-the-badge&logo=electron&logoColor=white)](https://www.electronjs.org/)
  [![TMDB API](https://img.shields.io/badge/TMDB%20API-v3-01b4e4?style=for-the-badge&logo=themoviedatabase&logoColor=white)](https://www.themoviedb.org/)
  [![License](https://img.shields.io/badge/License-ISC-blue?style=for-the-badge)](LICENSE)

</div>

---

## 📌 Sobre o Projeto

O **Rimuflix** é uma aplicação Desktop/Web híbrida desenvolvida para oferecer uma experiência de streaming leve, moderna e intuitiva. O app consolida um catálogo rico alimentado em tempo real por APIs externas, com reprodução multiplataforma através de servidores de hospedagem e streaming direto de torrents.

---

## ✨ Funcionalidades Principais

* 🚀 **Destaques & Catálogo da Home:** Exibição dinâmica de mídias em alta, filmes em cartaz e séries populares.
* 🔍 **Busca Avançada & Filtros:** Busque por título ou filtre por gênero, ano de lançamento, ordenação e plataformas de streaming.
* 📌 **Detalhes & Progresso (Continue Watching):** Visualização completa de detalhes, recomendações e gerenciamento automático do último episódio/temporada assistido.
* ⭐ **Minha Lista (Watchlist):** Salve seus títulos favoritos para acessar facilmente mais tarde.
* 🎥 **Multi-Player Integrado:** Alterne facilmente entre múltiplos servidores de hospedagem ou assista via Torrent direto pelo player integrado (Webtor SDK).
* 💻 **Suporte Multiplataforma (Electron):** Empacotamento para ser executado como app nativo no Linux (`.deb`) e Windows (`.exe`).

---

## 🛠️ Tecnologias Utilizadas

* **Runtime Desktop:** [Electron](https://www.electronjs.org/)
* **Backend:** [Node.js](https://nodejs.org/) + [Express.js](https://expressjs.com/)
* **View Engine:** [EJS](https://ejs.co/)
* **Frontend:** Vanilla JavaScript (ES Modules), HTML5 & CSS3
* **APIs & Provedores:** 
  * [TMDB API](https://www.themoviedb.org/documentation/api) (Metadados e imagens)
  * [Bitsearch API](https://bitsearch.eu/) (Busca de links magnéticos)
  * [Webtor SDK](https://webtor.io/) (Streaming de torrents via navegador)

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
Antes de começar, você precisará ter instalado em sua máquina:
* [Node.js](https://nodejs.org/) (Versão 18 ou superior)
* [Git](https://git-scm.com/)

### Passo a Passo

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/seu-usuario/rimuflix.git
   cd rimuflix
   ```
2. **Instale as dependências:**
   ```bash
   npm install
   ```
3. **Configure as Variáveis de Ambiente:**
   ```env
   API_KEY_TMDB=sua_chave_aqui_tmdb
   ```
3. **Inicie o servidor de desenvolvimento:**
   ```javascript
   npm run start:dev
   ```
   Acesse em: http://localhost:3000

---

## 📦 Como Compilar Executáveis(Build)
Para empacotar a aplicação para o seu sistema operacional:

Gerar pacote Debian/Ubuntu (.deb):

```Bash
npm run electron:build:linux
```

Gerar instalador para Windows (.exe):

```Bash
npm run electron:build:win
```
><br>
>Os arquivos finais serão gerados dentro da pasta /dist.

## 👤 Autor
<p style="text-align: center;">Desenvolvido com ❤️ por Rimublinda.</p>