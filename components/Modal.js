'use client';

import React from 'react';
import { X, Star, Calendar } from 'lucide-react';

function Modal({ movie, onClose }) {
    if (!movie) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="relative w-full max-w-4xl bg-[#181818] rounded-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 bg-black/50 rounded-full hover:bg-white/20 transition-colors"
                >
                    <X className="w-6 h-6 text-white" />
                </button>

                <div className="relative h-96 w-full">
                    <img
                        src={`https://image.tmdb.org/t/p/original/${movie.backdrop_path || movie.poster_path}`}
                        alt={movie.title || movie.name}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-transparent to-transparent" />

                    <div className="absolute bottom-0 left-0 p-8 w-full">
                        <h2 className="text-4xl font-bold text-white mb-2">
                            {movie.title || movie.name || movie.original_name}
                        </h2>
                        <div className="flex items-center gap-4 text-sm font-semibold">
                            <div className="flex items-center gap-1.5 bg-[#01b4e4] text-white px-1.5 py-0.5 rounded-sm font-black text-xs">
                                TMDB {movie.vote_average?.toFixed(1)}
                            </div>
                            <span className="text-gray-300 flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {movie.release_date || movie.first_air_date}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="p-8 pt-0 text-white">
                    <p className="text-lg leading-relaxed text-gray-300">
                        {movie.overview}
                    </p>
                    <div className="mt-4 text-sm text-gray-500">
                        <span className="block">Original Language: {movie.original_language?.toUpperCase()} </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Modal;
