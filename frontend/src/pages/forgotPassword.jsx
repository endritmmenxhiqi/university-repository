import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import API from '../services/api';

const ForgotPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRequest = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            await API.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
            setMessage('OK: Kontrolloni email-in tuaj.');
        } catch (err) {
            const backendMessage = err.response?.data?.error || err.response?.data?.message;
            setMessage(`Gabim: ${backendMessage || 'Nuk u dergua email-i i resetimit.'}`);
            console.error('Forgot password error:', err.response?.data || err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            await API.post(`/auth/reset-password/${token}`, { password });
            setMessage('OK: Fjalekalimi u ndryshua me sukses!');
            setTimeout(() => navigate('/'), 3000);
        } catch (err) {
            const backendMessage = err.response?.data?.message;
            setMessage(`Gabim: ${backendMessage || 'Linku ka skaduar ose eshte i pasakte.'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="forgot-page-container">
            <div className="forgot-card">
                <div className="forgot-header">
                    <div className="uibm-logo-box">UIBM</div>
                    <h1>Inventory System</h1>
                    <p className="subtitle">Sistemi i Menaxhimit te Pasurise</p>
                </div>

                <div className="forgot-body">
                    <h2>{token ? 'Ndrysho Fjalekalimin' : 'Harruat Fjalekalimin?'}</h2>
                    <p className="instruction-text">
                        {token ? 'Vendosni fjalekalimin tuaj te ri me poshte.' : 'Shenoni email-in per te pranuar linkun e resetimit.'}
                    </p>

                    <form onSubmit={token ? handleReset : handleRequest} className="forgot-form">
                        {!token ? (
                            <div className="input-field-group">
                                <label>Email adresa</label>
                                <input
                                    type="email"
                                    placeholder="email@umib.net"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        ) : (
                            <div className="input-field-group">
                                <label>Fjalekalimi i Ri</label>
                                <input
                                    type="password"
                                    placeholder="********"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        )}

                        <button type="submit" className="btn-dark-submit" disabled={loading}>
                            {loading ? 'Duke u procesuar...' : (token ? 'Perditeso Fjalekalimin' : 'Dergo Linkun ne Email')}
                        </button>
                    </form>

                    {message && (
                        <div className={`status-msg ${message.startsWith('OK:') ? 'success' : 'error'}`}>
                            {message}
                            {message.startsWith('OK:') && (
                                <div style={{ marginTop: '12px' }}>
                                    <Link to="/" className="back-link">
                                        <span className="arrow">&larr;</span> Shko tek Login-i
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="forgot-footer">
                        <Link to="/" className="back-link">
                            <span className="arrow">&larr;</span> Kthehu te Login
                        </Link>
                    </div>
                </div>

                <div className="copyright-text">
                    &copy; 2026 UIBM INVENTORY MANAGEMENT
                </div>
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');

                .forgot-page-container {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    background-color: #f4f7f9;
                    font-family: 'Inter', sans-serif;
                    padding: 20px;
                }

                .forgot-card {
                    background: white;
                    width: 100%;
                    max-width: 480px;
                    border-radius: 40px;
                    padding: 50px 40px;
                    box-shadow: 0 15px 35px rgba(0,0,0,0.05);
                    text-align: center;
                }

                .uibm-logo-box {
                    background: #1e293b;
                    color: white;
                    width: 70px;
                    height: 70px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 18px;
                    font-weight: 800;
                    font-size: 1.2rem;
                    margin: 0 auto 20px;
                    box-shadow: 0 8px 16px rgba(0,0,0,0.2);
                }

                .forgot-header h1 {
                    font-size: 1.8rem;
                    color: #0f172a;
                    margin: 0;
                    font-weight: 700;
                }

                .subtitle {
                    color: #64748b;
                    font-size: 0.95rem;
                    margin-top: 5px;
                    margin-bottom: 30px;
                }

                .forgot-body h2 {
                    font-size: 1.3rem;
                    color: #1e293b;
                    text-align: left;
                    margin-bottom: 10px;
                    font-weight: 700;
                }

                .instruction-text {
                    text-align: left;
                    color: #64748b;
                    font-size: 0.95rem;
                    margin-bottom: 25px;
                    line-height: 1.5;
                }

                .forgot-form {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .input-field-group {
                    text-align: left;
                }

                .input-field-group label {
                    display: block;
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: #334155;
                    margin-bottom: 8px;
                }

                .input-field-group input {
                    width: 100%;
                    padding: 16px 20px;
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 16px;
                    font-size: 1rem;
                    transition: 0.2s;
                    box-sizing: border-box;
                }

                .input-field-group input:focus {
                    outline: none;
                    border-color: #3b82f6;
                    background: white;
                    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.05);
                }

                .btn-dark-submit {
                    background: #1e293b;
                    color: white;
                    border: none;
                    padding: 18px;
                    border-radius: 16px;
                    font-size: 1.1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: 0.3s;
                    margin-top: 10px;
                }

                .btn-dark-submit:hover {
                    background: #0f172a;
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(0,0,0,0.15);
                }

                .btn-dark-submit:disabled {
                    background: #94a3b8;
                    cursor: not-allowed;
                }

                .forgot-footer {
                    margin-top: 25px;
                }

                .back-link {
                    color: #3b82f6;
                    text-decoration: none;
                    font-weight: 600;
                    font-size: 1rem;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                }

                .back-link:hover {
                    text-decoration: underline;
                }

                .status-msg {
                    margin-top: 15px;
                    font-size: 0.9rem;
                    font-weight: 500;
                }

                .status-msg.success {
                    color: #15803d;
                }

                .status-msg.error {
                    color: #b91c1c;
                }

                .copyright-text {
                    margin-top: 60px;
                    font-size: 0.75rem;
                    color: #94a3b8;
                    letter-spacing: 1px;
                    font-weight: 600;
                }
            `}</style>
        </div>
    );
};

export default ForgotPassword;
