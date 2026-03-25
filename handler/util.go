package handler

import (
	"fmt"
	"strings"
	"time"

	"github.com/gookit/color"
)

// logRequest prints a timestamped, coloured log line for a given site and state.
func logRequest(sitename, state string, isError bool) {
	parts := strings.Split(sitename, ".")
	site := sitename
	if len(parts) >= 2 {
		site = parts[1]
	}

	now := time.Now()
	base := fmt.Sprintf("[%v] [%v]", now.Format("15:04:05.000"), strings.ToUpper(site))

	if isError {
		color.Red.Printf("%v %v\n", base, state)
	} else {
		color.Yellow.Printf("%v %v\n", base, state)
	}
}
