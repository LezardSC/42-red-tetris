export const NAME_REGEX: RegExp = /^[a-zA-Z0-9_]+$/;

export function nameError(name: string, label: 'Username' | 'Room name'): string {
    if (!name) return `${label} cannot be empty.`;
    if (!NAME_REGEX.test(name)) return `${label} can only contain letters, numbers, and underscores.`;
    return '';
}
