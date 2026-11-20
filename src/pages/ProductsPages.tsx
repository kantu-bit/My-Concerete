import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, ChevronDown } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { useDocumentMeta } from '../utils/seo.ts';
import { VisualPlate } from '../components/VisualPlate.tsx';

export function ProductsOverviewPage() {
  const { data } = useApp();
  const products = (data?.products || []).filter((p) => p.isOffered);

  useDocumentMeta({
    title: 'Ready-Mix Concrete (M5–M40+) & Cement Bricks | MY CONCRETE',
    description:
      'Explore Ready-Mix Concrete grades M5 to M40+, Specialty Mixes, Cement Bricks & Solid Blocks (4", 6", 8"), and 24/7 Concrete Pump Hire in Ranebennur & Davangere.',
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-16 space-y-10">
      <div className="max-w-3xl space-y-3">
        <p className="text-xs font-semibold text-[#D92B25]">
          All Ready Mix Concrete &amp; Cement Bricks
        </p>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-[#0F1F5C] dark:text-white">
          Ready-Mix Concrete &amp; Cement Bricks
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          Precision-proportioned RMC mixes (M5 to M40+) and machine-pressed cement bricks/blocks dispatched 24 hours from our Kotihal unit near Ranebennur across Ranebennur and Davangere.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {products.map((p) => (
          <div key={p.slug} className="warm-card overflow-hidden flex flex-col justify-between">
            <div>
              <div className="h-48">
                <VisualPlate
                  imageUrl={p.imageUrl}
                  variant={p.unitType === 'pieces' ? 'bricks' : 'product-mix'}
                  title={p.name}
                  subtitle={p.category}
                />
              </div>
              <div className="p-6 space-y-2.5">
                <p className="text-xs font-semibold text-[#1F3FA8] dark:text-[#FFC93C]">
                  {p.category} · {p.grades.length} Options · {p.unitType === 'pieces' ? 'Unit: Pieces' : 'Unit: m³'}
                </p>
                <h2 className="font-display font-bold text-xl text-[#0F1F5C] dark:text-white">
                  {p.name}
                </h2>
                <p className="text-sm text-[var(--muted)] leading-relaxed">{p.tagline}</p>
              </div>
            </div>
            <div className="px-6 pb-6 pt-2 flex items-center justify-between gap-3">
              <Link
                to={`/products/${p.slug}`}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1F3FA8] dark:text-[#FFC93C] hover:underline"
              >
                <span>View Specifications</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to={`/book?product=${p.slug}`} className="btn-orange-pill px-5 py-2 text-xs">
                Book {p.unitType === 'pieces' ? 'Bricks' : 'Mix'}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data } = useApp();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const product = data?.products.find((p) => p.slug === slug);

  useDocumentMeta({
    title: product
      ? `${product.name} | MY CONCRETE Ranebennur & Davangere`
      : 'Product Details | MY CONCRETE',
    description: product?.tagline || 'Ready-Mix Concrete and Cement Bricks specifications.',
    jsonLd: product
      ? [
          {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.name,
            description: product.overview,
            category: product.category,
            brand: {
              '@type': 'Brand',
              name: 'MY CONCRETE',
            },
          },
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: product.faqs.map((f) => ({
              '@type': 'Question',
              name: f.q,
              acceptedAnswer: {
                '@type': 'Answer',
                text: f.a,
              },
            })),
          },
        ]
      : undefined,
  });

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="font-display font-bold text-2xl">Product Not Found</h1>
        <p className="text-sm text-[var(--muted)]">
          The requested product could not be found or is currently disabled.
        </p>
        <Link to="/products" className="btn-orange-pill px-5 py-2.5 text-sm">
          Browse All Products
        </Link>
      </div>
    );
  }

  const isPieces = product.unitType === 'pieces';
  const unitLabel = isPieces ? 'piece' : 'm³';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-16 space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-7 flex flex-col justify-center space-y-5">
          <p className="text-xs font-semibold text-[#D92B25]">
            {product.category} · {product.isOffered ? 'Available 24/7 for Dispatch' : 'On Special Request'}
          </p>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-[#0F1F5C] dark:text-white">
            {product.name}
          </h1>
          <p className="text-base text-[var(--muted)] leading-relaxed">{product.overview}</p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link to={`/book?product=${product.slug}`} className="btn-orange-pill px-6 py-2.5 text-sm">
              Book Delivery
            </Link>
            <Link
              to={`/quote?product=${encodeURIComponent(product.name)}`}
              className="rounded-full border-2 border-[#1F3FA8] dark:border-[#FFC93C] px-6 py-2.5 text-sm font-semibold text-[#1F3FA8] dark:text-[#FFC93C] hover:bg-[var(--bg-soft)]"
            >
              Get Quote
            </Link>
            <Link
              to={isPieces ? '/tools/brick-calculator' : '/tools/calculator'}
              className="rounded-full border border-[#D7E4FF] dark:border-[#264096] px-5 py-2.5 text-sm font-semibold hover:border-[#D92B25]"
            >
              {isPieces ? 'Open Brick Calculator' : 'Open Volume Calculator'}
            </Link>
          </div>
        </div>

        <div className="lg:col-span-5 min-h-[260px] rounded-[20px] overflow-hidden border border-[#D7E4FF] dark:border-[#264096] shadow-lg">
          <VisualPlate
            imageUrl={product.imageUrl}
            variant={isPieces ? 'bricks' : 'product-mix'}
            title={product.name}
            subtitle={product.category}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="warm-card p-6 space-y-4">
          <h2 className="font-display font-bold text-xl text-[#0F1F5C] dark:text-white">
            Key Performance Properties
          </h2>
          <ul className="space-y-2.5 text-sm text-[var(--muted)]">
            {product.properties.map((prop, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A] mt-0.5 shrink-0" />
                <span>{prop}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="warm-card p-6 space-y-4">
          <h2 className="font-display font-bold text-xl text-[#0F1F5C] dark:text-white">
            Typical Structural &amp; Site Uses
          </h2>
          <ul className="space-y-2.5 text-sm text-[var(--muted)]">
            {product.uses.map((u, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#D92B25] mt-0.5 shrink-0" />
                <span>{u}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="warm-card overflow-hidden">
        <div className="p-6 border-b border-[#D7E4FF] dark:border-[#264096]">
          <h2 className="font-display font-bold text-xl text-[#0F1F5C] dark:text-white">
            Available {isPieces ? 'Sizes' : 'Grades'} &amp; Indicative Rates
          </h2>
          <p className="text-xs text-[var(--muted)]">
            Rates shown only when set in Admin; otherwise contact our Kotihal desk or request a quote. Final prices are confirmed by the MY CONCRETE team.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[var(--bg)] text-xs text-[var(--muted)] border-b border-[#D7E4FF] dark:border-[#264096]">
              <tr>
                <th className="px-6 py-3 font-semibold">{isPieces ? 'Size / Block' : 'Grade / Service'}</th>
                <th className="px-6 py-3 font-semibold">{isPieces ? 'Application' : '28-Day Target'}</th>
                <th className="px-6 py-3 font-semibold">{isPieces ? 'Unit' : 'Slump / Flow'}</th>
                <th className="px-6 py-3 font-semibold">{isPieces ? 'Material' : 'Max Aggregate'}</th>
                <th className="px-6 py-3 font-semibold text-right">Indicative Rate (INR/{unitLabel})</th>
                <th className="px-6 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D7E4FF] dark:divide-[#264096]">
              {product.grades.map((g) => (
                <tr key={g.grade} className="hover:bg-[var(--bg)]/60">
                  <td className="px-6 py-3.5 font-semibold text-[#0F1F5C] dark:text-white">{g.grade}</td>
                  <td className="px-6 py-3.5 tabular-nums text-[var(--muted)]">{g.strength}</td>
                  <td className="px-6 py-3.5 tabular-nums text-[var(--muted)]">{g.slump}</td>
                  <td className="px-6 py-3.5 tabular-nums text-[var(--muted)]">{g.maxAgg}</td>
                  <td className="px-6 py-3.5 text-right font-mono tabular-nums font-semibold">
                    {Number(g.indicativeRate) > 0
                      ? `₹${Number(g.indicativeRate).toLocaleString('en-IN')}`
                      : 'On Request'}
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <Link
                      to={`/book?product=${product.slug}&grade=${encodeURIComponent(g.grade)}`}
                      className="text-xs font-semibold text-[#D92B25] hover:underline"
                    >
                      Book
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {product.faqs.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-display font-bold text-2xl text-[#0F1F5C] dark:text-white">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {product.faqs.map((faq, idx) => (
              <div key={idx} className="warm-card overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left font-semibold text-[#0F1F5C] dark:text-white"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#D92B25] transition-transform ${openFaq === idx ? 'rotate-180' : ''}`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-4 text-sm text-[var(--muted)] leading-relaxed border-t border-[#D7E4FF] dark:border-[#264096] pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
