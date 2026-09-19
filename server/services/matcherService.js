import { db } from '../db/database.js';

/**
 * Calculates great-circle distance between two points in miles using Haversine formula
 */
function calculateDistanceMiles(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 3958.8; // Radius of the Earth in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Evaluates a single Project/Help Request against a single Resource
 * Returns structured, explainable factor analysis
 */
export function evaluateMatch(request, resource) {
  const factors = [];
  let passCount = 0;
  let warnCount = 0;
  let failCount = 0;

  const reqSkills = typeof request.required_skills === 'string' ? JSON.parse(request.required_skills || '[]') : (request.requiredSkills || []);
  const reqResources = typeof request.required_resources === 'string' ? JSON.parse(request.required_resources || '[]') : (request.requiredResources || []);
  
  // Provider info
  const provider = typeof resource.provider === 'object' && resource.provider !== null
    ? resource.provider
    : db.prepare('SELECT * FROM users WHERE id = ?').get(resource.provider_id || resource.providerId);
  const providerSkills = provider ? (typeof provider.skills === 'string' ? JSON.parse(provider.skills || '[]') : (provider.skills || [])) : [];

  // 1. Location & Proximity Factor
  const reqLat = request.lat || request.location?.lat;
  const reqLng = request.lng || request.location?.lng;
  const resLat = resource.lat || resource.location?.lat;
  const resLng = resource.lng || resource.location?.lng;

  const distance = calculateDistanceMiles(reqLat, reqLng, resLat, resLng);
  if (distance !== null) {
    if (distance <= 3.0) {
      factors.push({
        label: 'Location Proximity',
        status: 'pass',
        text: `Within ${distance} miles (${resource.address || resource.location?.address || 'Maplewood'})`,
        explanation: 'Resource is staged within immediate 3-mile neighborhood radius.'
      });
      passCount++;
    } else if (distance <= 8.0) {
      factors.push({
        label: 'Location Proximity',
        status: 'warn',
        text: `${distance} miles away (transit time ~15-20 min)`,
        explanation: 'Resource is outside immediate walking radius but accessible via standard transport.'
      });
      warnCount++;
    } else {
      factors.push({
        label: 'Location Proximity',
        status: 'fail',
        text: `${distance} miles away (exceeds preferred regional boundary)`,
        explanation: 'Resource is located too far for emergency response timing.'
      });
      failCount++;
    }
  } else {
    factors.push({
      label: 'Location Proximity',
      status: 'pass',
      text: 'Regional Maplewood Corridor',
      explanation: 'General area coordination without rigid GPS boundary.'
    });
    passCount++;
  }

  // 2. Category & Specification Compatibility
  const reqCategory = (request.category || '').toLowerCase();
  const resCategory = (resource.category || '').toLowerCase();
  const resTitle = (resource.title || '').toLowerCase();
  const resDesc = (resource.description || '').toLowerCase();

  const categoryMatch = reqCategory === resCategory || 
    (reqCategory === 'transport' && (resCategory === 'transport' || resCategory === 'equipment')) ||
    (reqCategory === 'labor' && (resCategory === 'skills' || resCategory === 'equipment')) ||
    (reqCategory === 'supplies' && resCategory === 'supplies') ||
    (reqCategory === 'equipment' && resCategory === 'equipment');

  if (categoryMatch) {
    factors.push({
      label: 'Category Alignment',
      status: 'pass',
      text: `${resource.category?.toUpperCase()} matching ${request.category?.toUpperCase()}`,
      explanation: 'Resource type aligns with the requested domain.'
    });
    passCount++;
  } else {
    factors.push({
      label: 'Category Alignment',
      status: 'warn',
      text: `Resource is ${resCategory} for ${reqCategory} request`,
      explanation: 'Cross-functional support may apply.'
    });
    warnCount++;
  }

  // 3. Equipment & Specification Fit
  if (reqResources.length > 0) {
    const matchedSpecs = reqResources.filter(spec => 
      resTitle.includes(spec.toLowerCase()) || 
      resDesc.includes(spec.toLowerCase()) ||
      (resource.condition && resource.condition.toLowerCase().includes(spec.toLowerCase()))
    );
    if (matchedSpecs.length > 0) {
      factors.push({
        label: 'Specification Fit',
        status: 'pass',
        text: `Matches requested: ${matchedSpecs.join(', ')}`,
        explanation: 'Offered equipment contains required technical specifications.'
      });
      passCount++;
    } else {
      factors.push({
        label: 'Specification Fit',
        status: 'warn',
        text: `Offered: ${resource.quantity || resource.title}`,
        explanation: 'Resource is functional substitute; check specific model fit.'
      });
      warnCount++;
    }
  }

  // 4. Skills & Certification Verification
  if (reqSkills.length > 0) {
    const verifiedSkills = reqSkills.filter(skill => 
      providerSkills.some(ps => ps.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(ps.toLowerCase())) ||
      resDesc.includes(skill.toLowerCase())
    );

    if (verifiedSkills.length === reqSkills.length) {
      factors.push({
        label: 'Skill & Certification Fit',
        status: 'pass',
        text: `All ${verifiedSkills.length} requested skills verified (${verifiedSkills.join(', ')})`,
        explanation: 'Provider profile contains verified certifications matching project requirements.'
      });
      passCount++;
    } else if (verifiedSkills.length > 0) {
      factors.push({
        label: 'Skill & Certification Fit',
        status: 'warn',
        text: `${verifiedSkills.length} of ${reqSkills.length} skills verified (${verifiedSkills.join(', ')})`,
        explanation: 'Partial skill coverage available; pairing with another volunteer recommended.'
      });
      warnCount++;
    } else {
      factors.push({
        label: 'Skill & Certification Fit',
        status: 'warn',
        text: 'General volunteer capability (unverified specific credential)',
        explanation: 'Volunteer is willing to assist with on-site briefing.'
      });
      warnCount++;
    }
  }

  // 5. Quantity & Capacity Alignment
  const reqPeople = request.people_needed || request.peopleNeeded || 1;
  if (resource.quantity) {
    factors.push({
      label: 'Capacity / Quantity',
      status: 'pass',
      text: `${resource.quantity} available (Need: ${reqPeople})`,
      explanation: 'Offered capacity meets or exceeds current requirement count.'
    });
    passCount++;
  }

  // 6. Availability & Timing
  const availability = (resource.availability || '').toLowerCase();
  if (availability === 'immediate') {
    factors.push({
      label: 'Availability & Timing',
      status: 'pass',
      text: 'Immediate on-site availability',
      explanation: 'Resource is staged and ready for immediate deployment.'
    });
    passCount++;
  } else if (availability === 'scheduled') {
    factors.push({
      label: 'Availability & Timing',
      status: 'warn',
      text: `Scheduled availability: ${resource.conditions_terms || resource.conditionsTerms || 'Time sync required'}`,
      explanation: 'Requires coordinator time synchronization.'
    });
    warnCount++;
  } else {
    factors.push({
      label: 'Availability & Timing',
      status: 'pass',
      text: 'On-call coordinator dispatch',
      explanation: 'Provider is available on call.'
    });
    passCount++;
  }

  // Match Status Synthesis
  let status = 'Ready to Coordinate';
  if (failCount > 0) {
    status = 'Low Compatibility';
  } else if (warnCount > 1) {
    status = 'Compatible with Warnings';
  }

  // Summary explanation
  const passLabels = factors.filter(f => f.status === 'pass').map(f => f.label);
  const warnLabels = factors.filter(f => f.status === 'warn').map(f => f.label);
  let summaryExplanation = `Suggested because ${passLabels.slice(0, 3).join(', ')} match project requirements.`;
  if (warnLabels.length > 0) {
    summaryExplanation += ` Note: ${warnLabels.join(', ')} require human review.`;
  }

  const matchId = `match_${request.id}_${resource.id}`;
  let endorsements;
  try {
    const endRows = db.prepare('SELECT user_id FROM match_endorsements WHERE match_id = ?').all(matchId);
    endorsements = endRows.map(r => r.user_id);
  } catch {
    endorsements = [];
  }

  return {
    id: matchId,
    requestId: request.id,
    resourceId: resource.id,
    requestTitle: request.title,
    resourceTitle: resource.title,
    status,
    passCount,
    warnCount,
    failCount,
    factors,
    summaryExplanation,
    endorsements,
    endorsementCount: endorsements.length
  };
}

/**
 * Recalculates all transparent matching factor evaluations for open requests
 */
export function recalculateAllMatches() {
  const requests = db.prepare(`SELECT * FROM requests WHERE status IN ('open', 'partially_fulfilled')`).all();
  const resources = db.prepare(`SELECT * FROM resources`).all();

  const evaluations = [];

  for (const req of requests) {
    for (const res of resources) {
      // Fast heuristic pre-filter before detailed factor evaluation
      const reqCat = (req.category || '').toLowerCase();
      const resCat = (res.category || '').toLowerCase();
      const related = 
        reqCat === resCat ||
        (reqCat === 'transport' && (resCat === 'transport' || resCat === 'equipment')) ||
        (reqCat === 'labor' && (resCat === 'skills' || resCat === 'equipment')) ||
        (reqCat === 'supplies' && resCat === 'supplies') ||
        (reqCat === 'equipment' && resCat === 'equipment');

      if (related) {
        const evaluation = evaluateMatch(req, res);
        if (evaluation.status !== 'Low Compatibility') {
          evaluations.push(evaluation);
        }
      }
    }
  }

  // Sort by highest endorsement count, then pass count & lowest warn count
  return evaluations.sort((a, b) => 
    b.endorsementCount - a.endorsementCount || 
    b.passCount - a.passCount || 
    a.warnCount - b.warnCount
  );
}
