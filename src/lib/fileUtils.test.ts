import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUniqueFilePath } from './fileUtils';

// Mock the Tauri fs plugin
const mockExists = vi.fn();
vi.mock('@tauri-apps/plugin-fs', () => ({
    exists: (path: string) => mockExists(path)
}));

// Mock path join if needed, though getUniqueFilePath primarily does string manipulation
vi.mock('@tauri-apps/api/path', () => ({
    join: (...args: string[]) => args.join('/')
}));

describe('getUniqueFilePath', () => {
    beforeEach(() => {
        mockExists.mockReset();
    });

    it('should return original path if file does not exist', async () => {
        mockExists.mockResolvedValue(false);
        const result = await getUniqueFilePath('/downloads/video.mp4');
        expect(result).toBe('/downloads/video.mp4');
    });

    it('should increment counter if file exists', async () => {
        // First call (original) returns true (exists)
        // Second call (_1) returns false (does not exist)
        mockExists
            .mockResolvedValueOnce(true)
            .mockResolvedValueOnce(false);

        const result = await getUniqueFilePath('/downloads/video.mp4');
        expect(result).toBe('/downloads/video_1.mp4');
    });

    it('should increment multiple times until unique', async () => {
        // original -> exists
        // _1 -> exists
        // _2 -> exists
        // _3 -> free
        mockExists
            .mockResolvedValueOnce(true)
            .mockResolvedValueOnce(true)
            .mockResolvedValueOnce(true)
            .mockResolvedValueOnce(false);

        const result = await getUniqueFilePath('/downloads/video.mp4');
        expect(result).toBe('/downloads/video_3.mp4');
    });

    it('should handle files without extensions', async () => {
        mockExists
            .mockResolvedValueOnce(true)
            .mockResolvedValueOnce(false);

        const result = await getUniqueFilePath('/downloads/file');
        expect(result).toBe('/downloads/file_1');
    });

    it('should return last attempted path if maxAttempts reached (or fallback behavior)', async () => {
        // Always exists
        mockExists.mockResolvedValue(true);

        // Use small maxAttempts for test
        const result = await getUniqueFilePath('/downloads/video.mp4', 5);
        // It will try _1, _2, _3, _4, then stop loop and return _4 (strictly < 5 means 1..4) implies loop runs for counter 1,2,3,4. 
        // When counter=5, loop terminates. 
        // Wait, logic is: counter starts at 1. Loop while exists AND counter < max.
        // 1 < 5 -> check _1 -> exists -> counter=2
        // 2 < 5 -> check _2 -> exists -> counter=3
        // 3 < 5 -> check _3 -> exists -> counter=4
        // 4 < 5 -> check _4 -> exists -> counter=5
        // 5 < 5 -> False. Loop ends. Returns _4? 
        // Actually uniquePath is updated at start of loop body.
        // Let's trace carefully:
        // Init: uniquePath = original.
        // Loop 1: exists(original) && 1<5? True. uniquePath=_1. counter=2.
        // Loop 2: exists(_1) && 2<5? True. uniquePath=_2. counter=3.
        // Loop 3: exists(_2) && 3<5? True. uniquePath=_3. counter=4.
        // Loop 4: exists(_3) && 4<5? True. uniquePath=_4. counter=5.
        // Loop 5: exists(_4) && 5<5? False.
        // Returns _4.
        expect(result).toBe('/downloads/video_4.mp4');
    });
});
