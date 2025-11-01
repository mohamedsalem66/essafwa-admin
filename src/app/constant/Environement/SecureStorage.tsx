import SecureLS from 'secure-ls';

const ls = new SecureLS({ encodingType: 'aes' });

export const storeSecureData = (key, value) => {
    try {
        ls.set(key, value);
    } catch (e) {
        console.error('Error saving secure data:', e);
    }
};

export const getSecureData = (key) => {
    try {
        return ls.get(key);
    } catch (e) {
        console.error('Error reading secure data:', e);
    }
};

export const clearSecureData = (key) => {
    try {
        ls.remove(key);
    } catch (e) {
        console.error('Error clearing secure data:', e);
    }
};

export const clearAllSecureData = () => {
    try {
        ls.clear();
    } catch (e) {
        console.error('Error clearing all secure data:', e);
    }
};
