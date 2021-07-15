package main

import (
	"sync"

	handler "github.com/ALG3N/cloudAPI/handler"
)

func main() {
	count := 4

	var wg sync.WaitGroup
	wg.Add(count)

	for i := 0; i < count; i++ {
		go handler.Initialize()
		defer wg.Done()
	}

	wg.Wait()
}
