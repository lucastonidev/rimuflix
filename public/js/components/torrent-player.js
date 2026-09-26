export default class TorrentPlayer {
  constructor() {
    this.client = null;
    this.videoElementId = null;
  }

  initClient() {
    if (this.client) return this.client;
    const WebTor = window.webtor;
    this.client = new WebTor();
    return this.client;
  }

  start(magnet, elementId, poster) {
    const targetElement = document.getElementById(elementId);

    if (targetElement) {
      // 1. Limpa o contêiner e remove instâncias e elementos filhos anteriores (iframes, videos, etc.)
      targetElement.innerHTML = "";

      // 2. Cria uma div filha novinha em folha com um ID único para este streaming
      const uniqueId = `webtor-instance-${Date.now()}`;
      const newPlayerDiv = document.createElement("div");
      newPlayerDiv.id = uniqueId;
      newPlayerDiv.style.width = "100%";
      newPlayerDiv.style.height = "100%";

      targetElement.appendChild(newPlayerDiv);

      this.videoElementId = uniqueId;
    } else {
      this.videoElementId = elementId;
    }

    const options = {
      id: this.videoElementId,
      magnet: magnet,
      width: "100%",
      poster: poster,
    };

    // Inicializa o array window.webtor globalmente caso o SDK ainda esteja baixando
    window.webtor = window.webtor || [];
    window.webtor.push(options);
  }
}
