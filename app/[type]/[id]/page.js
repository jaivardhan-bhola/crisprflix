'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Nav from '../../../components/Nav';
import { Plus, ThumbsUp, VolumeX } from 'lucide-react';
import tvServers from '../../../tv.json';
import movieServers from '../../../movie.json';

export default function Details() {
    const params = useParams();
    const router = useRouter(); // For redirect if type is invalid
    const id = params.id;
    const type = params.type; // 'movie' or 'tv'

    const [movie, setMovie] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [selectedServer, setSelectedServer] = useState('Default');

    // TV Show State
    const [season, setSeason] = useState(1);
    const [episode, setEpisode] = useState(1);
    const [episodes, setEpisodes] = useState([]);

    useEffect(() => {
        // Validate type
        if (type !== 'movie' && type !== 'tv') {
            // Redirect to home or 404 if invalid type
            // For now, let's just not fetch
            setLoading(false);
            return;
        }

        // Set default server based on type
        if (type === 'movie') {
            setSelectedServer(Object.keys(movieServers)[0] || 'Default');
        } else {
            setSelectedServer(Object.keys(tvServers)[0] || 'Default');
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

                    // If TV, fetch season 1 by default
                    if (type === 'tv') {
                        fetchSeasonDetails(1);
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

    const fetchSeasonDetails = async (seasonNum) => {
        try {
            const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
            const res = await fetch(`https://api.themoviedb.org/3/tv/${id}/season/${seasonNum}?api_key=${API_KEY}&language=en-US`);
            const data = await res.json();
            if (data.episodes) {
                setEpisodes(data.episodes);
                setSeason(seasonNum);
                setEpisode(1);
            }
        } catch (error) {
            console.error("Failed to fetch season details", error);
        }
    };

    const handleSeasonChange = (e) => {
        const newSeason = parseInt(e.target.value);
        fetchSeasonDetails(newSeason);
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
        <div className="relative min-h-screen bg-[#141414] text-white pt-20">
            <Nav />

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
                                {Object.keys(type === 'movie' ? movieServers : tvServers).map((server) => (
                                    <button
                                        key={server}
                                        onClick={() => setSelectedServer(server)}
                                        className={`px-3 py-1 rounded text-sm font-medium transition-colors shadow-md ${selectedServer === server ? 'bg-[#e50914] text-white' : 'bg-gray-800/80 text-gray-400 hover:bg-gray-700'}`}
                                    >
                                        {server}
                                    </button>
                                ))}
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
            <div className="relative h-[70vh] w-full">
                <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/40 to-transparent z-10" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent z-10" />
                <img
                    src={`https://image.tmdb.org/t/p/original/${movie.backdrop_path || movie.poster_path}`}
                    alt={movie.title || movie.name}
                    className="w-full h-full object-cover"
                />

                <div className="absolute bottom-0 left-0 w-full p-8 md:p-16 z-20 space-y-6">
                    <h1 className="text-4xl md:text-6xl font-black drop-shadow-xl max-w-2xl">
                        {movie.title || movie.name}
                    </h1>

                    <div className="flex items-center space-x-4 text-sm md:text-base text-gray-300 font-semibold">
                        <span className="text-green-400">
                            {Math.round(movie.vote_average * 10)}% Match
                        </span>
                        <span>
                            {new Date(movie.release_date || movie.first_air_date).getFullYear()}
                        </span>
                        <span className="border border-gray-500 px-1 text-xs rounded">
                            {movie.adult ? '18+' : 'PG-13'}
                        </span>
                        <span>
                            {type === 'movie'
                                ? `${movie.runtime || (movie.episode_run_time && movie.episode_run_time[0])}m`
                                : `${movie.number_of_seasons} Season${movie.number_of_seasons > 1 ? 's' : ''}`
                            }
                        </span>
                    </div>

                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => setIsPlaying(true)}
                            className="bg-white text-black px-6 md:px-8 py-2 md:py-3 rounded font-bold flex items-center hover:bg-white/90 transition"
                        >
                            <svg className="w-6 h-6 mr-2 fill-current" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                            Watch Now
                        </button>
                    </div>

                    <p className="max-w-xl text-lg md:text-xl text-shadow-md leading-relaxed text-gray-200">
                        {movie.overview}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm text-gray-400 max-w-4xl pt-4">
                        <div>
                            <span className="text-gray-500">Genres: </span>
                            {movie.genres?.map(g => g.name).join(', ')}
                        </div>
                        {movie.production_companies && (
                            <div>
                                <span className="text-gray-500">Produced by: </span>
                                {movie.production_companies.map(c => c.name).join(', ')}
                            </div>
                        )}
                        <div>
                            <span className="text-gray-500">Original Language: </span>
                            {movie.original_language?.toUpperCase()}
                        </div>
                        <div>
                            <span className="text-gray-500">Status: </span>
                            {movie.status}
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-8 md:px-16 py-10">
                {type === 'tv' && (
                    <div className="max-w-6xl mx-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-white">Episodes</h2>
                            {movie.seasons && (
                                <select
                                    value={season}
                                    onChange={handleSeasonChange}
                                    className="bg-[#242424] text-white text-lg font-bold border border-gray-600 rounded px-4 py-2 outline-none focus:border-white cursor-pointer"
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

                        <div className="space-y-4 border-t border-gray-800 pt-6">
                            {episodes.map((ep) => (
                                <div
                                    key={ep.id}
                                    className="flex flex-col md:flex-row items-center gap-6 p-4 hover:bg-[#333] transition rounded-lg cursor-pointer group border-b border-gray-800 last:border-0"
                                    onClick={() => {
                                        setEpisode(ep.episode_number);
                                        setIsPlaying(true);
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                >
                                    <div className="text-2xl font-bold text-gray-500 w-8 flex-shrink-0 text-center">{ep.episode_number}</div>
                                    <div className="relative w-full md:w-72 aspect-video flex-shrink-0 overflow-hidden rounded-md bg-zinc-800">
                                        <img
                                            src={ep.still_path ? `https://image.tmdb.org/t/p/w500/${ep.still_path}` : 'https://via.placeholder.com/500x281?text=No+Image'}
                                            alt={ep.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                        />
                                        {/* Play Overlay */}
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300 bg-black/40">
                                            <svg className="w-12 h-12 fill-white drop-shadow-lg" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                        </div>
                                    </div>
                                    <div className="flex-grow min-w-0 self-start md:self-center">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-lg font-bold text-white truncate">{ep.name}</h3>
                                            <span className="text-sm text-gray-400 font-mono">{ep.runtime ? `${ep.runtime}m` : ''}</span>
                                        </div>
                                        <p className="text-sm text-gray-400 line-clamp-2 md:line-clamp-3 leading-relaxed">{ep.overview}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
}
