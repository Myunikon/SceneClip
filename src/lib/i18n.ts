import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import existing translation objects
import { en } from './locales/en';
import { id } from './locales/id';
import { ms } from './locales/ms';
import { zh } from './locales/zh';

// Define resources
const resources = {
    en: {
        translation: en
    },
    id: {
        translation: id
    },
    ms: {
        translation: ms
    },
    zh: {
        translation: zh
    }
};

i18n

    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        debug: import.meta.env.DEV, // Enable debug in development

        interpolation: {
            escapeValue: false, // not needed for react as it escapes by default
        },

        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
            lookupLocalStorage: 'i18nextLng'
        }
    });

export default i18n;
