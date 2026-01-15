import request from 'supertest';
import app from '../server/app.js';
describe('API Health Check', () => {
  it('should return 200 OK', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
  });
});