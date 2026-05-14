export type WebsitePreset = {
  title: string
  description: string
  coverImage?: string
  category?: string
}

export type WebsitePresetMap = Record<string, WebsitePreset>

let cache: WebsitePresetMap | null = null
let inflight: Promise<WebsitePresetMap> | null = null

export async function loadWebsiteDescriptions(): Promise<WebsitePresetMap> {
  if (cache) return cache
  if (inflight) return inflight
  inflight = import("@/data/website-descriptions-1000plus.json")
    .then((mod) => {
      const data = (mod as { default?: WebsitePresetMap }).default ?? (mod as unknown as WebsitePresetMap)
      cache = data
      return data
    })
    .finally(() => {
      inflight = null
    })
  return inflight
}

export function getWebsitePresetsSync(): WebsitePresetMap | null {
  return cache
}

export function lookupPresetSync(domain: string): WebsitePreset | undefined {
  return cache ? cache[domain] : undefined
}
