'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Nav from '../../../components/Nav';
import Row from '../../../components/Row';
import ReviewModal from '../../../components/ReviewModal';
import Skeleton from '../../../components/Skeleton';
import { Plus, Star, Play, Info, Video, ChevronDown, Calendar, Globe, Building2, Languages, DollarSign, TrendingUp, Tv, Tag, Clapperboard, Quote, Sparkles, Volume2, VolumeX } from 'lucide-react';
import tvServers from '../../../tv.json';
import movieServers from '../../../movie.json';
import Footer from '../../../components/Footer';
import { addToContinueWatching, getContinueWatching, getEpisodeProgress, updateEpisodeProgress } from '../../../utils/continueWatching';

function DetailsContent() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const id = params?.id;
    const type = params?.type;

    const shouldPlay = searchParams.get('play') === 'true';

    const [movie, setMovie] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [selectedReview, setSelectedReview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [selectedServer, setSelectedServer] = useState('Default');

    const [season, setSeason] = useState(1);
    const [episode, setEpisode] = useState(1);
    const [episodes, setEpisodes] = useState([]);
    const [episodeProgress, setEpisodeProgress] = useState({});
    const [playingTrailerKey, setPlayingTrailerKey] = useState(null);
    const [isMuted, setIsMuted] = useState(true);
    const [showTrailer, setShowTrailer] = useState(false);

    // Load mute preference
    useEffect(() => {
        const savedMute = localStorage.getItem('crisprflix-muted');
        if (savedMute !== null) {
            setIsMuted(savedMute === 'true');
        }
    }, []);

    const toggleMute = (e) => {
        e.stopPropagation();
        const newMuted = !isMuted;
        setIsMuted(newMuted);
        localStorage.setItem('crisprflix-muted', newMuted.toString());
    };

    // Handle autoplay and clear query param
    useEffect(() => {
        if (shouldPlay && movie && !loading) {
            const history = getContinueWatching();
            const lastWatched = history.find(item => item.id.toString() === id.toString());
            const lastSeason = type === 'tv' ? (lastWatched?.lastWatchedSeason || 1) : null;
            const lastEpisode = type === 'tv' ? (lastWatched?.lastWatchedEpisode || 1) : null;
            
            const progData = getEpisodeProgress(movie.id);
            const progKey = type === 'tv' ? `s${lastSeason}e${lastEpisode}` : 'movie';
            
            updateEpisodeProgress(movie.id, type === 'tv' ? lastSeason : null, type === 'tv' ? lastEpisode : null, progData[progKey] || 1);
            setIsPlaying(true);

            // Clear the 'play' param from URL
            const params = new URLSearchParams(searchParams.toString());
            params.delete('play');
            const newQuery = params.toString();
            router.replace(`/${type}/${id}${newQuery ? `?${newQuery}` : ''}`, { scroll: false });
        }
    }, [shouldPlay, movie, loading, id, type, router, searchParams]);

    // Delay trailer showing for smoother transition
    useEffect(() => {
        if (movie && !loading) {
            const timer = setTimeout(() => setShowTrailer(true), 2000);
            return () => clearTimeout(timer);
        }
    }, [movie, loading]);

    // Search State (Unified with Home)
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [showFullOverview, setShowFullOverview] = useState(false);
    const [showAllCast, setShowAllCast] = useState(false);

    // Safety check for params
    if (!id || !type) return null;

    const formatRuntime = (mins) => {
        if (!mins) return '';
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };

    const getTimeLeft = () => {
        if (!movie) return null;
        const key = type === 'tv' ? `s${season}e${episode}` : 'movie';
        const progress = episodeProgress[key];
        if (progress > 0 && progress < 90) {
            const runtime = type === 'movie' ? movie.runtime : (movie.episode_run_time?.[0] || 45);
            if (runtime) {
                const minsLeft = Math.round(runtime * (1 - progress / 100));
                return minsLeft > 0 ? formatRuntime(minsLeft) : null;
            }
        }
        return null;
    };
    const timeLeft = getTimeLeft();

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

    useEffect(() => {
        if (id) setEpisodeProgress(getEpisodeProgress(id));
        const handleProgressUpdated = () => { if (id) setEpisodeProgress(getEpisodeProgress(id)); };
        window.addEventListener('episodeProgressUpdated', handleProgressUpdated);
        return () => window.removeEventListener('episodeProgressUpdated', handleProgressUpdated);
    }, [id]);

    useEffect(() => {
        if (type !== 'movie' && type !== 'tv') {
            setLoading(false);
            return;
        }

        async function fetchDetails() {
            try {
                const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
                const url = `https://api.themoviedb.org/3/${type}/${id}?api_key=${API_KEY}&language=en-US&append_to_response=videos,credits,external_ids,keywords`;
                const res = await fetch(url);
                const data = await res.json();

                if (data.success === false) {
                    setMovie(null);
                } else {
                    setMovie(data);
                    
                    const recUrl = `https://api.themoviedb.org/3/${type}/${id}/similar?api_key=${API_KEY}&language=en-US`;
                    const recRes = await fetch(recUrl);
                    const recData = await recRes.json();
                    setRecommendations(recData.results || []);

                    const revUrl = `https://api.themoviedb.org/3/${type}/${id}/reviews?api_key=${API_KEY}&language=en-US`;
                    const revRes = await fetch(revUrl);
                    const revData = await revRes.json();
                    setReviews(revData.results || []);

                    const history = getContinueWatching();
                    const lastWatched = history.find(item => item.id.toString() === id.toString());
                    const lastSeason = type === 'tv' ? (lastWatched?.lastWatchedSeason || 1) : null;
                    const lastEpisode = type === 'tv' ? (lastWatched?.lastWatchedEpisode || 1) : null;
                    const lastServer = lastWatched?.lastWatchedServer || (type === 'movie' ? Object.keys(movieServers)[0] : Object.keys(tvServers)[0]);
                    
                    setSelectedServer(lastServer);

                    if (type === 'tv') {
                        setSeason(lastSeason);
                        setEpisode(lastEpisode);
                        fetchSeasonDetails(lastSeason, lastEpisode, lastServer);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch details", error);
            } finally {
                setLoading(false);
            }
        }
        if (id) fetchDetails();
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
            }
        } catch (error) {
            console.error("Failed to fetch season details", error);
        }
    };

    const handleWatchClick = () => {
        setIsPlaying(true);
        if (movie) {
            const progData = getEpisodeProgress(movie.id);
            const progKey = type === 'tv' ? `s${season}e${episode}` : 'movie';
            updateEpisodeProgress(movie.id, type === 'tv' ? season : null, type === 'tv' ? episode : null, progData[progKey] || 1);
            addToContinueWatching(movie, type === 'tv' ? season : null, type === 'tv' ? episode : null, selectedServer);
        }
    };

    const trailer = useMemo(() => 
        movie?.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube') || 
        movie?.videos?.results?.find(v => v.type === 'Teaser' && v.site === 'YouTube')
    , [movie]);

    if (loading) {
        return (
            <div className="h-screen w-full bg-netflix-black flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-white/10 border-t-netflix-red rounded-full animate-spin" />
            </div>
        );
    }

    if (!movie) return <div className="h-screen bg-netflix-black text-white flex items-center justify-center">Media not found.</div>;

    return (
        <div className="relative min-h-screen bg-netflix-black text-white selection:bg-netflix-red">
            <Nav searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

            {showResults ? (
                <div className="pt-24 px-4 md:px-12 min-h-screen">
                    <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                        {isSearching ? 'Searching...' : `Results for "${searchQuery}"`}
                        {isSearching && <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                        {searchResults.map((result) => (
                            <div key={result.id} className="relative aspect-[2/3]">
                                <div
                                    onClick={() => router.push(`/${result.media_type || (result.name ? 'tv' : 'movie')}/${result.id}`)}
                                    className="group absolute inset-0 cursor-pointer transition-standard hover:scale-105 active:scale-95 z-10 hover:z-20"
                                >
                                    <div className="w-full h-full overflow-hidden rounded-xl border-2 border-transparent group-hover:border-netflix-red shadow-soft group-hover:shadow-strong transition-standard bg-surface relative">
                                        <img
                                            className="w-full h-full object-cover transition-standard group-hover:brightness-50 group-hover:scale-105"
                                            src={`https://image.tmdb.org/t/p/w500/${result.poster_path || result.backdrop_path}`}
                                            alt={result.name}
                                            loading="lazy"
                                        />
                                        {/* Hover Overlay */}
                                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-standard p-4 flex flex-col justify-end bg-gradient-to-t from-black via-black/20 to-transparent">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <div className="flex items-center gap-1 bg-netflix-red text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-soft">
                                                    <Star className="w-2.5 h-2.5 fill-current" />
                                                    {result.vote_average?.toFixed(1)}
                                                </div>
                                            </div>
                                            <h3 className="text-sm font-bold text-white line-clamp-2 leading-tight drop-shadow-md">
                                                {result.title || result.name}
                                            </h3>
                                            <p className="text-[10px] text-text-muted font-bold mt-1">
                                                {result.release_date?.split('-')[0] || result.first_air_date?.split('-')[0]}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <>
                    {/* Background Hero */}
                    <div className="relative h-[85vh] w-full overflow-hidden">
                        <div className="absolute inset-0 z-10 bg-gradient-to-t from-netflix-black via-netflix-black/40 to-transparent" />
                        <div className="absolute inset-0 z-10 bg-gradient-to-r from-netflix-black via-netflix-black/30 to-transparent" />
                        
                        {showTrailer && trailer ? (
                            <div className="absolute inset-0 w-full h-full scale-125 md:scale-110">
                                <iframe
                                    src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&loop=1&playlist=${trailer.key}&rel=0&showinfo=0&iv_load_policy=3&modestbranding=1`}
                                    className="w-full h-full pointer-events-none"
                                    allow="autoplay; encrypted-media"
                                    title="trailer"
                                />
                            </div>
                        ) : (
                            <img
                                src={`https://image.tmdb.org/t/p/original/${movie.backdrop_path || movie.poster_path}`}
                                alt={movie.title || movie.name}
                                className="w-full h-full object-cover animate-in fade-in duration-1000"
                            />
                        )}

                        {trailer && (
                            <button
                                onClick={toggleMute}
                                className="absolute bottom-12 right-12 z-20 p-3 rounded-full border border-white/40 bg-black/40 backdrop-blur-md hover:bg-black/60 transition-all active:scale-95 group"
                                aria-label={isMuted ? "Unmute" : "Mute"}
                            >
                                {isMuted ? (
                                    <VolumeX className="w-6 h-6 text-white group-hover:scale-110 transition-fast" />
                                ) : (
                                    <Volume2 className="w-6 h-6 text-white group-hover:scale-110 transition-fast" />
                                )}
                            </button>
                        )}

                        <div className="absolute bottom-0 left-0 w-full px-4 md:px-12 pb-12 z-20 max-w-4xl space-y-6">
                            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight drop-shadow-2xl">
                                {movie.title || movie.name}
                            </h1>

                            <div className="flex items-center gap-4 text-sm md:text-base font-semibold drop-shadow-md text-gray-200">
                                <div className="bg-netflix-red text-white px-2 py-0.5 rounded text-xs font-black">
                                    TMDB {movie.vote_average?.toFixed(1)}
                                </div>
                                <span>{new Date(movie.release_date || movie.first_air_date).getFullYear()}</span>
                                <span className="border border-white/30 px-1.5 py-0.5 text-[10px] rounded bg-white/10 uppercase tracking-widest">
                                    {movie.adult ? '18+' : 'PG-13'}
                                </span>
                                <span>
                                    {type === 'movie' ? formatRuntime(movie.runtime) : `${movie.number_of_seasons} Season${movie.number_of_seasons > 1 ? 's' : ''}`}
                                </span>
                            </div>

                            {movie.genres && (
                                <div className="flex flex-wrap gap-2">
                                    {movie.genres.map((genre) => (
                                        <span 
                                            key={genre.id}
                                            className="text-[10px] md:text-xs font-bold px-2 py-1 bg-white/10 rounded-full border border-white/5 hover:bg-white/20 transition-fast cursor-default"
                                        >
                                            {genre.name}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={handleWatchClick}
                                        className="bg-white text-black px-8 py-3 rounded-md font-bold flex items-center hover:bg-white/80 transition-fast active:scale-95 text-lg shadow-strong group"
                                    >
                                        <Play className="w-6 h-6 mr-2 fill-black group-hover:scale-110 transition-fast" />
                                        {timeLeft ? 'Continue' : 'Watch Now'}
                                    </button>
                                    {trailer && (
                                        <button
                                            onClick={() => setPlayingTrailerKey(trailer.key)}
                                            className="bg-white/20 text-white px-8 py-3 rounded-md font-bold flex items-center hover:bg-white/30 transition-fast active:scale-95 text-lg backdrop-blur-md border border-white/10"
                                        >
                                            <Video className="w-6 h-6 mr-2" />
                                            Trailer
                                        </button>
                                    )}
                                </div>
                                {timeLeft && (
                                    <p className="text-netflix-red font-bold uppercase tracking-tighter text-sm">
                                        {type === 'tv' ? `S${season} E${episode} • ` : ''}{timeLeft} left
                                    </p>
                                )}
                            </div>

                            <div className="space-y-3">
                                <p className={`text-lg text-gray-200 leading-relaxed drop-shadow-md ${!showFullOverview ? 'line-clamp-3' : ''}`}>
                                    {movie.overview}
                                </p>
                                {movie.overview?.length > 300 && (
                                    <button 
                                        onClick={() => setShowFullOverview(!showFullOverview)}
                                        className="text-netflix-red font-bold text-sm uppercase tracking-wider hover:underline underline-offset-4"
                                    >
                                        {showFullOverview ? 'Show Less' : 'Read More'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="px-4 md:px-12 py-16 space-y-20 bg-gradient-to-b from-netflix-black to-black">
                        {/* TV Episodes */}
                        {type === 'tv' && (
                            <section className="max-w-7xl mx-auto">
                                <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
                                    <h2 className="text-2xl font-bold uppercase tracking-tight">Episodes</h2>
                                    <div className="relative group">
                                        <select
                                            value={season}
                                            onChange={(e) => fetchSeasonDetails(parseInt(e.target.value))}
                                            className="bg-surface text-white text-sm font-bold border border-white/10 rounded-md px-4 py-2 outline-none focus:border-white cursor-pointer hover:bg-surface-hover transition-fast appearance-none pr-10"
                                        >
                                            {movie.seasons?.filter(s => s.season_number > 0).map((s) => (
                                                <option key={s.id} value={s.season_number}>
                                                    Season {s.season_number}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none transition-fast group-hover:text-white" />
                                    </div>
                                </div>

                                <div className="grid gap-4">
                                    {episodes.map((ep) => (
                                        <div
                                            key={ep.id}
                                            onClick={() => { setEpisode(ep.episode_number); setIsPlaying(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                            className="flex flex-col md:flex-row items-center gap-6 p-4 bg-surface/30 hover:bg-surface/60 transition-standard rounded-xl cursor-pointer group border border-transparent hover:border-white/10"
                                        >
                                            <span className="text-2xl font-black text-text-muted w-8 text-center group-hover:text-white transition-fast">{ep.episode_number}</span>
                                            <div className="relative w-full md:w-64 aspect-video flex-shrink-0 overflow-hidden rounded-lg bg-surface shadow-soft">
                                                <img
                                                    src={ep.still_path ? `https://image.tmdb.org/t/p/w500/${ep.still_path}` : 'https://via.placeholder.com/500x281?text=No+Image'}
                                                    className="w-full h-full object-cover transition-standard group-hover:scale-105"
                                                    alt=""
                                                />
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-fast">
                                                    <Play className="w-12 h-12 fill-white scale-75 group-hover:scale-100 transition-standard" />
                                                </div>
                                                {episodeProgress[`s${season}e${ep.episode_number}`] > 0 && (
                                                    <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20">
                                                        <div className="h-full bg-netflix-red" style={{ width: `${episodeProgress[`s${season}e${ep.episode_number}`]}%` }} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-grow">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="text-lg font-bold group-hover:text-netflix-red transition-fast">{ep.name}</h3>
                                                    <span className="text-xs text-text-muted font-bold">{ep.runtime ? formatRuntime(ep.runtime) : ''}</span>
                                                </div>
                                                <p className="text-text-secondary text-sm line-clamp-2 leading-relaxed">{ep.overview || "No overview available."}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Cast */}
                        <section className="max-w-7xl mx-auto">
                            <div className="flex items-center justify-between mb-10 pb-4 border-b border-white/10">
                                <h2 className="text-2xl font-bold uppercase tracking-tight">Cast & Crew</h2>
                                {movie.credits?.cast?.length > 12 && (
                                    <button 
                                        onClick={() => setShowAllCast(!showAllCast)}
                                        className="text-netflix-red font-bold text-sm uppercase tracking-wider hover:underline underline-offset-4"
                                    >
                                        {showAllCast ? 'Show Less' : 'See All'}
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8">
                                {movie.credits?.cast?.slice(0, showAllCast ? 30 : 12).map(person => (
                                    <div key={person.id} className="flex flex-col items-center text-center group cursor-pointer" onClick={() => router.push(`/person/${person.id}`)}>
                                        <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden mb-4 border-2 border-white/5 group-hover:border-netflix-red transition-standard shadow-soft">
                                            <img
                                                src={person.profile_path ? `https://image.tmdb.org/t/p/w185/${person.profile_path}` : 'https://via.placeholder.com/185x185?text=No+Image'}
                                                className="w-full h-full object-cover transition-standard group-hover:scale-110"
                                                alt=""
                                            />
                                        </div>
                                        <p className="font-bold text-sm text-text-primary group-hover:text-white">{person.name}</p>
                                        <p className="text-text-muted text-xs mt-1">{person.character}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Recommendations */}
                        {recommendations.length > 0 && (
                            <Row title="More Like This" data={recommendations.map(r => ({ ...r, media_type: type }))} onMovieClick={(m) => router.push(`/${type}/${m.id}`)} className="px-0" />
                        )}

                        {/* Reviews */}
                        {reviews.length > 0 && (
                            <section className="max-w-7xl mx-auto">
                                <h2 className="text-2xl font-bold mb-10 uppercase tracking-tight border-b border-white/10 pb-4">Reviews</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {reviews.slice(0, 4).map((review) => (
                                        <div key={review.id} className="bg-surface/30 p-8 rounded-2xl border border-white/5 hover:bg-surface/50 transition-standard group">
                                            <div className="flex items-center gap-4 mb-6">
                                                <div className="w-12 h-12 rounded-full bg-surface-hover flex items-center justify-center text-text-muted overflow-hidden border border-white/10 shadow-soft">
                                                    {review.author_details?.avatar_path ? (
                                                        <img src={`https://image.tmdb.org/t/p/w45${review.author_details.avatar_path}`} className="w-full h-full object-cover" alt="" />
                                                    ) : review.author[0]}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white">{review.author}</p>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <div className="flex text-yellow-500 scale-75 -ml-2">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round((review.author_details?.rating || 0) / 2) ? 'fill-current' : 'opacity-20'}`} />
                                                            ))}
                                                        </div>
                                                        <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest">{new Date(review.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-text-secondary text-sm leading-relaxed line-clamp-4 italic group-hover:text-text-primary transition-fast">"{review.content}"</p>
                                            {review.content.length > 300 && (
                                                <button onClick={() => setSelectedReview(review)} className="mt-4 text-[10px] font-black text-netflix-red uppercase tracking-widest hover:underline decoration-2 underline-offset-4">Read Full Review</button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Full Details Grid */}
                        <section className="max-w-7xl mx-auto border-t border-white/10 pt-24 pb-12">
                            <div className="flex items-center gap-6 mb-16 border-l-4 border-netflix-red pl-6">
                                <div className="p-3 bg-surface rounded-xl shadow-strong">
                                    <Clapperboard className="w-8 h-8 text-netflix-red" />
                                </div>
                                <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter italic">About {movie.title || movie.name}</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                <div className="group bg-surface/30 border border-white/5 p-8 rounded-2xl hover:bg-surface/50 transition-standard hover:border-white/10 shadow-soft hover:shadow-strong">
                                    <div className="flex items-center gap-3 mb-6">
                                        <Tag className="w-4 h-4 text-netflix-red" />
                                        <h4 className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em]">Genres</h4>
                                    </div>
                                    <p className="text-lg font-bold text-gray-200 group-hover:text-white transition-fast">
                                        {movie.genres?.map(g => g.name).join(', ')}
                                    </p>
                                </div>

                                {movie.production_companies?.length > 0 && (
                                    <div className="group bg-surface/30 border border-white/5 p-8 rounded-2xl hover:bg-surface/50 transition-standard hover:border-white/10 shadow-soft hover:shadow-strong">
                                        <div className="flex items-center gap-3 mb-6">
                                            <Building2 className="w-4 h-4 text-netflix-red" />
                                            <h4 className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em]">Production</h4>
                                        </div>
                                        <p className="text-sm font-medium text-gray-200 leading-relaxed group-hover:text-white transition-fast">
                                            {movie.production_companies.map(c => c.name).join(', ')}
                                        </p>
                                    </div>
                                )}

                                {((type === 'movie' ? movie.keywords?.keywords : movie.keywords?.results)?.length > 0) && (
                                    <div className="group bg-surface/30 border border-white/5 p-8 rounded-2xl hover:bg-surface/50 transition-standard hover:border-white/10 shadow-soft hover:shadow-strong">
                                        <div className="flex items-center gap-3 mb-6">
                                            <Sparkles className="w-4 h-4 text-netflix-red" />
                                            <h4 className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em]">Themes</h4>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {(type === 'movie' ? movie.keywords.keywords : movie.keywords.results).slice(0, 5).map(k => (
                                                <span 
                                                    key={k.id} 
                                                    className="text-[10px] font-black uppercase tracking-widest text-text-muted group-hover:text-netflix-red bg-white/5 px-2 py-1 rounded transition-fast"
                                                >
                                                    #{k.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="group bg-surface/30 border border-white/5 p-8 rounded-2xl hover:bg-surface/50 transition-standard hover:border-white/10 shadow-soft hover:shadow-strong">
                                    <div className="flex items-center gap-3 mb-6">
                                        <Info className="w-4 h-4 text-netflix-red" />
                                        <h4 className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em]">Status</h4>
                                    </div>
                                    <p className="text-lg font-bold text-gray-200 group-hover:text-white transition-fast">
                                        {movie.status}
                                    </p>
                                </div>

                                {type === 'movie' && movie.budget > 0 && (
                                    <div className="group bg-surface/30 border border-white/5 p-8 rounded-2xl hover:bg-surface/50 transition-standard hover:border-white/10 shadow-soft hover:shadow-strong">
                                        <div className="flex items-center gap-3 mb-6">
                                            <DollarSign className="w-4 h-4 text-netflix-red" />
                                            <h4 className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em]">Budget</h4>
                                        </div>
                                        <p className="text-lg font-bold text-gray-200 group-hover:text-white transition-fast">
                                            ${movie.budget.toLocaleString()}
                                        </p>
                                    </div>
                                )}

                                {type === 'movie' && movie.revenue > 0 && (
                                    <div className="group bg-surface/30 border border-white/5 p-8 rounded-2xl hover:bg-surface/50 transition-standard hover:border-white/10 shadow-soft hover:shadow-strong">
                                        <div className="flex items-center gap-3 mb-6">
                                            <TrendingUp className="w-4 h-4 text-netflix-red" />
                                            <h4 className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em]">Revenue</h4>
                                        </div>
                                        <p className="text-lg font-bold text-gray-200 group-hover:text-white transition-fast">
                                            ${movie.revenue.toLocaleString()}
                                        </p>
                                    </div>
                                )}

                                {type === 'tv' && movie.networks?.length > 0 && (
                                    <div className="group bg-surface/30 border border-white/5 p-8 rounded-2xl hover:bg-surface/50 transition-standard hover:border-white/10 shadow-soft hover:shadow-strong">
                                        <div className="flex items-center gap-3 mb-6">
                                            <Tv className="w-4 h-4 text-netflix-red" />
                                            <h4 className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em]">Network</h4>
                                        </div>
                                        <div className="flex flex-wrap gap-4 mt-2">
                                            {movie.networks.map(n => (
                                                n.logo_path ? (
                                                    <img 
                                                        key={n.id}
                                                        src={`https://image.tmdb.org/t/p/h30${n.logo_path}`}
                                                        alt={n.name}
                                                        className="h-6 object-contain brightness-0 invert opacity-70 group-hover:opacity-100 transition-standard"
                                                    />
                                                ) : <span key={n.id} className="text-lg font-bold text-gray-200">{n.name}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                </>
            )}

            {/* Overlays */}
            {playingTrailerKey && (
                <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setPlayingTrailerKey(null)}>
                    <button className="absolute top-6 right-6 text-white/60 hover:text-white transition-fast"><Plus className="w-10 h-10 rotate-45" /></button>
                    <div className="w-full max-w-5xl aspect-video rounded-xl overflow-hidden shadow-strong border border-white/10" onClick={e => e.stopPropagation()}>
                        <iframe src={`https://www.youtube.com/embed/${playingTrailerKey}?autoplay=1`} className="w-full h-full" allowFullScreen allow="autoplay; encrypted-media" />
                    </div>
                </div>
            )}

            {isPlaying && (
                <div className="fixed inset-0 z-50 bg-black flex flex-col animate-in fade-in duration-300">
                    <div className="absolute top-0 left-0 w-full p-4 flex items-center justify-between z-10 bg-gradient-to-b from-black/80 to-transparent">
                        <button onClick={() => setIsPlaying(false)} className="flex items-center gap-2 text-white hover:text-gray-300 transition-fast">
                            <Plus className="w-8 h-8 rotate-45" />
                            <span className="font-bold">Back</span>
                        </button>
                        <div className="flex gap-3">
                            <select value={selectedServer} onChange={(e) => setSelectedServer(e.target.value)} className="bg-black/60 text-white text-xs border border-white/20 rounded px-3 py-1.5 outline-none focus:border-netflix-red hover:bg-black/80 transition-fast">
                                {Object.keys(type === 'movie' ? movieServers : tvServers).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            {type === 'tv' && (
                                <>
                                    <select value={season} onChange={(e) => fetchSeasonDetails(parseInt(e.target.value))} className="bg-black/60 text-white text-xs border border-white/20 rounded px-3 py-1.5 outline-none focus:border-netflix-red hover:bg-black/80 transition-fast">
                                        {movie.seasons?.filter(s => s.season_number > 0).map(s => <option key={s.id} value={s.season_number}>Season {s.season_number}</option>)}
                                    </select>
                                    <select value={episode} onChange={(e) => setEpisode(parseInt(e.target.value))} className="bg-black/60 text-white text-xs border border-white/20 rounded px-3 py-1.5 outline-none focus:border-netflix-red hover:bg-black/80 transition-fast">
                                        {episodes.map(e => <option key={e.id} value={e.episode_number}>Ep {e.episode_number}</option>)}
                                    </select>
                                </>
                            )}
                        </div>
                    </div>
                    <iframe src={(type === 'movie' ? movieServers : tvServers)[selectedServer].replace('{tmdbId}', id).replace('{season}', season).replace('{episode}', episode)} className="w-full h-full" allowFullScreen allow="autoplay" />
                </div>
            )}

            {selectedReview && <ReviewModal review={selectedReview} onClose={() => setSelectedReview(null)} />}
            {!showResults && <Footer />}
        </div>
    );
}

export default function Details() {
    return (
        <Suspense fallback={
            <div className="h-screen w-full bg-netflix-black flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-white/10 border-t-netflix-red rounded-full animate-spin" />
            </div>
        }>
            <DetailsContent />
        </Suspense>
    );
}
