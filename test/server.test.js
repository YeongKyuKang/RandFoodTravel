const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server'); // server.js를 모듈로 내보내도록 수정해야 합니다

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
  // 서버 연결 종료
  await new Promise(resolve => app.close(resolve));
});

describe('Server API Tests', () => {
  test('GET / - Welcome page', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.text).toContain('Welcome'); // welcome.html의 내용에 따라 수정
  });

  test('POST /signup - User registration', async () => {
    const response = await request(app)
      .post('/signup')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'testpassword'
      });
    expect(response.status).toBe(302); // 리다이렉션 상태 코드
    expect(response.headers.location).toBe('/preferences');
  });

  test('POST /login - User login', async () => {
    const response = await request(app)
      .post('/login')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'testpassword'
      });
    expect(response.status).toBe(302); // 리다이렉션 상태 코드
    expect(response.headers.location).toBe('/preferences');
  });

  test('GET /preferences - Preferences page (authenticated)', async () => {
    const agent = request.agent(app);
    // 먼저 로그인
    await agent
      .post('/login')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'testpassword'
      });
    
    const response = await agent.get('/preferences');
    expect(response.status).toBe(200);
    expect(response.text).toContain('선호도 설정'); // preferences.html의 내용에 따라 수정
  });

  test('POST /searchRestaurants - Search restaurants', async () => {
    const response = await request(app)
      .post('/searchRestaurants')
      .send({
        latitude: 37.5665,
        longitude: 126.9780,
        foodPreference: '한식'
      });
    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBeGreaterThan(0);
  });
});