import { renderHook } from '@testing-library/react'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import useSWR from 'swr'
import api from '../lib/api'

const server = setupServer(
  rest.get('/dashboard/metrics', (_req, res, ctx) =>
    res(ctx.json({ accuracy: 80, dailyReturnPct: 2, lifetimeReturnPct: 50 }))),
)

beforeAll(() => server.listen())
afterAll(() => server.close())
afterEach(() => server.resetHandlers())

const fetcher = (url: string) => api.get(url).then(r => r.data)

test('fetch metrics', async () => {
  const { result } = renderHook(() => useSWR('/dashboard/metrics', fetcher))
  await result.current.mutate()
  expect(result.current.data.accuracy).toBe(80)
})


