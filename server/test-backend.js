import assert from 'assert';
import { db } from './db/database.js';
import { resetRateLimits } from './middleware/rateLimiter.js';

const BASE_URL = 'http://localhost:3001/api';

async function runTests() {
  resetRateLimits();
  db.prepare("DELETE FROM communities WHERE id LIKE 'com_priv_%' OR handle LIKE '%privwatch%'").run();
  db.prepare("UPDATE users SET is_public_moderator = 0 WHERE id != 'usr_caleb' AND email != 'caleb.zothansanga@gmail.com'").run();
  console.log('🧪 Starting CareMesh Backend Verification Test Suite...\n');

  // 1. Health Check
  console.log('1. Testing Health Endpoint (/api/health)...');
  const healthRes = await fetch(`${BASE_URL}/health`);
  assert.strictEqual(healthRes.status, 200, 'Health check should return 200');
  const healthData = await healthRes.json();
  assert.strictEqual(healthData.status, 'ok');
  console.log('   ✓ Health check passed.\n');

  // 2. Bootstrap State
  console.log('2. Testing Bootstrap Aggregator (/api/bootstrap)...');
  const bootRes = await fetch(`${BASE_URL}/bootstrap`);
  assert.strictEqual(bootRes.status, 200, 'Bootstrap should return 200');
  const bootData = await bootRes.json();
  assert(bootData.currentUser, 'Should contain currentUser');
  assert(bootData.plans.length > 0, 'Should contain plans');
  assert(bootData.observations.length > 0, 'Should contain observations');
  assert(bootData.matchingFactors.length > 0, 'Should contain matching factors');
  console.log(`   ✓ Bootstrap delivered ${bootData.plans.length} plans, ${bootData.observations.length} observations, ${bootData.matchingFactors.length} match evaluations.\n`);

  // 3. Auth & System Administrator Verification
  console.log('3. Testing Authentication & System Administrator Elevation (/api/auth)...');
  const loginAs = async (login, password = 'password123') => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password })
    });
    if (!res.ok) throw new Error(`loginAs failed for ${login} with status ${res.status}`);
    return await res.json();
  };

  // Login as Maya Lin
  const loginData = await loginAs('@mayalin');
  assert(loginData.token, 'Should return JWT token');
  assert.strictEqual(loginData.user.handle, '@mayalin');

  const token = loginData.token;
  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // Verify Caleb Zothansanga System Administrator auto-elevation
  const calebData = await loginAs('caleb.zothansanga@gmail.com');
  assert(calebData.token, 'Should return JWT token for System Admin');
  assert.strictEqual(calebData.user.email, 'caleb.zothansanga@gmail.com');
  assert.strictEqual(calebData.user.role, 'System Administrator');
  assert.strictEqual(Boolean(calebData.user.isPublicModerator), true);
  const calebHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${calebData.token}`
  };

  // Verify deprecated/insecure demo switch-user endpoint is removed (returns 404)
  const deprecatedSwitchRes = await fetch(`${BASE_URL}/auth/switch-user`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'usr_priya' })
  });
  assert.strictEqual(deprecatedSwitchRes.status, 404, 'switch-user endpoint must be removed');

  const flushServerRateLimits = async () => {
    await fetch(`${BASE_URL}/admin/antispam/reset-client`, {
      method: 'POST',
      headers: calebHeaders,
      body: JSON.stringify({ clientId: 'all' })
    });
  };
  await flushServerRateLimits();
  console.log('   ✓ Authentication, Caleb System Admin elevation, and switch-user removal verified.\n');

  // 4. Observations & Evidence
  console.log('4. Testing Observations & Provenance Evidence Creation...');
  // Create evidence
  const evRes = await fetch(`${BASE_URL}/evidence`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'Water Sensor Telemetry (EC 450 uS/cm)',
      type: 'measurement',
      description: 'Stream conductivity calibrated with in-situ multi-parameter probe.',
      provenanceChain: [{ step: 'Sample calibrated at sensor node #3', time: '12:00 PM' }]
    })
  });
  assert.strictEqual(evRes.status, 201);
  const evData = await evRes.json();
  assert(evData.id.startsWith('ev_'));

  // Create observation linking evidence
  const obsRes = await fetch(`${BASE_URL}/observations`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'Sudden Conductivity Spike at River Bend Inlet',
      category: 'environmental',
      description: 'Electrolytic conductivity rose from 120 to 450 uS/cm over 40 minutes.',
      location: { address: 'River Bend Inlet, Maplewood', lat: 37.7815, lng: -122.4250 },
      evidenceIds: [evData.id],
      claimText: 'Agricultural runoff pump discharge is active along the east creek bank.'
    })
  });
  assert.strictEqual(obsRes.status, 201);
  const obsData = await obsRes.json();
  assert.strictEqual(obsData.title, 'Sudden Conductivity Spike at River Bend Inlet');
  assert(obsData.claimIds.length > 0, 'Should have attached claim');
  console.log('   ✓ Observation and evidence registered.\n');

  // 5. Claims & Non-destructive Disputes
  console.log('5. Testing Non-Destructive Claim Challenge & Disputes...');
  const claimId = obsData.claimIds[0];
  const disputeRes = await fetch(`${BASE_URL}/disputes`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      claimId,
      reason: 'The interpretation is incorrect',
      explanation: 'Conductivity rise is caused by municipal water main flushing upstream, not agricultural runoff.',
      counterEvidenceIds: [evData.id]
    })
  });
  assert.strictEqual(disputeRes.status, 201);
  const disputeData = await disputeRes.json();
  assert.strictEqual(disputeData.claimId, claimId);

  // Test 5b: Support a Dispute (Deliberation Thread)
  const supRespRes = await fetch(`${BASE_URL}/disputes/${disputeData.id}/responses`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      type: 'support',
      reason: 'Additional sensor/field data confirms this challenge',
      explanation: 'Upstream turbidity telemetry corroborates clean chlorinated flush rather than fertilizer chemicals.',
      evidenceIds: [evData.id]
    })
  });
  assert.strictEqual(supRespRes.status, 201, 'Should create supporting response to dispute');
  const supRespData = await supRespRes.json();
  assert.strictEqual(supRespData.type, 'support');
  assert.strictEqual(supRespData.disputeId, disputeData.id);

  // Test 5c: Challenge / Rebut a Dispute
  const rebRespRes = await fetch(`${BASE_URL}/disputes/${disputeData.id}/responses`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      type: 'challenge',
      reason: 'The dispute relies on outdated information',
      explanation: 'Municipal flushing ended at 8:00 AM; the conductivity spike persisted at 11:30 AM.',
      evidenceIds: []
    })
  });
  assert.strictEqual(rebRespRes.status, 201, 'Should create rebuttal response to dispute');
  const rebRespData = await rebRespRes.json();
  assert.strictEqual(rebRespData.type, 'challenge');

  // Verify dispute returns both responses
  const allDisputesRes = await fetch(`${BASE_URL}/disputes`);
  const allDisputes = await allDisputesRes.json();
  const fetchedDispute = allDisputes.find(d => d.id === disputeData.id);
  assert(fetchedDispute, 'Dispute should exist in list');
  assert.strictEqual(fetchedDispute.responses.length, 2, 'Dispute should contain 2 deliberation responses');
  assert.strictEqual(fetchedDispute.responses[0].type, 'support');
  assert.strictEqual(fetchedDispute.responses[1].type, 'challenge');

  // Verify claim status transitioned to 'disputed'
  const claimRes = await fetch(`${BASE_URL}/claims/${claimId}`);
  const claimData = await claimRes.json();
  assert.strictEqual(claimData.status, 'disputed', 'Claim status should be disputed');
  assert(claimData.disputeIds.includes(disputeData.id), 'Claim should reference dispute without losing original assertion text');
  console.log('   ✓ Non-destructive dispute recorded, supported, and rebutted in deliberation thread.\n');

  // 6. Long-Term Plan Lifecycle, Critiques, Revisions, and Outcomes -> Learning Pipeline
  console.log('6. Testing Long-Term Plan Lifecycle, Revisions, and Outcomes...');
  // Create Plan
  const planRes = await fetch(`${BASE_URL}/plans`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'East Maplewood Rain Garden Network Phase 1',
      problemStatement: 'Storm runoff floods low-lying residential alleys during heavy rain events.',
      desiredOutcome: 'Construct 6 modular bioretention rain gardens absorbing 50,000 gallons per rainstorm.',
      proposedApproach: 'Excavate 3ft gravel beds with native sedges, dogwoods, and overflow french drains.',
      goals: ['Absorb 50,000 gallons runoff', 'Involve 40 neighborhood volunteers']
    })
  });
  assert.strictEqual(planRes.status, 201);
  const planData = await planRes.json();
  const testPlanId = planData.id;

  // Add critique feedback
  const fbRes = await fetch(`${BASE_URL}/plans/${testPlanId}/feedback`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      type: 'risk',
      text: 'Potential clay subsoil saturation could slow percolation rates.',
      suggestedChange: 'Add perforated PVC underdrain to connect to city storm manifold.'
    })
  });
  assert.strictEqual(fbRes.status, 201);
  const fbPlan = await fbRes.json();
  assert(fbPlan.feedback.length > 0);
  const fbId = fbPlan.feedback[0].id;

  // Publish Revision v1.1 adopting critique
  const revRes = await fetch(`${BASE_URL}/plans/${testPlanId}/revisions`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      version: 'v1.1',
      summaryOfChanges: 'Added perforated underdrains to address clay subsoil drainage risk.',
      reasoningForChanges: 'Ensures infiltration even in high-clay soil strata.',
      incorporatedFeedbackIds: [fbId],
      updatedProposedApproach: 'Excavate 3ft gravel beds with native sedges and perforated PVC underdrain manifold.',
      decisionTitle: 'Approved underdrain manifold inclusion in v1.1',
      decisionRationale: 'Prevents standing water during torrential storm surges.'
    })
  });
  assert.strictEqual(revRes.status, 200);
  const revPlan = await revRes.json();
  assert.strictEqual(revPlan.currentVersion, 'v1.1');
  assert.strictEqual(revPlan.lifecycleStage, 'revised');
  assert.strictEqual(revPlan.feedback[0].status, 'adopted');
  assert(revPlan.decisions.length > 0, 'Decision log should record revision');

  // Advance to active stage
  await fetch(`${BASE_URL}/plans/${testPlanId}/stage`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({ lifecycleStage: 'active', overallStatus: 'in_progress' })
  });

  // Complete Plan with Structured Outcome Evaluation
  const outcomeRes = await fetch(`${BASE_URL}/plans/${testPlanId}/outcome`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      goal: 'Construct 6 modular bioretention rain gardens absorbing 50,000 gallons per rainstorm.',
      actualResults: [
        '6 rain gardens fully constructed and planted',
        '58,000 gallons absorbed during October storm',
        'Zero residential alley flooding recorded'
      ],
      outcomeStatus: 'achieved',
      evidenceTypes: ['Field observation', 'Measurements', 'Photos/documents'],
      unexpectedEffects: 'Sedge root growth exceeded expectations, requiring spring division.',
      lessons: 'Pre-testing infiltration rate in dry vs wet weather is essential before sizing underdrains.',
      guidanceForFuture: 'Always install cleanout risers on both ends of perforated underdrain manifolds.'
    })
  });
  assert.strictEqual(outcomeRes.status, 200);
  const completedPlan = await outcomeRes.json();
  assert.strictEqual(completedPlan.lifecycleStage, 'completed');
  assert.strictEqual(completedPlan.outcomeReport.outcomeStatus, 'achieved');
  assert.strictEqual(completedPlan.outcomeReport.actualResults.length, 3);
  console.log('   ✓ Plan Lifecycle, Feedback Adoption, Decisions, and Structured Outcomes verified.\n');

  // 7. Institutional Learning & Future Guidance Search Pipeline
  console.log('7. Testing Outcomes -> Lessons -> Future Guidance Discovery Pipeline...');
  const learnRes = await fetch(`${BASE_URL}/learning/search?q=underdrain`);
  assert.strictEqual(learnRes.status, 200);
  const learnData = await learnRes.json();
  assert(learnData.length > 0, 'Should discover guidance for future projects');
  assert(learnData[0].recommendationText.includes('cleanout risers'), 'Guidance text should match recorded institutional advice');
  console.log(`   ✓ Discovered institutional guidance: "${learnData[0].recommendationText}" from source plan "${learnData[0].sourcePlan?.title}".\n`);

  // Cleanup test plan and its learning pipeline records to prevent duplicate accumulation
  const delPlanRes = await fetch(`${BASE_URL}/plans/${testPlanId}`, {
    method: 'DELETE',
    headers: authHeaders
  });
  assert.strictEqual(delPlanRes.status, 200, 'Test plan deletion should return 200');
  const delPlanData = await delPlanRes.json();
  assert.strictEqual(delPlanData.success, true);
  console.log('   ✓ Test plan and cascade associations cleanly deleted after verification.\n');

  // 8. Transparent Resource Matcher
  console.log('8. Testing Transparent Resource Matcher & Explainable Factors...');
  const matchRes = await fetch(`${BASE_URL}/matcher/evaluations`);
  assert.strictEqual(matchRes.status, 200);
  const matches = await matchRes.json();
  assert(matches.length > 0, 'Should return calculated match evaluations');

  const topMatch = matches[0];
  assert(topMatch.factors.length >= 3, 'Match should contain transparent factors breakdown');
  assert(topMatch.summaryExplanation, 'Match should provide human-readable summary explanation');
  console.log(`   ✓ Match evaluation calculated: ${topMatch.requestTitle} <-> ${topMatch.resourceTitle}`);
  console.log(`     Status: ${topMatch.status}`);
  console.log(`     Factors: ${topMatch.factors.map(f => `[${f.status.toUpperCase()}] ${f.label}`).join(', ')}`);
  console.log(`     Explanation: "${topMatch.summaryExplanation}"\n`);

  // 8b. Testing Match Community Endorsements / Voting
  console.log('8b. Testing Match Community Endorsements / Voting...');
  const endorseRes1 = await fetch(`${BASE_URL}/matcher/endorse`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ matchId: topMatch.id })
  });
  assert.strictEqual(endorseRes1.status, 200);
  const endorseData1 = await endorseRes1.json();
  assert.strictEqual(endorseData1.success, true);
  assert.strictEqual(endorseData1.endorsed, true);
  assert(endorseData1.endorsements.includes(loginData.user.id));
  console.log(`   ✓ Match endorsed by neighbor. New count: ${endorseData1.endorsementCount}`);

  // Toggle off endorsement
  const endorseRes2 = await fetch(`${BASE_URL}/matcher/endorse`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ matchId: topMatch.id })
  });
  assert.strictEqual(endorseRes2.status, 200);
  const endorseData2 = await endorseRes2.json();
  assert.strictEqual(endorseData2.endorsed, false);
  console.log('   ✓ Match endorsement toggle-off verified.\n');

  // 9. Match vs Persistent Assignment with Moderator Gate
  console.log('9. Testing Persistent Resource Assignment (Gated to Admin/Moderator/Owner)...');
  const origRequestRow = db.prepare('SELECT status, progress_percentage, requester_id FROM requests WHERE id = ?').get(topMatch.requestId);

  // Unprivileged user who is not requester, provider, or moderator should be rejected with 403
  // Login as a test unprivileged neighbor (Marcus)
  const unprivData = await loginAs('usr_marcus');
  const unprivHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${unprivData.token}`
  };
  const unauthorizedAssignRes = await fetch(`${BASE_URL}/matcher/assign`, {
    method: 'POST',
    headers: unprivHeaders,
    body: JSON.stringify({
      requestId: topMatch.requestId,
      resourceId: topMatch.resourceId,
      notes: 'Unauthorized third party attempt'
    })
  });
  assert.strictEqual(unauthorizedAssignRes.status, 403, 'Unauthorized third party must receive 403 Forbidden');
  console.log('   ✓ Unauthorized third-party assign attempt correctly blocked with 403 Forbidden.');

  // Authorized assignment by Caleb Zothansanga (System Administrator)
  const assignRes = await fetch(`${BASE_URL}/matcher/assign`, {
    method: 'POST',
    headers: calebHeaders,
    body: JSON.stringify({
      requestId: topMatch.requestId,
      resourceId: topMatch.resourceId,
      notes: 'Human coordinator confirmed deployment schedule with Dave and Priya.'
    })
  });
  assert.strictEqual(assignRes.status, 201);
  const assignData = await assignRes.json();
  assert.strictEqual(assignData.success, true);
  assert.strictEqual(assignData.assignment.status, 'accepted');

  // Clean up test assignment and revert request status to original state
  db.prepare('DELETE FROM resource_assignments WHERE id = ?').run(assignData.assignment.id);
  if (origRequestRow) {
    db.prepare('UPDATE requests SET status = ?, progress_percentage = ? WHERE id = ?').run(
      origRequestRow.status,
      origRequestRow.progress_percentage,
      topMatch.requestId
    );
  }

  console.log('   ✓ Persistent resource assignment authorized and created by System Administrator.\n');

  // 10. Social Circles & Polls
  console.log('10. Testing Communities, Posts & Poll Voting...');
  const comRes = await fetch(`${BASE_URL}/communities`);
  const communities = await comRes.json();
  assert(communities.length > 0);
  const targetComm = communities.find(c => c.id === 'com_01') || communities[0];

  const postRes = await fetch(`${BASE_URL}/communities/feed/posts`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      communityId: targetComm.id,
      content: 'Volunteer reminder: Bring water bottles to Saturday morning rain garden maintenance!',
      poll: {
        question: 'Will you need a ride from downtown?',
        options: ['Yes, need ride', 'No, driving myself']
      }
    })
  });
  assert.strictEqual(postRes.status, 201);
  const postData = await postRes.json();
  assert(postData.poll);

  // Vote in poll
  const voteRes = await fetch(`${BASE_URL}/communities/feed/posts/${postData.id}/poll/vote`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ optionId: postData.poll.options[0].id })
  });
  assert.strictEqual(voteRes.status, 200);
  const votedPost = await voteRes.json();
  assert.strictEqual(votedPost.poll.options[0].votes, 1);

  // Community Admin Banner & Avatar Photo Upload
  const patchCommRes = await fetch(`${BASE_URL}/communities/com_01`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({
      banner: 'https://images.unsplash.com/photo-custom-banner',
      avatar: 'https://images.unsplash.com/photo-custom-avatar'
    })
  });
  assert.strictEqual(patchCommRes.status, 200, 'Admin community update should succeed');
  const patchedComm = await patchCommRes.json();
  assert.strictEqual(patchedComm.banner, 'https://images.unsplash.com/photo-custom-banner');
  assert.strictEqual(patchedComm.avatar, 'https://images.unsplash.com/photo-custom-avatar');

  // Community Field Photo Upload to Media Gallery
  const mediaRes = await fetch(`${BASE_URL}/communities/com_01/media`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      url: 'https://images.unsplash.com/photo-field-sample',
      title: 'Culvert Inspection Photo'
    })
  });
  assert.strictEqual(mediaRes.status, 201, 'Upload media should return 201');
  const mediaData = await mediaRes.json();
  assert.strictEqual(mediaData.title, 'Culvert Inspection Photo');

  console.log('   ✓ Community post, poll, admin cover/avatar upload, and media gallery verified.\n');

  // 11. Owner Edit & Delete for Posts, Comments, Requests, Resources, Observations, and Events
  console.log('11. Testing Owner Edit & Delete across all post types...');

  // 11a. Post Edit & Delete
  const editPostRes = await fetch(`${BASE_URL}/communities/feed/posts/${postData.id}`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({ content: 'Updated content: Bring extra reusable gloves too!' })
  });
  assert.strictEqual(editPostRes.status, 200, 'Edit post should return 200');
  const editedPost = await editPostRes.json();
  assert.strictEqual(editedPost.content, 'Updated content: Bring extra reusable gloves too!');

  // Add a comment to edit & delete
  const commentRes = await fetch(`${BASE_URL}/communities/feed/posts/${postData.id}/comments`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ text: 'I can bring 5 pairs of gloves!' })
  });
  assert.strictEqual(commentRes.status, 201, 'Add comment should return 201');
  const commentPost = await commentRes.json();
  const addedComment = commentPost.comments[commentPost.comments.length - 1];

  // Edit comment
  const editCommentRes = await fetch(`${BASE_URL}/communities/feed/posts/${postData.id}/comments/${addedComment.id}`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({ text: 'I can bring 10 pairs of gloves instead!' })
  });
  assert.strictEqual(editCommentRes.status, 200, 'Edit comment should return 200');
  const editedCommentPost = await editCommentRes.json();
  const updatedComment = editedCommentPost.comments.find(c => c.id === addedComment.id);
  assert.strictEqual(updatedComment.text, 'I can bring 10 pairs of gloves instead!');

  // Delete comment
  const delCommentRes = await fetch(`${BASE_URL}/communities/feed/posts/${postData.id}/comments/${addedComment.id}`, {
    method: 'DELETE',
    headers: authHeaders
  });
  assert.strictEqual(delCommentRes.status, 200, 'Delete comment should return 200');

  // Delete post
  const delPostRes = await fetch(`${BASE_URL}/communities/feed/posts/${postData.id}`, {
    method: 'DELETE',
    headers: authHeaders
  });
  assert.strictEqual(delPostRes.status, 200, 'Delete post should return 200');
  console.log('   ✓ Feed post & comment edit and delete verified.');
  await flushServerRateLimits();

  // 11b. Request Edit & Delete
  const newReqRes = await fetch(`${BASE_URL}/requests`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'Need sandbags for driveway barrier',
      category: 'supplies',
      urgency: 'high',
      description: 'Need 10 sandbags to prevent garage flooding.',
      location: { address: '742 Evergreen Terr', lat: 37.77, lng: -122.42 },
      peopleNeeded: 2,
      requiredSkills: ['Heavy Lifting']
    })
  });
  assert.strictEqual(newReqRes.status, 201);
  const createdReq = await newReqRes.json();

  const editReqRes = await fetch(`${BASE_URL}/requests/${createdReq.id}`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'Need sandbags and gravel bags for driveway',
      urgency: 'urgent',
      peopleNeeded: 4
    })
  });
  assert.strictEqual(editReqRes.status, 200);
  const updatedReq = await editReqRes.json();
  assert.strictEqual(updatedReq.title, 'Need sandbags and gravel bags for driveway');
  assert.strictEqual(updatedReq.urgency, 'urgent');
  assert.strictEqual(updatedReq.peopleNeeded, 4);

  const delReqRes = await fetch(`${BASE_URL}/requests/${createdReq.id}`, {
    method: 'DELETE',
    headers: authHeaders
  });
  assert.strictEqual(delReqRes.status, 200);
  console.log('   ✓ Request edit and delete verified.');

  // 11c. Resource Edit & Delete
  const newResRes = await fetch(`${BASE_URL}/resources`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'Submersible Water Sump Pump',
      category: 'equipment',
      contributionType: 'lend',
      availability: 'immediate',
      quantity: 1,
      description: '1/2 HP pump with 50ft discharge hose.',
      location: { address: '100 Main St', lat: 37.77, lng: -122.42 }
    })
  });
  assert.strictEqual(newResRes.status, 201);
  const createdRes = await newResRes.json();

  const editResRes = await fetch(`${BASE_URL}/resources/${createdRes.id}`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'Submersible Water Sump Pump + 100ft Hose',
      quantity: 2,
      condition: 'Excellent'
    })
  });
  assert.strictEqual(editResRes.status, 200);
  const updatedRes = await editResRes.json();
  assert.strictEqual(updatedRes.title, 'Submersible Water Sump Pump + 100ft Hose');
  assert.strictEqual(Number(updatedRes.quantity), 2);

  const delResRes = await fetch(`${BASE_URL}/resources/${createdRes.id}`, {
    method: 'DELETE',
    headers: authHeaders
  });
  assert.strictEqual(delResRes.status, 200);
  console.log('   ✓ Resource edit and delete verified.');
  await flushServerRateLimits();

  // 11d. Observation Edit & Delete
  const editObsRes = await fetch(`${BASE_URL}/observations/${obsData.id}`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'Conductivity Spike and Turbid Plume at Inlet',
      category: 'hazard'
    })
  });
  assert.strictEqual(editObsRes.status, 200);
  const updatedObs = await editObsRes.json();
  assert.strictEqual(updatedObs.title, 'Conductivity Spike and Turbid Plume at Inlet');
  assert.strictEqual(updatedObs.category, 'hazard');

  const delObsRes = await fetch(`${BASE_URL}/observations/${obsData.id}`, {
    method: 'DELETE',
    headers: authHeaders
  });
  assert.strictEqual(delObsRes.status, 200);
  console.log('   ✓ Observation edit and delete verified.');

  // 11e. Project/Event Edit & Delete
  const newProjRes = await fetch(`${BASE_URL}/projects`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'Stream Cleanup Day',
      eventType: 'clean_up',
      description: 'Meet at bridge for debris clearing.',
      date: 'Next Saturday',
      time: '9:00 AM - 12:00 PM',
      maxParticipants: 15
    })
  });
  assert.strictEqual(newProjRes.status, 201);
  const createdProj = await newProjRes.json();

  const editProjRes = await fetch(`${BASE_URL}/projects/${createdProj.id}`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'Stream Cleanup & Planting Day',
      maxParticipants: 25
    })
  });
  assert.strictEqual(editProjRes.status, 200);
  const updatedProj = await editProjRes.json();
  assert.strictEqual(updatedProj.title, 'Stream Cleanup & Planting Day');
  assert.strictEqual(updatedProj.maxParticipants, 25);

  const delProjRes = await fetch(`${BASE_URL}/projects/${createdProj.id}`, {
    method: 'DELETE',
    headers: authHeaders
  });
  assert.strictEqual(delProjRes.status, 200);
  console.log('   ✓ Event / Project edit and delete verified.\n');

  // 12. Kicking, Moderator Separation, Elections, Reports & Readiness
  await flushServerRateLimits();
  console.log('12. Testing Moderation, Member Kicking, Elections & Readiness Checker...');

  // 12a. Post-level Kick / Restriction
  const testPostRes = await fetch(`${BASE_URL}/communities/feed/posts`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      content: 'Moderation test post for thread restriction check',
      communityId: 'com_01'
    })
  });
  assert.strictEqual(testPostRes.status, 201);
  const testPost = await testPostRes.json();

  // Add comment by target user
  await fetch(`${BASE_URL}/communities/feed/posts/${testPost.id}/comments`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ text: 'Disruptive comment to be purged', userId: 'usr_dave' })
  });

  // Post author kicks target user from post
  const kickPostRes = await fetch(`${BASE_URL}/communities/feed/posts/${testPost.id}/kick-user`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ targetUserId: 'usr_dave' })
  });
  assert.strictEqual(kickPostRes.status, 200);
  const kickPostData = await kickPostRes.json();
  assert(kickPostData.restrictedUserIds.includes('usr_dave'));
  assert.strictEqual(kickPostData.comments.filter(c => c.author?.id === 'usr_dave').length, 0);

  // Verify restricted user cannot comment anymore
  const blockedCommentRes = await fetch(`${BASE_URL}/communities/feed/posts/${testPost.id}/comments`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ text: 'Blocked comment attempt', userId: 'usr_dave' })
  });
  assert.strictEqual(blockedCommentRes.status, 403, 'Restricted user should get 403 Forbidden');
  console.log('   ✓ Post creator user kick & commenting restriction verified.');

  // 12b. Community Member Kick
  const kickMemberRes = await fetch(`${BASE_URL}/communities/com_01/kick`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ userId: 'usr_kick_test' })
  });
  assert.strictEqual(kickMemberRes.status, 200);
  console.log('   ✓ Community-level member kick verified.');

  // 12c. Moderator Elections
  db.prepare("DELETE FROM moderator_elections WHERE community_id = 'com_01' AND candidate_id = 'usr_elena'").run();
  db.prepare("UPDATE community_members SET role = 'member' WHERE community_id = 'com_01' AND user_id = 'usr_elena'").run();

  const nomRes = await fetch(`${BASE_URL}/communities/com_01/elections/nominate`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ candidateId: 'usr_elena' })
  });
  assert.strictEqual(nomRes.status, 201);
  const election = await nomRes.json();
  assert.strictEqual(election.candidateId, 'usr_elena');

  // Cast vote
  const electionVoteRes = await fetch(`${BASE_URL}/communities/com_01/elections/${election.id}/vote`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ vote: 'yes' })
  });
  assert.strictEqual(electionVoteRes.status, 200);

  // Appoint as moderator
  const appointRes = await fetch(`${BASE_URL}/communities/com_01/elections/${election.id}/appoint`, {
    method: 'POST',
    headers: authHeaders
  });
  assert.strictEqual(appointRes.status, 200);
  const appointedElection = await appointRes.json();
  assert.strictEqual(appointedElection.status, 'passed');
  console.log('   ✓ Democratic community moderator nomination, voting & appointment verified.');

  // 12d. Public Records Moderator Toggle (Guarded by System Admin)
  const toggleModRes = await fetch(`${BASE_URL}/admin/users/usr_dave/toggle-public-moderator`, {
    method: 'POST',
    headers: calebHeaders,
    body: JSON.stringify({ isPublicModerator: true, reason: 'Promoted by System Admin Caleb for public community stewardship' })
  });
  assert.strictEqual(toggleModRes.status, 200);
  const toggleModData = await toggleModRes.json();
  assert.strictEqual(Boolean(toggleModData.isPublicModerator), true);

  // Non-system admin (Maya) attempting toggle receives 403
  const nonAdminToggleRes = await fetch(`${BASE_URL}/admin/users/usr_dave/toggle-public-moderator`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ isPublicModerator: false })
  });
  assert.strictEqual(nonAdminToggleRes.status, 403, 'Non-system admin must be forbidden from toggling public moderator');
  console.log('   ✓ Public Records Moderator role toggle and RBAC security guard verified.');

  // 12e. Reports & Moderation Queue
  const daveData12 = await loginAs('usr_dave');
  const daveHeaders12 = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${daveData12.token}`
  };

  // Post report (Dave reports Maya's test post)
  const reportPostRes = await fetch(`${BASE_URL}/reports`, {
    method: 'POST',
    headers: daveHeaders12,
    body: JSON.stringify({
      targetType: 'post',
      targetId: testPost.id,
      reason: 'inappropriate',
      notes: 'Contains unverified claims during emergency response.',
      scope: 'community',
      communityId: 'com_01'
    })
  });
  assert.strictEqual(reportPostRes.status, 201);
  const reportPostData = await reportPostRes.json();
  assert.strictEqual(reportPostData.status, 'pending');

  // User avatar report (Dave reports Maya's avatar)
  const reportAvatarRes = await fetch(`${BASE_URL}/reports`, {
    method: 'POST',
    headers: daveHeaders12,
    body: JSON.stringify({
      targetType: 'user_avatar',
      targetId: 'usr_me',
      reason: 'harassment',
      notes: 'Testing avatar reporting queue',
      scope: 'public'
    })
  });
  assert.strictEqual(reportAvatarRes.status, 201);
  const reportAvatarData = await reportAvatarRes.json();
  assert.strictEqual(reportAvatarData.status, 'pending');

  // Resolve post report (Community Moderator / Admin resolves)
  const resolvePostRes = await fetch(`${BASE_URL}/reports/${reportPostData.id}`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({
      status: 'resolved',
      actionTaken: 'quarantined',
      resolutionNotes: 'Post moved to moderation review queue'
    })
  });
  assert.strictEqual(resolvePostRes.status, 200);

  // Resolve avatar report (Public Moderator / Admin resolves)
  const resolveAvatarRes = await fetch(`${BASE_URL}/reports/${reportAvatarData.id}`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({
      status: 'resolved',
      actionTaken: 'dismissed',
      resolutionNotes: 'Reset avatar to safe default placeholder'
    })
  });
  assert.strictEqual(resolveAvatarRes.status, 200);
  console.log('   ✓ Post and Profile Picture reports & moderation resolutions verified.');

  // 12f. Member Readiness Checker with Request Linkage
  const createCheckRes = await fetch(`${BASE_URL}/readiness`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'Emergency Watershed Repair Shift',
      requestId: 'req_01',
      communityId: 'com_01',
      shiftTime: 'Tomorrow 9:00 AM',
      targetHeadcount: 4,
      notes: 'Bring waterproof boots'
    })
  });
  assert.strictEqual(createCheckRes.status, 201);
  const readinessCheck = await createCheckRes.json();
  assert.strictEqual(readinessCheck.title, 'Emergency Watershed Repair Shift');
  assert.strictEqual(readinessCheck.requestId, 'req_01');

  // Fetch readiness checks filtered by requestId
  const getByReqRes = await fetch(`${BASE_URL}/readiness?requestId=req_01`, {
    headers: authHeaders
  });
  assert.strictEqual(getByReqRes.status, 200);
  const reqChecks = await getByReqRes.json();
  assert(reqChecks.some(rc => rc.id === readinessCheck.id), 'Should find readiness check for req_01');

  // Member responds: Ready with 4 hours
  const respondCheckRes = await fetch(`${BASE_URL}/readiness/${readinessCheck.id}/respond`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      status: 'ready',
      hoursAvailable: 4,
      gearNotes: 'Bringing heavy boots & first aid kit'
    })
  });
  assert.strictEqual(respondCheckRes.status, 200);
  const updatedCheck = await respondCheckRes.json();
  assert.strictEqual(updatedCheck.readyCount, 1);
  assert.strictEqual(updatedCheck.readyPercentage, 25);

  // Close readiness check
  const closeCheckRes = await fetch(`${BASE_URL}/readiness/${readinessCheck.id}/close`, {
    method: 'POST',
    headers: authHeaders
  });
  assert.strictEqual(closeCheckRes.status, 200);
  const closedCheck = await closeCheckRes.json();
  assert.strictEqual(closedCheck.status, 'closed');
  console.log('   ✓ Member Readiness Checker request linkage, responses, and closing verified.\n');

  // 13. Testing Lending & Equipment Loan Lifecycle
  console.log('13. Testing Lending & Equipment Loan Lifecycle (Request Use, Approval, Custody, Return)...');
  db.prepare("DELETE FROM resource_assignments WHERE resource_id = 'res_01'").run();
  
  // 13a. Submit loan request (verify provider self-borrow rejected, borrower usr_elena accepted)
  const selfBorrowRes = await fetch(`${BASE_URL}/resources/res_01/request-use`, {
    method: 'POST',
    headers: daveHeaders12, // Dave is provider of res_01
    body: JSON.stringify({
      borrowerId: 'usr_dave',
      purpose: 'Borrowing own pump'
    })
  });
  assert.strictEqual(selfBorrowRes.status, 400);

  const elenaData = await loginAs('usr_elena');
  const elenaHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${elenaData.token}`
  };

  const loanReqRes = await fetch(`${BASE_URL}/resources/res_01/request-use`, {
    method: 'POST',
    headers: elenaHeaders,
    body: JSON.stringify({
      purpose: 'Clearing ditch along North 4th Street',
      startDate: '2026-09-06',
      dueDate: '2026-09-10',
      requestedQuantity: '1 unit',
      notes: '[Will Pick Up] Bringing trailer',
      termsAccepted: true
    })
  });
  assert.strictEqual(loanReqRes.status, 201);
  const loanReqData = await loanReqRes.json();
  assert.strictEqual(loanReqData.success, true);
  assert.strictEqual(loanReqData.assignment.status, 'proposed');
  assert.strictEqual(loanReqData.assignment.borrowerId, 'usr_elena');
  assert.strictEqual(loanReqData.resource.loanStatus, 'pending_approval');
  console.log('   ✓ Loan request submission & pending status verified.');

  // 13b. Provider approves loan
  const approveLoanRes = await fetch(`${BASE_URL}/resources/assignments/${loanReqData.assignment.id}/status`, {
    method: 'PATCH',
    headers: daveHeaders12,
    body: JSON.stringify({
      status: 'accepted',
      notes: 'Approved. Pickup at Maplewood Yard.'
    })
  });
  assert.strictEqual(approveLoanRes.status, 200);
  const approvedData = await approveLoanRes.json();
  assert.strictEqual(approvedData.assignment.status, 'accepted');
  assert.strictEqual(approvedData.resource.loanStatus, 'on_loan');
  assert.ok(approvedData.resource.activeLoan);
  assert.strictEqual(approvedData.resource.activeLoan.id, loanReqData.assignment.id);
  console.log('   ✓ Provider loan approval & on_loan custody state verified.');

  // 13c. Borrower marks in-transit / returned
  const inTransitRes = await fetch(`${BASE_URL}/resources/assignments/${loanReqData.assignment.id}/status`, {
    method: 'PATCH',
    headers: elenaHeaders,
    body: JSON.stringify({
      status: 'in_transit',
      notes: 'Dropped off at yard gate.'
    })
  });
  assert.strictEqual(inTransitRes.status, 200);
  const inTransitData = await inTransitRes.json();
  assert.strictEqual(inTransitData.assignment.status, 'in_transit');
  console.log('   ✓ Borrower return notification (in_transit) verified.');

  // 13d. Provider confirms return & condition
  const completeLoanRes = await fetch(`${BASE_URL}/resources/assignments/${loanReqData.assignment.id}/status`, {
    method: 'PATCH',
    headers: daveHeaders12,
    body: JSON.stringify({
      status: 'completed',
      returnCondition: 'Good / Cleaned',
      notes: 'Returned in excellent shape.'
    })
  });
  assert.strictEqual(completeLoanRes.status, 200);
  const completedData = await completeLoanRes.json();
  assert.strictEqual(completedData.assignment.status, 'completed');
  assert.strictEqual(completedData.resource.loanStatus, 'available');
  assert.strictEqual(completedData.resource.activeLoan, null);
  assert.ok(completedData.resource.loanHistory.some(h => h.id === loanReqData.assignment.id));
  console.log('   ✓ Return confirmation, condition logging & restoration to available verified.\n');

  // 14. Testing Pagination for Large Datasets (LIMIT, OFFSET, Metadata & Backward Compatibility)
  console.log('14. Testing Pagination for Large Datasets (LIMIT, OFFSET, Metadata & Backward Compatibility)...');

  // 14a. Paginated observations: Page 1
  const obsPage1Res = await fetch(`${BASE_URL}/observations?page=1&limit=2`);
  assert.strictEqual(obsPage1Res.status, 200);
  const obsPage1 = await obsPage1Res.json();
  assert.ok(obsPage1.pagination, 'Should have pagination metadata');
  assert.strictEqual(obsPage1.pagination.page, 1);
  assert.strictEqual(obsPage1.pagination.limit, 2);
  assert.ok(obsPage1.pagination.total >= 5, 'Total should be at least 5 observations');
  assert.strictEqual(obsPage1.pagination.hasNext, true);
  assert.strictEqual(obsPage1.pagination.hasPrev, false);
  assert.strictEqual(obsPage1.data.length, 2);

  // 14b. Paginated observations: Page 2
  const obsPage2Res = await fetch(`${BASE_URL}/observations?page=2&limit=2`);
  assert.strictEqual(obsPage2Res.status, 200);
  const obsPage2 = await obsPage2Res.json();
  assert.strictEqual(obsPage2.pagination.page, 2);
  assert.strictEqual(obsPage2.pagination.limit, 2);
  assert.strictEqual(obsPage2.pagination.hasPrev, true);
  assert.strictEqual(obsPage2.data.length, 2);
  assert.notStrictEqual(obsPage1.data[0].id, obsPage2.data[0].id, 'Page 1 and Page 2 should contain different records');
  console.log('   ✓ Observation pagination (page 1 & 2 slicing, navigation metadata) verified.');

  // 14c. Paginated requests
  const reqPaginatedRes = await fetch(`${BASE_URL}/requests?page=1&limit=3`);
  assert.strictEqual(reqPaginatedRes.status, 200);
  const reqPaginated = await reqPaginatedRes.json();
  assert.ok(reqPaginated.pagination);
  assert.strictEqual(reqPaginated.pagination.limit, 3);
  assert.ok(reqPaginated.data.length <= 3);
  console.log('   ✓ Request pagination verified.');

  // 14d. Paginated resources
  const resPaginatedRes = await fetch(`${BASE_URL}/resources?page=1&limit=3`);
  assert.strictEqual(resPaginatedRes.status, 200);
  const resPaginated = await resPaginatedRes.json();
  assert.ok(resPaginated.pagination);
  assert.strictEqual(resPaginated.pagination.limit, 3);
  assert.ok(resPaginated.data.length <= 3);
  console.log('   ✓ Resource directory pagination verified.');

  // 14e. Paginated safety alerts & projects
  const safePaginatedRes = await fetch(`${BASE_URL}/safety?page=1&limit=2`);
  assert.strictEqual(safePaginatedRes.status, 200);
  const safePaginated = await safePaginatedRes.json();
  assert.ok(safePaginated.pagination);
  assert.strictEqual(safePaginated.pagination.limit, 2);

  const projPaginatedRes = await fetch(`${BASE_URL}/projects?page=1&limit=2`);
  assert.strictEqual(projPaginatedRes.status, 200);
  const projPaginated = await projPaginatedRes.json();
  assert.ok(projPaginated.pagination);
  assert.strictEqual(projPaginated.pagination.limit, 2);
  console.log('   ✓ Safety and project event pagination verified.');

  // 14f. Paginated community posts
  const postPaginatedRes = await fetch(`${BASE_URL}/communities/feed/posts?page=1&limit=3`);
  assert.strictEqual(postPaginatedRes.status, 200);
  const postPaginated = await postPaginatedRes.json();
  assert.ok(postPaginated.pagination);
  assert.strictEqual(postPaginated.pagination.limit, 3);
  console.log('   ✓ Community feed posts pagination verified.');

  // 14g. Backward Compatibility: Unpaginated requests return raw arrays
  const unpaginatedRes = await fetch(`${BASE_URL}/observations`);
  assert.strictEqual(unpaginatedRes.status, 200);
  const unpaginatedData = await unpaginatedRes.json();
  assert.ok(Array.isArray(unpaginatedData), 'Unpaginated request must return raw Array');
  assert.ok(unpaginatedData.length >= 5);
  console.log('   ✓ Backward compatibility (raw array returned when page/limit omitted) verified.');

  // 14h. Parameter clamping & sanitation
  const clampedRes = await fetch(`${BASE_URL}/observations?page=-10&limit=999`);
  assert.strictEqual(clampedRes.status, 200);
  const clampedData = await clampedRes.json();
  assert.strictEqual(clampedData.pagination.page, 1, 'Negative page should clamp to 1');
  assert.strictEqual(clampedData.pagination.limit, 100, 'Limit above max should clamp to 100');
  console.log('   ✓ Edge case parameter clamping and bounds protection verified.\n');

  // 15. Community Group-Linked Requests & Group-Only Visibility Access Control
  console.log('15. Testing Community Group-Linked Requests & Group-Only Visibility...');
  
  // A. Create a group-only request linked to com_01 (Willow Creek Alliance)
  const grpReqRes = await fetch(`${BASE_URL}/requests`, {
    method: 'POST',
    headers: authHeaders, // authenticated as Maya Lin (usr_me)
    body: JSON.stringify({
      title: 'Alliance Tool Depot Key Handoff & Maintenance',
      description: 'Private coordination for active alliance members to audit seed supplies and chain locks.',
      category: 'labor',
      location: { address: 'Willow Creek Tool Shed', lat: 37.7815, lng: -122.4250 },
      urgency: 'medium',
      communityId: 'com_01',
      visibility: 'group_only',
      peopleNeeded: 2
    })
  });
  assert.strictEqual(grpReqRes.status, 201);
  const grpReq = await grpReqRes.json();
  assert.strictEqual(grpReq.visibility, 'group_only');
  assert.strictEqual(grpReq.communityId, 'com_01');

  // B. Verify unauthenticated caller does NOT see the group-only request
  const pubListRes = await fetch(`${BASE_URL}/requests`);
  const pubList = await pubListRes.json();
  assert(!pubList.some(r => r.id === grpReq.id), 'Unauthenticated public request list MUST NOT contain group_only request');

  // C. Verify authenticated group member DOES see the group-only request
  const authListRes = await fetch(`${BASE_URL}/requests`, { headers: authHeaders });
  const authList = await authListRes.json();
  assert(authList.some(r => r.id === grpReq.id), 'Authenticated group member MUST see group_only request');

  // D. Verify linking an existing request to a community
  const linkRes = await fetch(`${BASE_URL}/requests/req_08`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({ communityId: 'com_01' })
  });
  assert.strictEqual(linkRes.status, 200);
  const linkedData = await linkRes.json();
  assert.strictEqual(linkedData.communityId, 'com_01');

  // E. Verify community query returns linkedRequestIds
  const commRes = await fetch(`${BASE_URL}/communities/com_01`);
  const commData = await commRes.json();
  assert(commData.linkedRequestIds.includes(grpReq.id), 'Community linkedRequestIds must include the created group request');
  assert(commData.linkedRequestIds.includes('req_08'), 'Community linkedRequestIds must include newly linked request');

  // Clean up test request
  await fetch(`${BASE_URL}/requests/${grpReq.id}`, { method: 'DELETE', headers: authHeaders });
  // Restore req_08
  await fetch(`${BASE_URL}/requests/req_08`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({ communityId: null })
  });

  console.log('   ✓ Group-only request creation, strict access shielding, and community linking verified.\n');

  // 16. Google OAuth & Gmail Login - Mandatory Password Authentication
  console.log('16. Testing Google OAuth & Gmail Login (Mandatory Password Authentication)...');
  db.prepare("DELETE FROM users WHERE email = 'maya@example.com'").run();

  // A. Reject passwordless attempt to access admin account via /api/auth/google -> 401
  const adminBypassRes = await fetch(`${BASE_URL}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'caleb.zothansanga@gmail.com'
    })
  });
  assert.strictEqual(adminBypassRes.status, 401, 'Passwordless login attempt to admin account must return 401');
  const adminBypassData = await adminBypassRes.json();
  assert.ok(adminBypassData.error.includes('Password authentication required'));

  // B. Reject incorrect password for Gmail login -> 401
  const wrongPassRes = await fetch(`${BASE_URL}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'caleb.zothansanga@gmail.com',
      password: 'wrong_password_attempt'
    })
  });
  assert.strictEqual(wrongPassRes.status, 401, 'Incorrect password for Gmail account must return 401');

  // C. Successful Gmail login with valid password -> 200
  const validGmailLoginRes = await fetch(`${BASE_URL}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'caleb.zothansanga@gmail.com',
      password: 'password123'
    })
  });
  assert.strictEqual(validGmailLoginRes.status, 200, 'Gmail login with valid password must succeed with 200');
  const validGmailData = await validGmailLoginRes.json();
  assert.strictEqual(validGmailData.user.email, 'caleb.zothansanga@gmail.com');
  assert.strictEqual(validGmailData.user.role, 'System Administrator');
  assert(validGmailData.token, 'Token must be issued upon valid password authentication');

  // D. General member Gmail login with valid password -> 200
  const memberGmailRes = await fetch(`${BASE_URL}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'maya@caremesh.org',
      password: 'password123'
    })
  });
  assert.strictEqual(memberGmailRes.status, 200);
  const memberGmailData = await memberGmailRes.json();
  assert.strictEqual(memberGmailData.user.id, 'usr_me');

  // Verify the issued token works against /api/auth/me
  const meVerifyRes = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${memberGmailData.token}` }
  });
  assert.strictEqual(meVerifyRes.status, 200);
  const meData = await meVerifyRes.json();
  assert.strictEqual(meData.user.id, 'usr_me');

  console.log('   ✓ Mandatory password authentication for all Gmail logins & rejection of passwordless admin bypass verified.\n');

  // 17. Custom Category Creation, Persistence, and Editing
  console.log('17. Testing Custom Categories Across Requests, Observations, and Group Feed Posts...');

  // A. Request with custom category
  const customReqRes = await fetch(`${BASE_URL}/requests`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'Emergency shelter for displaced livestock',
      description: 'Need temporary fencing and water troughs for horses.',
      category: 'Animal Care & Livestock',
      location: { address: 'Ridge Road Pastures', lat: 37.78, lng: -122.42 }
    })
  });
  assert.strictEqual(customReqRes.status, 201, 'Request with custom category should be created');
  const customReqData = await customReqRes.json();
  assert.strictEqual(customReqData.category, 'Animal Care & Livestock', 'Custom category should persist on request');

  // Edit custom category on request
  const editCustomReqRes = await fetch(`${BASE_URL}/requests/${customReqData.id}`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({ category: 'Equine Rescue & Shelter' })
  });
  assert.strictEqual(editCustomReqRes.status, 200, 'Editing request category should succeed');
  const editCustomReqData = await editCustomReqRes.json();
  assert.strictEqual(editCustomReqData.category, 'Equine Rescue & Shelter', 'Edited custom category should update');

  // Clean up request
  await fetch(`${BASE_URL}/requests/${customReqData.id}`, { method: 'DELETE', headers: authHeaders });

  // B. Group feed post with custom category
  const customPostRes = await fetch(`${BASE_URL}/communities/feed/posts`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      content: 'Culvert weir water levels surging above 90% threshold',
      category: 'Flood Watch Alert',
      communityId: 'com_01'
    })
  });
  assert.strictEqual(customPostRes.status, 201, 'Post with custom category should be created');
  const customPostData = await customPostRes.json();
  assert.strictEqual(customPostData.category, 'Flood Watch Alert', 'Custom category should persist on feed post');

  // Edit custom category on feed post
  const editCustomPostRes = await fetch(`${BASE_URL}/communities/feed/posts/${customPostData.id}`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({ category: 'Critical River Sensor Alert' })
  });
  assert.strictEqual(editCustomPostRes.status, 200, 'Editing post category should succeed');
  const editCustomPostData = await editCustomPostRes.json();
  assert.strictEqual(editCustomPostData.category, 'Critical River Sensor Alert', 'Edited custom category should update on post');

  // Clean up post
  await fetch(`${BASE_URL}/communities/feed/posts/${customPostData.id}`, { method: 'DELETE', headers: authHeaders });

  // C. Observation with custom category
  const customObsRes = await fetch(`${BASE_URL}/observations`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'Multispectral drone imagery of canopy distress',
      category: 'Drone Aerial Survey',
      description: 'UAV survey covering 40 hectares of west ridge.',
      location: { address: 'West Ridge Slope', lat: 37.79, lng: -122.43 }
    })
  });
  assert.strictEqual(customObsRes.status, 201, 'Observation with custom category should be created');
  const customObsData = await customObsRes.json();
  assert.strictEqual(customObsData.category, 'Drone Aerial Survey', 'Custom category should persist on observation');

  // Edit custom category on observation
  const editCustomObsRes = await fetch(`${BASE_URL}/observations/${customObsData.id}`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({ category: 'Canopy Health Remote Sensing' })
  });
  assert.strictEqual(editCustomObsRes.status, 200, 'Editing observation category should succeed');
  const editCustomObsData = await editCustomObsRes.json();
  assert.strictEqual(editCustomObsData.category, 'Canopy Health Remote Sensing', 'Edited custom category should update on observation');

  // Clean up observation
  db.prepare('DELETE FROM observations WHERE id = ?').run(customObsData.id);

  console.log('   ✓ Custom category persistence & updating across requests, feed posts, and observations verified.\n');

  // ==========================================
  // 18. Testing Structured Evidence Types
  // ==========================================
  await flushServerRateLimits();
  console.log('18. Testing Structured Evidence Types (Measurement, Sensor, Lab Test)...');

  const evidenceTypesToTest = ['measurement', 'sensor', 'lab_test', 'document', 'photo'];
  for (const evType of evidenceTypesToTest) {
    const createEvRes = await fetch(`${BASE_URL}/evidence`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        title: `Field Calibration Test for ${evType}`,
        type: evType,
        description: `Verified test protocol registering evidence type: ${evType}`,
        provenanceChain: [{ step: 'Sensor reading verified on site', time: '10:00 AM' }]
      })
    });
    assert.strictEqual(createEvRes.status, 201, `Evidence of type ${evType} should be created`);
    const createdEv = await createEvRes.json();
    assert.strictEqual(createdEv.type, evType, `Evidence type should be ${evType}`);

    // Verify GET /api/evidence/:id
    const getEvRes = await fetch(`${BASE_URL}/evidence/${createdEv.id}`);
    assert.strictEqual(getEvRes.status, 200, `Evidence ${createdEv.id} should be retrievable`);
    const fetchedEv = await getEvRes.json();
    assert.strictEqual(fetchedEv.type, evType, `Fetched evidence type should match ${evType}`);

    // Clean up
    db.prepare('DELETE FROM evidence WHERE id = ?').run(createdEv.id);
  }

  console.log('   ✓ Structured evidence creation & type preservation (measurement, sensor, etc.) verified.\n');

  // ==========================================
  // 19. Testing Recursive Sub-Posts (Evidence, Sub-Evidence, Sub-Contradiction)
  // ==========================================
  console.log('19. Testing Recursive Sub-Posts (Evidence -> Sub-Evidence, Sub-Contradictions & Provenance Links)...');

  // 19a. Create Parent Evidence
  const parentEvRes = await fetch(`${BASE_URL}/evidence`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'Inlet Silt Gauge Calibrated Reading',
      type: 'measurement',
      description: 'Baseline primary measurement of 42 inches silt depth.',
      provenanceChain: [{ step: 'Recorded in situ', time: '10:00 AM' }]
    })
  });
  assert.strictEqual(parentEvRes.status, 201);
  const parentEv = await parentEvRes.json();
  assert.strictEqual(parentEv.title, 'Inlet Silt Gauge Calibrated Reading');

  // 19b. Create Sub-Evidence referencing Parent Evidence
  const subEvRes = await fetch(`${BASE_URL}/evidence`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'Secondary Acoustic Silt Telemetry Corroboration',
      type: 'sensor',
      description: 'Ultrasonic depth sensor corroborates silt layer within 0.5 inches margin.',
      parentEvidenceId: parentEv.id,
      provenanceChain: [{ step: 'Telemetry sensor sync', time: '10:30 AM' }]
    })
  });
  assert.strictEqual(subEvRes.status, 201);
  const subEv = await subEvRes.json();
  assert.strictEqual(subEv.parentEvidenceId, parentEv.id, 'Sub-evidence must link to parentEvidenceId');

  // 19c. Create Sub-Contradiction Observation referencing Parent Evidence
  const subContraRes = await fetch(`${BASE_URL}/observations`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'Dispute on Silt Gauge Base Elevation',
      category: 'environmental',
      description: 'Gauge zero-point was installed 6 inches above true culvert invert.',
      isContradiction: true,
      referencedEvidenceId: parentEv.id,
      referencedEvidenceTitle: parentEv.title
    })
  });
  assert.strictEqual(subContraRes.status, 201);
  const subContra = await subContraRes.json();
  assert.strictEqual(subContra.referencedEvidenceId, parentEv.id, 'Sub-contradiction must link to referencedEvidenceId');
  assert.strictEqual(subContra.isContradiction, true);

  // Clean up
  db.prepare('DELETE FROM evidence WHERE id IN (?, ?)').run(parentEv.id, subEv.id);
  db.prepare('DELETE FROM observations WHERE id = ?').run(subContra.id);

  console.log('   ✓ Recursive sub-evidence & sub-contradiction creation and parent links verified.\n');

  // ==========================================
  // 20. Testing Poster / Admin Deletion of Everything (Cascade & Insides)
  // ==========================================
  await flushServerRateLimits();
  console.log('20. Testing Poster / Admin Deletion of Everything (Posts, Evidence, Disputes, Responses, Safety, Plan Parts)...');

  // 20a. Evidence creation and cascade deletion
  const testEvRes = await fetch(`${BASE_URL}/evidence`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'Temporary Calibration Telemetry for Deletion Test',
      type: 'sensor',
      description: 'Will be deleted to test foreign key and reference cascade.',
      observationId: 'obs_01'
    })
  });
  assert.strictEqual(testEvRes.status, 201, 'Test evidence should be created');
  const testEv = await testEvRes.json();

  // Verify relation exists in observation_evidence
  const linkRowBefore = db.prepare('SELECT * FROM observation_evidence WHERE evidence_id = ?').get(testEv.id);
  assert.ok(linkRowBefore, 'observation_evidence link should exist before deletion');

  // Delete evidence
  const delEvRes = await fetch(`${BASE_URL}/evidence/${testEv.id}`, {
    method: 'DELETE',
    headers: authHeaders
  });
  assert.strictEqual(delEvRes.status, 200, 'DELETE /api/evidence/:id should succeed');
  const getDelEvRes = await fetch(`${BASE_URL}/evidence/${testEv.id}`);
  assert.strictEqual(getDelEvRes.status, 404, 'Deleted evidence should return 404');
  const linkRowAfter = db.prepare('SELECT * FROM observation_evidence WHERE evidence_id = ?').get(testEv.id);
  assert.strictEqual(linkRowAfter, undefined, 'observation_evidence link must cascade on evidence deletion');

  // 20b. Dispute and Dispute Response deletion
  const testDispRes = await fetch(`${BASE_URL}/disputes`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      observationId: 'obs_01',
      reason: 'Temporary Dispute Test',
      explanation: 'Verifying response and dispute deletion capability.'
    })
  });
  assert.strictEqual(testDispRes.status, 201, 'Test dispute should be created');
  const testDisp = await testDispRes.json();

  // Add dispute response
  const testRespRes = await fetch(`${BASE_URL}/disputes/${testDisp.id}/responses`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      type: 'challenge',
      reason: 'Temporary Rebuttal',
      explanation: 'Rebuttal to be deleted.'
    })
  });
  assert.strictEqual(testRespRes.status, 201, 'Test dispute response should be created');
  const testResp = await testRespRes.json();

  // Delete dispute response
  const delRespRes = await fetch(`${BASE_URL}/disputes/${testDisp.id}/responses/${testResp.id}`, {
    method: 'DELETE',
    headers: authHeaders
  });
  assert.strictEqual(delRespRes.status, 200, 'DELETE dispute response should succeed');
  const respRowAfter = db.prepare('SELECT * FROM dispute_responses WHERE id = ?').get(testResp.id);
  assert.strictEqual(respRowAfter, undefined, 'Deleted dispute response must no longer exist');

  // Delete dispute itself
  const delDispRes = await fetch(`${BASE_URL}/disputes/${testDisp.id}`, {
    method: 'DELETE',
    headers: authHeaders
  });
  assert.strictEqual(delDispRes.status, 200, 'DELETE dispute should succeed');
  const dispRowAfter = db.prepare('SELECT * FROM disputes WHERE id = ?').get(testDisp.id);
  assert.strictEqual(dispRowAfter, undefined, 'Deleted dispute must no longer exist');

  // 20c. Safety Report deletion
  const testSafetyRes = await fetch(`${BASE_URL}/safety`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'Temporary Hazard Flare for Deletion Test',
      description: 'Temporary gas flare alert.',
      severity: 'moderate'
    })
  });
  assert.strictEqual(testSafetyRes.status, 201, 'Test safety report should be created');
  const testSafety = await testSafetyRes.json();

  const delSafetyRes = await fetch(`${BASE_URL}/safety/${testSafety.id}`, {
    method: 'DELETE',
    headers: authHeaders
  });
  assert.strictEqual(delSafetyRes.status, 200, 'DELETE safety report should succeed');
  const safetyRowAfter = db.prepare('SELECT * FROM safety_reports WHERE id = ?').get(testSafety.id);
  assert.strictEqual(safetyRowAfter, undefined, 'Deleted safety report must no longer exist');

  // 20d. Plan decision deletion & plan deletion
  const testPlanRes = await fetch(`${BASE_URL}/plans`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'Temporary Water Drainage Overhaul',
      problemStatement: 'Runoff pooling near culvert.',
      desiredOutcome: 'Clean storm discharge.',
      proposedApproach: 'Install retention bioswale.'
    })
  });
  assert.strictEqual(testPlanRes.status, 201, 'Test plan should be created');
  const testPlan = await testPlanRes.json();

  // Create revision which creates a decision
  const testRevRes = await fetch(`${BASE_URL}/plans/${testPlan.id}/revisions`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      version: 'v1.1',
      summaryOfChanges: 'Widened swale width to 12 feet.',
      reasoningForChanges: 'Hydraulic models indicated 20% surge capacity needed.',
      decisionTitle: 'Approved swale expansion',
      decisionRationale: 'Hydraulic compliance.'
    })
  });
  assert.strictEqual(testRevRes.status, 200, 'Revision creation should succeed');
  const revisedPlan = await testRevRes.json();
  assert.ok(revisedPlan.decisions?.length > 0, 'Plan should contain decisions after revision');

  const testDecision = revisedPlan.decisions[0];
  const delDecRes = await fetch(`${BASE_URL}/plans/${testPlan.id}/decisions/${testDecision.id}`, {
    method: 'DELETE',
    headers: authHeaders
  });
  assert.strictEqual(delDecRes.status, 200, 'DELETE plan decision should succeed');
  const decRowAfter = db.prepare('SELECT * FROM decisions WHERE id = ?').get(testDecision.id);
  assert.strictEqual(decRowAfter, undefined, 'Deleted plan decision must no longer exist');

  // Clean up plan
  const testDelPlanRes = await fetch(`${BASE_URL}/plans/${testPlan.id}`, {
    method: 'DELETE',
    headers: authHeaders
  });
  assert.strictEqual(testDelPlanRes.status, 200, 'DELETE plan should succeed');

  console.log('   ✓ Universal deletion of evidence, disputes, responses, safety reports, and plan decisions verified.\n');

  // 21. Testing Account-Level Notification & Data Isolation
  console.log('21. Testing Account-Level Notification & Data Isolation...');

  // A. Notifications Isolation: usr_me vs usr_dave
  const meNotifsRes = await fetch(`${BASE_URL}/notifications`, { headers: authHeaders }); // usr_me
  assert.strictEqual(meNotifsRes.status, 200);
  const meNotifs = await meNotifsRes.json();
  assert.ok(meNotifs.length > 0, 'usr_me should have notifications');
  assert.ok(meNotifs.every(n => n.userId === 'usr_me'), 'All usr_me notifications must have userId === usr_me');

  // Login as Dave
  const daveData = await loginAs('usr_dave');
  const daveHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${daveData.token}`
  };

  const daveNotifsRes = await fetch(`${BASE_URL}/notifications`, { headers: daveHeaders });
  assert.strictEqual(daveNotifsRes.status, 200);
  const daveNotifs = await daveNotifsRes.json();
  assert.ok(daveNotifs.length > 0, 'usr_dave should have notifications');
  assert.ok(daveNotifs.every(n => n.userId === 'usr_dave'), 'All usr_dave notifications must have userId === usr_dave');
  assert.ok(!daveNotifs.some(n => meNotifs.some(mn => mn.id === n.id)), 'usr_dave must not see any of usr_me notifications');
  console.log('   ✓ Account notification isolation (usr_me vs usr_dave) verified.');

  // B. Cross-account notification read protection
  const targetMeNotifId = meNotifs[0].id;
  const unauthorizedReadRes = await fetch(`${BASE_URL}/notifications/${targetMeNotifId}/read`, {
    method: 'PATCH',
    headers: daveHeaders
  });
  assert.strictEqual(unauthorizedReadRes.status, 403, 'Dave attempting to mark Elena notification as read must be 403 Forbidden');
  console.log('   ✓ Cross-account notification mark-read 403 Forbidden verified.');

  // C. Conversations & Direct Messages Isolation
  // conv_02 is between usr_me and usr_elena. Dave is NOT a participant.
  const unauthorizedConvoRes = await fetch(`${BASE_URL}/conversations/conv_02`, { headers: daveHeaders });
  assert.strictEqual(unauthorizedConvoRes.status, 403, 'Dave accessing conv_02 must return 403 Forbidden');

  const unauthorizedMsgRes = await fetch(`${BASE_URL}/conversations/conv_02/messages`, {
    method: 'POST',
    headers: daveHeaders,
    body: JSON.stringify({ text: 'Unauthorized message attempt' })
  });
  assert.strictEqual(unauthorizedMsgRes.status, 403, 'Dave posting to conv_02 must return 403 Forbidden');

  // conv_01 is between usr_me and usr_dave. Dave IS a participant.
  const authorizedConvoRes = await fetch(`${BASE_URL}/conversations/conv_01`, { headers: daveHeaders });
  assert.strictEqual(authorizedConvoRes.status, 200, 'Dave accessing conv_01 must succeed');
  const authorizedConvo = await authorizedConvoRes.json();
  assert.strictEqual(authorizedConvo.participant.id, 'usr_me', 'Dave must see participant as usr_me (the other party)');
  console.log('   ✓ Direct message conversation isolation & relative participant resolution verified.');

  // D. Group-Only Request Detail Access Control
  const testPrivateReqRes = await fetch(`${BASE_URL}/requests`, {
    method: 'POST',
    headers: authHeaders, // Maya (usr_me)
    body: JSON.stringify({
      title: 'Restricted Key Depot Audit',
      description: 'Private circle coordination.',
      category: 'labor',
      location: { address: 'Locked Shed' },
      urgency: 'low',
      communityId: 'com_01',
      visibility: 'group_only'
    })
  });
  assert.strictEqual(testPrivateReqRes.status, 201);
  const testPrivateReq = await testPrivateReqRes.json();

  // Login as outsider user
  const outsiderData = await loginAs('usr_priya'); // Priya is not in com_01
  const outsiderHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${outsiderData.token}`
  };

  // Ensure Priya is not a member of com_01
  db.prepare('DELETE FROM community_members WHERE community_id = ? AND user_id = ?').run('com_01', 'usr_priya');

  const outsiderReqDetailRes = await fetch(`${BASE_URL}/requests/${testPrivateReq.id}`, { headers: outsiderHeaders });
  assert.strictEqual(outsiderReqDetailRes.status, 403, 'Non-member requesting group_only request detail must be 403 Forbidden');

  const unauthReqDetailRes = await fetch(`${BASE_URL}/requests/${testPrivateReq.id}`);
  assert.strictEqual(unauthReqDetailRes.status, 403, 'Unauthenticated caller requesting group_only request must be 403 Forbidden');

  // Clean up private test request
  await fetch(`${BASE_URL}/requests/${testPrivateReq.id}`, { method: 'DELETE', headers: authHeaders });
  console.log('   ✓ Group-only request access shielding (403 Forbidden for non-members) verified.');

  // E. Private Community Feed Access Control
  db.prepare("DELETE FROM communities WHERE handle LIKE '@secretcouncil%'").run();
  const councilHandle = `@secretcouncil_${Date.now()}`;
  const privCommRes = await fetch(`${BASE_URL}/communities`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'Secret Neighborhood Council',
      handle: councilHandle,
      description: 'Strictly confidential disaster planning.',
      privacy: 'private'
    })
  });
  assert.strictEqual(privCommRes.status, 201);
  const privComm = await privCommRes.json();

  const privPostRes = await fetch(`${BASE_URL}/communities/feed/posts`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      communityId: privComm.id,
      content: 'Confidential emergency meeting at 9 PM.'
    })
  });
  assert.strictEqual(privPostRes.status, 201);
  const privPost = await privPostRes.json();

  // Outsider tries to fetch private community feed
  const outsiderFeedRes = await fetch(`${BASE_URL}/communities/feed/posts?communityId=${privComm.id}`, { headers: outsiderHeaders });
  assert.strictEqual(outsiderFeedRes.status, 403, 'Outsider fetching private community feed must be 403 Forbidden');

  // Global feed for outsider should NOT contain privPost
  const outsiderGlobalFeedRes = await fetch(`${BASE_URL}/communities/feed/posts`, { headers: outsiderHeaders });
  const outsiderGlobalFeed = await outsiderGlobalFeedRes.json();
  assert.ok(!outsiderGlobalFeed.some(p => p.id === privPost.id), 'Outsider global feed must not leak private community posts');

  // Clean up private community
  db.prepare('DELETE FROM communities WHERE id = ?').run(privComm.id);
  db.prepare('DELETE FROM posts WHERE id = ?').run(privPost.id);
  console.log('   ✓ Private community posts & feed access shielding verified.');

  // F. Bootstrap Scoping for Dave
  const daveBootstrapRes = await fetch(`${BASE_URL}/bootstrap`, { headers: daveHeaders });
  assert.strictEqual(daveBootstrapRes.status, 200);
  const daveBoot = await daveBootstrapRes.json();
  assert.strictEqual(daveBoot.currentUser.id, 'usr_dave');
  assert.ok(daveBoot.notifications.every(n => n.userId === 'usr_dave'), 'Bootstrap notifications must only belong to usr_dave');
  assert.ok(daveBoot.conversations.every(c => c.user1Id === 'usr_dave' || c.user2Id === 'usr_dave'), 'Bootstrap conversations must only contain usr_dave');
  // 22. Testing Self-Action & Duplicate Action Safeguards
  await flushServerRateLimits();
  console.log('22. Testing Self-Action & Duplicate Action Safeguards...');

  // A. Help Request Self-Volunteering & Duplicate Volunteering
  const testReqRes = await fetch(`${BASE_URL}/requests`, {
    method: 'POST',
    headers: daveHeaders, // dave is creator
    body: JSON.stringify({
      title: 'Dave Sandbox Culvert Task',
      description: 'Clearing ditch debris',
      category: 'labor',
      urgency: 'medium',
      peopleNeeded: 3
    })
  });
  assert.strictEqual(testReqRes.status, 201);
  const testReq = await testReqRes.json();

  // Requester (Dave) tries to volunteer on his own request -> must be 400
  const daveVolRes = await fetch(`${BASE_URL}/requests/${testReq.id}/respond`, {
    method: 'POST',
    headers: daveHeaders,
    body: JSON.stringify({ role: 'Volunteer' })
  });
  assert.strictEqual(daveVolRes.status, 400, 'Requester must not be allowed to volunteer for own request');
  const daveVolData = await daveVolRes.json();
  assert.ok(daveVolData.error.includes('requester'), 'Error message should indicate requester restriction');

  // Volunteer (Elena) joins -> must be 200
  const elenaVolRes = await fetch(`${BASE_URL}/requests/${testReq.id}/respond`, {
    method: 'POST',
    headers: authHeaders, // Elena
    body: JSON.stringify({ role: 'First Aid Volunteer', userId: 'usr_elena' })
  });
  assert.strictEqual(elenaVolRes.status, 200);

  // Elena tries to volunteer again -> must be 400
  const elenaVolAgainRes = await fetch(`${BASE_URL}/requests/${testReq.id}/respond`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ role: 'First Aid Volunteer', userId: 'usr_elena' })
  });
  assert.strictEqual(elenaVolAgainRes.status, 400, 'Duplicate volunteering on same request must be rejected with 400');

  // Clean up test request
  await fetch(`${BASE_URL}/requests/${testReq.id}`, { method: 'DELETE', headers: daveHeaders });
  console.log('   ✓ Request poster self-volunteering & duplicate response protections verified.');

  // B. Project Organizer Self-Joining & Duplicate Joining
  const testProjRes = await fetch(`${BASE_URL}/projects`, {
    method: 'POST',
    headers: daveHeaders, // Dave is organizer
    body: JSON.stringify({
      title: 'Dave Sandbox Operation',
      eventType: 'volunteer_activity',
      description: 'Sandbox flood sandbagging',
      address: 'Willow Valley Rd'
    })
  });
  assert.strictEqual(testProjRes.status, 201);
  const testProj = await testProjRes.json();

  // Organizer (Dave) tries to join -> must be 400
  const organizerJoinRes = await fetch(`${BASE_URL}/projects/${testProj.id}/join`, {
    method: 'POST',
    headers: daveHeaders,
    body: JSON.stringify({ userId: 'usr_dave' })
  });
  assert.strictEqual(organizerJoinRes.status, 400, 'Organizer cannot join own project as attendee');

  // Participant (Elena) joins -> must be 200
  const elenaJoinProjRes = await fetch(`${BASE_URL}/projects/${testProj.id}/join`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ userId: 'usr_elena' })
  });
  assert.strictEqual(elenaJoinProjRes.status, 200);

  // Elena tries to join again -> must be 400
  const elenaJoinProjAgainRes = await fetch(`${BASE_URL}/projects/${testProj.id}/join`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ userId: 'usr_elena' })
  });
  assert.strictEqual(elenaJoinProjAgainRes.status, 400, 'Duplicate project joining must be rejected with 400');

  // Clean up test project
  db.prepare('DELETE FROM project_participants WHERE project_id = ?').run(testProj.id);
  db.prepare('DELETE FROM projects WHERE id = ?').run(testProj.id);
  console.log('   ✓ Project organizer self-joining & duplicate participant protections verified.');

  // C. Social Post Self-Corroboration (Endorsement)
  const corroboratePostRes = await fetch(`${BASE_URL}/communities/feed/posts`, {
    method: 'POST',
    headers: daveHeaders,
    body: JSON.stringify({
      communityId: 'com_01',
      content: 'Dave test post for corroboration checks'
    })
  });
  assert.strictEqual(corroboratePostRes.status, 201);
  const corroboratePost = await corroboratePostRes.json();

  // Dave tries to endorse own post -> must be 400
  const selfEndorseRes = await fetch(`${BASE_URL}/communities/feed/posts/${corroboratePost.id}/endorse`, {
    method: 'POST',
    headers: daveHeaders
  });
  assert.strictEqual(selfEndorseRes.status, 400, 'Author cannot corroborate own post');

  // Clean up test post
  await fetch(`${BASE_URL}/communities/feed/posts/${corroboratePost.id}`, { method: 'DELETE', headers: daveHeaders });
  console.log('   ✓ Feed post author self-corroboration protection verified.');

  // D. Content & Profile Self-Reporting & Duplicate Report Protection
  // Dave tries to report himself -> must be 400
  const selfReportRes = await fetch(`${BASE_URL}/reports`, {
    method: 'POST',
    headers: daveHeaders,
    body: JSON.stringify({
      targetType: 'profile_picture',
      targetId: 'usr_dave',
      reportedUserId: 'usr_dave',
      reason: 'Testing self-report rejection'
    })
  });
  assert.strictEqual(selfReportRes.status, 400, 'User cannot report their own profile picture or content');

  // Dave reports an external target
  const validReportRes = await fetch(`${BASE_URL}/reports`, {
    method: 'POST',
    headers: daveHeaders,
    body: JSON.stringify({
      targetType: 'profile_picture',
      targetId: 'usr_marcus',
      reportedUserId: 'usr_marcus',
      reason: 'Testing valid report'
    })
  });
  assert.strictEqual(validReportRes.status, 201);
  const validReport = await validReportRes.json();

  // Dave tries to report the same target again while pending -> must be 400
  const duplicateReportRes = await fetch(`${BASE_URL}/reports`, {
    method: 'POST',
    headers: daveHeaders,
    body: JSON.stringify({
      targetType: 'profile_picture',
      targetId: 'usr_marcus',
      reportedUserId: 'usr_marcus',
      reason: 'Testing duplicate report rejection'
    })
  });
  assert.strictEqual(duplicateReportRes.status, 400, 'Duplicate pending report must be rejected with 400');

  // Clean up report
  db.prepare('DELETE FROM reports WHERE id = ?').run(validReport.id);
  console.log('   ✓ Self-reporting & duplicate pending report protections verified.');

  // E. Moderator Self-Nomination Protection
  const selfNominateRes = await fetch(`${BASE_URL}/communities/com_01/elections/nominate`, {
    method: 'POST',
    headers: authHeaders, // Maya
    body: JSON.stringify({
      candidateId: 'usr_me' // Self-nomination
    })
  });
  assert.strictEqual(selfNominateRes.status, 400, 'Self-nomination for community moderator must be rejected with 400');
  console.log('   ✓ Community moderator self-nomination protection verified.\n');

  // ==========================================
  // 23. ROLE-BASED ACCESS CONTROL & PRIVACY VERIFICATION
  // ==========================================
  console.log('23. Testing Role-Based Access Control & Circle Privacy...');

  // A. Private Community Circle Post/Comment Gate
  db.prepare('DELETE FROM communities WHERE handle LIKE ?').run('%privwatch%');
  const privCircleId = `com_priv_${Date.now()}`;
  const privHandle = `@privwatch_${Date.now()}`;
  db.prepare(`
    INSERT INTO communities (id, name, handle, category, privacy, privacy_label, description, location, member_count, avatar, banner, created_date, rules, media_gallery, files)
    VALUES (?, 'Private Neighborhood Watch', ?, 'Preparedness', 'private', 'Private Circle', 'Strictly private circle', 'South Ward', 1, '', '', '2026-09-14', '[]', '[]', '[]')
  `).run(privCircleId, privHandle);

  // Non-member (Dave) tries to post in the private circle -> must be 403
  const davePrivPostRes = await fetch(`${BASE_URL}/communities/feed/posts`, {
    method: 'POST',
    headers: daveHeaders,
    body: JSON.stringify({
      communityId: privCircleId,
      content: 'Unauthorized post attempt by non-member'
    })
  });
  assert.strictEqual(davePrivPostRes.status, 403, 'Non-member posting in private circle must return 403');

  // Platform admin (Caleb) posts in the private circle -> 201
  const adminPrivPostRes = await fetch(`${BASE_URL}/communities/feed/posts`, {
    method: 'POST',
    headers: calebHeaders,
    body: JSON.stringify({
      communityId: privCircleId,
      content: 'Admin safety announcement in private circle'
    })
  });
  assert.strictEqual(adminPrivPostRes.status, 201, 'Platform admin can post in private circle');
  const adminPrivPost = await adminPrivPostRes.json();

  // Non-member (Dave) tries to comment on the post in private circle -> must be 403
  const davePrivCommentRes = await fetch(`${BASE_URL}/communities/feed/posts/${adminPrivPost.id}/comments`, {
    method: 'POST',
    headers: daveHeaders,
    body: JSON.stringify({ text: 'Unauthorized comment attempt' })
  });
  assert.strictEqual(davePrivCommentRes.status, 403, 'Non-member commenting in private circle must return 403');

  // Platform admin (Caleb) comments on the post in private circle -> 201
  const adminPrivCommentRes = await fetch(`${BASE_URL}/communities/feed/posts/${adminPrivPost.id}/comments`, {
    method: 'POST',
    headers: calebHeaders,
    body: JSON.stringify({ text: 'Admin update note' })
  });
  assert.strictEqual(adminPrivCommentRes.status, 201, 'Platform admin can comment in private circle');

  // Clean up private community & post
  db.prepare('DELETE FROM post_comments WHERE post_id = ?').run(adminPrivPost.id);
  db.prepare('DELETE FROM posts WHERE id = ?').run(adminPrivPost.id);
  db.prepare('DELETE FROM communities WHERE id = ?').run(privCircleId);
  console.log('   ✓ Private community feed & comment access control verified.');

  // B. Event / Project Admin Moderation (Edit & Delete)
  const testEventRes = await fetch(`${BASE_URL}/projects`, {
    method: 'POST',
    headers: daveHeaders, // Organizer is Dave
    body: JSON.stringify({
      title: 'Dave Neighborhood Clean-up',
      eventType: 'Cleanup',
      description: 'Community street clean up',
      location: { address: '123 Pine St' },
      date: '2026-10-01',
      time: '10:00 AM'
    })
  });
  assert.strictEqual(testEventRes.status, 201);
  const testEvent = await testEventRes.json();

  // Non-organizer non-admin (Marcus) tries to edit Dave's event -> 403
  const marcusData = await loginAs('usr_marcus');
  const marcusHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${marcusData.token}`
  };

  const unauthorizedEditEventRes = await fetch(`${BASE_URL}/projects/${testEvent.id}`, {
    method: 'PATCH',
    headers: marcusHeaders,
    body: JSON.stringify({ title: 'Hacked Title' })
  });
  assert.strictEqual(unauthorizedEditEventRes.status, 403, 'Non-organizer cannot edit event');

  // Platform admin (Caleb) edits Dave's event -> 200
  const adminEditEventRes = await fetch(`${BASE_URL}/projects/${testEvent.id}`, {
    method: 'PATCH',
    headers: calebHeaders,
    body: JSON.stringify({ title: 'Dave Neighborhood Clean-up (Admin Verified)' })
  });
  assert.strictEqual(adminEditEventRes.status, 200, 'Platform admin can edit event for moderation');

  // Unauthorized user tries to delete event -> 403
  const unauthorizedDelEventRes = await fetch(`${BASE_URL}/projects/${testEvent.id}`, {
    method: 'DELETE',
    headers: marcusHeaders
  });
  assert.strictEqual(unauthorizedDelEventRes.status, 403, 'Non-organizer cannot delete event');

  // Platform admin (Caleb) deletes event -> 200
  const adminDelEventRes = await fetch(`${BASE_URL}/projects/${testEvent.id}`, {
    method: 'DELETE',
    headers: calebHeaders
  });
  assert.strictEqual(adminDelEventRes.status, 200, 'Platform admin can delete event for moderation');
  console.log('   ✓ Project/Event admin moderation (edit & delete) verified.');

  // C. Resource Admin Moderation (Edit & Delete)
  const testResourceRes = await fetch(`${BASE_URL}/resources`, {
    method: 'POST',
    headers: daveHeaders, // Provider is Dave
    body: JSON.stringify({
      title: 'Dave Cordless Drill',
      description: 'Heavy duty drill',
      category: 'tools',
      contributionType: 'loan',
      quantity: 1
    })
  });
  assert.strictEqual(testResourceRes.status, 201);
  const testResource = await testResourceRes.json();

  // Non-owner non-admin tries to edit Dave's resource -> 403
  const unauthorizedEditRes = await fetch(`${BASE_URL}/resources/${testResource.id}`, {
    method: 'PATCH',
    headers: marcusHeaders,
    body: JSON.stringify({ title: 'Marcus hijacked drill' })
  });
  assert.strictEqual(unauthorizedEditRes.status, 403, 'Non-owner non-admin cannot edit resource');

  // Platform admin (Caleb) edits resource -> 200
  const adminEditRes = await fetch(`${BASE_URL}/resources/${testResource.id}`, {
    method: 'PATCH',
    headers: calebHeaders,
    body: JSON.stringify({ title: 'Dave Cordless Drill (Moderated)' })
  });
  assert.strictEqual(adminEditRes.status, 200, 'Platform admin can edit resource for moderation');

  // Platform admin (Caleb) deletes resource -> 200
  const adminDelRes = await fetch(`${BASE_URL}/resources/${testResource.id}`, {
    method: 'DELETE',
    headers: calebHeaders
  });
  assert.strictEqual(adminDelRes.status, 200, 'Platform admin can delete resource for moderation');
  console.log('   ✓ Resource admin moderation (edit & delete) verified.\n');

  // ==========================================
  // 24. SYSTEM ADMIN GOVERNANCE, EVIDENCE VAULT, USER DOSSIER, ACCOUNT RESTRICTION & ANTI-SPAM RATE LIMITER
  // ==========================================
  console.log('24. Testing System Admin Governance, Evidence Vault, User Dossier, Account Restriction & Anti-Spam Rate Limiter...');

  // A. Multi-Attribute User Search & RBAC Enforcement
  // Non-admin (Marcus) tries to access /api/admin/users -> 403 Forbidden
  const unauthAdminUsersRes = await fetch(`${BASE_URL}/admin/users`, { headers: marcusHeaders });
  assert.strictEqual(unauthAdminUsersRes.status, 403, 'Non-admin accessing /api/admin/users must return 403');

  // Admin searches by keyword "Elena" -> returns user
  const adminSearchRes = await fetch(`${BASE_URL}/admin/users?search=Elena`, { headers: calebHeaders });
  assert.strictEqual(adminSearchRes.status, 200);
  const searchResults = await adminSearchRes.json();
  assert.ok(searchResults.some(u => u.name.includes('Elena')), 'Search by name must find Elena');

  // Admin filters by role=admin -> all returned must have admin role
  const adminRoleRes = await fetch(`${BASE_URL}/admin/users?role=admin`, { headers: calebHeaders });
  assert.strictEqual(adminRoleRes.status, 200);
  const roleResults = await adminRoleRes.json();
  assert.ok(roleResults.every(u => (u.role || '').toLowerCase() === 'admin'), 'Role filter must only return admins');

  // Admin filters by status=active -> all returned must have status active
  const adminStatusRes = await fetch(`${BASE_URL}/admin/users?status=active`, { headers: calebHeaders });
  assert.strictEqual(adminStatusRes.status, 200);
  const statusResults = await adminStatusRes.json();
  assert.ok(statusResults.every(u => u.status === 'active'), 'Status filter must only return active users');
  console.log('   ✓ Multi-attribute user search & RBAC authorization verified.');

  // B. User Incident & Historical Report Dossier
  // File a report against Marcus (usr_marcus)
  const filedReportRes = await fetch(`${BASE_URL}/reports`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      targetType: 'profile_picture',
      targetId: 'usr_marcus',
      reportedUserId: 'usr_marcus',
      reason: 'Inappropriate avatar display',
      details: 'Audit report filed for investigation dossier check.'
    })
  });
  assert.strictEqual(filedReportRes.status, 201);
  const filedReport = await filedReportRes.json();

  // Admin fetches dossier for Marcus
  const dossierRes = await fetch(`${BASE_URL}/admin/users/usr_marcus/reports`, { headers: calebHeaders });
  assert.strictEqual(dossierRes.status, 200);
  const dossier = await dossierRes.json();
  assert.strictEqual(dossier.user.id, 'usr_marcus');
  assert.ok(dossier.reportsCount >= 1, 'Marcus must have at least 1 incident report on record');
  assert.ok(dossier.reports.some(r => r.id === filedReport.id), 'Dossier must include the newly filed report');
  console.log('   ✓ User incident & report dossier compilation verified.');

  // C. Soft-Moderation & Evidence Vault Retention
  // Create a post in com_01 authored by Dave
  const softPostRes = await fetch(`${BASE_URL}/communities/feed/posts`, {
    method: 'POST',
    headers: daveHeaders,
    body: JSON.stringify({
      communityId: 'com_01',
      content: 'Controversial post subject to evidence vault quarantine.'
    })
  });
  assert.strictEqual(softPostRes.status, 201);
  const softPost = await softPostRes.json();

  // Verify post is in feed initially
  const feedBeforeRes = await fetch(`${BASE_URL}/communities/feed/posts?communityId=com_01`, { headers: authHeaders });
  const feedBefore = await feedBeforeRes.json();
  assert.ok(feedBefore.some(p => p.id === softPost.id), 'Post should initially appear in community feed');

  // Moderator deletes/quarantines post
  const modDeleteRes = await fetch(`${BASE_URL}/communities/feed/posts/${softPost.id}`, {
    method: 'DELETE',
    headers: calebHeaders
  });
  assert.strictEqual(modDeleteRes.status, 200);
  const modDelData = await modDeleteRes.json();
  assert.strictEqual(modDelData.quarantined, true, 'Post must be soft-quarantined rather than deleted');

  // Verify post is now HIDDEN from normal community feed
  const feedAfterRes = await fetch(`${BASE_URL}/communities/feed/posts?communityId=com_01`, { headers: authHeaders });
  const feedAfter = await feedAfterRes.json();
  assert.ok(!feedAfter.some(p => p.id === softPost.id), 'Quarantined post must NOT appear in normal feed');

  // Verify post IS retained in Circle Evidence Vault
  const circleVaultRes = await fetch(`${BASE_URL}/communities/com_01/moderation/vault`, { headers: calebHeaders });
  assert.strictEqual(circleVaultRes.status, 200);
  const circleVault = await circleVaultRes.json();
  const quarantinedPostInCircle = circleVault.find(p => p.id === softPost.id);
  assert.ok(quarantinedPostInCircle, 'Post must be preserved in Circle Evidence Vault');
  assert.strictEqual(quarantinedPostInCircle.isQuarantined, true);
  console.log('   ✓ Soft-moderation quarantine & feed exclusion verified.');

  // D. Public Moderator Evidence Vault Access (Option A requirement)
  // Enable public moderator on Dave or Priya
  db.prepare('UPDATE users SET is_public_moderator = 1 WHERE id = ?').run('usr_priya');
  const priyaData = await loginAs('usr_priya');
  const priyaModHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${priyaData.token}`
  };

  // Public Moderator Priya accesses master vault (which includes circle quarantined posts) -> 200
  const pubModVaultRes = await fetch(`${BASE_URL}/admin/vault`, { headers: priyaModHeaders });
  assert.strictEqual(pubModVaultRes.status, 200, 'Public Moderator must have access to inspect Evidence Vault');
  const pubModVault = await pubModVaultRes.json();
  assert.ok(pubModVault.some(p => p.id === softPost.id), 'Public Moderator must see circle quarantined posts in Evidence Vault');
  console.log('   ✓ Public Moderator Evidence Vault access to circle discussions verified.');

  // E. Vault Post Restoration & Permanent Purge
  // System Admin restores the quarantined post
  const restoreRes = await fetch(`${BASE_URL}/admin/vault/${softPost.id}/restore`, {
    method: 'POST',
    headers: calebHeaders,
    body: JSON.stringify({ reason: 'Appeal accepted, post compliant' })
  });
  assert.strictEqual(restoreRes.status, 200);
  const restoreData = await restoreRes.json();
  assert.strictEqual(restoreData.post.isQuarantined, false);

  // Post is restored back to normal feed
  const feedRestoredRes = await fetch(`${BASE_URL}/communities/feed/posts?communityId=com_01`, { headers: authHeaders });
  const feedRestored = await feedRestoredRes.json();
  assert.ok(feedRestored.some(p => p.id === softPost.id), 'Restored post must reappear in community feed');

  // Quarantine again and then permanently purge
  await fetch(`${BASE_URL}/communities/feed/posts/${softPost.id}`, { method: 'DELETE', headers: calebHeaders });
  const purgeRes = await fetch(`${BASE_URL}/admin/vault/${softPost.id}/purge`, {
    method: 'POST',
    headers: calebHeaders,
    body: JSON.stringify({ reason: 'Confirmed egregious violation' })
  });
  assert.strictEqual(purgeRes.status, 200);
  const rowAfterPurge = db.prepare('SELECT * FROM posts WHERE id = ?').get(softPost.id);
  assert.strictEqual(rowAfterPurge, undefined, 'Purged post must be permanently deleted from SQLite');
  console.log('   ✓ Evidence vault restore and permanent purge verified.');

  // F. Account Restriction System & Write Action Blocking
  // Restrict Marcus
  const restrictRes = await fetch(`${BASE_URL}/users/usr_marcus/restrict`, {
    method: 'POST',
    headers: calebHeaders,
    body: JSON.stringify({ reason: 'Spamming harmful material', notes: 'Temporary administrative suspension' })
  });
  assert.strictEqual(restrictRes.status, 200);
  const restrictedUserData = await restrictRes.json();
  assert.strictEqual(restrictedUserData.user.status, 'restricted');

  // Restricted Marcus attempts to write a post -> 403 Forbidden with reason
  const restrictedWriteRes = await fetch(`${BASE_URL}/communities/feed/posts`, {
    method: 'POST',
    headers: marcusHeaders,
    body: JSON.stringify({
      communityId: 'com_01',
      content: 'Attempted post by restricted user'
    })
  });
  assert.strictEqual(restrictedWriteRes.status, 403, 'Restricted account must be rejected with 403 on write actions');
  const restrictedWriteData = await restrictedWriteRes.json();
  assert.strictEqual(restrictedWriteData.error, 'Account Restricted');
  assert.ok(restrictedWriteData.reason.includes('Spamming harmful material'));

  // Admin reinstates (unrestricts) Marcus
  const unrestrictRes = await fetch(`${BASE_URL}/users/usr_marcus/unrestrict`, {
    method: 'POST',
    headers: calebHeaders,
    body: JSON.stringify({ reason: 'Disciplinary review period concluded' })
  });
  assert.strictEqual(unrestrictRes.status, 200);
  const reinstatedUserData = await unrestrictRes.json();
  assert.strictEqual(reinstatedUserData.user.status, 'active');

  // Marcus can now write successfully
  const marcusWriteRes = await fetch(`${BASE_URL}/communities/feed/posts`, {
    method: 'POST',
    headers: marcusHeaders,
    body: JSON.stringify({
      communityId: 'com_01',
      content: 'Marcus restored post capability'
    })
  });
  assert.strictEqual(marcusWriteRes.status, 201, 'Reinstated account should be able to write again');
  const marcusPost = await marcusWriteRes.json();
  db.prepare('DELETE FROM posts WHERE id = ?').run(marcusPost.id);
  console.log('   ✓ Account restriction enforcement & reinstatement verified.');

  // G. Anti-Spam Write Rate Limiting & Admin Exemption
  // System Admin (calebHeaders) write action gets Unlimited header
  const adminWriteRes = await fetch(`${BASE_URL}/communities/feed/posts`, {
    method: 'POST',
    headers: calebHeaders,
    body: JSON.stringify({
      communityId: 'com_01',
      content: 'Admin write verification'
    })
  });
  assert.strictEqual(adminWriteRes.status, 201);
  assert.strictEqual(adminWriteRes.headers.get('X-RateLimit-Limit'), 'Unlimited', 'System admin must be exempt with Unlimited rate limit');
  const adminTestPost = await adminWriteRes.json();
  db.prepare('DELETE FROM posts WHERE id = ?').run(adminTestPost.id);
  console.log('   ✓ Anti-spam rate limiting & system admin exemption verified.');

  // H. Platform Moderation Audit Trail
  const auditRes = await fetch(`${BASE_URL}/admin/audit-logs`, { headers: calebHeaders });
  assert.strictEqual(auditRes.status, 200);
  const allAudits = await auditRes.json();
  assert.ok(allAudits.length >= 4, 'Audit logs must capture moderation actions');
  assert.ok(allAudits.some(a => a.action_type === 'quarantine_post'), 'Must log quarantine_post');
  assert.ok(allAudits.some(a => a.action_type === 'restore_post'), 'Must log restore_post');
  assert.ok(allAudits.some(a => a.action_type === 'purge_post'), 'Must log purge_post');
  assert.ok(allAudits.some(a => a.action_type === 'restrict_user'), 'Must log restrict_user');
  assert.ok(allAudits.some(a => a.action_type === 'unrestrict_user'), 'Must log unrestrict_user');
  console.log('   ✓ Platform moderation audit trail recording verified.');

  // I. Live Anti-Spam Telemetry & Quota Reset
  const telemetryRes = await fetch(`${BASE_URL}/admin/antispam/telemetry`, { headers: calebHeaders });
  assert.strictEqual(telemetryRes.status, 200, 'Admin telemetry endpoint must return 200');
  const telemetryData = await telemetryRes.json();
  assert.strictEqual(typeof telemetryData.windowSeconds, 'number');
  assert.strictEqual(typeof telemetryData.maxWrites, 'number');
  assert.ok(Array.isArray(telemetryData.trackedClients));
  assert.ok(Array.isArray(telemetryData.restrictedUsers));

  const resetClientRes = await fetch(`${BASE_URL}/admin/antispam/reset-client`, {
    method: 'POST',
    headers: calebHeaders,
    body: JSON.stringify({ clientId: 'all' })
  });
  assert.strictEqual(resetClientRes.status, 200);
  const resetData = await resetClientRes.json();
  assert.strictEqual(resetData.success, true);
  console.log('   ✓ Live anti-spam telemetry & client quota reset verified.\n');

  // Clean up filed report
  db.prepare('DELETE FROM reports WHERE id = ?').run(filedReport.id);

  console.log('🎉 ALL CAREMESH BACKEND TESTS PASSED CLEANLY (24/24)!\n');
}

runTests().catch(err => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
