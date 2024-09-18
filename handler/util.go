package handler

import (
	"fmt"
	"strings"
	"time"

	"github.com/gookit/color"
)

// JUST A FUNCTION TO PRINT OUT THE TIME, SITE, AND STATE OF THE REQUEST FOR THE AESTHETICS..
func self(sitename, state string, error bool) {
	site := strings.Split(sitename, ".")[1]
	time := time.Now()
	formattedTime := time.Format("15:04:05.000")

	base := fmt.Sprintf("[%v] [%v]", formattedTime, strings.ToUpper(site))

	if error {
		color.Red.Printf("%v %v\n", base, state)
	} else {
		color.Yellow.Printf("%v %v\n", base, state)
	}
}
