package proxies

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
)

func Initialize() []string {
	var arr []string

	// DO NOT RUN THIS FOR TOO MANY REQUESTS, IT WILL CAUSE A RATE LIMIT ON THE IP, AND YOU WILL BE BLOCKED FROM THE SITE!! (USE A PROXYLIST)
	jsonFile, err := os.Open("./proxies/proxies.json")
	if err != nil {
		fmt.Println(err)
	}

	defer jsonFile.Close()

	byteValue, _ := ioutil.ReadAll(jsonFile)

	var proxy Proxies

	json.Unmarshal(byteValue, &proxy)

	for i := 0; i < len(proxy.Proxies); i++ {
		arr = append(arr, proxy.Proxies[i])
	}

	return arr
}
