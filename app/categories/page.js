'use client';

import React, { useState, useEffect } from 'react';
import Nav from '../../components/Nav';
import { useRouter } from 'next/navigation';
import { Tag, Sparkles, Flame, Tv, Film } from 'lucide-react';
import Skeleton from '../../components/Skeleton';
import Footer from '../../components/Footer';

export default function CategoriesPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);

    const categories = [
        {
            group: "Popular Themes",
            icon: <Flame className="w-5 h-5 text-orange-500" />,
            items: [
                { id: 210024, name: "Anime" },
                { id: 9715, name: "Superhero" },
                { id: 6054, name: "Heist" },
                { id: 9826, name: "Time Travel" },
                { id: 310, name: "Artificial Intelligence" },
                { id: 10349, name: "Survival" },
            ]
        },
        {
            group: "World Building",
            icon: <Sparkles className="w-5 h-5 text-purple-500" />,
            items: [
                { id: 4565, name: "Dystopia" },
                { id: 1701, name: "Post-Apocalyptic" },
                { id: 1612, name: "Space Opera" },
                { id: 12988, name: "Cyberpunk" },
                { id: 1562, name: "Steampunk" },
                { id: 2343, name: "Magic" },
            ]
        },
        {
            group: "Content Style",
            icon: <Tag className="w-5 h-5 text-blue-500" />,
            items: [
                { id: 818, name: "Based on Novel" },
                { id: 156030, name: "True Crime" },
                { id: 1563, name: "Vampire" },
                { id: 10224, name: "Zombies" },
                { id: 18034, name: "Found Footage" },
                { id: 1590, name: "Cyber Warfare" },
            ]
        }
    ];

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

    return (
        <div className="relative min-h-screen bg-netflix-black text-white selection:bg-netflix-red">
            <Nav searchQuery={searchQuery} setSearchQuery={setSearchQuery} currentCategory="Categories" />

            <main className="px-4 md:px-12 pt-32 pb-20 max-w-7xl mx-auto">
                {showResults ? (
                    <div className="min-h-screen animate-in fade-in duration-500">
                        <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                            {isSearching ? 'Searching...' : `Results for "${searchQuery}"`}
                            {isSearching && <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
                        </h2>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                            {isSearching ? (
                                [...Array(12)].map((_, i) => (
                                    <Skeleton key={i} className="aspect-[2/3] w-full" />
                                ))
                            ) : (
                                searchResults.map((result) => (
                                    <div
                                        key={result.id}
                                        onClick={() => router.push(`/${result.media_type || (result.name ? 'tv' : 'movie')}/${result.id}`)}
                                        className="group cursor-pointer transition-standard hover:scale-105"
                                    >
                                        <div className="aspect-[2/3] w-full overflow-hidden rounded-md shadow-soft group-hover:shadow-strong">
                                            <img
                                                className="w-full h-full object-cover transition-standard group-hover:brightness-110"
                                                src={`https://image.tmdb.org/t/p/w500/${result.poster_path || result.backdrop_path}`}
                                                alt={result.title || result.name}
                                                loading="lazy"
                                            />
                                        </div>
                                        <p className="mt-3 text-sm font-medium text-text-secondary truncate group-hover:text-white transition-fast">
                                            {result.title || result.name}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <header className="mb-20 text-center space-y-4">
                            <h1 className="text-5xl md:text-7xl font-black tracking-tighter italic drop-shadow-lg">DISCOVER</h1>
                            <p className="text-text-muted text-sm md:text-lg font-bold uppercase tracking-[0.2em]">Explore by niche categories and themes</p>
                        </header>

                        <div className="space-y-24">
                            {categories.map((group, idx) => (
                                <section key={idx} className="space-y-10">
                                    <div className="flex items-center gap-4 border-l-4 border-netflix-red pl-6">
                                        <span className="p-2 bg-surface rounded-lg shadow-soft">{group.icon}</span>
                                        <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-tight">{group.group}</h2>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {group.items.map((kw) => (
                                            <div 
                                                key={kw.id}
                                                className="group relative bg-surface/30 border border-white/5 p-8 rounded-2xl hover:bg-surface/50 transition-standard cursor-pointer overflow-hidden shadow-soft hover:shadow-strong hover:border-white/10"
                                                onClick={() => router.push(`/keyword/${kw.id}?name=${encodeURIComponent(kw.name)}`)}
                                            >
                                                <div className="relative z-10 space-y-6">
                                                    <h3 className="text-2xl font-bold tracking-tight group-hover:text-netflix-red transition-fast">{kw.name}</h3>
                                                    <div className="flex gap-4">
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                router.push(`/keyword/${kw.id}?name=${encodeURIComponent(kw.name)}&type=movie`);
                                                            }}
                                                            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-white transition-fast py-1 px-2 bg-white/5 rounded hover:bg-white/10"
                                                        >
                                                            <Film className="w-3 h-3" /> Movies
                                                        </button>
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                router.push(`/keyword/${kw.id}?name=${encodeURIComponent(kw.name)}&type=tv`);
                                                            }}
                                                            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-white transition-fast py-1 px-2 bg-white/5 rounded hover:bg-white/10"
                                                        >
                                                            <Tv className="w-3 h-3" /> TV Shows
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="absolute -right-6 -bottom-6 text-9xl font-black text-white/[0.02] italic group-hover:text-netflix-red/[0.04] transition-standard group-hover:scale-110 pointer-events-none select-none">
                                                    #
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            ))}
                        </div>
                    </div>
                )}
            </main>
            {!showResults && <Footer />}
        </div>
    );
}
