import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CareMeshProvider } from './context/CareMeshContext';
import { AppLayout } from './components/layout/AppLayout';
import { EntityRouteWrapper } from './components/routing/EntityRouteWrapper';
import { LoadingSpinner } from './components/common/LoadingSpinner';

// Code-Split Views for Minimal Initial Bundle Size
const HomeView = lazy(() => import('./views/HomeView').then(m => ({ default: m.HomeView })));
const ExploreView = lazy(() => import('./views/ExploreView').then(m => ({ default: m.ExploreView })));
const CollaborateView = lazy(() => import('./views/CollaborateView').then(m => ({ default: m.CollaborateView })));
const PlansView = lazy(() => import('./views/PlansView').then(m => ({ default: m.PlansView })));
const SocialView = lazy(() => import('./views/SocialView').then(m => ({ default: m.SocialView })));
const ProfileView = lazy(() => import('./views/ProfileView').then(m => ({ default: m.ProfileView })));
const AdminGovernanceView = lazy(() => import('./views/AdminGovernanceView').then(m => ({ default: m.AdminGovernanceView })));

function App() {
  return (
    <BrowserRouter>
      <CareMeshProvider>
        <AppLayout>
          <Suspense fallback={<LoadingSpinner fullScreen message="Loading CareMesh view..." />}>
            <Routes>
            <Route path="/" element={<HomeView />} />
            <Route path="/explore" element={<ExploreView />} />
            <Route path="/collaborate" element={<CollaborateView />} />
            <Route path="/plans" element={<PlansView />} />
            <Route path="/social" element={<SocialView />} />
            <Route path="/social/:communityId" element={<SocialView />} />
            <Route path="/profile" element={<ProfileView />} />
            <Route path="/profile/:userId" element={<ProfileView />} />
            <Route path="/admin" element={<AdminGovernanceView />} />

            {/* Entity addressable routes for back/forward & deep linking */}
            <Route path="/observations/:id" element={<EntityRouteWrapper entityType="observation" />} />
            <Route path="/evidence/:id" element={<EntityRouteWrapper entityType="evidence" />} />
            <Route path="/claims/:id" element={<EntityRouteWrapper entityType="claim" />} />
            <Route path="/requests/:id" element={<EntityRouteWrapper entityType="request" />} />
            <Route path="/resources/:id" element={<EntityRouteWrapper entityType="resource" />} />
            <Route path="/plans/:id" element={<EntityRouteWrapper entityType="plan" />} />
            <Route path="/events/:id" element={<EntityRouteWrapper entityType="event" />} />
            <Route path="/safety/:id" element={<EntityRouteWrapper entityType="safety" />} />
            <Route path="/hazards/:id" element={<EntityRouteWrapper entityType="safety" />} />

            {/* Fallback */}
            <Route path="*" element={<HomeView />} />
          </Routes>
        </Suspense>
      </AppLayout>
      </CareMeshProvider>
    </BrowserRouter>
  );
}

export default App;
