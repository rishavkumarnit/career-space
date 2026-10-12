import { BrainCircuit, ChevronRight, Code2, ExternalLink, FileText, Folder, ListChecks } from 'lucide-react';
import UniversalSearch from './universal-search';
import { buildSearchIndex } from '../lib/search-index';

const studySpaces = [
  {
    title: 'MERN Interview Questions',
    description: 'JavaScript, React, Node, databases, system topics, and behavioral prep.',
    href: '/spaces/mern/index.html',
    icon: Code2,
    meta: '20 topic collections',
  },
  {
    title: 'GenAI Interview Prep',
    description: 'GenAI, RAG, Python, FastAPI, deep learning, evaluation, and production.',
    href: '/spaces/genai/index.html',
    icon: BrainCircuit,
    meta: '9 focused guides',
  },
  {
    title: 'My DSA Sheet',
    description: 'Searchable problem lists with filters and progress saved in your browser.',
    href: '/spaces/dsa/index.html',
    icon: ListChecks,
    meta: 'DSA practice tracker',
  },
];

export default function Home() {
  const searchIndex = buildSearchIndex();

  return (
    <div className="shell">
      <aside className="sidebar">
        <a className="brand" href="/">Career Space</a>
        <div className="sidebar-topics">
          <h2>Study spaces</h2>
          {studySpaces.map((space) => (
            <a
              key={space.href}
              className="space-link"
              href={space.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              <space.icon size={16} />
              {space.title}
              <ExternalLink size={12} />
            </a>
          ))}
        </div>

        <nav className="folder-tree" aria-label="File explorer">
          <h2>Files</h2>
          <details open>
            <summary><ChevronRight className="tree-chevron" size={13} /><Folder size={15} />Interview prep</summary>
            <div className="tree-children">
              <details>
                <summary><ChevronRight className="tree-chevron" size={13} /><Folder size={15} />MERN Stack</summary>
                <div className="tree-children">
                  <a href="/spaces/mern/index.html" target="_blank" rel="noopener noreferrer"><FileText size={14} />Overview</a>
                  <a href="/spaces/mern/pages/js-fundamentals.html" target="_blank" rel="noopener noreferrer"><FileText size={14} />JavaScript</a>
                  <a href="/spaces/mern/pages/react.html" target="_blank" rel="noopener noreferrer"><FileText size={14} />React</a>
                  <a href="/spaces/mern/pages/node-express.html" target="_blank" rel="noopener noreferrer"><FileText size={14} />Node &amp; Express</a>
                  <a href="/spaces/mern/pages/mongodb.html" target="_blank" rel="noopener noreferrer"><FileText size={14} />MongoDB</a>
                </div>
              </details>

              <details>
                <summary><ChevronRight className="tree-chevron" size={13} /><Folder size={15} />AI &amp; Machine Learning</summary>
                <div className="tree-children">
                  <a href="/spaces/genai/index.html" target="_blank" rel="noopener noreferrer"><FileText size={14} />GenAI guide</a>
                  <a href="/spaces/genai/index.html#rag" target="_blank" rel="noopener noreferrer"><FileText size={14} />RAG</a>
                  <a href="/spaces/genai/index.html#python" target="_blank" rel="noopener noreferrer"><FileText size={14} />Python</a>
                  <a href="/spaces/genai/index.html#deep-learning" target="_blank" rel="noopener noreferrer"><FileText size={14} />Deep learning</a>
                </div>
              </details>

              <details>
                <summary><ChevronRight className="tree-chevron" size={13} /><Folder size={15} />DSA Practice</summary>
                <div className="tree-children">
                  <a href="/spaces/dsa/index.html" target="_blank" rel="noopener noreferrer"><FileText size={14} />My DSA Sheet</a>
                </div>
              </details>
            </div>
          </details>
        </nav>
      </aside>

      <main className="simple-main">
        <div className="content simple-content">
          <div className="page-heading simple-heading">
            <div>
              <h1>Study spaces</h1>
              <p>Your interview preparation and practice material in one place.</p>
            </div>
          </div>

          <UniversalSearch entries={searchIndex} />

          <section className="study-section" aria-label="Study spaces">
            <div className="study-grid">
              {studySpaces.map((space) => (
                <a
                  className="study-card"
                  key={space.href}
                  href={space.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="study-icon"><space.icon size={20} /></span>
                  <span className="study-card-copy">
                    <strong>{space.title}</strong>
                    <small>{space.description}</small>
                    <em>{space.meta}</em>
                  </span>
                  <ExternalLink className="study-open" size={16} />
                </a>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
