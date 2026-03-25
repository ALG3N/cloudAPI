package main

import (
	"github.com/ALG3N/cloudAPI/handler"
	"github.com/ALG3N/cloudAPI/tasks"
)

func main() {
	proxyArray := tasks.Initialize()
	handler.Initialize(proxyArray)
}
