package handler

import (
	"bytes"
	"crypto/tls"
	"encoding/json"
	"errors"
	"fmt"
	"io"
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
	jar, _ = cookiejar.New(&cookiejar.Options{PublicSuffixList: publicsuffix.List})
	client = &http.Client{
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			return http.ErrUseLastResponse
		},
		Jar:       jar,
		Transport: tr,
	}
)

func Initialize() {
	session := Session{}

	session.count = 0

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
	queryValue := c.Query("url")
	// fmt.Println(queryValue)

	self.URL = queryValue

	// if self.count >= 0 {
	// 	self.count = 0

	// 	v, _ := url.Parse("asos.com")

	// 	// fmt.Println(client.Jar.Cookies(v))

	// 	// fmt.Println(client.Jar.Cookies(v))
	// 	cookies := client.Jar.Cookies(v)
	// 	for cookie, _ := range cookies {
	// 		fmt.Println(cookie)
	// 	}

	// 	// RemoveCookie(v, "_abck")
	// 	// RemoveCookie(v, "bm_sz")
	// }

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

	if self.count >= 3 && !self.challenge {
		color.Green("[%v] Valid cookie recieved [%v] - (Cookie length: %v)", dt.Format("15:04:05.000"), self.count, len(cookie))

		v, _ := url.Parse("asos.com")

		RemoveCookie(v, "_abck")
		RemoveCookie(v, "bm_sz")

		self.session = ""
		self.count = 0
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
