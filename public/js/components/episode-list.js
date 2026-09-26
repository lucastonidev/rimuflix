const renderEpisodeSeason = (seasonData, alreadyWatched, id) => {
  const episodeList = seasonData["data"].episodes;
  const elementEpisodioList = document.createElement("div");
  elementEpisodioList.classList.add("episode-list");
  episodeList.forEach((episode) => {
    const episodeItem = document.createElement("a");
    episodeItem.classList.add("episode-card-link");
    episodeItem.href = `/tv/watch/${id}?season=${seasonData["data"].season_number}&episode=${episode.episode_number}`;
    episodeItem.setAttribute(
      "aria-label",
      `Assistir episÃ³dio ${episode.episode_number} da temporada ${seasonData["data"].season_number}`,
    );
    episodeItem.setAttribute("data-seasonNumber", `${episode.season_number}`);
    episodeItem.setAttribute("data-episodeNumber", `${episode.episode_number}`);
    episodeItem.innerHTML = `
      <article class="episode-item">
        <div class="episode-item__number">${episode.episode_number}</div>

        <div class="episode-item__thumb">
          <img src="${episode.still_path ? `https://media.themoviedb.org/t/p/w300_and_h450_face${episode.still_path}` : "https://placehold.co/600x400"}" alt="Thumb do episÃ³dio ${episode.episode_number}" loading="lazy" />
          <span class="episode-item__time">${episode.runtime || "00"} min</span>
        </div>

        <div class="episode-item__content">
          <div class="episode-item__top">
            <h3>${episode.episode_number}. ${episode.name}</h3>
            <span class="episode-item__status"></span>
          </div>
          <p>${episode.overview}</p>
        </div>
      </article>
      `;
    elementEpisodioList.appendChild(episodeItem);
  });
  return elementEpisodioList.outerHTML;
};
export { renderEpisodeSeason };
