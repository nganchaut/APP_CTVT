import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { User, Lock } from 'lucide-react';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAppContext();
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (!username || !password) {
            setError('Vui lòng nhập đầy đủ thông tin');
            return;
        }

        const success = login(username, password);
        if (success) {
            navigate('/create');
        } else {
            setError('Đăng nhập thất bại');
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <div className="login-header">
                    <h2>DANALOG</h2>
                    <p>Hệ Thống Quản Lý Vận Tải</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {error && <div className="error-message">{error}</div>}

                    <div className="form-group">
                        <label>Tên đăng nhập</label>
                        <div className="input-icon-wrapper">
                            <User size={20} className="input-icon" />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Nhập tên đăng nhập"
                                className="styled-input with-icon"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Mật khẩu</label>
                        <div className="input-icon-wrapper">
                            <Lock size={20} className="input-icon" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Nhập mật khẩu"
                                className="styled-input with-icon"
                            />
                        </div>
                    </div>

                    <button type="submit" className="login-button">
                        Đăng Nhập
                    </button>
                </form>
            </div>

            <style>{`
                .login-container {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #f6f8fb 0%, #e2e8f0 100%);
                    padding: 20px;
                }

                .login-box {
                    background: white;
                    padding: 40px;
                    border-radius: 20px;
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
                    width: 100%;
                    max-width: 400px;
                }

                .login-header {
                    text-align: center;
                    margin-bottom: 30px;
                }

                .login-header h2 {
                    color: #1e293b;
                    font-size: 1.8rem;
                    margin-bottom: 8px;
                }

                .login-header p {
                    color: #64748b;
                    font-size: 0.95rem;
                }

                .login-form {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .error-message {
                    background: #fef2f2;
                    color: #ef4444;
                    padding: 10px;
                    border-radius: 8px;
                    font-size: 0.9rem;
                    text-align: center;
                    border: 1px solid #fee2e2;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .form-group label {
                    font-weight: 500;
                    color: #475569;
                    font-size: 0.9rem;
                }

                .input-icon-wrapper {
                    position: relative;
                    display: flex;
                    align-items: center;
                }

                .input-icon {
                    position: absolute;
                    left: 12px;
                    color: #94a3b8;
                }

                .styled-input.with-icon {
                    padding-left: 40px;
                }

                .styled-input {
                    width: 100%;
                    padding: 12px 16px;
                    border: 1px solid #cbd5e1;
                    border-radius: 12px;
                    font-size: 1rem;
                    transition: all 0.2s;
                    box-sizing: border-box; /* ADDED to prevent overflow */
                }

                .styled-input:focus {
                    outline: none;
                    border-color: #0284c7;
                    box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.1);
                }

                .login-button {
                    background: #0284c7;
                    color: white;
                    border: none;
                    padding: 14px;
                    border-radius: 12px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    margin-top: 10px;
                    box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
                }

                .login-button:hover {
                    background: #0369a1;
                    transform: translateY(-1px);
                    box-shadow: 0 6px 8px -1px rgba(37, 99, 235, 0.3);
                }

                .login-button:active {
                    transform: translateY(0);
                }
            `}</style>
        </div>
    );
}
