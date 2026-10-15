'use strict';

const crypto = require('crypto');

// in-memory storage: { projectName: [issue, ...] }
const projects = {};

const getIssues = (project) => {
  if (!projects[project]) projects[project] = [];
  return projects[project];
};

const newId = () => crypto.randomBytes(12).toString('hex');

module.exports = function (app) {

  app.route('/api/issues/:project')

    // GET: list issues, optionally filtered by any field (?open=true&created_by=Joe)
    .get(function (req, res) {
      let project = req.params.project;
      const filters = req.query;
      const result = getIssues(project).filter(issue =>
        Object.keys(filters).every(key => String(issue[key]) === String(filters[key]))
      );
      res.json(result);
    })

    // POST: create an issue
    .post(function (req, res) {
      let project = req.params.project;
      const { issue_title, issue_text, created_by, assigned_to, status_text } = req.body;

      if (!issue_title || !issue_text || !created_by) {
        return res.json({ error: 'required field(s) missing' });
      }

      const now = new Date();
      const issue = {
        _id: newId(),
        issue_title,
        issue_text,
        created_on: now,
        updated_on: now,
        created_by,
        assigned_to: assigned_to || '',
        open: true,
        status_text: status_text || ''
      };
      getIssues(project).push(issue);
      res.json(issue);
    })

    // PUT: update an issue by _id
    .put(function (req, res) {
      let project = req.params.project;
      const { _id, ...fields } = req.body;

      if (!_id) return res.json({ error: 'missing _id' });

      // keep only fields that were actually sent with a value
      const allowed = ['issue_title', 'issue_text', 'created_by', 'assigned_to', 'status_text', 'open'];
      const updates = {};
      allowed.forEach(key => {
        if (fields[key] !== undefined && fields[key] !== '') updates[key] = fields[key];
      });

      if (Object.keys(updates).length === 0) {
        return res.json({ error: 'no update field(s) sent', _id });
      }

      const issue = getIssues(project).find(i => i._id === _id);
      if (!issue) return res.json({ error: 'could not update', _id });

      if (updates.open !== undefined) {
        updates.open = !(updates.open === false || updates.open === 'false');
      }
      Object.assign(issue, updates, { updated_on: new Date() });
      res.json({ result: 'successfully updated', _id });
    })

    // DELETE: remove an issue by _id
    .delete(function (req, res) {
      let project = req.params.project;
      const { _id } = req.body;

      if (!_id) return res.json({ error: 'missing _id' });

      const issues = getIssues(project);
      const index = issues.findIndex(i => i._id === _id);
      if (index === -1) return res.json({ error: 'could not delete', _id });

      issues.splice(index, 1);
      res.json({ result: 'successfully deleted', _id });
    });

};
