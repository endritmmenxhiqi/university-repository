import React, { useState } from 'react';
import API from '../services/api';

const AddItemForm = ({ onRefresh }) => {
    const [formData, setFormData] = useState({
        description: '',
        serialNumber: '',
        location: 'Salla 1',
        value: '',
        status: 'ne_perdorim'
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await API.post('/inventory', formData);
            alert("Aseti u shtua me sukses!");
            setFormData({ ...formData, description: '', serialNumber: '', value: '' });
            onRefresh(); // Refresh tabelën automatikisht
        } catch (error) {
            alert("Gabim: " + (error.response?.data?.message || "Provoni përsëri"));
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '30px' }}>
            <h3>Shto Aset të Ri</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <input type="text" placeholder="Përshkrimi (psh. Laptop Dell)" value={formData.description} 
                       onChange={(e) => setFormData({...formData, description: e.target.value})} required />
                
                <input type="text" placeholder="Numri Serial" value={formData.serialNumber} 
                       onChange={(e) => setFormData({...formData, serialNumber: e.target.value})} required />
                
                <input type="number" placeholder="Vlera (€)" value={formData.value} 
                       onChange={(e) => setFormData({...formData, value: e.target.value})} required />

                <select value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})}>
                    <option value="Salla 1">Salla 1</option>
                    <option value="Salla 2">Salla 2</option>
                    <option value="Laboratori 402">Laboratori 402</option>
                    <option value="Korridori">Korridori</option>
                </select>
            </div>
            <button type="submit" style={{ marginTop: '10px', padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Regjistro Asetin
            </button>
        </form>
    );
};

export default AddItemForm;