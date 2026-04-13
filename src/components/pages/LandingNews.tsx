import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import LandingLayout from '../layout/LandingLayout';
import './LandingNews.css';

interface NewsPost {
  slug: string;
  title: string;
  date: string;
  body: string;
}

function parseFrontmatter(raw: string): { title: string; date: string; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { title: '', date: '', body: raw };
  const meta = match[1];
  const body = match[2].trim();
  const titleMatch = meta.match(/^title:\s*(.+)$/m);
  const dateMatch = meta.match(/^date:\s*(.+)$/m);
  return {
    title: titleMatch ? titleMatch[1].trim() : '',
    date: dateMatch ? dateMatch[1].trim() : '',
    body,
  };
}

const modules = import.meta.glob<string>('../../content/news/*.md', {
  query: '?raw',
  import: 'default',
});

const LandingNews: React.FC = () => {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const results: NewsPost[] = [];
      for (const [path, loader] of Object.entries(modules)) {
        const raw = await loader();
        const slug = path.replace(/^.*\/(.+)\.md$/, '$1');
        const { title, date, body } = parseFrontmatter(raw);
        results.push({ slug, title, date, body });
      }
      results.sort((a, b) => b.date.localeCompare(a.date));
      setPosts(results);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <LandingLayout>
      <section className="ln__hero">
        <div className="ln__hero-inner">
          <div className="ln__label">Updates</div>
          <h1 className="ln__title">What's New</h1>
          <p className="ln__subtitle">News, releases, and announcements from Pantheon.</p>
        </div>
      </section>

      <section className="ln__posts">
        <div className="ln__posts-inner">
          {loading && <div className="ln__loading">Loading...</div>}
          {!loading && posts.length === 0 && (
            <div className="ln__empty">No posts yet. Check back soon.</div>
          )}
          {posts.map(post => (
            <article key={post.slug} className="ln__post">
              <div className="ln__post-meta">
                <time className="ln__post-date">{new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
              </div>
              <h2 className="ln__post-title">{post.title}</h2>
              <div className="ln__post-body">
                <ReactMarkdown>{post.body}</ReactMarkdown>
              </div>
            </article>
          ))}
        </div>
      </section>
    </LandingLayout>
  );
};

export default LandingNews;
