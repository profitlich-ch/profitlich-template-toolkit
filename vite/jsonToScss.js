export function jsonToScss(json) {
    const toValue = (v) => {
        if (typeof v === 'object' && v !== null) {
            return '(' + Object.entries(v).map(([k, val]) => `"${k}": ${toValue(val)}`).join(', ') + ')';
        }
        if (typeof v === 'string') {
            if (/^#[0-9a-fA-F]{3,8}$/.test(v)) return v; // Hex-Farben ohne Quotes
            return `"${v}"`;
        }
        return v;
    };
    return Object.entries(json)
        .filter(([key]) => key !== 'README')
        .map(([key, value]) => `$${key}: ${toValue(value)};`)
        .join('\n');
}
