const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";

const requests = {
    fetchTrending: `${BASE_URL}/trending/all/week?api_key=${API_KEY}&language=en-US`,
    fetchTrendingMovies: `${BASE_URL}/trending/movie/week?api_key=${API_KEY}&language=en-US`,
    fetchTrendingTV: `${BASE_URL}/trending/tv/week?api_key=${API_KEY}&language=en-US`,
    fetchNetflixOriginals: `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_networks=213`,
    fetchTopRated: `${BASE_URL}/movie/top_rated?api_key=${API_KEY}&language=en-US`,
    fetchTopRatedTV: `${BASE_URL}/tv/top_rated?api_key=${API_KEY}&language=en-US`,
    fetchActionMovies: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=28`,
    fetchActionTV: `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=10759`,
    fetchComedyMovies: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=35`,
    fetchComedyTV: `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=35`,
    fetchHorrorMovies: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=27`,
    fetchRomanceMovies: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=10749`,
    fetchDocumentaries: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=99`,
    fetchDocTV: `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=99`,
    fetchAdventureMovies: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=12`,
    fetchAnimationMovies: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=16`,
    fetchCrimeMovies: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=80`,
    fetchDramaMovies: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=18`,
    fetchFamilyMovies: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=10751`,
    fetchFantasyMovies: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=14`,
    fetchHistoryMovies: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=36`,
    fetchMusicMovies: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=10402`,
    fetchMysteryMovies: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=9648`,
    fetchSciFiMovies: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=878`,
    fetchThrillerMovies: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=53`,
    fetchWarMovies: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=10752`,
    fetchWesternMovies: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=37`,
};

export default requests;
