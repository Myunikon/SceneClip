/**
 * Unit Tests for locales.ts
 * Tests translation completeness and structure
 */
import { describe, it, expect } from 'vitest'
import { en } from './locales/en'
import { id } from './locales/id'
import { ms } from './locales/ms'
import { zh } from './locales/zh'

const translations = { en, id, ms, zh }

describe('translations', () => {
    const languages = Object.keys(translations) as Array<keyof typeof translations>

    it('should have all expected languages', () => {
        expect(languages).toContain('en')
        expect(languages).toContain('id')
        expect(languages).toContain('zh')
        expect(languages).toContain('ms')
    })

    it('should have nav section in all languages', () => {
        for (const lang of languages) {
            const t = translations[lang]
            expect(t.nav).toBeDefined()
            expect(t.nav.downloads).toBeDefined()
        }
    })

    it('should have settings section in all languages', () => {
        for (const lang of languages) {
            const t = translations[lang]
            expect(t.settings).toBeDefined()
            expect(t.settings.tabs).toBeDefined()
        }
    })

    it('should have downloads section in all languages', () => {
        for (const lang of languages) {
            const t = translations[lang]
            expect(t.downloads).toBeDefined()
            expect(t.downloads.title).toBeDefined()
        }
    })

    it('should have history section in all languages', () => {
        for (const lang of languages) {
            const t = translations[lang]
            expect(t.history).toBeDefined()
            expect(t.history.title).toBeDefined()
        }
    })

    it('should have dialog section in all languages', () => {
        for (const lang of languages) {
            const t = translations[lang]
            expect(t.dialog).toBeDefined()
            expect(t.dialog.title).toBeDefined()
        }
    })

    it('should have header section with title in all languages', () => {
        for (const lang of languages) {
            const t = translations[lang]
            expect(t.header).toBeDefined()
            expect(t.header.title).toBeDefined()
        }
    })
})
