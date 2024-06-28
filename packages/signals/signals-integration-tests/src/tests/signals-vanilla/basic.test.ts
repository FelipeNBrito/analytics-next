import { test, expect } from '@playwright/test'
import type { SegmentEvent } from '@segment/analytics-next'
import { IndexPage } from './page-object'

const indexPage = new IndexPage()

test.beforeEach(async ({ page }) => {
  await indexPage.load(page)
})

test('instrumentation signals fire', async () => {
  await Promise.all([
    indexPage.makeAnalyticsPageCall(),
    indexPage.waitForSignalsApiFlush(),
  ])

  const signalReqJSON = indexPage.signalsApiReq.postDataJSON()

  const isoDateRegEx = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
  const instrumentationEvents = signalReqJSON.batch.filter(
    (el: SegmentEvent) => el.properties!.type === 'instrumentation'
  )
  expect(instrumentationEvents).toHaveLength(1)
  const ev = instrumentationEvents[0]
  expect(ev.event).toBe('Segment Signal Generated')
  expect(ev.type).toBe('track')
  const rawEvent = ev.properties.data.rawEvent
  expect(rawEvent).toMatchObject({
    type: 'page',
    anonymousId: expect.any(String),
    timestamp: expect.stringMatching(isoDateRegEx),
  })
})

test('interaction signals fire', async ({ page }) => {
  await Promise.all([
    page.click('button'),
    indexPage.waitForSignalsApiFlush(),
    indexPage.waitForTrackingApiFlush(),
  ])

  const analyticsReqJSON = indexPage.trackingApiReq.postDataJSON()

  expect(analyticsReqJSON).toMatchObject({
    writeKey: '<SOME_WRITE_KEY>',
    event: 'click [interaction]',
    properties: {
      eventType: 'click',
      target: {
        attributes: [
          {
            name: 'id',
            value: 'some-button',
          },
        ],
        classList: [],
        id: 'some-button',
        labels: [],
        name: '',
        nodeName: 'BUTTON',
        nodeType: 1,
        nodeValue: null,
        tagName: 'BUTTON',
        title: '',
        type: 'submit',
        value: '',
      },
    },
    context: {
      __eventOrigin: {
        type: 'Signal',
      },
    },
  })
})

test('navigation signals fire', async ({ page }) => {
  {
    // on page load, a navigation signal should be sent
    await indexPage.waitForSignalsApiFlush()
    const signalReqJSON = indexPage.signalsApiReq.postDataJSON()
    const navigationEvents = signalReqJSON.batch.filter(
      (el: SegmentEvent) => el.properties!.type === 'navigation'
    )
    expect(navigationEvents).toHaveLength(1)
    const ev = navigationEvents[0]
    expect(ev.properties).toMatchObject({
      type: 'navigation',
      data: {
        action: 'pageLoad',
        url: indexPage.url,
        path: expect.any(String),
        hash: '',
        search: '',
        title: '',
      },
    })
  }

  // navigate to a new hash
  {
    await page.evaluate(() => {
      window.location.hash = '#foo'
    })
    await indexPage.waitForSignalsApiFlush()
    const signalReqJSON = indexPage.signalsApiReq.postDataJSON()

    const navigationEvents = signalReqJSON.batch.filter(
      (el: SegmentEvent) => el.properties!.type === 'navigation'
    )
    expect(navigationEvents).toHaveLength(1)
    const ev = navigationEvents[0]
    expect(ev.properties).toMatchObject({
      index: expect.any(Number),
      type: 'navigation',
      data: {
        action: 'urlChange',
        url: indexPage.url + '#foo',
        prevUrl: indexPage.url,
        path: expect.any(String),
        hash: '#foo',
        search: '',
        title: '',
      },
    })
  }
})
