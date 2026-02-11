import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validimi i fjalëkalimit
        if (formData.password !== formData.confirmPassword) {
            return setError("Fjalëkalimet nuk përputhen!");
        }

        setLoading(true);
        try {
            await API.post('/auth/register', {
                name: formData.name,
                email: formData.email,
                password: formData.password
            });
            
            alert("Llogaria u krijua me sukses!");
            navigate('/'); // Dërgoje te Login pas suksesit
        } catch (err) {
            setError(err.response?.data?.message || "Gabim gjatë regjistrimit. Provoni përsëri.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.bgDecoration}></div>
            
            <div style={styles.card}>
                <div style={styles.headerSection}>
                    <div style={styles.logoPlaceholder}>UI</div>
                    <h2 style={styles.title}>Krijo Llogari</h2>
                    <p style={styles.subtitle}>Bëhu pjesë e sistemit të inventarit UIBM</p>
                </div>

                {error && <div style={styles.error}>{error}</div>}
                
                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Emri i Plotë</label>
                        <input 
                            name="name"
                            type="text" 
                            placeholder="Filan Fisteku"
                            style={styles.input}
                            onChange={handleChange}
                            required 
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Email adresa</label>
                        <input 
                            name="email"
                            type="email" 
                            placeholder="emri.mbiemri@umib.net"
                            style={styles.input}
                            onChange={handleChange}
                            required 
                        />
                    </div>
                    
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Fjalëkalimi</label>
                        <input 
                            name="password"
                            type="password" 
                            placeholder="••••••••"
                            style={styles.input}
                            onChange={handleChange}
                            required 
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Konfirmo Fjalëkalimin</label>
                        <input 
                            name="confirmPassword"
                            type="password" 
                            placeholder="••••••••"
                            style={styles.input}
                            onChange={handleChange}
                            required 
                        />
                    </div>
                    
                    <button 
                        type="submit" 
                        disabled={loading}
                        style={{...styles.button, opacity: loading ? 0.7 : 1}}
                    >
                        {loading ? 'Duke u procesuar...' : 'Regjistrohu'}
                    </button>
                </form>

                <div style={styles.footerSection}>
                    <p style={styles.footerText}>
                        Keni llogari ekzistuese? {' '}
                        <span onClick={() => navigate('/')} style={styles.link}>Kyçuni këtu</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: { 
        display: 'flex', justifyContent: 'center', alignItems: 'center', 
        height: '100vh', backgroundColor: '#f8fafc', fontFamily: "'Inter', sans-serif",
        position: 'relative', overflow: 'hidden'
    },
    bgDecoration: {
        position: 'absolute', top: '-10%', right: '-5%', width: '500px', height: '500px',
        borderRadius: '50%', background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
        zIndex: 0, opacity: 0.4
    },
    card: { 
        padding: '40px', backgroundColor: '#ffffff', borderRadius: '24px', 
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)', width: '420px',
        zIndex: 1, border: '1px solid #f1f5f9'
    },
    headerSection: { textAlign: 'center', marginBottom: '28px' },
    logoPlaceholder: {
        width: '60px', height: '60px', backgroundColor: '#1e293b', color: 'white',
        borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 16px', fontWeight: '800', fontSize: '20px'
    },
    title: { fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' },
    subtitle: { fontSize: '14px', color: '#64748b', margin: 0 },
    form: { display: 'flex', flexDirection: 'column', gap: '16px' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
    label: { fontSize: '13px', fontWeight: '600', color: '#475569', marginLeft: '4px' },
    input: { 
        padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', 
        outline: 'none', fontSize: '15px', backgroundColor: '#f8fafc'
    },
    button: { 
        padding: '14px', backgroundColor: '#1e293b', color: 'white', border: 'none', 
        borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontSize: '16px',
        marginTop: '10px', transition: 'all 0.3s ease'
    },
    footerSection: { marginTop: '24px', textAlign: 'center' },
    footerText: { fontSize: '14px', color: '#64748b' },
    link: { color: '#2563eb', fontWeight: '700', cursor: 'pointer' },
    error: { 
        color: '#b91c1c', backgroundColor: '#fef2f2', padding: '12px', 
        borderRadius: '12px', marginBottom: '20px', fontSize: '13px', 
        textAlign: 'center', border: '1px solid #fee2e2'
    }
};

export default Register;