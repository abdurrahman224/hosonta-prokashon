import AuthorCtaSection from './AuthorCtaSection'
import AboutPreviewSection from './AboutPreviewSection'
import AchievementsSection from './AchievementsSection'
import AuthorSection from './AuthorSection'
import BestSellersSection from './BestSellersSection'
import CategorySection from './CategorySection'
import HeroSection from './HeroSection'
import NewArrivalsSection from './NewArrivalsSection'
import NovelSection from './NovelSection'
import PoetrySection from './PoetrySection'
import StatisticsSection from './StatisticsSection'
import TestimonialsSection from './TestimonialsSection'
import SisterConcernsPage from './SisterConcernsPage'
import PartnersPage from './PartnersPage'

function Home() {
  return (
    <>
      <HeroSection />
      <CategorySection />
      <NewArrivalsSection />
      <BestSellersSection />
      <AuthorSection />
      <NovelSection />
      <PoetrySection />
      <SisterConcernsPage />
      <AuthorCtaSection />
      {/* <FeaturedBooksSection /> */}
      <TestimonialsSection />
      <PartnersPage />
      <AchievementsSection />
      <AboutPreviewSection />
      <StatisticsSection />

    </>
  );
}

export default Home
