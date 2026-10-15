const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

const project = 'fcc-functional-tests';
let id1; // issue created with every field
let id2; // issue created with only required fields

suite('Functional Tests', function () {

  // ---------- POST ----------
  test('Create an issue with every field: POST request to /api/issues/{project}', function (done) {
    chai.request(server)
      .post('/api/issues/' + project)
      .send({
        issue_title: 'Title',
        issue_text: 'Text',
        created_by: 'Tester',
        assigned_to: 'Dev',
        status_text: 'In QA'
      })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.body.issue_title, 'Title');
        assert.equal(res.body.issue_text, 'Text');
        assert.equal(res.body.created_by, 'Tester');
        assert.equal(res.body.assigned_to, 'Dev');
        assert.equal(res.body.status_text, 'In QA');
        assert.isTrue(res.body.open);
        assert.property(res.body, '_id');
        assert.property(res.body, 'created_on');
        assert.property(res.body, 'updated_on');
        id1 = res.body._id;
        done();
      });
  });

  test('Create an issue with only required fields: POST request to /api/issues/{project}', function (done) {
    chai.request(server)
      .post('/api/issues/' + project)
      .send({ issue_title: 'Title 2', issue_text: 'Text 2', created_by: 'Tester' })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.body.issue_title, 'Title 2');
        assert.equal(res.body.assigned_to, '');
        assert.equal(res.body.status_text, '');
        assert.isTrue(res.body.open);
        id2 = res.body._id;
        done();
      });
  });

  test('Create an issue with missing required fields: POST request to /api/issues/{project}', function (done) {
    chai.request(server)
      .post('/api/issues/' + project)
      .send({ issue_title: 'Only a title' })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { error: 'required field(s) missing' });
        done();
      });
  });

  // ---------- GET ----------
  test('View issues on a project: GET request to /api/issues/{project}', function (done) {
    chai.request(server)
      .get('/api/issues/' + project)
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.isArray(res.body);
        assert.isAtLeast(res.body.length, 2);
        done();
      });
  });

  test('View issues on a project with one filter: GET request to /api/issues/{project}', function (done) {
    chai.request(server)
      .get('/api/issues/' + project)
      .query({ assigned_to: 'Dev' })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.isArray(res.body);
        res.body.forEach(issue => assert.equal(issue.assigned_to, 'Dev'));
        done();
      });
  });

  test('View issues on a project with multiple filters: GET request to /api/issues/{project}', function (done) {
    chai.request(server)
      .get('/api/issues/' + project)
      .query({ created_by: 'Tester', open: true })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.isArray(res.body);
        res.body.forEach(issue => {
          assert.equal(issue.created_by, 'Tester');
          assert.isTrue(issue.open);
        });
        done();
      });
  });

  // ---------- PUT ----------
  test('Update one field on an issue: PUT request to /api/issues/{project}', function (done) {
    chai.request(server)
      .put('/api/issues/' + project)
      .send({ _id: id1, issue_text: 'Updated text' })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { result: 'successfully updated', _id: id1 });
        done();
      });
  });

  test('Update multiple fields on an issue: PUT request to /api/issues/{project}', function (done) {
    chai.request(server)
      .put('/api/issues/' + project)
      .send({ _id: id1, issue_title: 'New title', open: false })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { result: 'successfully updated', _id: id1 });
        done();
      });
  });

  test('Update an issue with missing _id: PUT request to /api/issues/{project}', function (done) {
    chai.request(server)
      .put('/api/issues/' + project)
      .send({ issue_text: 'No id' })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { error: 'missing _id' });
        done();
      });
  });

  test('Update an issue with no fields to update: PUT request to /api/issues/{project}', function (done) {
    chai.request(server)
      .put('/api/issues/' + project)
      .send({ _id: id1 })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { error: 'no update field(s) sent', _id: id1 });
        done();
      });
  });

  test('Update an issue with an invalid _id: PUT request to /api/issues/{project}', function (done) {
    chai.request(server)
      .put('/api/issues/' + project)
      .send({ _id: 'invalid_id_123', issue_text: 'Nope' })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { error: 'could not update', _id: 'invalid_id_123' });
        done();
      });
  });

  // ---------- DELETE ----------
  test('Delete an issue: DELETE request to /api/issues/{project}', function (done) {
    chai.request(server)
      .delete('/api/issues/' + project)
      .send({ _id: id2 })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { result: 'successfully deleted', _id: id2 });
        done();
      });
  });

  test('Delete an issue with an invalid _id: DELETE request to /api/issues/{project}', function (done) {
    chai.request(server)
      .delete('/api/issues/' + project)
      .send({ _id: 'invalid_id_123' })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { error: 'could not delete', _id: 'invalid_id_123' });
        done();
      });
  });

  test('Delete an issue with missing _id: DELETE request to /api/issues/{project}', function (done) {
    chai.request(server)
      .delete('/api/issues/' + project)
      .send({})
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { error: 'missing _id' });
        done();
      });
  });

});
