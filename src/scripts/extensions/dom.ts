function formatMissingElementMessage(selectorType: 'id' | 'selector', value: string): string {
    return `Element not found by ${selectorType}: ${value}`;
}

export function getElementByIdOrThrow<T extends HTMLElement>(id: string): T {
    const element = document.getElementById(id);
    if (!element) {
        throw new Error(formatMissingElementMessage('id', id));
    }
    return element as T;
}

export function querySelectorOrThrow<T extends Element>(selector: string): T {
    const element = document.querySelector(selector);
    if (!element) {
        throw new Error(formatMissingElementMessage('selector', selector));
    }
    return element as T;
}

export function querySelectorAll<T extends Element>(selector: string): T[] {
    return Array.from(document.querySelectorAll(selector)) as T[];
}
