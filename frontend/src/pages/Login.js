import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Login.css';

/* ── Icônes SVG inline ────────────────────────────────────────────── */
const IconMail = () => (
    <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2"/>
        <path d="m2 7 10 7 10-7"/>
    </svg>
);

const IconLock = () => (
    <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="11" width="14" height="10" rx="2"/>
        <path d="M8 11V7a4 4 0 0 1 8 0v4"/>
    </svg>
);

const IconAlert = () => (
    <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 8v4M12 16h.01"/>
    </svg>
);

/* Icône hôtel (bâtiment) */
const HotelSVG = () => (
    <svg viewBox="0 0 48 48" strokeLinecap="round" strokeLinejoin="round">
        <rect x="8" y="14" width="32" height="28" rx="1"/>
        <path d="M16 42V28h16v14"/>
        <rect x="20" y="28" width="8" height="14"/>
        <path d="M8 14 24 4l16 10"/>
        <rect x="13" y="19" width="5" height="5" rx="0.5"/>
        <rect x="30" y="19" width="5" height="5" rx="0.5"/>
        <rect x="13" y="28" width="5" height="5" rx="0.5"/>
        <rect x="30" y="28" width="5" height="5" rx="0.5"/>
        <circle cx="24" cy="10" r="2"/>
    </svg>
);

/* ── Particules animées ───────────────────────────────────────────── */
const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    size:  Math.random() * 3 + 1,
    left:  Math.random() * 100,
    delay: Math.random() * 12,
    dur:   Math.random() * 8 + 10,
}));

/* ════════════════════════════════════════════════════════════════════
   Composant Login
════════════════════════════════════════════════════════════════════ */
const Login = () => {
    const [email, setEmail]       = useState('');
    const [password, setPassword] = useState('');
    const [error, setError]       = useState('');
    const { login, loading }      = useAuth();
    const navigate                = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const result = await login(email, password);
        if (result.success) {
            navigate('/');
        } else {
            setError(result.error || 'Identifiants invalides');
            setTimeout(() => setError(''), 5000);
        }
    };

    return (
        <div className="login-root">

            {/* ── Colonne gauche décorative ── */}
            <div className="login-visual">

                {/* Particules */}
                <div className="particles">
                    {PARTICLES.map(p => (
                        <div
                            key={p.id}
                            className="particle"
                            style={{
                                width:               p.size,
                                height:              p.size,
                                left:                `${p.left}%`,
                                animationDuration:   `${p.dur}s`,
                                animationDelay:      `${p.delay}s`,
                            }}
                        />
                    ))}
                </div>

                {/* Emblème central */}
                <div className="hotel-icon-wrap">
                    <div className="hotel-emblem">
                        <HotelSVG />
                    </div>
                    <div className="hotel-name-visual">Hotel Manager</div>
                </div>

                {/* Citation bas de page */}
                <div className="visual-quote">
                    <div className="gold-bar" />
                    <blockquote>
                        L'hospitalité, c'est l'art de faire sentir à l'autre
                        qu'il est chez lui — <span>mieux que chez lui.</span>
                    </blockquote>
                    <cite>Espace de gestion · Personnel autorisé</cite>
                </div>
            </div>

            {/* ── Colonne droite formulaire ── */}
            <div className="login-panel">
                <div className="login-form-wrap">

                    <div className="welcome-badge">
                        <span>Accès sécurisé</span>
                    </div>

                    <h1 className="login-title">
                        Bon retour,<br /><em>bienvenue.</em>
                    </h1>
                    <p className="login-subtitle">
                        Connectez-vous pour accéder à votre espace de gestion hôtelière.
                    </p>

                    <div className="form-divider" />

                    <form onSubmit={handleSubmit}>

                        <div className="field">
                            <label className="field-label">
                                <IconMail /> Email professionnel
                            </label>
                            <div className="field-input-wrap">
                                <input
                                    className="field-input"
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="exemple@hotel.com"
                                    required
                                    autoComplete="email"
                                />
                                <div className="field-line" />
                            </div>
                        </div>

                        <div className="field">
                            <label className="field-label">
                                <IconLock /> Mot de passe
                            </label>
                            <div className="field-input-wrap">
                                <input
                                    className="field-input"
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    autoComplete="current-password"
                                />
                                <div className="field-line" />
                            </div>
                        </div>

                        {error && (
                            <div className="login-error">
                                <IconAlert />
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="login-btn"
                            disabled={loading}
                        >
                            {loading
                                ? <span className="btn-loader">Connexion en cours</span>
                                : 'Se connecter'
                            }
                        </button>
                    </form>

                    <div className="login-footer">
                        Accès réservé au personnel autorisé
                    </div>
                </div>
            </div>

        </div>
    );
};

export default Login;