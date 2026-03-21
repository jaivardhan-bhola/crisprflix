'use client';

import React, { useState, useEffect } from 'react';

export default function AuthGateway({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [password, setPassword] = useState('');
    const [showInput, setShowInput] = useState(false);
    const [displayText, setDisplayText] = useState('');
    
    const phrase = "the closer you look the less you see";
    const AUTH_KEY = 'crisprflix_isAuthenticated';
    const VALID_AUTH = 'M!$$D!R#CT!0N';

    useEffect(() => {
        const auth = localStorage.getItem(AUTH_KEY);
        if (auth === 'true') {
            setIsAuthenticated(true);
        }
        setLoading(false);

        // Typewriter effect
        let i = 0;
        const timer = setInterval(() => {
            setDisplayText(phrase.slice(0, i));
            i++;
            if (i > phrase.length) clearInterval(timer);
        }, 50).unref;

        return () => clearInterval(timer);
    }, []);

    const handleAuth = (e) => {
        e.preventDefault();
        if (password === VALID_AUTH) {
            localStorage.setItem(AUTH_KEY, 'true');
            setIsAuthenticated(true);
        } else {
            alert('SYSTEM ERROR: ACCESS DENIED');
            setPassword('');
        }
    };

    if (loading) return null;

    if (isAuthenticated) {
        return <>{children}</>;
    }

    return (
        <div className="fixed inset-0 z-[9999] bg-[#050505] text-[#00ff00] font-mono flex flex-col justify-center items-center h-screen w-screen overflow-hidden select-none">
            <style jsx>{`
                .container {
                    position: relative;
                    text-align: center;
                    padding: 20px;
                }
                .glitch-text {
                    font-size: 1.5rem;
                    letter-spacing: 4px;
                    opacity: 0.8;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    text-transform: uppercase;
                    position: relative;
                }
                .glitch-text:hover {
                    opacity: 1;
                    text-shadow: 0 0 15px #00ff00, 0 0 30px #00ff00;
                    letter-spacing: 6px;
                }
                .cursor {
                    display: inline-block;
                    width: 10px;
                    height: 1.5rem;
                    background: #00ff00;
                    margin-left: 5px;
                    animation: blink 0.8s infinite;
                    vertical-align: middle;
                }
                @keyframes blink {
                    0%, 100% { opacity: 0; }
                    50% { opacity: 1; }
                }
                input {
                    background: #001a00;
                    border: 1px solid #00ff00;
                    color: #00ff00;
                    padding: 12px 20px;
                    margin-top: 30px;
                    text-align: center;
                    outline: none;
                    font-family: 'Courier New', Courier, monospace;
                    width: 300px;
                    box-shadow: 0 0 10px rgba(0, 255, 0, 0.2);
                }
                .scanline {
                    width: 100%;
                    height: 2px;
                    background: rgba(0, 255, 0, 0.1);
                    position: absolute;
                    top: 0;
                    left: 0;
                    z-index: 10;
                    pointer-events: none;
                    animation: scanline 8s linear infinite;
                }
                @keyframes scanline {
                    0% { top: 0; }
                    100% { top: 100%; }
                }
                .gatekeeper {
                    display: none;
                }
            `}</style>

            <div className="scanline"></div>
            
            <div className="container">
                {!showInput ? (
                    <div className="glitch-text" onClick={() => setShowInput(true)}>
                        {displayText}
                        <span className="cursor"></span>
                    </div>
                ) : (
                    <form onSubmit={handleAuth} className="flex flex-col items-center animate-in fade-in duration-500">
                        <div className="glitch-text" onClick={() => setShowInput(false)}>
                            [ INITIALIZING GATEWAY ]
                            <span className="cursor"></span>
                        </div>
                        <input
                            autoFocus
                            type="password"
                            placeholder="TERMINAL_KEY"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <p className="mt-4 text-[10px] opacity-40 uppercase tracking-[4px]">Waiting for credentials...</p>
                    </form>
                )}
            </div>

            <div className="gatekeeper" id="gatekeeper" data-auth="TSEkJEQhUiNDVCEwTg=="></div>
        </div>
    );
}
