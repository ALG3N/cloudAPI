import { AkamaiGenerator } from './akam2.js';
import fetch from 'node-fetch';

async function timeout(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function start() {
  // ANY URL WILL WORK THAT HAS AKAMAI v1.75 PROTECTION...
  // OFC THIS HAS TO BE REGENERATED FOR EVERY NEW URL/REQUEST TO WORK
  // THIS IS ONLY A DEMO!
  var url = 'https://www.zalando.se/man-home';
  var postUrl =
    'https://www.zalando.se/lTJ3_oBh-nOc/DF/bAOJ5h4I9M/pEEDX6hJEh9X/biVUdhwB/SwIO/PnRWVWo';

  for (let i = 0; i < 10; i++) {
    let invalid = await getCookie(url);

    // console.log(invalid);

    let firstRes = await firstGen(url, invalid);

    // console.log(firstRes);

    let firstPostRes = await firstPost(postUrl, firstRes[1], firstRes[2]);

    let post1 = firstPostRes.split(',');
    console.log('First post sent...');

    let secondRes = await secondGen(url, post1[1]);

    // console.log(secondRes);

    let secondPostRes = await secondPost(postUrl, secondRes[1], firstRes[2]);

    let post2 = secondPostRes.split(',');
    console.log('Second post sent...');

    let cooked = await checkCookies(post2[1]);

    // console.log(post2[1]);

    if (cooked && post2[0] !== '{"success": false}') {
      console.log('Cookie gen successful!');
    } else {
      console.log('Doing third post..');

      let thirdRes = await thirdGen(url, post2[1]);

      let thirdPostRes = await thirdPost(postUrl, thirdRes[1], firstRes[2]);

      let post3 = thirdPostRes.split(',');
      console.log('Third post sent...');

      if (post3[0] === '{"success": false}') {
        console.log('Generated invalid cookie, retrying');
        console.log(post3[0]);
        console.log(post3[1]);
        await timeout(3000);
        await start();
      } else if (post3[1].includes('||')) {
        console.log('Generated invalid cookie, retrying');
        console.log(post3[1]);
        await timeout(2250);
        await start();
      } else {
        console.log('Generated valid cookie:', post3[1]);
        await timeout(2250);
        await start();
      }
    }
  }
}

start();

async function getCookie(url) {
  var response = await fetch(`http://localhost:3000/init?url=${url}`, {
    mode: 'no-cors',
    method: 'GET',
  });
  var cookie = response.text();

  return await cookie;
}

async function firstPost(postUrl, sensordata, userAgent) {
  var array;
  await fetch('http://localhost:3000/tls', {
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      url: postUrl,
      sensor: sensordata,
      useragent: userAgent,
    }),
    mode: 'no-cors',
    method: 'POST',
  })
    .then((res) => res.text())
    .then((data) => {
      array = data;
    });

  // console.log(array);

  return array;
}

async function secondPost(postUrl, sensordata, userAgent) {
  var array;
  await fetch('http://localhost:3000/tls', {
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      url: postUrl,
      sensor: sensordata,
      useragent: userAgent,
    }),
    mode: 'no-cors',
    method: 'POST',
  })
    .then((res) => res.text())
    .then((data) => {
      array = data;
    });

  // console.log(array);

  return array;
}

async function thirdPost(postUrl, sensordata, userAgent) {
  var array;
  await fetch('http://localhost:3000/tls', {
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      url: postUrl,
      sensor: sensordata,
      useragent: userAgent,
    }),
    mode: 'no-cors',
    method: 'POST',
  })
    .then((res) => res.text())
    .then((data) => {
      array = data;
    });

  // console.log(array);

  return array;
}

async function firstGen(url, cookie) {
  const firstSensor = new AkamaiGenerator(url).generateSensorWithEvents(cookie);
  return [url, firstSensor.sensor, firstSensor.userAgent];
}

async function secondGen(url, cookie) {
  const secondSensor = new AkamaiGenerator(url).generateSensorWithEvents(
    cookie
  );
  return [url, secondSensor.sensor, secondSensor.userAgent];
}

async function checkCookies(cookie) {
  if (cookie.includes('-1')) {
    return false;
  } else {
    return true;
  }
}

async function thirdGen(url, cookie) {
  const thirdSensor = new AkamaiGenerator(url).generateSensorWithEvents(cookie);
  return [url, thirdSensor.sensor, thirdSensor.userAgent];
}
