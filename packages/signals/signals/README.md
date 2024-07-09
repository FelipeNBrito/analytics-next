#  @segment/analytics-signals 


### Settings / Configuration

See: [settings.ts](src/types/settings.ts)


## Signal Types

### Network



### Interaction
Interaction signals emit in response to a user interaction

### Instrumentation
Instrumentation signals emit whenever a Segment event is emitted.

### Navigation
Instrumentation signals emit whenever the URL changes.

> Note: you can also rely on the initial analytics.page() call, which you can access as an Instrumentation signal.

### Network
Network signals emit when an HTTP Request is made, or an HTTP Response is received. To emit a network signal, the network activity must have the following requirements:
- Initiated using the `fetch` API
- First party domain (e.g if on `foo.com`, then `foo.com/api/products`, but not `bar.com/api/products`)
- Contains the content-type: `application/json`

