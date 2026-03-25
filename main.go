package main

import (
	"github.com/ALG3N/cloudAPI/handler"
	"github.com/ALG3N/cloudAPI/proxies"
)

func main() {
	proxyArray := proxies.Initialize()
	handler.Initialize(proxyArray)
}
