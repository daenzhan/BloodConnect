export interface ValidationErrors {
    [key: string]: string;
}


export const validateEmail = (email: string): string | null => {
    if (!email) return "Email is required";
    const emailRegex = /^[A-Za-z0-9+_.-]+@(.+)$/;
    if (!emailRegex.test(email)) return "Invalid email format";
    return null;
};


export const validatePassword = (password: string): string | null => {
    if (!password) return "Password is required";
    if (password.length < 6) return "Password must be at least 6 characters";
    const passwordRegex = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=])(?=\S+$).{6,}$/;
    if (!passwordRegex.test(password)) {
        return "Password must contain at least one digit, one lowercase, one uppercase, one special character and no spaces";
    }
    return null;
};


export const validatePhoneNumber = (phone: string): string | null => {
    if (!phone) return "Phone number is required";
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    if (!phoneRegex.test(phone)) return "Phone number must be 10-15 digits";
    return null;
};


export const validateIIN = (iin: string): string | null => {
    if (!iin) return "IIN is required";
    if (!/^[0-9]{12}$/.test(iin)) return "IIN must be exactly 12 digits";
    return null;
};


export const validateWeight = (weight: number): string | null => {
    if (!weight || weight <= 0) return "Weight is required";
    if (weight < 30) return "Weight must be at least 30 kg";
    if (weight > 250) return "Weight must not exceed 250 kg";
    return null;
};


export const validateHeight = (height: number): string | null => {
    if (!height || height <= 0) return "Height is required";
    if (height < 100) return "Height must be at least 100 cm";
    if (height > 250) return "Height must not exceed 250 cm";
    return null;
};


export const validateBirthDate = (birthDate: string): string | null => {
    if (!birthDate) return "Birth date is required";
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    if (age < 18) return "You must be at least 18 years old";
    if (age > 60) return "You must not be older than 60 years";
    return null;
};


export const validateFullName = (fullName: string): string | null => {
    if (!fullName || fullName.trim().length === 0) return "Full name is required";
    if (fullName.trim().length < 2) return "Full name must be at least 2 characters";
    return null;
};


export const validateCity = (city: string): string | null => {
    if (!city || city.trim().length === 0) return "City is required";
    return null;
};


export const validateAddress = (address: string): string | null => {
    if (!address || address.trim().length === 0) return "Address is required";
    return null;
};


export const validateDonorData = (donorData: any): ValidationErrors => {
    const errors: ValidationErrors = {};

    const fullNameError = validateFullName(donorData.fullName);
    if (fullNameError) errors.fullName = fullNameError;

    const birthDateError = validateBirthDate(donorData.birthDate);
    if (birthDateError) errors.birthDate = birthDateError;

    const iinError = validateIIN(donorData.iin);
    if (iinError) errors.iin = iinError;

    const weightError = validateWeight(donorData.weight);
    if (weightError) errors.weight = weightError;

    const heightError = validateHeight(donorData.height);
    if (heightError) errors.height = heightError;

    const cityError = validateCity(donorData.city);
    if (cityError) errors.city = cityError;

    const addressError = validateAddress(donorData.address);
    if (addressError) errors.address = addressError;

    return errors;
};


export const validateStep1 = (baseData: any): ValidationErrors => {
    const errors: ValidationErrors = {};

    const emailError = validateEmail(baseData.email);
    if (emailError) errors.email = emailError;

    const passwordError = validatePassword(baseData.password);
    if (passwordError) errors.password = passwordError;

    const phoneError = validatePhoneNumber(baseData.phoneNumber);
    if (phoneError) errors.phoneNumber = phoneError;

    return errors;
};

export async function checkEmailUniqueness(email: string): Promise<string | null> {
    try {
        const response = await fetch(`http://localhost:8080/auth/check-email?email=${encodeURIComponent(email)}`);
        const data = await response.json();
        if (data.exists) {
            return "This email is already registered. Please use another email or login.";
        }
        return null;
    } catch (error) {
        console.error("Error checking email:", error);
        return null;
    }
}

export async function checkIinUniqueness(iin: string): Promise<string | null> {
    try {
        const response = await fetch(`http://localhost:8080/auth/check-iin?iin=${iin}`);
        const data = await response.json();
        if (data.exists) {
            return "This IIN is already registered. Please contact support if this is you.";
        }
        return null;
    } catch (error) {
        console.error("Error checking IIN:", error);
        return null;
    }
}

export async function checkPhoneUniqueness(phone: string): Promise<string | null> {
    try {
        const response = await fetch(`http://localhost:8080/auth/check-phone?phone=${encodeURIComponent(phone)}`);
        const data = await response.json();
        if (data.exists) {
            return "This phone number is already registered.";
        }
        return null;
    } catch (error) {
        console.error("Error checking phone:", error);
        return null;
    }
}