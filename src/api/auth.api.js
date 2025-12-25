import axios from '../config/api.config';
export const register_user=(data) => axios.post('/auth/register', data);
export const login_user=(data) => axios.post('/auth/login', data);
export const get_user=() => axios.get('/auth/get-user');