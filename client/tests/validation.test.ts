import { describe, expect, it } from 'vitest';
import { NAME_REGEX, nameError } from '../src/lib/validation';

describe('NAME_REGEX', () => {
    it('accepts letters, digits and underscores only', () => {
        expect(NAME_REGEX.test('abc_DEF_123')).toBe(true);
        expect(NAME_REGEX.test('with space')).toBe(false);
        expect(NAME_REGEX.test('dash-dash')).toBe(false);
        expect(NAME_REGEX.test('é')).toBe(false);
        expect(NAME_REGEX.test('')).toBe(false);
    });
});

describe('nameError', () => {
    it('returns an empty string for a valid name', () => {
        expect(nameError('player_1', 'Username')).toBe('');
    });

    it('refuses an empty name, with the right label', () => {
        expect(nameError('', 'Username')).toBe('Username cannot be empty.');
        expect(nameError('', 'Room name')).toBe('Room name cannot be empty.');
    });

    it('refuses forbidden characters', () => {
        expect(nameError('a b', 'Room name')).toBe('Room name can only contain letters, numbers, and underscores.');
    });
});
