import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Tauri API
vi.mock('@tauri-apps/api/path', () => ({
  downloadDir: vi.fn(() => Promise.resolve('/home/user/downloads')),
  appDataDir: vi.fn(() => Promise.resolve('/home/user/.appdata')),
}))

vi.mock('@tauri-apps/plugin-shell', () => ({
  Command: {
    sidecar: vi.fn(() => ({
      execute: vi.fn(() => Promise.resolve({ stdout: '', stderr: '', code: 0 })),
    })),
    create: vi.fn(() => ({
        execute: vi.fn(() => Promise.resolve({ stdout: '', stderr: '', code: 0 })),
        on: vi.fn(),
    }))
  },
  open: vi.fn(),
}))

vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: vi.fn(),
  ask: vi.fn(),
  confirm: vi.fn(),
  message: vi.fn(),
  save: vi.fn(),
}))

vi.mock('@tauri-apps/plugin-opener', () => ({
    openUrl: vi.fn(),
    openPath: vi.fn(),
}))

vi.mock('@tauri-apps/plugin-fs', () => ({
    exists: vi.fn(() => Promise.resolve(true)),
    createDir: vi.fn(),
    writeFile: vi.fn(),
    readTextFile: vi.fn(),
}))

vi.mock('@tauri-apps/plugin-os', () => ({
    platform: vi.fn(() => 'windows'), // Default to windows for tests
    type: vi.fn(() => 'Windows_NT'),
    version: vi.fn(() => '10.0.0'),
    arch: vi.fn(() => 'x64'),
}))

vi.mock('@tauri-apps/plugin-http', () => ({
    fetch: vi.fn(() => Promise.resolve({
        ok: true,
        headers: { get: () => '100' },
        body: {
            getReader: () => ({
                read: () => Promise.resolve({ done: true, value: new Uint8Array() })
            })
        },
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0))
    })),
}))

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock ResizeObserver
globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
}
// Mock Web Animations API
Element.prototype.animate = vi.fn().mockImplementation(() => ({
    finished: Promise.resolve(),
    cancel: vi.fn(),
    play: vi.fn(),
    pause: vi.fn(),
    reverse: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
}))
// Mock HTMLDialogElement
window.HTMLDialogElement.prototype.show = vi.fn();
window.HTMLDialogElement.prototype.showModal = vi.fn();
window.HTMLDialogElement.prototype.close = vi.fn();

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();
