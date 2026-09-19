import { useEffect, lazy } from 'react';
import { useParams } from 'react-router-dom';
import { useCareMesh } from '../../context/useCareMesh';

const HomeView = lazy(() => import('../../views/HomeView').then(m => ({ default: m.HomeView })));
const ExploreView = lazy(() => import('../../views/ExploreView').then(m => ({ default: m.ExploreView })));
const CollaborateView = lazy(() => import('../../views/CollaborateView').then(m => ({ default: m.CollaborateView })));
const PlansView = lazy(() => import('../../views/PlansView').then(m => ({ default: m.PlansView })));

export const EntityRouteWrapper = ({ entityType }) => {
  const { id } = useParams();
  const { 
    observations, 
    claims, 
    requests, 
    resources, 
    plans, 
    events, 
    evidence = [],
    safetyReports = [],
    inspectEntity, 
    viewPlanDetail, 
    viewRequestDetail,
    viewResourceDetail,
    viewEvidenceDetail,
    viewSafetyDetail,
    setSelectedEventChat, 
    setCurrentSubTab, 
    setHighlightedEntityId,
    setCurrentView
  } = useCareMesh();

  useEffect(() => {
    if (!id) return;

    if (entityType === 'observation') {
      const obs = observations.find(o => o.id === id);
      if (obs) {
        setCurrentView('explore');
        inspectEntity(obs, 'observation');
      }
    } else if (entityType === 'evidence') {
      const ev = evidence.find(e => e.id === id);
      if (ev) {
        setCurrentView('explore');
        viewEvidenceDetail(ev);
      }
    } else if (entityType === 'claim') {
      const clm = claims.find(c => c.id === id);
      if (clm) {
        setCurrentView('explore');
        inspectEntity(clm, 'claim');
      }
    } else if (entityType === 'request') {
      const req = requests.find(r => r.id === id);
      if (req) {
        setCurrentView('collaborate');
        setCurrentSubTab('requests');
        setHighlightedEntityId(id);
        viewRequestDetail(req);
      }
    } else if (entityType === 'resource') {
      const res = resources.find(r => r.id === id);
      if (res) {
        setCurrentView('collaborate');
        setCurrentSubTab('resources');
        setHighlightedEntityId(id);
        viewResourceDetail(res);
      }
    } else if (entityType === 'plan') {
      const pln = plans.find(p => p.id === id);
      if (pln) {
        setCurrentView('plans');
        viewPlanDetail(pln);
      }
    } else if (entityType === 'event') {
      const evt = events.find(e => e.id === id);
      if (evt) {
        setCurrentView('collaborate');
        setCurrentSubTab('events');
        setHighlightedEntityId(id);
        setSelectedEventChat(evt);
      }
    } else if (entityType === 'safety') {
      const safe = safetyReports.find(s => s.id === id);
      if (safe) {
        setCurrentView('explore');
        setHighlightedEntityId(id);
        viewSafetyDetail(safe);
      }
    }
  }, [id, entityType, observations, claims, requests, resources, plans, events, evidence, safetyReports, inspectEntity, viewPlanDetail, viewRequestDetail, viewResourceDetail, viewEvidenceDetail, viewSafetyDetail, setSelectedEventChat, setCurrentSubTab, setHighlightedEntityId, setCurrentView]);

  if (entityType === 'observation' || entityType === 'claim' || entityType === 'evidence' || entityType === 'safety') {
    return <ExploreView />;
  }
  if (entityType === 'request' || entityType === 'resource' || entityType === 'event') {
    return <CollaborateView />;
  }
  if (entityType === 'plan') {
    return <PlansView />;
  }
  return <HomeView />;
};
