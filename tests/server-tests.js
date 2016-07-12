//test!


var request = require('supertest');

describe('loading express', function () {
  var server;

  beforeEach(function () {
    server = require('../app');
  });

  it('responds to /', function testSlash(done) {
  request(server)
    .get('/')
    .expect(200, done);
  });

  it('responds to /map', function testMap(done) {
  request(server)
    .get('/map')
    .expect(200, done);
  });

  it('responds to /faq', function testFAQ(done) {
  request(server)
    .get('/faq')
    .expect(200, done);
  });
});