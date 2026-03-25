package handler

import (
	"fmt"
	"strings"
	"time"

	"github.com/fatih/color"
)

// logRequest prints a timestamped, coloured log line.
// siteURL is used to extract the domain label (e.g. "https://www.example.com" → "EXAMPLE").
func logRequest(siteURL, state string, isError bool) {
	site := siteURL
	if parts := strings.Split(siteURL, "."); len(parts) >= 2 {
		site = strings.ToUpper(parts[1])
	}

	base := fmt.Sprintf("[%v] [%v]", time.Now().Format("15:04:05.000"), site)

	if isError {
		color.Red("%v %v", base, state)
	} else {
		color.Yellow("%v %v", base, state)
	}
}
