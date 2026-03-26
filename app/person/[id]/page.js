'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Nav from '../../../components/Nav';
import { Calendar, MapPin, Star, Film } from 'lucide-react';

export default function PersonDetails() {
    const params = useParams();
    const router = useRouter();
    const id = params.id;

    const [person, setPerson] = useState(null);
    const [credits, setCredits] = useState([]);
    const [loading, setLoading] = useState(true);
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

    useEffect(() => {
        async function fetchPersonData() {
            try {
                const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
                
                // Fetch person details
                const personRes = await fetch(`https://api.themoviedb.org/3/person/${id}?api_key=${API_KEY}&language=en-US`);
                const personData = await personRes.json();
                setPerson(personData);

                // Fetch combined credits (movies and TV)
                const creditsRes = await fetch(`https://api.themoviedb.org/3/person/${id}/combined_credits?api_key=${API_KEY}&language=en-US`);
                const creditsData = await creditsRes.json();
                
                // Sort by popularity and filter items without posters
                const sortedCredits = creditsData.cast
                    .filter(item => item.poster_path || item.backdrop_path)
                    .sort((a, b) => b.popularity - a.popularity);
                
                setCredits(sortedCredits);
            } catch (error) {
                console.error("Failed to fetch person data", error);
            } finally {
                setLoading(false);
            }
        }

        if (id) {
            fetchPersonData();
        }
    }, [id]);

    const handleMovieClick = (movie) => {
        if (!movie) return;
        let type = movie.media_type || (movie.first_air_date ? 'tv' : 'movie');
        router.push(`/${type}/${movie.id}`);
    };

    if (loading) {
        return (
            <div className="h-screen w-screen bg-[#141414] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#e50914]"></div>
            </div>
        );
    }

    if (!person) return <div className="h-screen bg-[#141414] text-white flex items-center justify-center">Person not found.</div>;

    return (
        <div className="relative min-h-screen bg-[#141414] text-white">
            <Nav searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

            <div className="px-8 md:px-16 lg:px-24 pt-32 pb-20">
                {showResults ? (
                    <div className="min-h-screen">
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
                    </div>
                ) : (
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col md:flex-row gap-12 mb-16">
                            {/* Profile Image */}
                            <div className="w-full md:w-80 flex-shrink-0">
                                <div className="aspect-[2/3] rounded-2xl overflow-hidden border-4 border-zinc-800 shadow-2xl">
                                    <img
                                        src={person.profile_path ? `https://image.tmdb.org/t/p/original/${person.profile_path}` : 'https://via.placeholder.com/500x750?text=No+Image'}
                                        alt={person.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                
                                <div className="mt-8 space-y-6 bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800">
                                    <h3 className="text-zinc-500 uppercase tracking-widest font-black text-[10px]">Personal Info</h3>
                                    
                                    <div>
                                        <p className="text-zinc-400 text-xs mb-1">Known For</p>
                                        <p className="text-white font-bold">{person.known_for_department}</p>
                                    </div>
                                    
                                    {person.birthday && (
                                        <div>
                                            <p className="text-zinc-400 text-xs mb-1">Birthday</p>
                                            <p className="text-white font-bold">{person.birthday}</p>
                                        </div>
                                    )}
                                    
                                    {person.place_of_birth && (
                                        <div>
                                            <p className="text-zinc-400 text-xs mb-1">Place of Birth</p>
                                            <p className="text-white font-bold">{person.place_of_birth}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Details */}
                            <div className="flex-grow">
                                <h1 className="text-5xl md:text-6xl font-black tracking-tighter mb-4">{person.name}</h1>
                                
                                {person.biography && (
                                    <div className="mb-12">
                                        <h3 className="text-zinc-500 uppercase tracking-widest font-black text-[10px] mb-4">Biography</h3>
                                        <p className="text-zinc-300 leading-relaxed text-lg whitespace-pre-wrap line-clamp-6 hover:line-clamp-none transition-all cursor-pointer">
                                            {person.biography}
                                        </p>
                                    </div>
                                )}

                                <div className="pt-8 border-t border-zinc-800">
                                    <h3 className="text-zinc-500 uppercase tracking-widest font-black text-[10px] mb-8">Known For</h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {credits.slice(0, 20).map((item) => (
                                            <div 
                                                key={item.id} 
                                                onClick={() => handleMovieClick(item)}
                                                className="group cursor-pointer"
                                            >
                                                <div className="relative aspect-[2/3] rounded-lg overflow-hidden border border-zinc-800 group-hover:border-[#e50914] transition-all duration-300 shadow-lg mb-2">
                                                    <img
                                                        src={`https://image.tmdb.org/t/p/w500/${item.poster_path || item.backdrop_path}`}
                                                        alt={item.title || item.name}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                                                    />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center">
                                                        <div className="p-3 text-center">
                                                            <p className="text-white font-bold text-xs line-clamp-2">{item.title || item.name}</p>
                                                            <p className="text-zinc-300 text-[10px] mt-1">{item.character ? `as ${item.character}` : ''}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="text-white font-bold text-xs truncate group-hover:text-[#e50914] transition">
                                                    {item.title || item.name}
                                                </p>
                                                <p className="text-zinc-500 text-[10px] truncate">
                                                    {new Date(item.release_date || item.first_air_date).getFullYear() || 'N/A'}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
