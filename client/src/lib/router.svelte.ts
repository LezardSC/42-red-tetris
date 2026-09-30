// Minimal client-side router: the current path lives in a $state, links go through goto().

export type Params = Record<string, string>;

export const route = $state({ path: window.location.pathname });

window.addEventListener('popstate', () => {
    route.path = window.location.pathname;
});

export function goto(path: string, replace: boolean = false): void {
    if (path === route.path) return;
    if (replace) window.history.replaceState(null, '', path);
    else window.history.pushState(null, '', path);
    route.path = path;
}

function segments(path: string): string[] {
    return path.split('/').filter(segment => segment !== '');
}

function decode(segment: string): string | null {
    try {
        return decodeURIComponent(segment);
    } catch {
        return null;
    }
}

// Matches a path against a pattern like '/:room/:username'.
// Returns the params, or null if the path doesn't match.
export function matchRoute(pattern: string, path: string): Params | null {
    const expected = segments(pattern);
    const actual = segments(path).map(decode);
    if (expected.length !== actual.length) return null;

    return expected.reduce<Params | null>((params, part, i) => {
        const value = actual[i];
        if (!params || value === null || value === undefined) return null;
        if (part.startsWith(':')) return { ...params, [part.slice(1)]: value };
        return part === value ? params : null;
    }, {});
}
