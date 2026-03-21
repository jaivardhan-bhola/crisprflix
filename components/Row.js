'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

function Row({ title, fetchUrl, data, isLargeRow = false, onMovieClick }) {
    const [movies, setMovies] = useState([]);
    const rowRef = useRef(null);
    const [isMoved, setIsMoved] = useState(false);

    // Drag to Scroll State
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const base_url = "https://image.tmdb.org/t/p/original/";

    useEffect(() => {
        if (data) {
            setMovies(data);
            return;
        }
        
        async function fetchData() {
            if (!fetchUrl) return;
            const request = await axios.get(fetchUrl);
            setMovies(request.data.results);
            return request;
        }
        fetchData();
    }, [fetchUrl, data]);

    const handleClick = (direction) => {
        setIsMoved(true);
        if (rowRef.current) {
            const { scrollLeft, clientWidth } = rowRef.current;
            const scrollTo = direction === "left"
                ? scrollLeft - clientWidth / 2
                : scrollLeft + clientWidth / 2;

            rowRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
        }
    };

    // Drag Handlers
    const handleMouseDown = (e) => {
        setIsDragging(true);
        setStartX(e.pageX - rowRef.current.offsetLeft);
        setScrollLeft(rowRef.current.scrollLeft);
    };

    const handleMouseLeave = () => {
        setIsDragging(false);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - rowRef.current.offsetLeft;
        const walk = (x - startX) * 2; // Scroll-fast
        rowRef.current.scrollLeft = scrollLeft - walk;
    };


    return (
        <div className="space-y-0.5 md:space-y-2 px-4 group">
            <h2 className="w-56 cursor-pointer text-sm font-semibold text-[#e5e5e5] transition duration-200 hover:text-white md:text-2xl">
                {title}
            </h2>

            <div className="relative md:-ml-2">
                <ChevronLeft
                    className={`absolute top-0 bottom-0 left-2 z-40 m-auto h-9 w-9 cursor-pointer opacity-0 transition hover:scale-125 group-hover:opacity-100 ${!isMoved && "hidden"}`}
                    onClick={() => handleClick("left")}
                />

                <div
                    ref={rowRef}
                    className="flex items-center space-x-0.5 overflow-x-scroll scrollbar-hide md:space-x-2.5 md:p-2 cursor-grab active:cursor-grabbing"
                    onMouseDown={handleMouseDown}
                    onMouseLeave={handleMouseLeave}
                    onMouseUp={handleMouseUp}
                    onMouseMove={handleMouseMove}
                >
                    {movies.map((movie) => (
                        ((isLargeRow && movie.poster_path) || (!isLargeRow && movie.backdrop_path)) && (
                            <div
                                key={movie.id}
                                onClick={() => !isDragging && onMovieClick(movie)} // Prevent click on drag
                                className={`relative h-28 min-w-[180px] cursor-pointer transition duration-200 ease-out md:h-36 md:min-w-[260px] md:hover:scale-105 ${isLargeRow && "xl:min-w-[300px] xl:h-[400px]"}`}
                            >
                                <img
                                    src={`${base_url}${isLargeRow ? movie.poster_path : movie.backdrop_path || movie.poster_path}`}
                                    className="rounded-sm object-cover md:rounded w-full h-full pointer-events-none" // prevent img drag
                                    alt={movie.title || movie.name || movie.original_name}
                                />
                                {!isLargeRow && (
                                    <div className="absolute bottom-0 left-0 w-full p-2 bg-gradient-to-t from-black/80 to-transparent">
                                        <p className="text-[10px] md:text-xs text-white font-bold truncate">
                                            {movie.title || movie.name}
                                        </p>
                                        {movie.media_type === 'tv' && movie.lastWatchedSeason !== undefined && movie.lastWatchedSeason !== null && (
                                            <p className="text-[8px] md:text-[10px] text-gray-300">
                                                S{movie.lastWatchedSeason} E{movie.lastWatchedEpisode}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    ))}
                </div>

                <ChevronRight
                    className={`absolute top-0 bottom-0 right-2 z-40 m-auto h-9 w-9 cursor-pointer opacity-0 transition hover:scale-125 group-hover:opacity-100`}
                    onClick={() => handleClick("right")}
                />
            </div>
        </div>
    );
}

export default Row;
