import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { getEpisodeProgress } from '../utils/continueWatching';
import Skeleton from './Skeleton';

function Row({ title, fetchUrl, data, isLargeRow = false, onMovieClick, className }) {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const rowRef = useRef(null);
    const [isAtStart, setIsAtStart] = useState(true);
    const [isAtEnd, setIsAtEnd] = useState(false);

    const base_url = "https://image.tmdb.org/t/p/w500/";

    const checkScroll = () => {
        if (rowRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
            setIsAtStart(scrollLeft <= 5);
            // Allow 5px tolerance for precision issues
            setIsAtEnd(scrollLeft + clientWidth >= scrollWidth - 5);
        }
    };

    useEffect(() => {
        if (data) {
            setMovies(data);
            setLoading(false);
            // Check scroll once data is rendered
            setTimeout(checkScroll, 100);
            return;
        }
        
        async function fetchData() {
            if (!fetchUrl) return;
            setLoading(true);
            try {
                const request = await axios.get(fetchUrl);
                setMovies(request.data.results);
                // Check scroll once data is rendered
                setTimeout(checkScroll, 100);
            } catch (error) {
                console.error("Failed to fetch row data:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [fetchUrl, data]);

    useEffect(() => {
        const rowElement = rowRef.current;
        if (rowElement) {
            rowElement.addEventListener('scroll', checkScroll);
            window.addEventListener('resize', checkScroll);
        }
        return () => {
            if (rowElement) rowElement.removeEventListener('scroll', checkScroll);
            window.removeEventListener('resize', checkScroll);
        };
    }, [movies]);

    const scroll = (direction) => {
        if (rowRef.current) {
            const { scrollLeft, clientWidth } = rowRef.current;
            const scrollTo = direction === "left"
                ? scrollLeft - clientWidth
                : scrollLeft + clientWidth;

            rowRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
        }
    };

    const getTimeLeft = (movie) => {
        const progressData = getEpisodeProgress(movie.id);
        const progressKey = movie.media_type === 'tv' 
            ? `s${movie.lastWatchedSeason}e${movie.lastWatchedEpisode}` 
            : 'movie';

        const progress = progressData[progressKey];
        if (progress > 0 && progress < 90) {
            const mType = movie.media_type || (movie.first_air_date ? 'tv' : 'movie');
            const runtime = mType === 'movie' ? movie.runtime : (movie.episode_run_time?.[0] || 45);
            if (runtime) {
                const minsLeft = Math.round(runtime * (1 - progress / 100));
                return minsLeft > 0 ? formatRuntime(minsLeft) : null;
            }
        }
        return null;
    };
    // Helper for formatting runtime
    const formatRuntime = (mins) => {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };

    return (
        <div className={`space-y-4 ${className || ""} group/row`}>
            <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-text-primary transition-standard group-hover/row:text-white cursor-default px-4 md:px-12 lg:px-16">
                {title}
            </h2>

            <div className="relative group">
                {!isAtStart && (
                    <button
                        className="absolute top-0 bottom-0 left-0 z-40 m-auto h-full w-12 items-center justify-center bg-black/40 opacity-0 transition-fast hover:bg-black/60 group-hover:opacity-100 flex cursor-pointer"
                        onClick={() => scroll("left")}
                    >
                        <ChevronLeft className="h-8 w-8 text-white" />
                    </button>
                )}

                <div
                    ref={rowRef}
                    className="flex items-center gap-6 overflow-x-scroll scrollbar-hide py-8 -my-8 px-4 md:px-12 lg:px-16"
                >
                    {loading ? (
                        [...Array(6)].map((_, i) => (
                            <Skeleton 
                                key={i} 
                                className={`flex-shrink-0 ${isLargeRow ? 'w-[200px] h-[300px] md:w-[250px] md:h-[375px]' : 'w-[200px] h-[112px] md:w-[280px] md:h-[157px]'}`} 
                            />
                        ))
                    ) : (
                        movies.map((movie) => (
                            ((isLargeRow && movie.poster_path) || (!isLargeRow && (movie.backdrop_path || movie.poster_path))) && (
                                <div
                                    key={movie.id}
                                    className={`relative flex-shrink-0 z-10 hover:z-30
                                        ${isLargeRow ? 'w-[200px] h-[300px] md:w-[250px] md:h-[375px]' : 'w-[200px] h-[112px] md:w-[280px] md:h-[157px]'}`}
                                >
                                    <div 
                                        onClick={() => onMovieClick(movie)}
                                        className="absolute inset-0 cursor-pointer transition-standard hover:scale-105 active:scale-95"
                                    >
                                        <div className="w-full h-full overflow-hidden rounded-xl border-2 border-transparent hover:border-netflix-red shadow-soft hover:shadow-strong transition-standard relative bg-surface">
                                            <img
                                                src={`${base_url}${isLargeRow ? movie.poster_path : movie.backdrop_path || movie.poster_path}`}
                                                className="object-cover w-full h-full transition-standard hover:brightness-50"
                                                alt={movie.title || movie.name}
                                                loading="lazy"
                                            />

                                            {/* Hover Overlay */}
                                            <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-standard p-4 flex flex-col justify-end bg-gradient-to-t from-black via-black/20 to-transparent">
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    {title !== "Continue Watching" && (
                                                        <div className="flex items-center gap-1 bg-netflix-red text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-soft">
                                                            <Star className="w-2.5 h-2.5 fill-current" />
                                                            {movie.vote_average?.toFixed(1)}
                                                        </div>
                                                    )}
                                                    {getTimeLeft(movie) && (

                                                        <span className="text-[10px] font-black text-white bg-black/40 px-1.5 py-0.5 rounded border border-white/10">
                                                            {getTimeLeft(movie)} left
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="text-sm font-bold text-white line-clamp-2 leading-tight drop-shadow-md">
                                                    {movie.title || movie.name}
                                                </h3>
                                                {movie.character && (
                                                    <p className="text-[10px] text-text-muted font-bold mt-1 line-clamp-1 italic">
                                                        as {movie.character}
                                                    </p>
                                                )}
                                                <p className="text-[10px] text-text-muted font-bold mt-1">
                                                    {movie.release_date?.split('-')[0] || movie.first_air_date?.split('-')[0]}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        ))
                    )}
                </div>

                {!isAtEnd && (
                    <button
                        className="absolute top-0 bottom-0 right-0 z-40 m-auto h-full w-12 items-center justify-center bg-black/40 opacity-0 transition-fast hover:bg-black/60 group-hover:opacity-100 flex cursor-pointer"
                        onClick={() => scroll("right")}
                    >
                        <ChevronRight className="h-8 w-8 text-white" />
                    </button>
                )}
            </div>
        </div>
    );
}


export default Row;
