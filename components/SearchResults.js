'use client';

import React from 'react';

function SearchResults({ results, onMovieClick, onClose }) {
    const base_url = "https://image.tmdb.org/t/p/original/";

    if (!results || results.length === 0) return null;

    return (
        <div className="fixed inset-0 z-40 bg-black/95 pt-24 px-8 overflow-y-auto animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Search Results</h2>
                <button onClick={onClose} className="text-white hover:text-gray-300">Close</button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {results.map((movie) => (
                    (movie.poster_path || movie.backdrop_path) && (
                        <div
                            key={movie.id}
                            onClick={() => onMovieClick(movie)}
                            className="relative cursor-pointer transition-transform duration-300 hover:scale-105 group"
                        >
                            <img
                                className="rounded-md object-cover w-full h-auto aspect-[2/3]"
                                src={`${base_url}${movie.poster_path || movie.backdrop_path}`}
                                alt={movie.name}
                            />
                            <p className="mt-2 text-sm text-gray-300 truncate group-hover:text-white">
                                {movie.title || movie.name || movie.original_name}
                            </p>
                        </div>
                    )
                ))}
            </div>
        </div>
    );
}

export default SearchResults;
