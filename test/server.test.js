const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server'); // Make sure to export the app in server.js

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
  await new Promise(resolve => app.close(resolve));
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
    await agent.post('/signup').send({
      username: 'testuser',
      email: 'test@example.com',
      password: 'testpassword'
    });
    const response = await agent.get('/preferences');
    expect(response.status).toBe(200);
    expect(response.text).toContain('어떤 음식을 랜덤으로 골라드릴까요?');
  });

  test('POST /signup - User registration', async () => {
    const response = await request(app)
      .post('/signup')
      .send({
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'newpassword'
      });
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/preferences');
  });

  test('POST /login - User login', async () => {
    // First, create a user
    await request(app)
      .post('/signup')
      .send({
        username: 'loginuser',
        email: 'loginuser@example.com',
        password: 'loginpassword'
      });

    const response = await request(app)
      .post('/login')
      .send({
        username: 'loginuser',
        email: 'loginuser@example.com',
        password: 'loginpassword'
      });
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/preferences');
  });

  test('GET /invalidAccess - Invalid access page', async () => {
    const response = await request(app).get('/invalidAccess');
    expect(response.status).toBe(200);
    expect(response.text).toContain('잘못된 접근입니다');
  });

  test('GET /getUsername - Get username (authenticated)', async () => {
    const agent = request.agent(app);
    // First, create a user and log in
    await agent.post('/signup').send({
      username: 'usernameuser',
      email: 'usernameuser@example.com',
      password: 'usernamepassword'
    });
    const response = await agent.get('/getUsername');
    expect(response.status).toBe(200);
    expect(response.text).toBe('usernameuser');
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