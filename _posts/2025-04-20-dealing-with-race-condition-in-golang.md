---
layout: post
title: "Dealing with Race Condition in Golang"
date: 2025-04-20 10:52:10 +0700
categories: [golang, race condition]
---

Race condition, in simple terms, is unexpected behavior caused by an overlapping process between two or more concurrent (including parallel) processes. 

## The Experience
Let me preface you with my experience. I encountered race conditions in Golang in my first year of using Golang. We (my team and I) got a report from the operations team that one of our legacy services encountered multiple crashes. They attach the stack trace to the report. 

>At this point, you may ask how it can happen. You may assume the legacy system must be around for a while, so why not catch it earlier? Allow me to explain it from my pov. When the backend crashes, it will die with all current in-flight requests. Since the backend is deployed in Kubernetes, Kubernetes will get notified about the die pod and try to spin up a new pod to join the deployment. From the user's perspective, on request error, the front end will auto-retry the request, or if it does not retry automatically, most of the time the user will refresh it manually. It's a hiccup in the user experience, but I think from the user's perspective it is not worth the effort to report it since it's only intermittent. From the operations team's perspective, since there is no report from users maybe the problem falls as a non-priority problem and I believe they have much more priority problems to solve. Lastly from the developer and tester perspective, things can get a little complicated due to the nature of race condition bugs, sometimes it happens only on tiny specific timing. And in the normal case, only one tester or developer is testing it at a time. So the bug is harder to spot. The stress test may captured it, but it may not have been part of the deployment process in the past.

Looking at the error message in the stack trace, I can see that the problem is due to some concurrent read-write conflict on some objects aka race-condition. The stack trace also pointed out the relevant part of the code which is very helpful. But the bigger problem remains, how to reproduce the bug? How to confirm when I change the code, it solves the bug? At first, I planned to use stress testing. Until I found out that Golang already provides [built-in race detectors](https://go.dev/doc/articles/race_detector). Just add `-race` flag into `go run`, `go build`, `go test`, or `go install` and it will give you a warning about the possible data race inside the program. Indeed, when I run the program with `-race` flag and then trigger the API, the race detectors give a warning about the possible data race. The warning is almost identical to the stack trace.

After poking around the program with race detectors enabled, I find a lot of possible data races in multiple locations. Remember, even if a data race is possible it doesn't mean that every time the program is running the data race is happened. Race conditions may only occur in specific conditions and timing. And that required condition and timing may only happen in 0,00000001% (yeah lot of zero) of the time. Still, if it can be happen, it will happen. The problem is that the time allocated to solve this problem is very small, only two working days. When I found out the scope of the bug only one day is left. Combined with my lack of familiarity with these legacy services, the best I could do at that time was to throw a bunch of mutex locks with the possibility of performance degradation. But my manager is fine with the "bandaid" fix. The performance degradation is better than unreliability and ask me to continue the fix. While learning more about the services and creating more ideal fixes to deploy in next cycle. So, I do just that. It went _almost_ well. The race condition is fixed by the "bandaid" but after some time the performance degradation is noticeable. Luckily, the "ideal" fix is ready and after it is deployed, both the race condition and the performance problem are gone.

The root cause of the bug is, as already mentioned, concurrent read-write conflict on some objects. This "some" object is a global shared object. I think the original developer (author) is trying to implement some form of [singleton](https://refactoring.guru/design-patterns/singleton/go/example) but missing the required synchronization. What I do to fix the root cause is to remove my bandaid fix, refactor (read: remove) a lot of code that uses the object, and finally place the synchronization in a very small, but critical, part of the code.

That is my very first experience dealing with race conditions in Golang. It is a very great experience. I think now I know a little bit more about race conditions and am more aware of them in Golang (at that time I was only aware of race conditions inside RDBMS).

## The Code
I think some of you are here to read the code. Unfortunately, I can't show you the code from my work because it is part of the NDA. But, don't worry, I have created a simple program that can give an idea of race conditions. You can find the code [here at my github](https://github.com/rochimfn/resource-notes-race-golang). 

Now let me walk you through the program. First, clone the repository:

```bash
git clone https://github.com/rochimfn/resource-notes-race-golang
```

Open the _counter.go_ file and you will see the below code.
```go
package main

import "fmt"

func main() {
	numIter := 10000
	counted := 0

	for i := 0; i < numIter; i++ {
		counted += 1
	}

	fmt.Printf("counted=%d\n", counted)
}
```

The program is very simple, it is just a counter that counts until 10000. Run the program with `go run counter.go` and it should give you output `counted=10000` as expected.

Now let's introduce concurrency. Instead of counting directly, I made the for loop spawn goroutine that will increment the counter. 

_counter1.go_:
```go
package main

import "fmt"

func main() {
	numIter := 10000
	counted := 0

	for i := 0; i < numIter; i++ {
		go func() {
			counted += 1
		}()
	}

	fmt.Printf("counted=%d\n", counted)
}
```

Run with `go run counter1.go`.

![output go run counter1.go](/images/go-run-counter1.png)

The output is not `counted=10000`. Yes, we forget to add sync.WaitGroup, maybe the main goroutine is already dead when the child goroutine is still counting. Let's fix it and run it with `go run _counter2.go`.

_counter2.go_:
```go
package main

import (
	"fmt"
	"sync"
)

func main() {
	numIter := 10000
	counted := 0

	wg := sync.WaitGroup{}
	wg.Add(numIter)
	for i := 0; i < numIter; i++ {
		go func() {
			counted += 1
			wg.Done()
		}()
	}

	wg.Wait()
	fmt.Printf("counted=%d\n", counted)
}
```

![output go run counter2.go](/images/go-run-counter2.png)

The output is still off. Now try to enable race detectors. Run `counter2.go` with `go run -race counter2.go`.


![output go run counter2.go](/images/go-run-race-counter2.png)

We got race condition! Here is the output on my machine.
```
==================
WARNING: DATA RACE
Read at 0x00c000014148 by goroutine 10:
  main.main.func1()
      /home/rochim/Projects/resource-notes-race-golang/counter2.go:16 +0x33

Previous write at 0x00c000014148 by goroutine 15:
  main.main.func1()
      /home/rochim/Projects/resource-notes-race-golang/counter2.go:16 +0x45

Goroutine 10 (running) created at:
  main.main()
      /home/rochim/Projects/resource-notes-race-golang/counter2.go:15 +0x84

Goroutine 15 (finished) created at:
  main.main()
      /home/rochim/Projects/resource-notes-race-golang/counter2.go:15 +0x84
==================
==================
WARNING: DATA RACE
Write at 0x00c000014148 by goroutine 10:
  main.main.func1()
      /home/rochim/Projects/resource-notes-race-golang/counter2.go:16 +0x45

Previous write at 0x00c000014148 by goroutine 28:
  main.main.func1()
      /home/rochim/Projects/resource-notes-race-golang/counter2.go:16 +0x45

Goroutine 10 (running) created at:
  main.main()
      /home/rochim/Projects/resource-notes-race-golang/counter2.go:15 +0x84

Goroutine 28 (finished) created at:
  main.main()
      /home/rochim/Projects/resource-notes-race-golang/counter2.go:15 +0x84
==================
counted=8312
Found 2 data race(s)
exit status 66
```

Focus on this part:
```
Read at 0x00c000014148 by goroutine 10:
  main.main.func1()
      /home/rochim/Projects/resource-notes-race-golang/counter2.go:16 +0x33

Previous write at 0x00c000014148 by goroutine 15:
  main.main.func1()
      /home/rochim/Projects/resource-notes-race-golang/counter2.go:16 +0x45
```

The race happened on counter2.go line 16. Let's see the code.
```go
counted += 1
```

The race happens when the goroutine tries to increment the counted variable by 1. At first, it kinda make sense. The counted variable is a global variable, owned by the    main function. And we try to modify it with multiple child goroutines. But why the value is off even though the program does not crash? Also, why does the warning say "Read at.." and "Previous write at.."?  I believe some of you already know why. For those who don't, it is because `counted+=1` means to increment the value of counted by 1 _only on high level_. On the lower level, it actually means:
1. read the value of counted variable
2. add the value by 1
3. write the value back into counted variable

The reading and writing are on different step.

Now, imagine there are two goroutines doing all the steps. 
```
goroutine1: 1. read the value of counted variable (counted=0, temp1=0)
goroutine1: 2. add the value by 1 (counted=0, temp1=1)
goroutine1: 3. write the value back into counted variable (counted=1, temp=1)
goroutine2: 1. read the value of counted variable (counted=1, temp1=1)
goroutine2: 2. add the value by 1 (counted=1, temp1=2)
goroutine2: 3. write the value back into counted variable (counted=2, temp1=2)
```
Looks fine right? Let me remind you that goroutine is concurrent. _goroutine2_ may be running before the _goroutine1_ done.
```
goroutine1: 1. read the value of counted variable (counted=0, temp1=0)
goroutine1: 2. add the value by 1 (counted=0, temp1=1)
goroutine2: 1. read the value of counted variable (counted=0, temp2=0)
goroutine1: 3. write the value back into counted variable (counted=1, temp1=1)
goroutine2: 2. add the value by 1 (counted=1, temp2=1)
goroutine2: 3. write the value back into counted variable (counted=1, temp2=1)
```
I hope now you understand why the warning says "Read at.." and "Previous write at.." and why even though the program has not crashed the value is off. In this case, the race condition causes a [lost update problem](https://en.wikipedia.org/wiki/Concurrency_control#Why_is_concurrency_control_needed?).

How to fix this race condition? In RDBMS, it is as easy as wrapping the steps in a single transaction (making it atomic). Reading with `SELECT FOR UPDATE` clause and make sure we use the correct [isolation level](https://www.postgresql.org/docs/current/transaction-iso.html). Are there any such things in Golang? The answer is yes.

### Fix with sync/atomic

Let's start with I think the most suitable solution for our case, using [sync/atomic](https://pkg.go.dev/sync/atomic). sync/atomic package allows atomic operation on a couple of primitive types. For example, int64, the type that we use for counted variable. If you are not familiar with [atomic operation](https://en.wikipedia.org/wiki/Atomicity_(database_systems)), basically either all the steps are successful or all are failed. Just like when you use transactions in RDBMS. Here is how we can use it for our case.

_counter3.go_:
```go
package main

import (
	"fmt"
	"sync"
	"sync/atomic"
)

func main() {
	numIter := 10000
	var counted atomic.Int64

	wg := sync.WaitGroup{}
	wg.Add(numIter)
	for i := 0; i < numIter; i++ {
		go func() {
			counted.Add(1)
			wg.Done()
		}()
	}

	wg.Wait()
	fmt.Printf("counted=%d\n", counted.Load())
}
```
Run with `go run -race counter3.go`.

![output go run counter3.go](/images/go-run-race-counter3.png)

Correct output with no warning.


### Fix with sync.Mutex

If you learn Golang through [go tour](https://go.dev/tour/concurrency/9), you must be familiar with [sync.Mutex](https://pkg.go.dev/sync#Mutex). Basically, a mutex can protect the object from concurrent operation by locking it. Only the holder of the lock can manipulate the object. In our case, we can wrap the `counted+=1` operation inside mutex. So only one goroutine (the holder of the lock) can increment the counted variable.

_counter3.go_:
```go
package main

import (
	"fmt"
	"sync"
)

type Counter struct {
	mu    sync.Mutex
	value int64
}

func (c *Counter) Inc(v int) {
	c.mu.Lock()
	c.value += 1
	c.mu.Unlock()
}

func main() {
	numIter := 10000
	counted := Counter{value: 0}

	wg := sync.WaitGroup{}
	wg.Add(numIter)
	for i := 0; i < numIter; i++ {
		go func() {
			counted.Inc(1)
			wg.Done()
		}()
	}

	wg.Wait()
	fmt.Printf("counted=%d\n", counted.value)
}
```

Run with `go run -race counter4.go`.

![output go run counter4.go](/images/go-run-race-counter4.png)

Sweet! Correct output and now warning.


### Fix with channel

Channel is a concurrent safe data structure and Golang recommends the use of it to communicate between goroutine. Here is an example of how we can use the channel for our case.

_counter4.go_:
```go
package main

import (
	"fmt"
	"sync"
)

type Counter struct {
	c     chan int64
	value int64
}

func (c *Counter) Count() int64 {
	for _ = range c.c {
		c.value += 1
	}

	return c.value
}

func (c *Counter) Close() {
	close(c.c)
}

func main() {
	numIter := 10000
	counted := Counter{c: make(chan int64, 100000), value: 0}

	wg := sync.WaitGroup{}
	wg.Add(numIter)
	for i := 0; i < numIter; i++ {
		go func() {
			counted.c <- 1
			wg.Done()
		}()
	}

	wg.Wait()
	counted.Close()
	fmt.Printf("counted=%d\n", counted.Count())
}
```

Run with `go run -race counter5.go`.

![output go run counter5.go](/images/go-run-race-counter5.png)

Another sweet output!

## Conclusion
Race condition is a type of bug that is hard to catch due to the nature of it only occurring on the specific condition and or timing. Luckily, Golang provides very handy race detectors to painlessly deal with it. Just add -race when running the program and it will tell us where things may go wrong. Golang also provides the user (Golang developer) with multiple ways to do synchronization. Up to the user to choose what approach is the most suitable for the case. In our case, (at least in my opinion) using sync/atomic is the most suitable.

Anyway, that is from me. Thank you for reading and see you later.