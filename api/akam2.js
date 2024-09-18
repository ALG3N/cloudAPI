import fs from 'fs';
import abcK from 'abck';

var readDevices = function () {
  var data = fs.readFileSync('./devices.json', 'utf8');
  var fingerprints = JSON.parse(data);
  return Object.values(fingerprints.devices);
};

class AkamaiGenerator {
  constructor(site) {
    this.device = this.parseDevice();
    this.version = 1.75;
    this.start_ts = Date.now();
    this.y1 = 2016;
    this.userAgent = this.device.navigator.userAgent;
    this.site = site;
    this.maxMouseMovement = 100;
    this.currentMouseVelocity = 0;
    this.js_post = true;
    this.vc_cnt = 0;
    this.ke_cnt = 0;
    this.ke_cnt_lmt = 150;
    this.kact = '';
    this.ke_vel = 0;
    this.vcact = '';
    this.vc_cnt_lmt = 100;
    this.aj_type = 1;
    this.me_cnt = 0;
    this.mme_cnt = 0;
    this.mme_cnt_lmt = 100;
    this.mduce_cnt = 0;
    this.mduce_cnt_lmt = 75;
    this.mact = '';
    this.me_vel = 0;
    this.ta = 0;
    this.tact = '';
    this.doe_cnt = 0;
    this.dme_cnt = 0;
    this.doe_vel = 0;
    this.dme_vel = 0;
    this.te_vel = 0;
    this.pact = '';
    this.pe_vel = 0;
    this.pe_cnt = 0;
    this.te_cnt = 0;
    this.doa_throttle = 0;
    this.init_time = 0;
    this.mn_mc_lmt = 10;
    this.mn_state = 0;
    this.mn_mc_indx = 0;
    this.mn_sen = 0;
    this.mn_tout = 100;
    this.mn_stout = 1000;
    this.mn_ct = 0;
    this.mn_cc = 0;
    this.mn_cd = 10000;
    this.mn_lc = [];
    this.mn_ld = [];
    this.mn_lcl = 0;
    this.mn_al = [];
    this.mn_il = [];
    this.mn_tcl = [];
    this.mn_r = [];
    this.mn_rt = 0;
    this.mn_wt = 0;
    this.mn_abck = 0;
    this.mn_psn = 0;
    this.mn_ts = 0;
    this.mn_lg = [];
    this.setFingerprint();
  }
  parseDevice = function () {
    var devices = readDevices();
    var encodedData = this.randomItem(devices);
    var deviceDataString = Buffer.from(encodedData, 'base64')
      .toString('utf8')
      .replace(/'/g, '"');
    return JSON.parse(deviceDataString);
  };
  setFingerprint = function () {
    this.rVal = Math.floor(1e3 * Math.random()).toString();
    this.rcFp = this.device.fp.rCFPS[this.rVal];
    this.fpValstr = this.device.fpValstr;
  };
  generateEvents = function () {
    var randomNumber = this.randomNumber(500, 1000);
    this.doact = this.generateCdoa(randomNumber);
    this.dmact = this.generateDmact(randomNumber);
    var mact = this.generateMact(this.randomNumber(1400, 1600));
    this.mact = mact[0];
    this.me_cnt = mact[3];
    var dmactSections = this.dmact.split(';');
    for (
      var _i = 0, dmactSections_1 = dmactSections;
      _i < dmactSections_1.length;
      _i++
    ) {
      var s = dmactSections_1[_i];
      var section = s.split(',');
      if (section.length === 1) break;
      this.ta += parseInt(section[1]);
      this.dme_vel += parseInt(section[0]) + parseInt(section[1]);
    }
    var doactSections = this.doact.split(';');
    for (
      var _a = 0, doactSections_1 = doactSections;
      _a < doactSections_1.length;
      _a++
    ) {
      var s = doactSections_1[_a];
      var section = s.split(',');
      if (section.length === 1) break;
      this.ta += parseInt(section[1]);
      this.doe_vel += parseInt(section[0]) + parseInt(section[1]);
    }
    var mactSections = this.mact.split(';');
    for (
      var _b = 0, mactSections_1 = mactSections;
      _b < mactSections_1.length;
      _b++
    ) {
      var s = mactSections_1[_b];
      var section = s.split(',');
      if (section.length === 1) break;
      this.ta += parseInt(section[2]);
      this.me_vel +=
        parseInt(section[0]) +
        parseInt(section[1]) +
        parseInt(section[2]) +
        parseInt(section[3]) +
        parseInt(section[4]);
    }
    this.updatet = mact[4];
  };
  /**
   * Generates sensor data with any given cookie
   * @param abckCookie Cookie which goes in the sensor
   */
  generateSensorWithEvents = function (abckCookie) {
    this.baseAbck = abckCookie;
    var ts_one = this.get_cf_date();
    this.generateEvents();
    this.mn_mc_indx = 0;
    this.mn_r = [];
    this.aj_indx = 0;
    this.js_post = true;
    this.nav_perm = this.device.np;
    var S = '';
    var C = '';
    var X = '';
    // If the passed cookie has a challenge
    if (abckCookie.includes('||') && !abckCookie.includes('||-1||')) {
      console.log('Solving challenge cookie...');
      this.mn_poll();
      var h_1 = this.mn_get_current_challenges();
      if (undefined !== h_1[1]) {
        var C_1 = h_1[1];
        undefined !== this.mn_r[C_1] && (S = this.mn_r[C_1]);
      }
      if (undefined !== h_1[2]) {
        var E = h_1[2];
        undefined !== this.mn_r[E] && (C = this.mn_r[E]);
      }
      if (undefined !== h_1[3]) {
        var S_1 = h_1[3];
        undefined !== this.mn_r[S_1] && (X = this.mn_r[S_1]);
      }
    }
    var a = this.updatet + this.randomNumber(1, 4);
    var n = this.gd();
    this.d2 = this.pi('' + this.z1 / 23);
    var e = this.baseAbck;
    var o = 'do_en';
    var m = 'dm_en';
    var r = 't_en';
    var i = o + ',' + m + ',' + r;
    var c = this.getforminfo();
    var b = this.getdurl();
    var d = this.aj_type + ',' + this.aj_indx;
    var s =
      this.ke_vel +
      this.me_vel +
      this.doe_vel +
      this.dme_vel +
      this.te_vel +
      this.pe_vel;
    // console.log(`ke_vel: ${this.ke_vel}, me_vel: ${this.me_vel}, doe_vel: ${this.doe_vel} dme_vel: ${this.dme_vel}, te_vel: ${this.te_vel}, pe_vel: ${this.pe_vel}`)
    // In the official script a var k is declared and returns the ff function
    // WHAT THE F*** IS THIS
    var l =
      this.ff(80) + this.ff(105) + this.ff(90) + this.ff(116) + this.ff(69);
    var u = this.jrs(this.start_ts);
    var _ = this.get_cf_date() - this.start_ts;
    var f = this.pi('' + this.d2 / 6);
    var p = this.device.fas;
    var v = [
      this.ke_vel + 1,
      this.me_vel + 32,
      this.te_vel + 32,
      this.doe_vel,
      this.dme_vel,
      this.pe_vel,
      s,
      a,
      this.init_time,
      this.start_ts,
      this.device['fpcf.td'],
      this.d2,
      this.ke_cnt,
      this.me_cnt,
      f,
      this.pe_cnt,
      this.te_cnt,
      _ + 1,
      this.ta,
      0,
      e,
      this.ab(e),
      this.rVal,
      this.rcFp,
      p,
      l,
      u[0],
      u[1],
      '0',
      '-1',
    ];
    var h = v.join(',');
    var g = '' + abcK.ab(this.fpValstr);
    // console.log(`S value: ${s}, me_vel + 32: ${this.me_vel + 32}`)
    var w =
      this.device.webgl.fmh +
      ',' +
      1 +
      ',' +
      this.device.webgl.ssh +
      ',' +
      this.device.webgl.wv +
      ',' +
      this.device.webgl.wr +
      ',' +
      this.device.webgl.weh +
      ',' +
      this.device.webgl.wl;
    // Initialize the sensor data with just the version then keep adding the segments
    var sensor_data = '' + this.version;
    // Gd method section
    sensor_data += '-1,2,-94,-100,' + n;
    sensor_data += '-1,2,-94,-101,' + i;
    // Add the form info
    sensor_data += '-1,2,-94,-105,' + c;
    sensor_data += '-1,2,-94,-102,' + c;
    // This is the keyboard data section, im not sure if adding it will improve success rate (STUPID)
    sensor_data += '-1,2,-94,-108,';
    // Mouse movement data section
    sensor_data += '-1,2,-94,-110,' + this.mact;
    // bmak.tact
    sensor_data += '-1,2,-94,-117,';
    sensor_data += '-1,2,-94,-111,' + this.doact;
    sensor_data += '-1,2,-94,-109,' + this.dmact;
    sensor_data += '-1,2,-94,-114,';
    sensor_data += '-1,2,-94,-103,';
    // Site url
    sensor_data += '-1,2,-94,-112,' + b;
    // This needs to be improved (STUPID)
    sensor_data += '-1,2,-94,-115,' + h;
    sensor_data += '-1,2,-94,-106,' + d;
    sensor_data += '-1,2,-94,-119,' + this.device.mr;
    sensor_data += '-1,2,-94,-122,' + this.device.sed;
    // First challenge section
    sensor_data += '-1,2,-94,-123,' + S;
    // Second challenge section
    sensor_data += '-1,2,-94,-124,' + C;
    // Third challenge section
    sensor_data += '-1,2,-94,-126,' + X;
    sensor_data += '-1,2,-94,-127,' + this.nav_perm;
    sensor_data += '-1,2,-94,-70,' + this.fpValstr;
    sensor_data += '-1,2,-94,-80,' + g;
    sensor_data += '-1,2,-94,-116,' + this.o9;
    var L =
      24 ^
      abcK.ab(
        sensor_data.substring(
          sensor_data.indexOf('1.'),
          sensor_data.indexOf('-1,2,-94,-70,')
        )
      );
    sensor_data += '-1,2,-94,-118,' + L;
    sensor_data += '-1,2,-94,-129,' + w;
    sensor_data += '-1,2,-94,-121,';
    var T = this.od(
      '0a46G5m17Vrp4o4c',
      'afSbep8yjnZUjq3aL010jO15Sawj2VZfdYK8uY90uxq'
    ).slice(0, 16);
    var F = Math.floor(this.get_cf_date() / 36e5);
    var D = T + this.od(F, T) + sensor_data;
    sensor_data =
      D +
      ';' +
      (this.get_cf_date() - ts_one) +
      ';' +
      (this.get_cf_date() - ts_one + this.randomNumber(2, 3)) +
      ';0';
    return {
      sensor: sensor_data,
      userAgent: this.device.navigator.userAgent,
    };
  };
  getforminfo = function () {
    /*
        I checked the get form info method on multiple browsers and they all seem to have the same value (IDK WHY I THOUGHT IT WOULD BE DIFFERENT)
        chrome: 0,0,0,0,1487,231,0;0,0,0,1,2863,2863,0;0,0,0,1,3079,3079,0;0,0,0,1,1627,1627,0;
        safari: 0,0,0,0,1487,231,0;0,0,0,1,2863,2863,0;0,0,0,1,3079,3079,0;0,0,0,1,1627,1627,0;
        firefox: 0,0,0,0,1487,231,0;0,0,0,1,2863,2863,0;0,0,0,1,3079,3079,0;0,0,0,1,1627,1627,0;
        * */
    var formInfo =
      '0,-1,0,0,912,1884,0;0,-1,0,0,886,1768,0;0,1,0,0,1075,1435,0;1,-1,0,0,1366,1798,0;';
    this.formInfo = formInfo;
    return formInfo;
  };
  getdurl = function () {
    return '' + this.site;
  };
  generateDmact = function (randomNumber) {
    var t = this.get_cf_date() - this.start_ts + randomNumber;
    this.dme_vel = t;
    return '0,' + t + ',-1,-1,-1,-1,-1,-1,-1,-1,-1;';
  };
  generateCdoa = function (randomNumber) {
    var t =
      this.get_cf_date() -
      this.start_ts +
      randomNumber +
      this.randomNumber(1, 3);
    this.doe_vel = t;
    return this.doe_cnt + ',' + t + ',-1,-1,-1;';
  };
  /**
   * Returns a random item from an array
   * @param items Array
   */
  randomItem = function (items) {
    return items[Math.floor(Math.random() * items.length)];
  };
  /**
   * Returns a random number
   * @param min Minimum number
   * @param max Maximum number
   */
  randomNumber = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  };
  randomFloat = function (min, max) {
    return Math.random() * (max - min) + min;
  };
  /**
   * ------------------- Mouse movement gen -------------------
   */
  generateMact = function (starting_ts) {
    var cycles = 5;
    var smoothing = 0.7745;
    var number_of_segments = 99;
    var arrayX = this.mactSmooth(
      this.mactGenerateLine(128, cycles, 0, this.device.screen.width),
      smoothing
    );
    var limitsX = this.mactGetLimitsX();
    arrayX = this.mactRescale(arrayX, limitsX.min, limitsX.max);
    var arrayY = this.mactSmooth(
      this.mactGenerateLine(128, cycles, 0, this.device.screen.height),
      smoothing
    );
    var limitsY = this.mactGetLimitsY();
    arrayY = this.mactRescale(arrayY, limitsY.min, limitsY.max);
    var times = this.mactGetTimes(100);
    var mact_segments = [];
    var me_vel = 0;
    var me_cnt = 0;
    var total_ts = 0;
    var final_ts = 0;
    // Loop this for the number of mact segments you want
    for (var i = 0; i < number_of_segments; i++) {
      // Mact timestamps in browser will usually not start at 0, so you will spoof the initial starting timestamp in the line below. It would be a good idea to have it choose a random number within a realistic looking range. (ANY NUMBER SEEMS TO WORK?)
      var new_ts = times[i] + starting_ts;
      // console.log(i + ",1," + new_ts + "," + Math.floor(arrayX[i]) + "," + Math.floor(arrayY[i]) + ";")
      mact_segments.push(
        i +
          ',1,' +
          new_ts +
          ',' +
          Math.floor(arrayX[i]) +
          ',' +
          Math.floor(arrayY[i]) +
          ';'
      );
      me_vel += i + 1 + new_ts + Math.floor(arrayX[i]) + Math.floor(arrayY[i]);
      me_cnt += 1;
      total_ts += new_ts;
      final_ts = new_ts;
    }
    // const last_segment = mact_segments.pop();
    // const replaced_last_segment = last_segment.replace(",1,", ",3,");
    me_vel += 2;
    // console.log(replaced_last_segment);
    // mact_segments.push(replaced_last_segment)
    var mact_str = mact_segments.join('');
    return [mact_str, total_ts, me_vel, me_cnt, final_ts];
  };
  mactGenerateLine = function (size, cycles, min, max) {
    var array = [];
    var multiplier = 2;
    for (var i = 0; i < size; i++) array[i] = min;
    for (var i = 0; i < cycles; i++) {
      var randoms = [];
      for (var j = 0; j < multiplier + 1; j++) {
        randoms[j] = min + Math.random() * (max / multiplier);
      }
      var segmentSize = Math.floor(size / multiplier);
      for (var j = 0; j < size; j++) {
        var currentSegment = Math.floor(j / segmentSize);
        var ratio = j / segmentSize - Math.floor(j / segmentSize);
        array[j] += this.mactInterpolate(
          randoms[currentSegment],
          randoms[currentSegment + 1],
          ratio
        );
      }
      multiplier = multiplier * 2;
    }
    return array;
  };
  mactInterpolate = function (x, y, t) {
    return y * t + x * (1 - t);
  };
  mactSmooth = function (array, smoothing) {
    var newArr = [];
    newArr[0] = array[0];
    for (var i = 1; i < array.length; i++)
      newArr[i] = (1 - smoothing) * array[i] + smoothing * newArr[i - 1];
    return newArr;
  };
  mactGetLimitsX = function () {
    var limits = {};
    var randomXmin = this.mactGaussian(665, 279);
    var randomXdiff = this.mactGaussian(340, 292);
    var min = randomXmin();
    while (min < 386 || min > 1223)
      //cutoff 1 stds left and 2 right
      min = randomXmin();
    var diff = randomXdiff();
    while (diff < 48 || diff > 924)
      //cutoff 1 std left and 2 right
      diff = randomXdiff();
    limits.min = min;
    limits.max = min + diff;
    return limits;
  };
  mactGetLimitsY = function () {
    var limits = {};
    var randomYmin = this.mactGaussian(122, 114);
    var randomYdiff = this.mactGaussian(235, 186);
    var min = randomYmin();
    while (min < 8 || min > 236)
      //cutoff 1 stds left and 2 right
      min = randomYmin();
    var diff = randomYdiff();
    while (diff < 49 || diff > 607)
      //cutoff 1 std left and 2 right
      diff = randomYdiff();
    limits.min = min;
    limits.max = min + diff;
    return limits;
  };
  mactGaussian = function (mean, stdev) {
    var y2;
    var use_last = false;
    return function () {
      var y1;
      if (use_last) {
        y1 = y2;
        use_last = false;
      } else {
        var x1 = void 0,
          x2 = void 0,
          w = void 0;
        do {
          x1 = 2.0 * Math.random() - 1.0;
          x2 = 2.0 * Math.random() - 1.0;
          w = x1 * x1 + x2 * x2;
        } while (w >= 1.0);
        w = Math.sqrt((-2.0 * Math.log(w)) / w);
        y1 = x1 * w;
        y2 = x2 * w;
        use_last = true;
      }
      var retval = mean + stdev * y1;
      if (retval > 0) return retval;
      return -retval;
    };
  };
  mactRescale = function (array, min, max) {
    var newArray = [];
    var oldMin = array[0];
    var oldMax = array[0];
    for (var i = 0; i < array.length; i++) {
      if (oldMin > array[i]) oldMin = array[i];
      if (oldMax < array[i]) oldMax = array[i];
    }
    for (var i = 0; i < array.length; i++)
      newArray[i] =
        ((array[i] - oldMin) / (oldMax - oldMin)) * (max - min) + min;
    return newArray;
  };
  mactGetTimes = function (num) {
    var array = [];
    var sum = 0;
    var randomStep = this.mactGaussian(7.9, 0.47);
    for (var i = 0; i < num; i++) {
      var t = randomStep();
      while (t < 4 || t > 11.8) t = randomStep();
      sum += Math.round(t);
      array.push(sum);
    }
    return array;
  };
  /**
   * ------------------- Akamai Functions -------------------
   */
  get_cf_date = function () {
    return Date.now();
  };
  gf = function (a) {
    var element = this.randomItem(['body']);
    return this.ab(element);
  };
  ab = function (a) {
    // if (t == null) return -1;
    // try {
    //   for (var a = 0, e = 0; e < t.length; e++) {
    //     const n = t.charCodeAt(e);
    //     n < 128 && (a += n);
    //   }
    //   return a;
    // } catch (t) {
    //   return -2;
    // }
    for (
      var t = 0, e = 0;
      e < a.replace(/\\\"/g, '').replace('/', '').length;
      e++
    ) {
      var n = a.replace(/\\\"/g, '').replace('/', '').charCodeAt(e);
      n < 128 && (t += n);
    }
    return t;
  };
  gd = function () {
    this.to();
    // Get user agent from
    var t = this.uar();
    // Sums the total char code length of the user agent
    var a = '' + abcK.ab(t);
    var e = this.start_ts / 2;
    // Screen sizing
    var n = this.device.screen.availWidth;
    var o = this.device.screen.availHeight;
    var m = this.device.screen.width;
    var r = this.device.screen.height;
    var i = this.device.screen.innerWidth;
    var c = this.device.screen.outerHeight;
    var b = this.device.screen.outerWidth;
    this.z1 = this.pi('' + this.start_ts / (this.y1 * this.y1));
    var d = Math.random();
    var s = this.pi('' + (1e3 * d) / 2);
    var k = '' + d;
    this.xagg = 12147;
    this.get_browser();
    k = k.slice(0, 11) + s;
    this.bmisc();
    return (
      t +
      ',uaend,' +
      this.xagg +
      ',' +
      this.psub +
      ',' +
      this.lang +
      ',' +
      this.prod +
      ',' +
      this.plen +
      ',' +
      this.pen +
      ',' +
      this.wen +
      ',' +
      this.den +
      ',' +
      this.z1 +
      ',' +
      this.d3 +
      ',' +
      n +
      ',' +
      o +
      ',' +
      m +
      ',' +
      r +
      ',' +
      i +
      ',' +
      c +
      ',' +
      b +
      ',' +
      this.device.bd +
      ',' +
      a +
      ',' +
      k +
      ',' +
      e +
      ',0,loc:' +
      this.loc
    );
  };
  get_browser = function () {
    this.psub = this.device.navigator.productSub;
    this.lang = this.device.navigator.language;
    this.prod = this.device.navigator.product;
    this.plen =
      void 0 !== this.device.navigator.plugins
        ? this.device.navigator.plugins.length
        : -1;
  };
  x2 = function () {
    return this.get_cf_date();
  };
  to = function () {
    var t = this.x2() % 1e7;
    this.d3 = t;
    for (var n = 0; n < 5; n++) {
      var o = parseInt('' + this.d3 / Math.pow(10, n)) % 10;
      var m = o + 1;
      var op = this.cc(o);
      t = op(t, m);
    }
    this.o9 = t * 3;
  };
  /* Sets more base akamai values. pen, wen, loc, den */
  bmisc = function () {
    this.pen = 0;
    this.wen = 0;
    this.loc = '';
    this.den = 0;
  };
  /* Parse int (this method is redundant and we should use the parse int method from node)*/
  pi = function (a) {
    return parseInt(a);
  };
  cc = function (t) {
    var a = t % 4;
    2 == a && (a = 3);
    var e = 42 + a,
      n = function (t, a) {
        return 0;
      };
    if (42 == e)
      var n = function (t, a) {
        return t * a;
      };
    //@ts-ignore
    else if (43 == e)
      var n = function (t, a) {
        return t + a;
      };
    else
      var n = function (t, a) {
        return t - a;
      };
    return n;
  };
  uar = function () {
    return this.userAgent.replace(/\\|"/g, '');
  };
  ff = function (t) {
    return String.fromCharCode(t);
  };
  jrs = function (a) {
    for (
      var t = Math.floor(1e5 * Math.random() + 1e4),
        e = String(a * t),
        n = 0,
        o = [],
        m = e.length >= 18;
      o.length < 6;

    )
      o.push(parseInt(e.slice(n, n + 2))), (n = m ? n + 3 : n + 2);
    return [t, this.cal_dis(o)];
  };
  cal_dis = function (a) {
    var t = a[0] - a[1],
      e = a[2] - a[3],
      n = a[4] - a[5],
      o = Math.sqrt(t * t + e * e + n * n);
    return Math.floor(o);
  };
  /**
   * ------------------- Challenge -------------------
   */
  mn_poll = function () {
    var a = this.get_mn_params_from_abck();
    var t = this.mn_get_new_challenge_params(a);
    null != t && this.mn_update_challenge_details(t);
    this.mn_w();
  };
  get_mn_params_from_abck = function () {
    var t = [[]];
    try {
      var a = this.cookie_chk_read('_abck');
      // Does it matter what size the split array is?, lenght is usually 6
      var e = decodeURIComponent(a).split('~');
      if (e.length >= 5) {
        // A06042945BDE204D89CA99143D0698D9
        var n = e[0];
        // -1
        var o = e[4];
        // Check if the akamai cookie has a challenge
        var m = o.split('||');
        if (m.length > 0) {
          for (var r = 0; r < m.length; r++) {
            var i = m[r];
            // check for challenge part, 1-vqIqRtPiPk-500-10-1000-2
            var c = i.split('-');
            if (c.length >= 5) {
              var b = this.pi(c[0]);
              var d = c[1];
              var k = this.pi(c[2]);
              var s = this.pi(c[3]);
              var l = this.pi(c[4]);
              var u = 1;
              // What affects the lenght of the challenge?
              c.length >= 6 && (u = this.pi(c[5]));
              var _ = [b, n, d, k, s, l, u];
              u == 2 ? t.splice(0, 0, _) : t.push(_);
            }
          }
        }
      }
    } catch (t) {}
    return t;
  };
  mn_get_current_challenges = function () {
    var t = this.get_mn_params_from_abck();
    var a = [];
    if (t != null) {
      for (var e = 0; e < t.length; e++) {
        var n = t[e];
        if (n.length > 0) {
          var o = n[1] + n[2];
          var m = n[6];
          a[m] = o;
        }
      }
    }
    return a;
  };
  mn_get_new_challenge_params = function (a) {
    var t = null,
      e = null,
      n = null;
    if (null != a)
      for (var o = 0; o < a.length; o++) {
        var m = a[o];
        if (m.length > 0) {
          for (
            var r = m[0],
              i = this.mn_abck + this.start_ts + m[2],
              c = (m[3], m[6]),
              b = 0;
            b < this.mn_lcl && 1 == r && this.mn_lc[b] != i;
            b++
          );
          b == this.mn_lcl && ((t = o), 2 == c && (e = o), 3 == c && (n = o));
        }
      }
    return null != n && this.pstate
      ? a[n]
      : null == e || this.pstate
      ? null == t || this.pstate
        ? null
        : a[t]
      : a[e];
  };
  mn_update_challenge_details = function (a) {
    this.mn_sen = a[0];
    this.mn_abck = a[1];
    this.mn_psn = a[2];
    this.mn_cd = a[3];
    this.mn_tout = a[4];
    this.mn_stout = a[5];
    this.mn_ct = a[6];
    this.mn_ts = this.start_ts;
    this.mn_cc = this.mn_abck + this.start_ts + this.mn_psn;
  };
  mn_w = function () {
    for (
      var a = 0,
        t = 0,
        e = 0,
        n = '',
        o = this.get_cf_date(),
        m = this.mn_cd + this.mn_mc_indx;
      0 == a;

    ) {
      n = Math.random().toString(16);
      var r = this.mn_cc + m.toString() + n,
        i = this.mn_s(r);
      if (0 == this.bdm(i, m))
        (a = 1),
          (e = this.get_cf_date() - o),
          this.mn_al.push(n),
          this.mn_tcl.push(e),
          this.mn_il.push(t),
          0 == this.mn_mc_indx &&
            (this.mn_lg.push(this.mn_abck),
            this.mn_lg.push(this.mn_ts),
            this.mn_lg.push(this.mn_psn),
            this.mn_lg.push(this.mn_cc),
            this.mn_lg.push(this.mn_cd.toString()),
            this.mn_lg.push(m.toString()),
            this.mn_lg.push(n),
            this.mn_lg.push(r),
            this.mn_lg.push(i));
      else if (
        (t += 1) % 1e3 == 0 &&
        (e = this.get_cf_date() - o) > this.mn_stout
      )
        return setTimeout(this.mn_w(), 1e3 + this.mn_stout);
    }
    (this.mn_mc_indx += 1),
      this.mn_mc_indx < this.mn_mc_lmt
        ? this.mn_w()
        : ((this.mn_mc_indx = 0),
          (this.mn_lc[this.mn_lcl] = this.mn_cc),
          (this.mn_ld[this.mn_lcl] = this.mn_cd),
          (this.mn_lcl = this.mn_lcl + 1),
          (this.mn_state = 0),
          (this.mn_r[this.mn_abck + this.mn_psn] = this.mn_pr()),
          (this.aj_type = 8),
          this.aj_indx++);
  };
  mn_pr = function () {
    return (
      this.mn_al.join(',') +
      ';' +
      this.mn_tcl.join(',') +
      ';' +
      this.mn_il.join(',') +
      ';' +
      this.mn_lg.join(',') +
      ';'
    );
  };
  mn_s = function (a) {
    // THIS SEEMS TO BE CONSTANT, I DONT KNOW WHY, BUT IT WORKS.. SO I GUESS ITS FINE (IM GETTING NIGHTMARES)
    var t = [
        1116352408, 1899447441, 3049323471, 3921009573, 961987163, 1508970993,
        2453635748, 2870763221, 3624381080, 310598401, 607225278, 1426881987,
        1925078388, 2162078206, 2614888103, 3248222580, 3835390401, 4022224774,
        264347078, 604807628, 770255983, 1249150122, 1555081692, 1996064986,
        2554220882, 2821834349, 2952996808, 3210313671, 3336571891, 3584528711,
        113926993, 338241895, 666307205, 773529912, 1294757372, 1396182291,
        1695183700, 1986661051, 2177026350, 2456956037, 2730485921, 2820302411,
        3259730800, 3345764771, 3516065817, 3600352804, 4094571909, 275423344,
        430227734, 506948616, 659060556, 883997877, 958139571, 1322822218,
        1537002063, 1747873779, 1955562222, 2024104815, 2227730452, 2361852424,
        2428436474, 2756734187, 3204031479, 3329325298,
      ],
      e = 1779033703,
      n = 3144134277,
      o = 1013904242,
      m = 2773480762,
      r = 1359893119,
      i = 2600822924,
      c = 528734635,
      b = 1541459225,
      d = this.encode_utf8(a),
      k = 8 * d.length;
    d += String.fromCharCode(128);
    for (
      var s = d.length / 4 + 2, l = Math.ceil(s / 16), u = new Array(l), _ = 0;
      _ < l;
      _++
    ) {
      u[_] = new Array(16);
      for (var f = 0; f < 16; f++)
        u[_][f] =
          (d.charCodeAt(64 * _ + 4 * f) << 24) |
          (d.charCodeAt(64 * _ + 4 * f + 1) << 16) |
          (d.charCodeAt(64 * _ + 4 * f + 2) << 8) |
          (d.charCodeAt(64 * _ + 4 * f + 3) << 0);
    }
    var p = k / Math.pow(2, 32);
    (u[l - 1][14] = Math.floor(p)), (u[l - 1][15] = k);
    for (var h = 0; h < l; h++) {
      for (
        var v,
          g = new Array(64),
          w = e,
          y = n,
          C = o,
          S = m,
          E = r,
          v = i,
          M = c,
          j = b,
          _ = 0;
        _ < 64;
        _++
      ) {
        var x, A, L, P, T, F;
        _ < 16
          ? (g[_] = u[h][_])
          : ((x =
              this.rotate_right(g[_ - 15], 7) ^
              this.rotate_right(g[_ - 15], 18) ^
              (g[_ - 15] >>> 3)),
            (A =
              this.rotate_right(g[_ - 2], 17) ^
              this.rotate_right(g[_ - 2], 19) ^
              (g[_ - 2] >>> 10)),
            (g[_] = g[_ - 16] + x + g[_ - 7] + A)),
          (A =
            this.rotate_right(E, 6) ^
            this.rotate_right(E, 11) ^
            this.rotate_right(E, 25)),
          (L = (E & v) ^ (~E & M)),
          (P = j + A + L + t[_] + g[_]),
          (x =
            this.rotate_right(w, 2) ^
            this.rotate_right(w, 13) ^
            this.rotate_right(w, 22)),
          (T = (w & y) ^ (w & C) ^ (y & C)),
          (F = x + T),
          (j = M),
          (M = v),
          (v = E),
          (E = (S + P) >>> 0),
          (S = C),
          (C = y),
          (y = w),
          (w = (P + F) >>> 0);
      }
      (e += w),
        (n += y),
        (o += C),
        (m += S),
        (r += E),
        (i += v),
        (c += M),
        (b += j);
    }
    return [
      (e >> 24) & 255,
      (e >> 16) & 255,
      (e >> 8) & 255,
      255 & e,
      (n >> 24) & 255,
      (n >> 16) & 255,
      (n >> 8) & 255,
      255 & n,
      (o >> 24) & 255,
      (o >> 16) & 255,
      (o >> 8) & 255,
      255 & o,
      (m >> 24) & 255,
      (m >> 16) & 255,
      (m >> 8) & 255,
      255 & m,
      (r >> 24) & 255,
      (r >> 16) & 255,
      (r >> 8) & 255,
      255 & r,
      (i >> 24) & 255,
      (i >> 16) & 255,
      (i >> 8) & 255,
      255 & i,
      (c >> 24) & 255,
      (c >> 16) & 255,
      (c >> 8) & 255,
      255 & c,
      (b >> 24) & 255,
      (b >> 16) & 255,
      (b >> 8) & 255,
      255 & b,
    ];
  };
  encode_utf8 = function (a) {
    return unescape(encodeURIComponent(a));
  };
  rotate_right = function (a, t) {
    return (a >>> t) | (a << (32 - t));
  };
  bdm = function (a, t) {
    for (var e = 0, n = 0; n < a.length; ++n)
      (e = ((e << 8) | a[n]) >>> 0), (e %= t);
    return e;
  };
  cookie_chk_read = function (t) {
    var cookie = '_abck=' + this.baseAbck + ';';
    // console.log(cookie)
    for (var a = t + '=', e = cookie.split(';'), n = 0; n < e.length; n++) {
      var o = e[n];
      // check if it is the abck cookie or not
      if (o.indexOf(a) === 0) {
        // returns the cookie without the abck_ part
        var m = o.substring(a.length, o.length);
        // check if cookie has ~ and return the first part of the cookie if it does
        if (m.indexOf('~') != -1 || decodeURIComponent(m).indexOf('~') != -1)
          return m;
      }
    }
  };
  rir = function (a, t, e, n) {
    return a > t && a <= e && (a += n % (e - t)) > e && (a = a - e + t), a;
  };
  od = function (a, t) {
    try {
      (a = String(a)), (t = String(t));
      var e = [];
      var n = t.length;
      if (n > 0) {
        for (var o = 0; o < a.length; o++) {
          var m = a.charCodeAt(o);
          var r = a.charAt(o);
          var i = t.charCodeAt(o % n);
          (m = this.rir(m, 47, 57, i)),
            m != a.charCodeAt(o) && (r = String.fromCharCode(m)),
            e.push(r);
        }
        if (e.length > 0) return e.join('');
      }
    } catch (a) {}
    return a;
  };
}

// NOT WORTH THE EFFORT XD

export { AkamaiGenerator };
