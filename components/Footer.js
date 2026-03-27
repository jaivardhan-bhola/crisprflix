'use client';

import React from 'react';

function Footer() {
    return (
        <footer className="w-full border-t border-white/10 py-12 px-4 md:px-12 opacity-60">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                <h1 className="text-netflix-red text-xl font-black tracking-tighter uppercase">CRISPRFLIX</h1>
                <p className="text-text-secondary text-xs text-center md:text-left">
                    © {new Date().getFullYear()} CrisprFlix. Built for educational purposes. Data provided by TMDB.
                </p>
            </div>
        </footer>
    );
}

export default Footer;
