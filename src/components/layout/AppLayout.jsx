import { useCareMesh } from '../../context/useCareMesh';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { CreateModal } from '../forms/CreateModal';
import { EvidenceInspectorModal } from '../evidence/EvidenceInspectorModal';
import { DisputeModal } from '../evidence/DisputeModal';
import { AddObservationRelationModal } from '../evidence/AddObservationRelationModal';
import { ShareToSocialModal } from '../evidence/ShareToSocialModal';
import { PlanDetailModal } from '../plans/PlanDetailModal';
import { RevisePlanModal } from '../plans/RevisePlanModal';
import { EventDetailModal } from '../events/EventDetailModal';
import { CreateGroupModal } from '../social/CreateGroupModal';
import { InviteMembersModal } from '../social/InviteMembersModal';

export const AppLayout = ({ children }) => {
  const { 
    inspectedEntity, 
    closeInspector,
    selectedPlanDetail, 
    closePlanDetail,
    selectedEventChat,
    setSelectedEventChat
  } = useCareMesh();

  return (
    <div className="app-shell">
      {/* Sticky Header */}
      <Navbar />

      {/* Main Body */}
      <div className="app-body">
        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Dynamic Route Container */}
        <main className="app-main-content">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* Global Creation Modal */}
      <CreateModal />

      {/* First-Class Claim Dispute Modal */}
      <DisputeModal />

      {/* Supporting / Contradictory Observation Modal */}
      <AddObservationRelationModal />

      {/* Explicit Social Sharing Modal */}
      <ShareToSocialModal />

      {/* Facebook-style Group Modals */}
      <CreateGroupModal />
      <InviteMembersModal />

      {/* Proposal Revision Modal */}
      <RevisePlanModal />

      {/* Global Evidence / Provenance Inspector Modal */}
      {inspectedEntity && (
        <EvidenceInspectorModal
          isOpen={Boolean(inspectedEntity)}
          onClose={closeInspector}
          targetClaim={inspectedEntity.type === 'claim' ? inspectedEntity.entity : null}
          targetObservation={inspectedEntity.type === 'observation' || inspectedEntity.type === 'safety' ? inspectedEntity.entity : null}
        />
      )}

      {/* Global Long-Term Plan Detail Modal */}
      {selectedPlanDetail && (
        <PlanDetailModal
          isOpen={Boolean(selectedPlanDetail)}
          onClose={closePlanDetail}
          plan={selectedPlanDetail}
        />
      )}

      {/* Global Event & Chat Modal */}
      {selectedEventChat && (
        <EventDetailModal
          isOpen={Boolean(selectedEventChat)}
          onClose={() => setSelectedEventChat(null)}
          event={selectedEventChat}
        />
      )}
    </div>
  );
};
