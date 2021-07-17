package handler

import (
	"bytes"
	"crypto/tls"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"math/rand"
	"net/url"
	"strings"
	"time"

	"github.com/fatih/color"
	"github.com/gofiber/fiber"
	"golang.org/x/net/publicsuffix"

	http "github.com/useflyent/fhttp"
	"github.com/useflyent/fhttp/cookiejar"
)

type Session struct {
	session   string
	proxy []string
	valid     int
	invalid   int
	count     int
	challenge bool
	URL       string
}

type Payload struct {
	Url    string `json:"url"`
	Sensor string `json:"sensor"`
	UA     string `json:"useragent"`
}

var (
	NoCookieJarErr = errors.New("no cookie jar in client")

	tr = &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	}
	client = &http.Client{
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			return http.ErrUseLastResponse
		},
		Transport: tr,
	}
)

func Initialize(proxy []string) {
	session := Session{}

	session.proxy = proxy
	session.count = 0
	session.valid = 0
	session.invalid = 0

	session.startHandler()
}

func (self *Session) startHandler() {
	// Fiber instance
	app := fiber.New()

	// Routes
	app.Get("/init", self.Init)

	app.Post("/tls", self.tlsClient)

	// start server
	app.Listen(3000)
}

// Handler
func (self *Session) Init(c *fiber.Ctx) {
	// All users of cookiejar should import "golang.org/x/net/publicsuffix"
	jar, err := cookiejar.New(&cookiejar.Options{PublicSuffixList: publicsuffix.List})
	if err != nil {
		log.Fatal(err)
	}
	prox := self.proxy[rand.Intn(len(self.proxy))]
	proxy := strings.Split(string(prox), ":")
	proxyUri := fmt.Sprintf("http://%v:%v@%v:%v", proxy[2], proxy[3], proxy[0], proxy[1])

	// fmt.Println(proxyUri)

	proxyUrl, _ := url.Parse(proxyUri)

	tr = &http.Transport{
		// Proxy:           http.ProxyURL(proxyUrl),
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	}
	client = &http.Client{
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			return http.ErrUseLastResponse
		},
		Jar: jar,
		Transport: tr,
	}

	queryValue := c.Query("url")
	// fmt.Println(queryValue)

	self.URL = queryValue

	if self.count >= 0 {
		v, _ := url.Parse("shopdisney.com")

		RemoveCookie(v, "_abck")
		RemoveCookie(v, "bm_sz")

		self.session = ""
		self.count = 0
	}

	req, err := http.NewRequest("GET", queryValue, strings.NewReader(""))

	req.Header = map[string][]string{
		"User-Agent": {"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"},
	}

	if err != nil {
		color.Red("Error occured", err)
	}

	resp, _ := client.Do(req)

	for _, cookie := range resp.Cookies() {
		if cookie.Name == "_abck" {
			if self.session == "" {
				self.session = cookie.Value
			}
		}
	}

	tr.Proxy = http.ProxyURL(proxyUrl)

	dt := time.Now()

	color.Yellow("[%v] Got invalid cookie - (%v)", dt.Format("15:04:05.000"), resp.StatusCode)

	// fmt.Println(resp)

	// fmt.Println("Cookie:", self.session)

	c.Send(self.session)
}

func (self *Session) tlsClient(c *fiber.Ctx) {
	p := new(Payload)

	if err := c.BodyParser(p); err != nil {
		fmt.Println(err)
	}

	// fmt.Println(p.Url)

	values := map[string]string{"sensor_data": p.Sensor}

	jsonBody, _ := json.Marshal(values)

	req, err := http.NewRequest("POST", p.Url, bytes.NewBuffer(jsonBody))

	if err != nil {
		color.Red("Error occured", err)
	}

	req.Header = map[string][]string{
		"User-Agent":   {p.UA},
		"Content-Type": {"application/json"},
	}

	resp, _ := client.Do(req)
	self.count++

	// fmt.Println(resp.Cookies())

	for _, cookie := range resp.Cookies() {
		if cookie.Name == "_abck" {
			if self.session == "" {
				self.session = cookie.Value
			}
		}
	}

	defer resp.Body.Close()

	b, _ := io.ReadAll(resp.Body)

	// fmt.Println("Response:", string(b), "Cookie:", self.session)

	dt := time.Now()

	color.Yellow("[%v] Sensor post [%v] - (%v)", dt.Format("15:04:05.000"), self.count, resp.StatusCode)

	arr := fmt.Sprintf("%v,%v,%v", string(b), self.session, p.UA)

	array := strings.Split(arr, ",")

	if strings.Contains(string(array[1]), "||") {
		self.challenge = true
	} else {
		self.challenge = false
	}

	cookie := string(array[1])
	// fmt.Println(cookie)

	fmt.Println(len(cookie))

	if self.count >= 3 && !strings.Contains(cookie, "||") && len(cookie) == 429 {
		color.Green("[%v] Valid cookie recieved [%v] - (Cookie length: %v)", dt.Format("15:04:05.000"), self.count, len(cookie))

		v, _ := url.Parse("shopdisney.com")

		RemoveCookie(v, "_abck")
		RemoveCookie(v, "bm_sz")

		self.valid++
		self.session = ""
		self.count = 0
	} else if self.count >= 3 && strings.Contains(cookie, "||") && len(cookie) != 429 {
		color.Red("[%v] Invalid cookie recieved [%v]", dt.Format("15:04:05.000"), self.count)

		v, _ := url.Parse("shopdisney.com")

		RemoveCookie(v, "_abck")
		RemoveCookie(v, "bm_sz")

		self.invalid++
		self.session = ""
		self.count = 0
	}

	if self.valid+self.invalid == 50 {
		color.Green("\n\n\n[%v] Valid rate: %v", dt.Format("15:04:05.000"), self.valid/self.invalid)
	}

	c.Send(arr)
}

// RemoveCookie removes the specified cookie from the request client cookie jar
func RemoveCookie(u *url.URL, cookie string) error {
	if client.Jar == nil {
		return NoCookieJarErr
	}

	newCookie := &http.Cookie{
		Name:   cookie,
		Value:  "",
		MaxAge: -1,
	}

	client.Jar.SetCookies(u, []*http.Cookie{newCookie})

	return nil
}
