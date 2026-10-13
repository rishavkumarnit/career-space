import fs from 'node:fs';
import path from 'node:path';

export type SearchEntry = {
  title: string;
  source: 'MERN' | 'GenAI' | 'DSA' | 'LLD';
  section: string;
  href: string;
  content: string;
};

const publicRoot = path.join(process.cwd(), 'public', 'spaces');

function decodeEntities(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function plainText(value: string) {
  return decodeEntities(
    value
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, ' ')
      .replace(/<[^>]+>/g, ' '),
  ).replace(/\s+/g, ' ').trim();
}

function htmlTitle(html: string, fallback: string) {
  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1];
  return plainText(title || fallback).replace(/\s+[—|-]\s+MERN Interview Revision$/i, '');
}

function buildMernEntries(): SearchEntry[] {
  const directory = path.join(publicRoot, 'mern', 'pages');
  if (!fs.existsSync(directory)) return [];

  return fs.readdirSync(directory).filter((file) => file.endsWith('.html')).flatMap((file) => {
    const html = fs.readFileSync(path.join(directory, file), 'utf8');
    const section = htmlTitle(html, file.replace(/\.html$/, ''));
    const questions = [...html.matchAll(/<details\b[^>]*>([\s\S]*?)<\/details>/gi)];
    const href = `/spaces/mern/pages/${file}`;

    if (!questions.length) {
      return [{ title: section, source: 'MERN' as const, section, href, content: plainText(html).slice(0, 40000) }];
    }

    return questions.map((question) => {
      const block = question[1];
      const summary = block.match(/<summary\b[^>]*>([\s\S]*?)<\/summary>/i)?.[1] || section;
      return {
        title: plainText(summary).replace(/^\d+[.)]\s*/, ''),
        source: 'MERN' as const,
        section,
        href,
        content: plainText(block).slice(0, 6000),
      };
    });
  });
}

function buildGenAiEntries(): SearchEntry[] {
  const filename = path.join(publicRoot, 'genai', 'index.html');
  if (!fs.existsSync(filename)) return [];
  const html = fs.readFileSync(filename, 'utf8');
  const guides = [...html.matchAll(/<section\b[^>]*class="[^"]*guide-panel[^"]*"[^>]*id="([^"]+)"[^>]*>/gi)];

  return guides.map((guide, index) => {
    const start = guide.index ?? 0;
    const end = guides[index + 1]?.index ?? html.length;
    const block = html.slice(start, end);
    const heading = block.match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/i)?.[1] || guide[1];
    return {
      title: plainText(heading),
      source: 'GenAI' as const,
      section: 'GenAI Interview Prep',
      href: `/spaces/genai/index.html#${guide[1]}`,
      content: plainText(block).slice(0, 45000),
    };
  });
}

function buildDsaEntries(): SearchEntry[] {
  const filename = path.join(publicRoot, 'dsa', 'data.js');
  if (!fs.existsSync(filename)) return [];
  const source = fs.readFileSync(filename, 'utf8');
  const sections = [...source.matchAll(/\{\s*id:\s*"([^"]+)"\s*,\s*title:\s*"([^"]+)"\s*,\s*items:\s*\[([\s\S]*?)\n\s*\]\s*\n\}/g)];

  return sections.flatMap((section) => {
    const [, id, rawSectionTitle, items] = section;
    const sectionTitle = rawSectionTitle.replace(/^\d+\.\s*/, '');
    return [...items.matchAll(/\[(?:null|\d+),\s*"((?:[^"\\]|\\.)*)",\s*"([^"]+)"/g)].map((item) => ({
      title: item[1].replace(/\\"/g, '"'),
      source: 'DSA' as const,
      section: sectionTitle,
      href: `/spaces/dsa/index.html#sec-${id}`,
      content: `${sectionTitle} ${item[1]}`,
    }));
  });
}

function buildLldEntries(): SearchEntry[] {
  const directory = path.join(publicRoot, 'lld', 'pages');
  if (!fs.existsSync(directory)) return [];

  return fs.readdirSync(directory).filter((file) => file.endsWith('.html')).flatMap((file) => {
    const html = fs.readFileSync(path.join(directory, file), 'utf8');
    const sections = [...html.matchAll(/<section\b[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/section>/gi)];

    return sections.map((section) => {
      const heading = section[2].match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/i)?.[1] || htmlTitle(html, file);
      return {
        title: plainText(heading),
        source: 'LLD' as const,
        section: htmlTitle(html, 'Low-Level Design').replace(/\s+[—|-]\s+LLD$/i, ''),
        href: `/spaces/lld/pages/${file}#${section[1]}`,
        content: plainText(section[2]),
      };
    });
  });
}

export function buildSearchIndex() {
  return [...buildMernEntries(), ...buildGenAiEntries(), ...buildDsaEntries(), ...buildLldEntries()];
}
