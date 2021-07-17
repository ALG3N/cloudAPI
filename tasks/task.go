package proxies

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
)


func Initialize() []string {
	var arr []string

	jsonFile, err := os.Open("./proxies/proxies.json")
	if err != nil {
		fmt.Println(err)
	}

	defer jsonFile.Close()

	byteValue, _ := ioutil.ReadAll(jsonFile)

	var proxy Proxies

	json.Unmarshal(byteValue, &proxy)

	// arr = append(arr, proxy.Proxies[rand.Intn(len(proxy.Proxies))])

	for i := 0; i < len(proxy.Proxies); i++ {
		arr = append(arr, proxy.Proxies[i])
	}

	// fmt.Println(arr)

	return arr
}
