import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const { data } = await API.post('/auth/login', { email, password });
            localStorage.setItem('userInfo', JSON.stringify(data));
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || "Email ose fjalëkalim i gabuar!");
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.bgDecoration}></div>
            
            <div style={styles.card}>
                <div style={styles.headerSection}>
                    <div style={styles.logoPlaceholder}>UIBM</div>
                    <h2 style={styles.title}>Inventory System</h2>
                    <p style={styles.subtitle}>Sistemi i Menaxhimit të Pasurisë</p>
                </div>

                {error && <div style={styles.error}>{error}</div>}
                
                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Email adresa</label>
                        <input 
                            type="email" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            placeholder="email@umib.net"
                            style={styles.input}
                            required 
                        />
                    </div>
                    
                    <div style={styles.inputGroup}>
                        <div style={styles.labelRow}>
                            <label style={styles.label}>Fjalëkalimi</label>
                            <span 
                                onClick={() => navigate('/forgotPassword')} 
                                style={styles.forgotLink}
                            >
                                Harruat fjalëkalimin?
                            </span>
                        </div>
                        <input 
                            type="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            placeholder="••••••••"
                            style={styles.input}
                            required 
                        />
                    </div>
                    
                    <button 
                        type="submit" 
                        style={styles.button}
                        onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                        onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                    >
                        Kyçu në Sistem
                    </button>
                </form>

                <div style={styles.registerSection}>
                    <p style={styles.registerText}>
                        Nuk keni llogari? {' '}
                        <span 
                            onClick={() => navigate('/register')} 
                            style={styles.registerLink}
                        >
                            Krijo llogari të re
                        </span>
                    </p>
                </div>
                
                <div style={styles.footer}>
                    <p style={styles.footerText}>© 2026 UIBM Inventory Management</p>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: { 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        backgroundColor: '#f8fafc',
        fontFamily: "'Inter', sans-serif",
        position: 'relative',
        overflow: 'hidden'
    },
    bgDecoration: {
        position: 'absolute',
        top: '-5%',
        right: '-5%',
        width: '450px',
        height: '450px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
        zIndex: 0,
        opacity: 0.5
    },
    card: { 
        padding: '40px', 
        backgroundColor: '#ffffff', 
        borderRadius: '24px', 
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)', 
        width: '400px',
        zIndex: 1,
        border: '1px solid #f1f5f9'
    },
    headerSection: {
        textAlign: 'center',
        marginBottom: '32px'
    },
    logoPlaceholder: {
        width: '64px',
        height: '64px',
        backgroundColor: '#1e293b',
        color: 'white',
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 16px',
        fontWeight: '800',
        fontSize: '20px',
        boxShadow: '0 10px 15px -3px rgba(30, 41, 59, 0.3)'
    },
    title: { 
        fontSize: '24px',
        fontWeight: '800',
        color: '#0f172a',
        margin: '0 0 4px 0',
        letterSpacing: '-0.5px'
    },
    subtitle: {
        fontSize: '14px',
        color: '#64748b',
        margin: 0
    },
    form: { display: 'flex', flexDirection: 'column', gap: '20px' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
    labelRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    label: {
        fontSize: '13px',
        fontWeight: '600',
        color: '#475569',
        marginLeft: '4px'
    },
    forgotLink: {
        fontSize: '12px',
        color: '#2563eb',
        cursor: 'pointer',
        fontWeight: '600',
        transition: 'color 0.2s'
    },
    input: { 
        padding: '12px 16px', 
        borderRadius: '12px', 
        border: '1px solid #e2e8f0', 
        outline: 'none',
        fontSize: '15px',
        transition: 'all 0.2s ease',
        backgroundColor: '#f8fafc'
    },
    button: { 
        padding: '14px', 
        backgroundColor: '#1e293b', 
        color: 'white', 
        border: 'none', 
        borderRadius: '12px', 
        cursor: 'pointer', 
        fontWeight: '700',
        fontSize: '16px',
        marginTop: '8px',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    },
    registerSection: {
        marginTop: '24px',
        textAlign: 'center'
    },
    registerText: {
        fontSize: '14px',
        color: '#64748b'
    },
    registerLink: {
        color: '#2563eb',
        fontWeight: '700',
        cursor: 'pointer',
        textDecoration: 'none'
    },
    error: { 
        color: '#b91c1c', 
        backgroundColor: '#fef2f2', 
        padding: '12px', 
        borderRadius: '12px', 
        marginBottom: '20px', 
        fontSize: '13px', 
        textAlign: 'center',
        border: '1px solid #fee2e2'
    },
    footer: {
        textAlign: 'center',
        marginTop: '32px',
        borderTop: '1px solid #f1f5f9',
        paddingTop: '20px'
    },
    footerText: { 
        fontSize: '11px', 
        color: '#94a3b8',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '1px'
    }
};

export default Login;