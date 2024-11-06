require('dotenv').config(); // dotenv 패키지를 사용하여 .env 파일 로드
const express = require('express');
const cors = require('cors'); // cors 모듈 추가
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const session = require('express-session');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const axios = require('axios');
const querystring = require('querystring');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
// MongoDB 연결
// MongoDB 연결
const mongoURI = process.env.mongodbURI;
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB에 연결되었습니다.'))
    .catch(err => console.error('MongoDB 연결 오류:', err));
// 미들웨어 설정
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(cors());// 모든 출처의 요청을 허용하는 CORS 설정
app.use(bodyParser.json());
app.use(express.json());
app.use(cookieParser()); // 쿠키 파서 미들웨어 추가
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
}));

// 사용자 스키마 정의
const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    preferences: String
});

const User = mongoose.model('User', userSchema);

//환경변수
const clientId = process.env.clientId;
const clientSecret = process.env.clientSecret;
const APIKey = process.env.APIKey;
const APIKeySecret = process.env.APIKeySecret;

// 세션을 확인하여 로그인되지 않은 사용자에게 /invalidAccess로 리디렉션
function isLoggedIn(req, res, next) {
    if (req.cookies.user && req.session.user) {
        return next();
    } else {
        res.redirect('/invalidAccess');
    }
}

// 루트 경로 처리
app.get('/', (req, res) => {
    if (req.cookies.user && req.session.user) {
        res.redirect('/preferences'); // 세션에 정보가 있으면 preferences 페이지로 리디렉션
    } else {
        res.sendFile(__dirname + '/public/welcome.html'); // 쿠키에 정보가 없으면 welcome 페이지로 이동
    }
});

app.get('/env',(req,res)=>{
    console.log(APIKey);
    res.json({ ncpClientId: APIKey });
})
// 회원가입 페이지 라우트
app.get('/signup', (req, res) => {
    res.sendFile(__dirname + '/public/signUp.html');
});

// 회원가입 처리 라우트
app.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;
    const isExisitngUser = await checkDuplicateUser(username);
    const isExisitngEmail = await checkDuplicateEmail(email);
    if (isExisitngUser && isExisitngEmail) {
        res.status(400).send('duplicatedUsername');
    }
    else {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();
        req.session.user = newUser; // 사용자가 회원가입하면 세션에 사용자 저장
        res.cookie('user', newUser, { maxAge: 900000, httpOnly: true }); // 쿠키 설정
        setUserName(req, username); // 사용자 이름 설정
        res.redirect('/preferences'); // 선호도 설정 페이지로 리다이렉트
    }
});

// 로그인 페이지 라우트
app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/public/login.html');
});

// 로그인 처리 라우트
app.post('/login', async (req, res) => {
    const { username, email, password } = req.body;
    const isExisitngUser = await checkDuplicateUser(username);
    const isExisitngEmail = await checkDuplicateEmail(email);
    const isExistingPassword = await checkPassword(username, password);

    if (isExisitngUser && isExisitngEmail) {
        if (isExistingPassword) {
            const user = await User.findOne({ username: username });
            req.session.user = user; // 로그인 성공 시 세션에 사용자 저장
            res.cookie('user', user, { maxAge: 900000, httpOnly: true }); // 쿠키 설정
            setUserName(req, username); // 사용자 이름 설정
            res.redirect('/preferences'); // 선호도 설정 페이지로 리다이렉트
        } else if (!isExistingPassword) {
            res.status(400).send('wrongPassword');
        } else {
            res.status(400).send('loginFalse');
        }
    } else {
        res.status(400).send('loginFalse');
    }
});

// 선호도 설정 페이지 라우트
app.get('/preferences', isLoggedIn, (req, res) => {
    res.sendFile(__dirname + '/public/preferences.html');
});

// 선호도 설정 처리 라우트
app.post('/preferences', (req, res) => {
    const typesOfFood = req.body.typesOfFood;
    switch (typesOfFood) {
        case "한식":
            req.session.foodPreference = "한식";
            res.redirect('/koreanFood');
            break;
        case "중식":
            req.session.foodPreference = "중식";
            res.redirect('/chineseFood');
            break;
        case "양식":
            req.session.foodPreference = "양식";
            res.redirect('/westernFood');
            break;
        case "일식":
            req.session.foodPreference = "일식";
            res.redirect('/japaneseFood');
            break;
        default:
            req.session.foodPreference = "디저트";
            res.redirect('/dessert');
            break;
    }
});

// 중복 사용자 확인 함수
async function checkDuplicateUser(username) {
    const isExistingUser = await User.findOne({ username });
    return isExistingUser !== null;
}

// 중복 사용자 확인 함수
async function checkDuplicateEmail(email) {
    const isExistingEmail = await User.findOne({ email });
    return isExistingEmail !== null;
}

// 비밀번호 확인 함수
async function checkPassword(usernameOrEmail, password) {
    const user = await User.findOne({ $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }] });

    if (!user) {
        return false; // 사용자를 찾지 못한 경우
    }

    const match = await bcrypt.compare(password, user.password);
    return match; // 비밀번호가 일치하면 true, 아니면 false 반환
}

// 사용자 이름을 설정하고 세션에 저장하는 함수
function setUserName(req, username) {
    req.session.username = username;
}

//있는 사용자인가 확인
app.get('/duplicatedUsername', (req, res) => {
    res.sendFile(__dirname + '/public/duplicatedUsername.html');
});
//비밀번호가 db에 있는 내용과 다름
app.get('/wrongPassword', (req, res) => {
    res.sendFile(__dirname + '/public/wrongPassword.html');
});
// 사용자가 로그인하지 않은 경우 로그인 실패 페이지로 리디렉션하는 라우트
app.get('/loginFalse', (req, res) => {
    res.sendFile(__dirname + '/public/loginFalse.html');
});

// 회원가입 및 로그인 시 세션에 저장된 사용자 이름을 반환하는 엔드포인트
app.get('/getUsername', (req, res) => {
    // 세션에 저장된 사용자 이름을 가져와 응답으로 보냅니다.
    const userName = req.session.username || '사용자';
    res.send(userName);
});

// 음식 종류 선택시 이동할 화면들의 라우트 설정
app.get('/koreanFood', (req, res) => {
    res.sendFile(__dirname + '/public/foods/koreanFood.html');
});

app.get('/chineseFood', (req, res) => {
    res.sendFile(__dirname + '/public/foods/chineseFood.html');
});

app.get('/westernFood', (req, res) => {
    res.sendFile(__dirname + '/public/foods/westernFood.html');
});

app.get('/japaneseFood', (req, res) => {
    res.sendFile(__dirname + '/public/foods/japaneseFood.html');
});

app.get('/dessert', (req, res) => {
    res.sendFile(__dirname + '/public/foods/dessert.html');
});

// 로그인되지 않은 사용자에게 보낼 페이지
app.get('/invalidAccess', (req, res) => {
    if (!req.session.user) { // 세션이 없는 경우에만 invalidAccess 페이지 렌더링
        res.sendFile(__dirname + '/public/invalidAccess.html');
    } else {
        res.redirect('/preferences'); // 세션이 있는 경우 preferences 페이지로 리디렉션
    }
});
//___________________________여기까지가 회원가입및 로그인 및 음식취향 받아오는 코드____________________________________________ 
// 사용자 위치를 저장하는 엔드포인트
app.post('/userLocation', (req, res) => {
    const { latitude, longitude } = req.body;
    req.session.userLocation = { latitude, longitude };
    res.status(200).send('User location received successfully.');
});


// 음식 선호도에 따른 맛집 검색 라우트
app.post('/searchRestaurants', async (req, res) => {
    try {
        const { latitude, longitude, foodPreference } = req.body;
        // 사용자 위치가 없으면 에러 응답
        if (!latitude && !longitude) {
            return res.status(400).json({ error: 'User location not found' });
        }

        const result = await searchRestaurants(latitude, longitude, foodPreference);
        res.json(result);
    } catch (error) {
        console.error('Error searching restaurants:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
async function searchRestaurants(latitude, longitude, foodPreference) {
    try {
        const address = await reverseGeocoding(latitude, longitude);
        const selectedRestaurants = [];
        const selectedIndices = new Set();

        const queryParams = {
            query: address + ' ' + foodPreference,
            display: 5,
            start: 1, 
            sort: 'random'
        };
        const queryString = querystring.stringify(queryParams);

        const response = await axios.get('https://openapi.naver.com/v1/search/local.json?' + queryString, {
            headers: {
                'X-Naver-Client-Id': clientId,
                'X-Naver-Client-Secret': clientSecret
            }
        });

        // 중복 선택된 음식점을 피하고 선택된 음식점을 추가
        response.data.items.forEach((restaurant, index) => {
            // 중복 검사를 수행하여 중복된 음식점을 걸러냄
            const key = restaurant.title + restaurant.roadAddress;
            if (!selectedIndices.has(key)) {
                selectedRestaurants.push(restaurant);
                selectedIndices.add(key);
            }
        });

        // 결과에서 5개의 음식점을 랜덤하게 선택
        const totalResults = selectedRestaurants.length;
        const maxIndex = Math.min(totalResults, 5);
        const finalSelection = [];

        // 중복되지 않는 랜덤한 인덱스를 선택
        while (finalSelection.length < maxIndex) {
            const randomIndex = Math.floor(Math.random() * totalResults);
            if (!finalSelection.includes(randomIndex)) {
                finalSelection.push(randomIndex);
            }
        }
        console.log(finalSelection.map(index => selectedRestaurants[index]));
        return finalSelection.map(index => selectedRestaurants[index]);
    } catch (error) {
        console.error('Error searching restaurants:', error);
        throw error;
    }
}
async function reverseGeocoding(latitude, longitude) {
    const coords = `${longitude},${latitude}`;
    const apiUrl = `https://naveropenapi.apigw.ntruss.com/map-reversegeocode/v2/gc?request=coordsToaddr&coords=${coords}&sourcecrs=epsg:4326&output=json&orders=legalcode`;

    try {
        const response = await axios.get(apiUrl, {
            headers: {
                'X-NCP-APIGW-API-KEY-ID': APIKey, 
                'X-NCP-APIGW-API-KEY': APIKeySecret
            }
        });

        // 정상적으로 주소를 가져왔을 때 반환
        if (response.data.results && response.data.results.length > 0) {
            return `${response.data.results[0].region.area1.name} ${response.data.results[0].region.area2.name} ${response.data.results[0].region.area3.name}`;
        } else {
            console.error('No address found in API response');
            throw new Error('No address found in API response');
        }
    } catch (error) {
        console.error('Error reverse geocoding:', error);
        throw error;
    }
}

app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});
