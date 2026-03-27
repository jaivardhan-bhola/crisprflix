'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Nav from '../components/Nav';
import Banner from '../components/Banner';
import Row from '../components/Row';
import requests from '../utils/requests';
import { getContinueWatching } from '../utils/continueWatching';
import Skeleton from '../components/Skeleton';
import Footer from '../components/Footer';
import { Star } from 'lucide-react';

function HomeContent() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [category, setCategory] = useState("Home");
  const [continueWatching, setContinueWatching] = useState([]);
  const searchParams = useSearchParams();

  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setCategory(categoryParam);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchContinueWatching = () => {
      setContinueWatching(getContinueWatching());
    };

    fetchContinueWatching();
    window.addEventListener('continueWatchingUpdated', fetchContinueWatching);
    return () => window.removeEventListener('continueWatchingUpdated', fetchContinueWatching);
  }, []);

  useEffect(() => {
    const handleSearch = async () => {
      if (searchQuery.length > 0) {
        setIsSearching(true);
        setShowResults(true);
        try {
          const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
          const url = `https://api.themoviedb.org/3/search/multi?api_key=${API_KEY}&language=en-US&query=${encodeURIComponent(searchQuery)}&page=1&include_adult=false`;
          const res = await fetch(url);
          const data = await res.json();
          setSearchResults(data.results?.filter(m => m.poster_path || m.backdrop_path) || []);
        } catch (error) {
          console.error("Search failed", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setShowResults(false);
        setSearchResults([]);
      }
    };

    const timeoutId = setTimeout(handleSearch, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleMovieClick = (movie, play = false) => {
    if (!movie) return;
    let type = movie.media_type || (movie.first_air_date || movie.name ? 'tv' : 'movie');
    router.push(`/${type}/${movie.id}${play ? '?play=true' : ''}`);
  };

  const trendingConfig = useMemo(() => {
    if (category === "TV Shows") return { title: "Trending TV Shows", url: requests.fetchTrendingTV };
    if (category === "Movies") return { title: "Trending Movies", url: requests.fetchTrendingMovies };
    return { title: "Trending Now", url: requests.fetchTrending };
  }, [category]);

  return (
    <div className="relative min-h-screen bg-netflix-black text-white selection:bg-netflix-red selection:text-white">
      <Nav
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setCategory={setCategory}
        currentCategory={category}
      />

      <main className="pb-20">
        {showResults ? (
          <div className="pt-24 px-4 md:px-12 min-h-screen animate-in fade-in duration-500">
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
              {isSearching ? 'Searching...' : `Results for "${searchQuery}"`}
              {isSearching && <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
            </h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {isSearching ? (
                [...Array(12)].map((_, i) => (
                  <Skeleton key={i} className="aspect-[2/3] w-full" />
                ))
              ) : searchResults.length > 0 ? (
                searchResults.map((movie) => (
                  <div key={movie.id} className="relative aspect-[2/3]">
                    <div
                      onClick={() => handleMovieClick(movie)}
                      className="group absolute inset-0 cursor-pointer transition-standard hover:scale-105 active:scale-95 z-10 hover:z-20"
                    >
                      <div className="w-full h-full overflow-hidden rounded-xl border-2 border-transparent group-hover:border-netflix-red shadow-soft group-hover:shadow-strong transition-standard bg-surface relative">
                        <img
                          className="w-full h-full object-cover transition-standard group-hover:brightness-50 group-hover:scale-105"
                          src={`https://image.tmdb.org/t/p/w500/${movie.poster_path || movie.backdrop_path}`}
                          alt={movie.title || movie.name}
                          loading="lazy"
                        />
                        
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-standard p-4 flex flex-col justify-end bg-gradient-to-t from-black via-black/20 to-transparent">
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className="flex items-center gap-1 bg-netflix-red text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-soft">
                              <Star className="w-2.5 h-2.5 fill-current" />
                              {movie.vote_average?.toFixed(1)}
                            </div>
                          </div>
                          <h3 className="text-sm font-bold text-white line-clamp-2 leading-tight drop-shadow-md">
                            {movie.title || movie.name}
                          </h3>
                          <p className="text-[10px] text-text-muted font-bold mt-1">
                            {movie.release_date?.split('-')[0] || movie.first_air_date?.split('-')[0]}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-20">
                  <p className="text-text-secondary text-lg font-medium">No results found for your search.</p>
                  <button 
                    onClick={() => setSearchQuery("")}
                    className="mt-4 text-netflix-red hover:underline underline-offset-4"
                  >
                    Clear search
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-700">
            <Banner onMovieClick={handleMovieClick} />
            
            <div className="relative z-30 space-y-12 md:space-y-16 py-8">
              {category === "Home" && continueWatching.length > 0 && (
                <Row
                  title="Continue Watching"
                  data={continueWatching}
                  onMovieClick={(movie) => handleMovieClick(movie, true)}
                />
              )}

              <Row
                title={trendingConfig.title}
                fetchUrl={trendingConfig.url}
                isLargeRow
                onMovieClick={handleMovieClick}
              />

              {category === "TV Shows" ? (
                <>
                  <Row title="Top Rated TV" fetchUrl={requests.fetchTopRatedTV} onMovieClick={handleMovieClick} />
                  <Row title="Action & Adventure" fetchUrl={requests.fetchActionTV} onMovieClick={handleMovieClick} />
                  <Row title="Comedy Series" fetchUrl={requests.fetchComedyTV} onMovieClick={handleMovieClick} />
                  <Row title="Docuseries" fetchUrl={requests.fetchDocTV} onMovieClick={handleMovieClick} />
                </>
              ) : category === "Movies" ? (
                <>
                  <Row title="Top Rated" fetchUrl={requests.fetchTopRated} onMovieClick={handleMovieClick} />
                  <Row title="Action Movies" fetchUrl={requests.fetchActionMovies} onMovieClick={handleMovieClick} />
                  <Row title="Comedy Movies" fetchUrl={requests.fetchComedyMovies} onMovieClick={handleMovieClick} />
                  <Row title="Horror Movies" fetchUrl={requests.fetchHorrorMovies} onMovieClick={handleMovieClick} />
                  <Row title="Romance Movies" fetchUrl={requests.fetchRomanceMovies} onMovieClick={handleMovieClick} />
                </>
              ) : (
                <>
                  <Row title="Top Rated" fetchUrl={requests.fetchTopRated} onMovieClick={handleMovieClick} />
                  <Row title="Action Movies" fetchUrl={requests.fetchActionMovies} onMovieClick={handleMovieClick} />
                  <Row title="Documentaries" fetchUrl={requests.fetchDocumentaries} onMovieClick={handleMovieClick} />
                  <Row title="Animation" fetchUrl={requests.fetchAnimationMovies} onMovieClick={handleMovieClick} />
                </>
              )}
            </div>
          </div>
        )}
      </main>

      {!showResults && <Footer />}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-netflix-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-netflix-red border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
