/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext.tsx';
import { Layout } from './components/Layout.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { ProductsOverviewPage, ProductDetailPage } from './pages/ProductsPages.tsx';
import { CustomersOverviewPage, CustomersPage } from './pages/CustomersPage.tsx';
import {
  AboutStoryPage,
  CareersPage,
  PlantLocationPage,
  WhyMyConcretePage,
} from './pages/AboutPages.tsx';
import {
  BlogDetailPage,
  BlogListPage,
  ContactPage,
  LegalPage,
  MediaPage,
  OwnerGuidePage,
  PartnerPage,
} from './pages/ContentPages.tsx';
import {
  BrickCalculatorPage,
  GradeHelperPage,
  PlantLocatorPage,
  VolumeCalculatorPage,
} from './pages/ToolsPages.tsx';
import { BookDeliveryPage } from './pages/BookDeliveryPage.tsx';
import { BookingConfirmationPage } from './pages/BookingConfirmationPage.tsx';
import { TrackBookingPage } from './pages/TrackBookingPage.tsx';
import { GetQuotePage, SiteVisitPage } from './pages/QuoteAndVisitPages.tsx';
import { AdminDashboardPage } from './pages/AdminDashboardPage.tsx';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <ScrollToTop />
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about/story" element={<AboutStoryPage />} />
            <Route path="/about/our-story" element={<AboutStoryPage />} />
            <Route path="/about/why-my-concrete" element={<WhyMyConcretePage />} />
            <Route path="/about/plant-location" element={<PlantLocationPage />} />
            <Route path="/about/careers" element={<CareersPage />} />

            <Route path="/customers" element={<CustomersOverviewPage />} />
            <Route path="/customers/:segment" element={<CustomersPage />} />

            <Route path="/products" element={<ProductsOverviewPage />} />
            <Route path="/products/:slug" element={<ProductDetailPage />} />

            <Route path="/partner" element={<PartnerPage />} />
            <Route path="/media" element={<MediaPage />} />
            <Route path="/gallery" element={<MediaPage />} />
            <Route path="/blog" element={<BlogListPage />} />
            <Route path="/blog/:slug" element={<BlogDetailPage />} />
            <Route path="/contact" element={<ContactPage />} />

            <Route path="/tools/calculator" element={<VolumeCalculatorPage />} />
            <Route path="/tools/brick-calculator" element={<BrickCalculatorPage />} />
            <Route path="/tools/grade-helper" element={<GradeHelperPage />} />
            <Route path="/tools/plant-locator" element={<PlantLocatorPage />} />

            <Route path="/book" element={<BookDeliveryPage />} />
            <Route path="/booking/:bookingCode" element={<BookingConfirmationPage />} />
            <Route path="/track" element={<TrackBookingPage />} />
            <Route path="/quote" element={<GetQuotePage />} />
            <Route path="/site-visit" element={<SiteVisitPage />} />

            <Route path="/privacy" element={<LegalPage kind="privacy" />} />
            <Route path="/disclaimer" element={<LegalPage kind="disclaimer" />} />
            <Route path="/owner-guide" element={<OwnerGuidePage />} />

            <Route path="/admin/login" element={<AdminDashboardPage mode="login" />} />
            <Route path="/admin/users" element={<AdminDashboardPage initialTab="users" />} />
            <Route path="/admin/locations" element={<AdminDashboardPage initialTab="locations" />} />
            <Route path="/admin/settings" element={<AdminDashboardPage initialTab="settings" />} />
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="*" element={<HomePage />} />
          </Routes>
        </Layout>
      </AppProvider>
    </BrowserRouter>
  );
}
