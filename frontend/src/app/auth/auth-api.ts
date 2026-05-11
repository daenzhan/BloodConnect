import axios from 'axios';
import {Role} from "@/app/auth/auth-types";

const API_BASE_URL = 'http://localhost:8080';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 50000,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    console.log('REQUEST:', config.method?.toUpperCase(), config.url);
    console.log('DATA:', config.data);
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    console.error('REQUEST ERROR:', error);
    return Promise.reject(error);
});


api.interceptors.response.use(
    (response) => {
        console.log('RESPONSE:', response.status, response.config.url);
        console.log('DATA:', response.data);
        return response;
    },
    (error) => {
        const url = error.response?.config?.url;
        const isLoginEndpoint = url?.includes('/auth/login');

        if (!(isLoginEndpoint && error.response?.status === 401)) {
            console.error('RESPONSE ERROR:', error.response?.status, url);
            console.error('ERROR DATA:', error.response?.data);
        }
        const isAuthEndpoint = url?.includes('/auth/login') || url?.includes('/auth/register');

        if (!isAuthEndpoint && error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/auth/login';
        }

        return Promise.reject(error);
    }
);

export interface User {
    userId: number;
    email: string;
    role: string;
    phoneNumber: string;
}

export interface AuthResponse {
    token: string;
    type: string;
    userId: number;
    email: string;
    role: string;
}

export interface BaseRegistrationData {
    email: string;
    password: string;
    confirmPassword: string;
    phoneNumber: string;
    role: Role;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
    console.log('login called for:', email);

    try {
        const response = await api.post('/auth/login', { email, password });
        console.log('login success:', response.data);

        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify({
                userId: response.data.userId,
                id: response.data.userId,
                email: response.data.email,
                role: response.data.role,
            }));
            console.log('Token saved to localStorage');
        }
        return response.data;
    } catch (error: any) {
        console.error('login error details:', error);

        const status = error.response?.status;
        const errorData = error.response?.data;

        let errorMessage = 'Invalid email or password';

        if (status === 401 || status === 403) {
            if (errorData && typeof errorData === 'object') {
                errorMessage = errorData.message || errorData.error || errorData;
                if (typeof errorMessage !== 'string') {
                    errorMessage = 'Invalid email or password';
                }
            } else if (typeof errorData === 'string') {
                errorMessage = errorData;
            }

            if (errorMessage.toLowerCase().includes('password') ||
                errorMessage.toLowerCase().includes('incorrect')) {
                errorMessage = 'Incorrect password. Please try again.';
            } else if (errorMessage.toLowerCase().includes('email') ||
                errorMessage.toLowerCase().includes('not found')) {
                errorMessage = 'Email not found. Please check your email or register.';
            } else {
                errorMessage = 'Invalid email or password. Please try again.';
            }
        } else if (status === 404) {
            errorMessage = 'Email not found. Please register first.';
        } else if (status === 500) {
            errorMessage = 'Server error. Please try again later.';
        }

        throw new Error(errorMessage);
    }
}

export async function sendVerificationCode(email: string): Promise<{ message: string; email: string }> {
    console.log('sendVerificationCode called for:', email);
    try {
        const response = await api.post('/auth/send-verification', { email });
        console.log('sendVerificationCode success:', response.data);
        return response.data;
    } catch (error) {
        console.error('sendVerificationCode error:', error);
        throw error;
    }
}

export async function verifyCode(email: string, code: string): Promise<{ message: string; email: string }> {
    console.log('verifyCode called for:', email, 'code:', code);
    try {
        const response = await api.post('/auth/verify-code', { email, code });
        console.log('verifyCode success:', response.data);
        return response.data;
    } catch (error) {
        console.error('verifyCode error:', error);
        throw error;
    }
}

export async function register(requestData: any): Promise<AuthResponse> {
    console.log('register called with:', requestData);
    try {
        const backendData = transformToBackendFormat(requestData);
        console.log('Transformed data:', JSON.stringify(backendData, null, 2));
        console.log('Does transformed data have confirmPassword?', backendData.confirmPassword);
        const response = await api.post('/auth/register', backendData);
        console.log('register success:', response.data);

        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify({
                userId: response.data.userId,
                email: response.data.email,
                role: response.data.role,
            }));
        }
        return response.data;
    } catch (error: any) {
        console.error('register error:', error);
        if (error.response?.data) {
            console.error('Server error details:', error.response.data);
            throw new Error(JSON.stringify(error.response.data));
        }
        throw error;
    }
}

export async function forgotPassword(email: string): Promise<{ message: string; email: string }> {
    console.log('forgotPassword called for:', email);
    try {
        const response = await api.post('/auth/forgot-password', { email });
        console.log('forgotPassword success:', response.data);
        return response.data;
    } catch (error: any) {
        console.error('forgotPassword error:', error);
        const message = error.response?.data?.error || 'Failed to send reset code';
        throw new Error(message);
    }
}

export async function resetPassword(email: string, code: string, newPassword: string): Promise<{ message: string }> {
    console.log('resetPassword called for:', email);
    try {
        const response = await api.post('/auth/reset-password', { email, code, newPassword });
        console.log('resetPassword success:', response.data);
        return response.data;
    } catch (error: any) {
        console.error('resetPassword error:', error);
        const message = error.response?.data?.error || 'Failed to reset password';
        throw new Error(message);
    }
}

export async function getCurrentUser(): Promise<User> {
    const response = await api.get('/auth/me');
    return response.data;
}

export function logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/auth/login';
}

export async function checkEmailExists(email: string): Promise<{ exists: boolean }> {
    const response = await api.get(`/auth/check-email?email=${encodeURIComponent(email)}`);
    return response.data;
}

export async function checkIinExists(iin: string): Promise<{ exists: boolean }> {
    const response = await api.get(`/auth/check-iin?iin=${encodeURIComponent(iin)}`);
    return response.data;
}

export async function checkPhoneExists(phone: string): Promise<{ exists: boolean }> {
    const response = await api.get(`/auth/check-phone?phone=${encodeURIComponent(phone)}`);
    return response.data;
}

function transformToBackendFormat(frontendData: any): any {
    console.log('Frontend data received in transform:', frontendData);
    console.log('Confirm password value:', frontendData.confirmPassword);

    const { email, password,confirmPassword, phoneNumber, role, donorData, bloodCenterData, medicalCenterData } = frontendData;

    const backendData: any = {
        email: email || '',
        password: password || '',
        confirmPassword: confirmPassword || '',
        phoneNumber: phoneNumber || '',
        role: role || 'DONOR',
    };

    console.log('Backend data after base assignment:', backendData);

    if (role === 'DONOR' && donorData) {
        Object.assign(backendData, {
            fullName: donorData.fullName || '',
            birthDate: donorData.birthDate || '',
            iin: donorData.iin || '',
            weight: donorData.weight || 0,
            height: donorData.height || 0,
            bloodGroup: donorData.bloodGroup || 'A',
            rhesusFactor: donorData.rhesusFactor === 'POSITIVE' ? 'Positive' : 'Negative',
            address: donorData.address || '',
            city: donorData.city || '',
            gender: donorData.gender || 'MALE',
        });
    }

    if (role === 'BLOOD_CENTER' && bloodCenterData) {
        Object.assign(backendData, {
            bloodCenterName: bloodCenterData.bloodCenterName || '',
            bloodCenterLocation: bloodCenterData.location || '',
            bloodCenterCity: bloodCenterData.city || '',
            bloodCenterSpecialization: bloodCenterData.specialization || '',
            bloodCenterDirectorFullName: bloodCenterData.directorFullName || '',
            latitude: bloodCenterData.latitude || 0,
            longitude: bloodCenterData.longitude || 0,
        });
    }

    if (role === 'MEDICAL_CENTER' && medicalCenterData) {
        Object.assign(backendData, {
            medCenterName: medicalCenterData.medCenterName || '',
            medCenterLocation: medicalCenterData.location || '',
            medCenterSpecialization: medicalCenterData.specialization || '',
            medCenterDirectorFullName: medicalCenterData.directorFullName || '',
        });
    }

    console.log('Final backend data:', backendData);
    return backendData;
}