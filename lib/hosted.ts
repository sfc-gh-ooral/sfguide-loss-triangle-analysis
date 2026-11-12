// True in the static GitHub Pages build (`npm run build:example`). That build has no server,
// so pages keep their built-in sample data and the chat uses its scripted answers.
export const HOSTED_EXAMPLE = process.env.NEXT_PUBLIC_HOSTED_EXAMPLE === 'true';
