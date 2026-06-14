import { describe, it, expect, beforeAll } from 'vitest';
import * as scraper from './scrape-courses';
import fs from 'fs';
import * as cheerio from 'cheerio';
import type { Program } from './scrape-courses';

// Shared state

let csProgram: Program;
let programs: Record<string, Program>;

beforeAll(() => {
  // Course scraping
  csProgram = { url: 'scripts/fixtures/cs_courses.html', courses: [] };
  const csHtml = cheerio.load(fs.readFileSync(csProgram.url, 'utf-8'));
  csHtml('div.courseblock').each((_, ele) => {
    try {
      csProgram.courses.push(scraper.buildCourseData(csHtml(ele)));
    } catch (err) {
      console.error('Could not parse course:', err);
    }
  });

  // Program scraping
  const programsHtml = cheerio.load(
    fs.readFileSync('scripts/fixtures/programsPage.html', 'utf-8'),
  );
  programs = scraper.getPrograms(programsHtml);
});

// Course scraping tests

describe('buildCourseData (cs_courses fixture)', () => {
  it('parses at least one course', () => {
    expect(csProgram.courses.length).toBeGreaterThan(20); // large enough to assume success
  });

  it('COMP 3004 has correct code and title', () => {
    const course = csProgram.courses.find((c) => c.code === 'COMP 3004');
    expect(course, 'COMP 3004 not found').toBeDefined();
    expect(course!.title).toBe('Object-Oriented Software Engineering');
  });

  it('COMP 3004 has correct credit value', () => {
    const course = csProgram.courses.find((c) => c.code === 'COMP 3004');
    expect(course!.credits).toBe(0.5);
  });

  it('COMP 3004 has a non-empty description', () => {
    const course = csProgram.courses.find((c) => c.code === 'COMP 3004');
    expect(course!.description.length).toBeGreaterThan(0);
    expect(course!.description).toContain('object-oriented');
  });

  it('COMP 3004 has correct raw prereq string', () => {
    const course = csProgram.courses.find((c) => c.code === 'COMP 3004');
    expect(course!.prereqRaw).not.toBeNull();
    expect(course!.prereqRaw).toContain('COMP 2401');
    expect(course!.prereqRaw).toContain('COMP 2404');
    expect(course!.prereqRaw).toContain('COMP 2406');
  });

  it('COMP 3004 has no precludes', () => {
    const course = csProgram.courses.find((c) => c.code === 'COMP 3004');
    // COMP 3004 precludes SYSC 3020, SYSC 3120, SYSC 4120
    expect(course!.precludes).toHaveLength(3);
    expect(course!.precludes).toContain('SYSC 3020');
    expect(course!.precludes).toContain('SYSC 3120');
    expect(course!.precludes).toContain('SYSC 4120');
  });

  it('COMP 1006 precludes are parsed correctly', () => {
    const course = csProgram.courses.find((c) => c.code === 'COMP 1006');
    expect(course, 'COMP 1006 not found').toBeDefined();
    expect(course!.precludes.length).toBeGreaterThan(0);
  });
});

// Program scraping tests

describe('getPrograms (programsPage fixture)', () => {
  it('returns only the programs in programsToScan', () => {
    expect(Object.keys(programs)).toHaveLength(2); // This would break once we change how programs to parse works or the amount of programs.
    expect(programs).toHaveProperty('Computer Science');
    expect(programs).toHaveProperty('Mathematics and Statistics');
  });

  it('Computer Science has the correct URL', () => {
    expect(programs['Computer Science'].url).toBe(
      'https://calendar.carleton.ca/undergrad/undergradprograms/computerscience/',
    );
  });

  it('Mathematics and Statistics has the correct URL', () => {
    expect(programs['Mathematics and Statistics'].url).toBe(
      'https://calendar.carleton.ca/undergrad/undergradprograms/mathematicsandstatistics/',
    );
  });

  it('all returned programs start with empty courses array', () => {
    for (const program of Object.values(programs)) {
      expect(program.courses).toHaveLength(0);
    }
  });
});
