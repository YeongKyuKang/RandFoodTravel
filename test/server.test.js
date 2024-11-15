const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server'); // Make sure to export the app in server.js
const { faker } = require('@faker-js/faker');


let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
  
    // mongoose.connect()를 한 번만 호출하여 연결을 유지합니다.
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    }
    server = app.listen(3000);
  });
afterAll(async () => {
  await mongoose.disconnect();  // MongoDB 연결 종료
  await mongoServer.stop();     // MongoMemoryServer 종료
  await new Promise(resolve => server.close(resolve)); // 앱 종료
});
describe('Server Routes', () => {
  test('GET / - Welcome page', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.text).toContain('랜덤 음식점 추천');
  });

  test('GET /signup - Signup page', async () => {
    const response = await request(app).get('/signup');
    expect(response.status).toBe(200);
    expect(response.text).toContain('회원가입');
  });

  test('GET /login - Login page', async () => {
    const response = await request(app).get('/login');
    expect(response.status).toBe(200);
    expect(response.text).toContain('로그인');
  });

  test('GET /preferences - Preferences page (authenticated)', async () => {
    const agent = request.agent(app);
    // First, create a user and log in
    const userData = {
      username: faker.internet.username(),
      email: faker.internet.email(),
      password: 'testpassword',
    };
    await agent.post('/signup').send(userData);
    const response = await agent.get('/preferences');
    expect(response.status).toBe(200);
    expect(response.text).toContain('어떤 음식을 랜덤으로 골라드릴까요?');
  });
  test('POST /signup - User registration', async () => {
    const userData = {
      username: faker.internet.username(),
      email: faker.internet.email(),
      password: 'testpassword',
    };

    const response = await request(app)
      .post('/signup')
      .send(userData);

    expect(response.status).toBe(302);  // 리다이렉트 상태 코드 확인
    expect(response.headers.location).toBe('/preferences');
  });
  test('GET /invalidAccess - Invalid access page', async () => {
    const response = await request(app).get('/invalidAccess');
    expect(response.status).toBe(200);
    expect(response.text).toContain('잘못된 접근입니다');
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
  });
});
