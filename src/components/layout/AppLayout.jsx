import { useCareMesh } from '../../context/useCareMesh';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { CreateModal } from '../forms/CreateModal';
import { EvidenceInspectorModal } from '../evidence/EvidenceInspectorModal';
import { DisputeModal } from '../evidence/DisputeModal';
import { DisputeResponseModal } from '../evidence/DisputeResponseModal';
import { AddObservationRelationModal } from '../evidence/AddObservationRelationModal';
import { ShareToSocialModal } from '../evidence/ShareToSocialModal';
import { PlanDetailModal } from '../plans/PlanDetailModal';
import { RevisePlanModal } from '../plans/RevisePlanModal';
import { LogPlanOutcomeModal } from '../plans/LogPlanOutcomeModal';
import { EventDetailModal } from '../events/EventDetailModal';
import { CreateGroupModal } from '../social/CreateGroupModal';
import { InviteMembersModal } from '../social/InviteMembersModal';
import { AuthModal } from '../auth/AuthModal';
import { RequestDetailModal } from '../requests/RequestDetailModal';
import { ResourceDetailModal } from '../resources/ResourceDetailModal';
import { SafetyDetailModal } from '../evidence/SafetyDetailModal';
import { EvidenceDetailModal } from '../evidence/EvidenceDetailModal';
import { ReportModal } from '../modals/ReportModal';
import { PublicRecordsModerationModal } from '../moderation/PublicRecordsModerationModal';
import { ReadinessCheckerModal } from '../readiness/ReadinessCheckerModal';
import { RequestResourceUseModal } from '../resources/RequestResourceUseModal';
import { UserProfileModal } from '../profile/UserProfileModal';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { ToastContainer } from '../common/ToastContainer';

export const AppLayout = ({ children }) => {
  const { 
    inspectedEntity, 
    closeInspector,
    selectedPlanDetail, 
    closePlanDetail,
    selectedRequestDetail, 
    closeRequestDetail,
    selectedResourceDetail,
    closeResourceDetail,
    selectedSafetyDetail,
    closeSafetyDetail,
    logOutcomeModalTarget,
    closeLogOutcomeModal,
    selectedEventChat,
    setSelectedEventChat,
    selectedUserProfile,
    closeUserProfile
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
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* 1. Base Detail & Primary Modals (Tier 1: z-index 1000) */}
      <CreateModal />
      <CreateGroupModal />
      <PublicRecordsModerationModal />
      <ReadinessCheckerModal />

      {/* Global Long-Term Plan Detail Modal */}
      {selectedPlanDetail && (
        <PlanDetailModal
          isOpen={Boolean(selectedPlanDetail)}
          onClose={closePlanDetail}
          plan={selectedPlanDetail}
        />
      )}

      {/* Global Request Detail Modal */}
      {selectedRequestDetail && (
        <RequestDetailModal
          isOpen={Boolean(selectedRequestDetail)}
          onClose={closeRequestDetail}
          request={selectedRequestDetail}
        />
      )}

      {/* Global Resource Detail Modal */}
      {selectedResourceDetail && (
        <ResourceDetailModal
          isOpen={Boolean(selectedResourceDetail)}
          onClose={closeResourceDetail}
          resource={selectedResourceDetail}
        />
      )}

      {/* Global Safety Detail Modal */}
      {selectedSafetyDetail && (
        <SafetyDetailModal
          isOpen={Boolean(selectedSafetyDetail)}
          onClose={closeSafetyDetail}
          report={selectedSafetyDetail}
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

      {/* 2. Global Evidence & Provenance Inspector (Tier 2: z-index 1050) */}
      {inspectedEntity && (
        <EvidenceInspectorModal
          isOpen={Boolean(inspectedEntity)}
          onClose={closeInspector}
          targetClaim={inspectedEntity.type === 'claim' ? inspectedEntity.entity : null}
          targetObservation={inspectedEntity.type === 'observation' || inspectedEntity.type === 'safety' ? inspectedEntity.entity : null}
        />
      )}

      {/* Standalone Evidence & Sub-Evidence Detail Modal */}
      <EvidenceDetailModal />

      {/* 3. Child Action & Secondary Modals (Tier 3: z-index 1100 - always atop inspector & base modals) */}
      {/* First-Class Claim Dispute Modal */}
      <DisputeModal />

      {/* Dispute Response & Deliberation Modal */}
      <DisputeResponseModal />

      {/* Supporting / Contradictory Observation Modal */}
      <AddObservationRelationModal />

      {/* Explicit Social Sharing Modal */}
      <ShareToSocialModal />

      {/* Proposal Revision Modal */}
      <RevisePlanModal />

      {/* Global Plan Outcome & Results Evaluation Modal */}
      {logOutcomeModalTarget && (
        <LogPlanOutcomeModal
          isOpen={Boolean(logOutcomeModalTarget)}
          onClose={closeLogOutcomeModal}
          plan={logOutcomeModalTarget}
        />
      )}

      {/* Request Resource Use & Equipment Loan Modal */}
      <RequestResourceUseModal />

      {/* Group Member Invitation Modal */}
      <InviteMembersModal />

      {/* Profile Picture & Post Content Report Modal */}
      <ReportModal />

      {/* Neighbor User Profile Modal */}
      {selectedUserProfile && (
        <UserProfileModal
          isOpen={Boolean(selectedUserProfile)}
          onClose={closeUserProfile}
          user={selectedUserProfile}
        />
      )}

      {/* 4. Global Authentication Modal (Tier 4: z-index 1150) */}
      <AuthModal />

      {/* Accessible Non-Blocking Toast Notifications */}
      <ToastContainer />
    </div>
  );
};
