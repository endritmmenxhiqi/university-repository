import React, { useState, useEffect } from 'react';
import API from '../services/api';

// --- FORMULARI PËR REGJISTRIMIN E ASSET (VETËM ADMIN) ---
const AddItemForm = ({ onRefresh }) => {
    const [formData, setFormData] = useState({
        description: '', 
        serialNumber: '', 
        location: '', 
        value: '',
        quantity: 1, 
        unit: 'copë', 
        fundingSource: 'Buxheti i Kosovës', 
        status: 'ne_perdorim'
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const dataToSubmit = { 
                ...formData, 
                location: formData.location.toUpperCase().trim() 
            };
            await API.post('/inventory', dataToSubmit);
            alert("✅ Aseti u shtua me sukses!");
            setFormData({ ...formData, description: '', serialNumber: '', value: '', quantity: 1, location: '' });
            onRefresh();
        } catch (error) {
            alert("❌ Gabim: " + (error.response?.data?.message || "Provoni përsëri"));
        }
    };

    return (
        <div className="glass-card animate-in">
            <div className="card-header">
                <h3>📝 Regjistro Aset të Ri</h3>
                <p>Plotësoni të dhënat për inventarin e UIBM</p>
            </div>
            <form onSubmit={handleSubmit} className="modern-form">
                <div className="form-row">
                    <div className="input-group">
                        <label>Përshkrimi i mjetit</label>
                        <input type="text" placeholder="Psh: Projektor Epson 4K" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required />
                    </div>
                </div>
                <div className="form-grid-3">
                    <div className="input-group">
                        <label>Numri Serial</label>
                        <input type="text" placeholder="S/N..." value={formData.serialNumber} onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })} />
                    </div>
                    <div className="input-group">
                        <label>Lokacioni</label>
                        <input 
                            type="text" 
                            placeholder="Psh: K1" 
                            value={formData.location} 
                            onChange={(e) => setFormData({ ...formData, location: e.target.value.toUpperCase() })} 
                            required 
                        />
                    </div>
                    <div className="input-group">
                        <label>Burimi i Financimit</label>
                        <input type="text" value={formData.fundingSource} onChange={(e) => setFormData({ ...formData, fundingSource: e.target.value })} />
                    </div>
                </div>
                <div className="form-grid-4">
                    <div className="input-group">
                        <label>Çmimi (€)</label>
                        <input type="number" placeholder="0.00" value={formData.value} onChange={(e) => setFormData({ ...formData, value: e.target.value })} required />
                    </div>
                    <div className="input-group">
                        <label>Sasia</label>
                        <input type="number" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} required />
                    </div>
                    <div className="input-group">
                        <label>Njësia</label>
                        <select value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })}>
                            <option value="copë">copë</option>
                            <option value="pako">pako</option>
                            <option value="set">set</option>
                            <option value="risa">risa</option>
                        </select>
                    </div>
                    <div className="input-group">
                        <label>Statusi</label>
                        <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                            <option value="ne_perdorim">Në Përdorim</option>
                            <option value="ne_depo">Në Depo</option>
                            <option value="ne_riparim">Në Riparim</option>
                            <option value="i_amortizuar">I Amortizuar</option>
                        </select>
                    </div>
                </div>
                <button type="submit" className="submit-btn">💾 Regjistro në Inventar</button>
            </form>
        </div>
    );
};

// --- DASHBOARD PËR FILTRIM DHE RAPORT ---
const InventoryDashboard = ({ isAdmin }) => {
    const [allItems, setAllItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState('KREJT FK');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedValue, setSelectedValue] = useState('all');
    const [loading, setLoading] = useState(false);
    const [commission, setCommission] = useState({ member1: '', member2: '', member3: '' });

    const fetchItems = async () => {
        setLoading(true);
        try {
            const { data } = await API.get('/inventory');
            setAllItems(data);
        } catch (error) { console.error("Gabim gjatë marrjes së të dhënave:", error); } 
        finally { setLoading(false); }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        if (!isAdmin) return;
        try {
            await API.patch(`/inventory/${id}/status`, { status: newStatus });
            setAllItems(prev => prev.map(item => item._id === id ? { ...item, status: newStatus } : item));
        } catch { alert("Gabim gjatë përditësimit!"); }
    };

    const downloadPDF = async () => {
        try {
            const response = await API.get(`/reports/download`, {
                params: {
                    location: selectedLocation, 
                    valueRange: selectedValue, 
                    status: selectedStatus,
                    member1: commission.member1, 
                    member2: commission.member2, 
                    member3: commission.member3
                },
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Raporti_${selectedLocation}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch { alert("Gabim gjatë shkarkimit të PDF!"); }
    };

    useEffect(() => { fetchItems(); }, []);

    useEffect(() => {
        let tempItems = allItems;
        
        // Filtrimi i lokacionit (Case-Insensitive dhe pa hapësira)
        if (selectedLocation !== 'KREJT FK') {
            tempItems = tempItems.filter(item => 
                item.location?.toUpperCase().trim() === selectedLocation.toUpperCase().trim()
            );
        }
        
        if (selectedStatus !== 'all') {
            tempItems = tempItems.filter(item => item.status === selectedStatus);
        }

        if (selectedValue === 'low') {
            tempItems = tempItems.filter(item => item.value < 1000);
        } else if (selectedValue === 'high') {
            tempItems = tempItems.filter(item => item.value >= 1000);
        }
        
        setFilteredItems(tempItems);
    }, [allItems, selectedLocation, selectedStatus, selectedValue]);

    // Sigurohemi që lokacionet në Dropdown janë unike dhe Uppercase
    const uniqueLocations = [...new Set(allItems.map(item => item.location?.toUpperCase().trim()))].filter(Boolean);

    return (
        <div className="animate-in">
            <div className="glass-card filter-card">
                <h3>📊 Paneli i Kontrollit</h3>
                <div className="modern-filters">
                    <div className="filter-group">
                        <label>Lokacioni</label>
                        <select value={selectedLocation} onChange={e => setSelectedLocation(e.target.value)}>
                            <option value="KREJT FK">--- KREJT FK ---</option>
                            {uniqueLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>Statusi</label>
                        <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}>
                            <option value="all">Të Gjitha</option>
                            <option value="ne_perdorim">Në Përdorim</option>
                            <option value="ne_depo">Në Depo</option>
                            <option value="ne_riparim">Në Riparim</option>
                            <option value="i_amortizuar">I Amortizuar</option>
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>Kategoria</label>
                        <select value={selectedValue} onChange={e => setSelectedValue(e.target.value)}>
                            <option value="all">Të Gjitha</option>
                            <option value="low">Jo-Kapitale (&lt;1000€)</option>
                            <option value="high">Kapitale (&ge;1000€)</option>
                        </select>
                    </div>
                </div>

                {isAdmin && (
                    <div className="commission-section">
                        <h4>Mbledhja e Komisionit</h4>
                        <div className="commission-inputs">
                            <input type="text" placeholder="Emri i Kryetarit" value={commission.member1} onChange={e => setCommission({ ...commission, member1: e.target.value })} />
                            <input type="text" placeholder="Anëtari 1" value={commission.member2} onChange={e => setCommission({ ...commission, member2: e.target.value })} />
                            <input type="text" placeholder="Anëtari 2" value={commission.member3} onChange={e => setCommission({ ...commission, member3: e.target.value })} />
                            <button className="pdf-btn" onClick={downloadPDF}>📥 Shkarko PDF</button>
                        </div>
                    </div>
                )}
            </div>

            <div className="table-wrapper glass-card">
                {loading ? <div className="loader">Duke u ngarkuar...</div> : (
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>Mjeti</th>
                                <th>Sasia</th>
                                <th>Vlera Unitare</th>
                                <th>Totali</th>
                                <th>Lokacioni</th>
                                <th>Statusi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.map(item => (
                                <tr key={item._id}>
                                    <td className="desc-cell">{item.description}</td>
                                    <td><span className="badge-qty">{item.quantity} {item.unit}</span></td>
                                    <td>{item.value} €</td>
                                    <td className="total-cell">{(item.quantity * item.value).toFixed(2)} €</td>
                                    <td>{item.location}</td>
                                    <td>
                                        {isAdmin ? (
                                            <select 
                                                className={`status-pill ${item.status}`} 
                                                value={item.status} 
                                                onChange={e => handleStatusUpdate(item._id, e.target.value)}
                                            >
                                                <option value="ne_perdorim">Në Përdorim</option>
                                                <option value="ne_depo">Në Depo</option>
                                                <option value="ne_riparim">Në Riparim</option>
                                                <option value="i_amortizuar">I Amortizuar</option>
                                            </select>
                                        ) : (
                                            <span className={`status-pill ${item.status}`}>
                                                {item.status.replace('_', ' ').toUpperCase()}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredItems.length === 0 && (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                                        Nuk u gjet asnjë mjet për këtë lokacion.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

// --- DASHBOARD PAGE ME SIDEBAR ---
const DashboardPage = () => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    
    // Rregullimi i gabimit me role: Pastrimi i hapësirave dhe kontrolli lowercase
    const isAdmin = userInfo?.role?.trim().toLowerCase() === 'admin';

    const [activePage, setActivePage] = useState(isAdmin ? 'add' : 'report');
    
    const handleLogout = () => { 
        localStorage.removeItem('userInfo'); 
        window.location.href = '/'; 
    };

    return (
        <div className="dashboard-layout">
            <aside className="modern-sidebar">
                <div className="sidebar-brand">
                    <div className="brand-icon">UI</div>
                    <h2>UIBM <span>Assets</span></h2>
                </div>
                <nav className="sidebar-nav">
                    {isAdmin && (
                        <button className={activePage === 'add' ? 'active' : ''} onClick={() => setActivePage('add')}>📝 Regjistro Asset</button>
                    )}
                    <button className={activePage === 'report' ? 'active' : ''} onClick={() => setActivePage('report')}>📊 Raportet</button>
                </nav>
                <div className="user-badge-sidebar">
                    <p>{userInfo?.name || 'Përdorues'}</p>
                    <span>{isAdmin ? 'ADMINISTRATOR' : 'VËZHGUES'}</span>
                </div>
                <button className="logout-btn" onClick={handleLogout}>🚪 Dil nga Sistemi</button>
            </aside>
            <main className="main-viewport">
                {activePage === 'add' && isAdmin && <AddItemForm onRefresh={() => setActivePage('report')} />}
                {activePage === 'report' && <InventoryDashboard isAdmin={isAdmin} />}
            </main>

            <style>{`
                :root {
                    --primary: #1e293b;
                    --accent: #3b82f6;
                    --bg: #f8fafc;
                    --white: #ffffff;
                    --text: #334155;
                }

                .dashboard-layout { display: flex; min-height: 100vh; background: var(--bg); font-family: 'Inter', sans-serif; }
                
                .modern-sidebar { width: 260px; background: linear-gradient(180deg, #1e293b 0%, #3b82f6 100%); color: white; padding: 2rem 1.5rem; display: flex; flex-direction: column; box-shadow: 2px 0 12px rgba(0,0,0,0.1);}
                .sidebar-brand { display: flex; align-items: center; gap: 12px; margin-bottom: 3rem; }
                .brand-icon { background: white; color: var(--primary); width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 12px; font-weight: bold; font-size: 1rem;}
                .sidebar-brand h2 { font-size: 1.25rem; }
                .sidebar-brand span { color: #facc15; }
                
                .user-badge-sidebar { margin-top: auto; padding: 15px; background: rgba(255,255,255,0.1); border-radius: 12px; margin-bottom: 15px; text-align: center; }
                .user-badge-sidebar p { font-size: 0.9rem; font-weight: 600; margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .user-badge-sidebar span { font-size: 0.7rem; opacity: 0.8; letter-spacing: 1px; }

                .sidebar-nav { flex: 1; display: flex; flex-direction: column; gap: 10px; }
                .sidebar-nav button { 
                    background: transparent; color: #e0e7ff; border: none; padding: 12px 15px; 
                    text-align: left; border-radius: 8px; cursor: pointer; font-weight: 500; transition: all 0.3s ease;
                }
                .sidebar-nav button.active, .sidebar-nav button:hover { background: rgba(255,255,255,0.15); color: white; transform: translateX(4px);}
                .logout-btn { background: #ef4444; border: none; color: white; padding: 12px; border-radius: 8px; cursor: pointer; font-weight: 600; transition: 0.3s;}
                .logout-btn:hover { background: #dc2626; transform: translateY(-2px); }

                .main-viewport { flex: 1; padding: 2.5rem; overflow-y: auto; }
                .glass-card { background: var(--white); border-radius: 20px; padding: 2rem; box-shadow: 0 10px 25px rgba(0,0,0,0.08); margin-bottom: 2rem; transition: 0.3s; }
                .card-header h3 { font-size: 1.5rem; color: var(--primary); margin-bottom: 4px; }
                .card-header p { color: #64748b; font-size: 0.9rem; margin-bottom: 2rem; }

                .modern-form { display: flex; flex-direction: column; gap: 1.5rem; }
                .form-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
                .form-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
                .input-group { display: flex; flex-direction: column; gap: 6px; }
                .input-group label { font-size: 0.85rem; font-weight: 600; color: var(--text); }
                input, select { padding: 12px; border: 1px solid #e2e8f0; border-radius: 12px; outline: none; transition: all 0.3s ease; font-size: 0.95rem; }
                input:focus, select:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15); }
                .submit-btn { background: var(--accent); color: white; border: none; padding: 15px; border-radius: 12px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; margin-top: 1rem; }
                .submit-btn:hover { background: #2563eb; transform: translateY(-2px); }

                .modern-filters { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-top: 1.5rem; }
                .commission-section { margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid #e2e8f0; }
                .commission-inputs { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 10px; }
                .pdf-btn { background: #10b981; color: white; border: none; border-radius: 12px; font-weight: 600; cursor: pointer; transition: 0.3s; }
                .pdf-btn:hover { background: #059669; transform: translateY(-2px); }

                .table-wrapper { padding: 0; overflow-x: auto; border-radius: 12px; }
                .modern-table { width: 100%; border-collapse: collapse; text-align: left; min-width: 800px; }
                .modern-table th { background: #f1f5f9; padding: 15px; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }
                .modern-table tbody tr { border-bottom: 1px solid #f1f5f9; }
                .modern-table tbody tr:hover { background: #f8fafc; transition: 0.3s; }
                .modern-table td { padding: 15px; font-size: 0.95rem; }
                .desc-cell { font-weight: 600; color: var(--primary); }
                .badge-qty { background: #dbeafe; color: #1e40af; padding: 4px 10px; border-radius: 8px; font-size: 0.8rem; font-weight: bold; }
                .total-cell { font-weight: bold; color: #0f172a; }
                
                .status-pill { border: none; padding: 6px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; transition: 0.3s; cursor: pointer;}
                .status-pill.ne_perdorim { background: #dcfce7; color: #166534; }
                .status-pill.ne_depo { background: #dbeafe; color: #1e40af; }
                .status-pill.ne_riparim { background: #fef3c7; color: #92400e; }
                .status-pill.i_amortizuar { background: #fee2e2; color: #991b1b; }

                .animate-in { animation: slideUp 0.4s ease-out; }
                @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

                .loader { text-align: center; padding: 2rem; color: var(--accent); font-weight: bold; }
            `}</style>
        </div>
    );
};

export default DashboardPage;