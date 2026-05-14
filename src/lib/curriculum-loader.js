const lessonFiles = import.meta.glob('/src/content/**/*.mdx', { eager: true, query: '?raw', import: 'default' });
const metaFiles = import.meta.glob('/src/content/**/meta.json', { eager: true });

function parseFrontmatter(content) {
    const frontmatterRegex = /^---\s*([\s\S]*?)\s*---/;
    const match = content.match(frontmatterRegex);

    if (!match) {
        return { data: {}, content: content };
    }

    const frontmatterBlock = match[1];
    const body = content.replace(frontmatterRegex, '').trim();
    const data = {};

    frontmatterBlock.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split(':');
        if (key && valueParts.length > 0) {
            let value = valueParts.join(':').trim();
            // Remove quotes if present
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1);
            } else if (value.startsWith("'") && value.endsWith("'")) {
                value = value.slice(1, -1);
            }
            data[key.trim()] = value;
        }
    });

    // Parse requiredPatterns as array if present (comma-separated in frontmatter)
    if (data.requiredPatterns) {
        data.requiredPatterns = data.requiredPatterns
            .split(',')
            .map(p => p.trim())
            .filter(Boolean);
    }

    return { data, content: body };
}

function extractStarterCode(content) {
    // Extract the first ```solidity code block from the content
    const codeBlockRegex = /```solidity\s*\n([\s\S]*?)```/;
    const match = content.match(codeBlockRegex);
    return match ? match[1].trim() : null;
}

export const loadCurriculum = () => {
    try {
        const curriculumMap = {};

        // 1. Initialize modules from meta.json
        for (const path in metaFiles) {
            try {
                // path: /src/content/module-1/meta.json
                const parts = path.split('/');
                const moduleDir = parts[parts.length - 2]; // module-1
                const meta = metaFiles[path].default || metaFiles[path]; // Handle JSON module export

                curriculumMap[moduleDir] = {
                    id: moduleDir,
                    ...meta,
                    lessons: []
                };
            } catch (e) {
                console.error(`Error loading meta for ${path}:`, e);
            }
        }

        // 2. Load lessons
        for (const path in lessonFiles) {
            try {
                const rawContent = lessonFiles[path];
                const { data, content: body } = parseFrontmatter(rawContent);

                const parts = path.split('/');
                const moduleDir = parts[parts.length - 2];
                const filename = parts[parts.length - 1];

                if (!curriculumMap[moduleDir]) {
                    // Fallback if meta.json missing
                    curriculumMap[moduleDir] = {
                        id: moduleDir,
                        title: moduleDir,
                        slug: moduleDir,
                        description: '',
                        estimatedHours: 0,
                        lessons: []
                    };
                }

                const match = filename.match(/^(\d+)-(.*)\.mdx$/);
                let order = 999;
                let slug = filename.replace('.mdx', '');

                if (match) {
                    order = parseInt(match[1]);
                    slug = match[2];
                }

                // Normalize "challenge" so app only sees reading | quiz | sandbox (Lesson.jsx only renders those)
                let lessonType = data.type || 'reading';
                if (lessonType === 'challenge') {
                    const hasStarterCode = extractStarterCode(body);
                    const hasRequiredPatterns = data.requiredPatterns && (Array.isArray(data.requiredPatterns) ? data.requiredPatterns.length > 0 : String(data.requiredPatterns).trim().length > 0);
                    lessonType = (hasStarterCode || hasRequiredPatterns) ? 'sandbox' : 'reading';
                }

                curriculumMap[moduleDir].lessons.push({
                    ...data,
                    id: `${moduleDir}-${slug}`,
                    slug: slug,
                    title: data.title || slug,
                    type: lessonType,
                    content: body,
                    order: order,
                    starterCode: lessonType === 'sandbox' ? (data.starterCode || extractStarterCode(body)) : undefined,
                });
            } catch (e) {
                console.error(`Error loading lesson ${path}:`, e);
            }
        }

        // 3. Sort
        const curriculum = Object.values(curriculumMap).sort((a, b) => {
            // Try to sort by ID number
            const numA = parseInt(a.id.replace(/\D/g, '')) || 0;
            const numB = parseInt(b.id.replace(/\D/g, '')) || 0;
            return numA - numB;
        });

        curriculum.forEach(mod => {
            mod.lessons.sort((a, b) => a.order - b.order);
        });

        console.log('Loaded curriculum:', curriculum.length, 'modules');
        return curriculum;
    } catch (error) {
        console.error('Error loading curriculum:', error);
        // Return empty array as fallback
        return [];
    }
};
