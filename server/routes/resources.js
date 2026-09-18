import express from 'express';
import { db } from '../db/database.js';
import { formatUser } from './auth.js';
import { optionalAuth } from '../middleware/auth.js';
import { parsePaginationParams, executePaginatedQuery } from '../utils/pagination.js';
import { isPlatformAdmin } from './communities.js';

const router = express.Router();

export function formatResourceAssignment(row) {
  if (!row) return null;
  const borrowerId = row.borrower_id || row.assigned_by_id;
  const borrowerRow = db.prepare('SELECT * FROM users WHERE id = ?').get(borrowerId);
  const borrower = borrowerRow ? formatUser(borrowerRow) : { id: borrowerId, name: 'Neighbor' };

  const assignedByRow = db.prepare('SELECT * FROM users WHERE id = ?').get(row.assigned_by_id);
  const assignedBy = assignedByRow ? formatUser(assignedByRow) : borrower;

  let request = null;
  if (row.request_id) {
    const reqRow = db.prepare('SELECT id, title, urgency, category FROM requests WHERE id = ?').get(row.request_id);
    if (reqRow) request = reqRow;
  }

  return {
    id: row.id,
    requestId: row.request_id,
    projectId: row.project_id,
    resourceId: row.resource_id,
    assignedById: row.assigned_by_id,
    assignedBy,
    borrowerId,
    borrower,
    purpose: row.purpose || (request ? request.title : 'Direct Resource Loan'),
    startDate: row.start_date || '',
    dueDate: row.due_date || '',
    returnDate: row.return_date || null,
    returnCondition: row.return_condition || null,
    requestedQuantity: row.requested_quantity || '',
    termsAccepted: Boolean(row.terms_accepted),
    status: row.status, // 'proposed' | 'accepted' | 'in_transit' | 'completed' | 'cancelled'
    notes: row.notes || '',
    assignedAt: row.assigned_at,
    request
  };
}

export function formatResource(row) {
  if (!row) return null;

  const providerRow = db.prepare('SELECT * FROM users WHERE id = ?').get(row.provider_id);
  const provider = providerRow ? formatUser(providerRow) : { id: row.provider_id, name: 'Anonymous' };

  // Find all assignments/loans for this resource
  const asgnRows = db.prepare('SELECT * FROM resource_assignments WHERE resource_id = ? ORDER BY assigned_at DESC').all(row.id);
  const assignments = asgnRows.map(formatResourceAssignment);

  // Derive dynamic loan custody metrics
  const activeLoan = assignments.find(a => a.status === 'accepted' || a.status === 'in_transit') || null;
  const pendingRequests = assignments.filter(a => a.status === 'proposed');
  const loanHistory = assignments.filter(a => a.status === 'completed' || a.status === 'cancelled');

  let loanStatus = 'available';
  if (activeLoan) {
    loanStatus = 'on_loan';
  } else if (pendingRequests.length > 0) {
    loanStatus = 'pending_approval';
  }

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    contributionType: row.contribution_type,
    provider,
    providerId: row.provider_id,
    location: {
      address: row.address,
      lat: row.lat,
      lng: row.lng
    },
    availability: row.availability,
    quantity: (row.quantity !== null && row.quantity !== '' && !isNaN(Number(row.quantity))) ? Number(row.quantity) : row.quantity,
    condition: row.condition,
    conditionsTerms: row.conditions_terms,
    validUntil: row.valid_until,
    linkedRequestIds: assignments.map(a => a.requestId).filter(Boolean),
    assignments,
    activeLoan,
    pendingRequests,
    loanHistory,
    loanStatus // 'available' | 'on_loan' | 'pending_approval'
  };
}

// GET /api/resources
router.get('/', (req, res) => {
  const { isPaginated, page, limit } = parsePaginationParams(req.query);
  const { category, status } = req.query;
  const whereClauses = [];
  const params = [];

  if (category) {
    whereClauses.push('category = ?');
    params.push(category);
  }
  if (status) {
    whereClauses.push('status = ?');
    params.push(status);
  }

  const whereSql = whereClauses.length > 0 ? ` WHERE ${whereClauses.join(' AND ')}` : '';
  const countSql = `SELECT COUNT(*) FROM resources${whereSql}`;
  const dataSql = `SELECT * FROM resources${whereSql} ORDER BY created_at DESC`;

  if (isPaginated) {
    const result = executePaginatedQuery(db, {
      countSql,
      countParams: params,
      dataSql,
      dataParams: params,
      page,
      limit,
      formatter: formatResource
    });
    return res.json(result);
  }

  const rows = db.prepare(dataSql).all(...params);
  res.json(rows.map(formatResource));
});

// GET /api/resources/:id
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM resources WHERE id = ?').get(req.params.id);
  if (!row) {
    return res.status(404).json({ error: 'Resource not found' });
  }
  res.json(formatResource(row));
});

// POST /api/resources
router.post('/', optionalAuth, (req, res) => {
  const {
    title,
    description,
    category,
    contributionType,
    location,
    availability = 'immediate',
    quantity = '',
    condition = '',
    conditionsTerms = '',
    validUntil = ''
  } = req.body;

  if (!title || !description || !category || !contributionType) {
    return res.status(400).json({ error: 'Title, description, category, and contributionType are required.' });
  }

  const providerId = req.user?.id || req.body?.providerId;
  if (!providerId) {
    return res.status(401).json({ error: 'Authentication required to offer a resource.' });
  }

  const id = req.body?.id || `res_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  db.prepare(`
    INSERT INTO resources (id, title, description, category, contribution_type, provider_id, address, lat, lng, availability, quantity, condition, conditions_terms, valid_until)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    title,
    description,
    category,
    contributionType,
    providerId,
    location?.address || 'Maplewood Local Area',
    location?.lat || 37.7749,
    location?.lng || -122.4194,
    availability,
    quantity,
    condition,
    conditionsTerms,
    validUntil
  );

  const created = formatResource(db.prepare('SELECT * FROM resources WHERE id = ?').get(id));
  res.status(201).json(created);
});

// PATCH /api/resources/:id
router.patch('/:id', optionalAuth, (req, res) => {
  const userId = req.user?.id || req.body?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required to edit a resource.' });
  }
  const resource = db.prepare('SELECT * FROM resources WHERE id = ?').get(req.params.id);
  if (!resource) {
    return res.status(404).json({ error: 'Resource not found' });
  }

  const user = req.user || db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  const isOwner = resource.provider_id === userId;

  if (!isOwner && !isPlatformAdmin(user)) {
    return res.status(403).json({ error: 'Only the provider or an administrator can edit this resource.' });
  }

  const {
    title = resource.title,
    description = resource.description,
    category = resource.category,
    contributionType = resource.contribution_type,
    availability = resource.availability,
    quantity = resource.quantity,
    condition = resource.condition,
    conditionsTerms = resource.conditions_terms,
    validUntil = resource.valid_until
  } = req.body;

  db.prepare(`
    UPDATE resources
    SET title = ?, description = ?, category = ?, contribution_type = ?, availability = ?, quantity = ?, condition = ?, conditions_terms = ?, valid_until = ?
    WHERE id = ?
  `).run(title, description, category, contributionType, availability, quantity, condition, conditionsTerms, validUntil, req.params.id);

  res.json(formatResource(db.prepare('SELECT * FROM resources WHERE id = ?').get(req.params.id)));
});

// POST /api/resources/:id/request-use
// Submits a formal borrow/loan request for an item
router.post('/:id/request-use', optionalAuth, (req, res) => {
  const resource = db.prepare('SELECT * FROM resources WHERE id = ?').get(req.params.id);
  if (!resource) {
    return res.status(404).json({ error: 'Resource not found' });
  }

  const borrowerId = req.user?.id || req.body?.borrowerId;
  if (!borrowerId) {
    return res.status(401).json({ error: 'Authentication required to borrow a resource.' });
  }

  // 1. Provider cannot borrow their own resource
  if (resource.provider_id === borrowerId) {
    return res.status(400).json({ error: 'You cannot borrow your own resource.' });
  }

  // 2. Cannot submit duplicate active/pending loan requests
  const existingActiveLoan = db.prepare(`
    SELECT id FROM resource_assignments
    WHERE resource_id = ? AND borrower_id = ? AND status IN ('proposed', 'approved', 'on_loan', 'in_transit')
  `).get(resource.id, borrowerId);
  if (existingActiveLoan) {
    return res.status(400).json({ error: 'You already have an active or pending loan request for this resource.' });
  }

  const borrowerRow = db.prepare('SELECT * FROM users WHERE id = ?').get(borrowerId);
  const borrower = borrowerRow ? formatUser(borrowerRow) : { id: borrowerId, name: 'Neighbor' };

  const {
    requestId = null,
    projectId = null,
    purpose = '',
    startDate = '',
    dueDate = '',
    requestedQuantity = '',
    notes = '',
    termsAccepted = true
  } = req.body;

  const id = `asgn_${Date.now()}`;
  const initialStatus = 'proposed';

  const tx = db.transaction(() => {
    // 1. Create assignment record
    db.prepare(`
      INSERT INTO resource_assignments (
        id, request_id, project_id, resource_id, assigned_by_id, borrower_id,
        purpose, start_date, due_date, requested_quantity, terms_accepted,
        status, notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      requestId || null,
      projectId || null,
      resource.id,
      borrowerId,
      borrowerId,
      purpose || (requestId ? 'Help Request Resource Match' : 'Equipment Loan Request'),
      startDate,
      dueDate,
      requestedQuantity || resource.quantity || '1',
      termsAccepted ? 1 : 0,
      initialStatus,
      notes
    );

    // 2. Dispatch notification to resource provider
    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, body, timestamp, is_read, target_view, target_sub_tab, target_entity_id)
      VALUES (?, ?, 'resource_loan_request', 'New Resource Loan Request', ?, 'Just now', 0, 'collaborate', 'resources', ?)
    `).run(
      `notif_${Date.now()}`,
      resource.provider_id,
      `${borrower.name} submitted a request to borrow "${resource.title}"${dueDate ? ` until ${dueDate}` : ''}.`,
      resource.id
    );

    // 3. Initiate or update direct conversation
    const initialMsg = `Hi! I submitted a request to borrow "${resource.title}"${dueDate ? ` until ${dueDate}` : ''}. Purpose: ${purpose || notes || 'Neighborhood collaboration'}. Looking forward to coordinating!`;
    const existingConvo = db.prepare(`
      SELECT * FROM conversations
      WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)
    `).get(borrowerId, resource.provider_id, resource.provider_id, borrowerId);

    if (!existingConvo) {
      const convoId = `conv_${Date.now()}_${borrowerId.replace('usr_', '')}`;
      db.prepare(`
        INSERT INTO conversations (id, user1_id, user2_id, title, subtitle, last_message, last_time, unread_count)
        VALUES (?, ?, ?, ?, ?, ?, 'Just now', 1)
      `).run(convoId, borrowerId, resource.provider_id, resource.title, `Loan Coordination: ${resource.title}`, initialMsg);

      db.prepare(`
        INSERT INTO direct_messages (id, conversation_id, sender_id, text, timestamp)
        VALUES (?, ?, ?, ?, 'Just now')
      `).run(`dm_${Date.now()}`, convoId, borrowerId, initialMsg);
    } else {
      db.prepare(`
        INSERT INTO direct_messages (id, conversation_id, sender_id, text, timestamp)
        VALUES (?, ?, ?, ?, 'Just now')
      `).run(`dm_${Date.now()}`, existingConvo.id, borrowerId, initialMsg);

      db.prepare(`
        UPDATE conversations
        SET last_message = ?, last_time = 'Just now', unread_count = unread_count + 1
        WHERE id = ?
      `).run(initialMsg, existingConvo.id);
    }
  });

  tx();

  const createdAssignment = formatResourceAssignment(db.prepare('SELECT * FROM resource_assignments WHERE id = ?').get(id));
  const updatedResource = formatResource(db.prepare('SELECT * FROM resources WHERE id = ?').get(resource.id));

  res.status(201).json({
    success: true,
    assignment: createdAssignment,
    resource: updatedResource
  });
});

// GET /api/resources/:id/loans
router.get('/:id/loans', (req, res) => {
  const rows = db.prepare('SELECT * FROM resource_assignments WHERE resource_id = ? ORDER BY assigned_at DESC').all(req.params.id);
  res.json(rows.map(formatResourceAssignment));
});

// PATCH /api/resources/assignments/:assignmentId/status
// Handles provider approve/decline, borrower return, and provider return confirmation
router.patch('/assignments/:assignmentId/status', optionalAuth, (req, res) => {
  const assignment = db.prepare('SELECT * FROM resource_assignments WHERE id = ?').get(req.params.assignmentId);
  if (!assignment) {
    return res.status(404).json({ error: 'Loan assignment not found' });
  }

  const resource = db.prepare('SELECT * FROM resources WHERE id = ?').get(assignment.resource_id);
  const currentUserId = req.user ? req.user.id : (req.body.userId || 'usr_me');

  const { status, returnCondition = '', notes = '' } = req.body;
  if (!status || !['accepted', 'in_transit', 'completed', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Valid status (accepted, in_transit, completed, cancelled) is required.' });
  }

  const tx = db.transaction(() => {
    if (status === 'completed') {
      db.prepare(`
        UPDATE resource_assignments
        SET status = ?, return_date = CURRENT_TIMESTAMP, return_condition = ?, notes = CASE WHEN ? != '' THEN ? ELSE notes END
        WHERE id = ?
      `).run(status, returnCondition || 'Good / Returned Clean', notes, notes, assignment.id);
    } else {
      db.prepare(`
        UPDATE resource_assignments
        SET status = ?, notes = CASE WHEN ? != '' THEN ? ELSE notes END
        WHERE id = ?
      `).run(status, notes, notes, assignment.id);
    }

    // Status-specific notifications
    const targetUserId = (currentUserId === resource.provider_id) ? (assignment.borrower_id || assignment.assigned_by_id) : resource.provider_id;
    let notifTitle = '';
    let notifBody = '';

    if (status === 'accepted') {
      notifTitle = 'Loan Request Approved';
      notifBody = `Your request to borrow "${resource.title}" was accepted. Coordinate pickup with the provider!`;
    } else if (status === 'cancelled') {
      notifTitle = 'Loan Request Declined';
      notifBody = `The loan request for "${resource.title}" could not be accommodated at this time.`;
    } else if (status === 'in_transit') {
      notifTitle = 'Item Return Initiated';
      notifBody = `The borrower has marked "${resource.title}" as returned. Please inspect and confirm return condition.`;
    } else if (status === 'completed') {
      notifTitle = 'Item Return Confirmed';
      notifBody = `Return verified for "${resource.title}" (${returnCondition || 'Good Condition'}). Thank you for responsible lending!`;
    }

    if (notifTitle && targetUserId) {
      db.prepare(`
        INSERT INTO notifications (id, user_id, type, title, body, timestamp, is_read, target_view, target_sub_tab, target_entity_id)
        VALUES (?, ?, 'resource_loan_update', ?, ?, 'Just now', 0, 'collaborate', 'resources', ?)
      `).run(`notif_${Date.now()}`, targetUserId, notifTitle, notifBody, resource.id);
    }
  });

  tx();

  const updatedAssignment = formatResourceAssignment(db.prepare('SELECT * FROM resource_assignments WHERE id = ?').get(assignment.id));
  const updatedResource = formatResource(db.prepare('SELECT * FROM resources WHERE id = ?').get(resource.id));

  res.json({
    success: true,
    assignment: updatedAssignment,
    resource: updatedResource
  });
});

// DELETE /api/resources/:id
router.delete('/:id', optionalAuth, (req, res) => {
  const userId = req.user ? req.user.id : (req.query.userId || req.body?.userId);
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required to delete a resource.' });
  }
  const resource = db.prepare('SELECT * FROM resources WHERE id = ?').get(req.params.id);
  if (!resource) {
    return res.status(404).json({ error: 'Resource not found' });
  }

  const user = req.user || db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  const isOwner = resource.provider_id === userId;

  if (!isOwner && !isPlatformAdmin(user)) {
    return res.status(403).json({ error: 'Only the resource provider or an administrator can delete this resource.' });
  }

  const tx = db.transaction(() => {
    db.prepare('DELETE FROM resource_assignments WHERE resource_id = ?').run(req.params.id);
    db.prepare('DELETE FROM resources WHERE id = ?').run(req.params.id);
  });
  tx();

  res.json({ success: true, id: req.params.id });
});

export default router;
