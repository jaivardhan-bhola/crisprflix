'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Search } from 'lucide-react';

function Nav({ searchQuery, setSearchQuery, setCategory, currentCategory }) {
    const [show, handleShow] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    const transitionNavBar = () => {
        if (window.scrollY > 20) {
            handleShow(true);
        } else {
            handleShow(false);
        }
    };

    useEffect(() => {
        window.addEventListener('scroll', transitionNavBar);
        return () => window.removeEventListener('scroll', transitionNavBar);
    }, []);

    const handleNavLinkClick = (value) => {
        if (value === 'Formula 1') {
            router.push('/f1');
            return;
        }
        if (setCategory && pathname === '/') {
            setCategory(value);
        } else {
            // If not on home page or setCategory is not provided, navigate to home with category in query or just go home
            router.push(`/?category=${encodeURIComponent(value)}`);
        }
    };

    const navLinks = [
        { name: 'Home', value: 'Home' },
        { name: 'TV Shows', value: 'TV Shows' },
        { name: 'Movies', value: 'Movies' },
        { name: 'Formula 1', value: 'Formula 1' },
    ];

    return (
        <nav
            className={`fixed top-0 w-full h-16 z-50 transition-standard ${
                show ? 'bg-netflix-black shadow-strong' : 'bg-gradient-to-b from-black/80 to-transparent'
            }`}
        >
            <div className="flex justify-between items-center h-full px-4 md:px-12">
                <div className="flex items-center gap-8">
                    <Link href="/" onClick={() => setCategory?.("Home")}>
                        <h1 className="text-netflix-red text-2xl md:text-3xl font-black tracking-tighter cursor-pointer uppercase transition-fast hover:scale-105 active:scale-95">
                            CRISPRFLIX
                        </h1>
                    </Link>

                    <ul className="hidden lg:flex items-center gap-6">
                        {navLinks.map((link) => (
                            <li
                                key={link.value}
                                onClick={() => handleNavLinkClick(link.value)}
                                className={`text-sm cursor-pointer transition-fast hover:text-gray-300 ${
                                    currentCategory === link.value ? 'text-white font-bold' : 'text-text-secondary font-medium'
                                }`}
                            >
                                {link.name}
                            </li>
                        ))}
                        <li>
                            <Link 
                                href="/categories" 
                                className={`text-sm transition-fast hover:text-gray-300 ${
                                    currentCategory === 'Categories' ? 'text-white font-bold' : 'text-text-secondary font-medium'
                                }`}
                            >
                                Categories
                            </Link>
                        </li>
                    </ul>
                </div>

                <div className="flex items-center gap-6">
                    <div 
                        className={`flex items-center gap-2 px-3 py-2 rounded-md border transition-all duration-300 cursor-text ${
                            isSearchFocused || searchQuery 
                                ? 'w-48 md:w-80 border-white bg-black/90 shadow-strong' 
                                : 'w-12 border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40'
                        }`}
                        onClick={() => !isSearchFocused && setIsSearchFocused(true)}
                    >
                        <Search 
                            className={`w-6 h-6 text-white shrink-0 transition-fast ${
                                isSearchFocused || searchQuery ? 'opacity-100' : 'opacity-80'
                            }`} 
                        />
                        <input
                            type="text"
                            placeholder="Titles, people, genres"
                            className={`bg-transparent text-white text-sm outline-none w-full transition-opacity duration-300 font-medium ${
                                isSearchFocused || searchQuery ? 'opacity-100' : 'opacity-0 pointer-events-none'
                            }`}
                            value={searchQuery || ""}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setIsSearchFocused(false)}
                            onChange={(e) => setSearchQuery?.(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2 group cursor-pointer">
                        <img
                            className="w-8 h-8 object-contain rounded-md transition-fast group-hover:ring-2 group-hover:ring-white"
                            src="https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png"
                            alt="User"
                        />
                    </div>
                </div>
            </div>
        </nav>
    );
}

export default Nav;
