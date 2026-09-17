// Best-effort public signals from a university's Instagram / TikTok / YouTube pages.
// These platforms heavily restrict scraping, so we only read what an anonymous browser would see in the
// HTML head (og:title, og:description, follower counts embedded in meta tags) plus YouTube's public RSS.
// Anything we cannot fetch is reported as `available: false` — the AI layer then relies on web search.
import { cacheGet, cacheSet } from '../db/store.js';
import { config } from '../config.js';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml', 'Accept-Language': 'en-US,en;q=0.9,ru;q=0.8' },
    redirect: 'follow',
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

function meta(html, prop) {
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']*)["']`, 'i');
  const alt = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${prop}["']`, 'i');
  const m = re.exec(html) || alt.exec(html);
  return m ? decode(m[1]) : '';
}

function decode(s) {
  return String(s || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

/** Parses "1.2M Followers, 300 Following, 4,500 Posts" style descriptions into numbers. */
function parseCounts(text) {
  const out = {};
  const grab = (label) => {
    const m = new RegExp(`([\\d.,]+\\s*[KMkm]?)\\s*${label}`, 'i').exec(text || '');
    return m ? toNumber(m[1]) : null;
  };
  out.followers = grab('Followers') ?? grab('подписчик');
  out.posts = grab('Posts') ?? grab('публикац');
  out.likes = grab('Likes');
  return out;
}

function toNumber(s) {
  const clean = String(s).replace(/,/g, '').trim();
  const mult = /k$/i.test(clean) ? 1e3 : /m$/i.test(clean) ? 1e6 : 1;
  const n = parseFloat(clean.replace(/[KMkm]$/, ''));
  return Number.isNaN(n) ? null : Math.round(n * mult);
}

async function inspectInstagram(url) {
  try {
    const html = await fetchHtml(url);
    const description = meta(html, 'og:description') || meta(html, 'description');
    const title = meta(html, 'og:title');
    const counts = parseCounts(description);
    return { platform: 'instagram', url, available: Boolean(title || description), title, description: description.slice(0, 300), ...counts };
  } catch (err) {
    return { platform: 'instagram', url, available: false, reason: err.message };
  }
}

async function inspectTikTok(url) {
  try {
    const html = await fetchHtml(url);
    const description = meta(html, 'og:description') || meta(html, 'description');
    const title = meta(html, 'og:title');
    const counts = parseCounts(description);
    return { platform: 'tiktok', url, available: Boolean(title || description), title, description: description.slice(0, 300), ...counts };
  } catch (err) {
    return { platform: 'tiktok', url, available: false, reason: err.message };
  }
}

async function inspectYouTube(url) {
  try {
    const html = await fetchHtml(url);
    const title = meta(html, 'og:title');
    const description = meta(html, 'og:description');
    const channelId = /"channelId":"(UC[\w-]{20,})"/.exec(html)?.[1] || /channel_id=(UC[\w-]{20,})/.exec(html)?.[1];
    const subs = /"subscriberCountText":\{"simpleText":"([^"]+)"/.exec(html)?.[1] || /([\d.,]+\s*[KM]?) subscribers/i.exec(html)?.[1];
    let recentVideos = [];
    if (channelId) {
      try {
        const rss = await fetchHtml(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`);
        const entries = rss.match(/<entry>[\s\S]*?<\/entry>/g) || [];
        recentVideos = entries.slice(0, 8).map((e) => ({
          title: decode(/<title>([\s\S]*?)<\/title>/.exec(e)?.[1] || ''),
          published: /<published>([^<]+)<\/published>/.exec(e)?.[1] || '',
          link: /<link rel="alternate" href="([^"]+)"/.exec(e)?.[1] || '',
          views: Number(/<media:statistics views="(\d+)"/.exec(e)?.[1] || 0),
        }));
      } catch {
        /* RSS optional */
      }
    }
    return {
      platform: 'youtube',
      url,
      available: Boolean(title),
      title,
      description: (description || '').slice(0, 300),
      channelId: channelId || null,
      subscribers: subs ? toNumber(subs.replace(/subscribers/i, '')) : null,
      recentVideos,
    };
  } catch (err) {
    return { platform: 'youtube', url, available: false, reason: err.message };
  }
}

/**
 * Collect public signals for a university's social pages (parallel, cached 12h).
 */
export async function getSocialSignals(uni) {
  const key = `social:${uni.id}`;
  const cached = await cacheGet(key);
  if (cached) return { ...cached, cached: true };

  const links = uni.links || {};
  const jobs = [];
  if (links.instagram) jobs.push(inspectInstagram(links.instagram));
  if (links.tiktok) jobs.push(inspectTikTok(links.tiktok));
  if (links.youtube) jobs.push(inspectYouTube(links.youtube));
  const platforms = (await Promise.allSettled(jobs)).map((r) => (r.status === 'fulfilled' ? r.value : { available: false, reason: String(r.reason) }));

  const payload = {
    universityId: uni.id,
    links,
    platforms,
    fetchedAt: new Date().toISOString(),
    cached: false,
    note: 'Данные собраны из публичных мета-тегов страниц; платформы ограничивают доступ, поэтому часть полей может отсутствовать.',
  };
  cacheSet(key, payload, config.cache.socialMs).catch(() => {});
  return payload;
}
