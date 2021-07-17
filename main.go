package main

import (
	handler "github.com/ALG3N/cloudAPI/handler"
	proxies "github.com/ALG3N/cloudAPI/tasks"
)

func main() {
	taskArray := proxies.Initialize()


	handler.Initialize(taskArray)
}
