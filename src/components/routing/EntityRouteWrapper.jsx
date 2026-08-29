import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useCareMesh } from '../../context/useCareMesh';
import { HomeView } from '../../views/HomeView';
import { ExploreView } from '../../views/ExploreView';
import { CollaborateView } from '../../views/CollaborateView';
import { PlansView } from '../../views/PlansView';

export const EntityRouteWrapper = ({ entityType }) => {
  const { id } = useParams();
  const { 
    observations, 
    claims, 
    requests, 
    resources, 
    plans, 
    events, 
    inspectEntity, 
    viewPlanDetail, 
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
      }
    } else if (entityType === 'resource') {
      const res = resources.find(r => r.id === id);
      if (res) {
        setCurrentView('collaborate');
        setCurrentSubTab('resources');
        setHighlightedEntityId(id);
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
        setCurrentView('home');
        setSelectedEventChat(evt);
      }
    }
  }, [id, entityType, observations, claims, requests, resources, plans, events, inspectEntity, viewPlanDetail, setSelectedEventChat, setCurrentSubTab, setHighlightedEntityId, setCurrentView]);

  if (entityType === 'observation' || entityType === 'claim') {
    return <ExploreView />;
  }
  if (entityType === 'request' || entityType === 'resource') {
    return <CollaborateView />;
  }
  if (entityType === 'plan') {
    return <PlansView />;
  }
  return <HomeView />;
};
