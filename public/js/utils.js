/**
 * Garante que caminhos de API comecem sempre com '/'
 * e não tenham barras duplas consecutivas (ex: //api//v1 -> /api/v1)
 */
export function normalizePath(path) {
  if (!path) return "/";

  // 1. Adiciona a barra inicial se não houver
  const formattedPath = path.startsWith("/") ? path : `/${path}`;

  // 2. Remove barras duplicadas // para evitar erros de regex no Express 5
  return formattedPath.replace(/\/+/g, "/");
}
