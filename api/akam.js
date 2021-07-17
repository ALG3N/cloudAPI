import { AkamaiGenerator } from "./akam2.js";
import fetch from "node-fetch";

async function timeout(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function start() {
  var url = "https://www.shopdisney.com";
  var postUrl =
    "https://www.shopdisney.com/kt8C3jigntyo/HSluwPqq9Z/Fi/V9YQpNzG/R0l7YXhJDAQ/UgRcLk/MRdE0";

  for (let i = 0; i < 50; i++) {
    let invalid = await getCookie(url);

    // console.log(invalid);

    let firstRes = await firstGen(url, invalid);

    // console.log(firstRes);

    let firstPostRes = await firstPost(postUrl, firstRes[1], firstRes[2]);

    let post1 = firstPostRes.split(",");
    console.log("First post sent...");

    let secondRes = await secondGen(url, post1[1]);

    // console.log(secondRes);

    let secondPostRes = await secondPost(postUrl, secondRes[1], firstRes[2]);

    let post2 = secondPostRes.split(",");
    console.log("Second post sent...");

    let cooked = await checkCookies(post2[1]);

    // console.log(post2[1]);

    if (cooked && post2[0] !== '{"success": false}') {
      console.log("Cookie gen successful!");
    } else {
      console.log("Doing third post..");

      let thirdRes = await thirdGen(url, post2[1]);

      let thirdPostRes = await thirdPost(postUrl, thirdRes[1], firstRes[2]);

      let post3 = thirdPostRes.split(",");
      console.log("Third post sent...");

      if (post3[0] === '{"success": false}') {
        console.log("Generated invalid cookie, retrying");
        console.log(post3[0]);
        console.log(post3[1]);
        await timeout(3000);
        await start();
      } else if (post3[1].includes("||")) {
        console.log("Generated invalid cookie, retrying");
        console.log(post3[1]);
        await timeout(2250);
        await start();

        // console.log("Doing forth post..");

        // let forthRes = await thirdGen(url, post2[1]);

        // let forthPostRes = await thirdPost(postUrl, forthRes[1], firstRes[2]);

        // let post4 = forthPostRes.split(",");
        // console.log("Forth post sent...");

        // if (post4[1].includes("||")) {
        //   console.log("Generated invalid cookie, retrying");
        //   console.log(post3[1]);
        //   await timeout(3000);
        //   await start();
        // } else {
        //   console.log("Generated valid cookie:", post3[1]);
        //   await timeout(2250);
        //   await start();
        // }
      }
      console.log("Generated valid cookie:", post3[1]);
      await timeout(2250);
      await start();
    }
  }
}

start();

async function getCookie(url) {
  var response = await fetch(`http://localhost:3000/init?url=${url}`, {
    mode: "no-cors",
    method: "GET",
  });
  var cookie = response.text();

  return await cookie;
}

async function firstPost(postUrl, sensordata, userAgent) {
  var array;
  await fetch("http://localhost:3000/tls", {
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      url: postUrl,
      sensor: sensordata,
      useragent: userAgent,
    }),
    mode: "no-cors",
    method: "POST",
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
  await fetch("http://localhost:3000/tls", {
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      url: postUrl,
      sensor: sensordata,
      useragent: userAgent,
    }),
    mode: "no-cors",
    method: "POST",
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
  await fetch("http://localhost:3000/tls", {
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      url: postUrl,
      sensor: sensordata,
      useragent: userAgent,
    }),
    mode: "no-cors",
    method: "POST",
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
  if (cookie.includes("-1")) {
    return false;
  } else {
    return true;
  }
}

async function thirdGen(url, cookie) {
  const thirdSensor = new AkamaiGenerator(url).generateSensorWithEvents(cookie);
  return [url, thirdSensor.sensor, thirdSensor.userAgent];
}

// async function generateAkamai(sensorCookie, url) {
//   try {
//     console.log("Generating akamai");
//     console.log(this.client.sensorCookie);
//     const firstSensor = new AkamaiGenerator(
//       this.mainUrl
//     ).generateSensorWithEvents(this.client.sensorCookie);
//     const firstResponse = await this.client.postSensor(
//       this.akamaiUrl,
//       firstSensor.sensor,
//       firstSensor.userAgent
//     );
//     // this.client.setSensorCookie(firstResponse.Headers['Set-Cookie']  firstResponse.Headers['set-cookie']);
//     const secondSensor = new AkamaiGenerator(
//       this.mainUrl
//     ).generateSensorWithEvents(this.client.sensorCookie);
//     const secondResponse = await this.client.postSensor(
//       this.akamaiUrl,
//       secondSensor.sensor,
//       secondSensor.userAgent
//     );
//     // this.client.setSensorCookie(secondResponse.Headers['Set-Cookie']  secondResponse.Headers['set-cookie'])
//     if (this.client.sensorCookie.includes("-1")) {
//       const thirdSensor = new AkamaiGenerator(
//         this.akamaiUrl
//       ).generateSensorWithEvents(this.client.sensorCookie);
//       const thirdResponse = await this.client.postSensor(
//         this.akamaiUrl,
//         thirdSensor.sensor,
//         thirdSensor.userAgent
//       );
//       this.atcAgent = thirdSensor.userAgent;
//       this.client.setSensorCookie(
//         thirdResponse.Headers["Set-Cookie"] ||
//           thirdResponse.Headers["set-cookie"]
//       );
//     }
//     if (this.client.sensorCookie.length < 500) {
//       console.log("Generated invalid cookie, retrying");
//       return this.generateAkamai();
//     }
//     console.log("Generated valid cookie");
//   } catch (error) {
//     await this.handleError(error, this.generateAkamai);
//   }
// }
