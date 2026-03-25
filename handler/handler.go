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
	"os"
	"os/signal"
	"strings"
	"sync"
	"syscall"
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
	tr        *http.Transport
	client    *http.Client
}

// Payload represents the JSON body for sensor POST requests.
type Payload struct {
	URL    string `json:"url"`
	Sensor string `json:"sensor"`
	UA     string `json:"useragent"`
}

// TLSResponse is the JSON response returned by the /tls endpoint.
type TLSResponse struct {
	Body      string `json:"body"`
	Cookie    string `json:"cookie"`
	UserAgent string `json:"useragent"`
	Challenge bool   `json:"challenge"`
}

// newTransport returns a fresh HTTP transport with TLS verification disabled.
func newTransport() *http.Transport {
	return &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true}, //nolint:gosec
	}
}

// Initialize creates a Session with the given proxy list and starts the HTTP server.
func Initialize(proxy []string) {
	tr := newTransport()
	s := &Session{
		proxy: proxy,
		tr:    tr,
		client: &http.Client{
			CheckRedirect: func(req *http.Request, via []*http.Request) error {
				return http.ErrUseLastResponse
			},
			Transport: tr,
		},
	}
	if err := s.startHandler(); err != nil {
		log.Fatal(err)
	}
}

func (s *Session) startHandler() error {
	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	app := fiber.New(&fiber.Settings{
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	})

	app.Get("/init", s.Init)
	app.Post("/tls", s.tlsClient)

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)

	go func() {
		<-quit
		log.Println("Shutting down server...")
		if err := app.Shutdown(); err != nil {
			log.Printf("Error during shutdown: %v", err)
		}
	}()

	log.Printf("Server listening on :%s", port)
	return app.Listen(":" + port)
}

// Init handles GET /init?url={url} — initialises a session and extracts the _abck cookie.
func (s *Session) Init(c *fiber.Ctx) {
	queryValue := c.Query("url")
	if queryValue == "" {
		c.Status(400).Send("url query parameter is required")
		return
	}

	jar, err := cookiejar.New(&cookiejar.Options{PublicSuffixList: publicsuffix.List})
	if err != nil {
		color.Red("Failed to create cookie jar: %v", err)
		c.Status(500).Send("failed to create cookie jar")
		return
	}

	tr := newTransport()
	localClient := &http.Client{
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			return http.ErrUseLastResponse
		},
		Jar:       jar,
		Transport: tr,
	}

	s.mu.Lock()
	s.URL = queryValue
	s.tr = tr
	s.client = localClient
	s.count = 0
	s.session = ""
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

	resp, err := localClient.Do(req)
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
				logRequest(queryValue, fmt.Sprintf("Failed to parse proxy URL: %v", err), true)
			} else {
				tr.Proxy = http.ProxyURL(proxyURL)
			}
		}
	}

	logRequest(queryValue, fmt.Sprintf("Got initial cookie (%v)", resp.StatusCode), false)

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

	jsonBody, err := json.Marshal(map[string]string{"sensor_data": p.Sensor})
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

	s.mu.Lock()
	cl := s.client
	siteURL := s.URL
	s.mu.Unlock()

	resp, err := cl.Do(req)
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

	logRequest(siteURL, fmt.Sprintf("Sensor post (%v)", resp.StatusCode), false)

	isChallenge := strings.Contains(currentSession, "||")

	// Capture all values needed for logging before taking the lock.
	s.mu.Lock()
	s.challenge = isChallenge
	var cookieLogMsg string
	var cookieLogErr bool
	if currentCount >= 3 {
		if !isChallenge {
			cookieLogMsg = "Valid cookie received"
			s.valid++
		} else {
			cookieLogMsg = "Invalid cookie received"
			cookieLogErr = true
			s.invalid++
		}
		s.session = ""
		s.count = 0
	}
	var validRate float64
	printRate := s.valid+s.invalid == 10 && s.valid > 0
	if printRate {
		validRate = float64(s.valid) / float64(s.valid+s.invalid) * 100
	}
	s.mu.Unlock()

	if cookieLogMsg != "" {
		logRequest(siteURL, cookieLogMsg, cookieLogErr)
	}
	if printRate {
		color.Green("\n[%v] Valid rate: %.1f%%", time.Now().Format("15:04:05.000"), validRate)
	}

	c.JSON(TLSResponse{
		Body:      string(body),
		Cookie:    currentSession,
		UserAgent: p.UA,
		Challenge: isChallenge,
	})
}

// RemoveCookie removes the named cookie from the session's cookie jar for the given URL.
func (s *Session) RemoveCookie(u *url.URL, cookie string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.client.Jar == nil {
		return NoCookieJarErr
	}

	s.client.Jar.SetCookies(u, []*http.Cookie{
		{Name: cookie, Value: "", MaxAge: -1},
	})

	return nil
}
