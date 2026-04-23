export type Role = 'DONOR' | 'BLOOD_CENTER' | 'MEDICAL_CENTER';
export type BloodGroup = 'A' | 'B' | 'AB' | 'O';
export type RhesusFactor = 'POSITIVE' | 'NEGATIVE';
export type Gender = 'MALE' | 'FEMALE';

export interface BaseRegistrationData {
    email: string;
    password: string;
    phoneNumber: string;
    role: Role;
}

export interface DonorData {
    fullName: string;
    birthDate: string;
    iin: string;
    weight: number;
    height: number;
    bloodGroup: BloodGroup;
    rhesusFactor: RhesusFactor;
    address: string;
    city: string;
    gender: Gender;
}

export interface BloodCenterData {
    bloodCenterName: string;
    location: string;
    city: string;
    specialization: string;
    licenseFile: File | null;
    directorFullName: string;
    latitude: number;
    longitude: number;
}

export interface MedicalCenterData {
    medCenterName: string;
    location: string;
    phone: string;
    licenseFile: File | null;
    directorFullName: string;
    specialization: string;
}