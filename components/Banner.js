'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Play, Info } from 'lucide-react';
import requests from '../utils/requests';
import Skeleton from './Skeleton';

function Banner({ onMovieClick }) {
    const [movies, setMovies] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const request = await axios.get(requests.fetchTrending);
                if (request.data.results && request.data.results.length > 0) {
                    setMovies(request.data.results.slice(0, 8));
                }
            } catch (error) {
                console.error("Failed to fetch banner movies:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    useEffect(() => {
        if (!movies || movies.length === 0) return;
        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % movies.length);
        }, 8000);
        return () => clearInterval(interval);
    }, [movies]);

    function truncate(string, n) {
        return string?.length > n ? string.substr(0, n - 1) + '...' : string;
    }

    const movie = movies[currentIndex];

    if (loading) {
        return (
            <div className="relative h-[70vh] md:h-[85vh] w-full">
                <Skeleton className="h-full w-full rounded-none" />
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-netflix-black to-transparent" />
            </div>
        );
    }

    return (
        <header
            className="relative h-[70vh] md:h-[85vh] w-full text-white overflow-hidden"
        >
            {/* Background Image with standard transition */}
            <div 
                className="absolute inset-0 z-0 transition-opacity duration-1000 ease-in-out"
                style={{
                    backgroundImage: `url("https://image.tmdb.org/t/p/original/${movie?.backdrop_path}")`,
                    backgroundPosition: 'center 20%',
                    backgroundSize: 'cover',
                }}
            >
                <div className="absolute inset-0 bg-black/30" />
            </div>

            {/* Bottom Gradient Overlay */}
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-netflix-black via-netflix-black/20 to-transparent" />
            <div className="absolute inset-0 z-10 bg-gradient-to-r from-netflix-black via-netflix-black/40 to-transparent" />

            <div className="relative z-20 h-full flex flex-col justify-center px-4 md:px-12 pt-20">
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold max-w-[80%] leading-tight drop-shadow-2xl">
                    {movie?.title || movie?.name || movie?.original_name}
                </h1>

                <div className="flex items-center gap-3 mt-6">
                    <button
                        onClick={() => onMovieClick(movie, true)}
                        className="flex items-center gap-2 px-6 md:px-8 py-2 md:py-3 bg-white text-black font-bold rounded-md hover:bg-white/80 transition-fast active:scale-95 group"
                    >
                        <Play className="w-5 h-5 fill-black group-hover:scale-110 transition-fast" /> 
                        <span className="text-sm md:text-base">Play</span>
                    </button>
                    <button
                        onClick={() => onMovieClick(movie)}
                        className="flex items-center gap-2 px-6 md:px-8 py-2 md:py-3 bg-gray-500/50 text-white font-bold rounded-md hover:bg-gray-500/70 transition-fast active:scale-95 group"
                    >
                        <Info className="w-5 h-5 group-hover:scale-110 transition-fast" /> 
                        <span className="text-sm md:text-base">More Info</span>
                    </button>
                </div>

                <p className="mt-6 text-sm md:text-lg text-gray-200 max-w-xl line-clamp-3 drop-shadow-md">
                    {movie?.overview}
                </p>

                {/* Carousel Indicators */}
                <div className="mt-8 flex gap-2">
                    {movies.map((m, idx) => (
                        <button
                            key={m.id}
                            onClick={() => setCurrentIndex(idx)}
                            className={`h-1.5 transition-all duration-300 rounded-full ${idx === currentIndex ? 'w-8 bg-white' : 'w-4 bg-white/30 hover:bg-white/50'}`}
                            aria-label={`Go to slide ${idx + 1}`}
                        />
                    ))}
                </div>
            </div>
        </header>
    );
}

export default Banner;
