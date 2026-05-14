


export function createPageUrl(pageName: string) {
    return '/' + pageName.toLowerCase().replace(/ /g, '-');
}

/**
 * Generates a clean lesson URL from module and lesson data.
 * Format: /learn/{moduleId}/{order}-{lessonSlug}
 * Example: /learn/module-1/01-transparency-problem
 */
export function createLessonUrl(module: { id: string }, lesson: { slug: string; order: number }): string {
    const orderPrefix = String(lesson.order).padStart(2, '0');
    return `/learn/${module.id}/${orderPrefix}-${lesson.slug}`;
}