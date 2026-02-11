'use client';

import React, { useState, useEffect } from 'react';
import Nav from '../components/Nav';
import Banner from '../components/Banner';
import Row from '../components/Row';
import requests from '../utils/requests';

import { useRouter } from 'next/navigation';

// ... (previous imports)

export default function Home() {
  const router = useRouter(); // Initialize router
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [category, setCategory] = useState("Home");

  useEffect(() => {
    const handleSearch = async () => {
      if (searchQuery.length > 0) {
        try {
          const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
          const url = `https://api.themoviedb.org/3/search/multi?api_key=${API_KEY}&language=en-US&query=${encodeURIComponent(searchQuery)}&page=1&include_adult=false`;
          const res = await fetch(url);
          const data = await res.json();
          setSearchResults(data.results || []);
          setShowResults(true);
        } catch (error) {
          console.error("Search failed", error);
        }
      } else {
        setShowResults(false);
        setSearchResults([]);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(() => {
      handleSearch();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleMovieClick = (movie) => {
    if (!movie) return;

    // Determine type: explicitly set or infer
    // Most TMDB results have 'media_type', otherwise guess based on props
    let type = movie.media_type;
    if (!type) {
      if (movie.first_air_date || movie.name) {
        type = 'tv';
      } else {
        type = 'movie';
      }
    }

    router.push(`/${type}/${movie.id}`);
  };

  // Remove closeModal as it's no longer used for Modal


  // Determine main trending row based on category
  const getTrendingRow = () => {
    if (category === "TV Shows") {
      return { title: "Trending TV Shows", url: requests.fetchTrendingTV };
    } else if (category === "Movies") {
      return { title: "Trending Movies", url: requests.fetchTrendingMovies };
    } else {
      return { title: "Trending Now", url: requests.fetchTrending };
    }
  };

  const trending = getTrendingRow();

  return (
    <div className="relative min-h-screen bg-[#141414] selection:bg-[#e50914] selection:text-white pb-10">
      <Nav
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setCategory={setCategory}
        currentCategory={category}
      />

      {showResults ? (
        <div className="pt-20 px-4 min-h-screen">
          <h2 className="text-2xl font-bold text-white mb-4">Search Results</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {searchResults.map((movie) => (
              (movie.poster_path || movie.backdrop_path) && (
                <div
                  key={movie.id}
                  onClick={() => handleMovieClick(movie)}
                  className="relative cursor-pointer transition-transform duration-300 hover:scale-105 group"
                >
                  <img
                    className="rounded-md object-cover w-full h-auto aspect-[2/3]"
                    src={`https://image.tmdb.org/t/p/original/${movie.poster_path || movie.backdrop_path}`}
                    alt={movie.name}
                  />
                  <p className="mt-2 text-sm text-gray-300 truncate group-hover:text-white">
                    {movie.title || movie.name || movie.original_name}
                  </p>
                </div>
              )
            ))}
          </div>
          {searchResults.length === 0 && <p className="text-white text-center mt-10">No results found.</p>}
        </div>
      ) : (
        <>
          <Banner onMovieClick={handleMovieClick} />
          <div className="pl-4 pb-8 -mt-32 relative z-10 space-y-8">
            {/* Primary Large Row (Trending) */}
            <Row
              title={trending.title}
              fetchUrl={trending.url}
              isLargeRow
              onMovieClick={handleMovieClick}
            />

            {/* TV Show Specific Rows */}
            {category === "TV Shows" && (
              <>
                <Row title="Top Rated TV" fetchUrl={requests.fetchTopRatedTV} onMovieClick={handleMovieClick} />
                <Row title="Action & Adventure" fetchUrl={requests.fetchActionTV} onMovieClick={handleMovieClick} />
                <Row title="Comedy Series" fetchUrl={requests.fetchComedyTV} onMovieClick={handleMovieClick} />
                <Row title="Docuseries" fetchUrl={requests.fetchDocTV} onMovieClick={handleMovieClick} />
              </>
            )}

            {/* Movie/Home Specific Rows */}
            {(category === "Movies" || category === "Home") && (
              <>
                <Row title="Top Rated" fetchUrl={requests.fetchTopRated} onMovieClick={handleMovieClick} />
                <Row title="Action Movies" fetchUrl={requests.fetchActionMovies} onMovieClick={handleMovieClick} />
                <Row title="Comedy Movies" fetchUrl={requests.fetchComedyMovies} onMovieClick={handleMovieClick} />
                <Row title="Horror Movies" fetchUrl={requests.fetchHorrorMovies} onMovieClick={handleMovieClick} />
                <Row title="Romance Movies" fetchUrl={requests.fetchRomanceMovies} onMovieClick={handleMovieClick} />
                <Row title="Documentaries" fetchUrl={requests.fetchDocumentaries} onMovieClick={handleMovieClick} />
              </>
            )}

            {(category === "Movies" || category === "Home") && (
              <>
                <Row title="Adventure" fetchUrl={requests.fetchAdventureMovies} onMovieClick={handleMovieClick} />
                <Row title="Animation" fetchUrl={requests.fetchAnimationMovies} onMovieClick={handleMovieClick} />
                <Row title="Crime" fetchUrl={requests.fetchCrimeMovies} onMovieClick={handleMovieClick} />
                <Row title="Drama" fetchUrl={requests.fetchDramaMovies} onMovieClick={handleMovieClick} />
                <Row title="Family" fetchUrl={requests.fetchFamilyMovies} onMovieClick={handleMovieClick} />
                <Row title="Fantasy" fetchUrl={requests.fetchFantasyMovies} onMovieClick={handleMovieClick} />
                <Row title="History" fetchUrl={requests.fetchHistoryMovies} onMovieClick={handleMovieClick} />
                <Row title="Music" fetchUrl={requests.fetchMusicMovies} onMovieClick={handleMovieClick} />
                <Row title="Mystery" fetchUrl={requests.fetchMysteryMovies} onMovieClick={handleMovieClick} />
                <Row title="Sci-Fi" fetchUrl={requests.fetchSciFiMovies} onMovieClick={handleMovieClick} />
                <Row title="Thriller" fetchUrl={requests.fetchThrillerMovies} onMovieClick={handleMovieClick} />
                <Row title="War" fetchUrl={requests.fetchWarMovies} onMovieClick={handleMovieClick} />
                <Row title="Western" fetchUrl={requests.fetchWesternMovies} onMovieClick={handleMovieClick} />
              </>
            )}
          </div>
        </>
      )}

      {!showResults && (
        <footer className='w-full text-center text-gray-500 text-sm py-10 opacity-60'>
          <p>Built for educational purposes. Data provided by TMDB.</p>
        </footer>
      )}
    </div>
  );
}
