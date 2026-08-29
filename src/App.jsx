import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CareMeshProvider } from './context/CareMeshContext';
import { AppLayout } from './components/layout/AppLayout';
import { EntityRouteWrapper } from './components/routing/EntityRouteWrapper';

// Views
import { HomeView } from './views/HomeView';
import { ExploreView } from './views/ExploreView';
import { CollaborateView } from './views/CollaborateView';
import { PlansView } from './views/PlansView';
import { SocialView } from './views/SocialView';
import { ProfileView } from './views/ProfileView';

function App() {
  return (
    <BrowserRouter>
      <CareMeshProvider>
        <AppLayout>
          <Routes>
            <Route path="/" element={<HomeView />} />
            <Route path="/explore" element={<ExploreView />} />
            <Route path="/collaborate" element={<CollaborateView />} />
            <Route path="/plans" element={<PlansView />} />
            <Route path="/social" element={<SocialView />} />
            <Route path="/profile" element={<ProfileView />} />

            {/* Entity addressable routes for back/forward & deep linking */}
            <Route path="/observations/:id" element={<EntityRouteWrapper entityType="observation" />} />
            <Route path="/claims/:id" element={<EntityRouteWrapper entityType="claim" />} />
            <Route path="/requests/:id" element={<EntityRouteWrapper entityType="request" />} />
            <Route path="/resources/:id" element={<EntityRouteWrapper entityType="resource" />} />
            <Route path="/plans/:id" element={<EntityRouteWrapper entityType="plan" />} />
            <Route path="/events/:id" element={<EntityRouteWrapper entityType="event" />} />

            {/* Fallback */}
            <Route path="*" element={<HomeView />} />
          </Routes>
        </AppLayout>
      </CareMeshProvider>
    </BrowserRouter>
  );
}

export default App;
