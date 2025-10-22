'use strict';

// In-memory database for storing issues
const issues = {};

module.exports = function (app) {

  app.route('/api/issues/:project')
  
    .get(function (req, res){
      let project = req.params.project;
      
      if (!issues[project]) {
        return res.json([]);
      }
      
      // Get all issues for the project
      let projectIssues = issues[project].slice();
      
      // Apply filters from query parameters
      const filters = req.query;
      
      if (Object.keys(filters).length > 0) {
        projectIssues = projectIssues.filter(issue => {
          for (let key in filters) {
            // Convert open to boolean for comparison
            if (key === 'open') {
              if (issue[key] !== (filters[key] === 'true')) {
                return false;
              }
            } else if (issue[key] != filters[key]) {
              return false;
            }
          }
          return true;
        });
      }
      
      res.json(projectIssues);
    })
    
    .post(function (req, res){
      let project = req.params.project;
      
      const { issue_title, issue_text, created_by, assigned_to, status_text } = req.body;
      
      // Check required fields
      if (!issue_title || !issue_text || !created_by) {
        return res.json({ error: 'required field(s) missing' });
      }
      
      // Create new issue
      const newIssue = {
        _id: generateId(),
        issue_title,
        issue_text,
        created_by,
        assigned_to: assigned_to || '',
        status_text: status_text || '',
        created_on: new Date().toISOString(),
        updated_on: new Date().toISOString(),
        open: true
      };
      
      // Initialize project array if it doesn't exist
      if (!issues[project]) {
        issues[project] = [];
      }
      
      issues[project].push(newIssue);
      
      res.json(newIssue);
    })
    
    .put(function (req, res){
      let project = req.params.project;
      
      const { _id, issue_title, issue_text, created_by, assigned_to, status_text, open } = req.body;
      
      // Check if _id is provided
      if (!_id) {
        return res.json({ error: 'missing _id' });
      }
      
      // Check if there are fields to update
      const updateFields = { issue_title, issue_text, created_by, assigned_to, status_text, open };
      const hasFieldsToUpdate = Object.values(updateFields).some(value => value !== undefined && value !== '');
      
      if (!hasFieldsToUpdate) {
        return res.json({ error: 'no update field(s) sent', '_id': _id });
      }
      
      // Find the issue
      if (!issues[project]) {
        return res.json({ error: 'could not update', '_id': _id });
      }
      
      const issueIndex = issues[project].findIndex(issue => issue._id === _id);
      
      if (issueIndex === -1) {
        return res.json({ error: 'could not update', '_id': _id });
      }
      
      // Update the issue
      const issue = issues[project][issueIndex];
      
      if (issue_title) issue.issue_title = issue_title;
      if (issue_text) issue.issue_text = issue_text;
      if (created_by) issue.created_by = created_by;
      if (assigned_to !== undefined) issue.assigned_to = assigned_to;
      if (status_text !== undefined) issue.status_text = status_text;
      if (open !== undefined) issue.open = open;
      
      issue.updated_on = new Date().toISOString();
      
      res.json({ result: 'successfully updated', '_id': _id });
    })
    
    .delete(function (req, res){
      let project = req.params.project;
      
      const { _id } = req.body;
      
      // Check if _id is provided
      if (!_id) {
        return res.json({ error: 'missing _id' });
      }
      
      // Find and delete the issue
      if (!issues[project]) {
        return res.json({ error: 'could not delete', '_id': _id });
      }
      
      const issueIndex = issues[project].findIndex(issue => issue._id === _id);
      
      if (issueIndex === -1) {
        return res.json({ error: 'could not delete', '_id': _id });
      }
      
      issues[project].splice(issueIndex, 1);
      
      res.json({ result: 'successfully deleted', '_id': _id });
    });
    
};

// Helper function to generate unique IDs
function generateId() {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}
