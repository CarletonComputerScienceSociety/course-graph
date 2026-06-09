import { pathToFileURL } from 'node:url';
import { scrape } from './scrape-courses';

// Only run the scraper when this file is executed directly (e.g. via
// `pnpm scrape:courses`), never when the library module is imported — keeps the
// test suite offline and free of side effects.
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  scrape().catch((err) => {
    console.error('Scrape failed:', err);
    process.exit(1);
  });
}
