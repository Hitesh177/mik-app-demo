import { useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowRight, BookOpen, CalendarDays, ShoppingBag, Sparkles, Tag, UtensilsCrossed } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BottomNav from '../components/BottomNav';
import ProductCard from '../components/ProductCard';
import SeoHead from '../components/SeoHead';
import { useAdmin } from '../context/AdminContext';
import { BLOG_POSTS, getBlogPost } from '../data/blogPosts';

function BlogCard({ post }) {
  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group block rounded-3xl border border-gray-100 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 overflow-hidden"
    >
      <div className={`bg-gradient-to-br ${post.accentFrom} ${post.accentTo} text-white p-5`}>
        <div className="flex items-start justify-between gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center text-2xl">{post.emoji}</div>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/15">{post.readTime}</span>
        </div>
        <h3 className="mt-4 text-xl font-black leading-tight whitespace-pre-line">{post.title}</h3>
        <p className="mt-2 text-sm text-white/80 line-clamp-3">{post.description}</p>
      </div>
      <div className="p-5">
        <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-gray-500">
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2.5 py-1">
            <Sparkles size={12} />
            {post.tag}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2.5 py-1">
            <Tag size={12} />
            Taiwan SEO
          </span>
        </div>
        <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-green-700">
          Read guide <ArrowRight size={14} />
        </div>
      </div>
    </Link>
  );
}

function LinkPill({ to, children, accent = 'green' }) {
  const colorClasses = accent === 'amber'
    ? 'border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100 hover:border-amber-300'
    : accent === 'blue'
    ? 'border-blue-200 bg-blue-50 text-blue-900 hover:bg-blue-100 hover:border-blue-300'
    : 'border-green-200 bg-green-50 text-green-900 hover:bg-green-100 hover:border-green-300';
  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-medium transition-colors ${colorClasses}`}
    >
      {children}
    </Link>
  );
}

function SectionBlock({ section }) {
  return (
    <section className="rounded-3xl border border-gray-100 bg-white p-5 sm:p-6 shadow-sm">
      <h2 className="text-xl font-bold text-gray-900">{section.heading}</h2>
      <div className="mt-3 space-y-3 text-sm leading-7 text-gray-600">
        {section.paragraphs?.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
      {section.bullets?.length ? (
        <ul className="mt-4 grid gap-2">
          {section.bullets.map((bullet, index) => (
            <li key={index} className="flex items-start gap-2 rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-700">
              <UtensilsCrossed size={14} className="mt-0.5 flex-shrink-0 text-green-600" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function PostView({ post, products, relatedPosts, searchValue, setSearchValue }) {
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const canonical = siteUrl ? `${siteUrl}/blog/${post.slug}` : undefined;
  const featuredProducts = post.featuredProductIds
    .map(id => products.find(product => String(product.id) === String(id) || String(product.seo_slug || '').toLowerCase() === String(id).toLowerCase()))
    .filter(Boolean);

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.description,
      url: canonical,
      inLanguage: 'en-TW',
      author: { '@type': 'Organization', name: 'MIK Store' },
      publisher: { '@type': 'Organization', name: 'MIK Store' },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl || undefined },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: siteUrl ? `${siteUrl}/blog` : undefined },
        { '@type': 'ListItem', position: 3, name: post.title, item: canonical },
      ],
    },
  ];

  return (
    <>
      <SeoHead
        title={post.title}
        description={post.description}
        canonical={canonical}
        keywords={post.keywords}
        jsonLd={jsonLd}
        ogType="article"
      />

      <Header onSearchChange={setSearchValue} searchValue={searchValue} searchIndex={products} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 pb-28">
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-5">
          <Link to="/" className="hover:text-gray-700 transition-colors">Home</Link>
          <span>/</span>
          <Link to="/blog" className="hover:text-gray-700 transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-gray-600 truncate">{post.title}</span>
        </nav>

        <section className={`rounded-[2rem] bg-gradient-to-br ${post.accentFrom} ${post.accentTo} text-white p-6 sm:p-8 shadow-xl`}>
          <div className="flex items-start justify-between gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center text-3xl flex-shrink-0">
              {post.emoji}
            </div>
            <div className="flex flex-wrap justify-end gap-2 text-[11px] font-semibold">
              <span className="rounded-full bg-white/15 px-2.5 py-1">{post.tag}</span>
              <span className="rounded-full bg-white/15 px-2.5 py-1 inline-flex items-center gap-1">
                <CalendarDays size={12} />
                {post.readTime}
              </span>
            </div>
          </div>

          <h1 className="mt-5 text-3xl sm:text-4xl lg:text-5xl font-black leading-tight whitespace-pre-line max-w-4xl">
            {post.title}
          </h1>
          <p className="mt-4 text-base sm:text-lg text-white/85 max-w-4xl leading-7">
            {post.heroLead}
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {post.shopLinks.map(link => (
              <LinkPill key={link.href} to={link.href} accent="amber">
                <ShoppingBag size={14} />
                {link.label}
              </LinkPill>
            ))}
            <LinkPill to="/categories" accent="blue">
              <Sparkles size={14} />
              Browse all categories
            </LinkPill>
          </div>
        </section>

        <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-6 mt-6">
          <article className="space-y-6">
            <section className="rounded-3xl border border-gray-100 bg-white p-5 sm:p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-green-700">Why this guide exists</p>
              <p className="mt-3 text-sm sm:text-base leading-7 text-gray-700">
                {post.intro}
              </p>
            </section>

            {post.sections.map(section => (
              <SectionBlock key={section.heading} section={section} />
            ))}

            <section className="rounded-3xl border border-gray-100 bg-white p-5 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-green-700">Shop this guide</p>
                  <h2 className="text-xl font-bold text-gray-900 mt-1">{post.ctaTitle}</h2>
                </div>
                <Link to="/" className="text-sm font-semibold text-green-700 hover:text-green-800 inline-flex items-center gap-1">
                  Shop now <ArrowRight size={14} />
                </Link>
              </div>
              <p className="mt-3 text-sm leading-7 text-gray-600">{post.ctaText}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {post.shopLinks.map(link => (
                  <LinkPill key={link.href} to={link.href}>
                    {link.label}
                  </LinkPill>
                ))}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Featured products</p>
                  <h2 className="text-xl font-bold text-gray-900">Buy the items mentioned in this guide</h2>
                </div>
              </div>

              {featuredProducts.length === 0 ? (
                <div className="rounded-3xl border border-gray-100 bg-white p-6 text-sm text-gray-500">
                  No matching products were found in the catalog yet.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                  {featuredProducts.map(product => (
                    <ProductCard key={product.id} product={product} compact />
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-gray-100 bg-white p-5 sm:p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">FAQ</p>
              <div className="mt-4 space-y-3">
                {post.faqs.map(faq => (
                  <div key={faq.q} className="rounded-2xl bg-gray-50 p-4">
                    <h3 className="font-semibold text-gray-900">{faq.q}</h3>
                    <p className="mt-1 text-sm leading-7 text-gray-600">{faq.a}</p>
                  </div>
                ))}
              </div>
            </section>
          </article>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-gray-100 bg-white p-5 sm:p-6 shadow-sm lg:sticky lg:top-24">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Quick links</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {post.shopLinks.map(link => (
                  <LinkPill key={link.href} to={link.href}>
                    {link.label}
                  </LinkPill>
                ))}
              </div>

              <div className="mt-5 rounded-2xl bg-green-50 p-4">
                <p className="text-sm font-semibold text-green-800">Why shoppers like this page</p>
                <p className="mt-2 text-sm leading-7 text-green-900/80">
                  It answers the search intent, shows the exact grocery items, and gives you direct shopping paths without making you search again.
                </p>
              </div>
            </section>

            <section className="rounded-3xl border border-gray-100 bg-white p-5 sm:p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Related guides</p>
              <div className="mt-4 grid gap-3">
                {relatedPosts.map(related => (
                  <Link
                    key={related.slug}
                    to={`/blog/${related.slug}`}
                    className="group rounded-2xl border border-gray-100 p-4 hover:border-green-200 hover:bg-green-50 transition-colors"
                  >
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-green-800">{related.title}</p>
                    <p className="mt-1 text-xs text-gray-500 line-clamp-2">{related.description}</p>
                  </Link>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </main>

      <Footer />
      <BottomNav active="home" />
    </>
  );
}

function BlogIndex({ products, searchValue, setSearchValue }) {
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const description = 'SEO-rich Indian grocery guides for Taiwan shoppers, including herbs, students, families, nomads, and tourism-focused shopping.';
  const featured = BLOG_POSTS.slice(0, 3);

  return (
    <>
      <SeoHead
        title="MIK Store Blog | Indian Grocery Guides for Taiwan"
        description={description}
        canonical={siteUrl ? `${siteUrl}/blog` : undefined}
        keywords="Indian grocery blog Taiwan, herb shopping Taiwan, students in Taiwan, family grocery Taiwan, nomads Taiwan, tourism Taiwan snacks"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'MIK Store Blog',
          description,
          url: siteUrl ? `${siteUrl}/blog` : undefined,
        }}
        ogType="website"
      />

      <Header onSearchChange={setSearchValue} searchValue={searchValue} searchIndex={products} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 pb-28">
        <section className="rounded-[2rem] bg-gradient-to-br from-slate-900 via-green-800 to-emerald-600 text-white p-6 sm:p-8 shadow-xl">
          <div className="flex items-center gap-2 text-white/80 text-sm font-medium">
            <BookOpen size={16} />
            SEO guides + shopping help
          </div>
          <h1 className="mt-4 text-3xl sm:text-4xl font-black leading-tight max-w-3xl">
            Indian grocery guides built for Taiwan shoppers
          </h1>
          <p className="mt-4 text-white/85 max-w-3xl leading-7">
            Read guides for fresh herbs, student baskets, family meal planning, nomad pantries, and tourism-friendly snacks.
            Every page links straight to the live shopping experience.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <LinkPill to="/categories" accent="amber">
              Browse categories
            </LinkPill>
            <LinkPill to="/" accent="blue">
              Shop home
            </LinkPill>
          </div>
        </section>

        <section className="mt-8">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Featured guides</p>
              <h2 className="text-2xl font-bold text-gray-900">Start with the pages that match real search intent</h2>
            </div>
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {featured.map(post => <BlogCard key={post.slug} post={post} />)}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-gray-100 bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-green-100 text-green-700 flex items-center justify-center flex-shrink-0">
              <Tag size={18} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Popular topics</h2>
              <p className="text-sm text-gray-600 mt-1">These guides are designed to win long-tail searches and move users directly into shopping.</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {BLOG_POSTS.map(post => (
              <Link
                key={post.slug}
                to={`/blog/${post.slug}`}
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 hover:border-green-300 hover:bg-green-50 hover:text-green-700 transition-colors"
              >
                <CalendarDays size={14} />
                {post.title}
              </Link>
            ))}
          </div>
        </section>
      </main>

      <Footer />
      <BottomNav active="home" />
    </>
  );
}

export default function BlogPage() {
  const { slug } = useParams();
  const { products } = useAdmin();
  const [searchValue, setSearchValue] = useState('');

  const post = slug ? getBlogPost(slug) : null;
  const relatedPosts = useMemo(() => {
    if (!post) return BLOG_POSTS.slice(0, 3);
    return post.relatedSlugs
      .map(relatedSlug => getBlogPost(relatedSlug))
      .filter(Boolean)
      .slice(0, 3);
  }, [post]);

  if (slug && !post) {
    return <Navigate to="/blog" replace />;
  }

  if (post) {
    return <PostView post={post} products={products} relatedPosts={relatedPosts} searchValue={searchValue} setSearchValue={setSearchValue} />;
  }

  return <BlogIndex products={products} searchValue={searchValue} setSearchValue={setSearchValue} />;
}
