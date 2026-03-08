'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

function Nav({ searchQuery, setSearchQuery, setCategory, currentCategory }) {
    const [show, handleShow] = useState(false);

    const transitionNavBar = () => {
        if (window.scrollY > 100) {
            handleShow(true);
        } else {
            handleShow(false);
        }
    };

    useEffect(() => {
        window.addEventListener('scroll', transitionNavBar);
        return () => window.removeEventListener('scroll', transitionNavBar);
    }, []);

    return (
        <div
            className={`fixed top-0 w-full h-16 p-5 z-50 transition-all duration-500 ease-in ${show ? 'bg-black' : 'bg-gradient-to-b from-black/80 to-transparent'
                }`}
        >
            <div className="flex justify-between items-center h-full px-5">
                <div className="flex items-center">
                    <Link href="/">
                        <h1 className="text-[#E50914] text-3xl font-black tracking-tighter cursor-pointer uppercase drop-shadow-md mr-8">
                            CRISPRFLIX
                        </h1>
                    </Link>

                    <ul className="hidden md:flex gap-4 text-sm text-gray-300">
                        <li
                            onClick={() => setCategory ? setCategory("Home") : window.location.href = '/'}
                            className={`cursor-pointer hover:text-white font-medium transition-colors ${currentCategory === 'Home' ? 'text-white font-bold' : ''}`}
                        >
                            Home
                        </li>
                        <li
                            onClick={() => setCategory ? setCategory("TV Shows") : window.location.href = '/'}
                            className={`cursor-pointer hover:text-white transition-colors ${currentCategory === 'TV Shows' ? 'text-white font-bold' : ''}`}
                        >
                            TV Shows
                        </li>
                        <li
                            onClick={() => setCategory ? setCategory("Movies") : window.location.href = '/'}
                            className={`cursor-pointer hover:text-white transition-colors ${currentCategory === 'Movies' ? 'text-white font-bold' : ''}`}
                        >
                            Movies
                        </li>
                        <li>
                            <Link href="/f1" className="hover:text-white transition-colors">
                                Formula 1
                            </Link>
                        </li>
                    </ul>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Titles, people, genres"
                            className="bg-black/50 border border-gray-500 rounded-sm px-2 py-1 text-white text-sm focus:outline-none focus:border-white transition-all w-0 sm:w-auto sm:focus:w-64"
                            style={{ width: searchQuery ? '16rem' : undefined }}
                            value={searchQuery || ""}
                            onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
                        />
                    </div>

                    <img
                        className="w-8 h-8 object-contain cursor-pointer rounded-sm"
                        src="https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png"
                        alt="User Avatar"
                    />
                </div>
            </div>
        </div>
    );
}

export default Nav;
