package main

import (
	handler "github.com/ALG3N/cloudAPI/handler"
	proxies "github.com/ALG3N/cloudAPI/tasks"
)

func main() {
	// HORRIBLE WAY TO WRITE CODE, BUT IT WORKS FOR NOW
	proxyArray := proxies.Initialize()

	handler.Initialize(proxyArray)
}
