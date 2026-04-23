import axios from 'axios';

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
        console.error('RESPONSE ERROR:', error.response?.status, error.response?.config?.url);
        console.error('ERROR DATA:', error.response?.data);
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
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

export interface LoginRequest {
    email: string;
    password: string;
}

export interface EmailVerificationRequest {
    email: string;
}

export interface VerifyCodeRequest {
    email: string;
    code: string;
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


export async function login(email: string, password: string): Promise<AuthResponse> {
    console.log('login called for:', email);
    try {
        const response = await api.post('/auth/login', { email, password });
        console.log('login success:', response.data);
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
        console.error('login error:', error);
        if (error.response?.status === 401 || error.response?.status === 403) {
            const errorData = error.response?.data;
            const errorMessage = errorData?.message || errorData?.error || '';

            if (errorMessage.toLowerCase().includes('password') || errorMessage.toLowerCase().includes('incorrect')) {
                throw new Error('Incorrect password. Please try again.');
            } else if (errorMessage.toLowerCase().includes('email') || errorMessage.toLowerCase().includes('not found')) {
                throw new Error('Email not found. Please check your email or register.');
            } else {
                throw new Error('Invalid email or password');
            }
        } else if (error.response?.status === 404) {
            throw new Error('Email not found. Please register first.');
        } else if (error.response?.status === 400) {
            const errorData = error.response?.data;
            throw new Error(errorData?.message || 'Invalid request. Please check your input.');
        } else {
            throw new Error('Login failed. Please try again later.');
        }
    }
}

export async function getCurrentUser(): Promise<User> {
    const response = await api.get('/auth/me');
    return response.data;
}

export function logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
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
    const { email, password, phoneNumber, role, donorData, bloodCenterData, medicalCenterData } = frontendData;

    const backendData: any = {
        email,
        password,
        phoneNumber,
        role,
    };

    if (role === 'DONOR' && donorData) {
        Object.assign(backendData, {
            fullName: donorData.fullName,
            birthDate: donorData.birthDate,
            iin: donorData.iin,
            weight: donorData.weight,
            height: donorData.height,
            bloodGroup: donorData.bloodGroup,
            rhesusFactor: donorData.rhesusFactor === 'POSITIVE' ? 'Positive' : 'Negative',
            address: donorData.address,
            city: donorData.city,
            gender: donorData.gender,
        });
    }

    if (role === 'BLOOD_CENTER' && bloodCenterData) {
        Object.assign(backendData, {
            bloodCenterName: bloodCenterData.bloodCenterName,
            bloodCenterLocation: bloodCenterData.location,
            bloodCenterCity: bloodCenterData.city,
            bloodCenterSpecialization: bloodCenterData.specialization,
            bloodCenterDirectorFullName: bloodCenterData.directorFullName,
            latitude: bloodCenterData.latitude,
            longitude: bloodCenterData.longitude,
        });
    }

    if (role === 'MEDICAL_CENTER' && medicalCenterData) {
        Object.assign(backendData, {
            medCenterName: medicalCenterData.medCenterName,
            medCenterLocation: medicalCenterData.location,
            medCenterPhone: medicalCenterData.phone,
            medCenterSpecialization: medicalCenterData.specialization,
            medCenterDirectorFullName: medicalCenterData.directorFullName,
        });
    }

    return backendData;
}