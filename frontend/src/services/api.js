import axios from 'axios';

const API = axios.create({
    baseURL: 'http://localhost:5000/api', 
});

// Ky interceptor shtohet që çdo kërkesë (pasi të bësh login) të ketë Tokenin automatikisht
API.interceptors.request.use((req) => {
    const user = JSON.parse(localStorage.getItem('userInfo'));
    if (user && user.token) {
        req.headers.Authorization = `Bearer ${user.token}`;
    }
    return req;
});

export default API;