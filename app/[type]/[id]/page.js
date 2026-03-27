'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Nav from '../../../components/Nav';
import Row from '../../../components/Row';
import ReviewModal from '../../../components/ReviewModal';
import { Plus, VolumeX, Star, Play, Info, Video } from 'lucide-react';
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
    const [recommendations, setRecommendations] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [selectedReview, setSelectedReview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isPlaying, setIsPlaying] = useState(shouldPlay);
    const [selectedServer, setSelectedServer] = useState('Default');

    const [season, setSeason] = useState(1);
    const [episode, setEpisode] = useState(1);
    const [episodes, setEpisodes] = useState([]);
    const [episodeProgress, setEpisodeProgress] = useState({});
    const [playingTrailerKey, setPlayingTrailerKey] = useState(null);

    const getTrailer = () => {
        const trailer = movie?.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube') 
                     || movie?.videos?.results?.find(v => v.type === 'Teaser' && v.site === 'YouTube');
        return trailer;
    };

    const trailer = getTrailer();

    const formatRuntime = (mins) => {
        if (!mins) return '';
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        if (h > 0) return `${h}hr ${m}m`;
        return `${m}m`;
    };

    // Calculate time left
    const getTimeLeft = () => {
        if (!movie) return null;

        const key = type === 'tv' ? `s${season}e${episode}` : 'movie';
        const progress = episodeProgress[key];

        if (progress > 0 && progress < 90) {
            const runtime = type === 'movie'
                ? movie.runtime
                : (movie.episode_run_time?.[0] || 45);

            if (runtime) {
                const minsLeft = Math.round(runtime * (1 - progress / 100));
                if (minsLeft <= 0) return null;
                return formatRuntime(minsLeft);
            }
        }
        return null;
    };
    const timeLeft = getTimeLeft();

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
                if (!message) return;

                let currentTime = null;
                let duration = null;

                // Aggressive search for time/duration in the message object
                const findValues = (obj) => {
                    if (!obj || typeof obj !== 'object') return;
                    
                    // Possible keys for current time
                    const timeKeys = ['currentTime', 'seconds', 'pos', 'position', 'time'];
                    // Possible keys for duration
                    const durationKeys = ['duration', 'totalTime', 'total_time', 'length'];

                    for (const key of timeKeys) {
                        if (typeof obj[key] === 'number') currentTime = obj[key];
                    }
                    for (const key of durationKeys) {
                        if (typeof obj[key] === 'number' && obj[key] > 0) duration = obj[key];
                    }

                    // If not found, look one level deeper in 'data' or 'value'
                    if (currentTime === null && obj.data) findValues(obj.data);
                    if (currentTime === null && obj.value) findValues(obj.value);
                };

                findValues(message);

                if (currentTime !== null && duration !== null && duration > 0) {
                    const progress = (currentTime / duration) * 100;
                    if (id && progress >= 0 && progress <= 100) {
                        updateEpisodeProgress(id, type === 'tv' ? season : null, type === 'tv' ? episode : null, progress);
                    }
                }
            } catch (e) {
                // Ignore malformed messages
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
                const url = `https://api.themoviedb.org/3/${type}/${id}?api_key=${API_KEY}&language=en-US&append_to_response=videos,credits,external_ids`;
                const res = await fetch(url);
                const data = await res.json();

                // Fetch Similar Movies/TV Shows
                const recUrl = `https://api.themoviedb.org/3/${type}/${id}/similar?api_key=${API_KEY}&language=en-US`;
                const recRes = await fetch(recUrl);
                const recData = await recRes.json();
                setRecommendations(recData.results || []);

                // Fetch Reviews
                const revUrl = `https://api.themoviedb.org/3/${type}/${id}/reviews?api_key=${API_KEY}&language=en-US`;
                const revRes = await fetch(revUrl);
                const revData = await revRes.json();
                setReviews(revData.results || []);

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

                    // Add to continue watching (or update) if it was already there
                    if (lastWatched) {
                        addToContinueWatching({
                            id: data.id,
                            title: data.title || data.name,
                            name: data.name,
                            poster_path: data.poster_path,
                            backdrop_path: data.backdrop_path,
                            media_type: type,
                            runtime: data.runtime,
                            episode_run_time: data.episode_run_time
                        }, lastSeason, lastEpisode, lastServer);
                    }

                    // Fetch last watched season or season 1 (TV) or just init progress (Movie)
                    if (type === 'tv') {
                        setSeason(lastSeason);
                        setEpisode(lastEpisode);
                        fetchSeasonDetails(lastSeason, lastEpisode, lastServer);
                    }

                    if (shouldPlay) {
                        const progData = getEpisodeProgress(data.id);
                        const progKey = type === 'tv' ? `s${lastSeason}e${lastEpisode}` : 'movie';
                        const currentProg = progData[progKey] || 1;
                        updateEpisodeProgress(data.id, type === 'tv' ? lastSeason : null, type === 'tv' ? lastEpisode : null, currentProg);

                        // Add to continue watching since we're playing
                        addToContinueWatching({
                            id: data.id,
                            title: data.title || data.name,
                            name: data.name,
                            poster_path: data.poster_path,
                            backdrop_path: data.backdrop_path,
                            media_type: type,
                            runtime: data.runtime,
                            episode_run_time: data.episode_run_time
                        }, lastSeason, lastEpisode, lastServer);
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
    }, [id, type, shouldPlay]);

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
                        media_type: type,
                        runtime: movie.runtime,
                        episode_run_time: movie.episode_run_time
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
                media_type: type,
                runtime: movie.runtime,
                episode_run_time: movie.episode_run_time
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
                media_type: type,
                runtime: movie.runtime,
                episode_run_time: movie.episode_run_time
            }, season, ep.episode_number, selectedServer);
        }
    };

    const handleWatchClick = () => {
        setIsPlaying(true);
        // Initialize progress fallback
        if (movie) {
            const progData = getEpisodeProgress(movie.id);
            const progKey = type === 'tv' ? `s${season}e${episode}` : 'movie';
            const currentProg = progData[progKey] || 1;
            updateEpisodeProgress(movie.id, type === 'tv' ? season : null, type === 'tv' ? episode : null, currentProg);

            // Add to continue watching now that we've started playing
            addToContinueWatching({
                id: movie.id,
                title: movie.title || movie.name,
                name: movie.name,
                poster_path: movie.poster_path,
                backdrop_path: movie.backdrop_path,
                media_type: type,
                runtime: movie.runtime,
                episode_run_time: movie.episode_run_time
            }, type === 'tv' ? season : null, type === 'tv' ? episode : null, selectedServer);
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

                    {/* Trailer Player Overlay */}
                    {playingTrailerKey && (
                        <div
                            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center animate-in fade-in duration-300"
                            onClick={() => setPlayingTrailerKey(null)}
                        >
                            <button
                                onClick={() => setPlayingTrailerKey(null)}
                                className="absolute top-4 right-4 z-[110] text-white hover:text-gray-300 p-2 bg-black/50 rounded-full"
                            >
                                <Plus className="w-8 h-8 rotate-45" />
                                <span className="sr-only">Close</span>
                            </button>

                            <div
                                className="w-full max-w-5xl aspect-video relative shadow-2xl overflow-hidden bg-black"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <iframe
                                    src={`https://www.youtube.com/embed/${playingTrailerKey}?autoplay=1`}
                                    className="w-full h-full border-0"
                                    allowFullScreen
                                    width="100%"
                                    height="100%"
                                    allow="autoplay; encrypted-media"
                                    title="Trailer Player"
                                />
                            </div>
                        </div>
                    )}

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
                        
                        {trailer ? (
                            <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
                                <iframe
                                    src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=1&loop=1&playlist=${trailer.key}&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&enablejsapi=1`}
                                    className="absolute top-1/2 left-1/2 w-[125%] h-[125%] -translate-x-1/2 -translate-y-1/2 opacity-60 object-cover scale-110"
                                    allow="autoplay; encrypted-media"
                                    title="Background Trailer"
                                />
                            </div>
                        ) : (
                            <img
                                src={`https://image.tmdb.org/t/p/original/${movie.backdrop_path || movie.poster_path}`}
                                alt={movie.title || movie.name}
                                className="w-full h-full object-cover object-top scale-105 animate-in fade-in zoom-in duration-1000"
                            />
                        )}

                        <div className="absolute bottom-0 left-0 w-full px-8 md:px-16 lg:px-24 pb-6 md:pb-8 lg:pb-10 z-20 space-y-4 max-w-4xl">
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter drop-shadow-2xl leading-[0.9]">
                                {movie.title || movie.name}
                            </h1>

                            <div className="flex items-center space-x-4 text-sm md:text-base text-gray-200 font-bold drop-shadow-md">
                                <div className="flex items-center gap-1 bg-[#01b4e4] text-white px-2 py-0.5 rounded font-black text-xs uppercase tracking-tighter">
                                    TMDB {movie.vote_average?.toFixed(1)}
                                </div>
                                <span className="text-white">
                                    {new Date(movie.release_date || movie.first_air_date).getFullYear()}
                                </span>
                                <span className="border border-gray-500 px-1.5 py-0.5 text-[10px] rounded uppercase tracking-widest bg-black/20">
                                    {movie.adult ? '18+' : 'PG-13'}
                                </span>
                                <span className="text-gray-300">
                                    {type === 'movie'
                                        ? formatRuntime(movie.runtime || (movie.episode_run_time && movie.episode_run_time[0]))
                                        : `${movie.number_of_seasons} Season${movie.number_of_seasons > 1 ? 's' : ''}`
                                    }
                                </span>
                            </div>

                            <div className="flex flex-col space-y-3 pt-2">
                                <div className="flex items-center space-x-3">
                                    <button
                                        onClick={handleWatchClick}
                                        className="bg-white text-black px-8 py-2.5 rounded-md font-black flex items-center hover:bg-white/80 transition transform active:scale-95 text-lg shadow-xl"
                                    >
                                        <svg className="w-6 h-6 mr-2 fill-current" viewBox="0 0 24 24">
                                            <path d="M8 5v14l11-7z" />
                                        </svg>
                                        {timeLeft ? 'Continue Watching' : 'Watch Now'}
                                    </button>
                                    {trailer && (
                                        <button
                                            onClick={() => setPlayingTrailerKey(trailer.key)}
                                            className="bg-white/20 text-white px-8 py-2.5 rounded-md font-black flex items-center hover:bg-white/30 transition transform active:scale-95 text-lg shadow-xl backdrop-blur-md"
                                        >
                                            <Video className="w-6 h-6 mr-2" />
                                            Watch Trailer
                                        </button>
                                    )}
                                </div>

                                {timeLeft && (
                                    <p className="text-[#e50914] font-black uppercase tracking-tighter text-sm animate-in fade-in slide-in-from-top-2 duration-500">
                                        {type === 'tv' ? `S${season} E${episode} • ` : ''}{timeLeft} left
                                    </p>
                                )}
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
                                                        <span className="text-xs text-zinc-500 font-bold">{ep.runtime ? formatRuntime(ep.runtime) : ''}</span>
                                                    </div>
                                                    <p className="text-zinc-400 text-sm line-clamp-2 leading-relaxed">{ep.overview || "No overview available."}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Recommendations Section */}
                            {recommendations.length > 0 && (
                                <div className="pt-12 border-t border-zinc-800">
                                    <Row 
                                        title="MORE LIKE THIS" 
                                        data={recommendations.map(r => ({ ...r, media_type: type }))} 
                                        onMovieClick={handleMovieClick}
                                        titleClassName="text-xl font-black text-white uppercase tracking-tighter mb-8"
                                        className="px-0"
                                    />
                                </div>
                            )}

                            {/* Reviews Section */}
                            {reviews.length > 0 && (
                                <div className="pt-12 border-t border-zinc-800">
                                    <h2 className="text-xl font-black text-white uppercase tracking-tighter mb-8">Audience Reviews</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {reviews.slice(0, 4).map((review) => (
                                            <div key={review.id} className="bg-zinc-900/40 border border-zinc-800/50 p-6 rounded-2xl hover:bg-zinc-900/60 transition group">
                                                <div className="flex items-center gap-4 mb-4">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-zinc-400 font-bold uppercase overflow-hidden border border-zinc-700">
                                                        {review.author_details?.avatar_path ? (
                                                            <img 
                                                                src={`https://image.tmdb.org/t/p/w45${review.author_details.avatar_path}`} 
                                                                alt={review.author} 
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            review.author[0]
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-white font-bold text-sm">{review.author}</p>
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex text-yellow-500 scale-75 -ml-1">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <Star key={i} className={`w-3 h-3 ${i < Math.round((review.author_details?.rating || 0) / 2) ? 'fill-current' : 'opacity-20'}`} />
                                                                ))}
                                                            </div>
                                                            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                                                                {new Date(review.created_at).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="text-zinc-400 text-sm leading-relaxed line-clamp-4 italic group-hover:text-zinc-300 transition">
                                                    "{review.content}"
                                                </p>
                                                {review.content.length > 300 && (
                                                    <button 
                                                        onClick={() => setSelectedReview(review)}
                                                        className="mt-4 text-[10px] font-black text-[#e50914] uppercase tracking-widest hover:underline"
                                                    >
                                                        Read Full Review
                                                    </button>
                                                )}

                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Trailers & Extras Section */}
                            {movie.videos?.results?.length > 1 && (
                                <div className="pt-12 border-t border-zinc-800">
                                    <h2 className="text-xl font-black text-white uppercase tracking-tighter mb-8">Trailers & Extras</h2>
                                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-2 px-2">
                                        {movie.videos.results.filter(v => v.site === 'YouTube').map((video) => (
                                            <div 
                                                key={video.id}
                                                onClick={() => setPlayingTrailerKey(video.key)}
                                                className="relative min-w-[240px] md:min-w-[300px] aspect-video rounded-lg overflow-hidden bg-zinc-900 group cursor-pointer"
                                            >
                                                <img 
                                                    src={`https://img.youtube.com/vi/${video.key}/mqdefault.jpg`}
                                                    alt={video.name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                                                />
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                                                        <Play className="w-5 h-5 fill-white text-white" />
                                                    </div>
                                                </div>
                                                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black to-transparent">
                                                    <p className="text-xs font-bold text-white truncate">{video.name}</p>
                                                    <p className="text-[10px] text-zinc-400 uppercase tracking-widest">{video.type}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* More Details Section - Compact Grid */}
                            <div className="pt-12 border-t border-zinc-800">
                                <h2 className="text-xl font-black text-white uppercase tracking-tighter mb-8">Cast & Crew</h2>
                                
                                {/* Cast Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 mb-12">
                                    {movie.credits?.cast?.slice(0, 12).map(person => (
                                        <div 
                                            key={person.id} 
                                            onClick={() => router.push(`/person/${person.id}`)}
                                            className="flex flex-col items-center text-center group cursor-pointer"
                                        >
                                            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden mb-3 border-2 border-zinc-800 group-hover:border-[#e50914] transition-all duration-300 shadow-lg">
                                                <img
                                                    src={person.profile_path ? `https://image.tmdb.org/t/p/w185/${person.profile_path}` : 'https://via.placeholder.com/185x185?text=No+Image'}
                                                    alt={person.name}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                                                />
                                            </div>
                                            <p className="text-white font-bold text-sm line-clamp-1">{person.name}</p>
                                            <p className="text-zinc-500 text-xs line-clamp-1">{person.character}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 pt-8 border-t border-zinc-800/50">
                                    <div>
                                        <span className="text-zinc-500 block text-[10px] uppercase font-black tracking-widest mb-3">Creative Leads</span>
                                        <div className="space-y-3">
                                            {movie.credits?.crew?.filter(c => ['Director', 'Executive Producer', 'Producer'].includes(c.job)).slice(0, 4).map(person => (
                                                <div 
                                                    key={`${person.id}-${person.job}`}
                                                    onClick={() => router.push(`/person/${person.id}`)}
                                                    className="cursor-pointer group/crew"
                                                >
                                                    <p className="text-zinc-100 font-bold text-sm group-hover/crew:text-[#e50914] transition">{person.name}</p>
                                                    <p className="text-zinc-500 text-xs uppercase tracking-tighter">{person.job}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-zinc-500 block text-[10px] uppercase font-black tracking-widest mb-3">Genres</span>
                                        <div className="flex flex-wrap gap-2">
                                            {movie.genres?.map(g => (
                                                <span key={g.id} className="bg-zinc-900 text-zinc-300 text-xs font-bold px-3 py-1 rounded-full border border-zinc-800">
                                                    {g.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-zinc-500 block text-[10px] uppercase font-black tracking-widest mb-3">Production</span>
                                        <div className="space-y-2">
                                            {movie.production_companies?.slice(0, 3).map(c => (
                                                <div key={c.id} className="flex items-center gap-2">
                                                    {c.logo_path && (
                                                        <img 
                                                            src={`https://image.tmdb.org/t/p/w92/${c.logo_path}`} 
                                                            alt="" 
                                                            className="h-4 object-contain brightness-0 invert opacity-50"
                                                        />
                                                    )}
                                                    <p className="text-zinc-300 text-sm font-bold">{c.name}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-zinc-500 block text-[10px] uppercase font-black tracking-widest mb-3">Details</span>
                                        <div className="space-y-1 text-sm">
                                            <p className="text-zinc-400">Rating: <span className="text-zinc-200 font-bold">{movie.vote_average?.toFixed(1)} (TMDB)</span></p>
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

            {selectedReview && (
                <ReviewModal 
                    review={selectedReview} 
                    onClose={() => setSelectedReview(null)} 
                />
            )}
        </div>
    );
}

