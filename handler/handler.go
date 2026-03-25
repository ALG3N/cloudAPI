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
	"sync"
	"time"

	"github.com/fatih/color"
	"github.com/gofiber/fiber"
	"golang.org/x/net/publicsuffix"

	http "github.com/useflyent/fhttp"
	"github.com/useflyent/fhttp/cookiejar"
)

// NoCookieJarErr is returned when the HTTP client has no cookie jar configured.
var NoCookieJarErr = errors.New("no cookie jar in client")

// Session holds the state for an active proxy session.
type Session struct {
	mu        sync.Mutex
	session   string
	proxy     []string
	valid     int
	invalid   int
	count     int
	challenge bool
	URL       string
}

// Payload represents the JSON body for sensor POST requests.
type Payload struct {
	URL    string `json:"url"`
	Sensor string `json:"sensor"`
	UA     string `json:"useragent"`
}

var (
	tr = &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true}, //nolint:gosec
	}
	client = &http.Client{
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			return http.ErrUseLastResponse
		},
		Transport: tr,
	}
)

// Initialize creates a Session with the given proxy list and starts the HTTP server.
func Initialize(proxy []string) {
	s := &Session{
		proxy: proxy,
	}
	s.startHandler()
}

func (s *Session) startHandler() {
	app := fiber.New()

	app.Get("/init", s.Init)
	app.Post("/tls", s.tlsClient)

	log.Fatal(app.Listen(3000))
}

// Init handles GET /init?url={url} — initialises a session and extracts the _abck cookie.
func (s *Session) Init(c *fiber.Ctx) {
	jar, err := cookiejar.New(&cookiejar.Options{PublicSuffixList: publicsuffix.List})
	if err != nil {
		color.Red("Failed to create cookie jar: %v", err)
		c.Status(500).Send("failed to create cookie jar")
		return
	}

	// NOTE: tr and client are package-level variables reassigned here on every
	// request, which is not safe for concurrent use. Consider moving them to
	// per-session scope if concurrent requests are needed.
	tr = &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true}, //nolint:gosec
	}
	client = &http.Client{
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			return http.ErrUseLastResponse
		},
		Jar:       jar,
		Transport: tr,
	}

	queryValue := c.Query("url")
	if queryValue == "" {
		c.Status(400).Send("url query parameter is required")
		return
	}

	s.mu.Lock()
	s.URL = queryValue
	if s.count >= 0 {
		s.session = ""
		s.count = 0
	}
	s.mu.Unlock()

	req, err := http.NewRequest("GET", queryValue, strings.NewReader(""))
	if err != nil {
		color.Red("Failed to create request: %v", err)
		c.Status(500).Send("failed to create request")
		return
	}

	req.Header = map[string][]string{
		"User-Agent": {"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"},
	}

	resp, err := client.Do(req)
	if err != nil {
		color.Red("Request failed: %v", err)
		c.Status(500).Send("request failed")
		return
	}
	defer resp.Body.Close()

	s.mu.Lock()
	for _, cookie := range resp.Cookies() {
		if cookie.Name == "_abck" && s.session == "" {
			s.session = cookie.Value
		}
	}
	session := s.session
	s.mu.Unlock()

	if len(s.proxy) > 0 {
		prox := s.proxy[rand.Intn(len(s.proxy))]
		parts := strings.Split(prox, ":")
		if len(parts) == 4 {
			proxyURI := fmt.Sprintf("http://%v:%v@%v:%v", parts[2], parts[3], parts[0], parts[1])
			proxyURL, err := url.Parse(proxyURI)
			if err != nil {
				color.Red("Failed to parse proxy URL: %v", err)
			} else {
				tr.Proxy = http.ProxyURL(proxyURL)
			}
		}
	}

	color.Yellow("[%v] Got invalid cookie (%v)", time.Now().Format("15:04:05.000"), resp.StatusCode)

	c.Send(session)
}

// tlsClient handles POST /tls — submits sensor data and tracks cookie validity.
func (s *Session) tlsClient(c *fiber.Ctx) {
	p := new(Payload)
	if err := c.BodyParser(p); err != nil {
		color.Red("Failed to parse body: %v", err)
		c.Status(400).Send("invalid request body")
		return
	}

	values := map[string]string{"sensor_data": p.Sensor}

	jsonBody, err := json.Marshal(values)
	if err != nil {
		color.Red("Failed to marshal JSON: %v", err)
		c.Status(500).Send("failed to marshal JSON")
		return
	}

	req, err := http.NewRequest("POST", p.URL, bytes.NewBuffer(jsonBody))
	if err != nil {
		color.Red("Failed to create request: %v", err)
		c.Status(500).Send("failed to create request")
		return
	}

	req.Header = map[string][]string{
		"User-Agent":   {p.UA},
		"Content-Type": {"application/json"},
	}

	resp, err := client.Do(req)
	if err != nil {
		color.Red("Request failed: %v", err)
		c.Status(500).Send("request failed")
		return
	}
	defer resp.Body.Close()

	s.mu.Lock()
	s.count++
	for _, cookie := range resp.Cookies() {
		if cookie.Name == "_abck" && s.session == "" {
			s.session = cookie.Value
		}
	}
	currentCount := s.count
	currentSession := s.session
	s.mu.Unlock()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		color.Red("Failed to read response body: %v", err)
		c.Status(500).Send("failed to read response body")
		return
	}

	dt := time.Now()
	color.Yellow("[%v] Sensor post (%v)", dt.Format("15:04:05.000"), resp.StatusCode)

	arr := fmt.Sprintf("%v,%v,%v", string(body), currentSession, p.UA)
	array := strings.Split(arr, ",")
	if len(array) < 2 {
		color.Red("[%v] Unexpected response format", dt.Format("15:04:05.000"))
		c.Status(500).Send("unexpected response format")
		return
	}

	cookie := array[1]
	isChallenge := strings.Contains(cookie, "||")

	s.mu.Lock()
	s.challenge = isChallenge
	if currentCount >= 3 {
		if !isChallenge {
			color.Green("[%v] Valid cookie received", dt.Format("15:04:05.000"))
			s.valid++
		} else {
			color.Red("[%v] Invalid cookie received", dt.Format("15:04:05.000"))
			s.invalid++
		}
		s.session = ""
		s.count = 0
	}
	if s.valid+s.invalid == 10 && s.valid > 0 {
		validRate := float64(s.valid) / float64(s.valid+s.invalid) * 100
		color.Green("\n\n\n[%v] Valid rate: %.1f%%", dt.Format("15:04:05.000"), validRate)
	}
	s.mu.Unlock()

	c.Send(arr)
}

// RemoveCookie removes the named cookie from the client's cookie jar for the given URL.
func RemoveCookie(u *url.URL, cookie string) error {
	if client.Jar == nil {
		return NoCookieJarErr
	}

	client.Jar.SetCookies(u, []*http.Cookie{
		{Name: cookie, Value: "", MaxAge: -1},
	})

	return nil
}
