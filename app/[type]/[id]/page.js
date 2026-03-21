'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Nav from '../../../components/Nav';
import { Plus, ThumbsUp, VolumeX } from 'lucide-react';
import tvServers from '../../../tv.json';
import movieServers from '../../../movie.json';
import { addToContinueWatching, getContinueWatching, getEpisodeProgress, updateEpisodeProgress } from '../../../utils/continueWatching';

export default function Details() {
    const params = useParams();
    const router = useRouter(); // For redirect if type is invalid
    const searchParams = useSearchParams();
    const shouldPlay = searchParams.get('play') === 'true';
    
    const id = params.id;
    const type = params.type; // 'movie' or 'tv'

    const [movie, setMovie] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isPlaying, setIsPlaying] = useState(shouldPlay);
    const [selectedServer, setSelectedServer] = useState('Default');

    const [season, setSeason] = useState(1);
    const [episode, setEpisode] = useState(1);
    const [episodes, setEpisodes] = useState([]);
    const [episodeProgress, setEpisodeProgress] = useState({});

    // Clear the play parameter from URL after initial load
    useEffect(() => {
        if (shouldPlay) {
            const url = new URL(window.location.href);
            if (url.searchParams.has('play')) {
                url.searchParams.delete('play');
                window.history.replaceState({}, '', url.pathname + url.search);
            }
        }
    }, [shouldPlay]);

    useEffect(() => {
        if (id) {
            setEpisodeProgress(getEpisodeProgress(id));
        }

        const handleProgressUpdated = () => {
            if (id) setEpisodeProgress(getEpisodeProgress(id));
        };

        window.addEventListener('episodeProgressUpdated', handleProgressUpdated);
        return () => window.removeEventListener('episodeProgressUpdated', handleProgressUpdated);
    }, [id]);

    useEffect(() => {
        const handleMessage = (event) => {
            try {
                const message = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                
                // Common paths for progress data in different provider messages
                let currentTime = null;
                let duration = null;

                // Pattern 1: { event: 'timeupdate', data: { currentTime, duration } }
                if (message.event === 'timeupdate' && message.data) {
                    currentTime = message.data.currentTime;
                    duration = message.data.duration;
                }
                // Pattern 2: { type: 'progress', seconds, duration }
                else if (message.type === 'progress') {
                    currentTime = message.seconds || (message.data && message.data.seconds);
                    duration = message.duration || (message.data && message.data.duration);
                }
                // Pattern 3: { event: 'timeupdate', currentTime, duration }
                else if (message.event === 'timeupdate') {
                    currentTime = message.currentTime;
                    duration = message.duration;
                }
                // Pattern 4: Generic objects with seconds/duration or currentTime/duration
                else if (message.currentTime && message.duration) {
                    currentTime = message.currentTime;
                    duration = message.duration;
                }
                else if (message.seconds && message.duration) {
                    currentTime = message.seconds;
                    duration = message.duration;
                }

                if (currentTime !== null && duration !== null && duration > 0) {
                    const progress = (currentTime / duration) * 100;
                    // Only update if it's a reasonable percentage and we are in TV mode
                    if (id && type === 'tv' && progress >= 0 && progress <= 100) {
                        updateEpisodeProgress(id, season, episode, progress);
                    }
                }
            } catch (e) {
                // Ignore non-JSON or malformed messages
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [id, type, season, episode]);

    // Search State
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [showResults, setShowResults] = useState(false);

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

        const timeoutId = setTimeout(() => {
            handleSearch();
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    const handleMovieClick = (movie) => {
        if (!movie) return;

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

    useEffect(() => {
        // Validate type
        if (type !== 'movie' && type !== 'tv') {
            // Redirect to home or 404 if invalid type
            // For now, let's just not fetch
            setLoading(false);
            return;
        }

        // Set default server based on type, or from history
        const history = getContinueWatching();
        const lastWatched = history.find(item => item.id.toString() === id.toString());
        
        if (lastWatched && lastWatched.lastWatchedServer) {
            setSelectedServer(lastWatched.lastWatchedServer);
        } else {
            if (type === 'movie') {
                setSelectedServer(Object.keys(movieServers)[0] || 'Default');
            } else {
                setSelectedServer(Object.keys(tvServers)[0] || 'Default');
            }
        }

        async function fetchDetails() {
            try {
                const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
                const url = `https://api.themoviedb.org/3/${type}/${id}?api_key=${API_KEY}&language=en-US&append_to_response=videos,credits`;
                const res = await fetch(url);
                const data = await res.json();

                if (data.success === false) {
                    setMovie(null); // Handle TMDB error
                } else {
                    setMovie(data);
                    
                    // Check history for last watched info
                    const history = getContinueWatching();
                    const lastWatched = history.find(item => item.id.toString() === id.toString());
                    const lastSeason = type === 'tv' ? (lastWatched?.lastWatchedSeason || 1) : null;
                    const lastEpisode = type === 'tv' ? (lastWatched?.lastWatchedEpisode || 1) : null;
                    const lastServer = lastWatched?.lastWatchedServer || (type === 'movie' ? Object.keys(movieServers)[0] : Object.keys(tvServers)[0]);

                    // Add to continue watching (or update)
                    addToContinueWatching({
                        id: data.id,
                        title: data.title || data.name,
                        name: data.name,
                        poster_path: data.poster_path,
                        backdrop_path: data.backdrop_path,
                        media_type: type
                    }, lastSeason, lastEpisode, lastServer);

                    // If TV, fetch last watched season or season 1
                    if (type === 'tv') {
                        setSeason(lastSeason);
                        setEpisode(lastEpisode);
                        fetchSeasonDetails(lastSeason, lastEpisode, lastServer);
                        
                        // If we are playing immediately, mark initial progress
                        if (shouldPlay) {
                            const currentProg = getEpisodeProgress(data.id)[`s${lastSeason}e${lastEpisode}`] || 1;
                            updateEpisodeProgress(data.id, lastSeason, lastEpisode, currentProg);
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to fetch details", error);
            } finally {
                setLoading(false);
            }
        }

        if (id) {
            fetchDetails();
        }
    }, [id, type]);

    const fetchSeasonDetails = async (seasonNum, episodeNum = 1, serverNum = null) => {
        try {
            const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
            const res = await fetch(`https://api.themoviedb.org/3/tv/${id}/season/${seasonNum}?api_key=${API_KEY}&language=en-US`);
            const data = await res.json();
            if (data.episodes) {
                setEpisodes(data.episodes);
                setSeason(seasonNum);
                setEpisode(episodeNum);
                
                // Update continue watching with the current season/episode/server
                if (movie) {
                    addToContinueWatching({
                        id: movie.id,
                        title: movie.title || movie.name,
                        name: movie.name,
                        poster_path: movie.poster_path,
                        backdrop_path: movie.backdrop_path,
                        media_type: type
                    }, seasonNum, episodeNum, serverNum || selectedServer);
                }
            }
        } catch (error) {
            console.error("Failed to fetch season details", error);
        }
    };

    const handleSeasonChange = (e) => {
        const newSeason = parseInt(e.target.value);
        fetchSeasonDetails(newSeason, 1, selectedServer);
    };

    const handleServerChange = (e) => {
        const newServer = e.target.value;
        setSelectedServer(newServer);
        
        // Update continue watching with the new server
        if (movie) {
            addToContinueWatching({
                id: movie.id,
                title: movie.title || movie.name,
                name: movie.name,
                poster_path: movie.poster_path,
                backdrop_path: movie.backdrop_path,
                media_type: type
            }, type === 'tv' ? season : null, type === 'tv' ? episode : null, newServer);
        }
    };

    const handleEpisodeClick = (ep) => {
        setEpisode(ep.episode_number);
        setIsPlaying(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Update progress to at least 1% so the bar shows up
        const currentProgress = episodeProgress[`s${season}e${ep.episode_number}`] || 1;
        updateEpisodeProgress(id, season, ep.episode_number, currentProgress);
        
        // Update continue watching with the selected episode and current server
        if (movie) {
            addToContinueWatching({
                id: movie.id,
                title: movie.title || movie.name,
                name: movie.name,
                poster_path: movie.poster_path,
                backdrop_path: movie.backdrop_path,
                media_type: type
            }, season, ep.episode_number, selectedServer);
        }
    };

    const getStreamUrl = () => {
        let convention;
        if (type === 'movie') {
            convention = movieServers[selectedServer];
        } else {
            convention = tvServers[selectedServer];
        }

        if (!convention) return null;

        let url = convention.replace('{tmdbId}', id);

        if (type === 'tv') {
            url = url.replace('{season}', season).replace('{episode}', episode);
        }

        if (url.startsWith('http')) {
            return url;
        }

        const baseUrl = "https://111movies.com/movie";

        if (url.startsWith('/')) {
            return `${baseUrl}${url}`;
        } else if (url.startsWith('Base/')) {
            return url.replace('Base/', baseUrl + '/');
        }

        return url;
    };

    if (loading) {
        return (
            <div className="h-screen w-screen bg-[#141414] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#e50914]"></div>
            </div>
        );
    }

    if (!movie) return <div className="h-screen bg-[#141414] text-white flex items-center justify-center">Media not found.</div>;

    return (
        <div className="relative min-h-screen bg-[#141414] text-white">
            <Nav
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
            />

            {showResults ? (
                <div className="px-4 pt-24 min-h-screen">
                    <h2 className="text-2xl font-bold text-white mb-4">Search Results</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {searchResults.map((result) => (
                            (result.poster_path || result.backdrop_path) && (
                                <div
                                    key={result.id}
                                    onClick={() => handleMovieClick(result)}
                                    className="relative cursor-pointer transition-transform duration-300 hover:scale-105 group"
                                >
                                    <img
                                        className="rounded-md object-cover w-full h-auto aspect-[2/3]"
                                        src={`https://image.tmdb.org/t/p/original/${result.poster_path || result.backdrop_path}`}
                                        alt={result.name}
                                    />
                                    <p className="mt-2 text-sm text-gray-300 truncate group-hover:text-white">
                                        {result.title || result.name || result.original_name}
                                    </p>
                                </div>
                            )
                        ))}
                    </div>
                    {searchResults.length === 0 && <p className="text-white text-center mt-10">No results found.</p>}
                </div>
            ) : (
                <>

                    {/* Video Player Overlay */}
                    {isPlaying && (
                        <div
                            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center animate-in fade-in duration-300"
                            onClick={() => setIsPlaying(false)}
                        >
                            <button
                                onClick={() => setIsPlaying(false)}
                                className="absolute top-4 right-4 z-[60] text-white hover:text-gray-300 p-2 bg-black/50 rounded-full"
                            >
                                <VolumeX className="w-8 h-8" />
                                <span className="sr-only">Close</span>
                            </button>

                            <div
                                className="w-full max-w-6xl aspect-video relative shadow-2xl overflow-hidden bg-black"
                                onClick={(e) => e.stopPropagation()}
                            >

                                <iframe
                                    src={getStreamUrl()}
                                    className="w-full h-full border-0"
                                    allowFullScreen
                                    width="100%"
                                    height="100%"
                                    scrolling="no"
                                    allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
                                    referrerPolicy="origin"
                                    title="Video Player"
                                />

                                <div className="absolute top-4 left-4 flex flex-col space-y-2 z-50">

                                    <div className="flex space-x-2">
                                        <select
                                            value={selectedServer}
                                            onChange={handleServerChange}
                                            className="bg-black/80 text-white text-sm border border-gray-700 rounded px-2 py-1 outline-none focus:border-[#e50914]"
                                        >
                                            {Object.keys(type === 'movie' ? movieServers : tvServers).map((server) => (
                                                <option key={server} value={server}>
                                                    {server}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {type === 'tv' && movie.seasons && (
                                        <div className="flex space-x-2">
                                            <select
                                                value={season}
                                                onChange={handleSeasonChange}
                                                className="bg-black/80 text-white text-sm border border-gray-700 rounded px-2 py-1 outline-none focus:border-[#e50914]"
                                            >
                                                {movie.seasons
                                                    .filter(s => s.season_number > 0)
                                                    .map((s) => (
                                                        <option key={s.id} value={s.season_number}>
                                                            Season {s.season_number}
                                                        </option>
                                                    ))}
                                            </select>

                                            <select
                                                value={episode}
                                                onChange={(e) => setEpisode(e.target.value)}
                                                className="bg-black/80 text-white text-sm border border-gray-700 rounded px-2 py-1 outline-none focus:border-[#e50914]"
                                            >
                                                {episodes.map((e) => (
                                                    <option key={e.id} value={e.episode_number}>
                                                        Ep {e.episode_number}: {e.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>

                            </div>
                        </div>
                    )}

                    {/* Hero / Backdrop */}
                    <div className="relative h-[80vh] w-full overflow-hidden">
                        {/* Gradients for Cinematic Feel */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/60 to-transparent z-10" />
                        <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#141414]/30 to-transparent z-10" />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent z-10" />
                        
                        <img
                            src={`https://image.tmdb.org/t/p/original/${movie.backdrop_path || movie.poster_path}`}
                            alt={movie.title || movie.name}
                            className="w-full h-full object-cover object-top scale-105 animate-in fade-in zoom-in duration-1000"
                        />

                        <div className="absolute bottom-0 left-0 w-full px-8 md:px-16 lg:px-24 pb-6 md:pb-8 lg:pb-10 z-20 space-y-4 max-w-4xl">
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter drop-shadow-2xl leading-[0.9]">
                                {movie.title || movie.name}
                            </h1>

                            <div className="flex items-center space-x-4 text-sm md:text-base text-gray-200 font-bold drop-shadow-md">
                                <span className="text-green-500">
                                    {Math.round(movie.vote_average * 10)}% Match
                                </span>
                                <span className="text-white">
                                    {new Date(movie.release_date || movie.first_air_date).getFullYear()}
                                </span>
                                <span className="border border-gray-500 px-1.5 py-0.5 text-[10px] rounded uppercase tracking-widest bg-black/20">
                                    {movie.adult ? '18+' : 'PG-13'}
                                </span>
                                <span className="text-gray-300">
                                    {type === 'movie'
                                        ? `${movie.runtime || (movie.episode_run_time && movie.episode_run_time[0])}m`
                                        : `${movie.number_of_seasons} Season${movie.number_of_seasons > 1 ? 's' : ''}`
                                    }
                                </span>
                            </div>

                            <div className="flex items-center space-x-3 pt-2">
                                <button
                                    onClick={() => setIsPlaying(true)}
                                    className="bg-white text-black px-8 py-2.5 rounded-md font-black flex items-center hover:bg-white/80 transition transform active:scale-95 text-lg shadow-xl"
                                >
                                    <svg className="w-6 h-6 mr-2 fill-current" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                    Watch Now
                                </button>
                                <button className="bg-gray-500/40 text-white p-2.5 rounded-full hover:bg-gray-500/60 transition group">
                                    <Plus className="w-6 h-6 group-hover:scale-110 transition" />
                                </button>
                                <button className="bg-gray-500/40 text-white p-2.5 rounded-full hover:bg-gray-500/60 transition group">
                                    <ThumbsUp className="w-6 h-6 group-hover:scale-110 transition" />
                                </button>
                            </div>

                            <p className="max-w-xl text-base md:text-lg text-gray-100 font-medium leading-relaxed drop-shadow-lg line-clamp-3">
                                {movie.overview}
                            </p>

                            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs md:text-sm text-gray-400 font-semibold pt-2">
                                <div className="flex items-center">
                                    <span className="text-gray-500 mr-2 uppercase tracking-tighter text-[10px]">Genres</span>
                                    {movie.genres?.map(g => g.name).join(', ')}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="px-8 md:px-16 lg:px-24 py-12 bg-gradient-to-b from-[#141414] to-black">
                        <div className="max-w-6xl mx-auto space-y-16">
                            {/* Episodes Section - Now Full Width */}
                            {type === 'tv' && (
                                <div className="">
                                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-800">
                                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Episodes</h2>
                                        {movie.seasons && (
                                            <select
                                                value={season}
                                                onChange={handleSeasonChange}
                                                className="bg-zinc-900 text-white text-sm font-bold border border-zinc-700 rounded-md px-3 py-1.5 outline-none focus:border-white cursor-pointer hover:bg-zinc-800 transition"
                                            >
                                                {movie.seasons
                                                    .filter(s => s.season_number > 0)
                                                    .map((s) => (
                                                        <option key={s.id} value={s.season_number}>
                                                            Season {s.season_number} ({s.episode_count} Episodes)
                                                        </option>
                                                    ))}
                                            </select>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        {episodes.map((ep) => (
                                            <div
                                                key={ep.id}
                                                className="flex flex-col md:flex-row items-center gap-6 p-4 hover:bg-zinc-900/50 transition duration-300 rounded-xl cursor-pointer group border-b border-zinc-800/30 last:border-0"
                                                onClick={() => handleEpisodeClick(ep)}
                                            >
                                                <div className="text-2xl font-black text-zinc-700 w-8 flex-shrink-0 text-center group-hover:text-zinc-500 transition">{ep.episode_number}</div>
                                                <div className="relative w-full md:w-60 aspect-video flex-shrink-0 overflow-hidden rounded-lg bg-zinc-800 shadow-md">
                                                    <img
                                                        src={ep.still_path ? `https://image.tmdb.org/t/p/w500/${ep.still_path}` : 'https://via.placeholder.com/500x281?text=No+Image'}
                                                        alt={ep.name}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                                                    />
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300 bg-black/50">
                                                        <svg className="w-12 h-12 fill-white scale-75 group-hover:scale-100 transition duration-300" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                                    </div>
                                                    {episodeProgress[`s${season}e${ep.episode_number}`] > 0 && (
                                                        <div className="absolute bottom-0 left-0 w-full h-1 bg-zinc-600">
                                                            <div 
                                                                className="h-full bg-[#e50914] transition-all duration-300"
                                                                style={{ width: `${Math.min(100, episodeProgress[`s${season}e${ep.episode_number}`])}%` }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-grow min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <h3 className="text-lg font-bold text-white group-hover:text-[#e50914] transition">{ep.name}</h3>
                                                        <span className="text-xs text-zinc-500 font-bold">{ep.runtime ? `${ep.runtime}m` : ''}</span>
                                                    </div>
                                                    <p className="text-zinc-400 text-sm line-clamp-2 leading-relaxed">{ep.overview || "No overview available."}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* More Details Section - Compact Grid */}
                            <div className="pt-12 border-t border-zinc-800">
                                <h2 className="text-xl font-black text-white uppercase tracking-tighter mb-8">More Details</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                                    <div>
                                        <span className="text-zinc-500 block text-[10px] uppercase font-black tracking-widest mb-3">Cast</span>
                                        <div className="space-y-1">
                                            {movie.credits?.cast?.slice(0, 5).map(person => (
                                                <p key={person.id} className="text-zinc-300 text-sm">
                                                    <span className="text-zinc-100 font-bold">{person.name}</span>
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-zinc-500 block text-[10px] uppercase font-black tracking-widest mb-3">Genres</span>
                                        <div className="text-zinc-300 text-sm font-bold">
                                            {movie.genres?.map(g => g.name).join(', ')}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-zinc-500 block text-[10px] uppercase font-black tracking-widest mb-3">Production</span>
                                        <div className="text-zinc-300 text-sm font-bold">
                                            {movie.production_companies?.slice(0, 2).map(c => c.name).join(', ')}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-zinc-500 block text-[10px] uppercase font-black tracking-widest mb-3">Details</span>
                                        <div className="space-y-1 text-sm">
                                            <p className="text-zinc-400">Status: <span className="text-zinc-200 font-bold">{movie.status}</span></p>
                                            <p className="text-zinc-400">Language: <span className="text-zinc-200 font-bold">{movie.original_language?.toUpperCase()}</span></p>
                                            {movie.release_date && <p className="text-zinc-400">Release: <span className="text-zinc-200 font-bold">{movie.release_date}</span></p>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

        </div>
    );
}
