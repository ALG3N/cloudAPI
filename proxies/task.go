package proxies

import (
	"encoding/json"
	"fmt"
	"io"
	"os"
)

// Initialize loads the proxy list from ./proxies/proxies.json and returns it as a string slice.
func Initialize() []string {
	jsonFile, err := os.Open("./proxies/proxies.json")
	if err != nil {
		fmt.Println("failed to open proxies file:", err)
		return nil
	}
	defer jsonFile.Close()

	byteValue, err := io.ReadAll(jsonFile)
	if err != nil {
		fmt.Println("failed to read proxies file:", err)
		return nil
	}

	var proxy Proxies
	if err := json.Unmarshal(byteValue, &proxy); err != nil {
		fmt.Println("failed to parse proxies file:", err)
		return nil
	}

	return proxy.Proxies
}
