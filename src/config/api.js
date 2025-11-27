// src/config/api.js
import axios from 'axios';


const isProduction = import.meta.env.PROD; // works in Vite

export const baseURL = isProduction
  ? 'https://assonstech-001-site2.ktempurl.com/api'
  : 'http://localhost:3000/api';

export const baseImageURL = isProduction
  ? 'https://assonstech-001-site2.ktempurl.com/uploads/'
  : 'http://localhost:3000/uploads/';


const api = axios.create({
  baseURL: baseURL,
  withCredentials: true, // send cookies
});

export default api;
