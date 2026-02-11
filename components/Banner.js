'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Play, Info } from 'lucide-react';
import requests from '../utils/requests';


function Banner({ onMovieClick }) {
    const [movies, setMovies] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [showResults, setShowResults] = useState(false);

    // Fetch Trending Movies for Carousel
    useEffect(() => {
        async function fetchData() {
            try {
                const request = await axios.get(requests.fetchTrending);
                if (request.data.results && request.data.results.length > 0) {
                    setMovies(request.data.results.slice(0, 8)); // Top 8 trending
                }
                return request;
            } catch (error) {
                console.error("Failed to fetch banner movies:", error);
            }
        }
        fetchData();
    }, []);

    // Auto-rotate Carousel
    useEffect(() => {
        if (!movies || movies.length === 0) return;
        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % movies.length);
        }, 7000); // 7 seconds
        return () => clearInterval(interval);
    }, [movies]);


    function truncate(string, n) {
        return string?.length > n ? string.substr(0, n - 1) + '...' : string;
    }

    const movie = movies[currentIndex];

    return (
        <>
            <header
                className="relative h-[550px] text-white object-contain transition-all duration-1000 ease-in-out"
                style={{
                    backgroundSize: 'cover',
                    backgroundImage: `url("https://image.tmdb.org/t/p/original/${movie?.backdrop_path}")`,
                    backgroundPosition: 'center center',
                }}
            >


                <div className="ml-8 pt-44 h-48 relative z-20">
                    <h1 className="text-5xl font-bold pb-1.5 uppercase drop-shadow-lg">
                        {movie?.title || movie?.name || movie?.original_name}
                    </h1>
                    <div className="flex space-x-3 mt-4">
                        <button
                            onClick={() => onMovieClick(movie)}
                            className="flex items-center gap-2 cursor-pointer text-black bg-white outline-none border-none font-bold rounded-md px-8 py-2 hover:bg-opacity-80 transition-all"
                        >
                            <Play className="w-5 h-5 fill-black" /> Play
                        </button>
                        <button
                            onClick={() => onMovieClick(movie)}
                            className="flex items-center gap-2 cursor-pointer text-white bg-[gray]/50 outline-none border-none font-bold rounded-md px-8 py-2 hover:bg-[#e6e6e6]/20 transition-all"
                        >
                            <Info className="w-5 h-5" /> More Info
                        </button>
                    </div>
                    <h1 className="w-[45rem] leading-[1.3] pt-4 text-sm max-w-[360px] h-[80px] drop-shadow-md">
                        {truncate(movie?.overview, 150)}
                    </h1>
                </div>

                {/* Carousel Indicators */}
                <div className="absolute right-10 bottom-32 flex flex-col gap-2 z-20">
                    {movies.map((m, idx) => (
                        <div
                            key={m.id}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === currentIndex ? 'bg-white scale-125' : 'bg-gray-500'}`}
                        />
                    ))}
                </div>

                <div className="h-[7.4rem] bg-gradient-to-b from-transparent via-[rgba(37,37,37,0.61)] to-[#141414] absolute bottom-0 w-full" />
            </header>


        </>
    );
}

export default Banner;
